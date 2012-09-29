package weibotrends;

import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

import com.google.appengine.api.memcache.Expiration;
import com.google.appengine.api.memcache.MemcacheService;
import com.google.appengine.api.memcache.MemcacheServiceFactory;



public class WeiboCache {

	private static Logger log = Logger.getLogger(WeiboCache.class.getName());
	
	private static MemcacheService cache = MemcacheServiceFactory.getMemcacheService();

	public static void put(Object key, Object value){
		cache.put(key, value);
	}
	
	public static void put(Object key, Object value, Date expirationTime){
		if (expirationTime == null){
			cache.put(key, value);
		}else{
			cache.put(key, value, Expiration.onDate(expirationTime));
		}
	}
		
	public static Object get(Object key){
		return cache.get(key);
	}	
	
	public static boolean contains(Object key){
		return cache.contains(key);
	}
	
	public static boolean delete(Object key){
		return cache.delete(key);
	}
	
	public static <T> Set<T> deleteAll(Collection<T> keys){
		return cache.deleteAll(keys);
	}
		
	public static void putAll(Map<?, ?> map){
		cache.putAll(map);
	}
	
	public static <T> Map<T,?> getAll(Collection<T> keys){
		return cache.getAll(keys);
	}
	
	
	private static String getTweetKey(long id){
		return Tweet.class.getName()+"#"+id;
	}
	
	/*
	private static String getTweetIdsKey(){
		return getTweetIdsKey(null);
	}
	*/
	
	private static String getTweetIdsKey(String type){
		String key = Tweet.class.getName()+"$ids";
		if (type != null){
			key = key + "."+type;
		}
		return key;
	}
	
	public static void putTweet(Tweet t){
		put(getTweetKey(t.getId()), t, t.getExpireTime());
	}
	
	public static Tweet getTweet(long id){
		return (Tweet)get(getTweetKey(id));
	}
	
	
	public static Set<String> getTweetKeys(String type){
		Object v = get(getTweetIdsKey(type));
		Object[]ids = (Object[])v;
		
		Set<String> set = new HashSet<String>();

		if(ids!=null) for (Object id : ids){
			set.add((String)id);
		}
		return set;	
	}
	
	/*
	public static Set<String> getTweetKeys(){
		return getTweetKeys(null);
	}
	*/
	
	public static void putTweetKeys(Set<String> keys,String type){
		Set<String> allKeys = getTweetKeys(type);
		allKeys.addAll(keys);	
		put(getTweetIdsKey(type), allKeys.toArray());
	}
	
	/*
	public static void putTweetKeys(Set<String> keys){
		putTweetKeys(keys, null);
	}
	*/
	
	public static void delTweetKeys(Set<String> keys,String type){
		Set<String> allKeys = getTweetKeys(type);
		allKeys.removeAll(keys);	
		put(getTweetIdsKey(type), allKeys.toArray());
	}
	public static void delTweetKeys(Set<String> keys){
		delTweetKeys(keys, null);
	}

	
	public static boolean delTweet(long id){
		String key = getTweetKey(id);
		Set<String> keys = new HashSet<String>(1);
		keys.add(key);
		delTweetKeys(keys);
		return delete(getTweetKey(id));
	}
	
	public static void putAllTweets(Map<Long,Tweet> tweets, String type){
		if (tweets == null || tweets.size() == 0) return;
		
		Map<String, Tweet> map = new HashMap<String, Tweet> (tweets.size());
		for (Tweet t : tweets.values()){ 
			map.put(getTweetKey(t.getId()), t);
		}
		putAll(map); //TODO 逐条expire未使用
		putTweetKeys(map.keySet(), type);
		log.finest(type + " put: "+tweets.size());
	}

	public static void delTweets(Set<Long> ids, String type){
		if (ids == null || ids.size() == 0) return;
		
		Set<String> keys = new HashSet<String>(ids.size());
		for (Long id : ids){ 
			keys.add(getTweetKey(id));
		}
		delTweetKeys(keys, type);
		if (!"tops".equals(type)){
			delTweetKeys(keys, "top"); //同时从tops中删除
		}
		deleteAll(keys);
	}
	
	/*
	public static void putAllTweets(Map<Long,Tweet> tweets){
		putAllTweets(tweets, null);
	}
	*/
	


	public static Map<Long,Tweet> getAllTweets(String type){
		Map<Long,Tweet> tweets = new HashMap<Long,Tweet> ();
		Set<String> keys = getTweetKeys(type);
		log.finest(type + " cached keys: "+keys.size());
		

		if (keys != null){
			Map<String, Tweet> map = (Map<String, Tweet>)getAll(keys);
			if (map != null){
				for (Tweet t : map.values()){
					tweets.put(t.getId(), t);
				}
				keys.removeAll(map.keySet());
				delTweetKeys(keys); // clear empty tweet ids
			}
		}
		return tweets;
	}
	
	/*
	public static Map<Long,Tweet> getAllTweets(){
		return getAllTweets(null);
	}
	*/
	
	public static void putTopTweets(Map<Long,Tweet> tweets){
		putAllTweets(tweets, "tops");
	}
			
	public static Map<Long,Tweet> getTopTweets(){
		return getAllTweets("tops");
	}	
}
