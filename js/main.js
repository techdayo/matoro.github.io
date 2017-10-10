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
    document.getElementById("timetext").textContent = configdata.placeholder;

    document.getElementById("ipprompt").textContent = configdata.boxes.ipbox.prompt;
    document.getElementById("iptext").textContent = configdata.placeholder;

    document.getElementById("torprompt").textContent = configdata.boxes.torbox.prompt;
    document.getElementById("tortext").textContent = configdata.placeholder;

    document.getElementById("weatherprompt").textContent = configdata.boxes.weatherbox.prompt;
    document.getElementById("weathertext").textContent = configdata.placeholder;

    document.getElementById("linkprompt").textContent = configdata.boxes.linkbox.prompt;

    document.getElementById("searchprompt").textContent = configdata.boxes.searchbox.prompt;
    document.getElementById("searchtext").textContent = configdata.placeholder;

    populate_timebox();
    populate_linkbox(configdata.boxes.linkbox);
    populate_searchbox(configdata.boxes.searchbox);
    window.setInterval(populate_timebox, 1000);

    load_remote_services();
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
    if(window._isTor == true)
    {
        document.getElementById("tortext").textContent = tordata.enabled;
    }
    else if(window._isTor == false)
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

//The following function is used to load remote services not hosted on the same domain.
//To disable a particular remote service, simply comment out the block of lines which dynamically load its script.
//The text on the page will continue to display the contents of the "placeholder" string from your user.json file.
function load_remote_services()
{
    //The remote service used for IP data is ipify.
    //It is MIT-licensed, source code can be found at https://github.com/rdegges/ipify-api
    var remote_service_ip = document.createElement("script");
    remote_service_ip.setAttribute("src", "https://api.ipify.org/?format=jsonp&callback=populate_ipbox");
    document.head.appendChild(remote_service_ip);

    //The remote service used for tor checking is documented at https://stackoverflow.com/a/33996904
    //According to the creator: "I also plan on keeping that URL active for as long as possible - but make no guarantees of availability, reliability, or that it will stay up for years."
    var remote_service_tor = document.createElement("script");
    remote_service_tor.setAttribute("src", "https://openinternet.io/tor/istor.js")
    document.head.appendChild(remote_service_tor);
    populate_torbox(global_configdata.boxes.torbox);

    //Thre remote service used for weather data is Yahoo APIs.
    //Limited to 2000 calls per day.
    //To change your location, just change the "text" parameter in the YQL query.
    var remote_service_weather = document.createElement("script");
    remote_service_weather.setAttribute("src", "https://query.yahooapis.com/v1/public/yql?q=select item.condition from weather.forecast where woeid in (select woeid from geo.places(1) where text='waco, tx')&format=json&callback=populate_weatherbox");
    document.head.appendChild(remote_service_weather);
}
