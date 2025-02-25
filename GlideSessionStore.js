const EventEmitter = require('events').EventEmitter;
const { GlideClient } = require('@valkey/valkey-glide');

function GlideSessionStore(config){
	if(!new.target){
		return new GlideSessionStore(...arguments);
	}

	let client;
	const newStore = new EventEmitter();

	Object.defineProperties(newStore, {
		all: {
			value: async function(cb){
				try {
					const keys = await client.keys('sess:*');
					const sessions = await Promise.all(keys.map(key => client.get(key)));
					const parsedSessions = sessions.map(session => JSON.parse(session));//.filter(Boolean);
					cb(null, parsedSessions);
				} catch (err) {
					cb(err);
				}
			}
		},
		clear: {
			value: async function(cb){
				try {
					const keys = await client.keys('sess:*');
					if (keys.length) await client.del(keys);
					cb(null);
				} catch (err) {
					cb(err);
				}
			}
		},
		destroy: {
			value: async function(cb){
				try{
					await client.del(`sess:${sid}`);
					cb(null);
				}catch (err){
					cb(err);
				}
			}
		},
		get: {
			value: async function(sid, cb){
				try{
					const data = await client.get(`sess:${sid}`);
					const session = data ? JSON.parse(data) : null;
					cb(null, session);
				}catch(err){
					cb(err);
				}
			}
		},
		init: {
			value: async function(newConfig, newClient){
				client = newClient ?? await GlideClient.createClient(newConfig ?? config);
			}
		},
		length: {
			value: async function(cb){
				try{
					const keys = await client.keys('sess:*');
					cb(null, keys.length);
				}catch(err) {
					cb(err);
				}
			}
		},
		set: {
			value: async function(cb){
				try{
					await client.set(`sess:${sid}`, JSON.stringify(session), {
						EX: this.ttl
					});
					cb(null);
				}catch(err) {
					cb(err);
				}
			}
		},
		touch: {
			value: async function(cb){
				try{
					await client.set(`sess:${sid}`, JSON.stringify(session), {
						EX: this.ttl
					});
					cb(null);
				}catch(err) {
					cb(err);
				}
			}
		}
	});

	// Object.setPropertyOf(this, EventEmitter.prototype);
	return newStore;
}

module.exports = GlideSessionStore;
