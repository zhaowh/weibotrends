package weibotrends;

import java.io.IOException;
import java.util.Collection;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import weibo4j.Oauth;
import weibo4j.model.User;
import weibo4j.model.WeiboException;

@SuppressWarnings("serial")
public class WeiboTopsServlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException,ServletException {
		doPost(req,resp);
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
	throws IOException,ServletException {
		try{
			String code = req.getParameter("code");
			if (code != null){
				loginCallback(req,resp);
				return;
			}
			
			HttpSession session = req.getSession(true);
			User user = (User)session.getAttribute("user");
			
			String m = req.getParameter("m");
			
			if (user!=null){ //已登录才能进行的操作
				if ("refresh".equals(m)){
					refresh(req,resp);
					return;
				}else if ("config".equals(m)){
					showConfig(req,resp);
					return;
				}else if ("saveConfig".equals(m)){
					saveConfig(req,resp);
					return;
				}else if ("logout".equals(m)){
					logout(req,resp);
					return;
				}
			}
			if ("login".equals(m)){
				login(req,resp);
				return;
			}else if ("rss".equals(m)){
				rss(req,resp);
				return;
			}else{
				listTops(req, resp);
				return;
			}
		}catch(WeiboException e){
			resp.sendError(500, e.getMessage());
		}
	}	
	
	private WeiboTops getWeiboTops(HttpServletRequest req){
		HttpSession session = req.getSession(true);
		long userId = 0;
		User user = (User)session.getAttribute("user");
		if (req.getParameter("u")!=null){
			userId = Long.parseLong(req.getParameter("u"));
			session.setAttribute("userId", Long.valueOf(userId));
		}else if (user!=null){
			userId=Long.parseLong(user.getId());
		}else if (session.getAttribute("userId")!=null){
			userId = (Long) session.getAttribute("userId");
		}
		return new WeiboTops(userId);
	}
	
	public void login(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException {
		Oauth oauth = new Oauth();
		HttpSession session = req.getSession(true);
		if (session.getAttribute("didAutoLoginForward")==null){
			session.setAttribute("didAutoLoginForward","true");
			try {
				resp.sendRedirect(oauth.authorize("code"));
			} catch (WeiboException e) {
				e.printStackTrace();
				throw new ServletException("Weibo login failed.", e);
			}
		}else{
			req.getRequestDispatcher("login.jsp").forward(req, resp);
		}
	}

	public void loginCallback(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException, WeiboException {
		HttpSession session = req.getSession(true);
		String code = req.getParameter("code");
		WeiboTops weiboTops = new WeiboTops(code);
		//session.setAttribute("weiboTops", weiboTops);
		session.setAttribute("user", weiboTops.getUser());

		//listTops(req, resp);
		resp.sendRedirect("weibotops?m=list");
	}
	
	public void logout(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException {
		req.getSession(true).invalidate();
		resp.sendRedirect("http://weibo.com/logout.php");
	}
	public void refresh(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException, WeiboException {
		WeiboTops wt = getWeiboTops(req);
		wt.searchTopTweets();
		listTops(req, resp);
	}
	
	public void listTops(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException{
		WeiboTops wt = getWeiboTops(req);
		String orderType = req.getParameter("order");
		Collection<Tweet> tweets =  wt.loadTopTweets(orderType);
		req.setAttribute("weiboTops", wt);
		req.setAttribute("tweets", tweets);
		req.getRequestDispatcher("main.jsp").forward(req, resp);
	}	
	
	public void rss(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException{
		WeiboTops wt = getWeiboTops(req);
		String orderType = req.getParameter("order");
		Collection<Tweet> tweets =  wt.loadTopTweets(orderType);
		req.setAttribute("weiboTops", wt);
		req.setAttribute("tweets", tweets);
		req.getRequestDispatcher("rss.jsp").forward(req, resp);
	}	
	
	public void showConfig(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException{
		WeiboTops wt = getWeiboTops(req);
		UserConfig conf = wt.getUserConfig(); 	
		req.setAttribute("userConfig", conf);
		req.getRequestDispatcher("main.jsp").forward(req, resp);
	}
	
	private static Long getLong(HttpServletRequest req, String paraName, Long defaultValue){
		Long longValue = defaultValue;
		String value = req.getParameter(paraName);
		if (value!=null){
			try{
				longValue = Long.parseLong(value);
			}catch(Exception ex){
				ex.printStackTrace();
			}
		}
		return longValue;
	}

	private static Integer getInt(HttpServletRequest req, String paraName, Integer defaultValue){
		Integer intValue = defaultValue;
		String value = req.getParameter(paraName);
		if (value!=null){
			try{
				intValue = Integer.parseInt(value);
			}catch(Exception ex){
				ex.printStackTrace();
			}
		}
		return intValue;
	}
	
	private static Boolean getBool(HttpServletRequest req, String paraName, Boolean defaultValue){
		Boolean value = defaultValue;
		String sValue = req.getParameter(paraName);
		//if (sValue!=null){
			value = Boolean.valueOf(sValue);
		//}
		return value;
	}
		
	private static String get(HttpServletRequest req, String paraName, String defaultValue){
		String value = req.getParameter(paraName);
		if (value==null){
			value = defaultValue;
		}
		return value;
	}
		
	public void saveConfig(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException{
		WeiboTops wt = getWeiboTops(req);
		UserConfig conf = wt.getUserConfig(); 
		
		conf.setMinRtCount(getInt(req,"min_rt_count",conf.getMinRtCount()));
		conf.setMinRtSpeed(getInt(req,"min_rt_speed",conf.getMinRtSpeed()));
		conf.setMaxPostedHour(getInt(req,"max_posted_hour",conf.getMaxPostedHour()));
		conf.setRtInterval(getInt(req,"rt_interval",conf.getRtInterval()));
		conf.setVerifiedOnly(getBool(req,"verified_only",conf.isVerifiedOnly()));
		conf.setFollowedOnly(getBool(req,"followed_only",conf.isFollowedOnly()));
		
		conf.setRepostTmpl(get(req,"repost_tmpl",conf.getRepostTmpl()));
		conf.setReplyTmpl(get(req,"reply_tmpl",conf.getReplyTmpl()));
		conf.setExcludedWords(get(req,"excluded_words",conf.getExcludedWords()));
		conf.setIncludedWords(get(req,"included_words",conf.getIncludedWords()));
		conf.setFollowedFirst(getBool(req,"followed_first",conf.isFollowedFirst()));
		conf.setAutoFollow(getBool(req, "auto_follow", conf.isAutoFollow()));
		
		conf.setDisabled(getBool(req,"disabled",conf.isDisabled()));
		
		wt.saveUserConfig(conf);

		showConfig(req, resp);
	}
	
}
