package weixinmp.message.resp;


/**
 * 文本消息
 * 
 */
public class TextResponse extends RespMessage {
	
	public TextResponse(){
		super();
		super.setMsgType(REQ_MESSAGE_TYPE_TEXT);
	}
	
	// 回复的消息内容
	private String Content;

	public String getContent() {
		return Content;
	}

	public void setContent(String content) {
		Content = content;
	}
}