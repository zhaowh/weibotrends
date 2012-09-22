package weibotrends.weibo4g.http;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;
import java.util.logging.Level;
import java.util.logging.Logger;

import weibo4j.http.Response;
import weibo4j.model.Configuration;
import weibo4j.model.Paging;
import weibo4j.model.PostParameter;
import weibo4j.model.WeiboException;
import weibo4j.org.json.JSONException;
import weibo4j.org.json.JSONObject;

import com.google.appengine.api.urlfetch.FetchOptions;
import com.google.appengine.api.urlfetch.HTTPHeader;
import com.google.appengine.api.urlfetch.HTTPMethod;
import com.google.appengine.api.urlfetch.HTTPRequest;
import com.google.appengine.api.urlfetch.HTTPResponse;
import com.google.appengine.api.urlfetch.URLFetchService;
import com.google.appengine.api.urlfetch.URLFetchServiceFactory;

/**
 * @author sinaWeibo
 * 
 */
public class HttpClientAsync implements java.io.Serializable {

	private static final long serialVersionUID = -176092625883595547L;
	private static final int OK 				   = 200;						// OK: Success!
	private static final int NOT_MODIFIED 		   = 304;			// Not Modified: There was no new data to return.
	private static final int BAD_REQUEST 		   = 400;				// Bad Request: The request was invalid.  An accompanying error message will explain why. This is the status code will be returned during rate limiting.
	private static final int NOT_AUTHORIZED 	   = 401;			// Not Authorized: Authentication credentials were missing or incorrect.
	private static final int FORBIDDEN 			   = 403;				// Forbidden: The request is understood, but it has been refused.  An accompanying error message will explain why.
	private static final int NOT_FOUND             = 404;				// Not Found: The URI requested is invalid or the resource requested, such as a user, does not exists.
	private static final int NOT_ACCEPTABLE        = 406;		// Not Acceptable: Returned by the Search API when an invalid format is specified in the request.
	private static final int INTERNAL_SERVER_ERROR = 500;// Internal Server Error: Something is broken.  Please post to the group so the Weibo team can investigate.
	private static final int BAD_GATEWAY           = 502;// Bad Gateway: Weibo is down or being upgraded.
	private static final int SERVICE_UNAVAILABLE   = 503;// Service Unavailable: The Weibo servers are up, but overloaded with requests. Try again later. The search and trend methods use this to indicate when you are being rate limited.

	private final static boolean DEBUG = Configuration.getDebug();
	
	static Logger log = Logger.getLogger(HttpClientAsync.class.getName());
	
	private  FetchOptions fetchOptions;

	private String token;
	
	
	public HttpClientAsync(){
		fetchOptions = FetchOptions.Builder.doNotValidateCertificate();
		fetchOptions.setDeadline(60.0);
	}
	
	public void setToken(String token){
		this.token = token;
	}
	
	/**
	 * log调试
	 * 
	 */
	private static void log(String message) {
		if (DEBUG) {
			log.log(Level.ALL,message);
		}
	}

	/**
	 * 处理http getmethod 请求
	 * 
	 */

	public Future<HTTPResponse>  getAsync(String url) throws WeiboException {

		return getAsync(url, new PostParameter[0]);

	}

	public Response get(String url, PostParameter[] params) throws WeiboException{
		return getResponse(getAsync(url, params));
	}
	
	public Future<HTTPResponse>  getAsync(String url, PostParameter[] params)
			throws WeiboException {
		log("Request:");
		log("GET:" + url);
		if (null != params && params.length > 0) {
			String encodedParams = PostParameter.encodeParameters(params);
			if (-1 == url.indexOf("?")) {
				url += "?" + encodedParams;
			} else {
				url += "&" + encodedParams;
			}
		}
		HTTPRequest req;
		try {
			req = new HTTPRequest(new URL(url), HTTPMethod.GET, fetchOptions);
		} catch (MalformedURLException e) {
			throw new WeiboException(e.getMessage(), e, -1);
		
		}
		return fetchAsync(req);

	}

	public Future<HTTPResponse> getAsync(String url, PostParameter[] params, Paging paging)
			throws WeiboException {
		if (null != paging) {
			List<PostParameter> pagingParams = new ArrayList<PostParameter>(4);
			if (-1 != paging.getMaxId()) {
				pagingParams.add(new PostParameter("max_id", String
						.valueOf(paging.getMaxId())));
			}
			if (-1 != paging.getSinceId()) {
				pagingParams.add(new PostParameter("since_id", String
						.valueOf(paging.getSinceId())));
			}
			if (-1 != paging.getPage()) {
				pagingParams.add(new PostParameter("page", String
						.valueOf(paging.getPage())));
			}
			if (-1 != paging.getCount()) {
				if (-1 != url.indexOf("search")) {
					// search api takes "rpp"
					pagingParams.add(new PostParameter("rpp", String
							.valueOf(paging.getCount())));
				} else {
					pagingParams.add(new PostParameter("count", String
							.valueOf(paging.getCount())));
				}
			}
			PostParameter[] newparams = null;
			PostParameter[] arrayPagingParams = pagingParams
					.toArray(new PostParameter[pagingParams.size()]);
			if (null != params) {
				newparams = new PostParameter[params.length
						+ pagingParams.size()];
				System.arraycopy(params, 0, newparams, 0, params.length);
				System.arraycopy(arrayPagingParams, 0, newparams,
						params.length, pagingParams.size());
			} else {
				if (0 != arrayPagingParams.length) {
					String encodedParams = PostParameter.encodeParameters(params);
					if (-1 != url.indexOf("?")) {
						url += "&" + encodedParams;
					} else {
						url += "?" + encodedParams;
					}
				}
			}
			return getAsync(url, newparams);
		} else {
			return getAsync(url, params);
		}
	}


	/**
	 * 处理http post请求
	 * 
	 */

	public Future<HTTPResponse> postAsync(String url, PostParameter[] params)
			throws WeiboException {
		return postAsync(url, params, true);

	}

	public Future<HTTPResponse> postAsync(String url, PostParameter[] params,
			Boolean withTokenHeader) throws WeiboException {
		log("Request:");
		log("POST" + url);
		HTTPRequest req;
		try {
			req = new HTTPRequest(new URL(url), HTTPMethod.POST, fetchOptions);
		} catch (MalformedURLException e) {
			throw new WeiboException(e.getMessage(), e, -1);
		
		}
		String postParams = PostParameter.encodeParameters(params);
		req.setPayload(postParams.getBytes());
		
		if (withTokenHeader) {
			return fetchAsync(req);
		} else {
			return fetchAsync(req, withTokenHeader);
		}
	}

	public Response post(String url, PostParameter[] params,
			Boolean withTokenHeader) throws WeiboException {
		return getResponse(postAsync(url, params, withTokenHeader));
	}

	public Future<HTTPResponse> fetchAsync(HTTPRequest  req) throws WeiboException {
		return fetchAsync(req, true);
	}
	
	public Future<HTTPResponse> fetchAsync(HTTPRequest req, Boolean withTokenHeader)
	throws WeiboException {
		InetAddress ipaddr;
		URLFetchService fs = URLFetchServiceFactory.getURLFetchService();
		try {
			
			ipaddr = InetAddress.getLocalHost();
			if (withTokenHeader) {
				if (token == null) {
					throw new IllegalStateException("Oauth2 token is not set!");
				}
				req.addHeader(new HTTPHeader("Authorization", "OAuth2 " + token));
				req.addHeader(new HTTPHeader("API-RemoteIP", ipaddr.getHostAddress()));

			}
			for (HTTPHeader header : req.getHeaders()) {
				log(header.getName() + ":" + header.getValue());
			}			

			Future<HTTPResponse> resp = fs.fetchAsync(req);

			return resp;

		} catch (IOException ioe) {
			throw new WeiboException(ioe.getMessage(), ioe);
		}

	}	
	
	public Response getResponse(Future<HTTPResponse> f) throws WeiboException{
		HTTPResponse resp;
		try {
			resp = f.get();
		} catch (Exception e) {
			throw new WeiboException(e);
		}
		return getResponse(resp);
	}
	
	
	public Response getResponse(HTTPResponse resp) throws WeiboException{
		int responseCode = -1;
		
		List<HTTPHeader> respHeaders = resp.getHeaders();
		for (HTTPHeader header : respHeaders) {
			log(header.getName() + ":" + header.getValue());
		}
		
		responseCode = resp.getResponseCode();
		log("Response:");
		log("https StatusCode:" + String.valueOf(responseCode));

		Response response = new Response();
		try {
			response.setResponseAsString(new String(resp.getContent(), "UTF-8"));
		} catch (UnsupportedEncodingException e1) {
			throw new WeiboException(e1);
		}
		log(response.toString() + "\n");

		if (responseCode != OK)

		{
			try {
				JSONObject json = response.asJSONObject();
				throw new WeiboException(getCause(responseCode),
						json, responseCode);
			} catch (JSONException e) {
				e.printStackTrace();
				throw new WeiboException(getCause(responseCode));
			}
		}
		return response;
	}
	
	
	/*
	 * 对parameters进行encode处理
	 */
	public static String encodeParameters(PostParameter[] postParams) {
		StringBuffer buf = new StringBuffer();
		for (int j = 0; j < postParams.length; j++) {
			if (j != 0) {
				buf.append("&");
			}
			try {
				buf.append(URLEncoder.encode(postParams[j].getName(), "UTF-8"))
						.append("=")
						.append(URLEncoder.encode(postParams[j].getValue(),
								"UTF-8"));
			} catch (java.io.UnsupportedEncodingException neverHappen) {
			}
		}
		return buf.toString();
	}


	private static String getCause(int statusCode) {
		String cause = null;
		switch (statusCode) {
		case NOT_MODIFIED:
			break;
		case BAD_REQUEST:
			cause = "The request was invalid.  An accompanying error message will explain why. This is the status code will be returned during rate limiting.";
			break;
		case NOT_AUTHORIZED:
			cause = "Authentication credentials were missing or incorrect.";
			break;
		case FORBIDDEN:
			cause = "The request is understood, but it has been refused.  An accompanying error message will explain why.";
			break;
		case NOT_FOUND:
			cause = "The URI requested is invalid or the resource requested, such as a user, does not exists.";
			break;
		case NOT_ACCEPTABLE:
			cause = "Returned by the Search API when an invalid format is specified in the request.";
			break;
		case INTERNAL_SERVER_ERROR:
			cause = "Something is broken.  Please post to the group so the Weibo team can investigate.";
			break;
		case BAD_GATEWAY:
			cause = "Weibo is down or being upgraded.";
			break;
		case SERVICE_UNAVAILABLE:
			cause = "Service Unavailable: The Weibo servers are up, but overloaded with requests. Try again later. The search and trend methods use this to indicate when you are being rate limited.";
			break;
		default:
			cause = "";
		}
		return statusCode + ":" + cause;
	}
}
