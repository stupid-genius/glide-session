const { expect } = require('chai');
const Logger = require('log-ng');
const path = require('path');
const GlideSessionStore = require('./GlideSessionStore.js');

const logger = new Logger(path.basename(__filename));

const mockClient = {
	store: {},
	keys: async (pattern) => Object.keys(mockClient.store).filter(key => key.startsWith(pattern.replace('*', ''))),
	get: async (key) => mockClient.store[key] || null,
	set: async (key, value) => { mockClient.store[key] = value; },
	del: async (keys) => {
		(Array.isArray(keys) ? keys : [keys]).forEach(key => delete mockClient.store[key]);
	}
};

describe('GlideSessionStore', function(){
	before(function(){
		Logger.setLogLevel('debug');
	});
	beforeEach(async function(){
		sessionStore = GlideSessionStore({}); // Create store
		await sessionStore.init({}, mockClient); // Initialize with mock client
	});

	it('should set and get a session', function(done){
		const sid = 'testSession';
		const sessionData = { user: 'testUser' };

		sessionStore.set(sid, sessionData, async (err) => {
			expect(err).to.be.null;
			await sessionStore.get(sid, (err, session) => {
				expect(err).to.be.null;
				expect(session).to.deep.equal(sessionData);
				done();
			});
		});
	});

	it('should destroy a session', function(done){
		const sid = 'testSession';
		sessionStore.set(sid, { user: 'testUser' }, (err) => {
			expect(err).to.be.null;
			sessionStore.destroy(sid, (err) => {
				expect(err).to.be.null;
				sessionStore.get(sid, (err, session) => {
					expect(err).to.be.null;
					expect(session).to.be.null;
					done();
				});
			});
		});
	});

	it('should return all sessions', function(done){
		sessionStore.set('sess1', { user: 'user1' }, () => {});
		sessionStore.set('sess2', { user: 'user2' }, () => {});
		sessionStore.all((err, sessions) => {
			expect(err).to.be.null;
			expect(sessions).to.have.length(2);
			done();
		});
	});

	it('should clear all sessions', function(done){
		sessionStore.set('sess1', { user: 'user1' }, () => {});
		sessionStore.set('sess2', { user: 'user2' }, () => {});
		sessionStore.clear((err) => {
			expect(err).to.be.null;
			sessionStore.all((err, sessions) => {
				expect(err).to.be.null;
				expect(sessions).to.be.empty;
				done();
			});
		});
	});

	it('should return the correct session count', function(done){
		sessionStore.set('sess1', { user: 'user1' }, () => {});
		sessionStore.set('sess2', { user: 'user2' }, () => {});
		sessionStore.length((err, count) => {
			expect(err).to.be.null;
			expect(count).to.equal(2);
			done();
		});
	});

	it('should update session expiration on touch', function(done){
		const sid = 'testSession';
		sessionStore.set(sid, { user: 'testUser' }, () => {
			sessionStore.touch(sid, { user: 'testUser', updated: true }, (err) => {
				expect(err).to.be.null;
				sessionStore.get(sid, (err, session) => {
					expect(err).to.be.null;
					expect(session).to.have.property('updated', true);
					done();
				});
			});
		});
	});
});

