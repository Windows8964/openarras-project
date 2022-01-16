let featuresArray = [
    {
        name: "New interpolation implementation",
        done: true,
    },
    {
        name: "Features page",
        done: true,
    },
    {
        name: "Discord Server",
        done: false,
    },
    {
        name: "Github Mirror",
        done: false,
    },
]
features.onclick = function(){
    let body = document.createElement("div");
    body.classList.add("startMenu");
    body.style.width = "500px";
    body.style.height = "300px";
    body.style.left = "calc(50% - 250px)";
    body.style.top = "calc(50% - 150px)";
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
        h1.innerHTML = "OpenArras current features/plans";
        return h1;
    })());
    body.appendChild((function(h1=document.createElement("h1")){
        h1.style="text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "(🗸: done, ✗: not done)";
        return h1;
    })())
    for (let i = 0; i < featuresArray.length; i++) {
        let feature = featuresArray[i];
        body.appendChild((function(h1=document.createElement("h1")){
            h1.style=`font-weight:400;text-align:left;font-size:15px;margin-left:10px;margin-top: 3px;margin-bottom:0px;${feature.done ? "" : "color:red;"}`;
            h1.innerHTML = (feature.done ? "🗸  " : "✗  ") + feature.name;
            return h1;
        })());
    };
    startMenuWrapper.appendChild(body);
}