/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 * @service Rock,mailto:jiangyuan1@staff.sina.com.cn
 */

/**
 * @class XwbRequest
 * @namespace
 */
(function(X){

if(!window.__debug)
    __debug = false;

var String = window.String,
    undefined,
    trimReg = new RegExp("(?:^\\s*)|(?:\\s*$)", "g"),
    localDomain  = location.hostname,
    domainReg = /:\/\/(.[^/]+)/;

var XwbRequest = {

/**
 * @class XwbRequest.util
 * Utility Package
 */
    util : {
       /**
        * @param {String} templateString
        * @param {Object} dataMap
        * @param {Boolean} [urlencode] encodeURIComponent for value
        * @param {Boolean} [cascade] cascade apply template from value
        example:
        <pre>
            <code>
                var name = templ('My name is {name}', {name:'xweibo'});
                var url  = templ('http://www.server.com/getName?name={name}', {name:'微博'}, true);
            </code>
        </pre>
        */
       templ : function(str, map, urlencode, cascade){
            return str.replace(/\{([\w_$]+)\}/g, function(s, s1){
                var v = map[s1];
                if(cascade && typeof v === 'string')
                    v = argument.callee(v, map, urlencode, cascade);
                
                if(v === undefined || v === null) 
                    return '';
                return urlencode?encodeURIComponent(v) : v;
            });
       },
       
        /**
         * @param {Object} target 目标对象,可为空
         * @param {Object} source 源对象
         * @param {Boolean} [override]
         * @return {Object} target
         */
        extend : function(target, src, override){
          if(!target)
            target = {};
          if(src){
            for(var i in src)
                if(target[i]===undefined || override)
                    target[i] = src[i];
          }
          return target;
        },
        
        /**
         * 移除字符串最左与最右边的空格
         * @param {String} string
         * @return {String}
         */
        trim : function(s){
            return s.replace(trimReg, "");
        },

        /**
         * 返回对象查询字符串表示形式.
         * <pre><code>
           var obj = {name:'xweibo', age:'25'};

           //显示 name=rock&age=25
           alert(queryString(obj));
         * </code></pre>
         * @param {Object} obj
         * @return 对象的查询字符串表示形式
         */
        queryString : function(obj) {
            if(!obj)
                return '';
            var arr = [];
            for(var k in obj){
                var ov = obj[k], k = encodeURIComponent(k);
                var type = typeof ov;
                if(type === 'undefined'){
                    arr.push(k, "=&");
                }else if(type != "function" && type != "object"){
                    arr.push(k, "=", encodeURIComponent(ov), "&");
                }else if(ov instanceof Array){
                    if (ov.length) {
                        for(var i = 0, len = ov.length; i < len; i++) {
                            arr.push(k, "=", encodeURIComponent(ov[i] === undefined ? '' : ov[i]), "&");
                        }
                    } else {
                        arr.push(k, "=&");
                    }
                }
            }
            arr.pop();
            return arr.join("");
        },
        
        /**
         * 如果仅仅想切换this范围，而又使代理函数参数与原来参数一致的，可使用本方法。
         * @param {Function} sourceFunction
         * @param {Object} scope scope.func()
         */
        bind : function(fn, scope){
          return function() {
              return fn.apply(scope, arguments);
          };
        },
        /**
         * @class XwbRequest.config
         * @namespace
         */
         
        /**
         * @class XwbRequest.config.AjaxConfig
         * {@link XwbRequest.util#ajax}方法的请求参数
         */
         /**
          * @cfg {String} url 请求目标URL
          */
         /**
          * @cfg {String} method 请求方法 POST/GET
          */
         /**
          * @cfg {String} encoding 发送内容的字符编码，未设置采用默认
          */
         /**
          * @cfg {String} dt dataType，返回内容类据类型，text或json，默认为json，系统根据该类型传递对应类型的数据到回调方法的参数中。
          */
         /**
          * @cfg {String|Object} data 请求时传递的数据，可为字符串，也可为键值对。
          */
          /**
           * @cfg {Boolean} cache 请求时是否应用缓存，默认忽略缓存
           */
         /**
          * @cfg {Object} scope 可指定回调方法调用时的this对象
          */
         /**
          * @cfg {Function} success 请求成功后回调方法
          * @param {Mixed} data 根据设定的数据类型传递不同的类型数据
          * @param {XMLHttpRequest} ajax 
          */
         /**
          * @cfg {Function} failure 请求失败后回调方法
          * @param {String} responseText 根据设定的数据类型传递不同的类型数据
          * @param {XMLHttpRequest} ajax 
          */
          
        /**
         * @class XwbRequest.util
         */
        /**
         * 发起一个ajax请求.
         * @param {XwbRequest.config.AjaxConfig} param 请求参数
         */
        ajax : function(param){
            var ajax, url = param.url;
            
            if (window.XMLHttpRequest) {
                ajax = new XMLHttpRequest();
            } else {
                if (window.ActiveXObject) {
                    try {
                        ajax = new ActiveXObject("Msxml2.XMLHTTP");
                    } catch (e) {
                        try {
                            ajax = new ActiveXObject("Microsoft.XMLHTTP");
                        } catch (e) { }
                        }
                    }
            }
            
            
            if(ajax){
                param.method = param.method ? param.method.toUpperCase() : 'GET';
                // setup param

                var ps = param.data, ch = !param.cache;
                if(ps || ch){
                    var isQ = url.indexOf('?') >= 0;
                    if(ch){
                        if (isQ)
                            url = url + '&_=' + (+new Date());
                        else
                            url = url + '?_=' + (+new Date());
                    }
                    
                    // append data to url or parse post data to string
                    if(ps){
                        if(typeof ps === 'object')
                            ps = Util.queryString(ps);
                        if(param.method === 'GET'){
                            if(!isQ && !ch)
                                url = url+'?';
            
                            url = url + '&' + ps;
                        }
                    }
                }
                ajax.open(param.method, url, true);
                
                if (param.method === 'POST')
                    ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset='+(param.encoding?param.encoding:''));
                
                ajax.onreadystatechange = function(){
                    if (ajax.readyState === 4) {
                        var ok = (ajax.status === 200);
                        if(ok && param.success){
                            try{
                                var data = (!param.dt || param.dt === 'json') ? eval("("+ajax.responseText+");") : ajax.responseText;
                            }catch(e){
                                if( __debug ) console.error('服务器返回JSON格式有误，请检查。\n',e,'\n', ajax.responseText);
                                ok = false;
                            }
                            if (ok)
                                param.success.call(param.scope||this, data, ajax);
                        }
                        
                        if(!ok && param.failure){
                            param.failure.call(param.scope||this, ajax.responseText, ajax);
                        }
                    }
                };
                
                // send POST data
                ajax.send("POST" === param.method ? ps : undefined);
                
                return ajax;
            }
        },
        /**
         * @class XwbRequest.config.JSONPConfig
         * {@link XwbRequest.util#jsonp}方法的请求参数
         */
         
         /**
          * @cfg {String} url 请求目标URL
          */
         /**
          * @cfg {DOMElement} doc 可以指定生成JSONP脚本所在的document
          */
         
         /**
          * @cfg {Object} scope 可指定回调方法调用时的this对象
          */
          
         /**
          * @cfg {Object} data 作为提交参数的键值对
          */
          
          /**
           * @cfg {String} charset JSONP脚本字符编码
           */
           /**
            * @cfg {Object} script 进行JSONP请求的script标签的属性集，在请求前该属性集将被复制到script标签中
            */
         /**
          * @cfg {Function} success 请求成功后回调方法
          * @param {Mixed} data 根据设定的数据类型传递不同的类型数据
          * @param {XMLHttpRequest} ajax
          */
         /**
          * @cfg {Function} failure 请求失败后回调方法
          * @param {String} responseText 根据设定的数据类型传递不同的类型数据
          * @param {XMLHttpRequest} ajax 
          */
          /**
           * @cfg {String} jsonp 指定JSONP请求标识参数的名称，默认为'jsonp'
           */
        /**
         * @class XwbRequest.util
         */
         /**
          * 发起一个JSONP请求
         * @param {String} url 目标地址
         * @param {XwbRequest.config.JSONPConfig} param 请求参数
         */
        jsonp : function(param){
            var fn  = 'jsonp_' + (+new Date()),
                doc = param.doc || document, 
                url = param.url,
                script = doc.createElement('script'),
                hd = doc.getElementsByTagName("head")[0],
                success;
            
            if(typeof param == 'function'){
                success = param;
                param = {};
            }else success = param.success;
            
            
            script.type = 'text/javascript';
            param.charset && (script.charset = param.charset);
            param.deffer  && (script.deffer  = param.deffer);
            
            url = url + ( url.indexOf('?')>=0 ? '&' + ( param.jsonp || 'jsonp')+'='+fn : '?'+( param.jsonp || 'jsonp')+'='+fn);
            
            if(param.data)
                url += '&'+Util.queryString(param.data);
            
            if(param.script){
                Util.extend(script, param.script);
                delete param.script;
            }
            
            script.src = url;

            var cleaned = false;
            
            function clean(){
                if(!cleaned){
                    try {
                        delete window[fn];
                        script.parentNode.removeChild(script);
                        script = null;
                    }catch(e){}
                    cleaned = true;
                }
            }
            
            window[fn] = function(){
                clean();
                if(success)
                  success.apply(param.scope||this, arguments);
            };

            script.onreadystatechange = script.onload = function(){
                var rs = this.readyState;
                // 
                if( !cleaned && (!rs || rs === 'loaded' || rs === 'complete') ){
                    clean();
                    if(param.failure)
                        param.failure.call(param.scope||this);
                }
            };
            
            hd.appendChild(script);
            
            return script;
        }
    },
    
/**
 * @class XwbRequest.config.XwbRequestConfig
 * @extends XwbRequest.config.AjaxConfig
 */
 
 /**
  * @cfg {Function} success
  * @param {XwbRequest.config.ResponseDefinition} data
  */

/**
 * @class XwbRequest
 * 发起任何请求前请先执行初始化{@link #init}。
 */

/**
 *  初始化请求。发起任何请求前请先初始化。
 * @param {String} serverBaseUrl 服务器URL.
 * @return this
 */
    init : function(server){
        this.basePath = server;
        return this;
    },
    
/**
 * 发起一个请求。<br>请求不必理会是否跨域，系统会判断是否同域调用ajax或JSONP请求。
 * @param {String} url
 * @param {XwbRequest.config.RequestConfig} config
 */
    direct : function(cfg){
        if(!cfg)
            cfg = {};
            
        // make a success handler wrapper
        var handler = cfg.success, connector;
        cfg.success = function(data, connector){
            var e = new ( cfg.responseDefinition || XwbRequest.DefaultResponseDefinition ) (data, cfg, connector);
            
            if(__debug) console.log('req e:', e);
            
            if(cfg.scope)
                handler.call(cfg.scope, e);
            else handler(e);
            
            data = null;
            e = null;
            connector = null;
        };
        // check domain the same
        var domain = cfg.url.match(domainReg);
        connector = !domain || domain[1] == localDomain ? Util.ajax(cfg) : Util.jsonp(cfg);
    },
    
/**
 * 利用给定参数发起一个POST请求
 * @param {String} url
 * @param {Object} data
 * @param {Function} successCallback
 * @param {XwbRequest.config.RequestConfig} config
 * <code><pre>
    // POST
    Xwb.request.post(
        'http://demo.rayli.com.cn/?m=action.getCounts',
        {ids:'3042338323,3042296891'},
        function(e){
            if(e.isOk()){
                console.log(e.getRaw());
            }
        }
    );
   </pre></code>
 * @private
 */
    postReq : function(url, data, success, cfg){
        !cfg && (cfg = {});
        cfg.method = 'POST';
        this.q(url, data, success, cfg);
    },

/**
 * 利用给定参数发起一个请求。
 * q是query的缩写。
 * @param {String} url
 * @param {Object} data
 * @param {Function} successCallback
 * @param {XwbRequest.config.RequestConfig} config

 * <code><pre>
    // JSONP
    Xwb.request.q(
        'http://bbs.rayli.com.cn/api/sinax.php',
        {
            action : 'sinalogin',
            name   : 'yourname',
            pwd    : 'youpassword'
        },
        function(e){
            if(e.isOk()){
                console.log(e.getRaw());
            }
        },
        
        // 默认 'jsonp'，可根据具体目标而设置
        {jsonp:'jscallback'}
    );
   </pre></code>
 */
    q : function(url, data, success, cfg){
        !cfg && (cfg = {});
        cfg.url = url;
        // merge data
        if(cfg.data)
            Util.extend(cfg.data, data);
        else cfg.data = data;
        cfg.success = success;
        this.direct(cfg);
    },
    
    basePath : '/',
    
/**
 * 发起XWB的action请求
 * @param {String} actionName
 * @param {XwbRequest.config.RequestConfig} config
 */
    act : function(name, data, success, cfg){
        var url = this.apiUrl('action', name);
				alert(url);
        this.postReq(url, data, success, cfg);
    },


// ------------------------------------
// XWB具体数据请求API
// ------------------------------------

/**
 * 发布微博
 * @param {String} text 微博内容
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {String} pic
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    post : function(text, fn, pic, cfg){
        var data = {text:text};
        if(pic)
            data.pic = pic;
        XwbRequest.act('update', data, fn, cfg);
    },
    
/**
 * 分享图片微博
 * @param {String} text 微博内容
 * @param {String} picId 图片pid
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    postImgText : function(text, picId, fn, cfg){
        XwbRequest.act('upload', {text:text, pic:picId}, fn, cfg);
    },
    
/**
 * 转发微博
 * @param {String} postId  微博id
 * @param {String} text    微博内容
 * @param {String} userList   同时作为userList的评论发布，用户ID用逗号分隔
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    repost : function(id, text, uids, fn, cfg){
        XwbRequest.act('repost', {
            id:id, 
            text:text, 
            rtids : uids
          }, fn, cfg
        );
    },
/**
 * 获取表情数据
 * 
 */
	getEmotion: function(fn) {
		XwbRequest.act('emotions', null,fn);
	},

/**
 * 删除微博
 * @param {String} postId 微博id
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    del : function(id, fn, cfg){
        XwbRequest.act('destroy', {id:id}, fn, cfg);
    },

/**
 * 评论微博
 * @param {String} postId 微博id
 * @param {String} text 微博内容
 * @param {Number} forward 是否作为一条新微博发布，1是，0否
 * @param {Number} headPictureType 评论显现头像类型, 默认是1，30大小的头像，2，50大小的头像
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    comment : function(id, text, forward, hpt, fn, cfg){
        XwbRequest.act('comment', {
            id:id,
            text:text,
            forward : forward,
            type:hpt
           }, fn, cfg
        );
    },

/**
 * @param {String} commentId 评论微博id
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    delComment : function(id, fn, cfg){
        XwbRequest.act('comment_destroy', {id:id}, fn, cfg);
    },
    
/**
 * 回复微博评论
 * @param {String} postId 微博id
 * @param {String} commentPostId 要回复的评论ID
 * @param {String} text 微博内容
 * @param {Number} forward 是否作为一条新微博发布，1是，0否
 * @param {Number} headPictureType 评论显现头像类型, 默认是1，30大小的头像，2，50大小的头像
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    reply : function(id, cid, text, forward, hpt, fn, cfg){
        XwbRequest.act('reply', {
            id:id,
            cid:cid,
            text:text,
            forward : forward,
            type:hpt
           }, fn, cfg
        );
    },
/**
 * 关注某人
 * @param {String} user 关注用户，UID或微博名称
 * @param {Number} userDataType user参数类型，0为user id，1为微博名称
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    follow : function(user, dt, fn, cfg){
        XwbRequest.act('createFriendship', {uid:user, type:dt}, fn, cfg);
    },

	/**
	 * 批量关注用户
	 * @param users string 用户ID或者用户昵称,多个用逗号分隔
	 * @param type int 1|0  1:用户昵称 0:用户ID
	 *
	 */
	follows: function(users, type, fn, cfg) {
		XwbRequest.act('createFriendship', {uid: users, type: type}, fn, cfg);
	},
    
/**
 * @param {String} user 关注用户，UID或微博名称
 * @param {Number} userDataType user参数类型，0为user id，1为微博名称
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    unfollow : function(user, name, fn, cfg){
        XwbRequest.act('deleteFriendship', {id:user, name:name, is_follower:0}, fn, cfg);
    },
	
	//移除粉丝
	removeFans : function(user, name, fn, cfg) {
		XwbRequest.act('deleteFriendship', {id:user, name:name, is_follower:1}, fn, cfg);
	},

/**
 * 收藏微博
 * @param {String} blogId 要收藏的微博ID
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    fav : function(id, fn, cfg){
        XwbRequest.act('createFavorite', {id:id}, fn, cfg);
    },
    
    delFav : function(id, fn, cfg){
        XwbRequest.act('deleteFavorite', {id:id}, fn, cfg);
    },

/**
 * 更改头像。
 * WARNING : 更改头像需要由form提交
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    updateHeadPic : function(image, fn, cfg){
        XwbRequest.act('updateProfileImage', {image:image}, fn, cfg);
    },
    
/**
 * 更新用户资料
 * @param {Object} data 用户资料（键值对）
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    setProfile : function(data, fn, cfg){
        XwbRequest.act('saveProfile', data, fn, cfg);
    },

/**
 * 获取未读数 包括新微博数，@我的微博数，评论数，粉丝数，私信
 * @param {String} lastReadId 最新已读微博ID
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    unread : function(id, fn, cfg){
        XwbRequest.act('unread', {id:id}, fn, cfg);
    },
    
/**
 * 清零未读消息数目
 * @param {Number} messageType  1为清零评论，2为清零@me，3为清零私信，4为清零粉丝，默认清零全部
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    clearUnread : function(type, fn, cfg){
        XwbRequest.act('clearTip', {type:type}, fn, cfg);
    },
    
/**
 * 获取指定的微博评论列表
 * @param {String} id 微博ID
 * @param {Number} page 评论的页码
 * @param {Number} type 列表类型, 默认是1，微博列表的某条微博评论列表，2单条微博的详细评论列表
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    getComments : function(id, page, type, fn, cfg){
        XwbRequest.act('getComments', {id:id, page:page, type:type||1}, fn, cfg);
    },

/**
 * 发私信
 * @param {String} targetUserId 用户帐号ID，与用户微博名称两者给出其一即可
 * @param {Number} userType 指明第一个参数的类型，用户ID时值为0, 用户微博名称时为1，默认为0
 * @param {String} targetWeiBoName 用户微博名称与帐号ID两者给出其一即可
 * @param {String} text 私信内容
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    msg : function(uid, userType, text, fn, cfg){
        XwbRequest.act('sendDirectMessage', {id : userType?'':uid, name: userType?uid:'', text:text}, fn, cfg);
    },

/**
 * 删除私信
 * @param {String} msgId 私信ID
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    delMsg : function(id, fn, cfg){
        XwbRequest.act('deleteDirectMessage', {id:id}, fn, cfg);
    },
/**
 * 查看某人是否是目标用户的粉丝
 * @param {String} user 目标用户
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {Number} targetAccountType 目标帐号类型，如果参数传入的是用户ID，为0,如果参数为用户微博名称则为1
 * @param {String} src 源用户(不指定，就使用当前登录用户)
 * @param {Number} sourceAccountType 源帐号类型，如果参数传入的是用户ID，为0,如果参数为用户微博名称则为1
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    followed : function(user, fn, userType, src, srcType, cfg){
        var data = {};
        if( userType )
            data.t_name = user;
        else data.t_id  = user;
        if(src){
            if(srcType)
                data.s_name = src;
            else data.s_id  = src;
        }
        XwbRequest.act('friendShip', data, fn, cfg);
    },
    
/**
 *  个人设置
 * @param {String} type 设置类型，默认是’autoshow’新微博显示方式，’tipshow’未读数显示方式
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    setting : function(type, fn, cfg){
        XwbRequest.act('setting',{type:type}, fn, cfg);
    },

/**
 *  屏蔽单条微博
 * @param {String} weiboId 微博ID
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    shieldBlog : function(wbId, fn, cfg){
        XwbRequest.postReq(XwbRequest.mkUrl('show', 'disabled'), {id:wbId}, fn, cfg);
    },
/**
 *  举报单条微博
 * @param {String} weiboId 微博ID
 * @param {String} content
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    reportSpam : function(wbId, content, fn, cfg){
        XwbRequest.postReq(XwbRequest.mkUrl('show', 'reportSpam'), {cid:wbId, content:content}, fn, cfg);
    },

/**
 *  增加标签
 * @param {String} tagList 逗号分隔
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    createTags : function(tagList, fn, cfg){
        XwbRequest.act('createTags', {tagName:tagList}, fn, cfg);
    },

/**
 * 删除标签
 */
    delTag : function(tagId, fn, cfg){
        XwbRequest.act('deleteTags', {tag_id:tagId}, fn, cfg);
    },
    
    updateShowProfile : function(data, fn, cfg){
        XwbRequest.act('saveShow', data, fn, cfg);
    },
    
    updateNoticeProfile : function(data, fn, cfg){
        XwbRequest.act('saveNotice', data, fn, cfg);
    },
    
/**
 * 设置皮肤
 * @param {String} skin skin文件夹
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    saveSkin : function(skin, fn, cfg){
        // url, data, success, cfg
        XwbRequest.postReq(XwbRequest.mkUrl('setting', 'setSkin'), {skin_id:skin}, fn, cfg);
    },
    
/**
 * 获取多条微博转发数，评论数等信息
 * @param {String} weiboIds 微博ID列表，由逗号分隔
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    counts : function(ids, fn, cfg){
        XwbRequest.act('getCounts', {ids:ids}, fn, cfg);
    },

/**
 * 添加用户黑名单
 * @param {String} id 用户ID
 * @param {String} name 用户昵称 
 * 参数二选一即，如只知道昵称 (null, 'billgate');
 *
 */
	blacklistAdd : function(id, name, fn, cfg) {
		XwbRequest.act('createBlocks', {id:id,name:name}, fn, cfg);
	},

	blacklistDel : function(id, name, fn, cfg) {
		XwbRequest.act('deleteBlocks', {id:id,name:name}, fn, cfg);
	},
	

/**
 * 获取省份城市列表
 *
 */
	getProvinces : function(fn) {
		XwbRequest.act('getProvinces', null, fn);
	},

/**
 * 解析短链接
 * @param {String} shortLinkId
 * @param {Function} callback 成功后回调方法，参数为 callback(ResponseDefinition definition)
 * @param {XwbRequest.config.RequestConfig} [config] 可选，请求配置信息
 */
    sinaurl : function(id, fn){
        XwbRequest.act('sinaurl', {id:id}, fn);
    },
    
    mkUrl : function(module, action, queryStr, entry){
        var params = (entry||'')+'?m=' + module;
        if (action)
            params += '.' + action;

        if (queryStr){
          typeof queryStr === 'string' ?  params += '&' + queryStr : params+=Util.queryString(queryStr);
        }
        return this.basePath + params;
    },
    
/***/
    apiUrl : function(module, action, queryStr){
        return this.mkUrl('api/weibo/'+module, action, queryStr);
    },

/***/
    parseProtocol : function(ret){
        return new XwbRequest.DefaultResponseDefinition( ret );
    }
};


/**
 * 该类定义获得返回内容数据的方式
 * @class XwbRequest.ResponseDefinition
 * @constructor
 * @param {Object} rawData row json data responsed by server
 * @param {Object} requestConfig 连接配置信息
 * @param {XMLHttpRequest|JSONP} connector 发起请求的连接器(ajax:XMLHttpRequest或JSONP:script结点)
 */
XwbRequest.DefaultResponseDefinition = function(rawData, reqCfg, connector){
    this.raw = rawData;
    this.reqCfg = reqCfg;
    if(connector)
        this.connector = connector;
};

XwbRequest.DefaultResponseDefinition.prototype = {
/**
 * 获得该请求发起时的配置信息
 */
    getRequestCfg : function(){
        return this.reqCfg;
    },
/**
 * 获得该请求所使所有连接器(ajax:XMLHttpRequest对象或JSONP:script结点)
 */
    getConnector : function(){
        return this.connector;
    },
    
/**
 * 获得请求原始返回数据，根据请求数据类型的不同返回text文本或json对象
 */
    getRaw : function(){
        return this.raw;
    },

/**
 * 获得该请求的应用数据
 */
    getData : function(){
        return this.getRaw().rst;
    },

/**
 * 检测服务器数据调用是否成功。
 * 该检测处于服务器成功返回之后，
 * 对客户端提交的请求数据有效性的一种反应。
 */
    isOk : function(){
        return !this.getCode();
    },

/**
 * 获得返回码
 * @return {Number}
 */
    getCode : function(){
        return this.getRaw().errno;
    },

/**
 * 获得错误的具体信息
 * @return {Object} errorInfo
 */
    getError : function(){
        return this.getRaw().err;
    },
    
/**
 * 从ERRORMAP获得错误码对应信息。
 * @param {String} defaultString 如果不存在，返回该字符串。
 * @return {String}
 */
    getMsg : function(def){
        if(__debug) if( !ERRORMAP[ this.getCode() ] ) console.warn('未定义错误码消息：' + this.getCode(), '@', this.getRaw());
        // '系统繁忙，请稍后重试！'
        return ERRORMAP[ this.getCode() ] || def || ('未处理异常：' + this.getCode(), '@', this.getRaw());
    },

/**
 * 枚举返回的data数据，只枚举下标为数字的条项。
 */
    each : function(func, scope){
        var i = 0, data = this.getData();
        for( var item in data ){
            if( isNaN (item) )
                continue;
            if( scope ){
                if( func.call(scope, data[item], i) === false)
                    break;
            } else if( func(data[item], i) === false)
                 break;
            i++;
        }
    }
};



var ERRORMAP = XwbRequest.ERRORMAP = {
        '0': '发布失败。',
		'5': '超过字数了！',
		'1': '图片正在上传，请稍候。',
		'2': '正在发布,请稍候。。',
		'3': '请先输入内容。',
		'4': '请写上你要说的话题。',
		'1020002': '请不要重复发布相同的内容。',
		'1010006': '不能采用sina域下的邮箱。',
		'1010007': '已经提交，请耐心等待管理员审核，谢谢！',
        '20011': '评论字数超过限制',
		'20016': '他还没有关注你,不能发私信',
		'30001': '皮肤保存失败，请重试。',
		//图片相关
		'20020':'上传图片为空',
		'20021':'上传图片大小超过限制',
		'20022':'上传图片类型不符合要求',
		'20023':'上传图片失败',
		'20024':'非法的上传图片',
	    '1021200':'此昵称不存在',
	    '1020500':'此微博已被作者移除。',
	    '1020301':'此微博已被作者移除。',
	    '1020700':'此微博已被作者移除。',
	    '1020402':'此微博已被作者移除。',
	    '1020504':'此微博已被作者移除。',
	    '1020501':'此评论已被作者移除。',
	    '1020600':'此评论已被作者移除。',
		'1040003':'您尚未登录，请先登录再操作',
		'1040000':'您尚未登录，请先登录再操作',
		'1050000':'系统繁忙，请稍候再试。',
		'1040007':'发评论太多啦，休息一会儿吧.',
		'1040006':'发微博太多啦，休息一会儿吧.',
		'1040004': '请不要发表违法和不良信息！',
		'1021301': '该昵称已存在，请换一个昵称。',
		'1020104': '内容长度不正确。',
		'1020801': '关注的用户不存在。',
		'1020800': '关注失败',
		'1020805': '已关注该用户',
		'1050000': '操作失败，请重试。'
};

var Util = XwbRequest.util;

if ( !X )
    X = window.Xwb = {};

X.request = XwbRequest;

})(window.Xwb);