package weibotrends.dao;

public class DAOFactory {
	private static DAO dao = new DAOJDOImpl();
	
	public static DAO getDAO(){
		return dao;
	}
}
