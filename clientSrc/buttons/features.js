// For the contributor spot spell the github users name exactally right or put their github id there
let featuresArray = [
    {
        name: "Discord-Bot Implementation",
        description: "A discord bot implemented into the OpenArras server creating a link between the game and discord.",
        contributor: "79679437",
        important: true,
        done: false,
    },
    {
        name: "A fully functional in-game chat",
        description: "A chat in-game where players can talk by pressing the enter key.",
        contributor: "79679437",
        important: false,
        done: true,
    },
    {
        name: "Server Life Support",
        description: "In an attempt to create a smoother experience if the server starts to get laggy this will reduce the amount of food on the map and the maxium amount of food thats able to spawn.",
        contributor: "79679437",
        important: true,
        done: true,
    },
    {
        name: "New interpolation implementation",
        description: "Creates a smoother gameplay expierence by predicting where and when things will happen.",
        contributor: "63546466",
        important: true,
        done: false,
    },
    {
        name: "Features page",
        description: "What youre currently looking at.",
        contributor: "63546466",//Windows8964 github id
        done: true,
    },
    {
        name: "Better food function",
        description: "Makes food spawn out of no where in clumps rather than with mitiosis and leveling up.",
        contributor: '79679437',//Fluffy-hyena github id
        done: true,
    },
    {
        name: "Discord Server",
        description: "A server where people can talk about this project and other related ones.",
        contributor: "63546466",
        done: true,
    },
    {
        name: "Change Logs",
        description: "A tab to log all changes made to the game.",
        contributor: "79679437",
        important: true,
        done: true,
    },
    {
        name: "Better AIs",
        description: 'Make all AIs work very very well.',
        contributor: "79679437",
        important: true,
        done: true,
    }
]

// load some github stuff
async function gitdata(){let response = await fetch(`https://${window.location.hostname}/githubstats.json`);let data = await response.json();return JSON.parse(data.gitdata);}
// put the github stuff into action!
gitdata().then(github=>{
for(let i=0; i<featuresArray.length; i++){
  for(let a=0; a<github.length; a++){
    if(featuresArray[i].contributor==github[a].login||featuresArray[i].contributor==github[a].id){
      featuresArray[i].contributor = `<img src="${github[a].avatar_url}" style="width:18px;height:18px;"> <b><a style="${featuresArray[i].done ? "color:rgb(31,172,31);" : "color:rgb(255,0,0);"}" href="${github[a].html_url}" target="_blank" rel="noopener noreferrer">${github[a].login}</a></b>`;
    }
  }
}})

// click event
features.onclick = function () {
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
        h1.innerHTML = "OpenArras current features/plans";
        return h1;
    })());
    body.appendChild((function (h1 = document.createElement("h1")) {
        h1.style = "text-align:middle;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "(🗸: done, ✗: not done)";
        return h1;
    })())
    for (let i = 0; i < featuresArray.length; i++) {
        let feature = featuresArray[i];
        function createLine(h1 = document.createElement("h1"), h2 = document.createElement("h2")) {
            h1.style = `font-weight:400;text-align:left;font-size:15px;margin-left:10px;margin-top: 3px;margin-bottom:0px;${feature.done ? "color:#1E9A1E;" : "color:#FF0000;"}`;
            h2.style = `font-weight:200;text-align:left;font-size:12.5px;margin-left:20px;margin-top: 3px;margin-bottom:0px;${feature.done ? "color:#1E9A1ED8;" : "color:#FF0000D8;"}`;
            h1.innerHTML = (feature.done ? "🗸  " : "✗  ") + feature.name + " - " + feature.contributor;
            h2.innerHTML = feature.description;
            if (feature.important && feature.done) h1.style.color = "#1FAC1F", h1.style.textShadow = "0px 0px 5px #1FAC1FA5", h2.style.textShadow = "0px 0px 5px #1E9A1EA5";
            if (feature.important && !feature.done) h1.style.color = "#FF3B00", h1.style.textShadow = "0px 0px 5px rgba(255,0,0,0.65)", h2.style.textShadow = "0px 0px 5px #FF0000A5";
            body.appendChild(h1)
            body.appendChild(h2)
            body.appendChild(document.createElement("br"))
        }
        createLine();
    };
    startMenuWrapper.appendChild(body);
}
