let changelogArray = [
    {
        name: ['purple', 'Biggest update yet!'],
        contributor: "79679437",
        description:[
          ['magenta', '- Upgrades now only use the index ID rather than the entire class making <b>all</b> actions with entities that have upgrades faster!'],
          ['black', '- Added color support for notifications.'],
          ['green', '- Added a menu in game for anyone that has the correct token. This menu allows them to do many.. wild things...'],
          ['red', '- Added a new boss named the "Tempest", it a boss that harnesses the wind to surround your tank in high damaging drones.'],
          ['blue', '- Heavily nerfed bosses.'],
          ['black', '- Bosses now spawn faster,'],
          ['black', '- Bosses have a boss limit, when it is reached they will stop spawning.'],
          ['black', '- Fixed a bug with boss names.'],
          ['black', '- Improved boss spawning.'],
          ['purple', ' - Added a chat feature.'],
          ['black', '- Developers/Staff will appear as a different color in chat.'],
          ['orange', '- Added some very much needed optimizations.'],
          ['indigo', '- Bots now have somewhat of a bias and will choose bullet stats over body stats.. the bots are starting to get better than me at the game.'],
          ['violet', '- Added "server Lifesupport" <s>thats actaully what its called in the code</s> this feature will reduce the amount of food if things get laggy.'],
          ['black', '- Tried to balance helicopters.'],
          ['black', '- Crashers and Sentries now spawn with food and are counted as a part of food.'],
          ['black', '- Changed the Graphics section in the additional menu to a Settings section.'],
          ['rgb(105,104,104)', '- Added a new way to tell the server speed called OSTSIFMP, youll never guess what it stands for :).'],
        ]
    },
    {
        name: ['rgb(255,15,132)', "Haha spiny things"],
        contributor: "79679437",
        description:[
        ['purple', '- Added helicopter branch.'],
        ['black', '- Once again made the menu look nicer.'],
        ['black', '- Food will no longer spawn in lines.'],
        ['black', '- More food spawns.'],
        ['violet', '- Bots are now a thing and use an actaul ai system.']
        ]
    },
    {
        name: ['rgb(109,107,107)', "Im becoming a literal god."],
        contributor: "79679437",
        description:[
        ['gold', '- Reworked the rest of the options menu.'],
        ['rgb(192,162,3)', '-- Added a Contributors tab in the options menu.'],
        ['rgb(192,162,3)', '-- The themes and graphics section actaully has its own button now.'],
        ['rgb(255,0,187)', '- Reworked a few other menus. Most of the menus are now synced with github!'],
        ['rgb(126,114,92)', '- Fixed a bug that allowed you to open up tons of pop-up menus at once.'],
        ['black', '- Moved the themes section to the bottom of index.html.'],
        ['black', '- All button related scripts now have their own folder labaled /buttons/.'],
        ['black', '- Add a github sync timer at the bottom of server.js. When this timer activates the github statistics will refresh. The github it pulls the statistics from can be changed in confog.js.'],
        ['rgb(162,157,157)', '<s>- Probably a few other update notes I forgot to add</s>']
        ]
    },
    {
        name: ['black', "Ooo Pretty"],
        contributor: "79679437",
        description: [
        ['rgb(228,42,42)', '- Revamped the options menu.'],
        ['rgb(235,87,87)', '-- Renamed the options menu to additional menu.'],
        ['rgb(235,87,87)', '-- Re-did the controls section, so it now has its own pop-up.'],
        ['rgb(235,87,87)', '-- Re-did the graphics section, so it now has its own pop-up.'],
        ['rgb(235,87,87)', '-- Added a discord button, currently doesnt join a server.'],
        ]
    },
    {
        name: ['purple', "Getting Good"],
        contributor: "63546466",
        description: [
        ['black', '- Made minor changes with changelogs and features.'],
        ['orange', '- Added a compiler to the project.'],
        ]
    },
    {
        name: ['green', "Hungry Game"],
        contributor: "79679437",
        description: [
            ['orange', '- Re-did the food system.'],
            ['black', '- Added descriptions to the features tab.'],
            ['black', '- Added changelogs.'],
            ['grey', '- Nerfed sentries.'],
            ['orange', '- Added the ability to hold m + stat upgrade key to max said stat.'],
        ]
    },
    {
        name: ['violet', "Gift of Creation"],
        contributor: "63546466",
        description: [
            ['gold', '- This project was created'],
            ['black', '- revamped the main menu and made a spectate system']
        ],
    }
]

// load some github stuff
async function gitdata(){let response = await fetch(`https://${window.location.hostname}/githubstats.json`);let data = await response.json();return JSON.parse(data.gitdata);}
// put the github stuff into action!
gitdata().then(github=>{
for(let i=0; i<changelogArray.length; i++){
  for(let a=0; a<github.length; a++){
    if(changelogArray[i].contributor==github[a].login||changelogArray[i].contributor==github[a].id){
      changelogArray[i].contributor = `<img src="${github[a].avatar_url}" style="width:18px;height:18px;"> <b><a style='color:${changelogArray[i].name[0]};' href="${github[a].html_url}" target="_blank" rel="noopener noreferrer">${github[a].login}</a></b>`;
    }
  }
}})

// click event stuff
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
        h1.style = "text-align:middle;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
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
            h1.style = `color:${changelog.name[0]};text-align:left;font-size:20px;margin-left:10px;margin-top: 3px;margin-bottom:0px;`;
            h1.innerHTML = changelog.name[1] + " - " + changelog.contributor;
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
