/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 */
 
/*
 * 页面初始化文件
 */

$(function(){

(function(X, $){
//	console.log('ready');

	if ($('#logo').length)
	{
		$('#logo').fixPng();
	}

	var xui = X.ui,
		
		CFG = X.cfg,
		
		Req = X.request,

		getCfg = X.getCfg,

		BasePath = getCfg('basePath'),

		page = getCfg('page');

    // 绑定全局页面action
    X.use('action').bind(document.body);

	
	//初始化请求路径
	BasePath && Req.init(BasePath);
    
    if(X.getUid()){
        // 消息提醒
        var rt = getCfg('remind');
        X.use('notice', {
            appendTo : rt ?
            document.body : $('#xwbInnerNav')[0],
            remindType : rt,
            latestWid  : getCfg('maxid')
        });
    }
    
    // 页面内发微博框框（非对话框）
    $('#publish_box').each(function(){
        var ui = X.reg('postArea', X.use('base', {view:this}));
        $.extend( ui, xui.PostBase );
        ui.initEx();
        ui.display(true);
    });

    // 微博列表
    $('#xwb_weibo_list').each(function(){
        X.reg('weiboList', X.use('WeiboList', {view:this}))
        .display(true);
    });
    
    // 搜索框框
    $('#xwb_search_form').each(function(){
        X.use('SearchEntry', {view:this}).display(true);
    });


    switch( page ){
        case '':
        case 'index':
        	// 已登录操作
        	if(X.getUid()){
        		
        		// 换肤
        		if( location.href.indexOf('skinset') >= 0){
        		    X.use('skin', {
        		        view:$('#xwbSkinSet')[0], 
        		        tab:{ selectedCS:'current', 
        		              items: $('#tabItems>span'), 
        		              contents:$('#tabPanels>div')
        		            }
        		    }).display(true);
        		}
        	}
    	break;
    	
        case 'index.messages' :
            // mouseover 显示 删除
            $('#messageList li').hover(function(e){
                $(this).find('#del').cssDisplay(true);
            }, function(e){
                $(this).find('#del').cssDisplay(false);
            });
        break;
        
        // 显示微博具体页面
        case 'show': 
            var jq = $('#xwb_cmt_list');
            var wbId = jq.attr('wbid');
            var wbUid = CFG.wbList && 
                        CFG.wbList[wbId].u.id;
            var cmtArea = X.use('MBlogCmtArea', {
                view : jq[0],
                wbId : wbId,
                wbUid : wbUid,
                topCmtBox : $('#topCmtBox')[0],
				faceSize: 50
            });
            cmtArea.display(true).load();
            cmtArea.topCmtBox.jqInputor.focus();
        break;
        
        case 'index.comments' :
        case 'index.commentsend':
            var jq = $('#xwb_cmt_list');
            X.use('MyCmt', {
                view : jq[0]
            }).display(true);
        break;
        
        
    }

	switch (page)
	{
		case 'follow': //我关注的
			$('#user_list').each(function() {
				X.use('FriendList', {
					view: this,
					onMouseOver: function() {
						$(this).find('a.forjs-cancel-att').show();
					},
					onMouseOut: function() {
						$(this).find('a.forjs-cancel-att').hide();
					}
				})
				.getView();

				//取消关注
				$(this).click(function(e) {
					var $target = $(e.target);

					if (!$target.data('loading') && $target.hasClass('forjs-cancel-att'))
					{
						var $li = $target.closest('LI');
						var name = $li.find('div.user-pic img').attr('title');

						var Box = X.ui.MsgBox;

						Box.confirm('提示','确定要取消关注'+name+'?', function(btnId){
							if(btnId === 'ok'){
								//标记请求状态
								$target.data('loading', 1);

								X.request.unfollow($target.attr('rel'), '', function(e){
									if (e.isOk())
									{
										$li.slideUp(500, function() {
											$li.remove();
										});

									} else {
										Box.tipWarn(e.getMsg());
									}
								});
							}
						});
					}
				});
			});
			
		break;

		case 'fans': //我的粉丝
			$('#user_list').each(function() {
				X.use('FriendList', {
					view: this,
					onMouseOver: function() {
						$(this).find('#removeFans,#sendMsg').removeClass('hidden');
					},
					onMouseOut: function() {
						$(this).find('#removeFans,#sendMsg').addClass('hidden');
					}
				})
				.getView();

				//取消关注
				$(this).click(function(e) {
					var $target = $(e.target);

					if (!$target.data('loading') && $target.hasClass('forjs-cancel-att'))
					{
						var $li = $target.closest('LI');
						var name = $li.find('div.user-pic img').attr('title');

						var Box = X.ui.MsgBox;

						Box.confirm('提示','移除之后将取消'+name+'对你的关注?', function(btnId){
							if(btnId === 'ok'){
								//标记请求状态
								$target.data('loading', 1);

								X.request.removeFans($target.attr('rel'), '', function(e){
									if (e.isOk())
									{
										$li.slideUp(500, function() {
											$li.remove();
										});

									} else {
										Box.tipWarn(e.getMsg());
									}
								});
							}
						});
					}
				});
			});
		break;

		// 搜索模块页面
        case 'search' :
		case 'search.weibo':
		case 'search.user':

			var $list = (page == 'search.user') ? $('div.user-list'):  $('div.feed-list');

			$list = $list.add($('div.fame-list'));

			if ($list.length)
				$list.highlight($('#k').val());   

		// 推荐
        case 'search.recommend' :
			!location.hash && $('#k').focus();
           
			// ie 下的focus光标在input框的最后
			if($.browser.msie) {
            	var kInput = document.getElementById('k');
            	if(kInput)
            	    X.util.focusEnd(kInput);
            }
			
            $('#searchForm').bind('submit', function(){
                var k = $.trim($('#k').val());
                if(!k){
                    $('#searchTip').cssDisplay(true);
                    $('#k').focus();
                    return false;
                }
            });
            
			$('#searchBtn').click(function(){
			    // 30 bytes
                var k = X.util.byteCut($.trim($('#k').val()), 30);
                if(k){
                    $('#searchForm').submit();
                }else {
                    $('#searchTip').cssDisplay(true);
                    $('#k').focus();
                }
                return false;
            });

		break;

		case 'pub':
			$('#win_city').each(function() {
				var view = this;

				var layer = X.use('Layer', {

					closeable: true,

					contextable: true,

					provinces: null,

					view: view,

					onViewReady: function() {
						X.request.getProvinces(X.util.bind(this.onDataLoaded, this));
						var self = this;
						this.jq('#citys').click(function(e){
						    if(e.target.tagName == 'A')
						        self.close();
						});
					},

					//省份加载完成后
					onDataLoaded: function(e) {
						if (e.isOk())
						{
							this.provinces = (e.getData()).provinces;

							var self = this;

							this.jq('#sel-area').change(function() {
								self.changeProvince(this.value);
							});
						}
					},

					changeProvince: function(id) {
						if (this.provinces)
						{
							var self = this;

							$.each(this.provinces, function(i, row) {
								if (row.id == id)
								{
									var htmls = [];

									$.each(row.citys, function(k, ct) {
										var ctKey,ctName;

										for (var k in ct )
										{
											ctKey = k;
											ctName = ct[k];
										}

										var url = BasePath + 'index.php?m=pub&province=' + id + '&city=' + ctKey + '#city';

										htmls.push('<a href="' + url + '">' + ctName + '</a>');
									});

									self.jq('#citys').html(htmls.join(''));

									return false;
								}
							});
						}
					}
				});


				$('#cityBtn').click(function() {
					layer.display($(view).hasClass('hidden'));
					return false;
				});
			});

		break;
	
	}

	//
	xui.linkRender();

	//热门评论数更新
	$('#hot_mblog div.feed-list').each(function(i) {
		xui.updateCount.addHook((function($wb, i) {
			return function(counts) {
				$wb.find('#xwb_weibo_list_ct>li').each(function() {
					var $li = $(this);
					var id = $li.attr('rel').split(':')[1];
					var ct = counts[id];
					ct && $li.find('strong').text(ct[i? 0:1]);
				});
			};
		})($(this), i));
	});

	//更新微博转发数
	if(CFG && CFG.wbList)
	    xui.updateCount();

	$('#xwb_today_topic').each(function() {
		$(this).find('p.feedback').substrText(80, 1);
		$(this).find('div.column-item:first').removeClass('next');

		X.use('FadeBox', {view: this}).display(1);
	});

	$('#hot_mblog').each(function() {
		var $p = $(this);

		var switcher = X.use('Switcher', {
			items: $p.find('div.tab-s2>span'),

			contents: $p.find('div.hot-mblog-body'),

			trigMode: 'click',

			selectedCS: 'current'
		});
	});


	//上报数据
	X.report.start();

	$(window).bind('unload', function() {
		X.report.report();	
	});
	
	// 广告初始化
	if(getCfg('ads'))
	    X.ax.AdMgm.init(getCfg('ads'));
	
})(Xwb, $)

});