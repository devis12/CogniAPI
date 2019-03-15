/*  Upload wrapper function */
function upload(pwd){

    //check validity of parameter
    if(!checkUploadParams(pwd))
        return;

    $('#progressBar').html('<progress></progress>');

    //request auth token with inserted pwd
    uploadAuth(pwd)
        .then(token => {
            //perform file(s) uploading
            uploadFiles(token)
                .then( urlImages => {

                    urlImages = JSON.parse(urlImages);
                    //SET POST REQUEST WITH GENERATED URI BY A FORM
                    let form = document.createElement('form');
                    form.setAttribute('method', 'POST');
                    form.setAttribute('action', 'http://localhost:3000');//[TODO change this to actual API call when not testing]

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
                    form.submit();

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
    }else if(pwd == null || pwd == ''){
        $('#pwdAlert').removeClass('invisible');
        $('#pwdAlert').addClass('visible');
        return false;
    }else
        return true;
}

/*  Perform auth with given pwd and get the token necessary in order to perform the upload */
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
                resolve(php_script_response);
            },
            error: function (php_script_response) {
                reject(php_script_response);
            }
        });
    });

}

/*  Perform files upload after token has been generated */
function uploadFiles(token){
    return new Promise((resolve, reject) => {
        let file_data = [];

        console.log(file_data);
        let form_data = new FormData();

        //add file to the form one by one
        for(let i=0; i<$('#groupImages').prop('files').length; i++){
            form_data.append('file'+i, $('#groupImages').prop('files')[i]);
        }

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
                resolve(php_script_response);// array of generated url for the uploaded images
            },
            error: function (php_script_response) {
                reject(php_script_response);
            }
        });
    });

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