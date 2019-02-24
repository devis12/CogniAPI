/*
*   App for processing and displaying answers coming from
*   pre-existing apis for vision & languages recognition
*
*   @author: Devis
*/

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

//middlewares
app.use(express.static('static'));
app.use(bodyParser.json());


//set up routers for v1 app
const statusRouter = require('./v1/routes/status');
const azureTestRouter = require('./v1/routes/azure');
app.use('/v1', statusRouter);
app.use('/v1', azureTestRouter);

//set up routers for latest version app
app.use('/', statusRouter);
app.use('/', azureTestRouter);

module.exports = app;