package weibotrends;


import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.Stack;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.Future;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import weibo4j.http.AccessToken;
import weibo4j.model.Status;
import weibo4j.model.User;
import weibo4j.model.WeiboException;
import weibotrends.dao.DAO;
import weibotrends.dao.DAOFactory;
import weibotrends.weibo4g.Weibo;
import weibotrends.weibo4g.model.Count;

import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;
import com.google.appengine.api.taskqueue.TaskOptions.Method;
import com.google.appengine.api.urlfetch.HTTPResponse;

public class WeiboTops  implements java.io.Serializable {
	
	private static final long serialVersionUID = -928816334879502069L;
	
	private static Logger log = Logger.getLogger(WeiboTops.class.getName());
	
	private static final int MIN_RT_COUNT = UserConfig.MIN_RT_COUNT;
	private static final int MIN_RT_SPEED = UserConfig.MIN_RT_SPEED;
	private static final int MAX_CACHE_HOUR = 2;
	
	private Weibo weibo;
	private User user;
	private UserConfig userConfig; 
	private WeiboFilter filter;


	public WeiboTops(String authCode)  throws WeiboException{
		this.weibo = new Weibo();
		AccessToken accessToken = weibo.getAccessTokenByCode(authCode);
		weibo.setToken(accessToken.getAccessToken());
		initUserConfig(accessToken.getUid(), accessToken.getAccessToken());
	}

	public WeiboTops(String uid, String accessToken){
		initUserConfig(uid, accessToken);
		weibo = new Weibo();
		weibo.setToken(getUserConfig().getAccessToken());
	}
	
	public WeiboTops(long uid){
		initUserConfig(String.valueOf(uid), null);
		weibo = new Weibo();
		weibo.setToken(getUserConfig().getAccessToken());
	}
	

	private void initUserConfig(String uid, String accessToken){
		DAO dao = DAOFactory.getDAO();
		this.userConfig = dao.fetchUserConfig(uid);
		if (this.userConfig == null ){
			this.userConfig = new UserConfig(uid, accessToken);
			dao.storeUserConfig(this.userConfig);
		}else if (accessToken!=null && !accessToken.equals(this.userConfig.getAccessToken())){
			this.userConfig.setAccessToken(accessToken);
			dao.storeUserConfig(this.userConfig);
		}
		this.filter = new WeiboFilter(this.userConfig.getExcludedWords(), this.userConfig.getIncludedWords(), this.userConfig.getFollowedIds(), this.userConfig.isFollowedOnly(), this.userConfig.isFollowedFirst(), this.userConfig.isVerifiedOnly());
		log.finest("name: "+this.userConfig.getName());
	}
	
	private void reloadUserConfig(){
		initUserConfig(this.userConfig.getUserId(), null);
	}
		

	public void saveUserConfig(UserConfig userConfig){
		this.userConfig = userConfig;
		DAO dao = DAOFactory.getDAO();
		dao.storeUserConfig(userConfig);
	}
	
	public UserConfig getUserConfig(){
		return this.userConfig;
	}

	public User getUser() throws WeiboException{
		if (this.user == null){
			this.user = weibo.showUserById(this.userConfig.getUserId());
			this.userConfig.setName(this.user.getScreenName());
			this.userConfig.setProfileImageUrl(this.user.getProfileImageUrl());
			this.userConfig.setVerified(this.user.isVerified());
			this.userConfig.setGender( this.user.getGender());
			this.userConfig.setLocation(this.user.getLocation());
			this.userConfig.setDescription( this.user.getDescription());
			this.userConfig.setLastRtTime(new Date(System.currentTimeMillis()));

			saveUserConfig(this.userConfig);
		}
		return this.user ;
	}
	
	public static List<UserConfig> getValidUserConfigs(){
		DAO dao = DAOFactory.getDAO();
		List<UserConfig> list = dao.fetchValidUserConfigs();
		return list;
	}

	
	//计算转发速度
	private static double calcRtSpeed(int reposts, int comments, Date createdAt,  int follows){
		double durHours = (System.currentTimeMillis() - createdAt.getTime())/1000.0/60/60;
		if (durHours == 0) durHours=0.1;
		if (follows == 0) follows=10;
		
		if (reposts > comments * 4){ //只转不评有水军号炒作嫌疑，使用评论数进行修正
			reposts = comments * 4;
		}

		int actives = reposts + comments/4; //活跃度记数。评论数如使用评论人数更准确，此处简单修正		
		
		double rtSpeed = (actives * Math.pow(10000.0/follows, 0.618)  * Math.exp(-0.134 * (durHours-1)) );
		//double rtSpeed = (actives * Math.pow(10000.0/follows, 0.618)  / durHours);
		return rtSpeed;
		 
	}

	//计算并设置转发速度
    private  void resetRtSpeed(Tweet t){
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
   		
   		long expire = t.getCreatedAt().getTime() + MAX_CACHE_HOUR * 60 * 60 * 1000;
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
    	
		long maxRefreshInterval = MAX_CACHE_HOUR*60*60*1000;
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
    
    private static boolean isCountExpired(Tweet t, long countInterval){
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
			long maxRefreshInterval = MAX_CACHE_HOUR * 60*60*1000 /4;
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
    	//同时加载热门微博（包含由其他用户搜索提供）
    	Map<Long, Tweet> topTweets = WeiboCache.getTopTweets();
    	cachedTweets.putAll(topTweets);
    	log.fine("load cached: " + cachedTweets.size()); 

    	return cachedTweets;
    }


	private  List<Future<HTTPResponse>> preLoadNewTweets(long sinceId) throws WeiboException{
		//同时搜索5页
		log.fine("load new from: " + sinceId);
		return weibo.preTimeline(sinceId);
	}
	
    //加载新微博并缓存
	private  Map<Long, Tweet> loadNewTweets( List<Future<HTTPResponse>> tasks) throws WeiboException{
		Map<Long, Tweet> newTweets = new HashMap<Long, Tweet>();

		Tweet lastTweet = null;

		List<Status> statuses = weibo.getTimeline(tasks);

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
			if ((t.getRepostSpeed() >= MIN_RT_SPEED || t.getRepostSpeed() >= this.userConfig.getMinRtSpeed()) 
					&& ( t.getRepostsCount() >= MIN_RT_COUNT) || t.getRepostsCount() >= this.userConfig.getMinRtCount()) {
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
	
	private  List<Future<HTTPResponse>>  preRepostsByMe() throws WeiboException{
		long sinceId = this.userConfig.getLastRepostedId();
		return weibo.preRepostsByMe(sinceId, this.userConfig.getUserId());
	}
	
    //刷新已转发微博ID
	private  Set<Long> loadRepostsByMe( List<Future<HTTPResponse>>  taskList) throws WeiboException{
		reloadUserConfig();
		for (Future<HTTPResponse> task : taskList){
			List<Status> list = weibo.getRepostsByMe(task);
			if (list!=null && !list.isEmpty()){
				for (Status s : list){
					this.userConfig.addRepostedId(Long.parseLong(s.getId()));
					if (s.getRetweetedStatus()!=null){
						this.userConfig.addRepostedId(Long.parseLong(s.getRetweetedStatus().getId()));
					}
				}
				saveUserConfig(this.userConfig);
				log.fine("loaded reposted: " + list.size() + " all:" + this.userConfig.getRepostedIds().size());
			}
		}
		log.fine("all:" + this.userConfig.getRepostedIds().size());
		return this.userConfig.getRepostedIds();
	}
	
	private Set<String> loadFriendsIds( Future<HTTPResponse> task) throws WeiboException{
		String[] fids = weibo.getFriendsIds(task);
		if (fids!=null && fids.length>0){
			this.userConfig.setFollowedIds(fids);
			saveUserConfig(this.userConfig);
			log.fine("friends: " + this.userConfig.getFollowedIds().size());
		}
		return this.userConfig.getFollowedIds();
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
		
		Map<Long, Tweet> newTweets = Collections.emptyMap();
		if (this.userConfig.getAccessToken()!=null){
			//并发
			List<Future<HTTPResponse>> newTasks = preLoadNewTweets(sinceId); 
			List<Future<HTTPResponse>> myRepostsTasks = preRepostsByMe();
			List<Future<HTTPResponse>> recountTasks = preRecountTweets(cachedTweets);
	
			Future<HTTPResponse> friendsTask = weibo.preFriendsIdsByUid(this.userConfig.getUserId());
			//更新关注ID
			loadFriendsIds(friendsTask);
			
			//刷新缓存微博计数及速度
			recountTweets(cachedTweets, recountTasks);
			//加载已转发微博ID
			loadRepostsByMe(myRepostsTasks);
			//加载新微博
			newTweets = loadNewTweets(newTasks);
		}
		Map<Long, Tweet> all = new HashMap<Long, Tweet>(cachedTweets.size() + newTweets.size());
		all.putAll(cachedTweets);
		all.putAll(newTweets);

		log.fine("all: " + all.size());
		return all;
	}
	    

	// 搜索热门转发微博
	private Map<Long, Tweet> searchTopTweets(Map<Long, Tweet> all) {
		TreeMap<Long, Tweet> tops = new TreeMap<Long, Tweet>();
    	reloadUserConfig();//重新加载用户最新配置信息更新已转发贴
    	

		for (Tweet t : all.values()) {
			if (t.getRepostsCount() < this.userConfig.getMinRtCount())
				continue;
			if (t.getRepostSpeed() < this.userConfig.getMinRtSpeed())
				continue;
			
			//内容过滤
			t = filter.filter(t);
			
			//转发速度达要求
			if (t!=null && t.getRepostSpeed() >= this.userConfig.getMinRtSpeed()){
				tops.put(t.getId(), t);
			}

			if (tops.size()>100){//最多保存100个
				tops.pollFirstEntry();
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
    
    
    /**
     * 在原有顺序基础上再按照时间倒序处理
     * @param tweets
     * @return
     */
    private  Collection<Tweet> resortTweetsByTime(Collection<Tweet> tweets) {
    	if (tweets == null || tweets.isEmpty()) return tweets;
    	
    	Tweet first = tweets.iterator().next();
    	Collection<Tweet> q1 = new ArrayList<Tweet>(tweets.size());
    	Collection<Tweet> q2 = new ArrayList<Tweet>(tweets.size());
    	
		for (Tweet t : tweets) {
			if (t == first)
				continue;

			if (t.getCreatedAt().after(first.getCreatedAt())
				&& ((t.getRtAcceleration() == null || t.getRtAcceleration() > 0)
					)
				) {
				q1.add(t);
			} else {
				q2.add(t);
			}
		}
    	
    	if (q1.size()>2){
    		q1 = resortTweetsByTime(q1);
    	}
    	if (q2.size()>2){
    		q2 = resortTweetsByTime(q2);
    	}    	
    	
    	List<Tweet> ts = new ArrayList<Tweet>(tweets.size());
    	ts.add(first);
    	ts.addAll(q1);
    	ts.addAll(q2);
    	return ts;
    }

    //排序
    private  Collection<Tweet> sortTweets(Map<Long, Tweet> tweets, String orderType) {
    	
    	if ("bySpeed".equals(orderType)){
			TreeSet<Tweet> tweets2 = new TreeSet<Tweet>(
					new Comparator<Tweet>() {
						public int compare(Tweet t1, Tweet t2) {
							return Double.compare(t2.getRepostSpeed(),t1.getRepostSpeed());
						}
					});
			tweets2.addAll(tweets.values());
			return resortTweetsByTime(tweets2);
    	}else if ("byAcc".equals(orderType)){
			TreeSet<Tweet> tweets2 = new TreeSet<Tweet>(
					new Comparator<Tweet>() {
						public int compare(Tweet t1, Tweet t2) {
							double a2 = t2.getRtAcceleration()==null?0:t2.getRtAcceleration();
							double a1 = t1.getRtAcceleration()==null?0:t1.getRtAcceleration();
							return Double.compare(a2, a1);
						}
					});
			tweets2.addAll(tweets.values());
			return resortTweetsByTime(tweets2);
    	}else if ("byRt".equals(orderType)){
			TreeSet<Tweet> tweets2 = new TreeSet<Tweet>(
					new Comparator<Tweet>() {
						public int compare(Tweet t1, Tweet t2) {
							double a2 = t2.getRepostsCount();
							double a1 = t1.getRepostsCount();
							return Double.compare(a2, a1);
						}
					});
			tweets2.addAll(tweets.values());
			return resortTweetsByTime(tweets2);
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
		
		//log.finest(isRetweeted + ": " + id +" in " + ids.size());

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
    	
    	Tweet lastRTed = null;
    	for (Tweet t : tweets){
    		
    		//已转发则跳过
    		if (isRetweeted(t)){
    			//记录最新转发
    			if (lastRTed == null || t.getCreatedAt().after(lastRTed.getCreatedAt())){
    				lastRTed = t;
    			}
    			continue;
    		}
    		
    		//早于最新转发微博则跳过
    		if (lastRTed !=null && t.getCreatedAt().before(lastRTed.getCreatedAt())){
    			continue;
    		}
    		
    		//加速低于0则跳过
    		if (t.getRtAcceleration()!=null && t.getRtAcceleration()<=0 ) {
    			continue;
    		}
    		
    		//转发微博
			log.fine(" reposting: " + t);
			
			//是否根据关键字查找到的微博
			boolean isIncluded = filter.isIncluded(t.getText());

			String rtStr = this.userConfig.getRepostTmpl();
			String repost = null;
			
			if (isIncluded && rtStr!=null && rtStr.length()>0 ){
				repost = rtStr;
				
				//复制#话题#
				int i = t.getText().indexOf('#');
				int j = t.getText().indexOf('#', i+1);
				if (i>=0 && j>i){
					repost = t.getText().substring(i, j+1) + " " + repost;
				}
			}else{
				// Tweet rt = t.getRetweet();
				Tweet rt = t.getRetweetByFriend(this.userConfig.getFollowedIds());
				if (rt != null) {
					repost = "//@" + rt.getScreenName() + ":" + rt.getText();
				}else if(t.getPrimaryTweet()!=null){
					repost = "//@" + t.getScreenName() + ":" + t.getText();
				}
			}
			if (repost != null && repost.length() > 140) {
				repost = repost.substring(0, 140);
			}

			Status s = null;
			try{
				s = this.weibo.repost(String.valueOf(t.getId()), repost, 0);
			}catch(Exception e){
				log.warning("repost error: "+e);
			}finally{
				this.userConfig.addRepostedId(t.getId());// 更新已转发列表
				if (t.getPrimaryTweet() != null) {
					this.userConfig.addRepostedId(t.getPrimaryTweet().getId());
				}
				this.userConfig.setLastRtTime(new Date(System.currentTimeMillis()));
				saveUserConfig(this.userConfig);
				
				if (isIncluded && this.userConfig.isAutoFollow()){
					this.weibo.createFriendshipsByName(t.getScreenName());
				}
			}
			if (s != null && s.getId() != null) {
				return true;
			}else{
				return false;
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
			// 按速度倒序优先转发最新微博
			reposted = repostFirst(sortTweets(tops, "bySpeed"));
		}
		
		if (!reposted) {
			// 按加速度倒序优先转发最新微博
			reposted = repostFirst(sortTweets(tops, "byAcc"));
		}
		
		
		if (!reposted) {
			// 按转发数倒序优先转发最新微博
			reposted = repostFirst(sortTweets(tops, "byRt"));
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
    
    
	private static void createRefreshTask(Queue queue, UserConfig c) {
		
			TaskOptions opts = TaskOptions.Builder.withUrl("/task");
			opts.method(Method.POST);
			opts.param("m", "refresh_tweets");
			opts.param("uid", c.getUserId());
			opts.param("token", c.getAccessToken());
			queue.add(opts);
			log.fine(opts.getUrl());
	}
	        
    
	public static void createAllRefreshTask() {
		
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

			createRefreshTask(queue, c);
		}
	}
	
	public void createRefreshTask() {
		Queue queue = QueueFactory.getDefaultQueue();
		createRefreshTask(queue, this.userConfig);
	}
	    

    public static void main(String[] args){
    	SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd kk:mm:ss", Locale.SIMPLIFIED_CHINESE);
    	System.out.println(df.format(new Date()));
    	System.out.println(WeiboUtils.formatTime(new Date()));
    }

}
