package weixinmp;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.logging.Logger;

import weibotrends.Tweet;
import weibotrends.WeiboTops;
import weibotrends.WeiboUtils;
import weixinmp.dao.DAO;
import weixinmp.dao.DAOFactory;
import weixinmp.dao.WeixinUser;
import weixinmp.message.MessageUtil;
import weixinmp.message.req.EventMessage;
import weixinmp.message.req.ImageMessage;
import weixinmp.message.req.LinkMessage;
import weixinmp.message.req.LocationMessage;
import weixinmp.message.req.ReqMessage;
import weixinmp.message.req.TextMessage;
import weixinmp.message.req.VoiceMessage;
import weixinmp.message.resp.Article;
import weixinmp.message.resp.NewsResponse;
import weixinmp.message.resp.RespMessage;
import weixinmp.message.resp.TextResponse;

public class WeixinService {
	private static Logger log = Logger.getLogger(WeixinService.class.getName());
	

	public static String execute(String xml) {
		ReqMessage msg = MessageUtil.xmlToReqMessage(xml);
		
		// 处理消息
		RespMessage resp = handleMsg(msg);
		
		return MessageUtil.respMessageToXml(resp);
	}

	

	/**
	 * 处理消息
	 * 
	 * @param req
	 * @return
	 * @throws DBException 
	 */
	private static RespMessage handleMsg(ReqMessage req) {

		
		String msgType = req.getMsgType();
		log.fine("MsgType=" + msgType);

		// 文本消息
		if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_TEXT)) {
			return handleTextMsg((TextMessage)req);
		}
		// 图片消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_IMAGE)) {
			return handleImageMsg((ImageMessage)req);
		}
		// 地理位置消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_LOCATION)) {
			return handleLocationMsg((LocationMessage)req);
		}
		// 链接消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_LINK)) {
			return handleLinkMsg((LinkMessage)req);
		}
		// 音频消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_VOICE)) {
			return handleVoiceMsg((VoiceMessage)req);
		}
		// 事件推送
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_EVENT)) {
			return handleEventMsg((EventMessage)req); 
		}
		// 其他
		else {
			return handleUnknowMsg(req);
		}
	}


	/**
	 * 回复事件信息 
	 * @return
	 */
	private static RespMessage handleEventMsg(EventMessage req) {
		log.fine("handleEventMsg");
		
		String event = req.getEvent();
		if (EventMessage.EVENT_TYPE_SUBSCRIBE.equals(event)) {// 对于刚刚订阅用户的回复
			//WeiXinDao dao = new WeiXinDao();
			//String content= dao.queryAutoReply("subscribe");
			createWeixinUser(req);
			String content = "感谢您的关注，发送任意消息即可获取最新热门微博，快试一下吧！";
			return getTextResponse(content, req);
		} else {
			return handleUnknowMsg(req);
		}
	}
	

	

	/**
	 * 回复文本信息 
	 * @return
	 */
	private static RespMessage handleTextMsg(TextMessage req) {
		log.fine("handleTextMsg");
		
		String key = req.getContent();
		
		return handleUnknowMsg(req);
	}

	/**
	 * 回复图文信息 
	 * @return
	 */
	private static RespMessage handleImageMsg(ImageMessage req) {
		log.fine("handleImageMsg");
		
		return handleUnknowMsg(req);
	}

	/**
	 * 回复地理信息消息
	 * @return
	 */
	private static RespMessage handleLocationMsg(LocationMessage req) {
		log.fine("handleLocationMsg");
		
		return handleUnknowMsg(req);
	}
	
	/**
	 * 回复链接信息 
	 * @return
	 */
	private static RespMessage handleLinkMsg(LinkMessage req) {
		log.fine("handleLinkMsg");
		
		return handleUnknowMsg(req);
	}
	
	/**
	 * 回复音频信息消息
	 * @return
	 */
	private static RespMessage handleVoiceMsg(VoiceMessage req) {
		log.fine("handleVoiceMsg");
		
		return handleUnknowMsg(req);
	}

	/**
	 * 回复未知信息 
	 * @return
	 */
	private static RespMessage handleUnknowMsg(ReqMessage req) {
		List<Article> list = getTopWeibos(req);
		if (list!=null && list.size()>0){
			return getNewsResponse(list, req);		
		}else{
			return getTextResponse("暂无内容。", req);
		}
	}
	
	
	private static WeixinUser createWeixinUser(ReqMessage req){
		WeixinUser user = new WeixinUser();
		user.setUserName(req.getFromUserName());
		DAO dao = DAOFactory.getDAO();
		dao.storeWeixinUser(user);
		return user;
	}
	
	private static WeixinUser getWeixinUser(ReqMessage req){
		DAO dao = DAOFactory.getDAO();
		WeixinUser user = dao.fetchWeixinUser(req.getFromUserName());
		if (user == null){
			user = createWeixinUser(req);
		}
		return user;
	}
	
	private static void saveWeixinUser(WeixinUser user){
		DAO dao = DAOFactory.getDAO();
		dao.storeWeixinUser(user);
	}
	
	
	private static List<Article> getTopWeibos(ReqMessage req){
		List<Article> list = new ArrayList<Article>();
		WeiboTops wt = new WeiboTops(0);
		Collection<Tweet> hots = wt.loadTopTweets("bySpeed");
		
		WeixinUser user = getWeixinUser(req);
		
		if (hots!=null && !hots.isEmpty()){
			int i = 0;
			for (Tweet t : hots){
				if (i>=1) {
					Article item = new Article();
					item.setTitle("更多（点击或发送m）");
					item.setDescription("更多（点击或发送m）");
					item.setPicUrl("");
					item.setUrl("http://www.weitixing.com/weibotops");
					list.add(item);
					break;
				}
				if (t.getPrimaryTweet()!=null){
					t = t.getPrimaryTweet();
				}
				if (!isUserReadedWeibo(user, t.getId())){
					Article item = new Article();
					item.setTitle(t.getScreenName()+":"+t.getText());
					item.setDescription(t.getScreenName()+":"+t.getText());
					//item.setPicUrl(i==0?t.getBmiddlePic():t.getThumbnailPic());
					item.setPicUrl(t.getBmiddlePic());
					item.setUrl("http://weibo.cn/"+t.getUserId()+"/"+WeiboUtils.mid2url(t.getMid()));
					list.add(item);
					user.addWeiboId(t.getId());//记录已发送给用户的微博ID
					i++;
				}
			}
			saveWeixinUser(user);
		}
		return list;
	}
	
	private static boolean isUserReadedWeibo(WeixinUser user, Long weiboId){
		if (user==null) return false;
		Set<Long> weiboIds = user.getWeiboIds();
		if (weiboIds==null || weiboIds.size()<1) return false;
		
		return weiboIds.contains(weiboId);
		
	}
	
	private static TextResponse getTextResponse(String content, ReqMessage req) {
		TextResponse resp = new TextResponse();
		initRespMessage(resp, req);
		resp.setContent(content);
		return resp;
	}
	
	private static NewsResponse getNewsResponse(List<Article> list, ReqMessage req) {
		NewsResponse resp = new NewsResponse();
		initRespMessage(resp, req);
		resp.setArticles(list);
		return resp;
	}	

	private static void initRespMessage(RespMessage resp, ReqMessage req) {
		resp.setFromUserName(req.getToUserName());
		resp.setToUserName(req.getFromUserName());
		resp.setCreateTime(System.currentTimeMillis());
		resp.setFuncFlag(0);
		
	}

}
