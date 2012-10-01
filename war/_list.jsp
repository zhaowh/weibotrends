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
	WeiboTops wt = (WeiboTops)session.getAttribute("weiboTops");
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
		String s = "<img src='var/data/logo/default_v2.png' border=0 alt='V' title='新浪认证'>";
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

%>
<link href="/css/base.css" rel="stylesheet" type="text/css" /> 
<link href="/css/skin_default/skin.css" rel="stylesheet" type="text/css" /> 

<div class="feed-list" id="xwb_weibo_list"> 
	<div class="feed-tit"> 
		<div class="feed-filter">
			排序：<a href="weibotops?m=list&order=byTime">时间</a>
				  <a href="weibotops?m=list&order=bySpeed">速度</a>
				  <a href="weibotops?m=list&order=byAcc">加速度</a>
		</div> 
		<div class="feed-filter"> <a href="weibotops?m=config">设置</a></div> 
		<div class="feed-filter"> <a href="weibotops?m=refresh">刷新</a></div> 
		<h3>最新热推</h3> 
	</div> 


<ul id="xwb_weibo_list_ct"> 

<%
for (Tweet t : tweets){
%>

<li rel="w:<%=t.getId()%>">	<div class="user-pic"> 
	<a href="http://weibo.com/<%=t.getUserId()%>" target="_blank">
		<img width="50" height="50" src="<%=t.getProfileImageUrl()%>" alt="<%=t.getScreenName()%>" title="<%=t.getScreenName()%>" />
	</a> 
	</div> 
	<div class="feed-content"> 
		<p class="feed-main"> 
<a href="http://weibo.com/<%=t.getUserId()%>" target="_blank" title="<%=t.getScreenName()%>">
	<%=t.getScreenName()%><%=formatVerfied(t.isVerified()) %>
</a>：<%=formatText(t.getText())%>
<%
	if (t.getRetweet()!=null){
		Map<String, Tweet> rts = t.getUserRetweets();
		Iterator<Tweet> itr = rts.values().iterator();
		int i = 0;
%><div class="blur-txt"> 由
<%
 	while( i<4 && itr.hasNext()){
 		Tweet rt = itr.next();
%>
	<a href="http://weibo.com/<%=rt.getUserId()%>/<%=formatMid(rt.getMid())%>" target="_blank">
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
		</p> 
<%
	if (t.getPrimaryTweet()!=null){
%>		
		<div class="box-style"> 
			<div class="box-t skin-bg"><span class="skin-bg"></span></div> 
			<div class="forward box-content"> 
				<p><a href="http://weibo.com/<%=t.getPrimaryTweet().getUserId()%>" target="_blank">@<%=t.getPrimaryTweet().getScreenName()%><%=formatVerfied(t.isVerified()) %></a>：<%=formatText(t.getPrimaryTweet().getText())%>
				</p> 
<%
		if (t.getPrimaryTweet().getThumbnailPic() != null){
%>
				<div class="preview-img">
					<div class="feed-img">
						<img class="zoom-move" src="<%=t.getPrimaryTweet().getThumbnailPic() %>" rel="e:zi,fw:0"/>
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
	if (t.getThumbnailPic()!=null && t.getThumbnailPic().length()>0){
%>
		<div class="preview-img">
			<div class="feed-img">
				<img class="zoom-move" src="<%=t.getThumbnailPic()%>" rel="e:zi,fw:0"/>
			</div>
		</div>
<%
	}
%>


		<div class="feed-info"><p>
<%
	if (wt.isRetweeted(t.getId())){
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

<% 
/*
function json_weibo(t.){
			$xwb = array();
			$xwb['cr'] = t.getCreatedAt();
			$xwb['s'] = t.getSource();
			$xwb['tx'] = t.getText();
			$xwb['tp'] = t.getThumbnailPic();
			$xwb['mp'] = t.getBmiddlePic();
			$xwb['op'] = t.getOriginalPic();
			$xwb['u']getId() = t.getUserId();
			$xwb['u']['sn'] = t.getScreenName();
			$xwb['u']['p'] = t.getProfileImageUrl();
			return json_encode($xwb);
}
function json_weibo_list(t.weets){
	$s = '{';
	foreach(t.weets as t.){ 
			$s = $s.'"'.t.getId().'":'.json_weibo(t.).',';
			if (t.getPrimaryTweet().){
				$s = $s.'"'.t.getPrimaryTweet().getId().'":'.json_weibo(t.getPrimaryTweet().).',';
			}
	}
	$s = $s.'"v":0}';
	return $s;
}
*/
%>

<script type='text/javascript'> 

if(!window.Xwb) Xwb={};
/*
Xwb.cfg={	basePath :	'/action.php',
			routeMode:  0,
			routeVname: 'm',
			loginCfg : 	1,

			wbList: {},
	
			authenCfg:	'0',
 
			authenTit:	'',
 
			webName:	'微博趋势',
 
			uid: 		'<%=user.getId()%>', 
 
			siteUid:	'',
 
			siteUname:	'Guest',
 
			siteName:	'NoneSite',
 
			siteReg:	'',
			remind: 0,
			maxid: '',
			page: 'index',
			akey: '1126698900',
			ads: [{"flag":"global_bottom","page":"global","cfg":[]}]};
*/

</script>    
<br>
<a href="#" class="gotop hidden" id="gotop">
	<span class="gotop-bg"></span>
	<span class="txt"><em class="arrow">&lt;</em><span>返回顶部</span></span>
</a>
<div align=right><a href="#top">返回顶部</a></a></div>
</div>