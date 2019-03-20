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
app.use(express.static('views'));// folder in which to put the static files (html, css, js client)
app.use(bodyParser.json()); // read json
//middlewares (just for the widget)
app.use(bodyParser.urlencoded({ extended: true })); // read form enctype data
app.set('view engine', 'ejs'); // set the engine render ejs for dynamic building of html pages with ejs tags


//widget router (simple GUI renderer in order to test the API)
const widgetRouter = require('./v1/routes/widget_router');
app.use('/', widgetRouter);

//set up routers for v1 app
const statusRouter = require('./v1/routes/status'); // just to test health of the endpoint
const azureTestRouter = require('./v1/routes/azure'); // to test azure computer vision & azure face apis
const gCloudTestRouter = require('./v1/routes/gcloud');// to test google cloud vision apis
const combineRouter = require('./v1/routes/combine');// to test combine apis
app.use('/v1', statusRouter);
app.use('/v1', azureTestRouter);
app.use('/v1', gCloudTestRouter);
app.use('/v1', combineRouter);

//set up routers for latest version app
app.use('/', statusRouter);
app.use('/', azureTestRouter);
app.use('/', gCloudTestRouter);
app.use('/', combineRouter);

module.exports = app;