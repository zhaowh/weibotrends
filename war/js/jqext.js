(function(X, $){
	var FALSE = false,
		TRUE = true,
		NULL = null,
		toInt = parseInt,
		isIE6 = !!($.browser.msie && $.browser.version == '6.0');;
	/**
	 * 图片控制组件
	 */
	var imgCtrler = function() {
	    this.cid = 'imageCtrler';
	    this.canvas = NULL;
	    this.maxWidth = 440;
	    this.width = 0;
	    this.height = 0;
	    this.curAngle = 0;
	};

	imgCtrler.prototype = {
	    /**
	    * 初始化
	    * 支持canvas的创建canvas，IE使用矩阵滤镜
	    */
	    init: function(data) {
	        var _el = data.el;
	        
	        this.width = _el.offsetWidth;
	        this.height = _el.offsetHeight;
	        
	        if($.browser.msie) {
	            var _matrix = 'DXImageTransform.Microsoft.Matrix';
	            
	            _el.style.filter = 'progid:DXImageTransform.Microsoft.Matrix()';
	            _el.filters.item(_matrix).SizingMethod = "auto expand";
	            $(_el).addClass('narrow-move');
	            _matrix = NULL;
	        }else {
	            this.canvas = $('<canvas></canvas>')
	                .attr({
	                    'height': this.height,
	                    'width': this.width
	                })
					.addClass('narrow-move')
					.attr('rel', 'e:zo')
	                .insertBefore(_el)[0];
	            
	            if(this.canvas.getContext) {
	                $(_el).hide();
	                
	                var ctx = this.canvas.getContext('2d');
	                
	                //ctx.drawImage(_el,0,0);
	
	            }
	        }
	        
	        this.element = _el;
	    },
	    
	    /**
	    * 旋转图片
	    *@param {String} dir  旋转方式，'left'或者'right'
	    */
	    rotate: function(dir) {
	        if(!this.element) {return;}
	        
	        //相对原始图片的旋转角度
	        var _angle;
	        if(dir === 'right') {
	            _angle = this.curAngle + 90;
	            this.curAngle = _angle>=360 ? 0 : _angle;
	        }else if(dir === 'left') {
	            _angle = this.curAngle - 90;
	            this.curAngle = _angle<0 ? 360+_angle : _angle;
	        }
	        _angle = NULL;
	        
	        //调整图片旋转后的大小
	        var drawW,drawH, h=this.width,w=this.height;
	            
	        this.width = w;
	        this.height = h;
	
	        if(w > this.maxWidth) {
	            h = toInt(this.maxWidth * h/w);
	            w = this.maxWidth;
	        }
	        
	        if(this.canvas) {
	            var 
	                ctx = this.canvas.getContext('2d'), el = this.element, 
	                cpx=0, cpy=0;
	            //设置画布大小，重置了内容
	            $(this.canvas).attr({
	                'width': w,
	                'height': h
	            });
	            
	            ctx.clearRect(0,0,w,h);
	            
	            switch(this.curAngle) {
	                case 0:
	                    cpx = 0;
	                    cpy = 0;
	                    drawW = w;
	                    drawH = h;
	                    break;
	                case 90:
	                    cpx = w;
	                    cpy = 0;
	                    drawW = h;
	                    drawH = w;
	                    break;
	                case 180:
	                    cpx = w;
	                    cpy = h;
	                    drawW = w;
	                    drawH = h;
	                    break;
	                case 270:
	                    cpx = 0;
	                    cpy = h;
	                    drawW = h;
	                    drawH = w;
	                    break;
	            }
	            
	            ctx.save();
	            ctx.translate(cpx,cpy);
	            ctx.rotate(this.curAngle * Math.PI/180);
	            ctx.drawImage(el, 0, 0, drawW,drawH);
	            ctx.restore();
	            
	        }else {
	            var 
	                _rad = this.curAngle * Math.PI/180,
	                _cos = Math.cos(_rad),
	                _sin = Math.sin(_rad),
	                _el = this.element,
	                _matrix = 'DXImageTransform.Microsoft.Matrix';
	                
	            _el.filters.item(_matrix).M11 = _cos;
	            _el.filters.item(_matrix).M12 = -_sin;
	            _el.filters.item(_matrix).M21 = _sin;
	            _el.filters.item(_matrix).M22 = _cos;
	            
	            // this.width = _el.offsetWidth;
	            // this.height = _el.offsetHeight;
	            
	            switch(this.curAngle) {
	                case 0:
	                case 180:
	                    drawW = w;
	                    drawH = h;
	                    break;
	                case 90:
	                case 270:
	                    drawW = h;
	                    drawH = w;
	                    break;
	            }
	            
	            _el.width = drawW;
	            _el.height = drawH;
	            //修正IE8下图片占位的问题
	            //18是操作菜单的高度
	            if($.browser.version == 8) {
	                _el.parentNode.style.height = _el.offsetHeight+18;
	            }
	        }
	    }
	};

	$.extend($.fn, {
			/**
			* 文字放大渐隐（微博数增加效果）
			*@return jQuery
			*@param {Number} num 增加数值
			*@param {Number} times 放大倍数
			*/
			zoomText: function(num, times) {
				this.each(function() {
					var
						$clone,
						$el = $(this),
						offset = $el.offset(),
						text = $el.text();
						
					times = isNaN(times) ? 2 : times;
					
					if(!isNaN(+text)) {
						text = +text + (num || 1);
					}
					
					$el.text(text);
					
					$clone = $el.clone()
						.attr('id', '')
						.css({
							'position': 'absolute',
							'top': offset.top,
							'left': offset.left,
							'font': $el.css('font'),
							'color': $el.css('color')
						})
						.appendTo($(document.body));
					
					var fontsize = times * parseInt($el.css('font-size'));
					
					$clone.animate({
						'font-size': fontsize,
						'top': offset.top - ($el.height()/4),
						'left': offset.left - ($el.width()/2),
						'opacity': 0.1
					}, {
						'duration': 300,
						'complete': function() {
							$clone.remove();
						}
					});
					
				});
				
				return this;
			},

			/**
			* 图片旋转
			* @return {Object} jQuery对象
			*@param {String} dir  旋转方式，'left'或者'right'
			*/
			imgRotate: function(dir) {
			   
				this.each(function() {
					if(this.tagName !== 'IMG') {return FALSE};
					var img = $(this).data('img');

					if (!img)
					{
						var img = new imgCtrler();
						img.init({el: this});
						
						img.maxWidth = $(this).parent().width();

						$(this).data('img', img);
					}
					
					img.rotate(dir);
				});
				
				return this;
			},
			/**
			 * 给input加上blur停留提示功能。
			 * @param {String} hoverText
			 * @param {String} focusStyle
			 * @param {String|HTMLElement} [cssNode]
			 * @param {Boolean} removeOnFocus 如果为false，当聚焦后添加css类，否则移除css类
			 */
			focusText : function(text, css, cssNode, removeOnFocus){
			    this.each(function(){
			        $(this).focus(function(){
			            if(this.value === text){
			                var selHolder = $(this).data('xwb_selholder');
			                if(selHolder)
			                    selHolder.setText('');
			                else this.value = '';
			            }
			            if(css){
			                if(removeOnFocus)
			                    $(cssNode||this).removeClass(css);
			                else $(cssNode||this).addClass(css);
			            }
			        })
			        .blur(function(){
			            if($.trim(this.value) === ''){
			                var selHolder = $(this).data('xwb_selholder');
			                if(selHolder)
			                    selHolder.setText(text);
			                else this.value = text;
			            }
			            if(css){
			                if(removeOnFocus)
			                    $(cssNode||this).addClass(css);
			                else $(cssNode||this).removeClass(css);
			            }
			        });
			    });
			},
			
			/**
			 * 利用'hidden'CSS类进行隐藏或显示元素
			 */
			cssDisplay : function(b){
			    var len = this.length, f;
			    if(len){
			        if(len === 1){
			            f = X.ui.Base.fly(this[0]);
			            if(b === undefined){
			                var v = f.display();
			                f.unfly();
			                return v;
			            }else {
			                f.display(b)
			                 .unfly();
			            }
			        }
			        
			        else {
			            f = X.ui.Base.fly();
			            this.each(function(){
    			            f.fly(this).display(b);
			            });
			            f.unfly();
			        }
			    }
			    return this;
			},

		/**
	    * 截取微博内容
	    *@return jQuery
	    *@param {Number} num  位置，默认10
        *@param {Boolean} hasFace  是否显示表情图片，否为文字代替
        *@param {String} postfix  后缀
	    */
        substrText: function(num, hasFace, postfix) {
            var re = new RegExp('(?:<a.*?>.*?<\\/a>)|(?:<img.*?>)|.','gi');
            
	        this.each(function() {
                var 
                    cache = [],
                    postfix = postfix || '...',
                    text = this.innerHTML,
                    match = text.match(re);
                    
                num = num||10;
                    
                if(match && match.length > num) {
                    
                    match = match.slice(0, num).join('');

                    text = hasFace ? match : match.replace(/<img.*?title=\"(.*?)\".*?>/gi, '[$1]');
                    
                    $(this).html(text+postfix);
                }
	        });
            
            return this;
        },

		/**
	    * IE6修复PNG图片
	    *@return jQuery
	    */
        fixPng: function() {			

            if(isIE6) {
                this.each(function() {
                    if(this.tagName == 'IMG') {
                        var $img = $('<span></span>').css({
                            width: this.offsetWidth,
                            height: this.offsetHeight,
                            display: 'inline-block'
                        });
                        $img[0].style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="'+this.src+'", sizingMethod="scale")';                        
                        $(this).replaceWith($img);
                    }
                });
            }
            
            return this;
        }
      

	});
	
/**
 * jQuery 高亮查找插件，完全基于文本结点的DOM操作，对原有非文本结点不造成任何影响。
 * 用法:
 <pre>
   高亮:
   $('#ss').highlight(['keyword', ... ]);
   清除:
   $('#ss').clearHighlight();
   
   或者传递自定义的样式类
   $('#ss').highlight(['keyword', ... ], 'cssClass');
   清除:
   $('#ss').clearhighlight('cssClass');   
 </pre>
 请确保每次高亮前清除先前已高亮内容。
 可选配置信息：
 
 $.fn.highlight.cls
*/
 
(function(){

// private
var IGNORE,S,ESC,LT,GT, inited;

// private
function init(){
    IGNORE = /INPUT|IMG|SCRIPT|STYLE|HEAD|MAP|AREA|TEXTAREA|SELECT|META|OBJECT|IFRAME/i;
    S      = /^\s+$/;
    ESC    = /(\.|\\|\/|\*|\?|\+|\[|\(|\)|\]|\{|\}|\^|\$|\|)/g;
    LT     = /</g;
    GT     = />/g;
    inited = TRUE;
}

// entry
function entry(keys, cls){
    if(!inited)
      init();
  
    if(typeof keys === 'string')
      keys = $.trim(keys).split(S);

    // normalize
    var arr = [];
    for(var i=0,len=keys.length;i<len;i++){
       if(keys[i] && !S.test(keys[i])) {
          arr[arr.length] = keys[i].replace(LT, '&lt;')
                                   .replace(GT, '&gt;')
                                   .replace(ESC, '\\$1');
       }
    }
    var reg     = new RegExp('(' + arr.join('|') + ')', 'gi'),
        placing = '<span class="'+(cls||entry.cls)+'">$1</span>',
        div     = document.createElement('DIV');
    this.each(function(){
      highlightEl(this, reg, placing, div);
    });

	return this;
}

// public
$.fn.highlight = entry;

$.fn.clearHighlight = function(cls) {
  if(!inited)
    init();
  var cls = cls||entry.cls;
  this.each(function(){
    clearElhighlight(this, cls);
  });
};


// private
function replaceTextNode(textNode, reg, placing, div) {
  var data = textNode.data;
  if(!S.test(data)){
     data = data.replace(LT, '&lt;').replace(GT, '&gt;');
     if(reg.test(data)){
        if(!div)
          div = document.createElement('DIV');
        // html escape
        div.innerHTML = data.replace(reg, placing);
        // copy nodes
        var chs = div.childNodes,
            arr = [],
            fr = document.createDocumentFragment();
        
        // copy to array
        for(var i=0,len=chs.length;i<len;i++)
          arr[i] = chs[i];
        
        for(i=0;i<len;i++)
          fr.appendChild(arr[i]);
        
        textNode.parentNode.replaceChild(fr, textNode);
     }
  }
}

// private
function highlightEl(el, reg, placing, div){
    var chs = el.childNodes, 
        arr = [], i, len, nd;
      
      // copy to array
      for(i=0,len=chs.length;i<len;i++){
        if(!IGNORE.test( chs[i].tagName ))
          arr.push(chs[i]);
      }
      
      for(i=0,len=arr.length;i<len;i++){
        nd = arr[i];
        // textnode
        if(nd.nodeType === 3){
          try { 
            replaceTextNode(nd, reg, placing, div);
          }catch(e){}
        }else arguments.callee(nd, reg, placing, div);
      }
}


// private
function clearElhighlight(el, cls) {
  var chs = el.childNodes, 
      arr = [], i, len, nd, t;
      
  // copy to array
  for(i=0,len=chs.length;i<len;i++){
    if(!IGNORE.test( chs[i].tagName ))
    arr.push(chs[i]);
  }

  for(i=0,len=arr.length;i<len;i++){
    nd = arr[i];
    t = nd.nodeType;
    // textnode
    if(t === 3)
      continue;
    // span
    if(t === 1 && nd.tagName === 'SPAN' && nd.className === cls){
      // merge text nodes
      var textNode = nd.childNodes[0], 
          p        = nd.parentNode,
          pre      = nd.previousSibling,
          nxt      = nd.nextSibling;
      
      if(pre && pre.nodeType === 3){
        p.removeChild(pre);
        textNode.data = pre.data + textNode.data;
      }
      
      if(nxt && nxt.nodeType === 3){
        p.removeChild(nxt);
        textNode.data = textNode.data + nxt.data;
      }

      p.replaceChild(textNode, nd);
    }else arguments.callee(nd, cls);
  }
}

entry.cls = 'search-txt';

})();

$.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === NULL) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = NULL;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

})(Xwb, jQuery);