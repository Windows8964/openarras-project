graphics.onclick = function(){
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
            document.getElementById("invisDiv").appendChild(document.getElementById("graphicSection"))
            body.remove();
        }, 500)
    }
    body.appendChild(close);
    body.appendChild((function(h1=document.createElement("h1")){
        h1.style="text-align:middle;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "OpenArras Controls";
        return h1;
    })());
    /*body.appendChild((function(h1=document.createElement("h1")){
        h1.style="text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "(🗸: done, ✗: not done)";
        return h1;
    })())*/
    let ele1 = document.getElementById("graphicSection")
    ele1.style.display = "initial"
    body.appendChild(ele1)
    startMenuWrapper.appendChild(body);
}