/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 */


(function(X, $){

var 
	UNDEFINED,

	FALSE = false,

	TRUE = true,

	NULL = null,
	
	ui = X.ui, 
    Util = X.util, 
    doc = document, 
    Base = ui.Base, 
    T = X.Tpl, 
    Req = X.request,
	hideCls = 'hidden',
    exceedCS = 'out140',
    MB = X.use('msgbox'),
	getCfg = X.getCfg,
	getUid = X.getUid,
	getWb = X.getWb,
	setWb = X.setWb;

ui.Emotion = X.reg('emotion', function(){

var inst = X.use('Box', {
    
	contentHtml: 'Loading',
    
    boxOutterHtml : 'ArrowBoxBottom',
    
    cs : 'win-emotion',
    
    appendTo : doc.body,
    
    closeable : TRUE,
        
    actName : 'em',
    
    contextable : TRUE,
    
    actionMgr : TRUE,

	emotions: NULL,

	//当前选中的分类
	$categorySelected: NULL,

	//当前显示的表情列表
	$categoryShowed: NULL,

	//分类索引->数据映射
	cateMaps: {},
    
    onactiontrig : function(e){
        switch(e.data.e){
            case 'em':
                if( this.onselect ){
                    if( this.onselect(this.findEmotionText(e), e) === FALSE)
                        return;
                }
                this.display(FALSE);
            break;

			case 'sc': //选择分类
				//console.debug(e);
				this.emSwitch(e.data.idx, e.src);
			break;
        }
    },
    
    setHandler : function(hd){
        this.onselect = hd;
        return this;
    },
    
    setSelectionHolder : function(selHolder, oninsert, scope){
        this.setHandler(function( selected ){
            selHolder.insertText(selected);
            oninsert && oninsert.call(scope||this, selHolder, selected);
        });
        return this;
    },
    
    showAt : function(anchor){
        var off = $(anchor).offset();
        off.left -= 22;
        off.top += 20;
        this.offset(off)
            .display(TRUE);
    },

	initEmotion: function(resp) {
		if (resp.isOk())
		{
			var data = resp.getData();
			
			var 

				emotions = {},
				hots = [],

				//模板值
				category = [],
				hotFaces = [],

				//分类索引ID
				cateIdx = 0,
				cateMaps = {};;


			$.each(data, function(i, e) {
				if (e.type != 'face')
				{
					return;
				}

				var cateName = e.category ? e.category: '默认';
				if (!emotions[cateName])
				{

					emotions[cateName] = [e];
					
					cateMaps[cateIdx] = emotions[cateName];

					category.push(['<a href="#" rel="e:sc,idx:',cateIdx,'">',cateName,'</a>'].join(''));

					cateIdx++;
					
				} else {
					emotions[cateName].push(e);
				}
				if (e.is_hot)
				{
					//hots.push(e);
					hots.push(['<a href="#" rel="e:em" title="' ,e['phrase'] ,'"><img width="22px" height="22px" src="', e['url'] ,'" /></a>'].join(''))
				}
			});

			var faceHtml = [];

			$.each(emotions['默认'], function(i, fc) {
				faceHtml.push(['<a href="#" rel="e:em" title="' ,fc['phrase'] ,'"><img width="22px" height="22px" src="', fc['url'] ,'" /></a>'].join(''));
			});

			if (hots.length > 15)
			{ //热门的只显示１５个
				hots = hots.slice(0, 15);
			}

			var assigns = {
				category: category.join(''),
				faces: faceHtml.join(''),
				hotList: hots.join('')
			};
			
			var $show = $(T.parse('EmotionBoxContent', assigns));

			this.jq('#xweibo_loading').hide();
			this.jq('#xwb_dlg_ct').append($show);

			this.$categorySelected = this.jq('#cate>a:first').addClass('current');
			this.$categoryShowed = this.jq('#flist0');

			this.emotions = emotions;
			this.cateMaps = cateMaps;
		}
	},

	/**
	 * 创建表情显示区
	 */
	createEmArea: function(i) {

		var faces = this.cateMaps[i];
		var html = ['<div class="e-list" id="flist' + i + '">'];

		$.each(faces, function(i, fc){
			html.push(['<a href="#" rel="e:em" title="' ,fc['phrase'] ,'"><img width="22px" height="22px" src="', fc['url'] ,'" /></a>'].join(''));
		});

		html.push('</div>');

		return $(html.join(''));
	},
	
	//切换分类
	emSwitch: function(i, src) {
		var $src = $(src);
		var current = 'current';

		if ($src.hasClass(current))
		{
			return;
		}
		this.$categorySelected.removeClass(current);
		this.$categorySelected = $src.addClass(current);

		this.$categoryShowed.addClass(hideCls);

		if (i > 0)
		{
			this.jq('#hotEm').addClass(hideCls);
		} else {
			this.jq('#hotEm').removeClass(hideCls);
		}
			

		var $show = this.jq('#flist'+i);

		if (!$show.length)
		{
			$show = this.createEmArea(i).appendTo(this.jq('#box'));
		}

		this.$categoryShowed = $show.removeClass(hideCls);
	},

	/**
	 * 加载表情数据
	 */
	loadEmotion: function() {
		var self = this;
		Req.getEmotion(function(r) {
			self.initEmotion(r);
		});
	},

	onViewReady: function() {
		this.loadEmotion();
	},
  
    onInputRecev : function(){
        
    },
    
    findEmotionText : function(e){
        return e.src.title;
    }
});

// override function -> object
X.reg('emotion', inst, TRUE);

return inst;
});

ui.ForwardBox = X.reg('forwardBox', function(){

var inst = X.use('Dlg', {
    cs : 'win-forward',
    appendTo : doc.body,
    autoCenter : TRUE,
    dlgContentHtml : 'ForwardDlgContentHtml',
    title:'转发到我的微博',
    defBtn : 'forward',
    buttons : [
        {title:'转 发', id:'forward'},
        {title:'取 消', id:'cancel'}
    ],

    checkText : function(){
        var v = $.trim( this.jqInputor.val() );
        var left = Util.calWbText(v);
        if (left >= 0)
            this.jqWarn.html('您还可以输入'+left+'字')
                .removeClass(exceedCS);
        else
            this.jqWarn.html('已超出'+Math.abs(left)+'字')
                .addClass(exceedCS);
                
        return left>=0 && v;
    },
    
    
    onViewReady : function(){
        this.jq('#xwb_face_trig')
            .click(Util.bind( this.onFaceTrig, this ));
            
        this.jqInputor = this.jq('#xwb_fw_input');
        this.jqWarn    = this.jq('#xwb_warn_tip');
        this.jqContent = this.jq('#xwb_forward_text');
        this.jqLabelCt = this.jq('#xwb_fw_lbl');
        
        this.jqInputor.bind('keyup', Util.bind( this.onInputorKeyup, this ));
        this.selectionHolder = X.use('SelectionHolder', {elem:this.jqInputor[0]});
    },
    
    onInputorKeyup : function(){
        this.checkText();
    },
    
    onFaceTrig : function(e){
        X.use('emotion')
         .setSelectionHolder( this.selectionHolder , this.checkText, this)
         .showAt(e.target);
        return FALSE;
    },
    
    setContent : function(wbId, wbData, uid){
        
        this._predCfg = { id : wbId, data : wbData, uid : uid };
        
        // Make sure view node is created
        this.jq();
        
        var otherCmts = [], text, inputText;
        
        if( uid !== wbData.u.id )
            otherCmts.push( T.parse( 'ForwardDlgLabel', {uid:wbId, nick:wbData.u.sn}) );
        
        var rt = wbData.rt;
        if (rt) {
            text = rt.tx;
            inputText = '//@' + wbData.u.sn + ':' + wbData.tx;
            
            if (rt.u.id != uid) 
                otherCmts.push( T.parse('ForwardDlgLabel', { uid: rt.id, nick: rt.u.sn }) );
        }
        else {
            text = wbData.tx;
            inputText = '';
        }
        
        this.jqContent.text( Util.escapeHtml( text ) );
        //this.jqInputor.val( inputText );
        this.selectionHolder.setText( inputText );
        this.checkText();
        this.jqLabelCt.html( otherCmts.join('') );
        
        return this;
    },
    
    submit : function(){
        
        if( this.isLoading )
            return FALSE;

        this.isLoading = TRUE;
        
        var v = this.checkText();
        if( v  === '' ){
            v = '转发微博';
        }else if( !v ){
            this.jqInputor.focus();
            this.isLoading = false;
            return FALSE;
        }
        
        var uids = [];
        this.jq('input[type="checkbox"]:checked').each(function(){
            uids[uids.length] = $(this).val();
        });
        
        var d = this._predCfg;
        Util.disable( this.getButton('forward') , TRUE);
        Req.repost(d.id, v, uids.join(','), Util.getBind(this, 'onSubmitLoad'));
    },
    
    onSubmitLoad : function( e ){
        
        Util.disable( this.getButton('forward') , FALSE);
        this.close();
        // todo : 关闭在tip隐藏后
        if(e.isOk())
            MB.tipOk('转发成功');
        else MB.tipError(e.getMsg());
        this.isLoading = FALSE;
    },
    
    onbuttonclick : function(bid){
        if( bid === 'forward' ){
            this.submit();
            return FALSE;
        }
    }
});

X.reg('forwardBox', inst, TRUE);

return inst;

});

/**
 * 
 * http://flowplayer.org/tools/toolbox/flashembed.html
 *
 * Since : March 2008
 * Date  :    Wed May 19 06:53:17 2010 +0000 
 * modify by : guolianghu
 * opts.height 高 （必须）
 * opts.width 宽 (必须）
 * opts.id dom-id
 * opts.name dom-name
 * opts.src flash地址 （必须）
 * opts.nocache 禁用cache （可选）
 * opts.w3c 
 * 
 * conf: 配置  （可选）
 */ 
ui.getFlash = function(opts, conf) {
	var IE = $.browser.msie;

	opts = opts || {};
	
	/******* OBJECT tag and it's attributes *******/
	var html = '<object width="' + opts.width + 
		'" height="' + opts.height + 
		(opts.id ? '" id="' + opts.id: '') + 
		(opts.name ? '" name="' + opts.name: '') + '"';
	
	if (opts.nocache) {
		opts.src += ((opts.src.indexOf("?") != -1 ? "&" : "?") + Math.random());		
	}
	
	if (opts.w3c || IE) {
		html += ' data="' +opts.src+ '" type="application/x-shockwave-flash"';		
	} else {
		html += ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"';	
	}
	
	html += '>'; 
	
	/******* nested PARAM tags *******/
	if (opts.w3c || IE) {
		html += '<param name="movie" value="' +opts.src+ '" />'; 	
	} 
	
	// not allowed params
	opts.width = opts.height = opts.id = opts.w3c = opts.src = NULL;
	opts.onFail = opts.version = opts.expressInstall = NULL;
	
	for (var key in opts) {
		if (opts[key]) {
			html += '<param name="'+ key +'" value="'+ opts[key] +'" />';
		}
	}	

	/******* FLASHVARS *******/
	var vars = "";
	
	if (conf) {
		for (var k in conf) { 
			if (conf[k]) {
				var val = conf[k]; 
				vars += k +'='+ (/function|object/.test(typeof val) ? f.asString(val) : val) + '&';
			}
		}
		vars = vars.slice(0, -1);
		html += '<param name="flashvars" value=\'' + vars + '\' />';
	}
	
	html += "</object>";	
	
	return html;
}

ui.WbElement = X.reg('WbElement', Util.create(Base,{
	//this.$wb jQuery li微博对象
	//this.wbData 数据对象

	init: function() {
		Base.prototype.init.apply(this, arguments);

		this.picLoadState = 0;

		this.isFw = this.wbData.rt ? 1: 0;

		this.$preview = this.$wb.find('div.preview-img');

		//console.log(this);
	},

	playVideo: function(e) {
		var wid = e.get('w'),
		vid = e.get('i'),
		urls = getCfg('urls'),
		info = urls[vid],
			
		width = this.$wb.find('div.feed-content').width() - 35,
			
		height = parseInt(width / 1.25),

		flash = ui.getFlash({
				src: info.flash,
				width: width,
				height: height,
				w3c: 1,
				id: 'sinaVideo_'+(+new Date()),
				quality: 'high',
				allowScriptAccess: 'always',
				wmode: 'transparent',
				allowFullscreen: 'TRUE',
				flashvars: 'playMovie=TRUE'
			}); 

		if (this.$video)
		{
			this.$video.remove();
		}
		
		var selector,html,tpl;

		if (this.isFw)
		{
			selector = 'div.forward>p';
			tpl = 'VideoBoxForward';
		} else {
			selector = 'p.feed-main';
			tpl = 'VideoBox';
		}

		html = T.parse(tpl, {
			href: info.url,
			title: info.title,
			flash: flash
		});

		this.$video = $(html).insertAfter(this.$wb.find(selector));

		this.switchView('video', 1);
	},

	closeVideo: function() {
		this.switchView('video', 0);
	},

	loadPic: function() {
		this.picLoadState = 1;

		var self = this, wbData = this.wbData;

		var cfg = this.isFw ? {
			org: wbData.rt['op'],
			img: wbData.rt['mp']
		}: {
			org: wbData['op'],
			img: wbData['mp']
		};

//		cfg.fw = this.isFw;

		var $thumbImg = this.$thumbImg = this.$wb.find('img.zoom-move');

		this.$loadEl = $('<div class="loading-img"></div>').appendTo($thumbImg.parent());

		var tpl;

		if (this.isFw)
		{
			tpl = 'PictureBoxForward';
		} else {
			tpl = 'PictureBox';
		}

		this.$picBox = $(T.parse(tpl, cfg));

		//'<img src="{.img}" class="narrow-move">';
		var img = this.img = new Image();

		$(img).bind('load', function() {
			self.onPicLoaded();
		})
		.addClass('narrow-move')
		.attr('rel', 'e:zo')
		.attr('src', cfg.img);
	},

	onPicLoaded: function() {
		var conSelector = this.isFw ? 'div.forward': 'div.feed-content:first';
		var $container = this.$wb.find(conSelector),
			img = this.img,
			$picBox = this.$picBox;

		$container.css('visibility', hideCls);

		var width = this.$wb.find('div.feed-content').width() - 35;

		//图标追加到box对象
		$(img).appendTo($picBox.find('div[name=img]'));
		$container.children('div.preview-img').after($picBox);

		this.switchView('pic', 1);


		if (img.width > width)
		{
			if ($.browser.msie)
			{
				img.height = img.height * (width/img.width);
			}
			img.width = width;
		}

		$container.css('visibility', '');

//$(img).show();

		this.$loadEl.remove();
		

		this.picLoadState = 2;

	},
	
	//图片放大
	zoomIn: function() {
		if (this.picLoadState == 0) {
			this.loadPic();
		} else if (this.picLoadState == 2) {
			this.switchView('pic', 1);
		}
	},

	//还原缩略图显示
	zoomOut: function() {
		this.switchView('pic', 0);
	},

	//图片转向
	trun: function(pos) {
		$(this.img).imgRotate(pos)
	},

	/**
	 * 切换显示区域
	 */
	switchView: function(type, isShow) {
		if (isShow)
		{
			if (type == 'pic')
			{
				this.$picBox.show();
		
				this.$video && this.$video.remove();
				this.$video = NULL;

			} else if(type == 'video') {
				this.$video.show();
				this.$picBox && this.$picBox.hide();
			}

			this.$preview.hide();
		} else {
			if (type == 'pic')
			{
				this.$picBox && this.$picBox.hide();
			} else if (type == 'video')
			{
				this.$video && this.$video.remove();
				this.$video = NULL;
			}

			this.$preview.show();
		}
		

	}
}));

/**
 *  pCt 接口方法：afterSend, postWeibo
 */
ui.CmtBox = X.reg('CmtBox', Util.create(Base, {
    actionMgr : TRUE,
    view : 'CmtBox',
    autoH : TRUE,
    wbUid : NULL,
    headPicType:1,
    innerViewReady : function( v ){
		this.wbUid = X.getUid();

        Base.prototype.innerViewReady.call(this, v);
        this.jqExtra('inputor', 'warn', 'sync');
        this.selectionHolder = X.use('SelectionHolder', {elem:this.jqInputor[0]});
        
        var self = this;
        this.jqInputor
        .bind('keyup', function(e){
             self.onInputorKeyup(e);
        });
    },
    
    reset : function(){
        this.getView();
        this.selectionHolder.setText('');
        this.jqSync.attr('checked', FALSE);
        this.checkText();
    },
    

    checkText : function(){
        var ipt = this.jqInputor, val = $.trim( ipt.val() );
        var left = Util.calWbText(val);
        if (left >= 0)
            this.jqWarn.html('还可以输入'+left+'字');
        else
            this.jqWarn.html('已超出'+Math.abs(left)+'字');
        
        // 检查高度，自动适应
        if( this.autoH && ipt.height() !== ipt[0].scrollHeight ) 
            ipt.css('height', ipt[0].scrollHeight);
 
        return left>=0 && val;
    },
    
    
    send : function(){
        if(!this.sending){
            var v = this.checkText();
            if( !v )
                setTimeout( Util.bind(function() { this.jqInputor.focus();}, this), 0 );
            else {
                if(this.sndBtn) 
                    Util.disable( this.sndBtn , TRUE );
                this.sending   = TRUE;
                var replyCmtId = this.jqInputor.data('xwb_reply_cid');
                if( replyCmtId && /^回复@.*?:/.test(v) )
                    Req.reply(
                      this.wbId, 
                      replyCmtId, 
                      v, 
                      this.jqSync.attr('checked')?1:0, 
                      this.headPicType, 
                      Util.getBind(this, 'onSendLoad'),
                      { data:{_route:X.getModule()} }
                    );
                else Req.comment( 
                      this.wbId, 
                      v, 
                      this.jqSync.attr('checked')?1:0, 
                      this.headPicType, 
                      Util.getBind(this, 'onSendLoad'),
                      { data:{_route:X.getModule()} }
                     );
            }
        }
    },
    
    onSendLoad : function( e ){
        if( e.isOk() ){
            this.pCt.afterSend(e);
            this.reset();
            // 同时发一条微博
            var data = e.getData();
            if( data.html ){
                this.pCt.postWeibo(data.wb, data.html);
            }
        }else {
            MB.tipWarn(e.getMsg());
        }
        this.jqInputor.focus();
        if(this.sndBtn) 
            Util.disable( this.sndBtn , FALSE);
        this.sending = FALSE;
    },
    
    reply : function(cmtId, nick){
        var holder = this.selectionHolder, 
            jq     = this.jqInputor,
            rex    = /^回复@.*?:/;
        holder.setText('回复@' + nick + ':' + jq.val().replace(rex, ''));
        jq.data('xwb_reply_cid', cmtId);
        setTimeout(function(){ holder.focusEnd(); }, 0);
    },
    
    onFaceTrig : function(e){
        X.use('emotion')
         .setSelectionHolder( this.selectionHolder , this.checkText, this)
         .showAt(e.src);
        return FALSE;
    },
        
    onInputorKeyup : function(e){
        this.checkText();
    },
    
    onactiontrig : function(e){
        switch ( e.data.e ){
            // 点击图标
            case 'ic' :
                this.onFaceTrig(e);
                break;
                
            // 点击评论按钮
            case 'sd' :
                if(!this.sndBtn)
                    this.sndBtn = e.src;
                this.send();
                break;
        }
    }
}));


// parent container interface :
// function:afterSend
// postWeibo
ui.CommentArea = X.reg('CmtArea', Util.create(Base, {
    
    view : 'CommentArea',
    
    readSize : 10,
    
    cmtType : 1,
    
    hdPicSz : 30,
    
    cmtCount : 0,
    
    page : 1,
	
    // html
    cmtBoxHtml:'CmtBox',
    commentHtml : 'Comment',
    // 开启action点击监听
    actionMgr : TRUE,
    cmtBox : 'CmtBox',
    
    initUI : function(){
        // prepare for templting
        this.cmtUrl = Req.mkUrl('show', '', 'id='+this.wbId);
        this.jqExtra('pre','first','next');
        Base.prototype.initUI.call(this);
    },
    
    getFromUser : function(){
        if(!this.wbUid) {
		  var wb = getWb(this.wbId);
          this.wbUid = wb && wb.u.id;
		}
        return this.wbUid;
    },
    
    innerViewReady : function( v ){
       Base.prototype.innerViewReady.call(this, v);
       this.jqExtra('cmtCt', 'more', 'lefCnt');
       this.initCmtBox();
    },
    
    decorateLoading : function(){
        if( this.isLoading ){
            $(T.get('Loading')).appendTo(this.getView().parentNode);
        }else $(this.getView().parentNode).find('#xweibo_loading').remove();
        this.display(!this.isLoading);
    },
    
    initCmtBox : function(){
       this.cmtBox    = X.use('CmtBox', {
            view : this.jq('#cmtBox')[0],
            wbId : this.wbId,
            pCt  : this,
            headPicType : this.hdPicSz==30?1:2
       });
       this.cmtBox.getView();
    },
    
    load : function(callback){
        // 确保view已创建
        this.getView();
        this.cmtBox.reset();
        
        if( !this.isLoading ){
            this.isLoading = TRUE;
            this.decorateLoading();
            callback && ( this.onload = callback );
            Req.getComments(this.wbId, this.page, this.cmtType,  Util.getBind(this, 'onCmtsLoad'));
        }
    },
        
    // callback by cmtBox
    postWeibo : function(wbData, htmls){
        var list = X.use('weiboList');
        if(list) 
            list.append(wbData.id, wbData, htmls);
    },
    
    // callback by cmtBox
    afterSend : function(e){
        this.jqCmtCt.prepend( $(this.createCmtUI(e.getData().comment)) );
        this.jqCmtCt.cssDisplay(TRUE);
        this.updateCmtCountUI(1, TRUE);
    },
    
    // 评论返回后
    onCmtsLoad : function( e ){
        
        if( e.isOk() ){
            this.createListUI( e );
			var total = e.getData().total;
            total && this.updateCmtCountUI( total );
            this.updateCmtPageUI(e.getData());
        }
        
        this.isLoading = FALSE;
        this.decorateLoading();
        if( this.onload )
            this.onload( e );
    },
    
    // 创建评论列表
    createListUI : function( e ){
        this.jqCmtCt.empty();
        var listData = e.getData();
        var lef = listData.total - Math.min( listData.limit, listData.total );
        var htmls = [];
        e.each(function(cmt){
            htmls[htmls.length] = this.createCmtUI(cmt);
        }, this);
        
        if(htmls.length){
            this.jqCmtCt.html( htmls.join('') );
            if( lef ){
                this.jqMore.cssDisplay(TRUE);
                this.jqLefCnt.text(lef);
            }else this.jqMore.cssDisplay(FALSE);
            this.jqCmtCt.cssDisplay(TRUE);
        }else {
            this.jqCmtCt.cssDisplay(FALSE);
            this.jqMore.cssDisplay(FALSE);
        }
    },
    
    createCmtUI : function(cmt){
        var wbUid = this.getFromUser(),
			UID = getUid();
        cmt.verifiedHtml = cmt.user.verified_html;
        cmt.usrUrl= cmt.user.profileUrl;
        cmt.picSz = this.hdPicSz;
        cmt.time  = cmt.create_at;
        if (wbUid === UID || cmt.uid === UID)
            cmt.canDel = TRUE;
        return T.parse( this.commentHtml, cmt );
    },
    
    updateCmtPageUI : function(pageInfo){
        // 如果存在分页按钮
        if(this.jqPre.length){
            this.jqPre.cssDisplay(this.page !== 1);
            // 第三页后显示首页按钮
            this.jqFirst.cssDisplay(this.page >= 3);
            this.jqNext.cssDisplay(pageInfo.total != 0);
        }
    },
    
    updateCmtCountUI : function(count, cal){
        if( this.trigEl ){
            if(cal===UNDEFINED){
                $ (this.trigEl).text('评论('+count+')');
                this.cmtCount = count;
            }else { 
                this.cmtCount += count;
                $ (this.trigEl).text('评论('+this.cmtCount+')');
            }
        }
    },
    
    onactiontrig : function(e){
        switch ( e.data.e ){
            // 点击回复
            case 'rp' :
                this.onReplyTrig(e);
                break;
            case 'dl':
                this.onDelTrig(e);
                break;
            case 'nx' :
                this.goPage(this.page+1);
                break;
            case 'pr' :
                this.goPage(this.page-1);
            break;
            case 'fi':
                this.goPage(1);
            break;
        }
    },
    
    onDelTrig : function(e){
        var self = this;
        MB.anchorConfirm(e.src, '确定要删除该评论吗？', function(bid){
            if(bid === 'ok' && !self.deletingCmt){
                self.deletingCmt = TRUE;
                Req.delComment(e.get('c'), function(re){
                    var cmtEl = e.getEl('c');
                    if(re.isOk()){
                        $(cmtEl).remove();
                        self.updateCmtCountUI(-1, TRUE);
                        if(self.cmtCount == 0)
                            self.cmtBox.jqInputor.focus();
                    }else MB.tipError(re.getMsg());
                    self.deletingCmt = FALSE;
                });
            }
        });
    },
    
    onReplyTrig : function( e ){
        var cmtId = e.get('c'),
            nick  = e.get('n');
        this.cmtBox.reply(cmtId, nick);
    },
    
    goPage : function(page){
        this.page = page;
        this.load();
    }
}));

ui.MBlogCmtArea = X.reg('MBlogCmtArea', Util.create(ui.CommentArea, {
    
    commentHtml:'MBlogCmt',

	cmtType: 2,
	
	hdPicSz : 50,
    
    // override
    createListUI : function(e){
        this.jqCmtCt.empty();
        var listData = e.getData();
        var htmls = [];

		var facesize = this.faceSize;

        e.each(function(cmt){
			if (facesize){
				cmt.profileImg = cmt.profileImg.replace('/30/', '/'+facesize+'/');
			}

            htmls[htmls.length] = this.createCmtUI(cmt);
        }, this);

        if(htmls.length){
            this.jqCmtCt.html( htmls.join('') );
            this.jqCmtCt.cssDisplay(TRUE);
        }else {
            this.jqCmtCt.cssDisplay(FALSE);
            this.jqMore.cssDisplay(FALSE);
        }
    },
    
    initCmtBox : function(){
       this.cmtBox    = X.use('CmtBox', {
            wbId : this.wbId,
            pCt  : this,
            view : 'MBCmtBox',
            headPicType : this.hdPicSz==30?1:2
       });
       this.cmtBox.getView();
       this.topCmtBox = X.use('CmtBox', {
            wbId : this.wbId,
            pCt  : this,
            autoH : FALSE,
            view : this.topCmtBox,
            headPicType : this.hdPicSz==30?1:2
       });
       this.topCmtBox.getView();
    },
    
    updateCmtCountUI : $.noop,
    
    onReplyTrig : function(e){
       this.cmtBox.jq().insertAfter( e.jq('c').find('#trigs') );
        var cmtId = e.get('c'),
            nick  = e.get('n');
        this.cmtBox.display(TRUE).reply(cmtId, nick);
    },
    
    // callback by cmtBox, override
    postWeibo : $.noop,
    
    // callback by cmtBox
    afterSend : function(e){
        this.jqCmtCt.prepend( $(this.createCmtUI(e.getData().comment)) ).cssDisplay(TRUE);
        this.cmtBox.display(FALSE);
        this.topCmtBox.jqInputor.focus();
    },
    
    onload : function(){
        this.jq('#pager').cssDisplay(true);
        this.topCmtBox.jqInputor.focus();
    }
}));


ui.MyCmt = X.reg('MyCmt', Util.create(Base, {
    actionMgr : TRUE,
    innerViewReady : function(v){
        Base.prototype.innerViewReady.call(this,v);
        this.jqExtra('cmtCt');
        var self = this;
        this.jqCmtCt.find('li').each(function(){
            $(this).hover(self.onItemMouseover, self.onItemMouseout);
        });
    },
    
    onItemMouseover : function(){
        var jqDel = $(this).data('dlEl');
        if(!jqDel){
            jqDel = $(this).find('a[rel=e:dl]');
            $(this).data('dlEl', jqDel);
        }
        jqDel.cssDisplay(TRUE);
    },
    
    onItemMouseout  : function(){
        var jqDel = $(this).data('dlEl');
        if(!jqDel){
            jqDel = $(this).find('a[rel=e:dl]');
            $(this).data('dlEl', jqDel);
        }
        jqDel.cssDisplay(FALSE);        
    },
    
    onactiontrig : function(e){
        switch(e.data.e){
            // 全选
            case 'sa':
                var checked = e.src.checked;
                this.selectAll(checked);
                e.preventDefault(FALSE);
            break;
            // 删除所有
            case 'da':
                this.delSelected();
            break;
            // 回复
            case 'rp':
                var el = e.jq('c', '#cmtBoxCt');
                var cid = e.get('c'), 
                    wid = e.get('w'),
                    nick = e.get('n');
                this.getCmtBox().jq().insertAfter(el);
                this.reply(wid, cid, nick);
            break;
            // 删除单条评论
            case 'dl':
                this.delCmt(e.get('c'), e.src);
            break;
        }
    },
    
    // interface
    afterSend : function(e){
        this.jqCmtCt.prepend( $(this.createCmtUI(e.getData().comment)) ).cssDisplay(TRUE);
        this.cmtBox.display(FALSE);
    },
    
    // interface
    postWeibo : $.noop,
    
    selectAll : function(b){
        this.jq('li label input:checkbox[rel=cdl],input:checkbox[rel=e:sa]').each(function(){
                if(!this.disabled)
                    this.checked = b;
        });
    },
    
    delSelected : function(){
        var sels = [], 
            globalActs = X.use('action'),
            stopEl = this.jqCmtCt[0];
        this.jqCmtCt.find('li label input:checkbox[rel=cdl]').each(function(){
            if(this.checked)
                sels.push(globalActs.getRel(this,'c',stopEl));
        });
        
        if(sels.length){
            MB.confirm('', '确定删除所有选择评论？', Util.bind(function(id){
                if(id=='ok'){
                    Req.delComment(sels.join(','), function(){
                        location.reload();
                    });
                }
            }, this));
        }
    },
    
    getCmtBox : function(){
        if(!this.cmtBox){
            this.cmtBox = X.use('CmtBox', {
               pCt  : this,
               view : 'MBCmtBox'
            });
            this.cmtBox.getView();
        }
        return this.cmtBox;
    },
    
    reply : function(wbId, cmtId, nick){
        var box = this.getCmtBox();
        box.wbId = wbId;
        box.selectionHolder.setText('');
        box.jqInputor.css('height','');
        box.display(TRUE)
           .reply(cmtId, nick);
    },
    
    delCmt : function(cmtId, anchorEl){
        MB.anchorConfirm(anchorEl, '确定要删除该回复吗？', function(id){
            if(id=='ok'){
                    Req.delComment(cmtId, function(){
                        location.reload();
                    });
            }
        });
    },
    
    createCmtUI : function(cmt){
        MB.tipOk('回复成功！');
    }
}));

// TODO:合并两个类作一个新基类
ui.VideoBox = X.reg('videoBox', function(){

var inst = X.use('Box', {
  	cs:' win-insert',
  	contentHtml:'MediaBoxContentHtml',
  	boxOutterHtml:'ArrowBoxBottom',
  	appendTo:doc.body,
  	actionMgr : TRUE,
    closeable : TRUE,
  	contextable : TRUE,
  	onViewReady:function(v){
  		this.jqInputor = this.jq('#xwb_inputor');
  		this.jqTip     = this.jq('#xwb_err_tip');
  		this.selectionHolder = X.use('SelectionHolder', {elem:this.jqInputor[0]});
  	},

  	onactiontrig : function( e ){
  		switch(e.data.e){
  			case 'ok':
                var v = this.checkText();
                if( v ){
                    this.onselect && this.onselect(v);
                    this.close();
                }else this.jqInputor.focus();
  			break;
  			// cancel
  			case 'cc':
  				this.close();
  			break;
  			// normal link
  			case 'nm':
  				this.onselect && this.onselect($.trim(this.jqInputor.val()));
  				this.close();
  			break;
  		}
  	},
  	
  	checkText : function(){
  	    var jqInputor = this.jqInputor, 
  	        holder = this.selectionHolder,
  	        v = $.trim(jqInputor.val());
  	    if(v == '' || v == 'http://'){
  	        setTimeout(function(){
  	            jqInputor.focus();
  	            holder.setText('http://');
  	            jqInputor.select();
  	        });
  	        return FALSE;
  	    }else if(!this.checkUrl(v)){
  	        this.jqTip.cssDisplay(TRUE);
  	        return FALSE;
  	    }
  	    return  v;
  	},
  	
  	
    checkUrl : function(url){
        return url.indexOf('http://') === 0;
    },
    
    showAt : function(anchor, onselect){
        this.onselect = onselect;
        var off = $(anchor).offset();
        off.left -= 140;
        off.top += 20;
        this.offset(off)
            .display(TRUE);
        var self = this;
        setTimeout( function(){
            self.selectionHolder.setText('http://');
            self.jqInputor.focus();
            self.jqInputor[0].select();
        }, 0);
        this.jqTip.cssDisplay(FALSE);
    }
});

X.reg('videoBox', inst, TRUE);

return inst;

});

ui.MusicBox = X.reg('musicBox', function(){

var inst = X.use('Box', {
  	cs:' win-insert',
  	contentHtml:'MusicBoxContentHtml',
  	boxOutterHtml:'ArrowBoxBottom',
  	appendTo:doc.body,
    closeable : TRUE,
  	actionMgr : TRUE,
  	contextable : TRUE,
  	onViewReady:function(v){
  		this.jqInputor = this.jq('#xwb_inputor');
  		this.jqTip     = this.jq('#xwb_err_tip');
  		this.selectionHolder = X.use('SelectionHolder', {elem:this.jqInputor[0]});
  	},

    
  	checkText : function(){
  	    var jqInputor = this.jqInputor,
  	        v = $.trim(jqInputor.val()),
  	        holder = this.selectionHolder;
  	        
  	    if(v == '' || v == 'http://'){
  	        setTimeout(function(){
  	            jqInputor.focus();
  	            holder.setText('http://');
  	            jqInputor[0].select();
  	        });
  	        return FALSE;
  	    }else if(!this.checkUrl(v)){
  	        this.jqTip.cssDisplay(TRUE);
  	        return FALSE;
  	    }
  	    return  v;
  	},
  	
  	checkUrl : function(url){
        return url.indexOf('http://') === 0;
  	},
  	
  	onactiontrig : function( e ){
  		switch(e.data.e){
  			case 'ok':
                var v = this.checkText();
                if( v ){
                    this.onselect && this.onselect(v);
                    this.close();
                }else this.jqInputor.focus();
  			break;
  			// cancel
  			case 'cc':
  			    this.onselect && this.onselect();
  				this.close();
  			break;
  			// normal link
  			case 'nm':
  				this.onselect && this.onselect($.trim(this.jqInputor.val()));
  				this.close();
  			break;
  		}
  	},
  	
    showAt : function(anchor, onselect){
        this.onselect = onselect;
        var off = $(anchor).offset();
        off.left -= 140;
        off.top += 20;
        this.offset(off)
            .display(TRUE);
        var self = this;
        setTimeout( function(){
            self.selectionHolder.setText('http://');
            self.jqInputor.focus();
            self.jqInputor[0].select();
        }, 0);
        this.jqTip.cssDisplay(FALSE);
    }
});

return inst;
});

ui.PostBase = {
    
    actionMgr : TRUE,

    initEx : function(){
        var jqInputor = this.jqInputor = this.jq('#xwb_inputor');
        var jqSendBtn = this.jqSendBtn = this.jq('#xwb_send_btn');
		var jqInputorParent = jqInputor.parent();
        
        this.jqWarn      = this.jq('#xwb_word_cal');
        this.jqImgFile   = this.jq('#xwb_img_file');
        this.jqBtnImg    = this.jq('#xwb_btn_img');
        this.jqUploadTip = this.jq('#xwb_upload_tip');
        this.jqPhotoName = this.jq('#xwb_photo_name');
        this.jqForm      = this.jq('#xwb_post_form');
        
        this.selectionHolder = X.use('SelectionHolder', {elem:this.jqInputor[0]});
        
        var self = this;
        
        this.jqImgFile.change(function(e){
            self.onImgFileChange(e);
        });
        
        if( this.btnHoverCS )
            jqSendBtn.hover(
                function(){ jqSendBtn.addClass(self.btnHoverCS); }, 
                function(){ jqSendBtn.removeClass(self.btnHoverCS); }
            );

        jqInputor.bind('keyup', function(e){
            self.onInputorKeyup(e);
        })
		.bind('focus', function(e) {
			jqInputorParent.addClass('post-focus');
		})
		.bind('blur', function() {
			jqInputorParent.removeClass('post-focus');	
		});
    },

    getUploader : function(){
        if(!this.uploader)
            this.uploader = X.use('Uploader', {
                form:this.jqForm[0], 
                action : Req.mkUrl('api/weibo/action', 'upload_pic'),
                onload:Util.getBind(this, 'onUploadLoad')
            });
        return this.uploader;
    },
    
    reset : function(){
        this.jqUploadTip.cssDisplay(FALSE);
        this.jqPhotoName.cssDisplay(FALSE);
        this.jqBtnImg.cssDisplay(TRUE);
        this.jqForm.cssDisplay(TRUE);
        this.jqImgFile.val('');
        this.selectionHolder.setText('');
        this.jqForm[0].reset();
        this.uploadPic = FALSE;
        this.checkText();
        return this;
    },
    
    onactiontrig : function(e){
        switch(e.data.e){
            case 'sd' :
                this.post();
                break;
            case 'ic' :
                X.use('emotion')
                 .setSelectionHolder( this.selectionHolder , this.checkText, this)
                 .showAt(e.src);
            break;
            case 'vd' :
                 X.use('videoBox')
                  .showAt(e.src, Util.getBind(this, 'onBoxTextReturn'));
            break;
            case 'ms' :
                  X.use('musicBox')
                   .showAt(e.src, Util.getBind(this, 'onBoxTextReturn'));
            break;
            case 'tp' :
                this.insertTopic();
            break;
            // 删除已上传图片
            case 'dlp':
                this.uploadPic = FALSE;
                this.jqBtnImg.cssDisplay(TRUE);
                this.jqForm.cssDisplay(TRUE);
                this.jqPhotoName.cssDisplay(FALSE);
                this.jqInputor.focus();
                break;
        }
    },
    
    onBoxTextReturn : function(text){
        if(text)
            this.selectionHolder.insertText(text);
        this.checkText();
    },
    
    checkText : function(){
        var v = $.trim( this.jqInputor.val() );
        var left = Util.calWbText(v);
        if (left >= 0)
            this.jqWarn.html('您还可以输入<span>'+left+'</span>字')
                .removeClass(exceedCS);
        else
            this.jqWarn.html('已超出<span>'+Math.abs(left)+'</span>字')
                .addClass(exceedCS);
                
        return left>=0 && v;
    },
    
    checkImg : function(fileName){
		var pieces = fileName.split('.');
		return pieces.length && $.inArray(pieces.pop().toLowerCase(), ['jpg', 'png', 'gif','jpeg']) !== -1;
    },
    
    onInputorKeyup : function(){
        this.checkText();
    },
    
    TOPIC_TIP : '请在这里输入自定义话题',
    
    insertTopic : function(topic){
        if(!topic)
            topic = this.TOPIC_TIP;
        var inputor = this.jqInputor[0];
        var hasCustomTopic = new RegExp('#'+this.TOPIC_TIP+'#').test(inputor.value);
        var text = topic, start=0,end=0;
        
        inputor.focus();
        
        if (document.selection) {
            var cr = document.selection.createRange();
            //获取选中的文本
            text = cr.text || topic;
        
            //内容有默认主题，且没选中文本
            if (text == topic && hasCustomTopic) {
                start = RegExp.leftContext.length + 1;
                end   =   topic.length;
            }
            //内容没有默认主题，且没选中文本
            else if(text == topic) {
                cr.text = '#' + topic + '#';
                start = inputor.value.indexOf('#' + topic + '#') + 1;
                end   = topic.length;
            }
            //有选中文本
            else {
                cr.text = '#' + text + '#';
            }
        
            if (text == topic) {
                cr = inputor.createTextRange();
                cr.collapse();
                cr.moveStart('character', start);
                cr.moveEnd('character', end);
            }
        
            cr.select();
        }
        else if (inputor.selectionStart || inputor.selectionStart == '0') {
            start = inputor.selectionStart;
            end = inputor.selectionEnd;
        
            //获取选中的文本
            if (start != end) {
                text = inputor.value.substring(start, end);
            }
        
            //内容有默认主题，且没选中文本
            if (hasCustomTopic && text == topic) {
                start = RegExp.leftContext.length + 1;
                end = start + text.length;
            }
            //内容没有默认主题，且没选中文本
            else if (text == topic) {
                inputor.value = inputor.value.substring(0, start) + '#' + text + '#' + inputor.value.substring(end, inputor.value.length);
                start++;
                end = start + text.length;
            }
            //有选中文本
            else {
                inputor.value = inputor.value.substring(0, start) + '#' + text + '#' + inputor.value.substring(end, inputor.value.length);
                end = start = start + text.length + 2;
            }
        
            //设置选中范
            inputor.selectionStart = start;
            inputor.selectionEnd = end;
        }
        else {
            inputor.value += '#' + text + '#';
        }
        
        this.checkText();
        this.selectionHolder.saveSpot();
    },
    
    post : function(){
        var text = this.checkText();
        
        if(!text){
            this.jqInputor.focus();
            return;
        }

        if( this.getUploader().isLoading() ){
            MB.tipWarn('图片正在上传，请稍候..');
            return;
        }
        
        if(this.sending){
            MB.tipWarn('正在发布,请稍候..');
            return;
        }
        
        
        this.sending = TRUE;
        
        // 传递当前页面标识_route，以返回不同HTML内容
        Req.post(text, Util.getBind(this, 'onSendLoad'), this.uploadPic, { data : {_route:X.getModule() }});
    },
    
    onImgFileChange : function(){
        var jq = this.jqImgFile;
        var fn = jq.val(), self = this;
        
        this.uploadPic = NULL;
        
        if( !fn || !this.checkImg(fn) ){
            this.jqForm[0].reset();
            MB.alert('', '只支持 jpg、png、gif 的图片。', function(){
                self.jqInputor.focus();
            });
            return ;
        }
        this.jq('#xwb_upload_tip').cssDisplay(TRUE);
        this.jqForm.cssDisplay(FALSE);
        this.jqBtnImg.cssDisplay(FALSE);
        // add submit disabled class
	    this.getUploader().upload();
    },
    
    onUploadLoad : function(ret){
        var e = Req.parseProtocol(ret);
        if( e.isOk() ){
            var data = e.getData();
            this.uploadPic = data.msg;
            this.jqPhotoName.html(Util.getFileName(this.jqImgFile.val(), 10) + T.get('UploadImgBtn') );
            this.jqPhotoName.cssDisplay(TRUE);
            !$.trim(this.jqInputor.val()) && this.selectionHolder.setText('分享图片');
            this.checkText();
        }else {
            MB.alert('', e.getMsg());
            this.jqBtnImg.cssDisplay(TRUE);
            this.jqForm.cssDisplay(TRUE);
        }
        this.jqUploadTip.cssDisplay(FALSE);
        this.jqForm[0].reset();
        this.jqInputor.focus();
        // remove disabled class
    },
    
    onSendLoad : function( e ){
        var jqInputor = this.jqInputor;
        if(e.isOk()){
            var jqMask = this.jq('#xwb_succ_mask');
            jqMask.show()
                  .cssDisplay(TRUE);
            jqInputor.focus();
            jqMask.fadeOut(1800, function(){
                jqMask.cssDisplay(FALSE);
                jqMask[0].style.display = '';
            });
            this.reset();

            // 插入到weibo list
            var weiboList = X.use('weiboList');
            			
			if(weiboList){
                var d = e.getData();
				$.each(d.data, function(id, dt) {
					weiboList.append(id, dt, d.html);
				});
            }
            //
        }else {
            MB.alert('', e.getMsg(), function(){
                Util.focusEnd(jqInputor[0]);
            });
        }
        this.sending = FALSE;
    }
};

// 这写法是调用时才实例化
X.reg('postBox', function(){
    
    var inst = $.extend({}, ui.PostBase);
    
    $.extend(inst, {
        
        title : '发微博',
        
        closeable : TRUE,
        autoCenter : TRUE,
        appendTo : doc.body,
        
        mask : TRUE,
        
        cs : 'win-post',
        
        contentHtml : 'PostBoxContent',

        onViewReady : function(v){
            this.initEx();
        },
        
        onbuttonclick : function(bid){
            if( bid == 'ok'){
                this.post();
                // 取消对话框关闭
                return FALSE;
            }
        },
        
        // override
        
        onSendLoad : function(e){
            ui.PostBase.onSendLoad.call(this, e);
            if( e.isOk()){
                var self = this;
                setTimeout(function(){
                    self.close();
                    self.jq('#xwb_succ_mask')
                        .hide()
                        .cssDisplay(FALSE);
                }, 500);
            }
        }
    });
    
    inst = X.use('Box', inst);
    
    X.reg('postBox', inst, TRUE);
    
    return inst;
});


ui.WeiboList = X.reg('WeiboList', Util.create(Base, {
    
    ctNode : '#xwb_weibo_list_ct',
    
    innerViewReady : function(v){
        Base.prototype.innerViewReady.call(this, v);
        this.jqCt = this.jq(this.ctNode);

        this.wbList = getWb();
    },
    
    append : function(id, item, html){
        this.item(id, item);

        if(html){
            html = $.trim(html);
            var self = this;
            $(html).prependTo(this.jqCt)
                   .hide()
                   .fadeIn(1000, function(){
                        var obj = {};
                        obj[id] = item;
                        self.renderLink(obj);
                   });
        }
    },
    
    item : function(id, v){
        if( v === UNDEFINED )
            return getWb(id);
        setWb(id, v);
    },
    
    renderLink : function(envlope){
		ui.linkRender(envlope);
    }
	
}));

ui.SearchEntry = X.reg('SearchEntry', Util.create(Base, {
    focusText : '搜索微博/找人',
    focusCs   : 'search-box-focus',
    // 30个字节
    maxLen    : 30,
    
    innerViewReady : function(v){
        Base.prototype.innerViewReady.call(this, v);
        var jqInputor = this.jqInputor = this.jq('#xwb_inputor'),
            jqTrigBtn = this.jq('#xwb_trig'),
            self = this;

        jqTrigBtn.click(function(){
            return self.submit();
        });
        
        
        jqInputor.keydown(function(e){
            var kc = e.keyCode;
            if(kc===13)
                self.submit();
            else {
              // var charCode = String.fromCharCode(e.which);
              // console.log(e.which);
              // Util.byteLen($.trim(this.value)) >= self.maxLen
            }
        });
        
        if(this.focusText)
            jqInputor.focusText(this.focusText, this.focusCs, this.getView());
    },

 
    submit : function(){
        var kw = $.trim(this.jqInputor.val());
        if(kw == this.focusText)
            kw = '';
        if(!kw){
            this.jqInputor.focus();
        }else {
            var kw = encodeURIComponent( Util.byteCut(kw, this.maxLen) ),
                url = Req.mkUrl('search','', 'k=' + kw);
            window.location.href = url;
        }
    }
}));


(function() {

	function getShortID(data) {
		var data = data || getWb();
		
		var result = {
			urls: [],
			map: {}
		}, tmp, url_id;

		if (data) {
			var matchs, map = result.map, urls = result.urls;
			
			var reg = /http:\/\/sinaurl\.cn\/([0-9a-z]+)/gi;
			
			for (var i in data) {

				$.each([data[i], data[i].rt], function(idx, ele){
					if (!ele) 
						return;
					var txt = ele.tx;
					
					while (reg.test(txt)) {
						url_id = RegExp.$1;
						
						if (!map[url_id]) {
							map[url_id] = [];
						}
						
						urls.push(url_id);
						map[url_id].push([i, idx]);
					}
				});
			}
		}

		return result.urls.length ? result : NULL;
	}

	/**
	 * @param domWb 微博
	 * @sid 短链接
	 * @linkInfo 短链接信息
	 */
	function urlRender(domWb, link_id, info, isFw) {
		var type = info.type, link = 'http://sinaurl.cn/'+link_id, $domWb = $(domWb);

		var $forward = $domWb.find('div.forward'),
			$feedMain = $domWb.find('p.feed-main'),
			$links;

		if (isFw)
		{
			$links = $forward.next('p').find('a[href='+link+']');
		} else {
			$links = $feedMain.find('a[href='+link+']');
		}

		switch (type)
		{
			case 'music':
				$links
				.attr('title', info.url)
				.addClass('icon-music-url icon-bg');
				break;
			
			case 'video':
				$links
				.attr('title', info.title)
				.addClass('icon-video-url icon-bg');

				//检测是否有preview的div，没就生成
				var $preview;
				if (isFw)
				{
					$preview = $forward.find('>div.preview-img');
					if (!$preview.length)
					{
						$preview = $(T.parse('PreviewBox')).appendTo($forward);
					}
				} else {
					$preview = $feedMain.next('div.preview-img');
					if (!$preview.length)
					{
						$preview = $(T.parse('PreviewBox')).insertAfter($feedMain);
					}
				}

				//URL在转发区->添加缩略图
				//URL在非转发并且该微博是原创 -> 添加缩略图
				if (isFw || (!isFw && !$forward.length))
				{
					$links.attr('rel', 'e:pv,i:'+link_id);
					var thumb = T.parse('VideoThumbHtml', {img: info.screen,id:link_id});
					$(thumb).appendTo($domWb.find((isFw? 'div.forward ':'')+'div.preview-img'));
				}
				break;

			case 'url':
			default:
				$links.attr('title', info.url)
				break;
		}
	};

	ui.linkRender = function(data) {
        
        var ids = getShortID(data);
		
		if (!ids)
		    return;

		Req.sinaurl(ids.urls.join(','), function(e) {
			var CFG = X.cfg;

			if (e.isOk()) {
				var data = e.raw.data;
				var map = ids.map;

				if (CFG.urls)
				{
					$.each(data, function(sid, dat) {
						CFG.urls[sid] = dat;
					});

				} else {
					CFG.urls = data;
				}

				$.each(data, function(k, info) {

					$.each(map[k], function(i, m) {
						var wid = m[0], 
							isFw = m[1];

						urlRender($('div.feed-list>ul>li[rel=w:' + wid + ']'), k, info, isFw);
					});
				});
			}
		});
	}
})();

/**
 * 私信
 */
X.reg('myMsg', function(){

var inst = X.use('Box', function(proto){

return {
    contentHtml:'PrivateMsgContent',
    appendTo:doc.body,
    cs:'win-mes',
    actionMgr : TRUE,
    title:'发私信',
    autoCenter : TRUE,
    closeable:TRUE,
    mask:TRUE,
    onViewReady : function( v ){
        var self = this;
        this.jqExtra('word', 'warn', 'sender', 'content', 'warnPos', 'uid');
        this.jqContent.keyup(Util.bind(this.checkText, this));
        this.jqSender.blur(function(){
            var v = $.trim(this.value);
            self.checkFans(v,1,NULL,TRUE);
        });
        this.selectionHolder = X.use('SelectionHolder', {elem:this.jqContent[0]});
    },
    
    checkText : function(){
        var v = $.trim(this.jqContent.val()),
            left = Util.calWbText(v, 140);
        this.jqWord.html(
            left >= 0 ? '您还可以输入'+left+'个字' : '已超出' + Math.abs(left) + '字'
        );
        return left>=0 && v;
    },
    
    afterShow : function(){
        proto.afterShow.call(this);
        if( this.jqSender.val() === '' )
            this.jqSender.focus();
        else this.jqContent.focus();
    },
    
    onactiontrig : function( e ){
        switch(e.data.e){
            // 点击发送
            case 'sd' :
                this.send();
            break;
            case 'ic':
                 X.use('emotion')
                  .setSelectionHolder( this.selectionHolder , this.checkText, this)
                  .showAt(e.src);
            break;
        }
    },
    
    send : function(){
        if(!this.sending){
            var d = this.validate(), 
                fn = Util.getBind(this, 'onSendLoad'),
                sndBtn = this.jqSendBtn;
            if(d){
                this.checkFans( d.u, d.t, function(){
                    Util.disable( sndBtn, TRUE);
                    Req.msg(d.u, d.t, d.c, fn);
                });
            }
        }
    },
    
    onSendLoad : function( e ){
        if(e.isOk()){
            this.display(FALSE);
            location.reload();
        }else {
            var msg;
            switch(e.getCode()){
                case 20014:
                    MB.alert('', e.getMsg());
                    break;
                case 1010005:
                    alert('内容长度不能超过140个字。');
                    this.jqContent.focus();
                    break;
                default : msg = e.getMsg();
            }
            if(msg && this.display()){
                this.jqWarnPos.cssDisplay(TRUE).text(msg);             
            }
        }
        this.sending = FALSE;
        Util.disable( this.jqSendBtn, FALSE);
    },
    
    checkFans : function(user, type, onsuccess, disableFocus){
		 var self = this; 

		if (!user)
		{
			self.jqWarnPos.cssDisplay(TRUE)
                .text('请输入要发送的用户昵称。');
			return;
		}

          // 对方是否为我的粉丝
          Req.followed(
            user,
            function( e ){
                if(e.isOk()){
                    if(e.getData()){
                        self.jqWarnPos.cssDisplay(FALSE);
                        onsuccess && onsuccess.call(this, e);
                    }else {
                        self.jqWarnPos.cssDisplay(TRUE)
                            .text(Req.ERRORMAP['20016']);
                        !disableFocus && self.jqSender.focus();
                    }
                }else {
                    self.jqWarnPos.cssDisplay(TRUE)
                        .text(e.getMsg());
                    !disableFocus && self.jqSender.focus();
                }
            },
            type
          );
    },
    
    /***/
    reset : function(){
        this.jqSender.attr('disabled', FALSE).val('');
        this.jqContent.val('');
        this.jqUid.val('');
        this.jqWarnPos.cssDisplay(FALSE);
        return this;
    },
    
    validate : function(){
        var name    = $.trim(this.jqSender.val()),
            content = this.checkText(),
            uid     = this.jqUid.val();
        
        if(!name){
            this.jqSender.focus();
            return;
        }
        
        if(!content){
            if(!$.trim(this.jqContent.val()).length)
                alert('请输入私信内容。');
            else alert('内容长度不能超过140个字。');
            this.jqContent.focus();
            return;
        }
        
        if(uid)
            return {u:uid, c:content};
        return {u:name, c:content,t:1};
    },
    
    reply : function(uid, name){
        this.getView();
        this.reset();
        this.display(TRUE);
        this.jqSender.val(name).attr('disabled', TRUE);
        this.jqUid.val(uid);
        this.jqContent.focus();
    }
};

});



X.reg('myMsg', inst, TRUE);

return inst;

});

X.reg('notice', function( cfg ){

var inst = X.use('Layer', function(proto){

	var $WbTips = $('#new_wb_tips');
	
	function newWeiboNotice(num) {
		if ($WbTips.length)
		{
			if (parseInt(num))
			{
				$WbTips.show().css('display', 'block');
			} else {
				$WbTips.hide();
			}
			
		}
	};

    return $.extend({
        view : 'NoticeLayer2',
        hidden : TRUE,
        closeable : TRUE,
        actionMgr : TRUE,
        remindType:1, 
        // 关闭后是否清空消息
        clearOnClose : TRUE,
        // 该数组下标顺序对应后台返回的类型数组下标
        types : ['wbs', 'refer','cmts', 'fans', 'msgs'],
        interval : 30000,
        wbsUrl : Req.mkUrl('index'),
        referUrl : Req.mkUrl('index', 'atme'),
        cmtsUrl : Req.mkUrl('index', 'comments'),
        msgsUrl : Req.mkUrl('index', 'messages'),
        fansUrl : Req.mkUrl('index', 'fans'),
        initUI : function(){
            if( this.remindType )
                this.view = 'NoticeLayer';
            proto.initUI.call(this);
            this.getView();
            if(this.interval)
                this.doCheck();
        },
        
        push : function(type, num, isTotal){
            var jqItem = this.jq('#'+type);
            var jqCnt  = jqItem.find('#c');
            var cur    = parseInt(jqCnt.text());
            if(!isTotal)
                num += cur;
            if( num != cur ){
                jqCnt.text(num);
                if(num>0)
                    jqItem.cssDisplay(!!num);
            }
            
            if(num && !this.display())
                this.display(TRUE);
            else {
                // 假如所有分消息已为0,隐藏主面板
                var hidCnt = 0;
                for(var i=0,len=this.types.length;i<len;i++){
                    if( parseInt( this.jq('#'+this.types[i]).find('#c').text() ) == 0 )
                        hidCnt++;
                }
                if(hidCnt == len)
                    this.display(FALSE);
            }
        },
        
        onclose : function(){
            if(this.clearOnClose)
                this.clearUnread();
        },
        
        clearUnread : function(){
            var self = this;
            $.each(this.types, function(){
                var item = self.jq('#'+this);
                item.cssDisplay(FALSE);
                item.find('#c').text('0');
            });
            // 清零服务器
            Req.clearUnread('', $.noop);
        },
        
        latestWid:0,
        
        doCheck : function(){
            if(!this.checking){
                this.checking = TRUE;
                Req.unread(this.latestWid, Util.getBind(this, 'oncheckLoad'));
            }
        },
        
        oncheckLoad : function( e ){
            if(e.isOk()){
                var unread = e.getData().unread;
                for(var i=0,len=this.types.length;i<len;i++){
					if (i == 0)
					{
						newWeiboNotice(unread[i]);
					} else {
						if(unread[i])
							this.push(this.types[i], unread[i], TRUE);
					}
                }
            }
            this.checking = FALSE;
            
            if(this.interval){
                setTimeout(Util.getBind(this, 'doCheck'), this.interval);
            }
        }
    }, cfg);
});


X.reg('notice', inst, TRUE);

return inst;

});


// 换肤

X.reg('skin', function(opt){

var inst = X.use('base', $.extend({
    
    actionMgr : TRUE,
    
    skinSelectedCS : 'current',
    
    onViewReady : function(v){
        this.tab = X.use('Switcher', this.tab);
    },
    
    onactiontrig : function(e){
        switch(e.data.e){
            // change skin
            case 'cs' :
                this.change(e.get('sk'), e.get('id'));
                this.decorateSelected(e.src);
            break;
            // 保存
            case 'sv' :
                if(this.using){
                    this.save(this.using);
                }else {
                	this.display(FALSE);
                	this.reload();
                }
            break;
            // 取消
            case 'cc' :
                if(this.usedSkin)
                    this.change(this.usedSkin);
                this.close();
                this.reload();
            break;
        }
    },
    
    beforeHide : function(){
        // #IE7下，关闭浮层#header CSS样式表现不正确，需要reflow才能显示正确。
        if($.browser.msie){
            var dv = X.Cache.get('div');
            $('#wrapper').css('clear','both');
            X.Cache.put(dv);
        }
    },
    
    change : function(skin, id){
        var self = this;
        $('link[rel=stylesheet]').each(function(){
            if(this.href.indexOf('/skin.css') !== -1){
                // 保存最初skin，方便恢复
                if(!self.usedSkin)
                    self.usedSkin = this.href.match(/\/css\/(.*)\/skin.css/i)[1];
                this.href = this.href.replace(/\/css\/.*\/skin.css/i, '/css/'+skin+'/skin.css');
            }
        });
        this.using = id;
    },
    
    save : function(skinId){
        var self = this;
        Req.saveSkin(skinId, function(e){
            if(e.isOk()){
                self.display(FALSE);
                self.reload();
            }else MB.alert('', e.getMsg());
        });
    },
    
    reload : function() {
    	var reg = /skinset[^A-Za-z0-9\/]{1}1/g;
    	window.location = String(window.location.href).replace(reg, '');
    },
    
    decorateSelected : function(currentEl){
        if(!this.jqPreSel)
            this.jqPreSel = this.jq('#tabPanels .'+this.skinSelectedCS);
        this.jqPreSel.removeClass(this.skinSelectedCS);
        this.jqPreSel = $(currentEl);
        this.jqPreSel.addClass(this.skinSelectedCS);
    }
    
}, opt));

X.reg('skin', inst, TRUE);

return inst;
});

/**
 * 弹出oauth登录窗口
 */
ui.oAuthLogin = {
	logWin: NULL,

	show: function(action) {
		var logWin = this.logWin, self = this;

		if (logWin && !logWin.closed)
		{
			logWin.focus();

		} else {
			var act = action || '';
			this.logWin = window.open(
				Req.mkUrl('account', 'sinaLogin', 'popup=1&cb=' + act), 
				"logWin","resizable=1,location=0,status=0,scrollbars=0,width=510,height=400"
			);
			
			if (!window.loginCallback)
			{
				window.loginCallback = function(go) {
					self.logWin.close();
					if (go)
					{
						window.location.href = go;
					} else {
						var page = X.getCfg('page');
						//如果在首页或者广场，刷新
						if (!page.indexOf('pub') || !page.indexOf('index'))
						{
							window.location.reload();
						} else {
							window.location.href = Req.mkUrl('pub');
						}
					}
				}
			}
		}
	},
	
	bind: function(ele, type) {
		var type = type || 'click';

		var self = this;

		$(ele).bind(type, function() {
			self.show();
		});
	}
}

ui.LoginBox = X.reg('LoginBox', function(){

	var inst = X.use('Box', {
		
		contentHtml : 'Login',
		
		cs : 'win-bind-login win-fixed',
		
		appendTo : doc.body,

		mask:TRUE,

		siteName: getCfg('siteName'),

		siteLoginUrl: Req.mkUrl('account', 'siteLogin'),

		regUrl: X.getCfg('siteReg'),
		
		closeable : TRUE,
			
		onViewReady: function() {
			ui.oAuthLogin.bind(this.jq('#oauth'));
		}
	});

	// override function -> object
	X.reg('LoginBox', inst, TRUE);

	return inst;
});


/**
 * 更新页面上微博的评论、转发数
 */
ui.updateCount = function() {
	
	var ids = [],
		wbList = getWb();

	if (!wbList)
	{
		return;
	}

	$.each(wbList, function(id, dt) {
		ids.push(id);
		dt.rt && ids.push(dt.rt.id);
	});

	if (!ids.length)
	{
		return;
	}

	Req.counts(ids.join(','), function(e) {
		if (e.isOk())
		{
			var counts = e.getData();
			$.each(wbList, function(/*微博ID*/ id, /*对应的数据*/ dt) {
				var ct = counts[id];
				if (ct)
				{
					//原创区
					var $wb = $('div.feed-list>ul>li[rel=w:' + id + ']');

					if (ct[0]) //评论
					{
						$wb.find('#cm').text('评论(' + ct[0] + ')');
					}
					if (ct[1]) //转发数
					{
						$wb.find('#fw').text('转发(' + ct[1] + ')');
					}

					//转发区
					var rt = dt.rt;
					if (rt && (ct = counts[rt.id]))
					{
						var $forward = $wb.find('div.forward');
						if (ct[0])
						{
							$forward.find('a[rel=l:cm]').each(function() {
								$(this).text($(this).text() + '(' + ct[0] + ')');
							});
						}
						if (ct[1])
						{
							$forward.find('a[rel=l:fw]').each(function() {
								$(this).text($(this).text() + '(' + ct[1] + ')');
							});
						}
					}
				}
			});

			var hooks = ui.updateCount.hooks;
			hooks && $.each(hooks, function(i, fn) {
				fn(counts);
			});
		}
	});
}
ui.updateCount.hooks = [];
ui.updateCount.addHook = function(fn) {
	$.isFunction(fn) && ui.updateCount.hooks.push(fn);
}

/**
 * 今日话题切换效果
 */
ui.FadeShow = X.reg('FadeBox', Util.create(Base, {
	curr: 0,

	length: 0,

	duration: 300,
	
	delay: 5000,
	
	running: FALSE,

	runTimer: NULL,

	onViewReady: function() {
	  var j = this.jq;

	  this.$list = $(this.view).children();

	  this.length = this.$list.length;

	  var self = this;

	  $(this.view).mouseover(function() {
		  
		  self.stop();

	  }).mouseout(function(e) {

		  var relatedTarget = e.relatedTarget;

		  if (!relatedTarget || !$.contains(self.view, relatedTarget))
		  {
			  self.start();
		  }
	  });

	  this.start();
	},

	start: function() {
		if (this.length <= 1)
		{
			return;
		}

		if (!this.runTimer)
		{
			var self = this;

			this.runTimer = setTimeout(function() {
				self.fade();
			}, this.delay);

			this.running = TRUE;
		}
	},

	stop: function() {
		if (this.runTimer)
		{
			clearTimeout(this.runTimer);
			this.runTimer = NULL;
		}
		this.running = FALSE;
	},

	fade: function() {
	  //todo: 将要显示的元素
	  var curr = this.curr,
		  next = ++this.curr,
		  self = this;
	  
	 

	  if (next >= this.length)
	  {
		  this.curr = next = 0;
	  }

	  var $curr = $(this.$list[curr]),
		  $next = $(this.$list[next]);

		$curr.animate({'opacity': 0}, {
			'duration': self.duration,
			'complete': function() {
				$curr.addClass('next');

				$next.removeClass('next')
				.css({'opacity':0})
				.animate({'opacity':1}, {
					'duration': self.duration, 
					'complete': function() {
						self.runTimer = NULL;
						self.running && self.start();
					}
				})
			}
		});


	}
}));

//粉丝页、关注页飘过动作
ui.FriendList = X.reg('FriendList', Util.create(Base, (function(){

	function checkMouseOver(e, fn) {
		var li = e.currentTarget;
//		$(li).find('a.forjs-cancel-att').show();
		fn && fn.call(li);
	}

	function checkMouseOut(e, fn) {
		var li = e.currentTarget;
		var related = e.relatedTarget;

		if (!related || (li === related) || !$.contains(li, related))
		{
//			$(li).find('a.forjs-cancel-att').hide();
			fn && fn.call(li);
		}
	}

	return {
		onViewReady: function() {

			var self = this;

			var list = $(this.view).children();

			//鼠标飘过的事件
			$.each(list, function(i, li) {
				$(li).mouseover(function(e) {
					checkMouseOver(e, self.onMouseOver);
				})
				.mouseout(function(e) {
					checkMouseOut(e, self.onMouseOut);
				});
			});

			return this;

		}
	}
})())
);

//我的首页，聚焦位推广
X.reg('indexFocus', Util.create(Base, {
	actionMgr: TRUE,
	onactiontrig: function(e) {
		var data = e.data;
		switch (data.e){
    		case 'cls': //关闭
    			$.cookie(e.get('cn'), 1);
    			this.display(0);
    		break;
    
    		case 'do': //按键被点击
    			var op = data.op;
    			if (op == 1) //发主题微博
    			{
    				var postArea = X.use('postArea');
    				if(postArea)
    				    postArea.selectionHolder.insertText('#' + data.tp + '# ');
    			} else if (op == 2){
    				data.ln && window.open(decodeURIComponent(data.ln.replace(/\+/g, '%20')));
    			}
    		break;
		}
	}
}));


X.reg('MoreList', function(cfg) {
	var layer = X.use('Layer', $.extend({
	    
		closeable: TRUE,

		contextable: TRUE,

		actionMgr: TRUE,
		
		onactiontrig: function(e) {
			var data = e.data;
			var uid = e.get('u');

			switch (data.e){
    			case 'abl':
    				MB.confirm('提示', 
    				           '确定将'+data.nick+'加入到黑名单吗？<span>你和' + 
    				              (data.gender == 'f' ? '她': '他') + 
    				              '将自动解除关注关系，并且她不能再关注你，给你发评论、私信、@通知。</span>', 
    				           function(click) {
                					if (click === 'ok'){
                						Req.blacklistAdd(uid, '', function(e) {
                							if (e.isOk()) {
                								window.location.reload();
                							}
                						});
                					}
    				            });
    			break;
			}
		}
	}, cfg));

	X.reg('MoreList', layer, TRUE);

	return layer;
});

//数据上报
X.report = (function() {
	//上报地址
	var url = 'http://beacon.x.weibo.com/a.gif',

	//图片对象
		img,

		//用户ID，如果未登录，生成一个随机ID
		uid,

		//初始化上报参数
		reqOpt = {
			pjt: 'xwb',
			ver: '1.1.1',
			xt: 'stay'
		};

	//生成随机ID
	function genId(num) {
		var str = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		var len = str.length;

		var num = num || 16;

		var chars = ['u'], at;
		for (var i = 0 ;i< num ;i++)
		{
			at = Math.ceil(Math.random()*len)-1;
			chars.push(str.charAt(at));
		}

		return chars.join('');
	}

	//取得用户ID
	function getUid() {
		var uid = X.getCfg('uid');
		var cookieName = 'x3w4b';

		if (!uid)
		{
			uid = $.cookie(cookieName)

			if (!uid)
			{
				uid = genId();
				$.cookie(cookieName, uid, {
					expires: 90000
				});
			}

			return uid
		}

		return uid;
	}

	function report(params) {
		reqOpt.random = Math.random();
		reqOpt.uid = getUid();
		reqOpt.akey = X.getCfg('akey');

		var opt = $.extend(reqOpt, params);
		
		var qstrs = [];

		$.each(opt, function(i, k) {
			qstrs.push(i + '=' + encodeURIComponent(k));
		});

		img.src = url + '?' + qstrs.join('&');
	}

	//在线时长汇报
	var olReporter = (function() {
		var timer,
			//上报间隔
			interval = 1800000,
//			interval = 5000,

			//初始化状态
			inited = FALSE,
				
			bootTime = new Date().getTime(),

			lastTime = 0,
				
			uid;

		function init() {
			if (inited)
			{
				return;
			}

			uid = getUid();

			img = new Image();

			inited = TRUE;
		}

		function doReport() {
			var now = new Date().getTime();

			report({
				time: now - (lastTime ? lastTime: bootTime),
				p: X.getCfg('page')
			});

			lastTime = now;
		}

		return {
			start: function() {
				init();
				timer = window.setInterval(doReport, interval);
			},

			report: function() {
				!inited && init();
				doReport();
			}
		}
	})();

	return {
		start: function() {
			olReporter.start();
		},

		report: function() {
			olReporter.report();
		}
	}

})();

/**
 * @class Xwb.ax.AdMgm
 * 广告管理模块
 */
X.ax.AdMgm = {
    
    /**
     *  传入所有广告配置初始化广告内容管理。
     *  [{"flag":"global_bottom","cfg":{}},...]
     * @param {Array} adConfigList
     */
    init : function(adConfigList){
        adConfigList = this.cfgs = adConfigList || {};
        var gbls = !!this.globalHandlers, 
            hds = this.handlers;

        for(var i=0, len=adConfigList.length;i<len;i++){
            var ad = adConfigList[i];
            gbls && this.fireGlobal(ad);
            if(hds && hds[ad.flag])
                hds[ad.flag](ad, this);
        }
        this.inited = true;
    },
    
    fireGlobal : function(ad){
        var gbls = this.globalHandlers;
        if(gbls){
             for(var i=0,len=gbls.length;i<len;i++)
                gbls[i](ad, this);
        }
    },
    
    /**
     *  注册广告单元处理器。
     *  如果管理器已初始化，并且有匹配的广告单元，将立即执行处理器。
     *  如果已存在处理器，则重写。
     * @param {String} adId
     * @param {Function} handler handler(adInf, adMgr);
     */
    reg : function(adId, handler){
        // global
        if(handler === undefined){
            if(!this.globalHandlers)
                this.globalHandlers = [adId];
            else this.globalHandlers.push(adId);
        }else {
            if(!this.handlers)
                this.handlers = {};
            this.handlers[adId] = handler;
            if(this.inited)
                if(this.cfgs[adId])
                    handler(this.cfgs[adId], this);
        }
    },
    
    /**
     *  获得广告单元配置信息。
     *  如果参数为空，返回所有单元。
     *  @param {String} adId
     */
    getAd : function(adId){
        if(!adId)
            return this.cfgs;
        if(this.cfgs){
            for(var i=0;i<this.cfgs.length;i++)
                if(this.cfgs[i].flag == adId)
                    return this.cfgs[i];
        }
    }
};

})(Xwb, jQuery);
