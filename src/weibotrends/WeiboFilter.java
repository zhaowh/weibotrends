package weibotrends;

import java.util.logging.Logger;


public class WeiboFilter  {
	
	private static Logger log = Logger.getLogger(WeiboFilter.class.getName());
	
	private String[] excludedWords = new String[0];
	
	public WeiboFilter(String excludedWords){
		if (excludedWords == null) return;
		excludedWords = excludedWords.trim();
		excludedWords = excludedWords.replace('，', ',');
		excludedWords = excludedWords.replaceAll("\r\n", ",");
		excludedWords = excludedWords.replace('\n', ',');
		
		if (excludedWords.length()>0){
			this.excludedWords = excludedWords.split(",");
			for (int i=0; i<this.excludedWords.length; i++){
				this.excludedWords[i] = this.excludedWords[i].trim();
			}
		}
		log.fine("execludedWords: " + this.excludedWords.length);
	}
	
    private boolean isExcluded(String text){
    	if (text == null) return false;
    	for (String s : excludedWords){
    		if (s==null || s.length()<1) continue;
    		
    		if (text.contains(s)) {
    			log.finest("filtered: " + text + " contains " + s);
    			return true;
    		}
    	}
    	return false;
    }
    
    public Tweet filter(Tweet tweet){
    	if (tweet == null ||
    			isExcluded(tweet.getScreenName()) ||
    			isExcluded(tweet.getText()) ||
    			isExcluded(tweet.getUserDescription()) ||
    			isExcluded(tweet.getVerifiedReason())
    			) return null;
    	
    	return tweet;
    }
	  
}
