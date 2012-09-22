package weibotrends;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.jdo.annotations.NotPersistent;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import weibo4j.model.Source;
import weibo4j.model.Status;
import weibo4j.model.User;

import com.google.appengine.api.datastore.KeyFactory;


@PersistenceCapable
public class Tweet  implements java.io.Serializable {

	private static final long serialVersionUID = -1319890177244505517L;
	
	

    //微博数据
    @PrimaryKey
    @Persistent 
    private Long id;                                     //status id
	
    @Persistent 
    private String mid;                                  //微博MID
	
    @Persistent	
    private Date createdAt;                              //status创建时间
	
    @Persistent	
    private String text;                                 //微博内容
	
    @Persistent	
    private String sourceName;                           //微博来源
	
    @Persistent	
    private String sourceUrl;                            //微博来源URL
	
    @Persistent	
    private boolean favorited;                           //是否已收藏
	
    @Persistent	
    private boolean truncated;
	
    @Persistent	
    private long inReplyToStatusId;                      //回复ID
	
    @Persistent	
    private long inReplyToUserId;                        //回复人ID
	
    @Persistent	
    private String inReplyToScreenName;                  //回复人昵称
	
    @Persistent	
    private String thumbnailPic;                         //微博内容中的图片的缩略地址
	
    @Persistent	
    private String bmiddlePic;                           //中型图片
	
    @Persistent	
    private String originalPic;                          //原始图片
	
    @Persistent	
    private int repostsCount;                            //转发数
	
    @Persistent	
    private int commentsCount;                           //评论数

    
    
	//用户数据
	@Persistent	
	private long userId;			//用户UID
	
	@Persistent	
	private String screenName;		//微博昵称
	
	@Persistent	
	private String profileImageUrl;	//自定义图像
	
	@Persistent	
	private int followersCount;		//粉丝数
	
	@Persistent	
	private boolean verified;		//加V标示，是否微博认证用户
	
	@Persistent	
	private String verifiedReason;	//认证原因
	
	@Persistent	
	private String userDescription;	//个人描述

	
	
	//计数数据 zhaowh 20120609
	@Persistent	
	private Double repostSpeed = 0.0; 		//转发速度
	
	@Persistent	
	private Double rtAcceleration ;		//转发加速度
	
	@Persistent	
	private Date countTime; 			//转发数更新时间
	
	
	@Persistent	
	private Date lastCountTime; 			//上次转发数更新时间
		
    @Persistent	
    private int lastRepostsCount;             //上次更新时转发数
	
    @Persistent	
    private int lastCommentsCount;            //上次更新时评论数
	
	@Persistent	
	private Date expireTime;			//过期时间
	
	@Persistent	
	private Long primaryTweetId;		//转发的原始tweet的id
	
	private boolean isRetweeted;		//是否以被当前用户转发
	
	
	@NotPersistent
	private Tweet primaryTweet;			//转发的原始tweet
	
	@NotPersistent
    private Set<Tweet> retweets = new HashSet<Tweet> ();
	
	
	public Tweet(){
		
	}
	
	public  Tweet(Status status) {
		if (status == null) return;
		
		User user = status.getUser();
		if (user!=null){
			this.userId = user.getId()==null?0:Long.parseLong(user.getId());
			this.screenName = user.getScreenName();
			this.profileImageUrl = user.getProfileImageUrl();
			this.followersCount = user.getFollowersCount();
			this.verified = user.isVerified();
			this.verifiedReason = user.getVerifiedReason();
			this.userDescription = user.getDescription();
		}
		
		this.createdAt = status.getCreatedAt();
		this.setId(status.getId()==null?null:Long.parseLong(status.getId()));
		this.mid = status.getMid();
		this.text = status.getText();
		Source source = status.getSource();
		if (source != null){
			this.sourceName = source.getName();
			this.setSourceUrl(source.getUrl());
		}
		this.favorited = status.isFavorited();
		this.truncated = status.isTruncated();
		this.inReplyToStatusId = status.getInReplyToStatusId();
		this.inReplyToUserId = status.getInReplyToUserId();
		this.inReplyToScreenName = status.getInReplyToScreenName();
		this.thumbnailPic = status.getThumbnailPic();
		this.bmiddlePic = status.getBmiddlePic();
		this.originalPic = status.getOriginalPic();
		this.repostsCount = status.getRepostsCount();
		this.commentsCount = status.getCommentsCount();
		
		
		
		if (status.getRetweetedStatus() != null){
			this.setPrimaryTweet(new Tweet(status.getRetweetedStatus()));

		}
	}
	
	public void setPrimaryTweet(Tweet primaryTweet) {
		if (primaryTweet == null) return;
		
		this.primaryTweetId = primaryTweet.getId();
		this.primaryTweet = primaryTweet;
		this.primaryTweet.addRetweet(this);
	}


	public Tweet getPrimaryTweet() {
		return this.primaryTweet;
	}

	public Long getPrimaryTweetId() {
		return this.primaryTweetId;
	}


	public void addRetweet(Tweet retweet) {
		this.retweets.add(retweet);
	}


	public void setId(Long id) {
		this.id = id;
	}

	
	
	public long getUserId() {
		return userId;
	}


	public void setUserId(long userId) {
		this.userId = userId;
	}


	public String getScreenName() {
		return screenName;
	}


	public void setScreenName(String screenName) {
		this.screenName = screenName;
	}


	public String getProfileImageUrl() {
		return profileImageUrl;
	}


	public void setProfileImageUrl(String profileImageUrl) {
		this.profileImageUrl = profileImageUrl;
	}


	public int getFollowersCount() {
		return followersCount;
	}


	public void setFollowersCount(int followersCount) {
		this.followersCount = followersCount;
	}


	public boolean isVerified() {
		return verified;
	}


	public void setVerified(boolean verified) {
		this.verified = verified;
	}


	public String getVerifiedReason() {
		return verifiedReason;
	}


	public void setVerifiedReason(String verifiedReason) {
		this.verifiedReason = verifiedReason;
	}


	public String getUserDescription() {
		return userDescription;
	}


	public void setUserDescription(String userDescription) {
		this.userDescription = userDescription;
	}


	public Date getCreatedAt() {
		return createdAt;
	}


	public void setCreatedAt(Date createdAt) {
		this.createdAt = createdAt;
	}


	public Long getId() {
		return id;
	}




	public String getMid() {
		return mid;
	}


	public void setMid(String mid) {
		this.mid = mid;
	}


	public String getText() {
		return text;
	}


	public void setText(String text) {
		this.text = text;
	}


	public String getSourceName() {
		return sourceName;
	}


	public void setSourceName(String sourceName) {
		this.sourceName = sourceName;
	}


	public void setSourceUrl(String sourceUrl) {
		this.sourceUrl = sourceUrl;
	}

	public String getSourceUrl() {
		return sourceUrl;
	}

	public boolean isFavorited() {
		return favorited;
	}


	public void setFavorited(boolean favorited) {
		this.favorited = favorited;
	}


	public boolean isTruncated() {
		return truncated;
	}


	public void setTruncated(boolean truncated) {
		this.truncated = truncated;
	}


	public long getInReplyToStatusId() {
		return inReplyToStatusId;
	}


	public void setInReplyToStatusId(long inReplyToStatusId) {
		this.inReplyToStatusId = inReplyToStatusId;
	}


	public long getInReplyToUserId() {
		return inReplyToUserId;
	}


	public void setInReplyToUserId(long inReplyToUserId) {
		this.inReplyToUserId = inReplyToUserId;
	}


	public String getInReplyToScreenName() {
		return inReplyToScreenName;
	}


	public void setInReplyToScreenName(String inReplyToScreenName) {
		this.inReplyToScreenName = inReplyToScreenName;
	}


	public String getThumbnailPic() {
		return thumbnailPic;
	}


	public void setThumbnailPic(String thumbnailPic) {
		this.thumbnailPic = thumbnailPic;
	}


	public String getBmiddlePic() {
		return bmiddlePic;
	}


	public void setBmiddlePic(String bmiddlePic) {
		this.bmiddlePic = bmiddlePic;
	}


	public String getOriginalPic() {
		return originalPic;
	}


	public void setOriginalPic(String originalPic) {
		this.originalPic = originalPic;
	}





	public int getRepostsCount() {
		return repostsCount;
	}


	public void setRepostsCount(int repostsCount) {
		this.lastRepostsCount = this.repostsCount;
		this.repostsCount = repostsCount;
	}


	public int getCommentsCount() {
		return commentsCount;
	}


	public void setCommentsCount(int commentsCount) {
		this.lastCommentsCount = this.commentsCount;
		this.commentsCount = commentsCount;
	}







	
	public void setRepostSpeed(double repostSpeed) {
		this.repostSpeed = repostSpeed;
	}
	public double getRepostSpeed() {
		return repostSpeed;
	}
	public void setRtAcceleration(double rtAcceleration) {
		this.rtAcceleration = rtAcceleration;
	}

	public Double getRtAcceleration() {
		return rtAcceleration;
	}

	public void setCountTime(Date countTime) {
		this.lastCountTime = this.countTime;
		this.countTime = countTime;
	}
	
	public Date getCountTime() {
		return countTime;
	}
	
	public Date getLastCountTime() {
		return lastCountTime;
	}

	public int getLastRepostsCount() {
		return lastRepostsCount;
	}


	public int getLastCommentsCount() {
		return lastCommentsCount;
	}


	public void setExpireTime(Date expireTime) {
		this.expireTime = expireTime;
	}
	public Date getExpireTime() {
		return expireTime;
	}
	
	public int getTTL(){
		return (int)(expireTime.getTime() - System.currentTimeMillis());
	}	
	
	public boolean isRetweeted() {
		return isRetweeted;
	}

	public void setRetweeted(boolean isRetweeted) {
		this.isRetweeted = isRetweeted;
	}

	public String toString(){
		return "Tweet [id=" + id + ", user=" + screenName + ",  createdAt="
		+ createdAt + ",  text=" + text + ", source="
		+ sourceName + ", favorited=" + favorited + ", truncated="
		+ truncated + ", inReplyToStatusId=" + inReplyToStatusId
		+ ", inReplyToUserId=" + inReplyToUserId
		+ ", inReplyToScreenName=" + inReplyToScreenName
		+ ", thumbnailPic=" + thumbnailPic + ", bmiddlePic="
		+ bmiddlePic + ", originalPic=" + originalPic
		+ ",  repostsCount=" + repostsCount + ", commentsCount="
		+ commentsCount + ", mid=" + mid
		+ ", retweeted=" + primaryTweet 
		+  "]";
	}
	
	

}
