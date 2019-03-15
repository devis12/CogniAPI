
/*  Call API-Services in order to get json of analysed images
* */
export function annotate(urlImages){
    let form_annotate = new FormData();//contains just url of the images
    form_annotate.append('urlImages', urlImages);

    $.ajax({
        url: 'localhost:3000/annotate', // node server
        dataType: 'json',
        cache: false,
        contentType: false,
        processData: false,
        crossDomain: true,
        data: form_annotate,
        type: 'post',
        success: function (node_script_response) {

        },
        error: function (node_script_response) {

        }
    });
}