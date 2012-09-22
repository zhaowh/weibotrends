package weibotrends;


import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
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
	
	private List<Future<HTTPResponse>>  loadRepostsTask = new ArrayList<Future<HTTPResponse>>();

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
    private void calcRtSpeed(Tweet t){

    	if (t==null || t.getScreenName() == null || t.getCreatedAt() == null) {
    		log.warning("null? : "+t);
    		return;
    	}
    	Date now = new Date(System.currentTimeMillis());
   		//转发速度
   		double rtSpeed = calcRtSpeed(t.getRepostsCount(), t.getCommentsCount(), t.getCreatedAt(), t.getFollowersCount());
   		double rtSpeedNow = rtSpeed;
   		if (t.getLastCountTime() !=null && t.getLastRepostsCount()!=0 && t.getLastCommentsCount()!=0){
   			rtSpeedNow = calcRtSpeed(t.getRepostsCount()-t.getLastRepostsCount(), t.getCommentsCount()-t.getLastCommentsCount(), t.getLastCountTime(), t.getFollowersCount());
   		}

    	double lastRtSpeed = t.getRepostSpeed();
    	Date lastCountTime = t.getCountTime();
   		t.setRepostSpeed(rtSpeed);
   		t.setCountTime(now);
   		
   		if (lastCountTime!=null && now.after(lastCountTime)){
   			//转发加速度
   			double durHours = (now.getTime() - lastCountTime.getTime())/1000.0/60/60;
   			double acceleration =  ((rtSpeedNow - lastRtSpeed)/durHours);
   			t.setRtAcceleration(acceleration);
   		}
		
   		if (t.getRtAcceleration()!=null && t.getRtAcceleration()!=0){
   			//log.finest("speed:" + rtSpeed + " lastSpeed:" + lastRtSpeed + " acceleration: " + t.getRtAcceleration());
   		}
   		
   		long expire = t.getCreatedAt().getTime()+this.userConfig.getMaxPostedHour() * 60 * 60 * 1000;
   		if (rtSpeed < this.userConfig.getMinRtSpeed()){
   			t.setExpireTime(new Date(expire));
   		}else{
   			t.setExpireTime(null);//never expire
   		}

    }	
    

    //重设转发数据
    private void resetCounts(Map<Long, Tweet> tweets, List<Count> counts) throws WeiboException{
    	Map<Long, Tweet> reseted = new HashMap<Long, Tweet>(counts.size());
    	Set<Long> remove = new HashSet<Long>();
    	for (Count count : counts){
    		Tweet t = tweets.get(count.getId());
    		if (t != null){
    			t.setRepostsCount(count.getReposts());
    			t.setCommentsCount(count.getComments());
    			
    			calcRtSpeed(t);
    			
    			if (t.getRepostSpeed() >= MIN_RT_SPEED){
    				reseted.put(t.getId(), t);
    			}else{
    				remove.add(t.getId());
    			}
    			
    		}
    	}
    	WeiboCache.putAllTweets(reseted, userConfig.getUserId()); //重新缓存
    	log.fine("reCached: " + reseted.size());
    	
    	WeiboCache.delTweets(remove, userConfig.getUserId()); //移除转发速度下降的
    	log.fine("delCached: " + remove.size());

    }
    
    //重设所有转发数据
    private List<Future<HTTPResponse>> preRecountTweets(Map<Long, Tweet> tweets) throws WeiboException{
    	Set<Long> ids = new HashSet<Long>(tweets.size());
    	for (Tweet t : tweets.values()){
			//已计数且低于最低转发速度的，计数缓存时间为发帖时距/5；高于最低转发速度的，计数缓存时间为发帖时距/10
			long minCountTime = 0;
			if (t.getRepostSpeed() < this.userConfig.getMinRtSpeed() ){
				minCountTime = (System.currentTimeMillis() - t.getCreatedAt().getTime())/5 ;
			}else{
				minCountTime = (System.currentTimeMillis() - t.getCreatedAt().getTime())/10 ;
			}
			if (minCountTime>30*60*1000){ //最长刷新间隔30分钟
				minCountTime = 30*60*1000;
			}
			if (t.getRtAcceleration()!=null  && t.getRtAcceleration().intValue()!=0 //转发加速度已计算
					&& t.getCountTime().getTime() + minCountTime > System.currentTimeMillis() //未到计数缓存超时时间
				){  
				continue; 
			}
			
    		ids.add(t.getId());
    	}
		log.fine("send recount: " + ids.size());
    	return weibo.preCounts(ids);

    }
        
    private void recountTweets(Map<Long, Tweet> tweets, List<Future<HTTPResponse>> respList) throws WeiboException{
    	List<Count> counts = weibo.getCounts(respList);
    	resetCounts(tweets, counts);
    	log.fine("recount: " + counts.size());
    }
    
    //加载缓存微博
    private Map<Long, Tweet> loadCachedTweets() throws WeiboException{
    	Map<Long, Tweet> cachedTweets = WeiboCache.getAllTweets(userConfig.getUserId());
    	
    	log.fine("load cached: " + cachedTweets.size()); 

    	return cachedTweets;
    }


	public  List<Future<HTTPResponse>> preLoadNewTweets(long sinceId) throws WeiboException{
		//同时搜索5页
		log.fine("load new from: " + sinceId);
		return weibo.preFriendsTimeline(0, 0, sinceId);
	}
	
    //加载新微博并缓存
	public  Map<Long, Tweet> loadNewTweets( List<Future<HTTPResponse>> tasks) throws WeiboException{
		Map<Long, Tweet> newTweets = new HashMap<Long, Tweet>();

		Tweet lastTweet = null;

		List<Status> statuses = weibo.getFriendsTimeline(tasks);

		for (Status status : statuses) {
			if (status.getCreatedAt() == null || status.getUser() == null
					|| status.getUser().getScreenName() == null)
				continue; // 被删除贴无创建时间

			Tweet t = new Tweet(status);

			if (lastTweet == null) {
				lastTweet = t;
			} else if (lastTweet.getId() < t.getId()) {
				lastTweet = t;
			}
			calcRtSpeed(t);

			
			// 较热门才缓存
			if (t.getRepostSpeed() >= MIN_RT_SPEED && t.getRepostsCount() >= MIN_RT_COUNT) {
				newTweets.put(t.getId(), t);
			}
			

			// 缓存最新微博作为再次抓取时的since_id
			if (t.getPrimaryTweet() != null
					&& t.getPrimaryTweet().getCreatedAt() != null
					&& t.getPrimaryTweet().getScreenName() != null) { // 转发的原文,且未被删除
				
				calcRtSpeed(t.getPrimaryTweet());
				
				// 较热门才缓存
				if (t.getPrimaryTweet().getRepostSpeed() >= MIN_RT_SPEED && t.getPrimaryTweet().getRepostsCount() >= MIN_RT_COUNT) {
					newTweets.put(t.getPrimaryTweet().getId(), t.getPrimaryTweet());
				}
				
				
			}
		}
		if (lastTweet != null) {
			newTweets.put(lastTweet.getId(), lastTweet);
		}

		WeiboCache.putAllTweets(newTweets, userConfig.getUserId()); // 缓存新微博

		log.fine("loaded new: " + newTweets.size());
		return newTweets;
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
		List<Future<HTTPResponse>> recountTasks = preRecountTweets(cachedTweets);
    			
		recountTweets(cachedTweets, recountTasks);
		Map<Long, Tweet> newTweets = loadNewTweets(newTasks);
		
		Map<Long, Tweet> all = new HashMap<Long, Tweet>(cachedTweets.size() + newTweets.size());
		all.putAll(cachedTweets);
		all.putAll(newTweets);
		
		log.fine("all: " + all.size());
		return all;
	}
	    

	// 搜索热门转发微博
	public Map<Long, Tweet> searchTopTweets(Map<Long, Tweet> all) {
		TreeMap<Long, Tweet> tops = new TreeMap<Long, Tweet>();
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
    
    //搜索热门转发微博
    public Map<Long, Tweet> searchTopTweets() throws WeiboException{
    	Map<Long, Tweet> all =  loadAllTweets();
    	return searchTopTweets(all);
    }    
    
    public  Collection<Tweet> loadTopTweets() {
    	return loadTopTweets("byTime");
    }
    
    //加载缓存的热门微博
    public Collection<Tweet> loadTopTweets(String orderType) {
    	Map<Long, Tweet> tweets = WeiboCache.getTopTweets();
    	//Map<Long, Tweet> tweets = dao.fetchTweets();
    	tweets = searchTopTweets(tweets);
    	if ("bySpeed".equals(orderType)){
    		TreeMap<Double, Tweet> tweets2 = new TreeMap<Double, Tweet>();
    		for (Tweet t : tweets.values()){
    			double speed = t.getRepostSpeed();
    			if (t.getRtAcceleration()!=null){
    				speed = speed + t.getRtAcceleration();
    			}
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
    

	public static String formatTime(Date date){
		Calendar today = Calendar.getInstance(Locale.SIMPLIFIED_CHINESE);
		today.setTimeInMillis(System.currentTimeMillis());
		today.set(Calendar.HOUR,0);
		today.set(Calendar.MINUTE, 0);
		today.set(Calendar.MINUTE, 0);
		String pattern = "yyyy-MM-dd kk:mm";
		if (date.after(today.getTime())){
			 pattern = "kk:mm";
		}
		SimpleDateFormat df = new SimpleDateFormat(pattern, Locale.SIMPLIFIED_CHINESE);
		return df.format(date);
	}
	
    public static void main(String[] args){
    	SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd kk:mm:ss", Locale.SIMPLIFIED_CHINESE);
    	System.out.println(df.format(new Date()));
    	System.out.println(formatTime(new Date()));
    }

}
