/*
*   Functions for health-check and status of application;
*   Developed in order to discover error or generally to find out
*   if the server is up & running and/or operating properly
*
*   @author: Devis
*/

// health check (public endpoint)
function hello(){
    return new Promise((resolve, reject) => {
       resolve('CogniAPI: up & running!');
    });
}

module.exports = {hello};