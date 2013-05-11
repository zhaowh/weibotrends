<%@ page contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ page import="java.io.*" %>
<%@ page import="java.text.*" %>
<%@ page import="java.util.*" %>
<%@ page import="weibo4j.model.User" %>
<%@ page import="weibotrends.Tweet" %>
<%@ page import="weibotrends.WeiboTops" %>
<%@ page import="weibotrends.WeiboUtils" %>
<%
	User user = (User)session.getAttribute("user");
	WeiboTops wt = (WeiboTops)request.getAttribute("weiboTops");
	Collection<Tweet> tweets = (Collection<Tweet>)request.getAttribute("tweets");
%>
<%!
	public String formatText(String text){
		return text;
	}

	public String formatTime(Date date){
		TimeZone tz = TimeZone.getTimeZone("GMT+8");
		Calendar today = Calendar.getInstance(Locale.CHINA);
		today.setTimeInMillis(System.currentTimeMillis());
		today.setTimeZone(tz);
		today.set(Calendar.HOUR,0);
		today.set(Calendar.MINUTE, 0);
		today.set(Calendar.MINUTE, 0);
		String pattern = "MM-dd k:mm";
		if (date.after(today.getTime())){
			 pattern = "k:mm";
		}
		SimpleDateFormat df = new SimpleDateFormat(pattern,Locale.CHINA);
		df.setTimeZone(tz);
		return df.format(date);
	}
	
	public String formatVerfied(boolean isVerfied){
		String s = "<img src='var/data/logo/default_v2.png' border='0' width='11px' height='10px' alt='V' title='新浪认证'>";
		return isVerfied?s:"";
	}
	
	public String formatMid(String mid){
		return WeiboUtils.mid2url(mid);
	}
	
	public String formatSpeed(Double rtSpeed, Double rtAcceleration){
		String s = String.valueOf(rtSpeed.intValue());
		if(rtAcceleration!=null && rtAcceleration.intValue()!=0){
			s = s+ "(";
			if (rtAcceleration>0){
				s = s + "<font color=red>+";
			}else{
				s = s + "<font>";
			}
			s =s + rtAcceleration.intValue()+"</font>)"; 
		}
		return s;	
	}
	
	public String escapeHTML(String str){
		if (str==null) return null;
		return str.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;").replace("\'","&#39;");
	}

%>

<script language="javascript">
	function toggleImg(id){
		/*
		$(obj).closest(".feed-content").find(".show-img").toggle();
		$(obj).closest(".feed-content").find(".preview-img").toggle();

		isFwd = false;
		if ($(obj).closest(".forward").length>0) isFwd = true;
		if (!isFwd){
			$(obj).closest(".feed-content").find(".box-style").toggle();
		}
		*/

		preview = document.getElementById("preview-img-"+id);
		preview.style.display = preview.style.display == "none"?"block":"none";
		showimg = document.getElementById("show-img-"+id);
		showimg.style.display = showimg.style.display == "none"?"block":"none";
	}
</script>

<div class="feed-list" id="xwb_weibo_list"> 
	<div class="feed-tit"> 
		<div class="feed-filter">
			排序：<a href="weibotops?m=list&order=byTime">时间</a>
				  <a href="weibotops?m=list&order=byRt">转发数</a>
				  <a href="weibotops?m=list&order=bySpeed">速度</a>
				  <a href="weibotops?m=list&order=byAcc">加速度</a>
		</div> 
		<%
			if (user!=null && wt!=null){
		%>
		<div class="feed-filter"> <a href="weibotops?m=config">设置</a></div> 
		<div class="feed-filter"> <a href="weibotops?m=refresh">刷新</a></div> 
		<%
			}
		%>
		<h3>最新热推</h3> 
	</div> 


<ul id="xwb_weibo_list_ct"> 

<%
for (Tweet t : tweets){
%>

<li rel="w:<%=t.getId()%>">
	<div class="user-pic"> 
		<a href="http://weibo.com/<%=t.getUserId()%>" target="_blank">
			<img width="50" height="50" src="<%=t.getProfileImageUrl()%>" alt="<%=t.getScreenName()%>" title="<%=t.getScreenName()%>" />
		</a> 
	</div> 
	<div class="feed-content"> 
		<div class="feed-main"> 
			<div class="user-pic user-pic-inner"> 
				<a href="http://weibo.com/<%=t.getUserId()%>" target="_blank">
					<img width="50" height="50" src="<%=t.getProfileImageUrl()%>" alt="<%=t.getScreenName()%>" title="<%=t.getScreenName()%>" />
				</a> 
			</div> 
			<a href="http://weibo.com/<%=t.getUserId()%>" target="_blank" title="<%=t.getScreenName()%>">
				<%=t.getScreenName()%><%=formatVerfied(t.isVerified()) %>
			</a>：<%=formatText(t.getText())%>
			<%
				Map<String, Tweet> rts 
				= 
					(wt!=null && wt.getUserConfig().isFollowedOnly())?
					t.getFriendRetweets(wt.getUserConfig().getFollowedIds()):
					t.getUserRetweets()
					;
				if (rts!=null && !rts.isEmpty()){
					Iterator<Tweet> itr = rts.values().iterator();
					int i = 0;
			%><div class="blur-txt"> 由
			<%
			 	while( i<4 && itr.hasNext()){
			 		Tweet rt = itr.next();
			 		if (user!=null && rt.getScreenName().equals(user.getName())) continue;
			%>
				<a href="http://weibo.com/<%=rt.getUserId()%>/<%=formatMid(rt.getMid())%>" target="_blank" title="<%=escapeHTML(rt.getText())%>">
					<%=rt.getScreenName()%><%=formatVerfied(rt.isVerified()) %>
				</a>
			<%
				i++;
				}
				if (i>=4 && itr.hasNext()) out.print("等");
			%>转推
				</div>
			<%
				}
			 %>
		</div> 
<%
	if (t.getPrimaryTweet()!=null){
%>		
		<div class="box-style"> 
			<div class="box-t skin-bg"><span class="skin-bg"></span></div> 
			<div class="forward box-content"> 
				<p><a href="http://weibo.com/<%=t.getPrimaryTweet().getUserId()%>" target="_blank">@<%=t.getPrimaryTweet().getScreenName()%><%=formatVerfied(t.isVerified()) %></a>：<%=formatText(t.getPrimaryTweet().getText())%>
				</p> 
<%
		if (t.getPrimaryTweet().getThumbnailPic() != null && t.getPrimaryTweet().getThumbnailPic().trim().length()>0){
%>
				<div class="preview-img" id="preview-img-<%=t.getPrimaryTweet().getId()%>">
					<div class="feed-img">
						<img class="zoom-move" src="<%=t.getPrimaryTweet().getThumbnailPic() %>" rel="e:zi,fw:0" onclick='toggleImg(<%=t.getPrimaryTweet().getId()%>)'/>
					</div>
				</div>
				<div class="show-img cutline" style="display:none"  id="show-img-<%=t.getPrimaryTweet().getId()%>">
					<p>
						<a class="icon-piup icon-bg" rel="e:zo" href="#"  onclick='toggleImg(<%=t.getPrimaryTweet().getId()%>);return false;'>收起</a>
						<a class="icon-src icon-bg" target="_blank" href="<%=t.getPrimaryTweet().getOriginalPic() %>">查看原图</a>
						<!-- 
						<a rel="e:tl" class="icon-trunleft icon-bg" href="#">向左转</a>
						<a rel="e:tr" class="icon-trunright icon-bg" href="#">向右转</a>
						 -->
					</p>
					<div name="img">
						<img class="narrow-move" src="<%=t.getPrimaryTweet().getBmiddlePic() %>" rel="e:zo"  onclick='toggleImg(<%=t.getPrimaryTweet().getId()%>)'/>
					</div>
				</div>
<%
		}
%>			</div> 
			<div class="box-b skin-bg"><span class="skin-bg"></span></div> 
			<span class="box-arrow skin-bg"></span> 

		</div> 
		
<%
	}
	if (t.getThumbnailPic()!=null && t.getThumbnailPic().trim().length()>0){
%>
		 
				<div class="preview-img" id="preview-img-<%=t.getId()%>">
					<div class="feed-img">
						<img class="zoom-move" src="<%=t.getThumbnailPic()%>" rel="e:zi,fw:0"  onclick='toggleImg(<%=t.getId()%>)'/>
					</div>
				</div> 
		<div class="box-style"  style="display:none" id="show-img-<%=t.getId()%>"> 
			<div class="box-t skin-bg"><span class="skin-bg"></span></div> 
			<div class="box-content"> 
				<div class="show-img cutline" >
					<p>
						<a class="icon-piup icon-bg" rel="e:zo" href="#"  onclick='toggleImg(<%=t.getId()%>);return false;'>收起</a>
						<a class="icon-src icon-bg" target="_blank" href="<%=t.getOriginalPic() %>">查看原图</a>
						<!-- 
						<a rel="e:tl" class="icon-trunleft icon-bg" href="#">向左转</a>
						<a rel="e:tr" class="icon-trunright icon-bg" href="#">向右转</a>
						 -->
					</p>
					<div name="img">
						<img class="narrow-move" src="<%=t.getBmiddlePic() %>" rel="e:zo"  onclick='toggleImg(<%=t.getId()%>)'/>
					</div>
				</div>
			</div>
			<div class="box-b skin-bg"><span class="skin-bg"></span></div> 
			<span class="box-arrow skin-bg"></span> 

		</div> 
<%
	}
%>


		<div class="feed-info"><p>
<%
	if (wt!=null && wt.isRetweeted(t)){
%>
	 已转发(<%=t.getRepostsCount()%>)
<%
	}else{
%>
	 <!-- 
	 <a href="#" rel="e:fw" id="fw">转发(<%=t.getRepostsCount()%>)</a>
	  -->
	 <a href="http://weibo.com/<%=t.getUserId()%>/<%=formatMid(t.getMid())%>?type=repost" target="_blank">转发(<%=t.getRepostsCount()%>)</a>
<%
	}
%>
<!-- 
	|<a href="#" rel="e:fr">收藏</a>
	|<a href="javascript:;" rel="e:cm" id="cm ">评论(<%=t.getCommentsCount()%>)</a>
 -->	 
	|<a href="http://weibo.com/<%=t.getUserId()%>/<%=formatMid(t.getMid())%>" target="_blank">评论(<%=t.getCommentsCount()%>)</a>
	</p><span><%=formatTime(t.getCreatedAt())%> <!--来自 <%=t.getSourceName()%>--></span>  <span>热度:<%=formatSpeed(t.getRepostSpeed(), t.getRtAcceleration())%>  </span>
	
		
	  </div> 
  </div> 
</li>

<%
}
%>

</ul> 


<br>
<a href="#" class="gotop hidden" id="gotop">
	<span class="gotop-bg"></span>
	<span class="txt"><em class="arrow">&lt;</em><span>返回顶部</span></span>
</a>
<div align=right><a href="#top">返回顶部</a></a></div>
</div>