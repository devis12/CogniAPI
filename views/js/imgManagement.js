if(window.location.hostname == 'cogni-api.herokuapp.com')
    herokuTest = true;

/*  Function will allow user to see the tags annotation for an image
    already loaded on the storage
* */
function annotateSingleImg(username, imgUrl, imgAnnb64, cache=true){

    //SET POST REQUEST IN ORDER TO SHOW THE imgAnn
    let form = document.createElement('form');
    form.setAttribute('method', 'POST');
    if(herokuTest)
        form.setAttribute('action', 'https://cogni-api.herokuapp.com/manage/singleImg');
    else
        form.setAttribute('action', 'http://localhost:3000/manage/singleImg');//[TODO change this to actual API call when not testing]

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
    hiddenField.setAttribute("value", '1');
    form.appendChild(hiddenField);

    //adding img_url
    hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", 'url'+0);
    hiddenField.setAttribute("value", imgUrl);
    form.appendChild(hiddenField);

    //adding img_annotation
    hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", 'imgAnnb64');
    hiddenField.setAttribute("value", imgAnnb64);
    form.appendChild(hiddenField);

    //adding cache setting
    hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", 'cache');
    hiddenField.setAttribute("value", ''+cache);
    form.appendChild(hiddenField);

    document.body.appendChild(form);
    form.submit();//Perform POST request
}

/*  Function will allow user to explicitly delete an image
    on the storage
* */
function deleteImg(user, imgUrl){
    let imgName = imgUrl.substr(imgUrl.lastIndexOf('/') + 1);
    let form_delete = new FormData();
    form_delete.append('username', user);
    form_delete.append('img_url', imgUrl);
    form_delete.append('img_name', imgName);
    $.ajax({
        url: 'https://cogniapi.altervista.org/deleteImg.php', // point to server-side PHP script
        dataType: 'text',  // what to expect back from the PHP script, if anything
        cache: false,
        contentType: false,
        processData: false,
        crossDomain: true,
        data: form_delete,
        type: 'post',
        success: function (php_script_response) {
            location.reload();
        },
        error: function (php_script_response) {
            console.err(php_script_response);
            alert('Sorry! We\'ve encountered some unexpected errors');
        }
    });
}

/*  Function which will have just aesthetic features in order to make
    Annotation buttons distinguishable (black the ones which will perform
    a new analysis, green the other which will fetch the data from cache)
* */
function toggleCacheAnnBtn(checked){
    if(!checked){
        $('.btn-cached').removeClass('btn-dark');
        $('.btn-cached').addClass('btn-success');
    }else{
        $('.btn-cached').removeClass('btn-success');
        $('.btn-cached').addClass('btn-dark');
    }
}