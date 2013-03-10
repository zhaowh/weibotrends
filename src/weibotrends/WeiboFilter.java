package weibotrends;

import java.util.Set;
import java.util.logging.Logger;


public class WeiboFilter  {
	
	private static Logger log = Logger.getLogger(WeiboFilter.class.getName());
	
	private String[] excludedWords = new String[0];
	private String[] includedWords = new String[0];
	private Set<String> followedIds;
	private boolean isFollowedOnly;
	private boolean isFollowedFirst;
	private boolean isVerifiedOnly;
	
	public static String[] split(String s){ 
		String[] array = new String[0];
		if (s != null){
			s = s.trim();
			s = s.replace('，', ',');
			s = s.replaceAll("\r\n", ",");
			s = s.replace('\n', ',');
			
			if (s.length()>0){
				array = s.split(",");
				for (int i=0; i<array.length; i++){
					array[i] = array[i].trim();
				}
			}			
		}
		return array;
	}
	
	public WeiboFilter(String excludedWords, String includedWords, Set<String> followedIds, boolean isFollewedOnly, boolean isFollowedFirst, boolean isVerifiedOnly){
		this.excludedWords = split(excludedWords);
		this.includedWords = split(includedWords);
		this.followedIds = followedIds;
		this.isFollowedOnly = isFollewedOnly;
		this.isFollowedFirst = isFollowedFirst;
		this.isVerifiedOnly = isVerifiedOnly;
		log.fine("execludedWords: " + this.excludedWords.length);
		log.fine("execludedWords: " + this.excludedWords.length);

	}
	
	private boolean isIncluded(String text){
    	if (text == null) return false;
    	if (includedWords == null || includedWords.length==0) return true;

    	for (String s : includedWords){
    		if (s==null || s.length()<1) continue;
    		
    		if (text.contains(s)) {
    			log.finest("included: " + text + " contains " + s);
    			return true;
    		}
    	}
    	return false;
    }
    
    private boolean isExcluded(String text){
    	if (text == null) return false;
    	if (excludedWords == null || excludedWords.length==0) return false;

    	for (String s : excludedWords){
    		if (s==null || s.length()<1) continue;
    		
    		if (text.contains(s)) {
    			log.finest("filtered: " + text + " contains " + s);
    			return true;
    		}
    	}
    	return false;
    }
    
    private boolean isFollowedUser(String uid){
    	if (uid == null) return false;
    	if (this.followedIds == null || this.followedIds.size()==0) return false;
    	return (this.followedIds.contains(uid));
    }
    
    private boolean checkFollowedOnly(Tweet tweet){
    	if (!this.isFollowedOnly) return true;
    	if ( isFollowedUser(tweet.getUserId()+""))
    		return true;
    	if (tweet.getPrimaryTweet()!=null
    			&& isFollowedUser(tweet.getPrimaryTweet().getUserId()+""))
    		return true;
    	if (tweet.getRetweets()!=null){
    		for (Tweet t : tweet.getRetweets()){
    			if (isFollowedUser(t.getUserId()+"")) return true;
    		}
    	}
    	
    	return false;
    }
    
 
    private boolean checkExcluded(Tweet tweet){
    	if (	isExcluded(tweet.getScreenName()) ||
    			isExcluded(tweet.getText()) ||
    			isExcluded(tweet.getUserDescription()) ||
    			isExcluded(tweet.getVerifiedReason())
    			) return false;
    	
    	return true;
    }
    
    private boolean checkIncluded(Tweet tweet){
    	if (this.isFollowedFirst){ //优先用户原创微博不应用包含关键字
    		if (tweet.getPrimaryTweet()==null 
    				&& isFollowedUser(tweet.getUserId()+"")) return true;
    		if (tweet.getPrimaryTweet()!=null 
    				&& isFollowedUser(tweet.getPrimaryTweet().getUserId()+""))
    			return true;
    	}
    	if (isIncluded(tweet.getText())){
    		return true;
    	}
    	
    	return false;
    }
        
    private boolean checkVerfied(Tweet tweet){
    	if (!this.isVerifiedOnly) return true;
    	if (tweet.isVerified()) return true;
    	if (tweet.getPrimaryTweet()!=null 
    			&& tweet.getPrimaryTweet().isVerified()) 
    		return true;
    		
    	return false;
    }
    
    public Tweet filter(Tweet tweet){
    	if (tweet == null) return null;
    	if (!checkVerfied(tweet)) return null;
    	if (!checkFollowedOnly(tweet)) return null;
    	if (!checkIncluded(tweet)) return null;
    	if (!checkExcluded(tweet)) return null;
    	
    	return tweet;
    }
	  
}
