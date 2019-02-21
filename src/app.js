/*
*   App for processing and displaying answers coming from
*   pre-existing apis for vision & languages recognition
*/

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

//middlewares
app.use(express.static('static'));
app.use(bodyParser.json());

// health check (public endpoint)
app.get('/status', (req, res) => {
    res.status(200)
        .json({ msg: 'CogniAPI: up & running!' });
});

module.exports = app;