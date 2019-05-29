const fetch = require('node-fetch');

let server, serverInstance, app;

beforeAll(() => {
    server = require('../server');
    serverInstance = server.serverInstance;
    app = server.app;
});

afterAll(() => {
    serverInstance.close();
});

describe('Check if server is up && app is defined', async () => {

    test('serverInstance should be defined', () => {
        expect(serverInstance).toBeDefined();
    });

    test('app should be defined', () => {
        expect(app).toBeDefined();
    });

    test('GET /status should return 200 + simple msg', async () => {
        expect.assertions(2);
        let url = 'http://localhost:' + serverInstance.address().port + '/status';
        return fetch(url)
            .then(r => {
                expect(r.status).toBe(200);
                return r.json().then(data => {
                    expect(data.responseStatus.msg).toBe('CogniAPI: up & running!');
                });
            });

    });

    test('GET / should return 200', async () => {
        expect.assertions(1);
        let url = 'http://localhost:' + serverInstance.address().port + '/';
        return fetch(url)
            .then(r => {
                expect(r.status).toBe(200);
            });

    });

});