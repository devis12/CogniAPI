/*
*   This file will contain urls, info & global parameters
*
*   @author: Devis
*/

/*  GENERIC BASE URI    */

//backend storage to save userData, images, json cached
const backendStorage = 'https://cogniapi.altervista.org/';

//uri base in order to call azure computer vision rest apis
//const uriAzureCompVision = 'https://westeurope.api.cognitive.microsoft.com/vision/v2.0';
const uriAzureCompVision = 'https://westcentralus.api.cognitive.microsoft.com/vision/v2.0';
//uri base in order to call azure face rest apis
//const uriAzureFace = 'https://westeurope.api.cognitive.microsoft.com/face/v1.0';
const uriAzureFace = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0';



/*  GLOBAL VARIABLES    */
// These are independent of the environment
// You're going to change them, when you plan to upgrade you Azure & GCloud subscription

//time between different async image analysis in milli-second (in batch image annotations)
const asyncAnalysisInterval = 75000; //75s

// following boolean will indicate if the user data stored and related to a face will be saved on azure
// or on our personal storage
const userDataStoredOnAzure = false;

module.exports = {
    backendStorage, uriAzureCompVision, uriAzureFace,
    asyncAnalysisInterval, userDataStoredOnAzure
};