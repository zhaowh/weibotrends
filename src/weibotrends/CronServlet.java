package weibotrends;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@SuppressWarnings("serial")
public class CronServlet extends HttpServlet {
	private static Logger log = Logger.getLogger(CronServlet.class.getName());
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException,ServletException {
		doPost(req,resp);
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException, ServletException {

		String m = req.getParameter("m");
		if ("create_refresh_task".equals(m)) {
			WeiboTops.createAllRefreshTask();
		}
	}

}
