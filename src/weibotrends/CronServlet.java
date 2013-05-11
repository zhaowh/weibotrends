package weibotrends;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import weibo4j.model.WeiboException;

import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;
import com.google.appengine.api.taskqueue.TaskOptions.Method;

@SuppressWarnings("serial")
public class CronServlet extends HttpServlet {
	private static Logger log = Logger.getLogger(CronServlet.class.getName());
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException,ServletException {
		doPost(req,resp);
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
	throws IOException,ServletException {
		try{

			String m = req.getParameter("m");
			if ("create_refresh_task".equals(m)){
				createRefreshTask(req,resp);
			}
		}catch(WeiboException e){
			resp.sendError(500, e.getMessage());
		}
	}	
	
	public void createRefreshTask(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException, WeiboException {
		PrintWriter out = resp.getWriter();
		
		Queue queue = QueueFactory.getDefaultQueue();

		List<UserConfig> list = WeiboTops.getValidUserConfigs();
		for (UserConfig c : list) {
			if (c.getAccessToken() == null)
				continue;

			if (c.getLastRtTime() != null) {
				long interval = System.currentTimeMillis()
						- c.getLastRtTime().getTime();
				long aWeek = 7 * 24 * 60 * 60 * 1000;
				if (interval > aWeek)
					continue; // 一周以上未转发，授权已失效
			}

			TaskOptions opts = TaskOptions.Builder.withUrl("/task");
			opts.method(Method.POST);
			opts.param("m", "refresh_tweets");
			opts.param("uid", c.getUserId());
			opts.param("token", c.getAccessToken());
			queue.add(opts);
			out.println(opts.getUrl() + "<br>");
			log.fine(opts.getUrl());
		}

		out.close();

	}
	

}
