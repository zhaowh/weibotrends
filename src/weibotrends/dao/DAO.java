package weibotrends.dao;

import java.util.Collection;
import java.util.Map;

import weibotrends.Tweet;
import weibotrends.UserConfig;

public interface DAO {

	public abstract String toString();

	public abstract void storeTweets(Collection<Tweet> tweets);

	public abstract Map<Long, Tweet> fetchTweets();

	/* (non-Javadoc)
	 * @see weibotrends.DAO#storeUserConfig(weibotrends.UserConfig)
	 */
	public abstract void storeUserConfig(UserConfig userConfig);

	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchUserConfig(java.lang.String)
	 */
	public abstract UserConfig fetchUserConfig(String uid);

	/* (non-Javadoc)
	 * @see weibotrends.DAO#fetchUserConfigByToken(java.lang.String)
	 */
	public abstract UserConfig fetchUserConfigByToken(String accessToken);

}