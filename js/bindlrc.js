;
(function($, window, document, undefined) {
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
        x: function(lrc, tlyric) {
            window.clearTimeout(this.thread);
            var _lrcer = this;
            return this.$element.each(function() {
                var $this = $(this);

                // console.log(parseLyric(lrc, "millisecond"));
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

    var lrcer;

    $.fn.connectAudio = function(audio) {
        return this.each(function() {
            lrcer = new Lrcer(audio);
            //console.log(lrcer);
        });
    }

    $.fn.bindlrc = function(lrc, tlyric, wrapper) {
        lrcer = new Lrcer(lrcer.audio, lrcer.thread, this, wrapper);
        //console.log(lrcer);
        return lrcer.x(lrc, tlyric);
    }

})(jQuery, window, document);