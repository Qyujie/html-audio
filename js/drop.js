$(function() {
    document.body.addEventListener("drop", function(e) { //拖离      
        e.stopPropagation();
        e.preventDefault();
    });
    document.body.addEventListener("dragleave", function(e) { //拖后放
        e.stopPropagation();
        e.preventDefault();
    });
    document.body.addEventListener("dragenter", function(e) { //拖进
        e.stopPropagation();
        e.preventDefault();
    });
    document.body.addEventListener("dragover", function(e) { //拖来拖去
        e.stopPropagation();
        e.preventDefault();
    });

    var audio = $("audio")[0];
    var body = $("body")[0]; //拖拽区域     
    body.addEventListener("drop", function(e) {
        var fileList = e.dataTransfer.files; //获取文件对象        
        //检测是否是拖拽文件到页面的操作
        if (fileList.length == 0) {
            return false;
        }
        var fileurl = window.URL.createObjectURL(fileList[0]);
        audio.src = fileurl;
        audio.load();

    }, false);

});