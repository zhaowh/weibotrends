/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 */

(function(X, $){
/**
 * @class Xwb.ax.Validators
 */

/**
 * @cfg t
 */
Xwb.ax.Validator.prototype

/**
 * 空检测
 * <pre>
 ne=w:在这里输入名称,m:请输入昵称
 * </pre>
 */
.reg('ne', function(elem, v, data, next){
    
    var em = v === '';
    if( !em && data.w ){
        em = v == data.w;
        // 重置为空，防停留字干扰后来的验证器
        if(em)
            this.setValue('');
    }

    if(em && !data.m)
        data.m = '该项不能为空';

    if (elem.tagName === 'INPUT' && ( elem.type === 'radio' || elem.type === 'checkbox' )) 
        em = elem.checked;
        
    this.report(!em, data);

    next();
})

// 失去焦点时检测
// 用法:rel="_f"
.reg('f', function(elem, data){
    var mgm = this;
    $(elem).blur(function(){
        mgm.validElement(this);
    });
})

/**
 * 检测输入字符长度
 * 属性：
<div class="mdetail-params">
<ul>
<li>max=number，允许最大字节长度</li>
<li>min=number，允许最小字节长度</li>
<li>ww, wide code缩写，将长度按宽字符计算，一个汉字两个字节长度</li>
<li></li>
</ul>
</div>
例：
<pre>
    sz=max:6,min:4,m:最少两个汉字，最多三个汉字,ww
</pre>
 * @method sz
 */
.reg('sz', function(elem, v, data, next){
   var len = data.ww ? Xwb.util.byteLen(v) : v.length,
       err, 
       max = data.max, 
       min = data.min;
   if(max !== undefined && parseInt(max) < len)
        err = true;
   if(min !== undefined && parseInt(min)>len)
        err = true;
   this.report(!err, data);
   
   next();
})
// 检查是否有效的日期格式
.reg('dt', function(elem, v, data, next){
    if(!data.m)
        data.m = '不是有效的日期格式';
    var d = Date.parse(v);
    // 可以在这扩展max,min等
    this.report(!isNaN(d), data);
    next();
})
.reg('mail', function(elem, v, data, next){
	var result = v && /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(v);
    if(!data.m && data.m !== 0)
        data.m = '请输入正确的邮箱格式';
	this.report(!v||result, data);

	next();    
})

.reg('int', function(elem, v, data, next) {
	var result = v && /^\d+$/.test(v);

	this.report(result, data);

	next();
})

.reg('bt', function(elem, v, data, next) {
	var min = parseInt(data.min),
		max = parseInt(data.max),
		v = parseInt(v),
		err = 0;

	if (v < min)
		err = 1;

	if (!err && (v > max))
		err = 2

	this.report(!err, data);

	next();
})

// 检查昵称非法字符，支持中英文、数字、"_"或减号
.reg('sinan', function(elem, v, data, next){
    if(!data.m)
        data.m = '支持中英文、数字、"_"或减号';
    this.report(/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(v), data);
    next();
});

})(Xwb, $);