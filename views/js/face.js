/*  FACE RECOGNITION CLIENT SIDE SCRIPTS IN ORDER TO CALL SOME APIs WHICH WILL PERSISTENTLY STORE &
    RECOGNIZE SOME USER DATA RELATED TO SIMILAR FACES
* */

//variable in order to decide to which url perform the request during development (herokuapp url or localhost)
let herokuTestF = false;
if(window.location.hostname == 'cogni-api.herokuapp.com')
    herokuTestF = true;

/*  Ask Azure Face to create a persisted id and related user data (possibly name+surname) linked to
*   a particular face detected by the service in an image.
*   The persistence face id will be generated & insert in a facelist linked to the loggeduser*/
function addToFaceGroup(imageUrl, target, userData, loggedUser){
    /*  [Debugging purpose]

    console.log("CLIENT SIDE - ADD FACE NAME");
    console.log("imageUrl: " + imageUrl);
    console.log("target: " + target);
    console.log("userData: " + userData);
    console.log("loggedUser: " + loggedUser);*/

    let urlFG = null;

    if(herokuTestF)
        urlFG = 'https://cogni-api.herokuapp.com' + '/azure/addFace/' + loggedUser;
    else
        urlFG = 'http://localhost:3000' + '/azure/addFace/' + loggedUser;//[TODO change this to actual API call when not testing]

    let bodyParams = {
       //image url
       'imageUrl': imageUrl,

       //specify left,top,width,height of the selected face in order to persist her data
       'target': target,

       //possibly name & surname related to the detected face or a unique id, which will consent to extract more data from that person (stored in a local/private db)
       'userData': userData
    };

    $.ajax({
        url: urlFG,
        dataType: 'text',  // what to expect back from the PHP script, if anything
        cache: false,
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(bodyParams),
        type: 'post',
        success: function (express_script_response) {
            console.log(express_script_response);
            alert('Operation performed successfully');
        },
        error: function (express_script_response) {
            console.log(express_script_response);
        }
    });
}

/*  Ask Azure Face to train the ml service by using the dataset (facelist with generated persistence ids) associated with the logged user*/
function train(loggedUser){

    let urlFG = null;

    if(herokuTestF)
        urlFG = 'https://cogni-api.herokuapp.com' + '/azure/trainFace/' + loggedUser;
    else
        urlFG = 'http://localhost:3000' + '/azure/trainFace/' + loggedUser;//[TODO change this to actual API call when not testing]


    $.ajax({
        url: urlFG,
        dataType: 'text',  // what to expect back from the PHP script, if anything
        cache: false,
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify({}),
        type: 'post',
        success: function (express_script_response) {
            console.log(express_script_response);
            alert('Operation performed successfully'); //Training HAS STARTED (until now there is no polling to see if finished)
        },
        error: function (express_script_response) {
            console.log(express_script_response);
        }
    });
}