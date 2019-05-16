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
app.use(bodyParser.json({limit: '50mb'})); // read json (this will help to avoid strange errors while navigating through the widget)

//middlewares (just for the widget)
app.use(bodyParser.urlencoded({ extended: true , limit: '50mb'})); // read form enctype data
app.set('view engine', 'ejs'); // set the engine render ejs for dynamic building of html pages with ejs tags


//widget router (simple GUI renderer in order to test the API)
const widgetRouter = require('./v1/routes/widget_router');
app.use('/', widgetRouter);

//set up routers for v1 app
const statusRouter = require('./v1/routes/status'); // just to test health of the endpoint
const azureRouter = require('./v1/routes/azure'); // to test azure computer vision & azure face apis
const gCloudRouter = require('./v1/routes/gcloud');// to test google cloud vision apis
const combineRouter = require('./v1/routes/combine');// to test combine apis
const combineBatchRouter = require('./v1/routes/combine_batch');// to test combine apis

app.use('/v1', statusRouter);
app.use('/v1', azureRouter);
app.use('/v1', gCloudRouter);
app.use('/v1', combineRouter);
app.use('/v1', combineBatchRouter);

//set up routers for latest version app
app.use('/', statusRouter);
app.use('/', azureRouter);
app.use('/', gCloudRouter);
app.use('/', combineRouter);
app.use('/', combineBatchRouter);

module.exports = app;