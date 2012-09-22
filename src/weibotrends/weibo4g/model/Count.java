/**
 * 
 */
package weibotrends.weibo4g.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;

import weibo4j.http.Response;
import weibo4j.model.PostParameter;
import weibo4j.model.WeiboException;
import weibo4j.org.json.JSONArray;
import weibo4j.org.json.JSONException;
import weibo4j.org.json.JSONObject;
import weibo4j.util.WeiboConfig;

import com.google.appengine.api.urlfetch.HTTPResponse;

/**
 * @author hezhou
 *
 */
public class Count implements java.io.Serializable{

	/**
	 * 
	 */
	private static final long serialVersionUID = 9076424494907778181L;

	private long id;
	
	private int comments;
	
	private int reposts;
	
	
	public Count(JSONObject json)throws WeiboException, JSONException{
    	id = json.getLong("id");
    	comments = json.getInt("comments");
    	//reposts = json.getInt("reposts");
    	reposts = json.getInt("rt");
    }
	
	public static List<Count> constructCounts(Response res) throws WeiboException {
	   	 try {
	            JSONArray list = res.asJSONArray();
	            int size = list.length();
	            List<Count> counts = new ArrayList<Count>(size);
	            for (int i = 0; i < size; i++) {
	            	counts.add(new Count(list.getJSONObject(i)));
	            }
	            return counts;
	        } catch (JSONException jsone) {
	            throw new WeiboException(jsone);
	        } catch (WeiboException te) {
	            throw te;
	        }
	   }
	
	@Override
    public int hashCode() {
        return (int) id;
    }

    @Override
    public boolean equals(Object obj) {
        if (null == obj) {
            return false;
        }
        if (this == obj) {
            return true;
        }
        return obj instanceof Count && ((Count) obj).id == this.id;
    }
    
    public long getId(){
    	return id;
    }

    public int getComments() {
		return comments;
	}

	public int getReposts() {
		return reposts;
	}


	@Override
    public String toString() {
        return "Count{ id=" + id +
                ", comments=" + comments +
                ", repost=" + reposts + 
                '}';
    }
	

    
}
