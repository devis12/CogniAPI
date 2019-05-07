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

/*  Set to display none all the paper tabs related to an img*/
function displayNoneAllPaperTabs(imgName){
    let faceDetRecTab = document.getElementById('FaceDetRec_'+imgName);
    if(faceDetRecTab)
        faceDetRecTab.style.display = 'none';

    let facesTab = document.getElementById('Faces_'+imgName);
    if(facesTab)
        facesTab.style.display = 'none';

    let descrTab = document.getElementById('Description_'+imgName);
    if(descrTab)
        descrTab.style.display = 'none';

    let tagsTab = document.getElementById('Tags_'+imgName);
    if(tagsTab)
        tagsTab.style.display = 'none';

    let objectsTab = document.getElementById('Objects_'+imgName);
    if(objectsTab)
        objectsTab.style.display = 'none';

    let textsTab = document.getElementById('Text_'+imgName);
    if(textsTab)
        textsTab.style.display = 'none';

    let landmarksTab = document.getElementById('Landmarks_'+imgName);
    if(landmarksTab)
        landmarksTab.style.display = 'none';

    let safetyTab = document.getElementById('SafetyAnn_'+imgName);
    if(safetyTab)
        safetyTab.style.display = 'none';

    let colorsTab = document.getElementById('Colors_'+imgName);
    if(colorsTab)
        colorsTab.style.display = 'none';

    let webTab = document.getElementById('Web_'+imgName);
    if(webTab)
        webTab.style.display = 'none';

    document.getElementById('img_ann_box_'+imgName).classList.remove('alert-info');
    document.getElementById('img_ann_box_'+imgName).classList.remove('alert-warning');
    document.getElementById('img_ann_box_'+imgName).classList.remove('alert-success');

}

/*  Decide what paper tab of the img widget to display*/
function changePaperTab(clickedTab, paperTab, imgName){
    displayNoneAllPaperTabs(imgName);
    changeTab(clickedTab,document.getElementById('selector_'+imgName), imgName);

    if(paperTab == 'FaceDetRec_' || paperTab == 'Faces_' || paperTab == 'Description_')
        document.getElementById('img_ann_box_'+imgName).classList.add('alert-info');
    else if(paperTab == 'Tags_' || paperTab == 'Objects_' || paperTab == 'SafetyAnn_' || paperTab == 'Colors_')
        document.getElementById('img_ann_box_'+imgName).classList.add('alert-success');
    else if(paperTab == 'Text_' || paperTab == 'Landmarks_' || paperTab == 'Web_')
        document.getElementById('img_ann_box_'+imgName).classList.add('alert-warning');

    document.getElementById(paperTab + imgName).style.display = 'inline';
}

var tabs = $('.tabs');
var selector = $('.tabs').find('a').length;
//var selector = $(".tabs").find(".selector");
var activeItem = tabs.find('.active');
var activeWidth = activeItem.innerWidth();
$(".selector").css({
    "left": activeItem.position.left + "px",
    "width": activeWidth + "px"
});

function changeTab(clickedTab, selector, imgName){
    let tabsA = $('.tabs a');
    for(let tab of tabsA){
        if($(tab).attr("id").indexOf(imgName) != -1)//deleting active class on all tabs a of the same img widget
            $(tab).removeClass("active");
    }
    $(clickedTab).addClass('active');
    var activeWidth = $(clickedTab).innerWidth();
    var itemPos = $(clickedTab).position();
    $(selector).css({
        "left":itemPos.left + "px",
        "width": activeWidth + "px"
    })
}