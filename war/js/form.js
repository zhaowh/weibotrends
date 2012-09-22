/**
 * @fileoverview 该文件是 xweibo 表单公共部分。
 */
 
 (function() {
 
 var $ui = {};
 
 var canSubmit = true;
 
 var msg = {
    '1': '昵称由4-20位字母，数字或汉字组成',
    '2': '请输入昵称',
    '3': '此昵称太受欢迎，已有人抢了',
    '4': '昵称不能全是数字',
    '5': '请输入4个字母以上的昵称', 
    '6': '不能超过20个字母或10个汉字',
    '7': '昵称包含违法字符，请修改',
    '8': '请输入电子邮箱',    
    '9': '请输入正确的邮箱地址',    
    '10': '请输入省份', 
    '11': '请设置性别',
    '12': '个人简介不能超过70个字',
    '13': '密码由6-16位字母，数字，半角"." "-" "?"和下划线组成',
    '14': '密码太短了，请输入至少6位',
    '15': '密码太长了，最多16位',
    '16': '请输入希望使用的密码',
    '17': '请再次输入上面的密码',
    '18': '请输入验证码',
    '19': '验证码不正确，请重新输入',
    '20': '请确定您已看过并同意《新浪网络服务协议》',
    '21': '密码格式不正确',
    '22': '两次输入的密码不同',
    '23': '帐号或密码错误',
    '24': '此帐号已被其他天翼社区帐号绑定，不可再次绑定',
    '25': '绑定失败，可能是密码或者帐号出错',
    '26': '更新一句话失败',
    '27': '该邮箱地址已被注册',
    '28': '昵称含有非法关键词',
    '29': '简介含有非法关键词',
    '30': '支持中英文、数字、“_”或减号'
 };

var cityChange = {
    data: locationData,
    curProvince: 0,
    init: function() {
        if(!this.data) {return;}        
        
        this.createOpt('province');
    },
    
    createOpt: function(type) {
        var $sel, data;
        var frag = document.createDocumentFragment();
        
        if(type == 'province') {
            $sel = $('#province');
            
            if(!$sel[0]) {return;}
            
            data = this.data['provinces'];
            
            $.each(data, function(i, item) {
                var $opt = $('<option></option>')
                    .attr('value', item.id)
                    .text(item.name);
                    
                frag.appendChild($opt[0]);
            });
            
            $sel[0].appendChild(frag);
            
        }else if(type == 'city') {
        
            $sel = $('#city');
            $sel.empty();
            
            $sel.html('<option value="0">城市/地区</option>');
            
            if(this.curProvince <= 0) {
                return;
            }
            
            data = this.data['provinces'];
            
            $.each(data, function(i, item) {
                if(item.id == cityChange.curProvince) {
                    data = item['citys'];
                    return false;
                }
            });
            
            $.each(data, function(i, item) {
                var val, txt;
                
                for(var id in item) {
                    val = id;
                    txt = item[id];
                }
            
                var $opt = $('<option></option>')
                    .attr('value', val)
                    .text(txt);
                    
                frag.appendChild($opt[0]);
            });
            
            $sel[0].appendChild(frag);
        }
    }    
};

 /**
* 表单检测
*/
 function checkForm(e) {
    var 
        $el, type,
        $input = $(this), 
        val = $input.val(),
        msgNum = 0;
    
    if(typeof e == 'object') {
        type = e.data.type;
    }else {
        type = e;
    }
    
    switch(type) {
        case 'nick':
            $el = $ui.nick;            
            
            //昵称不能为空
            if($.trim(val) == '') {
                msgNum = 2;
            }
            //昵称不能全是数字
            else if(!/\D/.test(val)) {
                msgNum = 4;
            }
            //昵称少于4字母
            else if($input.checkText(2)>0) {
                msgNum = 5;
            }
            //昵称大于20字母
            else if($input.checkText(10)<0) {
                msgNum = 6;
            }
            break;
            
        case 'email':
            $el = $ui.email;
            //email不能为空
            if($.trim(val) == '') {
                msgNum = 8;
            }
            //email格式不对
            else if(!/^.+?@.+\.\w+?$/.test(val)) {
                msgNum = 9;
            }
            break;
            
        case 'description':
            $el = $ui.description;
            //简介不能超过70字
            if($input.checkText(70)<0) {
                msgNum = 12;
            }
            break;
            
        case 'pwd':
            $el = $ui.password;

            //密码不能为空
            if($.trim(val) == '') {
                msgNum = 16;
            }
            //密码少于6字母
            else if($input.val().length < 6) {
                msgNum = 14;
            }
            //密码大于16字母
            else if($input.val().length > 16) {
                msgNum = 15;
            }
            //密码格式不对
            else if(/[^A-Za-z0-9_\.\?-]/.test(val)) {
                msgNum = 21;
            }
            break;
        
        case 'pwd2':
            $el = $ui.password2;
            
            //确认密码不一致
            if($.trim(val) != $('#password').val()) {
                msgNum = 22;
            }      
            break;
            
        case 'code':
            $el = $ui.authcode;
            
            if($.trim(val) == '') {
                msgNum = 18;
            }      
            break;
            
         case 'province':
            $el = $ui.location;
            
            if($('#province').val() <= 0) {
                msgNum = 10;
            }      
            break;
            
        case 'agreement':
            $el = $ui.agreement;
            
            if(!$('#isconfirm').attr('checked')) {
                msgNum = 20;
            }
            
            break;
    }
    
    showError($el, type, msgNum);
    
    if(msgNum) {
        window.xform.canSubmit = false;
    }else {
        window.xform.canSubmit = true;
    }
 }
 
 /**
* 错误信息显示
*/
 function showError($el, type, msgNum, info) {
    $el.find('em.tips').hide();
    var $tips = $el.find('em.warn');
    
    if(!$tips[0]) {
        $tips = $('<em></em>').addClass('warn');
            
        if(type == 'code') {
            $tips.appendTo($el);
            $tips.insertBefore($el.find('img'));
        }else {
            $tips.appendTo($el);
        }
    }
    
    if(msgNum) {
        $tips.show();
        $tips.text(msg[msgNum]+(info||''));
    }else {
        $tips.hide();
    }
 }
 

window.xform = {
    msg: msg,
    cityChange: cityChange,
    checkForm: checkForm,
    showError: showError,
    $ui: $ui,
    canSubmit: canSubmit
};

 })();
 
