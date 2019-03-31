/*  NAVIGATION FUNCTION (to simplify some processes) and to limit the number of page to build for the widget
* */

if(window.location.hostname == 'cogni-api.herokuapp.com')
    herokuTest = true;

function getNavForm(url, user){
    //SET GET REQUEST TO /manage
    let form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', url);

    let hiddenFieldUsername = document.createElement("input");
    //adding username field
    hiddenFieldUsername.setAttribute("type", "hidden");
    hiddenFieldUsername.setAttribute("name", 'username');
    hiddenFieldUsername.setAttribute("value", user);
    form.appendChild(hiddenFieldUsername);

    return form;
}

function loadManage(user){
    if(user && user != ''){

        let url = '';
        if(herokuTest)
            url = 'https://cogni-api.herokuapp.com/manage';
        else
            url = 'http://localhost:3000/manage';//[TODO change this to actual API call when not testing]

        //SET GET REQUEST TO /manage
        let form = getNavForm(url, user);
        document.body.appendChild(form);
        form.submit();//Perform GET request
    }else{
        alert('Specify a username please!');
    }

}

function loadUploadBox(user){
    if(user && user != ''){

        let url = '';
        if(herokuTest)
            url = 'https://cogni-api.herokuapp.com/upload';
        else
            url = 'http://localhost:3000/upload';//[TODO change this to actual API call when not testing]

        //SET GET REQUEST TO /manage
        let form = getNavForm(url, user);
        document.body.appendChild(form);
        form.submit();//Perform GET request
    }else{
        alert('Specify a username please!');
    }
}