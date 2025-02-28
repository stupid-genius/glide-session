const EventEmitter = require('events').EventEmitter;
const { GlideClient } = require('@valkey/valkey-glide');
const { scanPerform } = require('./utils');
function GlideSessionStore(config) {
	if (!new.target) {
		return new GlideSessionStore(...arguments);
	}

	// This is just for type hinting, just to make it more fun to work
	/** @type {GlideClient} */
	let client;
	const newStore = new EventEmitter();

	Object.defineProperties(newStore, {
		all: {
			value: async function(cb){
				try {
					const session = (await scanPerform(client, 'sess:*', client.get)).map(data => JSON.parse(data));
					cb(null, session);
				} catch (err) {
					cb(err);
				}
			}
		},
		clear: {
			value: async function(cb){
				try {
					await scanPerform(client, 'sess:*', client.del);
					cb(null);
				} catch (err) {
					cb(err);
				}
			}
		},
		destroy: {
			value: async function(cb){
				try{
					await client.del([`sess:${sid}`]);
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
			value: async function (cb) {
				try {
					const keysSet = new Set();
					await scanPerform(client, 'sess:*', key => {
						keysSet.add(key);
					});
					const length = keysSet.size;
					delete keysSet;
					cb(null, length);
				} catch (err) {
					cb(err);
				}
			}
		},
		set: {
			value: async function (sid, session, cb) {
				try {
					await client.set(`sess:${sid}`, JSON.stringify(session), { expiry: this.ttl, conditionalSet: "onlyIfExists" });
					cb(null);
				}catch(err) {
					cb(err);
				}
			}
		},
		touch: {
			value: async function (sid, session, cb) {
				try {
					await client.set(`sess:${sid}`, JSON.stringify(session), { expiry: this.ttl, conditionalSet: "onlyIfExists" });
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
