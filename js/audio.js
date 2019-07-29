/* 
 * author：Qyujie
 * 功能：实现音乐可视化，且拥有音乐播放器功能
 * 未实现功能或缺陷：
 * 
 * 已知bug：
 * 
 */

//canvas大小参考长度
var windowWidth = window.innerWidth * 0.6,
    windowHeight = window.innerHeight * 0.6;
if (windowWidth > windowHeight) windowWidth = windowHeight;
else windowHeight = windowWidth;

var audio = $("audio")[0];

//频谱属性
var meterWidth = 2, //谱柱宽度
    meterNum = 240, //谱柱的数量
    circleCenterX = windowWidth / 2, //圆心横坐标
    circleCenterY = windowWidth / 2, //圆心纵坐标
    radius = windowWidth * 0.4, //半径
    angleStep = 2 * Math.PI / meterNum; //角度间隔

//aduio API
var actx = new AudioContext(),
    analyser = actx.createAnalyser(),
    audioSrc = actx.createMediaElementSource(audio);
analyser.fftSize = 4096;
analyser.minDecibels = -70;
analyser.maxDecibels = 200;
analyser.connect(actx.destination); //连接音频设备，注释此行代码会使页面有图像但没声音
audioSrc.connect(analyser);

//歌词 API
$("#lyric").connectAudio(audio);

//频谱canvas
var canvas = $("#canvas")[0],
    canvasWidth = canvasHeight = windowWidth;
canvas.width = canvas.height = canvasWidth;
ctx = canvas.getContext('2d');
ctx.lineCap = "round";
ctx.lineWidth = 2;
ctx.strokeStyle = "rgba(161,216,230,1)";

//封面canvas
var imgCanvas = $("#songImg")[0],
    imgCanvasWidth = imgCanvasHeight = windowWidth * 0.8
imgCanvas.width = imgCanvas.height = imgCanvasWidth;
ictx = imgCanvas.getContext('2d');
ictx.translate(imgCanvasWidth / 2, imgCanvasHeight / 2); //设置中心点

//离屏canvas
var offscreencanvas = document.createElement('canvas');
offscreencanvas.width = imgCanvasWidth;
offscreencanvas.height = imgCanvasHeight;
offctx = offscreencanvas.getContext('2d');
offctx.translate(imgCanvasWidth / 2, imgCanvasHeight / 2);

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
                TLBox = creatTLBox();
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


//菜单弹出收回
$("#meun").click(function() {
    var $songs = $('#songs');
    var width = $songs.css('width'),
        left = '0px';
    if ($songs.css('left') == '0px') {
        left = '-' + width;
    }
    $songs.animate({ left: left }, 400);
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

    // console.log(renderFrameid);
    //cancelAnimationFrame(renderFrameid);

};


var array;
var deviation = 50; //取样开始位置
var length = meterNum + deviation; //取样结束位置
var k = 0; //用于动画旋转的中间变量
var angularVelocity = 0.05; //旋转速度
var imgAngularVelocity = 0.05; //封面旋转速度，两个旋转原理不一样
var renderFrameid = 0; //动画标识，用于关闭、暂停动画

function renderFrame() {
    array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var value;
    k += angularVelocity;
    k = k >= meterNum ? 0 : k; //转一圈后重置
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.beginPath();
    for (let i = deviation; i < length; i++) {
        arrValue = array[i];
        //value = arrValue < 2 ? 2 : arrValue;
        value = arrValue;

        ctx.moveTo((radius + value) * Math.cos((i + k) * angleStep) + circleCenterX, (radius + value) * Math.sin((i + k) * angleStep) + circleCenterY);
        ctx.lineTo((radius) * Math.cos((i + k) * angleStep) + circleCenterX, (radius) * Math.sin((i + k) * angleStep) + circleCenterY);

    }
    ctx.stroke();

    ictx.drawImage(offscreencanvas, -imgCanvasWidth / 2, -imgCanvasHeight / 2);
    ictx.rotate(imgAngularVelocity * Math.PI / 180); //旋转角度

    currentTime = Math.round(audio.currentTime);

    timeText($startTime, currentTime);

    renderFrameid = requestAnimationFrame(renderFrame);
}
renderFrame();

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

//点击歌曲后的初始化，若点击的是歌单则请求相应歌单列表
$('#songs').delegate("a", "click", function() {
    var playlistId = $(this).attr("date-playlist-id");
    if (playlistId) {
        $('#songs').empty();
        playlistDetail(playlistId);
    } else {
        loadSong($(this));
    }
});

//加载歌曲及歌词、封面
var img = new Image();

function loadSong($object) {
    var songId = $object.attr("date-songs-id");
    var songImgURL = $object.attr("date-songs-img");
    img.src = songImgURL;
    img.onload = function() {
        // 执行drawImage语句
        offctx.drawImage(img, -imgCanvasWidth / 2, -imgCanvasHeight / 2, imgCanvasWidth, imgCanvasHeight);
    }
    songUrl(songId);
    lyric(songId);
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
            uid: userId
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
            uid: userId
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
            id: playlistId
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
            ids: songIds
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
function songUrl(songId) {
    var page = api("/song/url");
    $.ajax({
        type: "get",
        url: page,
        data: {
            id: songId
        },
        success: function(response) {
            console.log(response);

            audio.src = response.data[0].url;
            audio.load();
        },
    });
}

//获取歌词
function lyric(songId) {
    var page = api("/lyric");
    $.ajax({
        type: "get",
        url: page,
        data: {
            id: songId
        },
        success: function(response) {
            console.log(response);
            var lrc;
            var tlyric;

            if (response.hasOwnProperty("lrc")) {
                lrc = response.lrc.lyric;
                tlyric = response.tlyric.lyric;
            } else {
                lrc = tlyric = "纯音乐";
            }

            $("#lyric").bindlrc(lrc, tlyric);
        }
    });
}