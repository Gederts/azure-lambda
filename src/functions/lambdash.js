const { AzureFunction, HttpMethod } = require('@azure/functions');
const util = require('util');
const os = require('os');
const axios = require('axios');
const fs = require('fs');

const exec = util.promisify(require('child_process').exec);

module.exports = new AzureFunction('lambdash', {
    methods: [HttpMethod.Get, HttpMethod.Post],
    authLevel: 'anonymous',
    handler: async (context, request) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const command = request.query.get('command') || (await request.text());
        let data = '';

        if (!command) {
            context.res = {
                status: 400,
                body: "Please provide a command."
            };
            return;
        }

        if (command === 'memoryTest') {
            data = `CPU Usage: ${os.loadavg()} \nTotal Memory: ${os.totalmem()} \nFree Memory: ${os.freemem()}`;
        } else if (command === 'networkTest') {
            try {
                const startTime = Date.now();
                const response = await axios.get('https://google.com');
                const latency = Date.now() - startTime;
                data = `Network Latency: ${latency}`;
            } catch (error) {
                data = `Error making HTTP request: ${error.toString()}`;
            }
        } else if (command === 'inputOutput') {
            try {
                const startTimeWrite = Date.now();
                fs.writeFileSync('/tmp/test.txt', 'Hello, world!');
                const endTimeWrite = Date.now() - startTimeWrite;

                const startTimeRead = Date.now();
                const fileContent = fs.readFileSync('/tmp/test.txt', 'utf8');
                const endTimeRead = Date.now() - startTimeRead;

                data = `Write time: ${endTimeWrite}\nRead time: ${endTimeRead}\nContent written: ${fileContent}`;

                fs.unlinkSync('/tmp/test.txt');
            } catch (error) {
                data = `Error performing file operations: ${error.toString()}`;
            }
        } else {
            try {
                const { stdout, stderr } = await exec(command);
                data = stdout || stderr;
            } catch (error) {
                data = error.stdout || error.stderr || 'fail';
            }
        }

        context.res = {
            status: 200,
            body: data
        };
    }
});
