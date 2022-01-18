let changelogArray = [
    {
      name: "Hungry Game",
      description:[
                  ['orange', '- redid the food system'],
                  ['black', '- added descriptions to the features tab'],
                  ['black', '- added changelogs'],
                  ['grey', '- nerfed sentries'],
                  ]
    },
    {
      name: "Gift of Creation",
      description:[
                  ['gold', '- This project was created'],
                  ['black', '- revamped the main menu and made a spectate system']
                  ],
    }
]
changelogs.onclick = function(){
    let body = document.createElement("div");
    body.classList.add("startMenu");
    body.style.width = "500px";
    body.style.height = "300px";
    body.style.left = "calc(50% - 250px)";
    body.style.top = "calc(50% - 150px)";
    body.style.overflow = "auto"
    let close = document.createElement("div");
    close.classList.add("bottomHolder");
    close.innerHTML = `<a style="background:#00b2e1;font-size:20px;padding:0px;margin:0px;position: absolute; top: 10px;left:calc(100% - 10px - 25px); width:25px;height:25px;">✕</a>`
    close.children[0].onclick = function(){
        body.style.animation = "menuGo .5s";
        body.style.animationFillMode = "forward";
        body.style.pointerEvents = "none";
        setTimeout(function(){
            body.remove();
        }, 500)
    }
    body.appendChild(close);
    body.appendChild((function(h1=document.createElement("h1")){
        h1.style="text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
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
        function createLine(h1=document.createElement("h1")){
            h1.style=`font-weight:400;text-align:left;font-size:20px;margin-left:10px;margin-top: 3px;margin-bottom:0px;`;
            h1.innerHTML = changelog.name;
            body.appendChild(h1)
            for(let a=0; a < changelog.description.length; a++){
              let h2 = document.createElement('h2')
              h2.style=`font-weight:200;text-align:left;font-size:12.5px;margin-left:20px;margin-top: 3px;margin-bottom:0px;color:${changelog.description[a][0]}`;
              h2.innerHTML = changelog.description[a][1]
              body.appendChild(h2)
            }
            body.appendChild(document.createElement("br"))
        }
      createLine();
    };
    startMenuWrapper.appendChild(body);
}