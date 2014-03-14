package weixinmp.dao;

public interface DAO {
	
	public  void storeWeixinUser(WeixinUser user);
	
	public  WeixinUser fetchWeixinUser(String userName);

}
