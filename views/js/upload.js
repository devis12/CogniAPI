/*  UPLOAD IMAGES & PERFORM POST REQUEST TO THE EXPRESS SERVER IN ORDER TO MAKE HIM CALL THE COGNITIVE SERVICES AND
    (LATER) COMBINE THE RESULTS
* */

if(window.location.hostname == 'cogni-api.herokuapp.com')
    herokuTest = true;

/*  Upload wrapper function */
function upload(pwd, username, asyncUp){
    //check validity of parameter
    if(!checkUploadParams(pwd))
        return;

    $('#progressBar').html('<progress></progress>');

    //request auth token with inserted pwd
    uploadAuth(pwd)
        .then(token => {
            //perform file(s) uploading
            uploadFiles(token, username)

                .then( urlImages => {

                    //generated url for the uploaded images
                    urlImages = JSON.parse(urlImages);
                    postAnalysis(urlImages, username, asyncUp);//submit them through a post request directed to the express server
                })

                .catch( error => {
                    console.log(error);
                    $('#progressBar').html('<p class=\'text-danger text-center\'>Uploading failed!</p>');
                });

        })

        .catch( error => {
            $('#progressBar').html('<p class=\'text-danger text-center\'>Authentication failed!</p>');
        });


}

/*  In order to be a valid upload request the pwd has to b a string of at least a char
*   and #files has to be between 1 and 16 included*/
function checkUploadParams(pwd){

    //hide pwdAlert just in case
    $('#pwdAlert').removeClass('visible');
    $('#pwdAlert').addClass('invisible');

    if($('#groupImages').prop('files').length < 1){
        alert('You didn\'t select any file');
        return false;

    }else if($('#groupImages').prop('files').length > 16){
        alert('Sorry! You can\'t select more than 16 images');
        return false;

    }else if(pwd == null || pwd == ''){//password is necessary in order to perform the upload
        $('#pwdAlert').removeClass('invisible');
        $('#pwdAlert').addClass('visible');
        return false;

    }else
        return true;
}

/*  Perform auth with given pwd and get the token necessary in order to perform the actual files upload */
function uploadAuth(pwd){
    return new Promise((resolve, reject) => {
        let form_pwd = new FormData();
        form_pwd.append('pwd', pwd);
        $.ajax({
            url: 'https://cogniapi.altervista.org/uploadAuth.php', // point to server-side PHP script
            dataType: 'text',  // what to expect back from the PHP script, if anything
            cache: false,
            contentType: false,
            processData: false,
            crossDomain: true,
            data: form_pwd,
            type: 'post',
            success: function (php_script_response) {
                console.log('token: ' + php_script_response);
                resolve(php_script_response);//otp token to use for actual files upload is in the response
            },
            error: function (php_script_response) {
                reject(php_script_response);
            }
        });
    });

}

/*  Perform files upload after token has been generated */
function uploadFiles(token, username){
    return new Promise((resolve, reject) => {
        let file_data = [];

        console.log(file_data);
        let form_data = new FormData();

        //add file to the form one by one
        for(let i=0; i<$('#groupImages').prop('files').length; i++){
            //append one file per time with name 'file' + i ('file0', 'file1', 'file2',..)
            form_data.append('file'+i, $('#groupImages').prop('files')[i]);
        }

        //set username in case of authenticated user (silly not protected form of auth, given the context)
        if(username != null && username != ''){
            form_data.append("username", username);
        }

        //otp token to use for files upload
        form_data.append('secret', token);

        $.ajax({
            url: 'https://cogniapi.altervista.org/upload.php', // point to server-side PHP script
            dataType: 'text',  // what to expect back from the PHP script, if anything
            cache: false,
            contentType: false,
            processData: false,
            crossDomain: true,
            data: form_data,
            type: 'post',
            success: function(php_script_response){
                console.log(php_script_response);
                resolve(php_script_response);// array of generated url for the uploaded images
            },
            error: function (php_script_response) {
                reject(php_script_response);
            }
        });
    });

}

/*  JS Client side function which will perform a post request with the generated urls (for the uploaded imgs),
*   so the express server can contact the cognitive service apis and combine the result via the implemented processing*/
function postAnalysis(urlImages, username, asyncUp){
    //SET POST REQUEST WITH GENERATED URL BY A FORM
    let form = document.createElement('form');
    let urlReq = '';
    form.setAttribute('method', 'POST');
    if(herokuTest)
        urlReq = 'https://cogni-api.herokuapp.com/';
    else
        urlReq = 'http://localhost:3000/';

    if(asyncUp)//in order to perform async analysis to check in later
        urlReq += 'uploadAsync/images';
    else
        urlReq += 'upload/images';

    form.setAttribute('action', urlReq);

    //set username in case of authenticated user (silly not protected form of auth, given the context)
    if(username != null && username != ''){
        let hiddenFieldUsername = document.createElement("input");
        //adding username field
        hiddenFieldUsername.setAttribute("type", "hidden");
        hiddenFieldUsername.setAttribute("name", 'username');
        hiddenFieldUsername.setAttribute("value", username);
        form.appendChild(hiddenFieldUsername);
    }

    //length of image urls that has to be analyzed
    let hiddenField = document.createElement("input");
    //length of array
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", 'urlNum');
    hiddenField.setAttribute("value", urlImages.length);
    form.appendChild(hiddenField);

    //file passed one by one
    for(let i =0 ; i < urlImages.length; i++){
        hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", 'url'+i);
        hiddenField.setAttribute("value", urlImages[i]);
        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();//Perform POST request
}

/*  Handle input file label in order to get the user a basic feedback*/
$('#groupImages').on('change',function(){
    if ($(this).prop('files').length == 0)//nothing selected -> set label to default value
        $(this).next('.custom-file-label').html('Choose file');

    else if($(this).prop('files').length == 1) {// if there is just a file selected show its name
        //get the file name
        let fileName = $(this).val();
        if(fileName.indexOf('/') != -1)
            fileName = fileName.substr(fileName.lastIndexOf('/') + 1);
        else
            fileName = fileName.substr(fileName.lastIndexOf('\\') + 1);
        $(this).next('.custom-file-label').html(fileName);//replace the "Choose a file" label

    }else //otherwise show the number of selected files
        $(this).next('.custom-file-label').html($(this).prop('files').length + ' files selected');
});