package weixinmp.message.req;

/**
 * 文本消息
 * 
 */
public class EventMessage extends ReqMessage {

	// 消息内容
	private String Event;
	
	private String EventKey;

	public String getEvent() {
		return Event;
	}

	public void setEvent(String event) {
		Event = event;
	}

	public void setEventKey(String eventKey) {
		EventKey = eventKey;
	}

	public String getEventKey() {
		return EventKey;
	}
}