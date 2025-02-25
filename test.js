const Karma = require('karma');
const Logger = require('log-ng');
const Mocha = require('mocha');
const path = require('path');

Logger({logLevel: 'info', logFile: 'karmaTest.log'});
const logger = new Logger(path.basename(__filename));

const app = require('./testServer.js');
const mocha = new Mocha();

function runServerTests(specPath){
	logger.info('Starting Mocha tests');
	mocha.addFile(specPath);
	mocha.run((err) => {
		logger.warn(err);
	});
}

function runBrowserTests(configPath){
	return new Promise((res, rej) => {
		logger.info('Starting Karma tests');
		const config = Karma.config.parseConfig(configPath, {});
		const server = new Karma.Server(config, (exitCode) => {
			if(exitCode === 0){
				logger.info('Karma tests completed');
				res();
			}else{
				rej(new Error(`Karma tests failed with exit code ${exitCode}`));
			}
		});

		server.on('browser_log', (browser, log, type) => {
			logger.info(`Browser log [${type}]: ${log} (${browser})`);
		});

		server.on('browser_error', (browser, error) => {
			logger.error(`Error in browser: ${error} (${browser})`);
		});

		server.on('run_complete', (browser) => {
			logger.debug(`Run complete: ${JSON.stringify(browser, null, 2)}`);
		});

		server.start();
	});
};

const testServer = app.listen(3000, 'localhost', async () => {
	try{
		logger.info('Test server started');

		runServerTests('./server.spec.js');

		await runBrowserTests(__dirname + '/karma.server.conf.js');

		logger.info('All tests completed');
	}catch(error){
		logger.error('Error running tests:', error);
	}finally{
		testServer.close(() => {
			logger.info('Test server closed');
			process.exit();
		});
	}
});
