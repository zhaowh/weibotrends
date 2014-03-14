package weixinmp.dao;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;

import weibotrends.PMF;
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
	 * @see weibotrends.DAO#storeUserConfig(weibotrends.UserConfig)
	 */
	/* (non-Javadoc)
	 * @see weibotrends.DAO#storeUserConfig(weibotrends.UserConfig)
	 */
	public void storeWeixinUser(WeixinUser user){

		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			pm.makePersistent(user);
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
	public WeixinUser fetchWeixinUser(String userName){
		WeixinUser user = null;
		
	    PersistenceManager pm = PMF.get().getPersistenceManager();
    	Query query = pm.newQuery(WeixinUser.class);
    	query.setFilter("userName == userNameParam");
    	query.declareParameters("String userNameParam");
	    try {
	    	List<WeixinUser> list = (List<WeixinUser> )query.execute(userName);
	    	if (list.size()>0){
	    		user = list.get(0);
	    	}
	    } finally {
	    	query.closeAll();
	        pm.close();
	    }	
	    
	    return user;
		
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
