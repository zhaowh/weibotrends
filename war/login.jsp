<%@ page contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ page import="weibo4j.Oauth" %>
<%@ page import="weibo4j.model.WeiboException" %>
<%
Oauth oauth = new Oauth();
if (session.getAttribute("autoLoginForward")==null){
	response.sendRedirect(oauth.authorize("code"));
	session.setAttribute("autoLoginForward","true");
}
%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Login</title>
</head>
<body>
<p>&nbsp;</p>
<div style="width:100%;text-align:center">
	<a href="<%=oauth.authorize("code")%>"><img src="weibo_login.png" border=0 title="登录" alt="登录"/></a>
</div>
</body>
</html>