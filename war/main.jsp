<%@ page contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ page import="java.io.*" %>
<%@ page import="java.util.*" %>
<%@ page import="weibo4j.model.User" %>
<%
	User user = (User)session.getAttribute("user");
%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> 
<html xmlns="http://www.w3.org/1999/xhtml"> 
<head> 
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> 
<title>微博趋势 - 最新热点</title> 
<link rel="shortcut icon" href="/favicon.ico" /> 
<link href="/css/base.css" rel="stylesheet" type="text/css" /> 
<link href="/css/skin_default/skin.css" rel="stylesheet" type="text/css" /> 

<script type="text/javascript" src="/js/jquery.min.js"></script> 
<script type="text/javascript" src="/js/xwbapi.min.js"></script> 
<script type="text/javascript" src="/js/xwb.min.js"></script> 
    
</head> 
<body id="home" class="own"> 
	<div id="wrapper"> 
    	<div class="wrapper-in"> 
			<!-- header --> 
			<div id="header"> 
				<div class="nav"> 
					<div class="inner-nav" id="xwbInnerNav"> 
						<span class="defined-link"> 
							<a target="_blank" href="http://weibo.com/">新浪微博</a> 
							| <a target="_blank" href="http://q.weibo.com/">微群</a> 
						</span> 
						<div class="nav-right"> 
							<form class="search-box skin-bg" onsubmit="return false" id="xwb_search_form"> 
								<input class="search-btn skin-bg" type="submit" value="" id="xwb_trig"/> 
								<input class="search-input"  type="text" value="搜索微博/找人"  id="xwb_inputor"/> 
							</form> 
							<span class="user-link"> 
								<a  href="http://weibo.com/<%=user.getId()%>" target="_blank"><%=user.getName()%></a> 
								| <a href="/action.php?m=account.logout">退出</a> 
							</span> 
						</div> 
					</div> 
					<div class="nav-bg"></div> 
				</div> 
			 
				<div class="inner-header"> 
					<a class="logo" href="/index.php?m=pub">
					  <!--<img id="logo" src="/var/data/logo/default_logo.png"/>-->
					  <img id="logo" width="140px" src="/weibo.png"/>
					</a> 
			 
					<div class="menu"> 
						<ul> 
							<li><a hideFocus="true" class="menu-pub" href="http://weibo.com/pub/?source=toptray" target="_blank">微博广场</a></li> 
							<li><a hideFocus="true" class="menu-user" href="http://weibo.com/" target="_blank">我的首页</a></li> 
							<li><a hideFocus="true" class="menu-home" href="/weibotops?m=list">最新热推</a></li> 
							<li><a hideFocus="true" class="menu-weibo" href="http://weibo.com/<%=user.getId()%>/profile" target="_blank">我的微博</a></li> 
						</ul> 
						<div class="menu-bg skin-bg"></div> 
						<div class="menu-arrow skin-bg"></div> 
					</div> 
				</div>  
			</div> 
			<!-- end header --> 
			
			<div id="container"> 
				<div class="sidebar"> 
					<div class="user-preview"> 
						<div class="user-info"> 
							<a class="user-pic" href="http://weibo.com/<%=user.getId()%>" target="_blank">
								<img src="<%=user.getProfileImageUrl()%>" title="<%=user.getName()%>" /></a> 
							<div class="user-intro"> 
								<strong><%=user.getName()%></strong> 
								<p class="icon-bg icon-male"><%=user.getLocation()%></p> 
							</div> 
						</div> 
						<p><%=user.getDescription()%></p> 
					</div>  
  					<div class="user-sidebar"> 
						<div class="sidebar-head">猜你喜欢</div> 
						<ul> 
							<li> 
								<a href="http://weibo.com/1862386965" title="微博趋势"  target="_blank">
									<img src="http://tp2.sinaimg.cn/1862386965/50/1296452915/1" alt="微博趋势" title="你们有相同的话题" /></a> 
								<p><a href="http://weibo.com/1862386965" target="_blank">微博趋势</a></p> 
								<a class="sub-link" rel="e:fl,u:1862386965,t:2" href="#">关注他</a> 
							</li> 
						</ul> 
					</div> 
				</div> 
				
				<div class="main"> 


<%
	response.flushBuffer();
	String m = request.getParameter("m");
	if ("config".equals(m) || "saveConfig".equals(m)) {
%>
	<jsp:include page="_rt_config.jsp"></jsp:include>
<%
	}else {
%>
	<jsp:include page="_list.jsp"></jsp:include>
<%
	}
%>						
				</div> 
			</div> 
			
			<!-- footer --> 
			<div id="footer"> 
				<div class="ft-in"> 
					<div class="footer-defined"> 
						<em class="site-name">微博趋势</em> 
						<a target="_blank" href="http://x.weibo.com/bbs/" target="_blank">意见反馈</a> 
						| <a target="_blank" href="http://x.weibo.com/help.php" target="_blank">帮助中心</a> 
					</div> 
					<img src="https://developers.google.com/appengine/images/appengine-noborder-120x30.gif" 
					alt="Powered by Google App Engine" />
				</div> 
			</div> 
			<!-- end footer --> 
		</div> 
	</div> 

</body> 
</html> 
