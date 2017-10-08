var global_configdata = null;

function load_dynamic_content()
{
    var config_request = new XMLHttpRequest();
    config_request.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            process_user_configuration(JSON.parse(this.responseText));
        }
    };
    config_request.open("GET", "user.json", true);
    config_request.send();
}

function process_user_configuration(configdata)
{
    global_configdata = configdata;
    document.getElementById("timeprompt").textContent = configdata.boxes.timebox.prompt;
    document.getElementById("ipprompt").textContent = configdata.boxes.ipbox.prompt;
    document.getElementById("torprompt").textContent = configdata.boxes.torbox.prompt;
    document.getElementById("weatherprompt").textContent = configdata.boxes.weatherbox.prompt;
    document.getElementById("linkprompt").textContent = configdata.boxes.linkbox.prompt;
    document.getElementById("searchprompt").textContent = configdata.boxes.searchbox.prompt;

    populate_timebox();
    populate_torbox(configdata.boxes.torbox);
    populate_linkbox(configdata.boxes.linkbox);
    populate_searchbox(configdata.boxes.searchbox);
    window.setInterval(populate_timebox, 1000);
}

function populate_timebox()
{
    var date = new Date();
    date.setTime(date.getTime() + (global_configdata.boxes.timebox.timezone * 3600000));
    document.getElementById("timetext").textContent = format_date_for_timebox(date);
}

function format_date_for_timebox(date)
{
    return date.getFullYear() + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + ("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

function populate_ipbox(ipdata)
{
    document.getElementById("iptext").textContent = ipdata.ip;
}

function populate_torbox(tordata)
{
    if(typeof window._isTor != 'undefined' && window._isTor == true)
    {
        document.getElementById("tortext").textContent = tordata.enabled;
    }
    else
    {
        document.getElementById("tortext").textContent = tordata.disabled;
    }
}

function populate_weatherbox(weatherdata)
{
    document.getElementById("weathertext").textContent = weatherdata.query.results.channel.item.condition.text + ", " + weatherdata.query.results.channel.item.condition.temp + " degrees";
}

function populate_linkbox(linkdata)
{
    for(var group = 0; group < linkdata.groups.length; group++)
    {
        var tr = document.createElement("tr");
        var header = document.createElement("td");
        header.appendChild(document.createTextNode(linkdata.groups[group].group + " >> "));
        tr.appendChild(header);
        for(var link = 0; link < linkdata.groups[group].links.length; link++)
        {
            var td = document.createElement("td");
            var linktext = document.createElement("a");
            linktext.setAttribute("href", linkdata.groups[group].links[link].url);
            linktext.appendChild(document.createTextNode(linkdata.groups[group].links[link].title));
            td.appendChild(linktext);
            tr.appendChild(td);
        }
        document.getElementById("linktable").getElementsByTagName("tbody")[0].appendChild(tr);
    }
}

function populate_searchbox(searchdata)
{
    var form = document.createElement("form");
    form.setAttribute("id", "searchtext");
    form.setAttribute("action", searchdata.action);
    var input = document.createElement("input");
    input.setAttribute("id", "searchinput");
    input.setAttribute("name", searchdata.param);
    input.setAttribute("autofocus", "");
    form.appendChild(input);
    document.getElementById("searchtext").replaceWith(form);
    document.getElementById("searchinput").focus();
}
