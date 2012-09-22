/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 */

(function(X, $){
var FALSE = false,

	TRUE = true,

    R = X.request,
    Box = X.ui.MsgBox,
	getCfg = X.getCfg,
	getWb = X.getWb;

X.use('action')

// 增加全局action拦截器，
// 对于要求登录的action转至登录页面
.addFilter(function( e, act){
    // 如果e:name未注册action或者action.na未设置为true
    // 则操作前要求用户登录

	if( !act || !act.na ){
		var uid = X.getUid(),
			siteUid = X.getSiteUid(),
			loginType = getCfg('loginCfg');

		if (!uid){
			if (siteUid){
				if (e.get('e')=='lg')
					X.ui.oAuthLogin.show('bind');
				else 
					window.location = R.mkUrl('account', 'bind');
			} else {
				var special = e.get('t');
				if (special == 'sinaLogin')
					loginType = 1;

				switch (loginType) {
    				//使用新浪帐号与原有站点帐号并存方式登录
    				case 3:
    					X.use('LoginBox', {siteName: getCfg('siteName')})
    					.display(TRUE);
    
    					break;
    
    				//仅使用原有站点帐号登录
    				case 2:
    					window.location = R.mkUrl('account','siteLogin');
    					break;
    
    				//仅使用新浪帐号直接登录
    				case 1:
    				default:
    					X.ui.oAuthLogin.show();
				}
			}
			return FALSE;
		}	
    }
}, TRUE)

// 发布微博弹框，send
.reg('sd', function( e ){
    var box = X.use('postBox');
    var text = e.get('m');
    box.display(TRUE)
       .reset()
       .selectionHolder.setText(text||'');
    if(text)
        box.checkText();
    if(e.data.format)
        box.htmlFormat = e.data.format;
})

// 微博转发弹框，forward
.reg('fw', function( e ){
    var wbId = e.get('w');
    // 打开转发框
    var fb = Xwb.use('forwardBox');
    fb.display(true)
      .setContent(wbId, getWb(wbId), X.getUid())
      .selectionHolder
      .focusStart();
})

// 加关注，follow
.reg('fl', function( e ){
    var uid    = e.get('u');
    var jqTrig = $(e.src);
    
    // 设置action提交标记，可有效防止重复响应
    e.lock(1);
    R.follow(uid, 0, function( ed ){
        // #1020805，用户先前已关注，但由于缓存未更新引起，现作为关注成功处理
        if( ed.isOk() || ed.getCode() == '1020805'){
			var type = e.get('t');
			var $src = $(e.src);
			switch (parseInt(type)) {
    			case 1: //今日话题、他的微博
    				$src.replaceWith('<span class="followed-btn">已关注</span>');
    			break;
    
    			case 2: //挂件栏
    				$src.replaceWith('<em>已关注</em>');
    			break;
    
    			default:
    				location.reload();
			}
        }else {
            Box.tipWarn(ed.getMsg());
        }
        e.lock(0);
    });
})

.reg('rs', function(e){
    var wbId = e.get('w');
    var wb = getWb(wbId);
    var box = Xwb.use('Box', {
    	cs:'win-report',
        contentHtml : 'SpanBoxContent',
        title:'举报不良信息',
        appendTo : document.body,
        closeable:true,
        autoCenter:true,
        mask:true,
        destroyOnClose : true,
        actionMgr:true,
        // html template data
        nick : wb.u.sn,
        img  : wb.u.p,
        text : wb.tx,
        onactiontrig:function(e){
            switch(e.data.e){
                case 'ok' :
                    var text = this.jq('#content').val();
                    R.reportSpam(wbId, text, function(ret){
                        if(ret.isOk()){
                            Box.success('', '您的举报已提交，我们将尽快处理，感谢您对我们工作的支持！');
                        }
                        box.close();
                    });
                break;
                
                case 'cancel':
                    this.close();
                break;
            }
        }
    });
    
    box.display(true)
       .center();
    box.jq('#content')
       .focus();
})

//取消关注
.reg('ufl', function(e) {
	Box.anchorConfirm(e.src,'确定要取消关注？', function(btnId){
        if(btnId == 'ok'){
            e.lock(1);
			var uid = e.get('u');
			var act = e.get('f');

			R.unfollow(uid, '', function(re) {
				if (re.isOk()){
				
					if (act == 1){
						$(e.src).replaceWith('<a rel="e:fl,t:2" href="#">关注他</a>');
					} else {
						window.location.reload();
					}
				} else {
					Box.tipWarn(re.getMsg());
				}
			    e.lock(0);
			});
		}
	});
})

.reg('blm', function(e){
	 Box.anchorConfirm(e.src,'确定要屏蔽该微博？', function(btnId){
        if(btnId == 'ok'){
            var wbId = e.get('w');
            e.lock(1);
            R.shieldBlog(wbId, function( r ){
                if( r.isOk() ){
                    Box.anchorTipOk(e.src, '屏蔽成功！');
                    $(e.src).replaceWith('<span>已屏蔽</span>');
                }
                e.lock(0);
            });
        }
    });
})

//刷新页面
.reg('rl', function(){
	location.reload();
}, {na: TRUE})

// 收藏, favourite
.reg('fr', function( e ){
    var wbId = e.get('w');
    e.lock(1);
    R.fav(wbId, function( r ){
        if( r.isOk() ){
            Box.anchorTipOk(e.src, '收藏成功！');
            $(e.src).replaceWith('<span>已收藏</span>');
        }else {
            Box.tipWarn(r.getMsg());
        }
        e.lock(0);
    });
})

//取消收藏
.reg('ufr', function(e) {
	 Box.anchorConfirm(e.src,'确定要删除该收藏？', function(btnId){
        if(btnId == 'ok'){
            e.lock(1);
			var wbId = e.get('w');
			R.delFav(wbId, function( r ){
				if( r.isOk() ){
					if (getCfg('page') == 'fav'){
						var $li = $(e.getEl('w'));
						$li.slideUp(500, function() {
							$li.remove();	
							e.lock(0);
						})
					} else {
						$(e.src).replaceWith('<a rel="e:fr" href="#">收藏</a>');
						e.lock(0);
					}
				}
			});
		}
	 })
})

// 评论 comment
.reg('cm', function( e ){
     var wbId = e.get('w'),
         itemEl = $( e.getEl('w') ),
         cmt = itemEl.data('xwb_cmt');
     
     if( !cmt ){
	   var wb = getWb(wbId);

       cmt =  X.use('CmtArea', {
                wbId:wbId, 
                wbUid    : wb && wb.u.id,
                appendTo : itemEl.find('.feed-content'), 
                trigEl : e.src
              });
       itemEl.data('xwb_cmt', cmt);
     }
     
     if(! cmt.display() ){
        cmt.display(TRUE);
        cmt.load(function(){
            cmt.cmtBox.jqInputor.focus();
        });
     }else cmt.display(FALSE);
})

// trun left 向左转
.reg('tl', function(e) {
	var $wb = $(e.getEl('w'));
	var wbEle = $wb.data('wbEle');

	if (!wbEle) {
		var wid = e.get('w');
		wbEle = X.use('WbElement', {$wb: $wb, wbData: getWb(wid)});
		
		$wb.data('wbEle', wbEle);
	}

	wbEle.trun('left');
}, {na:TRUE})

// trun right 向右转
.reg('tr', function(e) {
	var $wb = $(e.getEl('w'));
	var wbEle = $wb.data('wbEle');

	if (!wbEle) {
		var wid = e.get('w');
		wbEle = X.use('WbElement', {$wb: $wb, wbData: getWb(wid)});
		
		$wb.data('wbEle', wbEle);
	}

	wbEle.trun('right');
}, {na:TRUE})

//还原原来的缩略图片
.reg('zo', function(e) {
	var $wb = $(e.getEl('w'));
	var wbEle = $wb.data('wbEle');

	if (!wbEle) {
		var wid = e.get('w');
		wbEle = X.use('WbElement', {$wb: $wb, wbData: getWb(wid)});
		
		$wb.data('wbEle', wbEle);
	}

	wbEle.zoomOut();
}, {na:TRUE})

// zoom in 放大图片
.reg('zi', function( e ) {
	var $wb = $(e.getEl('w'));
	var wbEle = $wb.data('wbEle');

	if (!wbEle)
	{
		var wid = e.get('w');
		wbEle = X.use('WbElement', {$wb: $wb, wbData: getWb(wid)});
		
		$wb.data('wbEle', wbEle);
	}

	wbEle.zoomIn();

}, {na:TRUE})

// play video 播放视频
.reg('pv', function(e) {
	var $wb = $(e.getEl('w'));
	var wbEle = $wb.data('wbEle');

	if (!wbEle)
	{
		var wid = e.get('w');
		wbEle = X.use('WbElement', {$wb: $wb, wbData: getWb(wid)});
		
		$wb.data('wbEle', wbEle);
	}

	wbEle.playVideo(e);

}, {na:TRUE})

//close video
.reg('cv', function(e) {
	var $wb = $(e.getEl('w'));
	var wbEle = $wb.data('wbEle');

	if (!wbEle)
	{
		var wid = e.get('w');
		wbEle = X.use('WbElement', {$wb: $wb, wbData: getWb(wid)});
		
		$wb.data('wbEle', wbEle);
	}

	wbEle.closeVideo(e);
}, {na:TRUE})

// 删除我发布的微博
.reg('dl', function( e ){
    var wbId = e.get('w');
    Box.anchorConfirm(e.src,'确定删除该微博吗？', function(btnId){
        if(btnId === 'ok'){
            e.lock(1);
            R.del(wbId, function(re){
                var el = $(e.getEl('w'));
                if( re.isOk() ){
    				el.slideUp('normal', function(){
                        el.remove();
                        var countMarker = $('#user-weibo-count');
                        if( countMarker.length ){
                            var num = countMarker.text().match(/\d+/g);
                            countMarker.text(num-1);
                        }
                    });
                }else Box.tipWarn(re.getMsg());
                e.lock(0);
            });
        }
    });
})

//TA的微博、粉丝页 “更多”按键
.reg('mop', function(e) {
	var $ele = $(e.src);
	var layer = $ele.data('morelayer');

	if (!layer) {
		layer = X.use('MoreList', {
			view: $('#more_list')[0]
		});
		$ele.data('morelayer', layer);
	}

	layer.display(1);
})

// 发私信
.reg('sdm', function( e ){
    var myMsg = X.use('myMsg');
    myMsg.display(TRUE)
         .reset();
    var content = e.get('c');
    if(content)
        myMsg.selectionHolder.setText(content);
    var nick = e.get('n');
    if(nick)
         myMsg.jqSender.val(nick);
    
    if(nick)
        myMsg.jqContent.focus();
    else myMsg.jqSender.focus();
})

// 回复私信
.reg('rm', function( e ){
    X.use('myMsg').reply(
        e.get('u'), e.get('n')
    );
})

// 删除私信
.reg('dm', function(e){
	 Box.anchorConfirm(e.src,'确定要删除该私信？', function(btnId){
        if(btnId == 'ok'){
            e.lock(1);
            var mid    = e.get('m');
            R.delMsg(mid, function(rt){
                if(rt.isOk())
                    location.reload();
                
                e.lock(0);
            });
        }
    });
})

//删除黑名单
.reg('dbl', function(e) {
	
	function removeBl() {
		e.lock(1);
		var uid = e.get('u');

		R.blacklistDel(uid, '', function(r) {
			if (r.isOk())
			{
				location.reload();
			} else {
				Box.tipWarn(r.getMsg());
			}

			e.lock(0);
		});
	}

	var m = e.data.m;

	if (m)
	{
		Box.confirm('提示', m, function(bt) {
			bt === 'ok' && removeBl();
		});
	} else {
		removeBl();
	}

})

})(Xwb, $);