package weixinmp.message;

import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;

import weixinmp.message.req.EventMessage;
import weixinmp.message.req.ImageMessage;
import weixinmp.message.req.LinkMessage;
import weixinmp.message.req.LocationMessage;
import weixinmp.message.req.ReqMessage;
import weixinmp.message.req.TextMessage;
import weixinmp.message.req.VoiceMessage;
import weixinmp.message.resp.Article;
import weixinmp.message.resp.MusicResponse;
import weixinmp.message.resp.NewsResponse;
import weixinmp.message.resp.RespMessage;
import weixinmp.message.resp.TextResponse;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.core.util.QuickWriter;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.xml.KXml2Driver;
import com.thoughtworks.xstream.io.xml.PrettyPrintWriter;

/**
 * 消息工具类
 * 
 */
public class MessageUtil {
	private static Logger log = Logger.getLogger(MessageUtil.class.getName());
	
	/**
	 * 返回消息类型：文本
	 */
	public static final String RESP_MESSAGE_TYPE_TEXT = TextResponse.REQ_MESSAGE_TYPE_TEXT;;

	/**
	 * 返回消息类型：音乐
	 */
	public static final String RESP_MESSAGE_TYPE_MUSIC = MusicResponse.RESP_MESSAGE_TYPE_MUSIC;

	/**
	 * 返回消息类型：图文
	 */
	public static final String RESP_MESSAGE_TYPE_NEWS = NewsResponse.RESP_MESSAGE_TYPE_NEWS;

	/**
	 * 请求消息类型：文本
	 */
	public static final String REQ_MESSAGE_TYPE_TEXT = ReqMessage.REQ_MESSAGE_TYPE_TEXT;

	/**
	 * 请求消息类型：图片
	 */
	public static final String REQ_MESSAGE_TYPE_IMAGE = ReqMessage.REQ_MESSAGE_TYPE_IMAGE;

	/**
	 * 请求消息类型：链接
	 */
	public static final String REQ_MESSAGE_TYPE_LINK = ReqMessage.REQ_MESSAGE_TYPE_LINK;

	/**
	 * 请求消息类型：地理位置
	 */
	public static final String REQ_MESSAGE_TYPE_LOCATION = ReqMessage.REQ_MESSAGE_TYPE_LOCATION;

	/**
	 * 请求消息类型：音频
	 */
	public static final String REQ_MESSAGE_TYPE_VOICE = ReqMessage.REQ_MESSAGE_TYPE_VOICE;

	/**
	 * 请求消息类型：推送
	 */
	public static final String REQ_MESSAGE_TYPE_EVENT = ReqMessage.REQ_MESSAGE_TYPE_EVENT;

	/**
	 * 事件类型：subscribe(订阅)
	 */
	public static final String EVENT_TYPE_SUBSCRIBE = ReqMessage.EVENT_TYPE_SUBSCRIBE;

	/**
	 * 事件类型：unsubscribe(取消订阅)
	 */
	public static final String EVENT_TYPE_UNSUBSCRIBE = ReqMessage.EVENT_TYPE_UNSUBSCRIBE;

	/**
	 * 事件类型：CLICK(自定义菜单点击事件)
	 */
	public static final String EVENT_TYPE_CLICK = ReqMessage.EVENT_TYPE_UNSUBSCRIBE;


	/**
	 * 解析微信发送过来xml,把解析的数据放到map中
	 * 
	 * @param xmlData
	 * @return
	 * @throws DocumentException
	 */
	private static Map<String, String> parseXml(String xmlData) {
		log.log(Level.FINE, xmlData);
		HashMap<String, String> map = new HashMap<String, String>();

		Document doc;
		try {
			doc = DocumentHelper.parseText(xmlData);
			Element rootElt = doc.getRootElement();
			@SuppressWarnings("unchecked")
			List<Element> list = rootElt.elements();

			for (Element e : list) {
				map.put(e.getName(), e.getText());
			}
		} catch (DocumentException e1) {
			log.log(Level.WARNING, "DOM parse failed.", e1);
			e1.printStackTrace();
		}

		return map;
	}

	/**
	 * 请求消息xml转换成对象
	 * 
	 * @param reqMessage 文本消息对象
	 * @return xml
	 */
	public static ReqMessage xmlToReqMessage(String xml) {
		Map<String, String> map = parseXml(xml);
		String msgType = map.get("MsgType");

		XStream xstream = new XStreamGae();
		if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_TEXT)) {
			xstream.alias("xml", TextMessage.class);
		}
		// 图片消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_IMAGE)) {
			xstream.alias("xml", ImageMessage.class);
		}
		// 地理位置消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_LOCATION)) {
			xstream.alias("xml", LocationMessage.class);
		}
		// 链接消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_LINK)) {
			xstream.alias("xml", LinkMessage.class);
		}
		// 音频消息
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_VOICE)) {
			xstream.alias("xml", VoiceMessage.class);
		}
		// 事件推送
		else if (msgType.equals(MessageUtil.REQ_MESSAGE_TYPE_EVENT)) {
			xstream.alias("xml", EventMessage.class);
		}
		xstream.alias("item", Article.class);
		return (ReqMessage) xstream.fromXML(xml);
	}
	
	
	/**
	 * 响应消息对象转换成xml
	 * 
	 * @param respMessage 文本消息对象
	 * @return xml
	 */
	public static String respMessageToXml(RespMessage respMessage) {
		XStream xstream = new XStreamGae();
		xstream.alias("xml", respMessage.getClass());
		xstream.alias("item", new Article().getClass());
		return xstream.toXML(respMessage);
	}
	
	
	
	public static void main(String args[]){
		NewsResponse resp = new NewsResponse();
		Article item = new Article();
		item.setTitle("title");
		ArrayList<Article> items = new ArrayList<Article>();
		items.add(item);
		resp.setArticles(items);
		String xml = MessageUtil.respMessageToXml(resp);
		System.out.println(xml);
	}
}
