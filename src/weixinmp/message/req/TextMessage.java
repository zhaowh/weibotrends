package weixinmp.message.req;

/**
 * 文本消息
 * 
 */
public class TextMessage extends ReqMessage {
	
	public TextMessage(){
		super();
		super.setMsgType("text");
	}
	
	// 消息内容
	private String Content;

	public String getContent() {
		return Content;
	}

	public void setContent(String content) {
		Content = content;
	}
}