package weibotrends.dao;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;
import javax.jdo.Transaction;

import weibotrends.PMF;
import weibotrends.Tweet;
import weibotrends.UserConfig;


public class DAOJDOImpl implements DAO {
	/* (non-Javadoc)
	 * @see weibotrends.DAO#toString()
	 */
	@Override
	public String toString() {
		return "DAOJDOImpl []";
	}

	private static Logger log = Logger.getLogger(DAOJDOImpl.class.getName());

	/* (non-Javadoc)
	 * @see weibotrends.DAO#storeTweets(java.util.Collection)
	 */
	public  void storeTweets(Collection<Tweet> tweets){
	    PersistenceManager pm = PMF.get().getPersistenceManager();
	    Transaction tx = null;
	    try {
	    	for (Tweet t : tweets){
		    	//tx = pm.currentTransaction();
		        //tx.begin();
		        try{
		        	if (t.getPrimaryTweet()!=null){
		        		pm.makePersistent(t.getPrimaryTweet());
		        	}
		        	pm.makePersistent(t);
		        }catch(RuntimeException e){
		        	log.warning(t.toString());
		        	throw e;
		        }
		    	//tx.commit();
	    	}
	    } finally {
	    	if (tx!=null && tx.isActive()) {
	            tx.rollback();
	        }
	        pm.close();
	    }	
	    /*
	    try {
	    	pm.makePersistentAll(tweets);
	    } finally {
	        pm.close();
	    }
	    */	
	}
	
	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchTweets()
	 */
	public   Map<Long, Tweet>  fetchTweets(){
		Map<Long, Tweet> tweets = new HashMap<Long, Tweet> ();
		
	    PersistenceManager pm = PMF.get().getPersistenceManager();
    	Query query = pm.newQuery(Tweet.class);
    	query.setOrdering("id desc"); 
	    try {
	    	List<Tweet> list = (List<Tweet> )query.execute();
	    	for (Tweet t : list){
	    		tweets.put(t.getId(),t);
	    	}
	    } finally {
	    	query.closeAll();
	        pm.close();
	    }	
	    for (Tweet t : tweets.values()){
	    	if (t.getPrimaryTweetId() != null){
	    		Tweet p = tweets.get(t.getPrimaryTweetId());
	    		if (p != null){
	    			t.setPrimaryTweet(p);
	    			log.finest(t.toString());
	    		}
	    	}
	    }
	    return tweets;
	}
	
	/* (non-Javadoc)
	 * @see weibotrends.DAO#storeUserConfig(weibotrends.UserConfig)
	 */
	/* (non-Javadoc)
	 * @see weibotrends.DAO#storeUserConfig(weibotrends.UserConfig)
	 */
	public void storeUserConfig(UserConfig userConfig){

		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			pm.makePersistent(userConfig);
		} finally {
	        pm.close();
	    }	
	}
	
	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchUserConfig(java.lang.String)
	 */
	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchUserConfig(java.lang.String)
	 */
	public UserConfig fetchUserConfig(String uid){
		UserConfig userConfig = null;
		
	    PersistenceManager pm = PMF.get().getPersistenceManager();
    	Query query = pm.newQuery(UserConfig.class);
    	query.setFilter("userId == userIdParam");
    	query.declareParameters("String userIdParam");
	    try {
	    	List<UserConfig> list = (List<UserConfig> )query.execute(uid);
	    	if (list.size()>0){
	    		userConfig = list.get(0);
	    	}
	    } finally {
	    	query.closeAll();
	        pm.close();
	    }	
	    
	    return userConfig;
		
	}
	
	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchUserConfigByToken(java.lang.String)
	 */
	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchUserConfigByToken(java.lang.String)
	 */
	public UserConfig fetchUserConfigByToken(String accessToken){
		UserConfig userConfig = null;
		
	    PersistenceManager pm = PMF.get().getPersistenceManager();
    	Query query = pm.newQuery(UserConfig.class);
    	query.setFilter("accessToken == accessTokenParam");
    	query.declareParameters("String accessTokenParam");
	    try {
	    	List<UserConfig> list = (List<UserConfig> )query.execute(accessToken);
	    	if (list.size()>0){
	    		userConfig = list.get(0);
	    	}
	    } finally {
	    	query.closeAll();
	        pm.close();
	    }	
	    
	    return userConfig;
		
	}	
	
	public List<UserConfig> fetchValidUserConfigs(){

    	List<UserConfig> list2 = new ArrayList<UserConfig>();
    	
	    PersistenceManager pm = PMF.get().getPersistenceManager();
    	Query query = pm.newQuery(UserConfig.class);
    	try{
	    	List<UserConfig> list = (List<UserConfig> )query.execute();

	    	for (UserConfig c : list){
				if (c.getAccessToken()==null) continue;
				
				if (c.getLastRtTime()!=null){
					long interval = System.currentTimeMillis() - c.getLastRtTime().getTime();
					long aWeek = 7 * 24 *60 *60 *1000;
					if (interval > aWeek) continue; //一周以上未转发，授权已失效
				}
				list2.add(c);
	    	}
    	}finally{
    		query.closeAll();
    		pm.close();
    	}
    	return list2;
	}
	

}
