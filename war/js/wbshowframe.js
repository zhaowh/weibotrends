/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 */

/**
 *  后台组件设置-微博秀页面IFRAME
 */
$(function(){
    var jqCt      = $('#showCt'),
        jqCtInner = $('#showCtInner'),
        jqTitle   = $('.weibo-title'),
        jqHead    = $('.weibo-head'),
        jqMain    = $('.weibo-main'),
        jqWbCt    = $('.weibo-list'),
        jqLogo    = jqCt.find('.xweibo'),
		basePath  = window.Xwb && Xwb.cfg.basePath;

	if (basePath)
		Xwb.request.init(basePath);
    
    // fix height
    function fixHeight(){
        if(jqWbCt.length){
            jqWbCt.hide();
            var total = jqCt.height();
            var inner = jqCtInner.height();
            jqWbCt.css('height', total - inner - 4)
                  .show();
        }
        
        var ctH = jqCt[0].offsetHeight;
        var i = 10;
        while(i>0){
            var h = 0;
            if(jqTitle[0]){
                if(jqTitle.css('display') != 'none')
                    h+=jqTitle[0].offsetHeight;
            }
            if(jqHead[0]){
                if(jqHead.css('display') != 'none')
                    h+=jqHead[0].offsetHeight;
            }
            if(jqMain[0]){
                if(jqMain.css('display') != 'none')
                    h+=jqMain[0].offsetHeight;
            }
            if(jqLogo[0]){
                h+=jqLogo[0].offsetHeight;
            }
            if(h > ctH){
                if(jqMain[0] && jqMain.css('display') != 'none')
                    jqMain.hide();
                else if(jqHead[0] && jqHead.css('display') != 'none')
                    jqHead.hide();
                else if(jqTitle[0] && jqTitle.css('display') != 'none')
                    jqTitle.hide();
            }else break;
            i--;
        }
    }
    
    function checkStatus(){
        var st = jqWbCt[0].scrollTop;
        if(st == 0)
            $('#arrowUp').hide();
        else $('#arrowUp').show();
            
        if(st + jqWbCt[0].clientHeight >= jqWbCt[0].scrollHeight)
            $('#arrowDown').hide();
        else $('#arrowDown').show();
    }
    
    var running;
    var interval = 0;
    var pace = 2;

    function onTimer(){
        var st = jqWbCt[0].scrollTop + pace;
        if(st<0)
            st = 0;
        jqWbCt[0].scrollTop = st;
        setTimer(running && (st != 0 && (st + jqWbCt[0].clientHeight < jqWbCt[0].scrollHeight)));
    }
    
    function setTimer(b){
       running = b;
       if(b)
         setTimeout(onTimer, interval);
       else checkStatus();
    }
                                  
    fixHeight();
    checkStatus();
    if(jqWbCt.length){
        $('#upSlider').hover(function(){
            pace = -1*Math.abs(pace);
            setTimer(true);
        }, function(){
            setTimer(false);
        });
        
        $('#downSlider').hover(function(){
            pace = Math.abs(pace);
            setTimer(true);
        }, function(){
            setTimer(false);
        });
    }
    
    // 更新转发数，评论数等信息
    function updateCount(){
        var arr = [];
        for ( var k in Xwb.cfg.wbList ){
            arr.push(k);
        }
        Xwb.request.counts(arr.join(','), function( e ){
            if(e.isOk()){
                var counts = e.getData();
                $.each(Xwb.cfg.wbList, function(id, v){
                    var ct = counts[id];
                    if(ct){
                        var jq = $('#'+id);
                        // comment count
                        if(ct[0]){
                            jq.find('#cm').text('评论('+ct[0]+')');
                        }
                        // forward count
                        if(ct[1]){
                            jq.find('#fw').text('转发('+ct[1]+')');
                        }
                    }
                });
            }
        });
    }
    
    window.Xwb && Xwb.cfg && Xwb.cfg.wbList && updateCount();
});