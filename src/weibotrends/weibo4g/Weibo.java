package weibotrends.weibo4g;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;
import java.util.logging.Logger;

import weibo4j.http.AccessToken;
import weibo4j.model.Paging;
import weibo4j.model.PostParameter;
import weibo4j.model.Status;
import weibo4j.model.StatusWapper;
import weibo4j.model.User;
import weibo4j.model.WeiboException;
import weibo4j.util.WeiboConfig;
import weibotrends.weibo4g.http.HttpClientAsync;
import weibotrends.weibo4g.model.Count;

import com.google.appengine.api.urlfetch.HTTPResponse;


/**
 * @author sinaWeibo
 * 
 */

public class Weibo implements java.io.Serializable {

	private static final long serialVersionUID = 4282616848978535016L;
	
	private static Logger log = Logger.getLogger(Weibo.class.getName());

	public static final int TIMELINE_PAGE_SIZE=50;
	
	public  HttpClientAsync client = new HttpClientAsync();

	
	/*----------------------------Oauth接口--------------------------------------*/

	public AccessToken getAccessTokenByCode(String code) throws WeiboException {
		AccessToken token =  new AccessToken(client.post(
				WeiboConfig.getValue("accessTokenURL"),
				new PostParameter[] {
						new PostParameter("client_id", WeiboConfig
								.getValue("client_ID")),
						new PostParameter("client_secret", WeiboConfig
								.getValue("client_SERCRET")),
						new PostParameter("grant_type", "authorization_code"),
						new PostParameter("code", code),
						new PostParameter("redirect_uri", WeiboConfig
								.getValue("redirect_URI")) }, false));
		
		setToken(token.getAccessToken());
		return token;
	}	
	/**
	 * Sets token information
	 * 
	 * @param token
	 */
	public  void setToken(String token) {
		client.setToken(token);
	}
	
	

	/*----------------------------用户接口----------------------------------------*/
	/**
	 * 根据用户ID获取用户信息
	 * 
	 * @param uid
	 *            需要查询的用户ID
	 * @return User
	 * @throws WeiboException
	 *             when Weibo service or network is unavailable
	 * @version weibo4j-V2 1.0.1
	 * @see <a href="http://open.weibo.com/wiki/2/users/show">users/show</a>
	 * @since JDK 1.5
	 */
	public User showUserById(String uid) throws WeiboException {
		return new User(client.get(
				WeiboConfig.getValue("baseURL") + "users/show.json",
				new PostParameter[] { new PostParameter("uid", uid) })
				.asJSONObject());
	}
	
	

	//逗号分割的id，最多100个
    public  Future<HTTPResponse> preCounts(String ids) throws WeiboException {
    	return client.getAsync(WeiboConfig.getValue("baseURL")
				+ "statuses/counts.json",
				new PostParameter[] { new PostParameter("ids", ids) });
    }
    
    public  List<Future<HTTPResponse>> preCounts(Set<Long> ids) throws WeiboException {
    	
    	List <Future<HTTPResponse>> list = new ArrayList<Future<HTTPResponse>> ();
    	
    	StringBuffer sb = new StringBuffer();
    	int i = 0;
    	for (Long id : ids){
    		sb.append(id).append(",");
			if (i % 100 == 99) {
				list.add(preCounts(sb.toString()));
				sb = new StringBuffer();
			}
    		i++;
    	}
    	if (sb.length()>0){
			list.add(client.getAsync(WeiboConfig.getValue("baseURL")
					+ "statuses/counts.json",
					new PostParameter[] { new PostParameter("ids", sb
							.toString()) }));
    	}
					
    	
    	return list;
    }
    

    public  List<Count> getCounts(List<Future<HTTPResponse>> respList) throws WeiboException{
    	List<Count> list = new ArrayList<Count>();
    	for (Future<HTTPResponse> f : respList){
    		HTTPResponse resp;
			try {
				resp = f.get();
			} catch (Exception e) {
				e.printStackTrace();
				throw new WeiboException(e);
			}
			List<Count> l = Count.constructCounts(client.getResponse(resp));
			log.finest("get: " +l.size());
    		list.addAll(l);
    	}
    	return list;
    }	

    

	/**
	 * 获取当前登录用户及其所关注用户的最新微博消息。<br/>
	 * 和用户登录 http://weibo.com 后在“我的首页”中看到的内容相同。
	 * 
	 * @param 过滤类型ID，0：全部、1：原创、2：图片、3：视频、4：音乐，默认为0。
	 * @version weibo4j-V2 1.0.1
	 * @see <a href="http://open.weibo.com/wiki/2/statuses/friends_timeline">
	 *      statuses/friends_timeline </a>
	 */
	public List<Future<HTTPResponse>> preFriendsTimeline(Integer baseAPP, Integer feature,
			long sinceId) throws WeiboException {
		List<Future<HTTPResponse>> respList  = new ArrayList<Future<HTTPResponse>>();
		Paging paging;
		
		int maxPage = sinceId==0?10:5; //最多取500条
		
		for (int i=1; i<=maxPage; i++){
			if (sinceId > 0){
				paging = new Paging(i, TIMELINE_PAGE_SIZE, sinceId);
			}else{
				paging = new Paging(i, TIMELINE_PAGE_SIZE);
			}
			respList.add(
					client.getAsync(
					WeiboConfig.getValue("baseURL") + "statuses/friends_timeline.json",
					new PostParameter[] {
							new PostParameter("base_app", baseAPP.toString()),
							new PostParameter("feature", feature.toString()) },
					paging)
			);
			
		}
		return respList;
	}	
	
	public List<Status> getFriendsTimeline(List<Future<HTTPResponse>> respList) throws WeiboException{
		List<Status> list = new ArrayList<Status>();
		for (Future<HTTPResponse> f : respList){
			StatusWapper w = Status.constructWapperStatus(this.client.getResponse(f));
			log.finest("get: " + w.getStatuses().size());
			list.addAll(w.getStatuses());
			if (w.getStatuses().size()<TIMELINE_PAGE_SIZE) { //已无数据
				break;
			}
		}
		return list;
	}    
}