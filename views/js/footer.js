$( document ).ready(function() {

    if (window.innerHeight > document.body.clientHeight)
        $('.footer').css('position', 'fixed');
    else
        $('.footer').css('position', 'relative');

    $('.footer').css('display', 'block');
});

$( window ).resize(function() {
    if(window.innerHeight > document.body.clientHeight)
        $('.footer').css('position', 'fixed');
    else
        $('.footer').css('position', 'relative');
});