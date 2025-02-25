const EventEmitter = require('events').EventEmitter;
const { GlideClient } = require('@valkey/valkey-glide');
const Logger = require('log-ng');

const logger = new Logger('GlideSessionStore.js');

function GlideSessionStore(config){
	if(!new.target){
		return new GlideSessionStore(...arguments);
	}

	let client;
	const newStore = new EventEmitter();
	const TTL = 86400;

	Object.defineProperties(newStore, {
		all: {
			value: async function(cb){
				try {
					logger.info('Getting all sessions');
					const keys = await client.keys('sess:*');
					const sessions = await Promise.all(keys.map(key => client.get(key)));
					const parsedSessions = sessions.map(session => JSON.parse(session));
					cb(null, parsedSessions);
				} catch (err) {
					logger.error(err);
					cb(err);
				}
			}
		},
		clear: {
			value: async function(cb){
				try {
					logger.info('Clearing all sessions');
					const keys = await client.keys('sess:*');
					if(keys.length > 0){
						await client.del(keys);
					}
					cb(null);
				} catch (err) {
					logger.error(err);
					cb(err);
				}
			}
		},
		destroy: {
			value: async function(sid, cb){
				try{
					logger.info(`Destroying session ${sid}`);
					await client.del(`sess:${sid}`);
					cb(null);
				}catch (err){
					logger.error(err);
					cb(err);
				}
			}
		},
		get: {
			value: async function(sid, cb){
				try{
					logger.info(`Getting session ${sid}`);
					const data = await client.get(`sess:${sid}`);
					logger.debug(`Session data: ${data}`);
					const session = data ? JSON.parse(data) : null;
					cb(null, session);
				}catch(err){
					logger.error(err);
					cb(err);
				}
			}
		},
		init: {
			value: async function(newConfig, newClient){
				logger.info('Initializing session store');
				logger.debug(`New config: ${JSON.stringify(newConfig)}`);
				logger.debug(`New client: ${JSON.stringify(newClient)}`);
				client = newClient ?? await GlideClient.createClient(newConfig ?? config);
			}
		},
		length: {
			value: async function(cb){
				try{
					const keys = await client.keys('sess:*');
					cb(null, keys.length);
				}catch(err) {
					logger.error(err);
					cb(err);
				}
			}
		},
		set: {
			value: async function(sid, session, cb){
				try{
					logger.info(`Setting session ${sid}`);
					logger.debug(`Session data: ${JSON.stringify(session)}`);
					await client.set(`sess:${sid}`, JSON.stringify(session), {
						EX: TTL
					});
					cb(null);
				}catch(err) {
					logger.error(err);
					cb(err);
				}
			}
		},
		touch: {
			value: async function(sid, session, cb){
				try{
					await client.set(`sess:${sid}`, JSON.stringify(session), {
						EX: TTL
					});
					cb(null);
				}catch(err) {
					logger.error(err);
					cb(err);
				}
			}
		}
	});

	// Object.setPropertyOf(this, EventEmitter.prototype);
	return newStore;
}

module.exports = GlideSessionStore;
