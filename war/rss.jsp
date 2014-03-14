<%@ page contentType="text/xml; charset=UTF-8" pageEncoding="UTF-8"%><?xml version="1.0"  encoding="UTF-8"?>
<%@ page import="java.io.*" %>
<%@ page import="java.text.*" %>
<%@ page import="java.util.*" %>
<%@ page import="weibotrends.Tweet" %>
<%@ page import="weibotrends.WeiboTops" %>
<%@ page import="weibotrends.WeiboUtils" %>
<%
	WeiboTops wt = (WeiboTops)request.getAttribute("weiboTops");
	Collection<Tweet> tweets = (Collection<Tweet>)request.getAttribute("tweets");
%>
<%!
	public String formatText(Tweet t){
		String text = "<a href='http://www.weibo.com/"+t.getUserId()+"'>@" + t.getScreenName() + "</a>: " + t.getText();
		if (t.getBmiddlePic()!=null && t.getBmiddlePic().trim().length()>0){
			text = text + "\n<br><a href='"+t.getOriginalPic()+"'><img border=0 src='"+t.getBmiddlePic()+"'></img></a>";
		}
		if (t.getPrimaryTweet()!=null){
			text = text + "\n<hr><a href='http://www.weibo.com/"+t.getPrimaryTweet().getUserId()+"'>@" + t.getPrimaryTweet().getScreenName() + "</a>: \n<br>" + t.getPrimaryTweet().getText();
			if (t.getPrimaryTweet().getBmiddlePic()!=null && t.getPrimaryTweet().getBmiddlePic().trim().length()>0){
				text = text + "\n<br><a href='"+t.getPrimaryTweet().getOriginalPic()+"'><img  border=0 src='"+t.getPrimaryTweet().getBmiddlePic()+"'></img></a>";
			}
		}
		return text;
	}

	public String formatTime(Date date){ 
		TimeZone tz = TimeZone.getTimeZone("GMT+8");
		String pattern="EEE, dd MMM yyyy HH:mm:ss zzz";
		SimpleDateFormat df = new SimpleDateFormat(pattern,Locale.ENGLISH);
		df.setTimeZone(tz);
		return df.format(date);
	}
	
	public String formatMid(String mid){
		return WeiboUtils.mid2url(mid);
	}
%>
<rss version="2.0">
	<channel>
		<title>Hot Weibos
		<%
			if (wt!=null && wt.getUserConfig().getAccessToken()!=null){
				out.println(" - " + wt.getUserConfig().getName());
			}
		%>
		
		</title>
		<link>http://www.weitixing.com/</link>
		<description>The lastest hot weibos from Sina Weibo.</description>
		<language>cn-zh</language>
		<ttl>20</ttl>
		<image>
			<url>http://www.weitixing.com/logo32.gif</url>
			<title>Hot Weibos</title>
			<link>http://www.weitixing.com/</link>
			<width>32</width>
			<height>32</height>
		</image>
<%
for (Tweet t : tweets){
%>

		<item>
			<title><![CDATA[
			<%
				if (t.getPrimaryTweet()!=null){
					out.print(t.getPrimaryTweet().getScreenName() + "："+ t.getPrimaryTweet().getText());
				}else{
					out.print(t.getScreenName() + "："+ t.getText());
				}
			%>]]></title>
			<description><![CDATA[<%=formatText(t)%>]]></description>
			<%
			if (t.getPrimaryTweet()!=null && t.getPrimaryTweet().getOriginalPic() != null && t.getPrimaryTweet().getOriginalPic().trim().length()>0){
			%>
			<enclosure type="image/jpeg" url="<%=t.getPrimaryTweet().getOriginalPic() %>"></enclosure>
			<%
			}else if (t.getOriginalPic() != null && t.getOriginalPic().trim().length()>0){
			%>
			<enclosure type="image/jpeg" url="<%=t.getOriginalPic() %>"></enclosure>
			<%
			}
			%>
			<pubDate><%=formatTime(t.getCreatedAt()) %></pubDate>
			<author><%=t.getScreenName() %></author>
			<guid isPermaLink="true">http://weibo.com/<%=t.getUserId()%>/<%=formatMid(t.getMid())%></guid>
			<comments>http://weibo.com/<%=t.getUserId()%>/<%=formatMid(t.getMid())%></comments>
			<link>http://weibo.com/<%=t.getUserId()%>/<%=formatMid(t.getMid())%></link>
		</item>
<%
}
%>
	</channel>
</rss>
		