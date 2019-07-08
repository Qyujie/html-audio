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
        },
        lineHeight: function(lineno) {
            var ul = $("#text");
            var $ul = document.getElementById('text'); // 令正在唱的那一行高亮显示 
            if (lineno > 0) { $(ul.find("li").get(topNum + lineno - 1)).removeClass("lineheight"); }
            var nowline = ul.find("li").get(topNum + lineno);
            $(nowline).addClass("lineheight"); // 实现文字滚动 
            var _scrollTop;
            $ul.scrollTop = 0;
            if ($ul.clientHeight * fraction > nowline.offsetTop) {
                _scrollTop = 0;
            } else if (nowline.offsetTop > ($ul.scrollHeight - $ul.clientHeight * (1 - fraction))) {
                _scrollTop = $ul.scrollHeight - $ul.clientHeight;
            } else {
                _scrollTop = nowline.offsetTop - $ul.clientHeight * fraction;
            } //以下声明歌词高亮行固定的基准线位置成为 “A” 
            if ((nowline.offsetTop - $ul.scrollTop) >= $ul.clientHeight * fraction) {
                //如果高亮显示的歌词在A下面，那就将滚动条向下滚动，滚动距离为 当前高亮行距离顶部的距离-滚动条已经卷起的高度-A到可视窗口的距离 
                $ul.scrollTop += Math.ceil(nowline.offsetTop - $ul.scrollTop - $ul.clientHeight * fraction);
            } else if ((nowline.offsetTop - $ul.scrollTop) < $ul.clientHeight * fraction && _scrollTop != 0) {
                //如果高亮显示的歌词在A上面，那就将滚动条向上滚动，滚动距离为 A到可视窗口的距离-当前高亮行距离顶部的距离-滚动条已经卷起的高度 
                $ul.scrollTop -= Math.ceil($ul.clientHeight * fraction - (nowline.offsetTop - $ul.scrollTop));
            } else if (_scrollTop == 0) {
                $ul.scrollTop = 0;
            } else {
                $ul.scrollTop += $(ul.find('li').get(0)).height();
            }
        }

    }

    var lrcer;

    $.fn.connectaudio = function(audio) {
        return this.each(function() {
            lrcer = new Lrcer(audio);
            console.log(lrcer);
        });
    }

    $.fn.bindlrc = function(lrc, tlyric, wrapper) {
        lrcer = new Lrcer(lrcer.audio, lrcer.thread, this, wrapper);
        console.log(lrcer);
        return lrcer.x(lrc, tlyric);
    }

})(jQuery, window, document);