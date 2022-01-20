contributors.onclick = function(){
fetch('https://api.github.com/repos/Windows8964/openarras-project/contributors')
  .then(response => response.json())
  .then(data => {
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
        h1.style="text-align:middle;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "OpenArras Contributors";
        return h1;
    })());
    /*body.appendChild((function(h1=document.createElement("h1")){
        h1.style="text-align:left;font-size:25px;margin-left:10px;margin-top: 3px;margin-bottom:0px;";
        h1.innerHTML = "(🗸: done, ✗: not done)";
        return h1;
    })())*/
    for (let i = 0; i < data.length; i++) {
        let control = data[i];
        function createLine(h1=document.createElement("h1")){
            h1.style=`font-weight:400;text-align:left;font-size:20px;margin-left:10px;margin-top: 10px;margin-bottom:0px;`;
            h1.innerHTML = `<img src="${data[i].avatar_url}" style="width:24px;height:24px;"> <b><a href="${data[i].html_url}" target="_blank" rel="noopener noreferrer">${data[i].login}</a></b> - ${data[i].contributions} commits`;
            body.appendChild(h1)
            }
      createLine();
    };
    startMenuWrapper.appendChild(body);
  })
}
