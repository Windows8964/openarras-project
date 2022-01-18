let featuresArray = [
    {
        name: "New interpolation implementation",
        description: "Creates a smoother gameplay expierence by predicting where and when things will happen",
        contributor: "Winquacks",
        important: true,
        done: true,
    },
    {
        name: "Features page",
        description: "What youre currently looking at",
        contributor: "Winquacks",
        done: true,
    },
    {
        name: "Better food function",
        description: "Makes food spawn out of no where in clumps rather than with mitiosis and leveling up",
        contributor: "Fluffy-hyena",
        done: true,
    },
    {
        name: "Discord Server",
        description: "A server where people can talk about this project and other related ones",
        contributor: "Winquacks",
        done: false,
    },
    {
        name: "Change Logs",
        description: "A tab to log all changes made to the game",
        contributor: "Fluffy-hyena",
        important: true,
        done: true,
    },
    {
        name: "Better AIs",
        description: 'Make all AIs work very very well',
        contributor: "Fluffy-hyena",
        important: true,
        done: false,
    }
]
features.onclick = function () {
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
        h1.innerHTML = "OpenArras current features/plans";
        return h1;
    })());
    body.appendChild((function (h1 = document.createElement("h1")) {
        h1.style = "text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "(🗸: done, ✗: not done)";
        return h1;
    })())
    for (let i = 0; i < featuresArray.length; i++) {
        let feature = featuresArray[i];
        function createLine(h1 = document.createElement("h1"), h2 = document.createElement("h2")) {
            h1.style = `font-weight:400;text-align:left;font-size:15px;margin-left:10px;margin-top: 3px;margin-bottom:0px;${feature.done ? "color:rgb(31,172,31);" : "color:rgb(255,0,0);"}`;
            h2.style = `font-weight:200;text-align:left;font-size:12.5px;margin-left:20px;margin-top: 3px;margin-bottom:0px;${feature.done ? "color:rgba(31,172,31,0.65);" : "color:rgba(255,0,0,0.65);"}`;
            h1.innerHTML = (feature.done ? "🗸  " : "✗  ") + feature.name + " - " + feature.contributor;
            h2.innerHTML = feature.description;
            if (feature.important && feature.done) h1.style.color = "#fff000", h1.style.textShadow = "0px 0px 5px rgba(255, 229, 0, 1)";
            body.appendChild(h1)
            body.appendChild(h2)
            body.appendChild(document.createElement("br"))
        }
        createLine();
    };
    startMenuWrapper.appendChild(body);
}
