package weibotrends.weibo4g.http;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;
import java.util.logging.Level;
import java.util.logging.Logger;

import weibo4j.http.ImageItem;
import weibo4j.http.Response;
import weibo4j.model.Configuration;
import weibo4j.model.Paging;
import weibo4j.model.PostParameter;
import weibo4j.model.WeiboException;
import weibo4j.org.json.JSONException;

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
public class HttpClient extends weibo4j.http.HttpClient {

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
	static Logger log = Logger.getLogger(HttpClient.class.getName());
	
	private  FetchOptions fetchOptions;

	private String token;
	
	
	public HttpClient(){
		fetchOptions = FetchOptions.Builder.doNotValidateCertificate();
		fetchOptions.setDeadline(60.0);
	}
	
	public String setToken(String token){
		this.token = token;
		return this.token;
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

	public Response get(String url) throws WeiboException {

		return get(url, new PostParameter[0]);

	}

	public Response get(String url, PostParameter[] params)
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
		return fetch(req);

	}

	public Response get(String url, PostParameter[] params, Paging paging)
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
			return get(url, newparams);
		} else {
			return get(url, params);
		}
	}

	/**
	 * 处理http deletemethod请求
	 */

	public Response delete(String url, PostParameter[] params)
			throws WeiboException {
		if (0 != params.length) {
			String encodedParams = PostParameter.encodeParameters(params);
			if (-1 == url.indexOf("?")) {
				url += "?" + encodedParams;
			} else {
				url += "&" + encodedParams;
			}
		}
		
		HTTPRequest req;
		try {
			req = new HTTPRequest(new URL(url), HTTPMethod.DELETE, fetchOptions);
		} catch (MalformedURLException e) {
			throw new WeiboException(e.getMessage(), e, -1);
		
		}
		return fetch(req);

	}

	/**
	 * 处理http post请求
	 * 
	 */

	public Response post(String url, PostParameter[] params)
			throws WeiboException {
		return post(url, params, true);

	}

	public Response post(String url, PostParameter[] params,
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
			return fetch(req);
		} else {
			return fetch(req, withTokenHeader);
		}
	}

	/**
	 * 支持multipart方式上传图片
	 * 
	 */
	public Response multPartURL(String url, PostParameter[] params,
			ImageItem item) throws WeiboException {
		HTTPRequest req;
		try {
			req = new HTTPRequest(new URL(url), HTTPMethod.POST, fetchOptions);
			/*
			Part[] parts = null;
			if (params == null) {
				parts = new Part[1];
			} else {
				parts = new Part[params.length + 1];
			}
			if (params != null) {
				int i = 0;
				for (PostParameter entry : params) {
					parts[i++] = new StringPart(entry.getName(),
							(String) entry.getValue());
				}
				parts[parts.length - 1] = new ByteArrayPart(item.getContent(),
						item.getName(), item.getContentType());
			}
			postMethod.setRequestEntity(new MultipartRequestEntity(parts,
					postMethod.getParams()));
					
			return fetch(req);
			*/
			throw new UnsupportedOperationException();

		} catch (Exception ex) {
			throw new WeiboException(ex.getMessage(), ex, -1);
		}
	}

	public Response multPartURL(String fileParamName, String url,
			PostParameter[] params, File file, boolean authenticated)
			throws WeiboException {
		HTTPRequest req;
		try {
			req = new HTTPRequest(new URL(url), HTTPMethod.POST, fetchOptions);
			/*
			Part[] parts = null;
			if (params == null) {
				parts = new Part[1];
			} else {
				parts = new Part[params.length + 1];
			}
			if (params != null) {
				int i = 0;
				for (PostParameter entry : params) {
					parts[i++] = new StringPart(entry.getName(),
							(String) entry.getValue());
				}
			}
			FilePart filePart = new FilePart(fileParamName, file.getName(),
					file, new MimetypesFileTypeMap().getContentType(file),
					"UTF-8");
			filePart.setTransferEncoding("binary");
			parts[parts.length - 1] = filePart;

			postMethod.setRequestEntity(new MultipartRequestEntity(parts,
					postMethod.getParams()));
					
					*/
			throw new UnsupportedOperationException();
		} catch (Exception ex) {
			throw new WeiboException(ex.getMessage(), ex, -1);
		}
	}

	public Response fetch(HTTPRequest  req) throws WeiboException {
		return fetch(req, true);
	}

	public Response fetch(HTTPRequest req, Boolean withTokenHeader)
			throws WeiboException {
		InetAddress ipaddr;
		int responseCode = -1;
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

			HTTPResponse resp = fs.fetch(req);

			List<HTTPHeader> respHeaders = resp.getHeaders();
			for (HTTPHeader header : respHeaders) {
				log(header.getName() + ":" + header.getValue());
			}
			
			responseCode = resp.getResponseCode();
			log("Response:");
			log("https StatusCode:" + String.valueOf(responseCode));

			Response response = new Response();
			response.setResponseAsString(new String(resp.getContent(),"UTF-8"));
			log(response.toString() + "\n");

			if (responseCode != OK)

			{
				try {
					throw new WeiboException(getCause(responseCode),
							response.asJSONObject(), responseCode);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			}
			return response;

		} catch (IOException ioe) {
			throw new WeiboException(ioe.getMessage(), ioe, responseCode);
		}

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
