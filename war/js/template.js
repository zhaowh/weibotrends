/**
 * 模板HTML可任意改，但ID和模板名称不能更改
 */
Xwb.Tpl = {
    Box : [
        '<div class="win-pop {.cs}">',
            '<div class="win-t"><div></div></div>',
            '<div class="win-con">',
                '<div class="win-con-in">',
                    '[?.title?{BoxTitlebar}?]',
                    '<div class="win-box" id="xwb_dlg_ct">',
                        '{.contentHtml}',
                    '</div>',
                '</div>',
                '<div class="win-con-bg"></div>',
            '</div>',
            '<div class="win-b"><div></div></div>',
			'[?.closeable?<a href="#" class="icon-close-btn icon-bg" id="xwb_cls" title="关闭"></a>?]',
            '{.boxOutterHtml}',
        '</div>'
     ].join(''),
     
     DialogContent : '{.dlgContentHtml}<div class="btn-area" id="xwb_dlg_btns">{.buttonHtml}</div>',
          
     BoxTitlebar : '<h4 class="win-tit x-bg"><span id="xwb_title">{.title}</span></h4>',
     
     Mask : '<div class="shade-div"></div>',
     
     ForwardDlgContentHtml : [
            '<p id="xwb_forward_text"></p>',
            '<div class="forward-tool"><span id="xwb_warn_tip">还可以输入140字</span><a href="#" class="icon-face-choose all-bg" id="xwb_face_trig"></a></div>',
            '<textarea id="xwb_fw_input"></textarea>',
            '<div id="xwb_fw_lbl"></div>'
     ].join(''),
     
     ForwardDlgLabel : '<label><input type="checkbox" value="{.uid}">同时作为{.nick}的评论发布</label>',
     
     MsgDlgContent : '<div class="tips-c"><div class="icon-alert all-bg" id="xwb_msgdlg_icon"></div><p id="xwb_msgdlg_ct"></p></div>',
     
     Button : '<a href="#" class="general-btn {.cs}" id="xwb_btn_{.id}"><span>{.title}</span></a>',

	EmotionHotList: '<div class="hot-e-list" id="hotEm">{.hotList}</div>',
     
     EmotionBoxContent : [
        '<div class="win-tab bottom-line" id="cate">',
		 '	{.category} ',
        '</div>',
        '<div class="emotion-box" id="box">',
			'{EmotionHotList}',
            '<div class="e-list" id="flist0">',
				'{.faces}',
            '</div>',
        '</div>'
     ].join(''),
     ArrowBoxBottom  : '<div class="arrow all-bg"></div>',
     EmotionIcon       : '<a href="javascript:;" title="{.title}" rel="e:em"><img src="{.src}"></a>',
     Loading : '<div id="xweibo_loading" class="loading"></div>',
     CommentArea : [
        '<div class="feed-comment box-style hidden">',
          '<div class="box-t skin-bg"><span class="skin-bg"></span></div>',
          '<div class="box-content">{.cmtBoxHtml}<ul id="cmtCt" class="hidden"></ul><div class="more-comment" id="more">后面还有<span id="lefCnt"></span>条评论，<a href="{.cmtUrl}">点击查看</a></div>',
          '</div>',
          '<div class="box-b skin-bg"><span class="skin-bg"></span></div>',
          '<span class="box-arrow skin-bg"></span>',
        '</div>'
    ].join(''),
    
    CmtBox : [
              '<div class="post-comment" id="cmtBox">',
                  '<div class="post-comment-main">',
                      '<a href="javascript:;" class="icon-face-choose all-bg" rel="e:ic"></a>',
                      '<a class="general-btn" href="javascript:;" rel="e:sd"><span>评论</span></a>',
                      '<div class="comment-keyin"><div><textarea class="comment-textarea" id="inputor"></textarea></div></div>',
                  '</div>',
                  '<div>',
                      '<span class="keyin-tips" id="warn">还可以输入140个字</span>',
                      '<label><input type="checkbox" id="sync"/>同时发一条微博</label>',
                  '</div>',
              '</div>'
   ].join(''),
    
    MBCmtBox : [
    '<div class="feed-comment box-style" id="cmtBox">',
        '<div class="box-t skin-bg"><span class="skin-bg"></span></div>',
        '<div class="box-content">',
            '<div class="post-comment">',
                '<div class="post-comment-main">',
                    '<a class="icon-face-choose all-bg" href="#" rel="e:ic"></a>',
                    '<a href="javascript:;" class="general-btn" rel="e:sd"><span>评论</span></a>',
                    '<div class="comment-keyin"><div><textarea id="inputor" class="comment-textarea"></textarea></div></div>',
                '</div>',
                '<div>',
                	'<!--当超过140个字时，class="keyin-tips over-limit"-->',
                	'<span class="keyin-tips" id="warn">还可以输入140个字</span>',
                    '<label><input type="checkbox" id="sync">同时发一条微博</label>',
                '</div>',
            '</div>',
                '</div>',
        '<div class="box-b skin-bg"><span class="skin-bg"></span></div>',
        '<span class="box-arrow skin-bg"></span>',
    '</div>'
    ].join(''),

    Comment : [
        '<li rel="c:{.id},n:{.nick}">',
            '<div class="user-pic">',
                '<a href="{.usrUrl}"><img src="{.profileImg}" title="{.nick}" alt="{.nick}的头像" width="{.picSz}" height="{.picSz}" /></a>',
            '</div>',
            '<div class="comment-content">',
                '<p><a href="{.usrUrl}">{.nick}{.verifiedHtml}</a>：{.text}<span>({.time})</span></p>',
                '<div>[?.canDel?<a href="javascript:;" rel="e:dl">删除</a>|?]<a href="javascript:;" rel="e:rp">回复</a></div>',
            '</div>',
        '</li>'
    ].join(''),
    
    MBlogCmt : [
        '<li rel="c:{.id},n:{.nick}">',
            '<div class="user-pic">',
                '<a href="{.usrUrl}"><img alt="" src="{.profileImg}" /></a>',
            '</div>',
            '<div class="comment-c">',
                '<p class="c-info"><a href="{.usrUrl}">{.nick}{.verifiedHtml}</a> {.text}({.time}) </p>',
                '<div class="c-for" id="trigs">',
                    '<a href="javascript:;" class="icon-reply icon-bg" rel="e:rp">回复</a>',
                '</div>',
                '{.cmtBoxHtml}',
                '[?.canDel?<a href="javascript:;" class="icon-del icon-bg" rel="e:dl">删除</a>?]',
            '</div>',
        '</li>'
    ].join(''),
    
    Followed : '<span class="followed-icon {.cs}">已关注</span>',

    MediaBoxContentHtml : [
			'<div class="insert-box">',
				'<p>请输入<a href="http://video.sina.com.cn" target="_blank">新浪播客</a>、<a href="http://www.youku.com" target="_blank">优酷网</a>、<a href="http://www.tudou.com" target="_blank">土豆网</a>、<a href="http://www.ku6.com/" target="_blank">酷6网</a>等视频网站的视频播放页链接</p>',
				'<input type="text" id="xwb_inputor"><a href="#" class="general-btn" rel="e:ok"><span>确定</span></a>',
				'<p class="error-tips hidden" id="xwb_err_tip">你输入的链接地址无法识别<span><a href="#" rel="e:cc">取消操作</a>或者<a href="#" rel="e:nm">作为普通的链接</a>发布。</span></p>',
			'</div>'
    ].join(''),

	PictureBox: [
		'<div class="box-style" style="display:none">',
		'	<div class="box-t skin-bg"><span class="skin-bg"></span></div>',
		'	<div class="box-content">',
		'   <div class="show-img"><p><a href="#" rel="e:zo" class="icon-piup icon-bg">收起</a>',
		'   <a href="{.org}" target="_blank" class="icon-src icon-bg">查看原图</a>',
		'   <a href="#" class="icon-trunleft icon-bg" rel="e:tl">向左转</a>',
		'   <a href="#" class="icon-trunright icon-bg" rel="e:tr">向右转</a></p>',
		'   <div name="img"></div></div>',
		'   </div>',
		'	<div class="box-b skin-bg"><span class="skin-bg"></span></div>',
		'	<span class="box-arrow skin-bg"></span>',
		'</div>'
	].join(''),
	
	//转发中的图片显示
	PictureBoxForward: [
		'<div class="show-img cutline" style="display:none">',
		'<p><a class="icon-piup icon-bg" rel="e:zo" href="#">收起</a><a class="icon-src icon-bg" target="_blank" href="{.org}">查看原图</a><a rel="e:tl" class="icon-trunleft icon-bg" href="#">向左转</a><a rel="e:tr" class="icon-trunright icon-bg" href="#">向右转</a></p>',
		'<div name="img"></div></div>'
	].join(''),

	PreviewBox: [
		'<div class="preview-img"></div>'
	].join(''),
	
	VideoThumbHtml: [
		'<div class="feed-img"><img width="120px" src="{.img}" alt="">',
		'<div class="video-view all-bg" rel="e:pv,i:{.id}"></div></div>'
	].join(''),
	
	VideoBox: [
		'<div class="box-style showbox" style="display:none">',
		'	<div class="box-t skin-bg"><span class="skin-bg"></span></div>',
		'	<div class="show-video box-content">',
		'   <p><a rel="e:cv" href="#" class="icon-piup icon-bg">收起</a><span>|</span><a title="{.title}" target="_blank" href="{.href}">{.title}</a></p>',
		'   <div>{.flash}</div></div>',
		'	<div class="box-b skin-bg"><span class="skin-bg"></span></div>',
		'	<span class="box-arrow skin-bg"></span>',
		'</div>'
	].join(''),

	VideoBoxForward: [
		'<div class="cutline show-video">',
		'<p><a rel="e:cv" href="#" class="icon-piup icon-bg">收起</a><span>|</span><a title="{.title}" target="_blank" href="{.href}">{.title}</a></p>',
		'<div>{.flash}</div></div>'
	].join(''),
    
    MusicBoxContentHtml : [
        '<div class="insert-box music-box">',
            '<p>请输入<a href="http://music.sina.com.cn/yueku/" target="_blank">新浪乐库</a>等音乐站点的音乐播放页链接</p>',
            '<input type="text" id="xwb_inputor"><a href="#" class="general-btn" rel="e:ok"><span>确定</span></a>',
            '<p class="error-tips hidden" id="xwb_err_tip">你输入的链接地址无法识别<span><a href="#" rel="e:cc">取消操作</a>或者<a href="#" rel="e:nm">作为普通的链接</a>发布。</span></p>',
        '</div>'
    ].join(''),
    
    UploadImgBtn : '<a href="#" rel="e:dlp" class="icon-close-btn icon-bg" title="删除"></a>',
    
    SearchDropdownList : '<ul class="head-searchlist"><li class="mouseover">含<span></span>的微博</li><li>名<span></span>的人</li></ul>',
    
    PrivateMsgContent : [
        '<div class="field"><label>发私信给:</label><input type="text" id="sender" /><em class="warn warn-pos hidden" id="warnPos">她还没有关注你,暂时不能发私信</em></div>',
        '<div class="field"><label>私信内容:</label><textarea id="content"></textarea></div>',
        '<input type="hidden" id="uid" value="">',
        '<div class="field pad">',
            '<div class="icon-face-choose all-bg fl" rel="e:ic"></div>',
            '<div class="fr">',
                '<span class="tips fl" id="word">您还可以输入140个字</span>',
                '<a class="general-btn highlight fl" href="javascript:;" rel="e:sd"><span>发送</span></a>',
            '</div>',
        '</div>'
    ].join(''),
    
    NoticeLayer : [
        '<div class="new-tips-fixed hidden">',
            '<h4 id="xwb_title">提示</h4>',
                '<p id="wbs" class="hidden"><span id="c">0</span>条新微博，<a href="{.wbsUrl}">点击查看</a></p>',
                '<p id="fans" class="hidden"><span id="c">0</span>个新粉丝，<a href="{.fansUrl}">点击查看</a></p>',
                '<p id="cmts" class="hidden"><span id="c">0</span>条新评论，<a href="{.cmtsUrl}">点击查看</a></p>',
                '<p id="msgs" class="hidden"><span id="c">0</span>封新私信，<a href="{.msgsUrl}">点击查看</a></p>',
                '<p id="refer" class="hidden"><span id="c">0</span>条微博提到了你，<a href="{.referUrl}">点击查看</a></p>',
            '<a href="#" class="icon-close-btn icon-bg" id="xwb_cls" ></a>',
        '</div>'
    ].join(''),
    
    NoticeLayer2 : [
        '<div class="new-tips">',
            '<a id="wbs" class="hidden" href="{.wbsUrl}"><span id="c">0</span>条新微博</a>',
            '<a id="fans" class="hidden" href="{.fansUrl}"><span id="c">0</span>个新粉丝</a>',
            '<a id="cmts" class="hidden" href="{.cmtsUrl}"><span id="c">0</span>条新评论</a>',
            '<a id="msgs" class="hidden" href="{.msgsUrl}"><span id="c">0</span>封新私信</a>',
            '<a id="refer" class="hidden" href="{.referUrl}"><span id="c">0</span>条微博提到了你</a>',
            '<a href="javascript:;" class="icon-close-btn icon-bg" id="xwb_cls"></a>',
        '</div>'
    ].join(''),
    
	//登录
	Login: [
		'<div class="login-area">',
		'	<span><a href="{.regUrl}">注册帐号</a></span><a class="btn-web-account bind-btn-bg" href="{.siteLoginUrl}">{.siteName}登录</a>',
		'	<span><a href="http://t.sina.com.cn/reg.php" target="_blank">开通微博</a></span><a class="btn-sina-account bind-btn-bg" href="#" id="oauth">新浪微博帐号登录</a>',
		'</div>',
		'<div class="bind-tips">提示：您可以使用{.siteName}帐号或新浪微博帐号登录本网站</div>'
	].join(''),
	
    PostBoxContent : [
        '<div class="post-box">',
            '<div class="key-tips" id="xwb_word_cal">您还可以输入<span>140</span>字</div>',
            '<div class="post-textarea skin-bg"><textarea id="xwb_inputor"></textarea></div>',
            '<div class="add-area">',
                '<a class="icon-face icon-bg" href="#" rel="e:ic">表情</a>',
                '<span class="pic_uploading hidden" id="xwb_upload_tip">正在上传..</span>',
                '<span class="hidden" id="xwb_photo_name"><a class="icon-close-btn icon-bg" href="#" ></a></span>',
                '<a class="icon-pic icon-bg" href="#" id="xwb_btn_img">图片</a>',
                '<a class="icon-video icon-bg" href="#" id="xwb_btn_vd" rel="e:vd">视频</a>',
                '<a class="icon-music icon-bg" href="#" id="xwb_btn_ms" rel="e:ms">音乐</a>',
                '<a class="icon-topic icon-bg" href="#" id="xwb_btn_tp" rel="e:tp">话题</a>',
            '</div>',
            '<div class="share-btn skin-bg" rel="e:sd"></div>',
            '<form class="upload-pic"  method="post"  enctype="multipart/form-data" id="xwb_post_form" action="" target="" id="xwb_imgupload_form">',
                '<input type="file" name="pic" id="xwb_img_file" value="" />',
            '</form>',
            '<div class="post-tips">请输入要发布的微博内容</div>',
            '<div class="post-success all-bg hidden" id="xwb_succ_mask"></div>',
        '</div>'
    ].join(''),
    
    AnchorTipContent : '<div class="tips-c"><div class="icon-correct icon-bg"></div><p id="xwb_title"></p></div>',
    AnchorDlgContent : '<div class="tips-c"><div class="icon-warn icon-bg"></div><p id="xwb_title"></p></div>',
    
    SpanBoxContent : [
        '<div class="win-box-inner">',
            '<p class="desc">不良信息是指含有色情、暴力、广告或其他骚扰你正常微博生活的内容。</p>',
            '<p>你要举报的是“{.nick}”发的微博：</p>',
            '<div class="report-box">',
                '<div>{.text}</div>',
                '<img src="{.img}" class="user" width="30px" height="30px" >',
            '</div>',
            '<p>你可以填写更多举报说明：（选填）</p>',
            '<p><textarea rows="" cols="" id="content"></textarea></p>',
            '<div class="foot-con">',
                '<p>请放心，你的隐私将会得到保护。<br>举报电话：400 690 0000</p>',
                '<div class="btn-area">',
                    '<a href="#" class="general-btn highlight" rel="e:ok"><span>确认举报</span></a>',
                    '<a href="#" class="general-btn" rel="e:cancel"><span>取消</span></a>',
                '</div>',
            '</div>',
        '</div>'
    ].join('')
};



