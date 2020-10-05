$(function(){
    document.getElementById('slideshow').getElementsByTagName('img')[0].className = "fx";
    window.setInterval(kenBurns, 10000);		
    var images         = document.getElementById('slideshow').getElementsByTagName('img'),
        numberOfImages = images.length,
        i              = 1;
    function kenBurns() {
        if(i==numberOfImages){ i = 0;}
        images[i].className = "fx";
        if(i===0){ images[numberOfImages-2].className = "";}
        if(i===1){ images[numberOfImages-1].className = "";}
        if(i>1){ images[i-2].className = "";}
        i++;
    }
});