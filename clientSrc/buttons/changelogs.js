let changelogArray = [
    {
        name: "Ooo Pretty",
        contributor: "Fluffy-hyena & Winquacks",
        description: [
        ['rgb(228,42,42)', '- Revamped the options menu.'],
        ['rgb(235,87,87)', '-- Renamed the options menu to additional menu.'],
        ['rgb(235,87,87)', '-- Re-did the controls section, so it now has its own pop-up.'],
        ['rgb(235,87,87)', '-- Re-did the graphics section, so it now has its own pop-up.'],
        ['rgb(235,87,87)', '-- Added a discord button, currently doesnt join a server.'],
        ['black', '- Made minor changes with changelogs and features.'],
        ['orange', '- Added a compiler to the project.'],
        ]
    },
    {
        name: "Hungry Game",
        contributor: "Fluffy-hyena",
        description: [
            ['orange', '- Re-did the food system.'],
            ['black', '- Added descriptions to the features tab.'],
            ['black', '- Added changelogs.'],
            ['grey', '- Nerfed sentries.'],
            ['orange', '- Added the ability to hold m + stat upgrade key to max said stat.'],
        ]
    },
    {
        name: "Gift of Creation",
        contributor: "Winquacks",
        description: [
            ['gold', '- This project was created'],
            ['black', '- revamped the main menu and made a spectate system']
        ],
    }
]
changelogs.onclick = function () {
    if(document.getElementsByClassName('popupMenu').length){
      let ele = document.getElementsByClassName('popupMenu');
      ele[0].style.animation = "menuGo .5s";
      ele[0].style.animationFillMode = "forward";
      document.getElementById("invisDiv").appendChild(document.getElementById("graphicSection"))
      setTimeout(function () {
          ele[0].remove();
      }, 500)
    }
    let body = document.createElement("div");
    body.classList.add("startMenu");
    body.classList.add("popupMenu");
    body.style.width = "500px";
    body.style.height = "300px";
    body.style.left = "calc(50% - 250px)";
    body.style.top = "calc(50% - 150px)";
    body.style.overflow = "auto"
    let close = document.createElement("div");
    close.classList.add("bottomHolder");
    close.innerHTML = `<a style="background:#00b2e1;font-size:20px;padding:0px;margin:0px;position: absolute; top: 10px;left:calc(100% - 10px - 25px); width:25px;height:25px;">✕</a>`
    close.children[0].onclick = function () {
        body.style.animation = "menuGo .5s";
        body.style.animationFillMode = "forward";
        body.style.pointerEvents = "none";
        setTimeout(function () {
            body.remove();
        }, 500)
    }
    body.appendChild(close);
    body.appendChild((function (h1 = document.createElement("h1")) {
        h1.style = "text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "OpenArras Changelog";
        return h1;
    })());
    /*body.appendChild((function(h1=document.createElement("h1")){
        h1.style="text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "(🗸: done, ✗: not done)";
        return h1;
    })())*/
    for (let i = 0; i < changelogArray.length; i++) {
        let changelog = changelogArray[i];
        function createLine(h1 = document.createElement("h1")) {
            h1.style = `text-align:left;font-size:20px;margin-left:10px;margin-top: 3px;margin-bottom:0px;`;
            h1.innerHTML = changelog.name + " - " + changelog.contributor;
            body.appendChild(h1)
            for (let a = 0; a < changelog.description.length; a++) {
                let h2 = document.createElement('h2')
                h2.style = `font-weight:200;text-align:left;font-size:12.5px;margin-left:20px;margin-top: 3px;margin-bottom:0px;color:${changelog.description[a][0]}`;
                h2.innerHTML = changelog.description[a][1]
                body.appendChild(h2)
            }
            body.appendChild(document.createElement("br"))
        }
        createLine();
    };
    startMenuWrapper.appendChild(body);
}
