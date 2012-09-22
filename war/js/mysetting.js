/*!
 * X weibo JavaScript Library v1.1
 * http://x.weibo.com/
 * 
 * Copyright 2010 SINA Inc.
 * Date: 2010/10/28 21:22:06
 */

$(function(){

switch(Xwb.getModule()){
    
    // 个人设置
    case 'setting.user':
    case 'setting':
        initProvinceData();
        $('#nick').focus();
        Xwb.use('Validator', {
            form: '#userinfoForm',
            trigger : '#trig',
            onsuccess : function( data , next){
                var self = this;
                Xwb.request.setProfile(data, function( e ){
                    if( e.isOk() ){
                        // apply iframe mask
                        Xwb.ui.MsgBox.getSysBox().frameMask = true;
                        Xwb.ui.MsgBox.success('', "个人设置保存成功！");
                    }else {
                        var msg = e.getMsg();
                        switch(e.getCode()){
                            case 1020104 :
                                msg = '你输入的个人简介不能超过70个字。';
                            break;
                        }
                        
                        Xwb.ui.MsgBox.alert('', msg);
                    }
                    next();
                });
                // 非FORM提交返回false
                return false;
            }
        });
    break;
    
    // 标签设置
    case 'setting.tag' :
        var maxTag = 10;
        var focusText = '选择最适合你的词语，多个请用空格分开';
        function getTagCount(){
            return $('#tagList li').length;
        }
        $('#tagInputor').focusText(focusText, 'blur-txt', false, true);
        
        // 点击后空输入提示信息
        // 不并入验证器是因为避免由于失去焦点而输出该提示
        $('#trig').click(function(){
            var v = $.trim($('#tagInputor').val());
            if(!v || v === focusText){
                $('#tip').cssDisplay(true).text('请至少输入一个标签');
            }
        });
        
        var tagValidtor = Xwb.use('Validator', {
            form : '#tagForm',
            trigger : '#trig',
            onsuccess : function(data, next){
                // 其它分隔符统一换成','
                var tags = data.tags.replace(/,|;|\uFF0C|\uFF1B|\u3001|\s/,',');
                Xwb.request.createTags(data.tags, function( e ){
                    if( e.isOk() ){
                        Xwb.ui.MsgBox.tipOk("标签创建成功！");
                        setTimeout(function(){location.reload();}, 1000);
                    }else $('#tip').cssDisplay(true).text(e.getMsg());
                        
                    next();
                });
                // 非FORM提交返回false
                return false;
            },
            
            validators : {
                checktag : function(elem, v, data, next){
                    var charReg = /^(,|;|\uFF0C|\uFF1B|\u3001|\s|\w|[\u4E00-\u9FA5\uFF00-\uFFFF])*$/,
                        pass = true, msg,
                        tags = v.split(/,|;|\uFF0C|\uFF1B|\u3001|\s/),
                        sz = getTagCount() + tags.length <= maxTag;
                    
                    // 非法字符检测
                    if(!charReg.test(v)){
                        pass = false;
                        msg  = '含有非法字符，请修改';
                    }else if(!sz){
                        pass = false;
                        msg = '您已添加'+maxTag+'个标签，达到标签上限';
                    }else {
                        for(var k=0,len=tags.length;k<len;k++){
                            var tlen = Xwb.util.byteLen(tags[k]);
                            if(tlen>14){
                                msg = '单个标签长度不多于7个汉字或14个字母';
                                pass = false;
                            }
                        }
                    }
                    
                    if(!pass)
                        data.m = msg;
                    this.report(pass, data);
                    next();
                }
            }
        });

        Xwb.use('ActionMgr')
           .bind( '#infomation' )
           // 直接添加新标签
           .reg('ct', function(e){
                if(!$('#tabListPanel').cssDisplay())
                    $('#tabListPanel').cssDisplay(true);

                var tag = e.get('t');
                if(getTagCount() == maxTag){
                    Xwb.ui.MsgBox.tipWarn('您已添加'+maxTag+'个标签，达到标签上限');
                    return;
                }
                $('#tip').cssDisplay(false);
                e.lock(1);
                var el = e.src;
                Xwb.request.createTags(tag, function( ee ){
                    if( ee.isOk() ){
                        if(ee.getData().data.length){
                            $(el).remove();
                            $('<li><a class="a1" href="'+
                                Xwb.request.mkUrl('search', 'k='+encodeURIComponent(tag))+'">'
                                  +tag+'</a><a class="close-icon icon-bg" rel="e:dt,id:'+ee.getData().data[0].tagid+'" href="#"></a></li>')
                             .appendTo('#tagList');
                        }
                    }else Xwb.ui.MsgBox.alert(ee.getMsg());
                    e.lock(0);
                });
           })
           // 移除TAG
           .reg('dt', function(e){
                var id = e.get('id'), jqEl = $(e.src);
                e.lock(1);
                Xwb.request.delTag(id, function(ee){
                    if(ee.isOk()){
                        jqEl.parent().remove();
                        if(!getTagCount()){
                            $('#tabListPanel').cssDisplay(false);
                        }
                    }else Xwb.ui.MsgBox.alert(ee.getMsg());
                    e.lock(0);
                });
           });
    break;
    
    // 显示设置
    case 'setting.show' :
        Xwb.use('Validator', {
            form:'#showForm',
            trigger : '#trig',
            onsuccess : function(data, next){
                Xwb.request.updateShowProfile(data, function( e ){
                    if(e.isOk()){
                        Xwb.ui.MsgBox.success('', '显示设置已保存。');
                    }else Xwb.ui.MsgBox.error('', e.getMsg());
                        
                    next();
                });
                // 非FORM提交返回false
                return false;
            }
        });
    break;
    
    // 提醒设置
    case 'setting.notice' :
        Xwb.use('Validator', {
            form:'#noticeForm',
            trigger : '#trig',
            onsuccess : function(data, next){
                Xwb.request.updateNoticeProfile(data, function( e ){
                    if(e.isOk()){
                        Xwb.ui.MsgBox.success('', '提醒设置已保存。');
                    }else Xwb.ui.MsgBox.error('', e.getMsg());
                        
                    next();
                });
                
                return false;
            }
        });
    break;
    
    // 帐号设置
    case 'setting.account' :
        $('#unbind').click(function(){
            var href = this.href;
            Xwb.ui.MsgBox.confirm('取消绑定',"你确定要取消当前绑定关系吗？", function(rt){
                if(rt === 'ok')
                    location.href = href;
            });
            return false;
        });
    break;
}



//
//  省市联动
//
function onProviceChange(sel) {
    var selCities = $('#city').get(0);
    var pidx = sel.options[sel.selectedIndex].getAttribute('rel');
    
    if(pidx === null || pidx === undefined)
        return;
    
    var opts = selCities.options;
    var selected = $(selCities).attr('preval');
    
    for (var i = opts.length - 1; i >= 0; i--)
    selCities.removeChild(opts[i]);
    $.each(locationData.provinces[pidx].citys, function (idx, v) {
        for (var k in v) {
            var opt = document.createElement('OPTION');
            opt.text = v[k];
            opt.value = k;
            if(selected && selected == k){
                $(selCities).attr('preval', '');
                opt.selected = true;
            }
            opts[opts.length] = opt;
        }
    });
}

function initProvinceData(){
        var sel = $('#province')[0], 
            selected = parseInt($(sel).attr('preval')),
            opts = sel.options;
        $.each(locationData.provinces, function(idx, v){
            var opt = document.createElement('OPTION');
            opt.text = v.name;
            opt.value = v.id;
            
            if(v.id == selected)
                opt.selected = true;
            
            opt.setAttribute('rel', idx);
            opts[opts.length] = opt;
        });
        onProviceChange(sel);
        sel.onchange = function(){
            onProviceChange(this);
        };
}

});