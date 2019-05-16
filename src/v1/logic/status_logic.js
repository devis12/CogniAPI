/*
*   Functions for health-check and status of application;
*   Developed in order to discover if the server is up & running
*   and also to test if the dir structure could be considered appropriate
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