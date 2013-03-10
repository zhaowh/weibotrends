package weibotrends;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.logging.Logger;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Text;

@PersistenceCapable
public class UserConfig  implements java.io.Serializable {
	private static final long serialVersionUID = -2957940235844909461L;

	private static Logger log = Logger.getLogger(UserConfig.class.getName());
	
	@PrimaryKey
	@Persistent 
	private String userId;
	
	@Persistent
	private String name;
	
	@Persistent 
	private String accessToken;
	
	@Persistent 
	private int minRtCount = 200;
	
	@Persistent 
	private int minRtSpeed = 20;
	
	@Persistent 
	private int maxPostedHour = 2;
	
	@Persistent 
	private boolean verifiedOnly = false;
	
	@Persistent 
	private boolean followedOnly = false;
	
	@Persistent 
	private boolean followedFirst = true;
		
	@Persistent 
	private String repostTmpl = "";
	
	@Persistent 
	private String replyTmpl  = "";
	
	@Persistent(defaultFetchGroup = "true") 
	private Text excludedWords  = new Text("");
	
	@Persistent(defaultFetchGroup = "true") 
	private Text includedWords = new Text("");
	
	@Persistent 
	private int rtInterval = 30;
	
	@Persistent 
	private boolean disabled = true;
	
	@Persistent 
	private Date lastRtTime = new Date(System.currentTimeMillis());
	

	@Persistent 
	private TreeSet<Long> repostedIds = new TreeSet<Long>();
	
	@Persistent 
	private Set<String> followedIds = new HashSet<String>();
	
		
	public UserConfig(){

	}
	
	public UserConfig(String uid, String accessToken){
		this();
		this.userId = uid;
		this.accessToken = accessToken;
	}
	
	
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public String getUserId() {
		return userId;
	}
	public void setName(String name) {
		this.name = name;
	}

	public String getName() {
		return name;
	}

	public void setAccessToken(String accessToken) {
		this.accessToken = accessToken;
	}
	public String getAccessToken() {
		return accessToken;
	}
	public int getMinRtCount() {
		return minRtCount;
	}
	public void setMinRtCount(int minRtCount) {
		this.minRtCount = minRtCount;
	}
	public int getMinRtSpeed() {
		return minRtSpeed;
	}
	public void setMinRtSpeed(int minRtSpeed) {
		this.minRtSpeed = minRtSpeed;
	}
	public int getMaxPostedHour() {
		return maxPostedHour;
	}
	public void setMaxPostedHour(int maxPostHour) {
		this.maxPostedHour = maxPostHour;
	}
	public boolean isVerifiedOnly() {
		return verifiedOnly;
	}
	public void setVerifiedOnly(boolean verifiedOnly) {
		this.verifiedOnly = verifiedOnly;
	}
	public boolean isFollowedOnly() {
		return followedOnly;
	}
	public void setFollowedOnly(boolean followedOnly) {
		this.followedOnly = followedOnly;
	}
	public boolean isFollowedFirst() {
		return followedFirst;
	}
	public void setFollowedFirst(boolean followedFirst) {
		this.followedFirst = followedFirst;
	}	
	public String getRepostTmpl() {
		return repostTmpl;
	}
	public void setRepostTmpl(String repostTmpl) {
		this.repostTmpl = repostTmpl;
	}
	public String getReplyTmpl() {
		return replyTmpl;
	}
	public void setReplyTmpl(String replyTmpl) {
		this.replyTmpl = replyTmpl;
	}
	public String getExcludedWords() {
		return excludedWords.getValue();
	}
	public void setExcludedWords(String excludedWords) {
		this.excludedWords = new Text(excludedWords);
	}
	public void setIncludedWords(String includedWords) {
		this.includedWords = new Text(includedWords);
	}

	public String getIncludedWords() {
		return includedWords.getValue();
	}

	public int getRtInterval() {
		return rtInterval;
	}
	public void setRtInterval(int rtInterval) {
		this.rtInterval = rtInterval;
	}
	public boolean isDisabled() {
		return disabled;
	}
	public void setDisabled(boolean disabled) {
		this.disabled = disabled;
	}
	public Date getLastRtTime() {
		return lastRtTime;
	}
	public void setLastRtTime(Date lastRtTime) {
		this.lastRtTime = lastRtTime;
	}

	public void addRepostedId(Long id) {
		if (this.repostedIds.size()>100){//最多保存100个
			this.repostedIds.pollFirst();
		}
		this.repostedIds.add(id);
		log.finest(id+" added. size="+this.repostedIds.size());
	}

	public Set<Long> getRepostedIds() {
		//log.finest("size="+this.repostedIds.size());
		return this.repostedIds;
	}

	public long getLastRepostedId(){
		long id = 0;
		if (this.repostedIds!=null && !this.repostedIds.isEmpty()){
			id = this.repostedIds.last();
		}
		if (id<0) id=0; //?
		log.fine("since_id="+id);
		return id;

	}

	public void setFollowedIds(String[] followedIds) {
		this.followedIds = new HashSet<String>();
		for (String id : followedIds){
			this.followedIds.add(id);
		}
	}

	public Set<String> getFollowedIds() {
		return followedIds;
	}

	
}
