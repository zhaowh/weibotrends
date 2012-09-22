package weibotrends.dao;

import java.util.Collection;
import java.util.List;

import weibotrends.Tweet;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.Query;

public class DAOObjectify {
	static{
		ObjectifyService.register(Tweet.class);
	}
	
	
	public static void storeTweets(Collection<Tweet> tweets){
		Objectify ofy = ObjectifyService.begin();
		ofy.put(tweets);
	}
	
	public  static List<Tweet>  fetchTweets(){
	    Objectify ofy = ObjectifyService.begin();
	    Query<Tweet> query = ofy.query(Tweet.class);	
	    query.order("-id");
	    query.limit(50);
	    List<Tweet> tweets = query.list();
	    return tweets;
	}
	
}
