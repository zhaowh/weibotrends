package weibotrends;


import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.Future;
import java.util.logging.Logger;

import weibo4j.http.AccessToken;
import weibo4j.model.Status;
import weibo4j.model.User;
import weibo4j.model.WeiboException;
import weibotrends.dao.DAO;
import weibotrends.dao.DAOFactory;
import weibotrends.weibo4g.Weibo;
import weibotrends.weibo4g.model.Count;

import com.google.appengine.api.urlfetch.HTTPResponse;

public class WeiboTops  implements java.io.Serializable {
	
	private static final long serialVersionUID = -928816334879502069L;
	
	private static Logger log = Logger.getLogger(WeiboTops.class.getName());
	
	private static final int MIN_RT_COUNT=200;
	private static final int MIN_RT_SPEED=20;
	
	private Weibo weibo;
	private User user;
	private UserConfig userConfig; 
	

	public WeiboTops(String authCode)  throws WeiboException{
		this.weibo = new Weibo();
		AccessToken accessToken = weibo.getAccessTokenByCode(authCode);
		weibo.setToken(accessToken.getAccessToken());
		initUserConfig(accessToken.getUid(), accessToken.getAccessToken());
	}

	public WeiboTops(String uid, String accessToken){
		weibo = new Weibo();
		weibo.setToken(accessToken);
		initUserConfig(uid, accessToken);
	}
	

	private void initUserConfig(String uid, String accessToken){
		DAO dao = DAOFactory.getDAO();
		this.userConfig = dao.fetchUserConfig(uid);
		if (this.userConfig == null ){
			this.userConfig = new UserConfig(uid, accessToken);
			dao.storeUserConfig(this.userConfig);
		}else if (!accessToken.equals(this.userConfig.getAccessToken())){
			this.userConfig.setAccessToken(accessToken);
			dao.storeUserConfig(this.userConfig);
		}
	}
	
	private void reloadUserConfig(){
		DAO dao = DAOFactory.getDAO();
		this.userConfig = dao.fetchUserConfig(this.userConfig.getUserId());
	}
		
	public User getUser() throws WeiboException{
		if (this.user == null){
			this.user = weibo.showUserById(this.userConfig.getUserId());
		}
		return this.user ;
	}
	
	public void saveUserConfig(UserConfig userConfig){
		this.userConfig = userConfig;
		DAO dao = DAOFactory.getDAO();
		dao.storeUserConfig(userConfig);
	}
	
	public UserConfig getUserConfig(){
		return this.userConfig;
	}


	//计算转发速度
	private static double calcRtSpeed(int reposts, int comments, Date createdAt,  int follows){
		double durHours = (System.currentTimeMillis() - createdAt.getTime())/1000.0/60/60;
		if (durHours == 0) durHours=0.1;
		if (follows == 0) follows=10;
		
		if (reposts > comments * 4){
			reposts = comments * 4;
		}

		//int rtSpeed = (int) (reposts * Math.pow(10000.0/follows, 0.618)  * Math.pow(60.0/durMins,0.618));
		double rtSpeed = (reposts * Math.pow(10000.0/follows, 0.618)  / durHours);
		return rtSpeed;
		 
	}

	//计算并设置转发速度
    private void resetRtSpeed(Tweet t){
    	Date now = new Date(System.currentTimeMillis());

    	if (t==null || t.getScreenName() == null || t.getCreatedAt() == null) {
    		log.warning("null? : "+t);
    		return;
    	}
    	double lastRtSpeed = t.getRepostSpeed();
    	Date lastCountTime = t.getCountTime();
   		//转发速度
   		double rtSpeed = calcRtSpeed(t.getRepostsCount(), t.getCommentsCount(), t.getCreatedAt(), t.getFollowersCount());
   		t.setRepostSpeed(rtSpeed);
   		t.setCountTime(now);
   		
   		if (lastCountTime!=null && now.after(lastCountTime)){
   			double durHours = (now.getTime() - lastCountTime.getTime())/1000.0/60/60;
   	   		//如计数刷新间隔超20分钟，则以刷新间隔内新增转发数计算转发速度
   			if ( t.getLastRepostsCount()!=0 && t.getLastCommentsCount()!=0 && durHours>0.33){
   				rtSpeed = calcRtSpeed(t.getRepostsCount()-t.getLastRepostsCount(), t.getCommentsCount()-t.getLastCommentsCount(), t.getLastCountTime(), t.getFollowersCount());
   				t.setRepostSpeed(rtSpeed);
   			}
   			//转发加速度
   			double acceleration =  ((rtSpeed - lastRtSpeed)/durHours);
   			t.setRtAcceleration(acceleration);
   		}
		
 		//log.finest(t.getScreenName() + " repost:" + t.getRepostsCount() + " comments:" + t.getCommentsCount() + " acceleration: " + t.getRtAcceleration());
		//log.finest("speed:" + rtSpeed + " lastSpeed:" + lastRtSpeed + " acceleration: " + t.getRtAcceleration());
   		
   		long expire = t.getCreatedAt().getTime()+this.userConfig.getMaxPostedHour() * 60 * 60 * 1000;
   		if (t.getRepostSpeed() < this.userConfig.getMinRtSpeed()){
   			t.setExpireTime(new Date(expire));
   		}else{
   			t.setExpireTime(null);//never expire
   		}

    }	
    

    //重设转发数据
    private void resetCounts(Map<Long, Tweet> tweets, List<Count> counts) throws WeiboException{
    	Date now = new Date(System.currentTimeMillis());
    	
    	Map<Long, Tweet> reseted = new HashMap<Long, Tweet>(counts.size());
    	Set<Long> remove = new HashSet<Long>();
    	for (Count count : counts){
    		Tweet t = tweets.get(count.getId());
    		if (t != null){
    			t.setRepostsCount(count.getReposts());
    			t.setCommentsCount(count.getComments());
    			
    			//重算转发速度相关数据并设置重算时间
    			resetRtSpeed(t);

    			//超过最低转发速度
    			if (t.getRepostSpeed() >= MIN_RT_SPEED ){
    				reseted.put(t.getId(), t);
    			}else{
    				remove.add(t.getId());
    			}
    		}
    	}
    	
    	WeiboCache.putAllTweets(reseted, userConfig.getUserId()); //重新缓存
    	log.fine("reCached: " + reseted.size());
    	
		long maxRefreshInterval = this.userConfig.getMaxPostedHour()*60*60*1000;
		int i=0;
    	for (Tweet t: tweets.values()){
    		if (!remove.contains(t.getId()) ){
    			if (isCountExpired(t, maxRefreshInterval)//已过最大计数刷新时间仍未刷新（原贴可能已删除）
    					||(t.getExpireTime()!=null && t.getExpireTime().before(now)) //已过缓存超时时间
    				){
    				remove.add(t.getId());
    				i++;
    			}
    		}    	
    	}
		log.fine("tweets missed: " + i);
    	
    	WeiboCache.delTweets(remove, userConfig.getUserId()); //移除转发速度下降的
    	log.fine("delCached: " + remove.size());
    	
    }
    
    private boolean isCountExpired(Tweet t, long countInterval){
		if (t.getCountTime()!=null && t.getCountTime().getTime() + countInterval < System.currentTimeMillis() //已到计数超时时间
			){  
			return true; 
		}
    	
    	return false;
    }
    
    //重设转发数据
    private List<Future<HTTPResponse>> preRecountTweets(Map<Long, Tweet> tweets) throws WeiboException{
    	Set<Long> ids = new HashSet<Long>(tweets.size());
    	for (Tweet t : tweets.values()){
			//已计数且低于最低转发速度的，计数缓存时间为发帖时距/5；高于最低转发速度的，计数缓存时间为发帖时距/10
			long minCountInterval = 0;
			if (t.getRepostSpeed() < this.userConfig.getMinRtSpeed() ){
				minCountInterval = (System.currentTimeMillis() - t.getCreatedAt().getTime())/5 ;
			}else{
				minCountInterval = (System.currentTimeMillis() - t.getCreatedAt().getTime())/10 ;
			}
			//最长发帖时间2小时时，最长刷新间隔30分钟
			long maxRefreshInterval = this.userConfig.getMaxPostedHour() * 60*60*1000 /4;
			if (minCountInterval > maxRefreshInterval){ 
				minCountInterval = maxRefreshInterval;
			}
			//未到计数刷新超时时间则跳过
			if (!isCountExpired(t, minCountInterval)){  
				continue; 
			}
			//log.fine("minCountInterval:" + minCountInterval + " maxRefreshInterval:" + maxRefreshInterval);
			
    		ids.add(t.getId());
    	}
		log.fine("send recount: " + ids.size());
    	return weibo.preCounts(ids);

    }
        
    private void recountTweets(Map<Long, Tweet> tweets, List<Future<HTTPResponse>> respList) throws WeiboException{
    	List<Count> counts = weibo.getCounts(respList);
    	resetCounts(tweets, counts);
    	log.fine("recounted: " + counts.size());
    }
    
    //加载缓存微博
    private Map<Long, Tweet> loadCachedTweets() throws WeiboException{
    	Map<Long, Tweet> cachedTweets = WeiboCache.getAllTweets(userConfig.getUserId());
    	//同时加载热门微博（可能由其他用户搜索提供）
    	Map<Long, Tweet> topTweets = WeiboCache.getTopTweets();
    	cachedTweets.putAll(topTweets);
    	log.fine("load cached: " + cachedTweets.size()); 

    	return cachedTweets;
    }


	private  List<Future<HTTPResponse>> preLoadNewTweets(long sinceId) throws WeiboException{
		//同时搜索5页
		log.fine("load new from: " + sinceId);
		return weibo.preFriendsTimeline(0, 0, sinceId);
	}
	
    //加载新微博并缓存
	private  Map<Long, Tweet> loadNewTweets( List<Future<HTTPResponse>> tasks) throws WeiboException{
		Map<Long, Tweet> newTweets = new HashMap<Long, Tweet>();

		Tweet lastTweet = null;

		List<Status> statuses = weibo.getFriendsTimeline(tasks);

		for (Status status : statuses) {
			if (status.getCreatedAt() == null // 被删除贴无创建时间 
					|| status.getUser() == null
					|| status.getUser().getId() == null 
					|| status.getUser().getId().equals(this.userConfig.getUserId()) //过滤本人贴
				)
				continue; 

			Tweet t = new Tweet(status);

			if (lastTweet == null) {
				lastTweet = t;
			} else if (lastTweet.getId() < t.getId()) {
				lastTweet = t;
			}
			resetRtSpeed(t);

			
			// 较热门才缓存
			if (t.getRepostSpeed() >= MIN_RT_SPEED && t.getRepostsCount() >= MIN_RT_COUNT) {
				newTweets.put(t.getId(), t);
			}
			

			if (t.getPrimaryTweet() != null
					&& t.getPrimaryTweet().getCreatedAt() != null
					&& t.getPrimaryTweet().getScreenName() != null) { // 转发的原文,且未被删除
				
				Tweet pt = t.getPrimaryTweet();
				resetRtSpeed(pt);
				
				//从缓存获取已记录的转发信息
				Tweet cached = WeiboCache.getTweet(pt.getId());
				if (cached!=null){
					//添加已记录的转发信息
					pt.addRetweets(cached.getRetweets());
				}
				
				// 较热门才缓存
				if (pt.getRepostSpeed() >= MIN_RT_SPEED && pt.getRepostsCount() >= MIN_RT_COUNT) {
					newTweets.put(pt.getId(), pt);
				}
				
				
			}
		}
		// 缓存最新微博作为再次抓取时的since_id
		if (lastTweet != null) {
			newTweets.put(lastTweet.getId(), lastTweet);
		}

		WeiboCache.putAllTweets(newTweets, userConfig.getUserId()); // 缓存新微博

		log.fine("loaded new: " + newTweets.size());
		return newTweets;
	}	
	
	private  Future<HTTPResponse> preRepostsByMe() throws WeiboException{
		long sinceId = this.userConfig.getLastRepostedId();
		return weibo.preRepostsByMe(sinceId);
	}
	
    //刷新已转发微博ID
	private  Set<Long> loadRepostsByMe( Future<HTTPResponse> task) throws WeiboException{
		Set<Long> ids = this.userConfig.getRepostedIds();
		List<Status> list = weibo.getRepostsByMe(task);
		if (list!=null && !list.isEmpty()){
			reloadUserConfig();
			for (Status s : list){
				this.userConfig.addRepostedId(Long.parseLong(s.getId()));
				if (s.getRetweetedStatus()!=null){
					this.userConfig.addRepostedId(Long.parseLong(s.getRetweetedStatus().getId()));
				}
			}
			ids = this.userConfig.getRepostedIds();
			saveUserConfig(this.userConfig);
			log.fine("loaded reposted: " + list.size() + " all:" + ids.size());
		}
		log.fine("all:" + ids.size());
		return ids;
	}
	
	
	private  static long getMaxId(Map<Long, Tweet> tweets){
		long maxId = 0;
		for (long id : tweets.keySet()){
			maxId = (maxId<id) ? id: maxId;
		}
		return maxId;
	}

    	
	
	//加载所有微博
	private Map<Long, Tweet> loadAllTweets() throws WeiboException{
		Map<Long, Tweet> cachedTweets = loadCachedTweets();
		long sinceId = getMaxId(cachedTweets);
		
		//并发
		List<Future<HTTPResponse>> newTasks = preLoadNewTweets(sinceId); 
		Future<HTTPResponse> myRepostsTasks = preRepostsByMe();
		List<Future<HTTPResponse>> recountTasks = preRecountTweets(cachedTweets);

		//刷新缓存微博计数及速度
		recountTweets(cachedTweets, recountTasks);
		//加载已转发微博ID
		Set<Long> repostedIds =  loadRepostsByMe(myRepostsTasks);
		//加载新微博
		Map<Long, Tweet> newTweets = loadNewTweets(newTasks);
		
		Map<Long, Tweet> all = new HashMap<Long, Tweet>(cachedTweets.size() + newTweets.size());
		all.putAll(cachedTweets);
		all.putAll(newTweets);
		

		log.fine("all: " + all.size());
		return all;
	}
	    

	// 搜索热门转发微博
	private Map<Long, Tweet> searchTopTweets(Map<Long, Tweet> all) {
		TreeMap<Long, Tweet> tops = new TreeMap<Long, Tweet>();
    	reloadUserConfig();//重新加载用户最新配置信息
    	
		WeiboFilter filter = new WeiboFilter(this.userConfig.getExcludedWords());

		for (Tweet t : all.values()) {
			if (t.getRepostsCount() < this.userConfig.getMinRtCount())
				continue;
			if (t.getRepostSpeed() < this.userConfig.getMinRtSpeed())
				continue;
			
			t = filter.filter(t);
			if (t!=null && t.getRepostSpeed() >= this.userConfig.getMinRtSpeed()){
				tops.put(t.getId(), t);
			}

		}

		log.fine("top : " + tops.size());

		WeiboCache.putTopTweets(tops);
		// dao.storeTweets(tops.values());
		return tops.descendingMap();
	}
  
	/**
	 * 搜索热门转发微博 
	 */
    public Map<Long, Tweet> searchTopTweets() throws WeiboException{
    	Map<Long, Tweet> all =  loadAllTweets();
    	return searchTopTweets(all);
    }
    
    
    

    //排序
    private  Collection<Tweet> sortTweets(Map<Long, Tweet> tweets, String orderType) {
    	if ("bySpeed".equals(orderType)){
    		TreeMap<Double, Tweet> tweets2 = new TreeMap<Double, Tweet>();
    		for (Tweet t : tweets.values()){
    			double speed = t.getRepostSpeed();
    			/*
    			if (t.getRtAcceleration()!=null){
    				speed = speed + t.getRtAcceleration();
    			}
    			*/
    			tweets2.put(speed, t);
    		}
    		return tweets2.descendingMap().values();
    	}else if ("byAcc".equals(orderType)){
    		TreeMap<Double, Tweet> tweets2 = new TreeMap<Double, Tweet>();
    		for (Tweet t : tweets.values()){
    			double acc = t.getRtAcceleration()!=null?t.getRtAcceleration():0;
    			tweets2.put(acc, t);
    		}
    		return tweets2.descendingMap().values();
    	}else{
    		return tweets.values();
    	}
    }
    
	private  boolean isRetweeted(long id) {
		boolean isRetweeted = false;
		//标记已转发微博
		Set<Long> ids = this.userConfig.getRepostedIds();
		if (ids==null) return true; //未取到已转发id
		
		isRetweeted = ids.contains(id);
		
		log.finest(isRetweeted + ": " + id +" in " + ids.size());

		return isRetweeted;
	}
	
	public  boolean isRetweeted(Tweet t) {
		if (t==null) return false;
		
		boolean retweeted = isRetweeted(t.getId());

		if (t.getPrimaryTweet()!=null ){
			retweeted = retweeted && isRetweeted(t.getPrimaryTweet().getId());
		}
		
		return isRetweeted(t.getId());
	}
    
    private boolean repostFirst(Collection<Tweet> tweets)throws WeiboException{
    	if (tweets==null || tweets.isEmpty()) return false;
    	
    	//TODO String rtStr = this.userConfig.getRepostTmpl();
    	
    	Tweet t = tweets.iterator().next();
		if (!isRetweeted(t) ) {
			log.fine(" reposting: " + t);
			
			Status s = this.weibo
					.repost(String.valueOf(t.getId()), null, 0);
			
			if (s!=null && s.getId() != null) {
				this.userConfig.addRepostedId(t.getId());//更新已转发列表
				if (t.getPrimaryTweet()!=null){
					this.userConfig.addRepostedId(t.getPrimaryTweet().getId());
				}
				saveUserConfig(this.userConfig);
				
				return true;
			}
		}
		
		return false;
    }
    
    /**
     * 转发第一条微博（速度第一或加速度第一或最新热门）
     * @param tops
     * @return
     * @throws WeiboException
     */
    private boolean repostTopTweet(Map<Long, Tweet> tops ) throws WeiboException{
		boolean reposted = false;
		if (tops.isEmpty())
			return false;

		if (this.userConfig.isDisabled()){
			log.fine(" repost disabled.");
			return false;
		}
		
		
		
		if (!reposted) {
			// 转发速度第一
			reposted = repostFirst(sortTweets(tops, "bySpeed"));
		}
		if (!reposted) {
			// 转发加速度第一
			reposted = repostFirst(sortTweets(tops, "byAcc"));
		}
		if (!reposted) {
			// 转发最新
			reposted = repostFirst(tops.values());
		}
		log.fine(" reposted:" + reposted);
		return reposted;
    }
    
    /**
     * 搜索并转发最热门微博
     * @return 转发是否成功
     * @throws WeiboException
     */
    public boolean repostTopTweet() throws WeiboException{
		Map<Long, Tweet> tops = searchTopTweets();
		return repostTopTweet(tops);
    }
    
    /**
     * 加载缓存的热门微博,按指定方式排序
     * @param orderType 排序方式：bySpeed:按速度；byAcc按加速度；默认按时间倒序
     * @return
     */
    
    public Collection<Tweet> loadTopTweets(String orderType) {
    	Map<Long, Tweet> tweets = WeiboCache.getTopTweets();
    	tweets = searchTopTweets(tweets);
    	return sortTweets(tweets, orderType);
    }
    
    /**
     * 加载缓存的热门微博,按时间倒序排序
     */
    public  Collection<Tweet> loadTopTweets() {
    	return loadTopTweets("byTime");
    }
    

    public static void main(String[] args){
    	SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd kk:mm:ss", Locale.SIMPLIFIED_CHINESE);
    	System.out.println(df.format(new Date()));
    	System.out.println(WeiboUtils.formatTime(new Date()));
    }

}
