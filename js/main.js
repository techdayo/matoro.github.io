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
    if(window.location.search.split("?").length <= 1)
    {
        config_request.open("GET", "user.json", true);
    }
    else
    {
        config_request.open("GET", window.location.search.split("?")[1] + ".json", true);
    }
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

    document.getElementById("newsprompt").textContent = configdata.boxes.newsbox.prompt;

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
    document.getElementById("iptext").textContent = ipdata;
}

function populate_torbox(tordata)
{
    if(tordata)
    {
        document.getElementById("tortext").textContent = global_configdata.boxes.torbox.enabled;
    }
    else
    {
        document.getElementById("tortext").textContent = global_configdata.boxes.torbox.disabled;
    }
}

function populate_weatherbox(weatherdata)
{
    document.getElementById("weathertext").textContent = weatherdata.query.results.channel.item.condition.text + ", " + weatherdata.query.results.channel.item.condition.temp + " degrees";
}

function populate_newsbox(newsdata)
{
    var tr = document.createElement("tr");
    var cell = document.createElement("td");
    var story = document.createElement("a");
    story.appendChild(document.createTextNode(newsdata.title));
    story.setAttribute("href", newsdata.url);
    cell.appendChild(story);
    tr.appendChild(cell);
    document.getElementById("newstable").getElementsByTagName("tbody")[0].appendChild(tr);
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
    //Remote service:  onion.link
    //Populates:       ipbox, torbox
    //Rate limit:      Not specified
    //Documentation:   https://github.com/globaleaks/Tor2web/wiki/CheckTor
    var remote_service_ip = document.createElement("script");
    remote_service_ip.setAttribute("type", "application/javascript");
    remote_service_ip.text = " \
        var remote_request_ip = new XMLHttpRequest();\n \
        remote_request_ip.onreadystatechange = function()\n \
        {\n \
            if(this.readyState == 4 && this.status == 200)\n \
            {\n \
                populate_ipbox((JSON.parse(this.responseText)).IP);\n \
                populate_torbox((JSON.parse(this.responseText)).IsTor);\n \
            }\n \
        };\n \
        remote_request_ip.overrideMimeType(\"application/json\");\n \
        remote_request_ip.open(\"GET\", \"https://onion.link/checktor\", true);\n \
        remote_request_ip.send();";
    document.head.appendChild(remote_service_ip);
    
    //Remote service:  Yahoo Weather
    //Populates:       weatherbox
    //Rate limit:      2000 calls/day
    //Documentation:   https://developer.yahoo.com/weather/
    var remote_service_weather = document.createElement("script");
    remote_service_weather.setAttribute("type", "application/javascript");
    remote_service_weather.setAttribute("src", "https://query.yahooapis.com/v1/public/yql?q=select item.condition from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + global_configdata.boxes.weatherbox.geo + "')&format=json&callback=populate_weatherbox");
    document.head.appendChild(remote_service_weather);

    //Remote service:  Hacker News
    //Populates:       newsbox
    //Rate limit:      Not specified
    //Documentation:   https://github.com/HackerNews/API
    var remote_service_news = document.createElement("script");
    remote_service_news.setAttribute("type", "application/javascript");
    remote_service_news.text = " \
        var remote_request_news = new XMLHttpRequest();\n \
        remote_request_news.onreadystatechange = function()\n \
        {\n \
            if(this.readyState == 4 && this.status == 200)\n \
            {\n \
                var remote_request_news_items = [];\n \
                for(var ticker = 0; ticker < Math.min((JSON.parse(this.responseText)).length, global_configdata.boxes.newsbox.stories); ticker++)\n \
                {\n \
                    remote_request_news_items.push(new XMLHttpRequest());\n \
                    remote_request_news_items[ticker].onreadystatechange = function()\n \
                    {\n \
                        if(this.readyState == 4 && this.status == 200)\n \
                        {\n \
                            populate_newsbox(JSON.parse(this.responseText));\n \
                        }\n \
                    };\n \
                    remote_request_news_items[ticker].overrideMimeType(\"application/json\");\n \
                    remote_request_news_items[ticker].open(\"GET\", \"https://hacker-news.firebaseio.com/v0/item/\" + (JSON.parse(this.responseText))[ticker] \+ \".json\", true);\n \
                    remote_request_news_items[ticker].send();\n \
                }\n \
            }\n \
        };\n \
        remote_request_news.open(\"GET\", \"https://hacker-news.firebaseio.com/v0/topstories.json\", true);\n \
        remote_request_news.send();";
    document.head.appendChild(remote_service_news);

    /*
    var remote_service_stocks = document.createElement("script")
    remote_service_stocks.setAttribute("type", "application/javascript");
    remote_service_stocks.setAttribute("src", "http://widgets.macroaxis.com/widgets/url.jsp?t=42");
    document.head.appendChild(remote_service_stocks);
    */
}
