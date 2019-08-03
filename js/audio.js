;
(function($, window, document, undefined) {
    /*绑定audio，之后一直用的audio一直是这个*/
    var Audio;
    $.fn.niceConnect = function() {
        Audio = this[0];
        return Audio;
    }

    /******************************歌词组件 ******************************/
    var Lrcer = function(aduio, thread, ele, opt) {
        this.audio = aduio || null;
        this.thread = thread || null;
        this.$element = ele || null;
        this.defaults = {};
        this.options = $.extend({}, this.defaults, opt);
    }

    Lrcer.prototype = {
        //歌词处理，返回对象
        parseLyric: function(lrc, unit) {
            if (lrc == "纯音乐")
                return { 0: "纯音乐" }
            if (lrc == null)
                return { 0: "暂无歌词" }
            else {
                var lyrics = lrc.split("\n");
                var lrcObj = {};
                var timesec = 1,
                    timemsec = 0;
                if (unit == "millisecond") {
                    timesec = 1000;
                    timemsec = 1;
                }
                for (var i = 0; i < lyrics.length; i++) {
                    var lyric = decodeURIComponent(lyrics[i]);
                    var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
                    var timeRegExpArr = lyric.match(timeReg);
                    if (!timeRegExpArr) continue;
                    var clause = lyric.replace(timeReg, '');
                    for (var k = 0, h = timeRegExpArr.length; k < h; k++) {
                        var t = timeRegExpArr[k];
                        var min = Number(String(t.match(/\[\d*/i)).slice(1)),
                            sec = Number(String(t.match(/\:\d*/i)).slice(1)),
                            msec = Number(pad(String(t.match(/\.\d*/i)).slice(1), 3));
                        var time = (min * 60 + sec) * timesec + msec * timemsec;
                        lrcObj[time] = clause;
                    }
                }
                return lrcObj;
            }
            //小数后位数不足补0
            function pad(num, n) {
                var tbl = [];
                var len = n - num.length;
                if (len <= 0) return num;
                if (!tbl[len]) tbl[len] = (new Array(len + 1)).join('0');
                return num + tbl[len];
            }
        },
        scroll: function(lrc, tlyric) {
            window.clearTimeout(this.thread);
            var _lrcer = this;
            return this.$element.each(function() {
                var $this = $(this);

                console.log(_lrcer.parseLyric(lrc));
                console.log(_lrcer.parseLyric(tlyric));
                var lrcobj = _lrcer.parseLyric(lrc);
                var tlyricobj = _lrcer.parseLyric(tlyric);

                var lrcli = "";
                for (let i in lrcobj) {
                    lrcli += "<br/><li date-timeaxis-lrc=" + i + ">" + lrcobj[i] + "</li>";
                    if (tlyricobj[i] && i != 0)
                        lrcli += "<li date-timeaxis-tlyric=" + i + ">" + tlyricobj[i] + "</li>";
                }
                $this.empty();
                $this.append(lrcli);

                var currentTime;
                var $nowlrc, $nowtlyric,
                    $beforelrc, $beforetlyric;
                _lrcer.thread = setInterval(() => {
                    currentTime = Math.floor(_lrcer.audio.currentTime);
                    // console.log(currentTime);
                    if (lrcobj.hasOwnProperty(currentTime)) {
                        if ($beforelrc)
                            $beforelrc.removeClass('lineheight');
                        if ($beforetlyric)
                            $beforetlyric.removeClass('lineheight');
                        $nowlrc = $this.find("li[date-timeaxis-lrc=" + currentTime + "]").addClass('lineheight');
                        $nowtlyric = $this.find("li[date-timeaxis-tlyric=" + currentTime + "]").addClass('lineheight');
                        $beforelrc = $nowlrc;
                        $beforetlyric = $nowtlyric;
                        $this.animate({ scrollTop: $nowlrc[0].offsetTop - window.innerHeight / 2 }, 400);
                    }
                }, 1000);
            });
        }
    }

    var lrcer = {};
    $.fn.bindlrc = function(lrc, tlyric, wrapper) {
        lrcer = new Lrcer(Audio, lrcer.thread, this, wrapper);
        //console.log(lrcer);
        return lrcer.scroll(lrc, tlyric);
    }

    /****************************** 频谱动画组件 ******************************/
    var Canvas = function(audio, ele, opt) {
        this.audio = audio || null;
        this.imgsrc = null;
        this.$element = ele || null;
        this.defaults = {
            size: 400,
            meterWidth: 2, //谱柱宽度
            meterNum: 240, //谱柱的数量
            ctxLineCap: "round",
            ctxStrokeStyle: "rgba(161,216,230,1)",
            analyserFftSize: 4096,
            analyserMinDecibels: -70,
            analyserMaxDecibels: 200,
            deviation: 50, //取样开始位置
            angularVelocity: 0.05, //旋转速度
            imgAngularVelocity: 0.05, //封面旋转速度，两个旋转原理不一样
        };
        this.options = $.extend({}, this.defaults, opt);
    }

    var offscreencanvas = document.createElement('canvas'),
        offctx = offscreencanvas.getContext('2d');

    Canvas.prototype = {
        start: function() {
            //canvas大小参考长度
            var size = this.options.size,
                imgCanvasSize = size * 0.8;

            //频谱属性
            var meterWidth = this.options.meterWidth, //谱柱宽度
                meterNum = this.options.meterNum, //谱柱的数量
                circleCenterX = size / 2, //圆心横坐标
                circleCenterY = size / 2, //圆心纵坐标
                radius = imgCanvasSize / 2, //半径
                angleStep = 2 * Math.PI / meterNum; //角度间隔

            //aduio API
            var actx = new AudioContext(),
                analyser = actx.createAnalyser(),
                audioSrc = actx.createMediaElementSource(this.audio);
            analyser.fftSize = this.options.analyserFftSize;
            analyser.minDecibels = this.options.analyserMinDecibels;
            analyser.maxDecibels = this.options.analyserMaxDecibels;
            analyser.connect(actx.destination); //连接音频设备，注释此行代码会使页面有图像但没声音
            audioSrc.connect(analyser);

            //频谱canvas
            var canvas = this.$element[0];
            canvas.width = canvas.height = size;
            var ctx = canvas.getContext('2d');
            ctx.lineCap = this.options.ctxLineCap;
            ctx.lineWidth = meterWidth;
            ctx.strokeStyle = this.options.ctxStrokeStyle;

            //封面canvas
            var imgCanvas = $('<canvas id="songImg"></canvas>')[0];
            $('#canvas').after($(imgCanvas));
            imgCanvas.width = imgCanvas.height = imgCanvasSize;
            var ictx = imgCanvas.getContext('2d');
            ictx.translate(imgCanvasSize / 2, imgCanvasSize / 2); //设置中心点

            //离屏canvas
            offscreencanvas.width = offscreencanvas.height = imgCanvasSize;
            offctx.translate(imgCanvasSize / 2, imgCanvasSize / 2);

            var array;
            var deviation = this.options.deviation; //取样开始位置
            var length = meterNum + deviation; //取样结束位置
            var k = 0; //用于动画旋转的中间变量
            var angularVelocity = this.options.angularVelocity; //旋转速度
            var imgAngularVelocity = this.options.imgAngularVelocity; //封面旋转速度，两个旋转原理不一样

            renderFrame();

            function renderFrame() {
                array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                var value;
                k += angularVelocity;
                k = k >= meterNum ? 0 : k; //转一圈后重置
                ctx.clearRect(0, 0, size, size);
                ctx.beginPath();
                for (let i = deviation; i < length; i++) {
                    arrValue = array[i];
                    //value = arrValue < 2 ? 2 : arrValue;
                    value = arrValue;

                    ctx.moveTo((radius + value) * Math.cos((i + k) * angleStep) + circleCenterX, (radius + value) * Math.sin((i + k) * angleStep) + circleCenterY);
                    ctx.lineTo((radius) * Math.cos((i + k) * angleStep) + circleCenterX, (radius) * Math.sin((i + k) * angleStep) + circleCenterY);

                }
                ctx.stroke();

                ictx.drawImage(offscreencanvas, -imgCanvasSize / 2, -imgCanvasSize / 2);
                ictx.rotate(imgAngularVelocity * Math.PI / 180); //旋转角度

                requestAnimationFrame(renderFrame);
            }
            return this.$element;
        }
    }

    var _canvas = {};
    $.fn.bindanima = function(wrapper) {
        _canvas = new Canvas(Audio, this, wrapper);
        return _canvas.start();
    }

    $.fn.bindimg = function(songImgURL) {
        var img = new Image();
        img.src = songImgURL;
        img.onload = function() {
            // 执行drawImage语句
            var imgCanvasSize = _canvas.options.size * 0.8;
            offctx.drawImage(img, -imgCanvasSize / 2, -imgCanvasSize / 2, imgCanvasSize, imgCanvasSize);
        }
        return this;
    }
})(jQuery, window, document);