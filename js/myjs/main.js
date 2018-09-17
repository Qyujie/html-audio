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



window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
window.onload = function() {
	var index = 1; //audio数量-1,因为起始下标为0
	var duration = 0; //audio时长
	var currentTime; //audio当前播放位置
	//audio当前播放位置在前台显示的格式
	var min;//记录分钟
	var sec;//记录秒
	var secText;//记录分钟：秒
	var mouse = 0; //记录鼠标点击进度条时的横坐标
	var windowWidth = window.innerWidth; //窗口宽度
	var num; //记录动画绘制返回的id，用于停止绘画
	var anime = "animeLight"; //定义进度条使用的动画，两个动画是相同的，交替调用的效果是使动画重新开始
	var styleSheets = document.styleSheets[1]; //index.html中的第2个css
	var canvas = $("canvas")[0],
		cwidth = canvas.width,
		cheight = canvas.height,
		meterWidth = 5, //谱柱宽度
		gap = 2,//谱柱间隔
		meterNum = canvas.width / (meterWidth + gap), //谱柱的数量
		ctx = canvas.getContext('2d');
	var audio = $("audio")[0];
	
	audio.load();
	
	audio.volume = 0.1;
	
	$("#button").click(function() {
		console.log("button点击事件");
		
		audio.src = 'audio/au' + Math.round(Math.random() * index) + '.mp3';
		audio.load();
		
		mouse = -3;//清除点击进度条的鼠标相对位置标记
	});

	audio.oncanplay = function() {
		console.log("oncanplay事件");
		
		styleSheets.deleteRule(0); //清除@keyframes animeLight
		//进度块动画数据初始化
		anime=anime+Math.round(Math.random()*10);
		mouse -= 3;
		//创建@keyframes anime,anime为新定义的动画
		styleSheets.insertRule("@keyframes "+ anime +"{0% {left:"+ mouse +"px;}100% {left:797px;}}");
		//进度条设置
		$("#light").css({
			"animation": anime + " " + ((1 - mouse / 800) * duration) + "s",
			"animation-timing-function": "linear",
		});
		
		duration = Math.round(audio.duration); //audio时长

		//audio时长标记
		min = Math.round(duration / 60);
		sec = duration % 60;
		if (sec < 10) secText = "0" + sec;
		else secText = "" + sec;
		$("#endTime").text(min + ":" + secText);
		
		audio.play();
	}

	audio.onplay = function() {
		console.log("onplay事件,清除画布开始绘制");

		//进度条设置
		$("#light").css({
			"animation": anime + " " + ((1 - mouse / 800) * duration) + "s",
			"animation-timing-function": "linear",
		});
		console.log(styleSheets);
		
		//变更播放暂停按钮，停止进度条运动
		$("#play").removeClass("glyphicon-play");
		$("#play").addClass("glyphicon-pause");

		var actx = new AudioContext();
		var analyser = actx.createAnalyser();
		var audioSrc = actx.createMediaElementSource(audio);
		audioSrc.connect(analyser);
		analyser.connect(actx.destination);

		function renderFrame() {
			var array = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(array);
			var step = Math.round(array.length / meterNum);
			ctx.clearRect(0, 0, cwidth, cheight);
			for (var i = 0; i < meterNum; i++) {
				var value = array[i * step];
				ctx.fillStyle = "rgba(161,216,230,0.7)";
				ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, cheight);
			}

			currentTime = Math.round(audio.currentTime);
			min = Math.round(currentTime / 60);
			sec = currentTime % 60;
			if (sec < 10) secText = "0" + sec;
			else secText = "" + sec;
			$("#startTime").text(min + ":" + secText);

			num = requestAnimationFrame(renderFrame);
			/*console.log(num);*/
		}
		requestAnimationFrame(renderFrame);
	};

	//播放结束事件，点击下一首
	audio.onended = function() {
		console.log("播放结束事件");
		$("#button").click();
	};

	//暂停事件，停止绘制
	audio.onpause = function() {
		console.log("暂停事件");
		$("#light").css("animation-play-state", "paused");
		$("#play").removeClass("glyphicon-pause");
		$("#play").addClass("glyphicon-play");
		window.cancelAnimationFrame(num);
	}

	//播放按钮点击事件，暂停或播放
	$("#play").click(function() {
		if (!audio.paused) {
			console.log("点击变得暂停");
			setTimeout(function() {
				$("#play").removeClass("glyphicon-pause");
				$("#play").addClass("glyphicon-play");
				audio.pause();
			}, 1);
		} else {
			console.log("点击变得播放");
			setTimeout(function() {
				$("#play").removeClass("glyphicon-play");
				$("#play").addClass("glyphicon-pause");
				audio.play();
			}, 1);
		}
	});
	
	//点击进度条，左侧时间进度改变
	$("#div-lightBox").click(function(event) {
		var e = event || window.event;
		//（窗体宽度-800）/2为进度条向左偏移宽度，多减去18是因为边框模型会占用宽度，不同浏览器减去的可能不同
		mouse = e.clientX - (windowWidth - 818) / 2; //值范围为进度条长度，这里为1-800
		audio.currentTime = mouse / 800 * duration; //设置audio播放位置

		currentTime = Math.round(audio.currentTime + 0.40);//0.4为补延时，可删去
		min = Math.round(currentTime / 60);
		sec = currentTime % 60;
		if (sec < 10) secText = "0" + sec;
		else secText = "" + sec;
		$("#startTime").text(min + ":" + secText);//显示正在播放的时间点
	});
};