package weibotrends;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import weibo4j.model.WeiboException;

@SuppressWarnings("serial")
public class TaskServlet extends HttpServlet {
	private static Logger log = Logger.getLogger(TaskServlet.class.getName());
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException,ServletException {
		doPost(req,resp);
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
	throws IOException,ServletException {
		try{

			String m = req.getParameter("m");
			if ("refresh_tweets".equals(m)){
				refreshTweets(req,resp);
			}
		}catch(WeiboException e){
			log.warning(e.getMessage());
			e.printStackTrace();
			resp.sendError(500, e.getMessage());
		}
	}	
	
	public void refreshTweets(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException, WeiboException {
		log.fine("refreshTweets");
		String uid = req.getParameter("uid");
		String token = req.getParameter("token");
		WeiboTops wt = new WeiboTops(uid, token);
		//wt.searchTopTweets();
		wt.repostTopTweet();
		
	}
	

}
