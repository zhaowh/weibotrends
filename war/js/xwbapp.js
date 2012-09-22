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
    
    doc = document,
    
    // 记录弹出浮层zIndex
    currentZ = 10001, 
    
    // hidden style class
    hidCls   = 'hidden',
    
    T    = X.Tpl,
    
    // 微博字数最大值
    MAX_WBTXT_LEN = 140,
    
    Req  = X.request,
    
    CFG = X.cfg,

    // 复用Xwb.request.util类
	Util = X.util = Req.util,
	
	// 通用的disabled样式
    disabledCS = 'general-btn-disabled';

//debug开关
window.__debug = FALSE;

if(window.__debug){

/**
 * @class console
 * 系统控制台,如果存在firebug,利用firebug输出调试信息,否则忽略.
 * 在firbug中可直接进行对某个对象进行监视,
 * 无console时就为空调用,可重写自定输出.
 * @singleton
 */
if(!window.console)
      window.console = {};

function extendIf(des, src) {
      if(!des)
        des = {};

      if(src)
        for(var i in src){
          if(des[i] === UNDEFINED)
            des[i] = src[i];
        }

      return des;
}
        
extendIf(console,{
      /**
       * %o表示参数为一个对象
       * console.log('This an string "%s",this is an object , link %o','a string', CC);
       *@param {arguments} 类似C语言中printf语法
       *@method
       */
    debug : $.noop,

/**
 * @method trace
 */
    trace : $.noop,
/**
 * @method log
 */
    log : $.noop,
/**
 * @method warn
 */
    warn : $.noop,
/**
 * @method error
 */
    error : $.noop,

/**
 * @method group
 */
    group:$.noop,
/**
 * @method groupEnd
 */
    groupEnd:$.noop
});

}


if ( $.browser.msie && $.trim($.browser.version) == "6.0" )
    document.execCommand("BackgroundImageCache", false, true);

/**
 * @class Xwb
 * 本类是所有X微博JavaScript交互应用的命名空间根目录。
 */


/**
 * @class Xwb.Tpl
 * <p>HTML模板类，用于解析字符串HTML并生成对应的DOM元素。</p>
 * <p>HTML模板字符解析依赖两个数据：
    <ul><li>未解析的htmls字符串</li>
    <li>map(key,value)对象数据</li>
    </ul>
    htmls字符串是原始的数据，通过{@link #parse}方法解析。
   </p>
   <pre>
    模板文法描述：
    
    入口：
    parse(entry, dataMap)
    参数：
    dataMap: {  key : value, …}
    key : JavaScript标识符
    value:entry
    entry: html 文本，.keyFromDataMap，keyFromTemplates
    html文本: <tag attribute=“{.keyFromDataMap}”>{keyFromTemplates}</tag>, IfTest, ...
    IfTest : [?keyFromDataMap?html文本]
    Templates : {key : html文本}
    
    例子：
    var map = { name:’Xweibo’ };
    var templates = {
         Header : ‘<h2>{.name}</h2>’,
         Box:’{Header}<div>名称是{.name}</div>’
    };
    alert( parse(‘Box’, map) );
    结果是：<h2>Xweibo</h2><div>名称是Xweibo</div>
    </pre>
  */


var tplRegIf = /\[\?\.([\w_$]+?)\?([\S\s]*?)\?\]/g,
    tplReg   = /\{(\.?[\w_$]+)\}/g;

/**
 * 键查找过程：模板 --> 对象 --> 模板
 */
T.parse = function(htmls, map){
    if(!map)
        map = {};
    if(htmls.charAt(0) !== '<'){
        var tmp = T[htmls];
        if(tmp) 
            htmls = tmp;
    }
    
    // [?test?<img src="{src}">],当test置值时应用内容部份
    // example : [?right?output value {right}?]the left
    htmls = htmls.replace(tplRegIf, function(s, s1, s2){
        return map[s1] === UNDEFINED ? '' : s2;
    });
    
    return htmls.replace(tplReg, function(s, k){
        var v = k.charAt(0) === '.' ? map[k.substr(1)] : T[k];
        if(v === UNDEFINED || v === NULL)
            return '';
            
        // html text
        if(v.toString().charAt(0) === '<')
            return T.parse(v, map);
        
        // key of Tpl?
        if(T[v])
            return T.parse(T[v], map);
            
        return v;
    });
};


   /**
    * 根据html模板返回HTML结点
    * @param {String} htmls
    * @param {Object|Array} map
    * @param {Boolean} [cascade]
    example:
    <pre>
        <code>
            var iframeElement = forNode(
              '&lt;{tag} class="{cls}" frameBorder="no" scrolling="auto" hideFocus=""></iframe&gt;',
              {tag:'iframe', cls:'ui-frame'}
            );
        </code>
    </pre>
    */
    T.forNode = function(htmls, map){
        if(map)
            htmls = this.parse(htmls, map);
        return $(htmls).get(0);
    };
    
    T.get = function(type){
        return this[type];
    };
    
/**
 * @class Xwb.util
 * @extends XwbRequest.util
 */


var _uid = 0, ds = document.selection;

$.extend(Util, {
    
    arrayRemove : function(arr, idx){
        arr.splice(idx, 1)[0];
    },
    
    arrayIndexOf : function(arr, obj){
        for(var i=0,len=arr.length;i<len;i++)
            if(arr[i] === obj)
                return i;
        return -1;        
    },
    
    create : function(){
          var clazz = (function() {
            this.init.apply(this, arguments);
          });

          if (arguments.length === 0)
            return clazz;

          var absObj, base, type, ags = $.makeArray( arguments );

          if (typeof ags[0] === 'string') {
            type = ags[0];
            base = ags[1];
            ags.shift();
          } else base = ags[0];
          
          ags.shift();

          if (base)
            base = base.prototype;
          
          if (base) {
            function Bridge(){};
            Bridge.prototype = base;
            clazz.prototype = absObj = new Bridge();
          }

          if (type) {
            absObj.type = type;
            Util.ns(type, clazz);
          }
          
          for(var i=0,len=ags.length;i<len;i++)
            $.extend(absObj, typeof ags[i] === 'function' ? ags[i]( base ):ags[i]);
          
          absObj.constructor = clazz;
          return clazz;
    },
/**
 * @param {HTMLElement} el
 */    
    domUp : function(el, selector, end){
        end = end || doc.body;
        var isStr = typeof selector === 'string';
        while(el){
            if(isStr){
                if($(el).is(selector))
                    return el; 
            }else if(selector(el)){
                return el;
            }
            el = el.parentNode;
            if(el === end)
                return NULL;
        }
        return el;        
    },
    
    ns : function(ns, v){
        var routes = ns.split('.'),p=window,key;
        for(var k=0,len=routes.length - 1;k<len;k++){
            key = routes[k];
            if(!p[key])
                p[key] = {};
            p = p[key];
        }
        p[routes[k]] = v;
    },
    
    calWbText : function(text, max){
        if(max === UNDEFINED)
            max = MAX_WBTXT_LEN;
        var cLen=0;
        var matcher = text.match(/[^\x00-\xff]/g),
            wlen  = (matcher && matcher.length) || 0;
        return Math.floor((max*2 - text.length - wlen)/2);
    },
    
/**
 *  返回占用字节长度
 */    
    byteLen : function(text){
        var len = text.length;
        var matcher = text.match(/[^\x00-\xff]/g);
        if(matcher)
            len += matcher.length;
        return len;
    },
    
    /**
     * 以字节为长度计算单位截取字符串
     */
    byteCut : function(str, length) {
      var wlen = Util.byteLen(str);
      if(wlen>length){
          // 所有宽字用&&代替
          var c = str.replace(/&/g, " ")
                     .replace(/[^\x00-\xff]/g, "&&");
          // c.slice(0, length)返回截短字符串位
          str = str.slice(0, c.slice(0, length)
                    // 由位宽转为JS char宽
                    .replace(/&&/g, " ")
                    // 除去截了半个的宽位
                    .replace(/&/g, "").length
                );
      }
      return str;
    },
    
    stringReplace : function(source, text, from, to){
        return source.substring(0, from) + text + source.substring(to);
    },
    
    focusEnd : function(inputor, num){
        inputor.focus();
        if(num === UNDEFINED)
            num = inputor.value.length;
        if(document.selection) {
            var cr = inputor.createTextRange();
            cr.collapse();
            cr.moveStart('character', num);
            cr.moveEnd('character', num);
            cr.select();
        }else inputor.selectionStart = inputor.selectionEnd = num;
    },
    
    selectionStart : function(elem){
        if(!ds)
            return elem.selectionStart;
        var range = ds.createRange(), 
            s, 
            bdyRange = document.body.createTextRange();
            
            bdyRange.moveToElementText(elem);
            try{
                for(s=0;bdyRange.compareEndPoints("StartToStart", range) < 0;s++)
                    bdyRange.moveStart('character', 1);
            }catch(e){
                s = this.getCursorPos(elem);
            }
         return s;
    },
    
    selectionBefore : function(elem){
        return elem.value.slice(0, this.selectionStart(elem));
    },
    
    selectText : function(elem, start, end){
        elem.focus();
        if(!ds){
            elem.setSelectionRange(start, end);
            return;
        }
        
        var range = elem.createTextRange();
        range.collapse(1);
        range.moveStart('character', start);
        range.moveEnd('character', end - start);
        range.select();
    },
    
    insertText : function(elem, text, start){
        elem.focus();
        len = len || 0;
        if(start === UNDEFINED)
            start = this.selectionStart(elem);
        
        if(!ds){
            var val   = elem.value, 
                start = start - len,
                end   = start + text.length;
            elem.value = // val.slice(0, start) + text + text.slice(start, val.length);
            this.selectText(elem, end ,end);
            return;
        }
        var range = ds.createRange();
        range.moveStart('character', -len);
        range.text = text;
    },
    
    hasSelectionSupport : function(){
       var el = document.createElement('TEXTAREA');
       var is = FALSE;
       if( 'selectionStart' in el )
            is = TRUE;
       this.hasSelectionSupport = function(){
            return is;
       };
       return is;
    },
    
    getCursorPos : function(elem){
        var pos = 0;
        // msie 8--
        if(!this.hasSelectionSupport()){
            elem.focus();
            var range = NULL;
            range = ds.createRange();
            var tmpRange = range.duplicate();
            tmpRange.moveToElementText(elem);
            tmpRange.setEndPoint("EndToEnd", range);
            elem.selectionStart = tmpRange.text.length - range.text.length;
            elem.selectionEnd = elem.selectionStart + range.text.length;
            pos = elem.selectionStart;
        }else{
            if( elem.selectionStart || elem.selectionStart == '0' )
                pos = elem.selectionStart;
        }
        
        return pos;
    },
    
    getSelectionText : function(elem){
        var selectedText = '';
        if(window.getSelection){
            selectedText = (function () {
                if (elem.selectionStart != UNDEFINED && elem.selectionEnd != UNDEFINED) {
                    return elem.value.substring(elem.selectionStart, elem.selectionEnd)
                }
                else {
                    return ""
                }
            })(elem);
        }else selectedText = ds.createRange().text;
        
        return selectedText;
    },
    
    setCursor : function(elem, pos, coverLen){
        pos = pos == NULL ? elem.value.length : pos;
        coverLen = coverLen == NULL ? 0 : coverLen;
        elem.focus();
        if(elem.createTextRange){
            var range = elem.createTextRange();
            range.move("character", pos);
            range.moveEnd("character", coverLen);
            range.select();
        }else {
            elem.setSelectionRange(pos, pos + coverLen);
        }
    },
    
    replaceSelection : function(elem, text){
        elem.focus();
        var start = this.selectionStart(elem),
            end   = this.getSelectionText(elem).length,
            val   = elem.value;
        end = end === 0 ? start : start+end;
        elem.value = Util.stringReplace(val, text, start, end);
        this.setCursor(elem, start+text.length);
        return start;
    },
    
    escapeHtml : function(html){
        return html?html.replace(/</g, '&lt;').replace(/>/g, '&gt;'):'';
    },
    
    disable : function(el , disabled, cs){
        disabled ? $(el).addClass(cs||disabledCS) : $(el).removeClass(cs||disabledCS);
    },
    
    getBind : function(obj, funcName){
        var k = '__'+funcName;
        var m = obj[k];
        if(!m)
           m = obj[k] = Util.bind(obj[funcName], obj);
        return m;
    },
    
    uniqueId : function(){
    	return ++_uid;
    },
    
    appendParam : function(url, param){
        var qs = this.queryString(param);
        return url + ( url.indexOf('?') !== -1 ? '&'+qs : '?'+qs );
    },
    
    getFileName : function(str, len){
		if (str.indexOf('\\')) {
			var parts = str.split('\\');
			str = parts.pop();
		}
			
		if (str.length > len) {
			str = str.substr(0, len-4) + '..' + str.substr(str.length-4);
		}
		return str;
    }
});



/**
 * @class Xwb.Cache
 * 缓存类,数据结构为:<br>
 * <pre>
 * Cache[key] = [dataObjectArray||NULL, generator];
 * dataObjectArray[0] = 预留位,保存该key数据最大缓存个数, 默认为3.
 * generator = 生成数据回调
 * </pre>
 * @singleton
 */
var Cache = X.Cache = {

    /**@cfg {Number} MAX_ITEM_SIZE 某类设置的最大缓存数量.*/
    MAX_ITEM_SIZE: 3,

/**
 * 注册数据产生方式回调函数,可重复赋值,函数返回键对应的数据.
 * @param {Object} key
 * @param {Function} callback
 * @param {Number} [max] 缓存该数据的最大值
 */
    reg: function(k, callback, max) {
       if(!this[k])
        this[k] = [NULL, callback];
       else this[k][1] = callback;

       if(max !== UNDEFINED)
        this.sizeFor(k, max);
    },
/**
 * 根据键获得对应的缓存数据.
 * @param {String} key
 * @return {Object|NULL}
 */
    get: function(k) {
        var a = this[k];
        if(a === UNDEFINED)
            return NULL;
        var b = a[1];
        a = a[0];

        if(a === NULL){
          return b();
        }
        //0位预留
        if(a.length > 1)
            return a.pop();
        if(b)
            return b();

        return NULL;
    },
/**
 * 缓存键值数据.
 * @param {Object} key
 * @param {Object} value
 */
    put: function(k, v) {
        var a = this[k];
        if(!a){
            this[k] = a = [[this.MAX_ITEM_SIZE, v]];
            return;
        }
        var c = a[0];
        if(!c)
          a[0] = c = [this.MAX_ITEM_SIZE];

        if (c.length - 1 >= c[0]) {
            return ;
        }

        c.push(v);
    },

/**
 * 移除缓存.
 * @param {Object} key 键值
 */
    remove : function(k){
      var a = this[k];
      if(a){
        delete this[k];
      }
    },
/**
 * 设置指定键值缓存数据的最大值.
 * @param {Object} key
 * @param {Number} max
 */
    sizeFor : function( k, max ) {
        var a = this[k];
        if(!a)
          this[k] = a = [[]];
        if(!a[0])
          a[0] = [];
        a[0][0] = max;
    }
};

/**
 * 缓存DIV结点.
 * <pre><code>
   var divNode = CC.Cache.get('div');
 * </code></pre>
 * @property div
 * @type DOMElement
 */
Cache.reg('div', function() {
    return doc.createElement('DIV');
});


//
//   Xwb
//
/**
 * @class Xwb
 */

/**
 * @type Function
 */
X.getCfg     = function(key){
	return X.cfg && X.cfg[key]; 
};

X.getSiteUid = function(){ return parseInt(X.getCfg('siteUid'));};

/**
 * @type Function
 */
X.getUid     = function(){
	var uid = X.getCfg('uid'); 
	return uid !== '0' && uid;
};

X.getWb = function(id) {
	var wbList = X.getCfg('wbList');
	
	if (id)
	{
		return wbList && wbList[id];
	}

	return wbList;
};

X.setWb = function(id, data) {
	X.cfg.wbList && (X.cfg.wbList[id] = data);
};

//
//  以缩略名注册类
//
/**
 * @class Xwb.Types
 * 存放并管理标识类的静态类
 * @static
 */
$.extend(X, {
	
	_cls : {},
	/**
	 * 为指定类注册一个标识
	 * @param {String} shortcut 标识，即该类的缩略名
	 * @param {Function} clazz 类
	 * @param {Boolean} [override] 默认如果已存在名称相同类，会抛出异常，通过设置本标记强制重定义类
	 * @return clazz
	 */
	reg : function(n, cls, override){
		if(this._cls[n] !== UNDEFINED && !override){
			if(__debug) console.trace();
			throw '已定义类' + n;
		}
		this._cls[n] = cls;
		return cls;
	},
	
	/**
	 * 
	 * @param {Object} name
	 * @param {Object|Fu}
	 */
	use : function(n){
		// instance( type, config )
		var cls = this._cls[n];
		if (cls) {
		    // object only
		    if(typeof cls === 'object')
		        return cls;
		    // instance class
		    var cfg = arguments[1];
		    if( typeof cfg === 'function' )
		        return new cls(cfg(cls.prototype));
		    return new cls(cfg);
		}
		return NULL;
	},
	
/**
 * 检测当前页面是否为指定模块的页面。
 */
	isModule : function(name){
	    return this.getModule() === name;
	},
	
/***/
	getModule : function(){
	    if(this._mod === UNDEFINED){
	        if(this.getCfg('page')){
	            this._mod = this.getCfg('page');
	        }else {
    	        var url = location.href,
    	            idx = url.indexOf('?');
    	        if(idx !== -1){
    	            url = url.substring(idx+1);
    	            if(url){
    	                url = url.split('&');
    	                for(var i=0,len=url.length;i<len;i++){
    	                    var k = url[i].split('=');
    	                    if(k.length === 2 && k[0] === 'm'){
    	                        this._mod = k[1];
    	                        break;
    	                    }
    	                }
    	            }
    	        }
    
    	        if( this._mod === UNDEFINED )
    	            this._mod = FALSE;
    	        else {
                    var shareIdx = this._mod.indexOf('#');
                    if(shareIdx != -1)
                    this._mod = this._mod.substring(0, shareIdx);
    	        }
	        }
	    }
	    return this._mod;
	}
});


X.ax = {};

function split(str, splitChar, escChar){
    var c, arr = [], tmp = [];
    if(!escChar)
        escChar = '\\';

    for(var i=0,len=str.length;i<len;i++){
        c = str.charAt(i);
        if(c === splitChar){
            arr.push(tmp.join(''));
            tmp.length = 0;
            continue;
        }
        else if(c === escChar && str.charAt(i+1) === splitChar){
            c = splitChar;
            i++;
        }
        tmp[tmp.length] = c;
    }
    if(tmp.length)
        arr.push(tmp.join(''));
    return arr;
}

function parseKnV(strRel){
    var map = {}, kv, kvs = split(strRel, ',');
    try {
        for( var i=0,len=kvs.length;i<len;i++){
            // if not contains ':'
            // set k = TRUE
            if(kvs[i].indexOf(':') === -1){
                map[kvs[i]] = TRUE;
            }else {
                // split : to k and v
                kv = split(kvs[i], ':');
                // escape value
                map[kv[0]] = kv[1];
            }
        }
    }catch(e) { 
        if(__debug) console.trace();
        throw 'Syntax Error:rel字符串格式出错。' + strRel; 
    }

        return map;
}


// var actRegs =  [ /\\(,|:)/g, /(?!\\),/g, /(?!\\):/g ];

/**
 * @class Xwb.ax.ActionEvent
 * TODO:内部具有枚举功能，而传递的e则无。
<pre>
获得关联元素常用方法：
1. 给相关元素设定局部唯一ID
2. 利用e.jq()方法或$(e.getEl())返回一定范围父元素的jq对象
3. 根据设定的id获得相关元素
例：
function( e ){
    // rel="w:123765"
    var item = e.jq('w');
    var targetEl = item.find('#xwb_tar');
    // ...
}
</pre>
 */

/**
 * @property evt
 * @type DOMEvent
 */
/**
 * @property src
 * @type HTMLElement
 */
/**
 * @property data
 * @type Object
 */
function ActionEvent(rels){
    this.q = rels;
    // 初始状态
    this.idx = -1;
    // end pos
    this.end = this.q.length-1;
};


ActionEvent.prototype = {

// A标签默认prevented
    prevented : UNDEFINED,
    
    stopPropagationed : UNDEFINED,
    
/**
 * 向上查找数据
 * @param {String} name
 */
    get : function(name){
        var r = this.getRel(name);
        return r && r.data && r.data[name];
    },
/**
 *
 */
    escape : function(name){
        var v = this.get(name);
        if(v !== UNDEFINED)
            return escape(v);
    },
/**
 * 向上查找含有rel以name为键的元素。
 * @return {HTMLElement}
 */
    getEl : function(name){
        var r = this.getRel(name);
        return r && r.src;
    },
/**
 * 上溯DOM获得rel含有name键元素的jQuery对象
 * @return {jQuery}
 */
    jq : function(name, child){
        var jq =  $(this.getEl(name));
        if(child)
            jq = jq.find(child);
        return jq;
    },
    
// private
    getRel : function(name){
        var set = this.q;
        for(var i=this.idx,end=this.end;i<=end;i++){
            var d = set[i].data;
            if(d[name] !== UNDEFINED)
                return set[i];       
        }
    },
    
// private
    _next : function(){
        var nxt = this.q[++this.idx];
        // 最终状态
        if(nxt === UNDEFINED)
            this.idx = 0;
        return nxt;
    },

// 拷贝包括当前状态等所有数据。
// private
    clone : function(){
        var act = new ActionEvent(this.q);
        act.idx = 0;
        return act;
    },
    
/**
 * 默认prevent default
 */
    preventDefault : function(set){
        this.prevented = set;
    },
/**
 * 默认cancel bubble
 */    
    stopPropagation : function(set){
        this.stopPropagationed = set;
    },
/**
 * 标记当前动作，或获得当前动作标记。
 * 常用于标记以防止动作重复触发请求。
 * @param {Boolean} locked
 * @param {String} [name] name
 */
    lock : function(set, name){
        var k = 'xwb_e_' + this.data.e;
        if(name)
            k+= '_' + name;
        if(set === UNDEFINED)
            return $(this.src).data(k);
        $(this.src).data(k, set);
    }
};

/**@cfg {jqSelector} target*/
X.ax.ActionMgr = X.reg('ActionMgr', function(){
   this.actions = {};
   this.filters  = [];
   
   if(this.target){
        this.bind(this.target);
        delete this.target;
   }
});

var globalFilters = [];

X.ax.ActionMgr.prototype = {
    
    trigEvent : 'click',
    
    cacheNodeData : TRUE,
    
/**
 * act为方法时监听所有action
 */
    reg : function(act, handler, cfg){
        var d = { n : act, h : handler };
        if( cfg )
            $.extend( d, cfg );
        
        this.actions[act] = d;
        return this;
    },
/**获得一个action数据*/
    get : function( name ){
        return this.actions[ name ];
    },
/***/
    addFilter : function(filter, global){
        global ? globalFilters.push(filter) : this.filters.push(filter);
        return this;
    },
/***/
    bind : function(selector, evt){
        var scope = this;
        $(selector).bind(evt || this.trigEvent, function(e){
           var rels = scope.collectRels(e.target, this);
           rels && scope.fireRels(rels, e);
        });
        return this;
    },

/**
 * 可以手动触发
 */
    doAct : function(el, stopEl){
        var rels = this.collectRels(el, stopEl);
        return !(rels && this.fireRels(rels));        
    },
    
// private
    collectRels : function(trigSource, stopEl){
        var 
            rels, 
            cache = this.cacheNodeData, 
            rel, 
            self = this;
        // 往上收集rel
        Util.domUp(trigSource, function(el){
            var jq = $(el);
            
            if(cache){
                rel = jq.data('xwb_rel');
                if(!rel){
                    rel = jq.attr('rel');
                    if(rel){
                        rel = {src:el, data:self.parseRel(rel)};
                        jq.data('xwb_rel', rel);
                    }
                }
            }else {
                rel = jq.attr('rel');
                if(rel)
                    rel = {src:el, data:self.parseRel(rel)};
            }

            if(rel){
                if(!rels)
                    rels = [];
                rels[rels.length] = rel;
            }

        } , stopEl);
        
        return rels;
    },
    
    parseRel : function(rel){
        return parseKnV(rel);
    },
    
    wrapRel : function(el, stopEl){
        var rels = this.collectRels(el, stopEl);
        var e = new ActionEvent(rels);
        e._next();
        return e;
    },
    
    getRel : function(el, name, stopEl){
        return this.wrapRel(el, stopEl).get(name);
    },

/**
 * @return {Boolean} handled
 */
    fireRels : function(rels, evt){
        var e = new ActionEvent(rels);
        e.evt = evt;
        if(__debug) console.log('act e:', e);
        
        var rel, data,
            hs = globalFilters.length,
            hg = this.filters.length,
            handled,
            prevented, stopPropagationed;
        
        while ( (rel = e._next()) ){
           // 存在action
           data = rel.data;
           if(data.e){
               e.src  = rel.src;
               e.data = data;
                // 如果当前操作已锁定，取消操作并返回，防止重复响应
                if(!e.lock()){
                   var act = this.actions[data.e];
                   if( hs ){
                      handled = TRUE;
                      if( this._fireArray(globalFilters, e, act) === FALSE ){
                        stopPropagationed = e.stopPropagationed;
                        prevented     = e.prevented;
                        break;
                      }
                   }
                   
                   if( hg ){
                        handled = TRUE;
                        if( this._fireArray(this.filters, e, act) === FALSE ){
                            break;
                        }
                   }
                   stopPropagationed = e.stopPropagationed;
                   prevented     = e.prevented;
                   if(act){
                        // clone e
                        var hdE  = e.clone();
                        hdE.src  = e.src;
                        hdE.data = data;
                        hdE.evt  = evt;
                        if(__debug) console.log('act e:',hdE);
                        if(!handled)
                            handled = TRUE;
                        if( act.h.call(this, hdE) === FALSE){
                            if(hdE.stopPropagationed !== UNDEFINED)
                                stopPropagationed = hdE.stopPropagationed;
                            if(hdE.prevented !== UNDEFINED)
                                prevented = hdE.prevented;
                            break;
                        }
                        if(hdE.stopPropagationed !== UNDEFINED)
                            stopPropagationed = hdE.stopPropagationed;
                        if(hdE.prevented !== UNDEFINED)
                            prevented = hdE.prevented;
                   }
                }else { // marked
                    if(__debug) console.warn('action e:'+e.data.e+' has been locked for resubmiting');
                    handled = TRUE;
                    stopPropagationed = TRUE;
                    prevented = TRUE;
                    break;
                }
           }
        }
        
        if(evt && handled){
            // we defaultly preventDefault and stopPropagation
            if(prevented === UNDEFINED)
                prevented = TRUE;
            if(stopPropagationed === UNDEFINED)
                stopPropagationed = TRUE;
            
            if(prevented)
                evt.preventDefault();
    
            if(stopPropagationed)
                evt.stopPropagation();
        }
    },
/**
 * 如果未注册action:，act有可能为空，所以act应用时要作空检查
 */
    _fireArray : function(gs, e, act){
        for(var i=0,len=gs.length;i<len;i++)
            if( gs[i].call( this, e, act) === FALSE )
                return FALSE;
    }
};

// 页面action
X.reg('action', X.use('ActionMgr'));

// static , share var
var validators;

X.ax.Validator = X.reg('Validator', function(cfg){
    $.extend(this, cfg);
    this.init();
});

//
// validator(element, nextChain, strData, next)
//
function ElemValidatorGroupChain(mgr){
    this.mgr = mgr;
    this.nextChain = Util.bind(this.doNextChain, this);
}

var emptyObj = {};

ElemValidatorGroupChain.prototype = {

/**
 * 可重复调用
 */
    doChain : function(elem, validators, whenStop){
        var v = elem.value;
        if( typeof v === 'string')
            v = $.trim(v);
        this.elVal = v;
        this.tmpData = {};
        this.elem = elem;
        this.validators = validators;
        this.finalChain = whenStop;
        this.idx = -1;
        this.error = 0;
        this.doNextChain();
    },

    doNextChain : function(){
        this.idx++;
        if(this.idx >= this.validators.length){
          if(!this.error){
            if(__debug) console.log('onpass', this.elem);
            this.mgr.onpass(this.elem, this.elVal);
          }
          this.finalChain &&  this.finalChain();
        } else {
            var vds = this.validators[this.idx];
            // 跳过预处理
            if(vds.isPreCmd) {
                this.nextChain();
            }else{
                 if (typeof vds === 'function')
                     vds.call(this.mgr, this.elem, this.elVal, emptyObj , this.nextChain);    
                 else vds[0].call(this.mgr, this.elem, this.elVal, vds[1], this.nextChain);         
            }
        }
    }
};

/**
 * @property handlingElem
 * @type HTMLElement
 */
 
/**
 * @property data
 * 验证通过后表单提交的键值对
 * @type Object
 */

/**@cfg {Object} param */
/**@cfg {String|HTMLElement} trigger */
X.ax.Validator.prototype = {
    
    useCache  : TRUE,
    
    autoFocus : TRUE,
    
    tipName : 'warntip',
    
    tipTextNode : '#tle',
    // html, text, default html
    tipTextType:'',
    
    decorateTrigger : TRUE,
    
    
    // 1 单个提醒, 0 连续提醒
    warnType : 1,
    
    onerror   : function(elem, data){
        var tipId = $(elem).attr(this.tipName);
        if(tipId && data.m){
           var msgs = this.elValiChain.tmpData.errors;
           if(!msgs)
                msgs = this.elValiChain.tmpData.errors = [];
           msgs.push(data.m);
           var jqTip = $(tipId);
           var jqTxt = jqTip.cssDisplay(TRUE)
                       .find(this.tipTextNode);
           if(!jqTxt.length)
                jqTxt = jqTip;
           if(this.warnType === 1){
                if(msgs.length == 1){
                    this.tipTextType==='text'?jqTxt.text(msgs[0]):jqTxt.html(msgs[0]);
                }
           }else {
                this.tipTextType==='text'?jqTxt.text(msgs.join('，')):jqTxt.html(msgs.join('，'));
           }
        }
    },
    
    onpass : function(elem, data){
        var tipId = $(elem).attr(this.tipName);
        if(tipId)
            $(tipId).cssDisplay(FALSE);
    },
    
    onfinal   : $.noop,
    trigOnSubmit : TRUE,
    
    reg : function(cmd, validator) {
        if(!validators)
            validators = {};
        if($.isArray(cmd)){
            for(var i=0,len=cmd.length;i<len;i++){
                this.reg.apply(this, cmd[i]);
            }
        }else validators[cmd] = validator;
        return this;
    },
    
    add : function(eleName, validator){
        var extrav = this.extraValidators;
        if(!extrav)
            extrav = this.extraValidators = {};
            
        var links = extrav[eleName];
        if(!links)
            links = extrav[eleName] = [validator];
        else links.push(validator);
    },
    
    init : function(){
        if(!validators)
            validators = {};
        
        // add self validators    
        
        
        
        this.nextChain = Util.bind( this.doNextChain, this );
        this.elValiChain = new ElemValidatorGroupChain(this);
        
        this.form = $(this.form).get(0);
        // 执行预处理
        var elems = this.form.elements;
        var self = this;
        $.each(elems, function(){
            var vals = self.getEleValidators(this, FALSE, this.useCache);
            for(var i=0,len=vals.length;i<len;i++){
                if( vals[i].isPreCmd )
                    vals[i][0].call(self, this, vals[i][1]);
            }
        });
        var self = this;
        
        var trigFn = function(){
                self.validate();
                return FALSE;
        };
        
        if( this.trigOnSubmit )
            this.form.onsubmit = trigFn;
        
        if( this.trigger ){
            this.trigger = $(this.trigger)[0];
            $(this.trigger).click(function(){
               return trigFn();
            });
        }
    },
/**
 * 可单独对某元素进行验证
 */
    validElement : function(el, cmds, next){
        if(!this.isGlobalVal){
            this.error = 0;
            this.validElement0(el, cmds, next);
        }
    },

    validElement0 : function(el, cmds, next){
        var vds = this.getEleValidators(el, cmds);
        if(vds.length) 
            this.elValiChain.doChain(el, vds, next);
        else next && next();
    },
    
/**
 *
 */    
    validate : function(){
        // 防止重复提交
        if (!this.isGlobalVal) {
            this.elems = this.form.elements;
            this.currElIdx = -1;
            this.error = 0;
            this.isGlobalVal = TRUE;
            this.data = {};
            if( this.param )
               $.extend( this.data, this.param );
            
            if(this.decorateTrigger && this.trigger)
                Util.disable(this.trigger, TRUE);
            this.doNextChain();
        }
        return FALSE;
    },
    
    // @private
    finalChain : function(result){
        this.onfinal();
        this.isGlobalVal = FALSE;
        if(this.data)
            delete this.data;

        if(this.decorateTrigger && this.trigger)
            Util.disable(this.trigger, FALSE);
    },
    
    /**
     * 返回一个指令数组，可为指令字符串或数组。预处理保存在返回数组的preCmds属性
     * 为数组时，第一个为指令字符串，第二个为指令数据map结构。
     * 格式为 cmd=k:v,k2:v2|cmd2=k:v,k2:v2 ...
     * @private
     */ 
    parseCmd : function(strRel){
        var cmds = [], arr = split(strRel, '|'), kd;
        for(var i=0,len=arr.length;i<len;i++){
            if( arr[i].indexOf('=') === -1 ){
                kd = [arr[i],{}];
            }
            else {
                kd = split(arr[i], '=');
                kd[1] = parseKnV(kd[1]);
            }
            if(kd[0].charAt(0) === '_'){
                kd.isPreCmd = TRUE;
                kd[0] = kd[0].substr(1);
            }
            cmds[cmds.length] = kd;
        }
        return cmds;
    },
    
    // 转换后返回数组格式 [ [ function_validator, object_validator_data ] , ...]
    // @private
    getEleValidators : function(elem, rel){
        var cmds, useCache = FALSE;
        if( !rel ){
            rel = $(elem).attr('vrel');
            useCache = this.useCache;
        }
        if(rel){
            var jq = $(elem);
            if( useCache ){
                if( jq.data('xwb_vd_cmds') )
                    cmds = jq.data('xwb_vd_cmds');
                else {
                    cmds = this.parseCmd(rel);
                    jq.data('xwb_vd_cmds', cmds);
                }
            }
            else {
                cmds = this.parseCmd(rel);
            }

            // name => function
            // 先查找自身validator
            // 再查找全局validator
            var 
                // global share validators
                vds = validators, 
                // self validators
                selfVds = this.validators,
                cmd;
            for( var i=0,len=cmds.length;i<len;i++ ){
                    var k = cmds[i][0];
                    if( typeof k === 'string' ){
                        cmd = (selfVds && selfVds[k]) || vds[k];
                        if ( !cmd ){
                            if(__debug) console.trace();
                            throw 'Undefine cmd :'+k+',in element '+elem.name;
                        }
                        cmds[i][0] = cmd;
                    }
            }
        }else cmds = [];
        var extra = this.extraValidators;
        if( extra && extra[elem.name] )
            $.merge(cmds, extra[elem.name]);
        return cmds;
    },

/**
 * @param {Boolean} result
 * @param {Object}  elementValidationData
 */
    report : function(result, data){
        if(!result) {
            // 全局累计error
            this.error++;
            // 元素累计error
            this.elValiChain.error++;
            if(__debug) console.log('onerror', this.elValiChain.elem, data);
            this.onerror( this.elValiChain.elem, data );
            if(this.error === 1 && this.isGlobalVal && this.autoFocus)
                this.elValiChain.elem.focus();
        }
    },
    
    setValue : function(v){
        this.elValiChain.elVal = v;
    },

/**@cfg */
    onsuccess : function(data, finalChain){
        if(__debug) console.log(data);
        finalChain();
    },
    
    // @private
    doNextChain : function(){
        // collect pre data here
        // 部份可能无需验证
        var len = this.elems.length;
        
        if(this.currElIdx >= 0 && this.currElIdx < len && !this.error)
            this.collectValue(this.elems[this.currElIdx]);
        
        this.currElIdx++;
        if(this.currElIdx === len){
            
            if(!this.error){
                // 返回非false进行表单form提交
                // 返回false表示忽略FORM进行自定义提交（或ajax或其它）...
                // form submit后 nextChain不再生效，进行页面提交
                if( this.onsuccess(this.data, this.nextChain) !== FALSE )
                    this.form.submit();
            // 所有结束并失败后
            } else this.finalChain();
        }else if(this.currElIdx > len){
            // 成功callback调用后的chain
            this.finalChain();
        }else {
            var el = this.elems[this.currElIdx];
            if(el.disabled)
                this.doNextChain();
            else this.validElement0(el, FALSE, this.nextChain);
        }
    },
    
    // 验证通过无错情况下收集表单元素数据
    // @private
    collectValue : function(elem){
        if (elem.tagName === 'INPUT' && ( elem.type === 'radio' || elem.type === 'checkbox' )){
           if(elem.checked)
                this.data[elem.name] = elem.value;
        }
        else this.data[elem.name] = elem.value;
    }
};


/**
 * @class Xwb.ax.Uploader
 */

/**@cfg {String} action */
/**
 * @property isLoading
 * @type Boolean
 */
X.ax.Uploader = X.reg('Uploader', function(cfg){
    this.init(cfg);
});

X.ax.Uploader.prototype = {
    
    init : function( cfg ){
        $.extend( this, cfg );
        
        var form = this.form;
        var name = 'xwb_upload_frame_' + Util.uniqueId();
        this.iframe = T.forNode('<iframe src="about:blank" style="display:none;" id="'+name+'" name="'+name+'"></iframe>');
        
        //添加callback参数 ?? 为什么还要添加
        $('<input type="hidden" name="callback"/>').appendTo(form);
        
        $(this.iframe).appendTo( doc.body );
        
        form.target = name;
        
        if(!this.action)
            this.action = form.action || Req.apiUrl('action', 'upload_pic');
    },
    
/***/
    setAction : function(action){
        this.action = action;
        return this;
    },
    
    isLoading : function(){
        return !!this.jsonpFn;
    },
    
/**
 *  callback,可选
 */
    upload : function( callback ){
        
        if(this.isLoading())
            this.abort();
        
        var self = this,
            fn = this.jsonpFn = 'jsonp' + new Date().getTime();
        
        window[fn] = function(){
            window[fn] = NULL;
            delete self.jsonpFn;
            (callback||self.onload).apply(self, arguments);
            // 垃圾IE7
            delete self.jsonpFn;
        };
        
        this.form.action = Util.appendParam(this.action, {callback:'parent.'+fn, '_':Util.uniqueId()});
        this.form.submit();
    },

    onload : $.noop,
    
    abort : function(){
        if(this.isLoading()){
            var fn = this.jsonpFn;
            window[fn] = function(){
                window[fn] = NULL;
            };
        }
    }
};

X.ax.SelectionHolder = function(opt){
    $.extend(this, opt);
    if(!Util.hasSelectionSupport())
        this.initEvent(this.elem);
};

X.ax.SelectionHolder.prototype = {
    
    pos : -1,
    length : 0,
    
    initEvent : function(){
        var self = this;
        var fn = function(){
            try{
                self.saveSpot();
            }catch(e){}
        };
        $(this.elem)
          .mouseup(fn)
          .keyup(fn)
          .data('xwb_selholder', this);
    },
    
    saveSpot : function(){
        var elem = this.elem;
        this.pos    = Util.getCursorPos(elem);
        this.length = Util.getSelectionText(elem).length;
    },
    
    insertText : function(text){
        var elem = this.elem, 
            val  = elem.value;
        if(Util.hasSelectionSupport()){
            Util.replaceSelection(elem, text);
        }else {
            // append
            if(this.pos === -1){
                elem.value = val + text;
                Util.focusEnd(elem);
            }else {
                elem.value = Util.stringReplace(val, text, this.pos, this.pos+this.length);
                Util.setCursor(elem, this.pos+text.length);  
            }
        }
        this.saveSpot();
    },
    
    setText : function(text){
        this.elem.value = text;
        try{
            this.focusEnd();
        }catch(e){}
    },
    
    clearSpot : function(){
        this.length = 0;
        this.pos = -1;
    },
    
    focusEnd : function(){
        Util.focusEnd(this.elem);
        this.saveSpot();
    },
    
    focusStart : function(){
        Util.setCursor(this.elem, 0);
        this.saveSpot();
    }
};

X.reg('SelectionHolder', X.ax.SelectionHolder);

// context manager
var contextMgr = X.reg('contextMgr', {
	
	context : function(comp){

		if(comp.contexted)
			this.release(comp);

		var q = this.q;
		if(!q)
			this.q = q = [];
	    if(!q.length)
	        $(doc).mousedown(this._getDocEvtHandler());
	  
	    q[q.length] = comp;
	  
	    this._setCompEvtHandler(comp, TRUE);
	    comp.contexted = TRUE;
	    if(__debug) console.log('contexted', comp);
	},
	
	release : function(comp, e){
		comp.contexted = FALSE;
		if( comp.onContextRelease(e) !== FALSE ) {
    		this._setCompEvtHandler(comp, FALSE);
    		Util.arrayRemove(this.q, comp);
			if(!this.q.length)
			    $(doc).unbind('mousedown', this._getDocEvtHandler());
		} else comp.contexted = TRUE;
		
		if(__debug) console.log('release context', comp);
	},
/**
 * 释放所有已上下文绑定的控件，释放对于传递事件event由控件自身或控件子结点发出控件无效。
 * @param {DOMEvent} [event] 如果释放由DOM事件引发，传递该事件，如果事件由控件发出，包括子结点，则取消释放该控件。
 * @inner
 */
	releaseAll : function(e){
		var q = this.q;
		if (q) {
			var len = q.length;
			if(e)
			    var src = e.target;
			for (var s = len - 1; s >= 0; s--) {
				if(!src || !q[s].ancestorOf(src))
				    this.release(q[s], e);
			}
		}
	},
	
	_setCompEvtHandler : function(comp, set){
		set ? comp.domEvent('mousedown', this._compEvtStopHandler)
		    : comp.unDomEvent('mousedown', this._compEvtHandler);
	},
	
	_getDocEvtHandler : function(){
		 var hd = this.docEvtHd;
		 if(!hd)
		 	hd = this.docEvtHd = Util.bind(this._docHandler, this);
		 return hd;
	},

	_releaseFollower : function(curr, e){
		var q = this.q;
		if(q){
			var last = q.length - 1;
			// not the last one itself
			if(last !== -1 && q[last] !== curr){
				var len = last;
				for(;last>=0;last--){
					if(q[last] === curr)
						break;
				  this.release(q[last], e);
				}
		  }
		}
	},
	
	// component mouse down handler & stop event
	// scope : component	
	_compEvtStopHandler : function(e){
	    contextMgr._releaseFollower(this, e);
        return FALSE;
    },
    
	// component mouse down handler
	// scope : component
	_compEvtHandler : function(e){
		// cancel 后来者
		contextMgr._releaseFollower(this, e);
	},
	
	// document mouse down handler
	_docHandler : function(e){
		this.releaseAll(e);
	}
});

/**
 * @class Xwb.ui
 */

var ui   = X.ui = {
    Base : Util.create()
};

var Base = ui.Base;

/**
 * @class Xwb.ui.Base
 */
/**@cfg {Boolean} closeable*/
/**@cfg {String} titleNode*/
/**@cfg {String} clsNode*/
/**@cfg {Function} onViewReady*/
/**@cfg {String} title*/
/**@cfg {String|HTMLElement|HtmlTemplate} onViewReady*/
/**@cfg {Boolean} actionMgr*/
/**@cfg {Function} onactiontrig*/
/**@cfg {Boolean} autoRender*/

function getReadyView(){
    return this.view;
}

ui.Base.prototype = {
        
        autoRender : FALSE,
        
        titleNode : '#xwb_title',
        
        init : function(opt){
            this.cacheId = 'c' + Util.uniqueId();
            opt && $.extend(this, opt);
            this.initUI();
            
            if(this.autoRender)
                this.getView();
        },
        
        initUI : $.noop,
        
        clsNode : '#xwb_cls',
        
        initClsBehave : function(cls){
            this.jq(this.clsNode).click(Util.bind(this.onClsBtnClick, this));
            this.setCloseable(cls);
        },
        
        setCloseable : function(cls){
            this.fly(this.clsNode).display(cls);
            this.closeable = cls;
        },
        
        onClsBtnClick : function(){
            this.close(TRUE);
            return FALSE;
        },
    
        close : function(){
            if(!this.onclose || this.onclose() !== FALSE){
                if(this.destroyOnClose)
                    this.destroy();
                else this.display(FALSE);
            }
        },
        
        tplData : false,
        
/**
 * 由html创建或选择器定位UI图视结点
 */
        createView : function(){
            var v = this.view;
            if(typeof v === 'string'){
                v = this.view = T.forNode(T[v], this.tplData || this, TRUE);
            }else this.view = v = doc.createElement('DIV');
            return v;
        },
        
        innerViewReady : $.noop,
        
        setTitle : function(tle){
            this.jq(this.titleNode).html(tle);
            return this;
        },
        
    /**
     * 获得窗口视图DOM结点。
     * 子类不能重写该方法。
     * @return {HTMLElement}
     */ 
        getView : function(){
          var v = this.view;
          if(!v || !v.tagName)
            v = this.createView();

          // rewrite
          this.getView = getReadyView;
          
            if(this.hidden !== UNDEFINED){
                var tmp = this.hidden;
                this.hidden = UNDEFINED;
                this.display(!tmp);
            }

            if(this.appendTo){
                $(this.appendTo).append(v);
                delete this.appendTo;
            }
            
            if(this.closeable !== UNDEFINED)
                this.initClsBehave(this.closeable);
                
            if(this.actionMgr === TRUE){
                this.actionMgr = X.use('ActionMgr');
                this.actionMgr.bind( v );
                if(this.onactiontrig){
                    var self = this;
                    this.actionMgr.addFilter(function(e){
                        return self.onactiontrig(e);
                    });
                }
            }
          // interval method
          this.innerViewReady(v);
          // config method
          this.onViewReady && this.onViewReady(v);
          return v;
        },
        
        beforeShow : $.noop,
        afterShow  : $.noop,
        beforeHide : $.noop,
/**
 * 以一定格式生成ID元素对应的jq对象。
 * 如 
 * jqExtra('inputor');
 * alert( this.jqInputor );
 */
        jqExtra : function(ids){
            for(var args = arguments,i=0,len=args.length;i<len;i++){
                var k    = args[i];
                var jqEl = this.jq('#'+k);
                if( jqEl ){
                    // 首字母大写
                    k = k.charAt(0).toUpperCase() + k.substring(1);
                    this['jq'+k] = jqEl;
                }
            }
            return this;
        },
/**
 * 显示/隐藏或获得UI的显示或隐藏属性
 * @param {Object} show
 * @return this
 */
        display : function(b){
            var j = this.jq();

            if(b === UNDEFINED)
                return !j.hasClass(hidCls);
            b = !b;
            if(this._flied || this.hidden !== b){
                if(!b) {
                    this.hidden = b;
                    j.css('visibility', 'hidden').removeClass(hidCls);
                    this.beforeShow();
                    j.css('visibility', '');
                    if( this.contextable && !this.contexted)
                        this.setContexted(TRUE);

                    this.afterShow();
                }else {
                    if(this.beforeHide() !== FALSE){
                        this.hidden = b;
                        j.addClass(hidCls);
                        this.afterHide && this.afterHide();
                        // release contexted on hide
                        if(this.contexted)
                           this.setContexted(FALSE);
                    }
                }
            }
			return this;
        },
        
        onContextRelease : function(){
            this.display(FALSE);    
        },
        
        appendAt : function(a){
            $(a).append(this.getView());
            return this;
        },
    /**
     * 是否包含a元素.
     */
        ancestorOf :function(a, depth){
          a = a.view || a;
          var v = this.view;
          if (v.contains && !$.browser.webkit) {
             return v.contains(a);
          }else if (v.compareDocumentPosition) {
             return !!(v.compareDocumentPosition(a) & 16);
          }
    
          if(depth === UNDEFINED)
            depth = 65535;
          var p = a.parentNode, bd = doc.body;
          while(p!= bd && depth>0 && p !== NULL){
            if(p == v)
              return TRUE;
            p = p.parentNode;
            depth--;
          }
          return FALSE;
        },
        
        jq : function(selector){
            return selector === UNDEFINED ? $(this.getView()) : $(this.getView()).find(selector);
        },
        
        fly : function(el){
            if(typeof el === 'string')
                el = this.jq(el);
            return Base.fly(el);
        },
        
        unfly : function(){
            delete this.view;
        },
        
        destroy : function(){
            this.display(FALSE);
            this.jq().remove();
        },
        
        domEvent : function(evt, fn, child){
            if(evt === 'mousedown'){
                var comp = this;
                var wrapper = function(e){
    	           	if(!comp.contexted)
    					contextMgr.releaseAll(e);
    			    fn.apply(comp, arguments);
                };
                
                if(!this._mousedownFns)
                    this._mousedownFns = {};
                this._mousedownFns[fn] = wrapper;
                
                this.jq(child).bind(evt, wrapper);
            }else this.jq(child).bind(evt, fn);
        },
        
        unDomEvent : function(evt, fn, child){
            if(evt === 'mousedown'){
                var wrapper = this._mousedownFns[fn];
                this.jq(child).unbind(evt, wrapper);
                delete this._mousedownFns[fn];
            }else this.jq(child).unbind(evt, fn);
        },
     
        /**
         * 添加上下文切换效果,当点击控件区域以外的地方时隐藏控件。
         * @see #onContextRelease
         * @return {Xwb.ui.Base} this
         */
        setContexted : function(set){
        	if(this.contexted !== set)
        		set ? contextMgr.context(this):contextMgr.release(this);
        	return this;
        },
        
        templ : function(obj){
            for(var selector in obj){
                this.jq(selector).html(obj[selector]);
            }
            return this;
        },
		
		offset : function(){
			if(arguments.length){
				this.jq().css(arguments[0]);
				return this;
			}
			return this.jq().offset();
		},
		// pa:l,r,t,b, pb:l,r,c
		anchor : function(targetEl, pos, prehandler){
		    var jqT  = $(targetEl), jq = this.jq();
		    var toff = jqT.offset(),
		        tw   = jqT.width(),
		        th   = jqT.height(),
		        sw   = jq.width(),
		        sh   = jq.height();
		    var pa = pos.charAt(0), pb = pos.charAt(1);
		    var l = toff.left, t = toff.top;
		    switch(pa){
		        case 't' :
		            t-=sh;
		        break;
		    }
		    
		    switch(pb){
		        case 'c' :
		            l+= Math.floor((tw-sw)/2);
		        break;
		    }
		    
		    if(prehandler){
		        var ret = ret = [l, t];
		        prehandler(ret, sw, sh);
		        l = ret[0];
		        t = ret[1];
		    }
		    
		    jq.css('left', l+'px')
		      .css('top', t+'px');
		},
		
        center : function(){
          var jq  = this.jq(),
              sz  = [jqWin.width(), jqWin.height()],
              dsz = [jq.width(), jq.height()],
              off = (sz[1] - dsz[1]) * 0.8;
          this.view.style.left = Math.max((((sz[0] - dsz[0]) / 2) | 0), 0) + $(doc).scrollLeft() + 'px';
          this.view.style.top  = Math.max(off - off/2|0, 0)+$(doc).scrollTop() + 'px';
          return this;
        },
        
        // 调用前设置view, visibility:hidden, display:NOT HIDDEN
        // clip后wrapper是visiblity隐藏的
        clip : function(){
            if(!Base.CLIP_WRAPPER_CSS){
                Base.CLIP_WRAPPER_CSS = {
                    position:'absolute',
                    clear : 'both',
                    overflow:'hidden'
                };
                Base.CLIPPER_CSS = {
                    position:'absolute',
                    left:0,
                    top:0
                };
            }
            // 防止多次调用时产生多层包裹
            if(!this.jqClipWrapper){
                var jqWrap = $(Cache.get('div')),
                    v      = this.getView(),
                    jq     = this.jq(),
                    pNode  = v.parentNode,
                    voff   = jq.offset();
                    
                jqWrap.css(Base.CLIP_WRAPPER_CSS)
                      .css(voff)
                      .css('width', jq.width()+'px')
                      .css('height', jq.height()+'px')
                      .css('z-index', jq.css('z-index'))
                      .append(v);
    
                // 保存状态，clip结束恢复
                var tmpCps = this._tmpClipedCss = {};
                for(var k in Base.CLIPPER_CSS){
                    tmpCps[k] = v.style[k];
                }
                jq.css(Base.CLIPPER_CSS);
                
                pNode && jqWrap.appendTo(pNode);
                this.jqClipWrapper = jqWrap;
            }
            return this.jqClipWrapper;
        },
        
        unclip : function(){
            if(this.jqClipWrapper){
                var wr = this.jqClipWrapper[0],
                    wrst = wr.style,
                    jq = this.jq(),
                    st = jq[0].style;
                
                for(var k in Base.CLIP_WRAPPER_CSS)
                    wrst[k] = '';
    
                this.jqClipWrapper
                    .css('overflow','')
                    .css('width','')
                    .css('height','');
                
                var tmpCps = this._tmpClipedCss;
                for(k in tmpCps)
                    st[k] = tmpCps[k];
                delete this._tmpClipedCss;
                
                wr.removeChild(jq[0]);
                if(wr.parentNode)
                    this.jqClipWrapper.replaceWith(jq);
                Cache.put('div', wr);
                delete this.jqClipWrapper;
           }
        },
        
        // 如果是隐藏，调用前要设置visiblity:hidden,display:NOT HIDDEN
        slide : function(fromto, show, fn, props, duration, easing){
            var jq = this.jq(),
                l  = 0, t  = 0,
                w  = jq.width(),
                h  = jq.height(),
                fl = l,ft = t,tl = l,tt = t,
                jqWr = this.clip();
            var from = fromto.charAt(0), 
                to = fromto.charAt(1);
            switch(from){
                case 'l' :
                    fl = l-w;
                break;
                case 'r':
                    fl = l+w;
                break;
                case 't':
                    ft=t-h;
                break;
                case 'b':
                    ft=t+h;
                break;
            }
            
            switch(to){
                case 'l' :
                    tl = l-w;
                break;
                case 'r':
                    tl = l+w;
                break;
                case 't':
                    tt=t-h;
                break;
                case 'b':
                    tt=t+h;
                break;
            }
            jq.css('left',fl)
              .css('top',ft);
            if(!props) props = {};
            if(tl!=fl){
                props.left = props.left === UNDEFINED?tl:props.left + tl;
            }
            if(tt!=ft){
                props.top  = props.top===UNDEFINED?tt:props.top+tt;
            }
            if(show)
                jq.css('visibility','');
            var self = this;
            jq.animate(props, duration||'fast', easing , function(){
                if(!show){
                    self.display(FALSE);
                    jq.css('visibility', '');
                }
                setTimeout(function(){
                    self.unclip();
                    fn && fn(self);
                }, 0);
            });
        }
};

var flied = new ui.Base();
flied._flied = TRUE;
flied.unfly = function(){
	this.view = NULL;
};

Base.fly = function(el){
    if(el){
      if(typeof el === 'string')
        el = $(el)[0];
      else if(el.get) 
        el = el[0];
    }
	flied.view = el;
	return flied;
};


/**
 * @property cbase
 * @member Xwb.Types
 */

X.reg('base', Base);


var PopupKBMonitor = {
	
	layers : [],
	
	hash : {},
	
	keyListeners : 0,
	
	add : function(layer){
		var cid = layer.cacheId;
		if(!this.hash[cid]){
			this.layers.push(layer);
			if(layer.keyEvent){
				if(this.keyListeners === 0){
					if(__debug) console.log('bind key listener');
					$(doc).bind('keydown', this.getEvtHandler());
				}
				this.keyListeners++;
			}
			this.hash[cid] = TRUE;
	  }
	},
	
	remove : function(layer){
		var cid = layer.cacheId;
		if(this.hash[cid]){
			var ly = this.layers;
			if(ly[ly.length - 1] === layer)
				ly.pop();
		  else Util.arrayRemove(ly, layer);
			
			this.keyListeners--;
			if(this.keyListeners===0){
				if(__debug) console.log('remove key listener');
				$(doc).unbind('keydown', this.getEvtHandler());
			}
			delete this.hash[cid];
	  }
	},
	
	getEvtHandler : function(){
		  var kh = this._onDocKeydown;
		  if( !kh )
		  	kh = this._onDocKeydown = Util.bind( this.onDocKeydown, this );
		  return kh;
	},
	
	onDocKeydown : function(e){
			var top = this.layers[this.layers.length-1];
			if(top && top.keyEvent)
				return top.onKeydown(e);
	}
};



var jqWin = $(window);

/**
 * @class Xwb.ui.Layer
 */
 
/**@cfg {Boolean} destroyOnClose */

var Layer = ui.Layer = Util.create(Base, {
    
    hidden : TRUE,
    
    onViewReady : $.noop,
    
/**
 * 手动更新窗口zindex，默认是自动更新。
 * 当同时显示多个窗口时,调用该方法可使窗口置顶。
 * 适用于position:absolute, fixed面板
 */
    trackZIndex : function(){
      if(this.z !== currentZ){
         currentZ += 3;

        if(this.mask)
            $(this.mask).css('z-index', currentZ - 1);
        
        if(this.frameMask)
            $(this.getFrameMask()).css('z-index', currentZ - 2);
        
        this.jq().css('z-index', currentZ);
        this.z = currentZ;
      }
    },
    
    keyEvent : TRUE,

    onKeydown : function(e){
    	// esc
    	if(e.keyCode === 27 && !this.cancelEscKeyEvent){
    		this.close();
    		return FALSE;
    	}
    },
    
    // override
    beforeShow : function(){
        if(this.mask)
            this._applyMask(TRUE);
        var pos = this.jq().css('position');
        if( pos === 'absolute' || pos === 'fixed' )
            this.trackZIndex();
        PopupKBMonitor.add(this);
        
        if(this.autoCenter)
            this.center();
    },
    
    
    // override
    afterHide : function(){
        if(this.mask)
            this._applyMask(FALSE);
        PopupKBMonitor.remove(this);
    },
	
	getFrameMask : function(){
	    if(this.frameMaskEl)
	        return this.frameMaskEl;
	    // 因为iframe层比较特殊，较少变动，所以直接写在这里而不必JS HTML模板里。
	    this.frameMaskEl = T.forNode('<iframe class="shade-div shade-iframe" frameborder="0"></iframe>');
	    return this.frameMaskEl;
	},
	
    _applyMask : function(b){
      var mask = this.mask;
      if(!mask || mask === TRUE)
        mask = this.mask = T.forNode(T.Mask);
      
      var wh = jqWin.height();
      if(b){
        $(mask).height( wh ).appendTo(doc.body);
        if(this.frameMask)
            $(this.getFrameMask()).height(wh).appendTo(doc.body);
        // window resize event handler
        $(window).bind('resize', Util.getBind(this, 'onMaskWinResize'));
      }else {
        $(mask).remove();
        if(this.frameMask)
            $(this.getFrameMask()).remove();
        $(window).unbind('resize', Util.getBind(this, 'onMaskWinResize'));
      }
    },
    
    onMaskWinResize : function(){
      var mask = this.mask, wh = jqWin.height();
      if(mask)
        $(mask).height( wh );
        
        if(this.frameMask)
            $(this.getFrameMask()).height(wh);
      
      if(this.autoCenter)
            this.center();
    }
});

/**
 * @property layer
 * @member Xwb.Types
 */
X.reg('Layer', Layer);

/**
 * @class Xwb.ui.Switcher
 * @constructor
 * @param {Object} config
 */

/**
 * @cfg {DOMCollection} items
 */

/**
 * @cfg {DOMCollection} contents
 */

/**
 * @cfg {Boolean} autoRecover 当鼠标离开时是否自动复原
 */

/**
 * @cfg {Boolean} enableBubble
 */
/**
 * @cfg {Boolean} delaySelect 在{@link trigMode}为hover情况下鼠标划过时延迟选择，单位ms，默认不延迟
 */

/**
 * @cfg {Boolean} delayHide
 */
/**
 * @cfg {Boolean} autoRecover
 */

/**
 * @cfg {Boolean} autoRecover
 */

/**
 * @cfg {String} trigMode click，hover，默认click，点击时才触发选择，如果设为hover时，鼠标移上就会触发。
 */

/**
 * @cfg {String} clickEvent 如果触发选择的方式为'click'，设置选择触发事件，默认为mousedown，可以改为'click'事件。
 */

/**
 * @cfg {Function} onselect onselect(selectedItem)，仍可以通过 switcher.selectedItem访问上一个选择项。
 */
ui.Switcher = function(opt){
	opt && $.extend(this, opt);
	this.initUI();
};

/**
 * @property switcher
 * @member Xwb.Types
 */
X.reg('Switcher', ui.Switcher);

ui.Switcher.prototype = {
	trigMode : 'click',
	initUI : function(){
		if (this.items)
			this.add(this.items, this.contents);
	},
/**
 * 
 * @param {HTMLElement} item
 */
	select : function(item){

        var pre = this.selectedItem;
		
		if (this.autoRecover)
            this.clearTimer(1);
        
        //先显示当前项再隐藏先前的,使得过渡平滑,而不造成闪烁
        if(this.selectedCS){
            pre && $(pre).removeClass(this.selectedCS);
			$(item).addClass(this.selectedCS);
		}

		// select callback
		this.onselect && this.onselect(item);
		
        this.selectedItem = item;
		
		if (item.contentEl) {
            var cp = item.contentEl;
            // 把显示延迟至上一次界面更新之后,
			// 可保持用户操作流畅响应
			// 如果不需要这效果，可直接调用unselect(pre)
            setTimeout( function(){
                if (pre && pre.contentEl) 
					Base.fly(pre.contentEl).display(FALSE).unfly();
                Base.fly(cp).display(TRUE).unfly();
            }, 0 );
        }
	},

/**
 * 
 * @param {HTMLElement} item
 */	
	unselect : function(item){
        if(this.selectedCS)
            $(item).removeClass(this.selectedCS);
        
        if(item.contentEl)
            Base.fly(item.contentEl).display(FALSE).unfly();
		
		if(this.mouseoutTimer)
		    this.clearTimer(1);
	
        this.selectedItem = NULL;
	},
	
	// private , type=0, mouseover; 1, mouseout
	clearTimer : function(type){
		if (type !== 0) {
			if (this.mouseoutTimer) {
				clearTimeout(this.mouseoutTimer);
				this.mouseoutTimer = FALSE;
				this.mouseoutTimerFn = FALSE;
			}
		}else {
			if (this.mouseoverTimer) {
				clearTimeout(this.mouseoverTimer);
				this.mouseoverTimer = FALSE;
				this.mouseoverTimerFn = FALSE;
			}
		}
	},
/**
 * 
 * @param {HTMLElement|Array} item
 * @param {HTMLElement|Array} panel
 */
    add: function(item, panel){
		if(item.length){
		    if(panel){
			    for(var i=0,len=item.length;i<len;i++)
				    this.add(item[i], panel[i]);
		    }else for(var i=0,len=item.length;i<len;i++)
				    this.add(item[i]);
			return;
		}
		
		var jq = $(item);
        var switcher = this;
		
		// 在录入时已标记选择
        if(jq.hasClass(this.selectedCS)){
            if(this.selectedItem)
                this.unselect();
            this.selectedItem = item;
        }
        
		if(panel) 
		    item.contentEl = panel;
		
		// install hover event handler
        if (this.trigMode === 'hover' || this.autoRecover) {
			jq.hover(	// mouse over
			function(e){
				if (switcher.autoRecover && switcher.mouseoutTimer) {
					switcher.clearTimeout(1);
				}
				
				// trig mode
				if (switcher.trigMode === 'hover') {
					var pre = switcher.selectedItem;
					if (this !== pre) {
						if (switcher.delaySelect) {
							// 重置定时
							if (switcher.mouseoverTimer) 
								switcher.clearTimeout(0);
							switcher.mouseoverTimer = setTimeout(function(){
								switcher.select(item);
							}, switcher.delaySelect);
						}
						else 
							switcher.select(this);
					}
				}
				
				return !switcher.enableBubble;
			}, 
			// mouse out
			function(e){
			
				if (switcher.mouseoverTimer) 
					switcher.clearTimeout(0);
				
				if (switcher.trigMode === 'hover') {
					var pre = switcher.selectedItem;
					if (this !== pre && switcher.mouseoutTimerFn) {
						switcher.mouseoutTimerFn();
						switcher.mouseoutTimerFn = NULL;
					}
					
					var el = e.target, f = Base.fly(this);
					if (switcher.autoRecover && (el === this || f.ancestorOf(el))) {
						if (!switcher.mouseoutTimer) {
							var nd = this;
							switcher.mouseoutTimerFn = function(){
								switcher.unselect(nd);
							};
							switcher.mouseoutTimer = setTimeout(switcher.mouseoutTimerFn, switcher.delayHide || 500);
						}
					}
					f.unfly();
				}
				return !switcher.enableBubble;
			});
		}
		
	   // install click event handler
	   if(this.trigMode === 'click'){
	   		jq.bind(this.clickEvent||'mousedown', function(){
				switcher.select(this);
			});
	   }
    }
};


ui.Box = X.reg('Box', Util.create(ui.Layer, {
    view : 'Box'
}));


/**
 * @class Xwb.ui.Tip
 * @extends Xwb.ui.Layer
 */

/**
 * @cfg {Boolean} stayHover stay on mouseover and hide on mouseout, defaults to FALSE
 */
 
ui.Tip = X.reg('Tip', Util.create(ui.Box, {
    cs : 'win-fixed',
/**
 * @cfg {Boolean} autoHide defaults TRUE
 */      
    autoHide : TRUE,
/**
 * @cfg {Number} timeoutHide defaults to 500 ms
 */    
    timeoutHide : 500,
    
    stayHover : FALSE,
/**
 * @cfg {Number} offX 面板定位时往瞄点X方向的偏移增量，默认25
 */
    offX : 25,
/**
 * @cfg {Number} offX 面板定位时往瞄点Y方向的偏移增量，默认-10
 */
    offY : -10,
        
    // override
    innerViewReady : function(v){
        var jq = this.jq();
        if(this.stayHover){
            jq.hover(
                Util.bind(this.onMouseover, this),
                Util.bind(this.onMouseout, this)
            );
        }
    },
    
    onMouseover : function(){
        this.clearHideTimer();
    },
    
    onMouseout : function(){
        this.setHideTimer();
    },
    
/**
 * 清除超时隐藏
 */
    clearHideTimer : function(){
        if(this.hideTimerId){
            clearTimeout(this.hideTimerId);
            this.hideTimerId = FALSE;
        }
    },
    
    beforeShow : function(){
        if( Layer.prototype.beforeShow.apply(this, arguments) === FALSE )
            return FALSE;
        
        if(this.autoHide)
            this.setHideTimer();
    },
    
    
/**
 * 开始超时隐藏,在指定时间内隐藏
 */
    setHideTimer : function(){
        this.clearHideTimer();
        this.hideTimerId = setTimeout(this._getHideTimerCall(), this.timeoutHide);
    },
    
    _onTimerHide : function(){
        this.display(FALSE);
    },
    
    _getHideTimerCall : function(){
        if(!this._onHideTimer){
            this._onHideTimer = Util.bind(function(){
                this._onTimerHide();
                this.clearHideTimer();
            }, this);
        }
        return this._onHideTimer;
    }
    
}));

/**
 * @class Xwb.ui.Dialog
 * @extends Xwb.ui.Box
 */

/**
 * @cfg {String} buttonTpl 指定单个按钮的HTML模板
 */

/**
 * @cfg {String} buttonHtml 指定所有按钮的HTML模板
 */
/**
 * @cfg {String} defBtn default focused button id
 */
ui.Dialog = X.reg('Dlg', Util.create(ui.Box, function(father){
    return {
        
        cs : 'win-tips win-fixed',
        
        contentHtml : 'DialogContent',
        
        focusBtnCs : 'highlight',
        
        mask : TRUE,
        
        closeable : TRUE,
        
        // 创建按钮html
        initUI : function(){
            if(this.buttons && !this.buttonHtml){
                var htmls = [];
                for(var i=0,btns=this.buttons,len=btns.length;i<len;i++){
                    htmls.push(T.parse(this.buttonTpl || 'Button', btns[i]));
                }
                this.buttonHtml = htmls.join('');
            }
            father.initUI.call(this);
        },
        
        setFocus : function(btn){
            if(btn || this.defBtn)
                this.jq('#xwb_btn_' + (btn||this.defBtn)).focus().addClass(this.focusBtnCs);
        },
        
        afterShow : function(){
            father.afterShow.call(this);
            if(this.defBtn)
                this.setFocus();
        },
        
        onbuttonclick : function(eid){
            if(__debug) console.log(eid+' clicked');
        },
        
        setHandler : function(handler){
            this.onbuttonclick = handler;
            return this;
        },
        
        getButton : function(bid){
            return this.jq('#xwb_btn_' +bid);
        },
         
        innerViewReady : function(v){
            father.innerViewReady.call(this, v);
            var w = this;
            $(v).find('#xwb_dlg_btns').click(function(e){
                var btn = Util.domUp(e.target, function(el){
                        return el.id && ( el.id.indexOf('xwb_btn_') ===0 );
                    }, this);
                if(btn){
                    var eid = btn.id.substr('xwb_btn_'.length);
                    if( w.buttons ){
                        $.each( w.buttons, function(){
                            if(this.id === eid){
                                var ret;
                                if(this.onclick)
                                    ret = this.onclick(w);
                                
                                if(ret !== FALSE && w['on'+eid])
                                    ret = w['on'+eid]();
                                    
                                if(ret !== FALSE)
                                   if( w.onbuttonclick(eid) !== FALSE )
                                    w.close();
                            }
                        });
                    }
                    return FALSE;
                }
            });
        }
    };
}));

/**
 * @class ui.MsgBox
 * @static
 */

ui.MsgBox = X.reg('msgbox', {
    
    getSysBox : function(){
        var w = this.sysBox;
        if(!w){
            w = this.sysBox =  X.use('Dlg', {
                appendTo:doc.body,
                title:'提示',
                dlgContentHtml : 'MsgDlgContent',
                mask : TRUE,
                //对话框默认按钮
                buttons : [
                  {title: '确&nbsp;定',     id :'ok'},
                  {title: '取&nbsp;消',     id :'cancel'},
                  {title: '&nbsp;是&nbsp;', id :'yes'},
                  {title: '&nbsp;否&nbsp;', id :'no'},
                  {title: '关&nbsp;闭',     id :'close'}
                ],
                
                /***/
                setContent : function(html){
                    this.jq('#xwb_msgdlg_ct').html(html);
                },
                
                setIcon : function(icon){
                    var jq = w.jq('#xwb_msgdlg_icon');
                    jq.attr('className', jq.attr('className').replace(/icon\-\S+/i, 'icon-'+icon));
                },
                
                afterHide : function(){
                    ui.Dialog.prototype.afterHide.call(this);
                    // 复原callback
                    this.onbuttonclick = ui.Dialog.prototype.onbuttonclick;
                }
            });
        }
        return w;
    },
    
    getTipBox : function(){
        var w = this.tipBox;
        if(!w){
            w = this.tipBox = X.use('Tip', {
                cs : 'win-tips win-fixed',
                contentHtml : 'DialogContent',
                appendTo:doc.body,
                view : 'Box',
                title:'提示',
                timeoutHide:1200,
                dlgContentHtml : 'MsgDlgContent',

                setContent : function(html){
                    this.jq('#xwb_msgdlg_ct').html(html);
                },
                
                setIcon : function(icon){
                    var jq = w.jq('#xwb_msgdlg_icon');
                    jq.attr('className', jq.attr('className').replace(/icon\-\S+/i, 'icon-'+icon));
                },
                
                afterHide : function(){
                    ui.Tip.prototype.afterHide.call(this);
                    // 复原callback
                    if(this.onhide){
                        this.onhide();
                        this.onhide = FALSE;
                    }
                }
            });
        }
        return w;
    },
    
    getAnchorDlg : function(){
        var w = this._anchorDlg;
        if(!w){
            w = this._anchorDlg = X.use('Dlg', {
                cs:'win-tips-ask',
                mask : FALSE,
                dlgContentHtml:'AnchorDlgContent', 
                appendTo:doc.body,
                //对话框默认按钮
                defBtn:'ok',
                buttons : [
                  {title: '确&nbsp;定',     id :'ok'},
                  {title: '取&nbsp;消',     id :'cancel'}
                ],
                setAnchor : function(anchorElem){
                    this.anchorEl = anchorElem;
                    return this;
                },
                
                beforeShow : function(){
                    ui.Dialog.prototype.beforeShow.call(this);
                    if(this.anchorEl){
                        this.anchor(this.anchorEl, 'tc', function(ret, sw, sh){
                            ret[1]-=2;
                        });
                        var self = this;
                        this.slide('bc',TRUE, function(){
                            ui.Dialog.prototype.afterShow.call(self);
                        });
                    }
                },
                
                // 置为空，在效果完成后再调用父类afterShow
                afterShow : $.noop,
                
                beforeHide : function(){
                    if(this.anchorEl){
                        this.slide('cb',FALSE);
                        delete this.anchorEl;
                        return FALSE;
                    }else ui.Dialog.prototype.beforeHide.call(this);
                },
                
                afterHide : function(){
                    ui.Dialog.prototype.afterHide.call(this);
                    // 复原callback
                    this.onbuttonclick = ui.Dialog.prototype.onbuttonclick;
                }
            });
        }
        return w;
    },
    
    getAnchorTip : function(){
        var w = this._anchorTip;
        if(!w){
            w = this._anchorTip = X.use('Tip', {
                view : 'Box',
                cs:'operate-success',
                contentHtml:'AnchorTipContent', 
                appendTo:doc.body,
                timeoutHide:1800,
                setAnchor : function(anchorElem){
                    this.anchorEl = anchorElem;
                    return this;
                },
                
                beforeShow : function(){
                    if(this.anchorEl){
                        this.anchor(this.anchorEl, 'tc', function(ret, sw, sh){
                            ret[1]-=8;
                        });
                        this.slide('bc',TRUE);
                    }
                    ui.Tip.prototype.beforeShow.call(this);
                },
                
                beforeHide : function(){
                    if(this.anchorEl){
                        this.slide('cb',FALSE);
                        delete this.anchorEl;
                        return FALSE;
                    }else ui.Tip.prototype.beforeHide.call(this);
                }
            });
        }
        
        return w;
    },
    
    tipError : function(msg, fn){ this.tip(msg, 'error', fn); },
    tipOk : function(msg, fn){ this.tip(msg, 'success', fn); },
    tipWarn : function(msg, fn){ this.tip(msg, 'alert', fn); },
    anchorTipOk : function(elem, msg, fn){ this.anchorTip(elem, msg); },
    anchorConfirm : function(elem, msg, fn){
        var dlg = this.getAnchorDlg();
        dlg.setTitle(msg)
           .setHandler(fn)
           .setAnchor(elem)
           .display(TRUE);
    },
    
    tip : function(msg, icon, fn){
        var tip = this.getTipBox();
        tip.setIcon(icon||'alert');
        tip.setContent(msg||'');
        tip.display(TRUE);
        fn && (tip.onhide = fn);
    },
    
    anchorTip : function(anchorElem, msg, icon, fn){
        var tip = this.getAnchorTip();
        tip.setTitle(msg)
           .setAnchor(anchorElem)
           .display(TRUE);
    },
    
    alert : function(title, msg, callback, buttons, icon, def){
        var w = this.getSysBox(), btns = w.buttons, f = Base.fly(w.view);
        if(!buttons)
            def = buttons = 'ok';
        if(!icon)
            icon = 'alert';
        for(var i=0,len=btns.length;i<len;i++){
            f.fly( w.jq('#xwb_btn_'+btns[i].id).get(0) ).display( buttons.indexOf( btns[i].id ) >= 0 );
        }
        f.unfly();
        w.defBtn = def;
        title && w.setTitle(title);
        msg   && w.setContent(msg);
        icon  && w.setIcon(icon);
        callback && (w.onbuttonclick = callback);
        w.display(TRUE);
        return w;
    },
    
    confirm : function(title, msg, callback, def){
        this.alert(title || '提示', msg, callback, 'ok|cancel', 'ask', def||'ok');
    },
    
    success : function(title, msg, callback, buttons, def){
        this.alert(title, msg, callback, buttons || 'ok', 'success', def||'ok');
    },
    
    error  : function(title, msg, callback, buttons, def){
        this.alert(title, msg, callback, buttons || 'ok', 'error', def||'ok');
    }
});

})(Xwb, $);