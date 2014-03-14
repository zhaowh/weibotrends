package weixinmp.dao;

import java.util.Set;
import java.util.TreeSet;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

@PersistenceCapable
public class WeixinUser {
	
	@PrimaryKey
	@Persistent 
	private String userName;
	
	@Persistent 
	private TreeSet<Long> weiboIds = new TreeSet<Long>();
		

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getUserName() {
		return userName;
	}	
	
	public void addWeiboId(Long id) {
		if (this.weiboIds.size()>100){//最多保存100个
			//this.weiboIds.pollFirst();
			for (int i=0; i<5; i++){
				this.weiboIds.remove(this.weiboIds.first());
			}
			
		}
		this.weiboIds.add(id);
	}

	public Set<Long> getWeiboIds() {
		return this.weiboIds;
	}

}
