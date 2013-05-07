<%@ page contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ page import="java.util.*" %>
<%@ page import="weibo4j.model.User" %>
<%@ page import="weibotrends.Tweet" %>
<%@ page import="weibotrends.UserConfig" %>
<%

	User user = (User)session.getAttribute("user");
	UserConfig conf = (UserConfig)request.getAttribute("userConfig"); 

%>

<div class="feed-list" id="xwb_weibo_list"> 
	<div class="feed-tit"> 
		<div class="feed-filter"> <a href="weibotops?m=list">微博</a></div> 
		<h3>参数设置</h3> 
	</div> 
	<ul id="xwb_weibo_list_ct">
	<li> 
	<form method="post" action="/weibotops">
		<input type=hidden name="m" value="saveConfig"></input>
		<div class="feed-content"> 
		  <p class="feed-main"> 
		<%
			if ("saveConfig".equals(request.getParameter("m"))){
				out.println("<font color=blue>配置成功！</font><br><br>\n");
			}
		%>
			<!--a href="<%=user.getUrl()%>" target="__weibo"-->
			最少转发次数：<input type=text name="min_rt_count" size=6 value="<%=conf.getMinRtCount()%>" > 
			<br>
			最低转发速度：<input type=text name="min_rt_speed" size=6 value="<%=conf.getMinRtSpeed()%>" > （100=10000粉丝数1小时转发100次） 
			<br>
			<!-- 
			最长缓存时间：<input type=text name="max_posted_hour" size=6 value="<%=conf.getMaxPostedHour()%>" >小时
			<br>
			-->
			<br>
			<input type=checkbox name="followed_only" value="true" <% if (conf.isFollowedOnly())  out.print("checked"); %> >仅搜索已关注用户原创或转发的微博 
			<br>
			<input type=checkbox name="verified_only" value="true" <% if (conf.isVerifiedOnly()) out.print("checked"); %> >仅搜索认证用户的微博
			<br>

			<b>屏蔽包含以下关键字的微博</b>(以英文逗号分割)：<br>
			<textarea name="excluded_words" cols=54 rows=10><%=conf.getExcludedWords()%></textarea>
			<br><br>
			<b>搜索包含以下关键字的微博</b>(以英文逗号分割，如输入则只有包含以下关键字的微博才能被搜索到)：<br>
			<textarea name="included_words" cols=54 rows=6><%=conf.getIncludedWords()%></textarea>
			<br>
			<input type=checkbox name="followed_first" value="true" <% if (conf.isFollowedFirst()) out.print("checked");  %> >
			已关注用户不应用包含关键字筛选
			<br>
			<br>
<%
	boolean fwdEnabled = Boolean.valueOf(request.getParameter("fwd"));
	if (!conf.isDisabled()) fwdEnabled = true;
	
%>
			<script type="text/javascript" >
			function toggleAutoRTConfig(){
					if (!<%=fwdEnabled%>){
						alert("自动转发功能已禁用");
						$("#auto_rt_disable_check").attr("checked",false);
						$("#auto_rt_config_div").hide();
					}
					if($("#auto_rt_disable_check").attr("checked")==false){
						if (confirm("启用自动转发后系统会定时搜索最新热门微博，并自动转发至你的微博，是否继续？")){
							$("#auto_rt_config_div").show();
						}else{
							$("#auto_rt_disable_check").attr("checked",false);
							$("#auto_rt_config_div").hide();
						}
					}else{
						$("#auto_rt_config_div").hide();
					}
				
			}
			</script>		
			
			<input  id="auto_rt_disable_check"  type=checkbox name="disabled" value="true" <% if (conf.isDisabled()) out.print("checked"); %> onclick="toggleAutoRTConfig()" >
			<font color="red">禁用自动转发</font>
			<br>
			<div id="auto_rt_config_div" <% if (conf.isDisabled()) out.print(" style=\"display:none\" "); %>  >
				<font color="blue">已启用自动转发功能，系统定时搜索最新热门微博并自动转发</font>
				<br>
				<br>
				<font color="green">微博包含指定关键字时的特殊设置：</font>
				<br>
				<b>转发内容</b>：<input type=text name="repost_tmpl" size=45 maxlength="120" value="<%=conf.getRepostTmpl()%>" > </input>
				<br>
				<!--
				<br>
				转发时间间隔:<input type=text name="rt_interval" size=6 value="<%=conf.getRtInterval()%>" >分钟（每次自动转发的时间间隔） 
				<br>
				<b>评论内容</b>：<input type=text name="reply_tmpl"  size=45 maxlength="120" value="<%=conf.getReplyTmpl()%>"> </input><br>
				 -->
				<input type=checkbox name="auto_follow" value="true" <% if (conf.isAutoFollow()) out.print("checked");  %> >转发时自动关注原博作者
				
			</div>
<%
	
%>
			<br><input type=submit name="save" value=" 保存配置 ">
		  </p> 
		</div>
		</form>
		</li>
		</ul>
		<div style="width:241px; height:30px; float:right; ">&nbsp;</div>
	</ul>
</div>

