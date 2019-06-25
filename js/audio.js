/* 
 * author：Qyujie
 * 功能：实现音乐可视化，且拥有音乐播放器功能
 * 未实现功能或缺陷：没有实现播放菜单；
 *                  切换歌曲只能随机切换；
 *                  mp3资源只能用固定的名字；
 *                  背景图片不能随着切换歌曲而切换；
 *                  没有实现音量控制组件
 *                  ......
 * 已知bug：快速点击切换歌曲按钮，会删除掉背景图片容器（#bodydiv）的样式（css），由styleSheets.deleteRule(0)导致；
 *          随着歌曲的不断切换，该网页的可能缓存会越来越大，导致帧数变低；
 *          随着歌曲的不断切换，当点击暂停的时候，铺面可能不会暂停绘制，但由于没有audio的数据，绘制出来的谱柱高度全部为0
 *          定义的变量anime，长度会随着歌曲的不断切换而无限变长，没有测试，影响未知
 *          点击进度条有几率会出现歌曲实际播放位置与点击位置不符情况
 *          此逻辑上无法做到第一首歌曲不自动播放
 *          音乐可能只会缓存一部分，当读完缓存后，就会骤停然后播放下一首，可能与我测试时用的音乐文件格式（mp3）或文件过大（3-17mb）所导致
 *          .....
 */

var audio = $("audio")[0];

var windowWidth = window.innerWidth * 0.8,
    windowHeight = window.innerHeight * 0.8;

var canvas = $("#canvas")[0],
    ctx = canvas.getContext('2d');
var imgCanvas = $("#songImg")[0],
    ictx = imgCanvas.getContext('2d');

var canvasWidth = windowWidth > windowHeight ? windowHeight : windowWidth,
    canvasHeight = windowHeight > windowWidth ? windowWidth : windowHeight,
    imgCanvasWidth = canvasWidth * 0.8,
    imgCanvasHeight = canvasHeight * 0.8;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
imgCanvas.width = imgCanvasWidth;
imgCanvas.height = imgCanvasHeight;

ictx.translate(imgCanvasWidth / 2, imgCanvasHeight / 2); //设置中心点

var duration = 0, //audio时长
    currentTime, //audio当前播放位置
    min, //记录分钟
    sec, //记录秒
    secText, //记录 分钟:秒 字符串
    $startTime = $("#startTime"),
    $endTime = $("#endTime");

var timer, //防抖
    $lightBox = $("#div-lightBox").slider({
        range: "min",
        value: 0,
        min: 1,
        slide: function(event, ui) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                audio.currentTime = ui.value;
                var TLBox = creatTLBox();
                timer = undefined;
            }, 100);
        }
    });

var nowPlaySong; //现在播放的歌曲
$("#next").click(function() {
    var $nextPlaySong = nowPlaySong.next();
    console.log($nextPlaySong);
    loadSong($nextPlaySong);
});

$("#meun").click(function() {
    $('#songs').slideToggle("slow");
});

audio.oncanplay = function() {
    // console.log('audio.oncanplay');
    duration = Math.round(audio.duration); //audio时长
    $lightBox.slider({
        max: duration,
        value: 0
    });

    //audio时长标记
    timeText($endTime, duration);

    audio.play();
}

audio.onplay = function() {
    // console.log('audio.onplay');
    //变更播放暂停按钮，停止进度条运动
    $("#play").removeClass("glyphicon-play");
    $("#play").addClass("glyphicon-pause");

    var meterWidth = 2, //谱柱宽度
        meterNum = 240, //谱柱的数量
        circleCenterX = canvasWidth / 2, //圆心横坐标
        circleCenterY = canvasHeight / 2, //圆心纵坐标
        radius = canvasWidth * 0.4, //半径
        angleStep = 2 * Math.PI / meterNum; //角度间隔
    ctx.lineCap = "round";
    ctx.lineWidth = meterWidth;
    ctx.strokeStyle = "rgba(161,216,230,1)";

    var actx = new AudioContext();
    var analyser = actx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.minDecibels = -70;
    analyser.maxDecibels = 200;
    var audioSrc = actx.createMediaElementSource(audio);
    audioSrc.connect(analyser);
    analyser.connect(actx.destination); //连接音频设备，注释此行代码会使页面有图像但没声音
    var array;
    var deviation = 50;
    var length = meterNum + deviation;
    var k = 0;
    var angularVelocity = 0.05; //旋转速度
    var imgAngularVelocity = 0.05; //封面旋转速度，两个旋转原理不一样

    function renderFrame() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        ctx.beginPath();
        var value;
        var tuning;
        k += angularVelocity;
        k = k >= meterNum ? 0 : k;
        for (let i = deviation; i < length; i++) {
            arrValue = array[i];
            value = arrValue < 2 ? 2 : arrValue;

            ctx.moveTo((radius + value) * Math.cos((i + k) * angleStep) + circleCenterX, (radius + value) * Math.sin((i + k) * angleStep) + circleCenterY);
            ctx.lineTo((radius - value) * Math.cos((i + k) * angleStep) + circleCenterX, (radius - value) * Math.sin((i + k) * angleStep) + circleCenterY);

        }
        ctx.stroke();

        ictx.drawImage(img, -imgCanvasWidth / 2, -imgCanvasHeight / 2, imgCanvasWidth, imgCanvasHeight);
        ictx.rotate(imgAngularVelocity * Math.PI / 180);

        currentTime = Math.round(audio.currentTime);

        timeText($startTime, currentTime);

        requestAnimationFrame(renderFrame);
    }
    requestAnimationFrame(renderFrame);

};

/* 进度条启动 */
var TLBox = creatTLBox();

function creatTLBox() {
    return setInterval(() => {
        $lightBox.slider("value", currentTime);
    }, 1000);
}

$("#div-lightBox").mousedown(function() {
    window.clearInterval(TLBox);
});

//播放结束事件，点击下一首
audio.onended = function() {
    var $nextPlaySong = nowPlaySong.next();
    loadSong($nextPlaySong);
};

//暂停事件，停止绘制
audio.onpause = function() {
    $("#play").removeClass("glyphicon-pause");
    $("#play").addClass("glyphicon-play");
}

//播放按钮点击事件，暂停或播放
$("#play").click(function() {
    if (!audio.paused) {
        setTimeout(function() {
            $("#play").removeClass("glyphicon-pause");
            $("#play").addClass("glyphicon-play");
            audio.pause();
        }, 0);
    } else {
        setTimeout(function() {
            $("#play").removeClass("glyphicon-play");
            $("#play").addClass("glyphicon-pause");
            audio.play();
        }, 0);
    }
});

//标记播放时间
function timeText($object, time) {
    min = Math.floor(time / 60);
    sec = time % 60;
    if (sec < 10) secText = "0" + sec;
    else secText = "" + sec;
    $object.text(min + ":" + secText);
}

//点击歌曲后的初始化
var img = new Image();
$('#songs').delegate("a", "click", function() {
    var playlistId = $(this).attr("date-playlist-id");
    if (playlistId) {
        $('#songs').empty();
        playlistDetail(playlistId);
    } else {
        loadSong($(this));
    }
});

function loadSong($object) {
    var songId = $object.attr("date-songs-id");
    var songImgURL = $object.attr("date-songs-img");
    console.log(songId);
    console.log(songImgURL);
    img.src = songImgURL;
    img.onload = function() {
        // 执行drawImage语句
        ictx.drawImage(img, -imgCanvasWidth / 2, -imgCanvasHeight / 2, imgCanvasWidth, imgCanvasHeight);
    }
    songUrl(songId);
    nowPlaySong = $object;
}


/******************************************** api请求 ********************************************/

function api(rout) {
    var pageAPI = "http://119.23.50.158:3000";
    return pageAPI + rout;
}

loginStatus();

function loginStatus() {
    var page = api("/login/status");
    $.ajax({
        type: "get",
        url: page,
        xhrFields: {
            withCredentials: true //关键
        },
        success: function(response) {
            console.log(response);
            var userId = response.profile.userId;
            // likelist(userId);
            userPlaylist(userId);
        },
        error: function(response) {
            var code = response.responseJSON.code;
            if (code == 301) {
                console.log(code);
                //window.location.href = "login.html";
            }
        }

    });
}

//用户喜欢音乐列表
function likelist(userId) {
    var page = api("/likelist");
    $.ajax({
        type: "get",
        url: page,
        xhrFields: {
            withCredentials: true //关键
        },
        data: {
            "uid": userId
        },
        success: function(response) {
            console.log(response);
            var songIdsArr = response.ids;
            var songIds = songIdsArr[0] + "";
            var length = songIdsArr.length;
            var songId;
            for (let i = 1; i < length; i++) {
                songId = songIdsArr[i];
                songIds += "," + songId;
            }
            songDetail(songIds);
        },
    });
}

//用户歌单
function userPlaylist(userId) {
    var page = api("/user/playlist");
    $.ajax({
        type: "get",
        url: page,
        xhrFields: {
            withCredentials: true //关键
        },
        data: {
            "uid": userId
        },
        success: function(response) {
            console.log(response);
            var playlistIds = response.playlist;
            var length = response.playlist.length;
            var playlistId = "";
            for (let index = 0; index < length; index++) {
                playlistId += "<a href='javascript:void(0);' date-playlist-id=" + playlistIds[index].id + ">" + playlistIds[index].name + "</a>";

            }
            $('#songs').append(playlistId);
            // playlistDetail(playlistId);
        },
    });
}

//用户歌单选择
function playlistDetail(playlistId) {
    var page = api("/playlist/detail");
    $.ajax({
        type: "get",
        url: page,
        xhrFields: {
            withCredentials: true //关键
        },
        data: {
            "id": playlistId
        },
        success: function(response) {
            console.log(response);
            var privileges = response.privileges;
            var length = privileges.length;
            var songIds = privileges[0].id + "";
            for (var i = 1; i < length; i++) {
                var songId = privileges[i].id;
                songIds += "," + songId;
            }
            songDetail(songIds);
        }
    });
}

//获取歌曲详细信息
function songDetail(songIds) {
    var page = api("/song/detail");
    $.ajax({
        type: "get",
        url: page,
        xhrFields: {
            withCredentials: true //关键
        },
        data: {
            "ids": songIds
        },
        success: function(response) {
            console.log(response);
            var songs = response.songs;
            var length = songs.length;
            var songName = "";
            for (var i = 0; i < length; i++) {
                songName += "<a href='javascript:void(0);' date-songs-id=" + songs[i].id + " date-songs-img=" + songs[i].al.picUrl + ">" + songs[i].name + "</a>";
            }
            $('#songs').append(songName);
        },
        error: function(response) {
            console.log(response);
        }
    });
}

//获取歌曲url
function songUrl(songIds) {
    var page = api("/song/url");
    $.ajax({
        type: "get",
        url: page,
        data: {
            "id": songIds
        },
        success: function(response) {
            console.log(response);

            audio.src = response.data[0].url;
            audio.load();
        },
    });
}