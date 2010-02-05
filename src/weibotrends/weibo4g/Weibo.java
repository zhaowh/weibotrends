package weibotrends.weibo4g;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;
import java.util.logging.Logger;

 
import weibo4j.http.AccessToken;
import weibo4j.http.Response;
import weibo4j.model.Paging;
import weibo4j.model.PostParameter;
import weibo4j.model.Status;
import weibo4j.model.StatusWapper;
import weibo4j.model.User;
import weibo4j.model.WeiboException;
import weibo4j.org.json.JSONArray;
import weibo4j.org.json.JSONException;
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
			try {
				HTTPResponse resp;
				resp = f.get();
				List<Count> l = Count.constructCounts(client.getResponse(resp));
				log.finest("get: " +l.size());
	    		list.addAll(l);
			} catch (Exception e) {
				e.printStackTrace();
				log.warning(e.toString());
			}
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
	public List<Future<HTTPResponse>> preTimeline(long sinceId) throws WeiboException {
		List<Future<HTTPResponse>> respList  = new ArrayList<Future<HTTPResponse>>();
		Paging paging;
		
		//int maxPage = sinceId==0?10:5; //最多取500条
		int maxPage = sinceId==0?5:2;  //TODO 临时修改，用于申请读权限
		
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
							new PostParameter("base_app", "0"),
							new PostParameter("feature", "0") },
					paging)
			);
			
		}
		//public timeline
		respList.add(
				client.getAsync(
					WeiboConfig.getValue("baseURL") + "statuses/public_timeline.json",
					new PostParameter[] {
							new PostParameter("count", "100")
						}
				)
		);
		//suggestions statuses reorder
		respList.add(
				client.getAsync(
					WeiboConfig.getValue("baseURL") + "suggestions/statuses/reorder.json",
					new PostParameter[] {
							new PostParameter("section", "3600"),//
							new PostParameter("count", "50")
						}
				)
		);			
		//suggestions favorites
		respList.add(
				client.getAsync(
					WeiboConfig.getValue("baseURL") + "suggestions/favorites/hot.json",
					new PostParameter[] {
							new PostParameter("count", "50")
						}
				)
		);
		return respList;
	}	
	
	public List<Status> getTimeline(List<Future<HTTPResponse>> respList) throws WeiboException{
		List<Status> list = new ArrayList<Status>();
		log.finest("get threads: " + respList.size());
		for (Future<HTTPResponse> f : respList){
			try{
				StatusWapper w = Status.constructWapperStatus(this.client.getResponse(f));
				log.finest("get: " + w.getStatuses().size());
				list.addAll(w.getStatuses());
			}catch(Exception ex){
				log.warning("fetch error: " + ex);
				ex.printStackTrace();
			}
		}
		return list;
	}   
	
	/**
	 * 获取某个用户最新发表的微博列表ID
	 * 
	 * @return user_timeline IDS
	 * @throws WeiboException
	 *             when Weibo service or network is unavailable
	 * @version weibo4j-V2 1.0.1
	 * @see <a
	 *      href="http://open.weibo.com/wiki/2/statuses/user_timeline">statuses/user_timeline</a>
	 * @since JDK 1.5
	 */
	public List<Future<HTTPResponse>> preRepostsByMe(long sinceId, String userId) throws WeiboException{
		List<Future<HTTPResponse>> respList  = new ArrayList<Future<HTTPResponse>>();
		respList.add(
			client.getAsync(
				//WeiboConfig.getValue("baseURL")+"statuses/repost_by_me.json",
				WeiboConfig.getValue("baseURL")+"statuses/user_timeline.json",
				new PostParameter[] {
					new PostParameter("since_id", String.valueOf(sinceId)),
					new PostParameter("count", "100"),
					new PostParameter("trim_user", "1"),
					new PostParameter("uid", userId)
				}
			)
		);
		if (sinceId!=0) respList.add( //取最近5条转发，避免转发老微博遗漏
				client.getAsync(
						WeiboConfig.getValue("baseURL")+"statuses/user_timeline.json",
					new PostParameter[] {
						new PostParameter("since_id", "0"),
						new PostParameter("count", "5"),
						new PostParameter("trim_user", "1"),
						new PostParameter("uid", userId)
					}
				)
			);
		return respList;
	}	
	
	public List<Status> getRepostsByMe(Future<HTTPResponse>  future) throws WeiboException{
		List<Status> list = new ArrayList<Status>();
		try{
			Response res = this.client.getResponse(future);
			//log.finest(res.asString());
			StatusWapper w = Status.constructWapperStatus(res);
			log.finest("get: " + w.getStatuses().size());
			list.addAll(w.getStatuses());
		}catch(Exception e){
			e.printStackTrace();
			log.warning(e.toString());
		}
		return list;
	}
	
	
	

	/**
	 * 转发一条微博
	 * 
	 * @param id
	 *            要转发的微博ID
	 * @param status
	 *            添加的转发文本，必须做URLencode，内容不超过140个汉字，不填则默认为“转发微博”
	 * @param is_comment
	 *            是否在转发的同时发表评论，0：否、1：评论给当前微博、2：评论给原微博、3：都评论，默认为0
	 * @return Status
	 * @throws WeiboException
	 *             when Weibo service or network is unavailable
	 * @version weibo4j-V2 1.0.0
	 * @see <a
	 *      href="http://open.weibo.com/wiki/2/statuses/repost">statuses/repost</a>
	 * @since JDK 1.5
	 */
	public Status repost(String id, String status, Integer is_comment)
			throws WeiboException {
		return new Status(client.post(WeiboConfig.getValue("baseURL") + "statuses/repost.json", 
				new PostParameter[] {
					new PostParameter("id", id),
					new PostParameter("status", status),
					new PostParameter("is_comment", is_comment.toString()) 
				},
				true
			));
	}
	
	


	/**
	 * 获取用户关注的用户UID列表
	 * 
	 * @param uid
	 *            需要查询的用户UID
	 * @return ids
	 * @throws WeiboException
	 *             when Weibo service or network is unavailable
	 * @version weibo4j-V2 1.0.0
	 * @see <a
	 *      href="http://open.weibo.com/wiki/2/friendships/friends/ids">friendships/friends/ids</a>
	 * @since JDK 1.5
	 */
	public  Future<HTTPResponse>  preFriendsIdsByUid(String uid) throws WeiboException {
		Future<HTTPResponse> response = client.getAsync(
				WeiboConfig.getValue("baseURL")
						+ "friendships/friends/ids.json",
				new PostParameter[] {
					new PostParameter("uid", uid),
					new PostParameter("count", "5000")
				});
		return response;
	}

	/**
	 * 获取用户关注的用户UID列表
	 * 
	 * @param  screen_name
	 *            需要查询的用户昵称
	 * @return ids
	 * @throws WeiboException
	 *             when Weibo service or network is unavailable
	 * @version weibo4j-V2 1.0.0
	 * @see <a
	 *      href="http://open.weibo.com/wiki/2/friendships/friends/ids">friendships/friends/ids</a>
	 * @since JDK 1.5
	 */
	public  Future<HTTPResponse>  preFriendsIdsByName(String screen_name) throws WeiboException {
		Future<HTTPResponse> response = client.getAsync(
				WeiboConfig.getValue("baseURL")
						+ "friendships/friends/ids.json",
						new PostParameter[] {
							new PostParameter("screen_name", screen_name),
							new PostParameter("count", "5000")
						}
				
		);
		return response;
	}
	
	public String[] getFriendsIds(Future<HTTPResponse>  future)  throws WeiboException {
		try{
			return User.constructIds(this.client.getResponse(future));
		}catch(Exception e){
			e.printStackTrace();
			log.warning(e.toString());
			return new String[]{};
		}
	}
	
	/**
	 * 关注一个用户
	 * 
	 * @param screen_name
	 *            需要查询的用户screen_name 
	 * @throws WeiboException
	 *             when Weibo service or network is unavailable
	 * @version weibo4j-V2 1.0.0
	 * @see <a
	 *      href="http://open.weibo.com/wiki/2/friendships/create">friendships/create</a>
	 * @since JDK 1.5
	 */
	public Future<HTTPResponse>  createFriendshipsByName(String screen_name)
			throws WeiboException {
		return client.postAsync(
				WeiboConfig.getValue("baseURL") + "friendships/create.json",
				new PostParameter[] { new PostParameter("screen_name",
						screen_name) });
	}
}