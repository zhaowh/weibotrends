package weibotrends;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.util.Collection;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import weibo4j.Users;
import weibo4j.http.AccessToken;
import weibo4j.model.User;
import weibo4j.model.WeiboException;
import weibotrends.weibo4g.Weibo;

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
			if (session.getAttribute("user") == null ){
				login(req, resp);
				return;
			}
			
			String m = req.getParameter("m");
			if ("refresh".equals(m)){
				refresh(req,resp);
			}else if ("config".equals(m)){
				showConfig(req,resp);
			}else if ("saveConfig".equals(m)){
				saveConfig(req,resp);
			}else{
				listTops(req, resp);
			}
		}catch(WeiboException e){
			resp.sendError(500, e.getMessage());
		}
	}	
	
	private WeiboTops getWeiboTops(HttpServletRequest req){
		User user = (User)req.getSession().getAttribute("user");
		return new WeiboTops(Long.parseLong(user.getId()));
	}
	
	public void login(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException {
		req.getRequestDispatcher("login.jsp").forward(req, resp);
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
		value = Boolean.valueOf(sValue);
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
		conf.setMinRtSpeed(getInt(req,"min_rt_speed",conf.getMinRtCount()));
		conf.setMaxPostedHour(getInt(req,"max_posted_hour",conf.getMaxPostedHour()));
		conf.setRtInterval(getInt(req,"rt_interval",conf.getRtInterval()));
		conf.setVerifiedOnly(getBool(req,"verified_only",conf.isVerifiedOnly()));
		conf.setFollowedOnly(getBool(req,"followed_only",conf.isFollowedOnly()));
		conf.setDisabled(getBool(req,"disabled",conf.isDisabled()));
		conf.setRepostTmpl(get(req,"repost_tmpl",conf.getRepostTmpl()));
		conf.setReplyTmpl(get(req,"reply_tmpl",conf.getReplyTmpl()));
		conf.setExcludedWords(get(req,"excluded_words",conf.getExcludedWords()));
		conf.setIncludedWords(get(req,"included_words",conf.getIncludedWords()));
		conf.setFollowedFirst(getBool(req,"followed_first",conf.isFollowedFirst()));
		
		wt.saveUserConfig(conf);
		

		showConfig(req, resp);
	}
	
}
