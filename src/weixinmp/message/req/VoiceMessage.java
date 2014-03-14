package weixinmp.message.req;
/**
 * 音频消息
 * 
 */
public class VoiceMessage extends ReqMessage {
	// 媒体ID
	private String MediaId;
	// 语音格式
	private String Format;
	
	private String Recognition;

	public String getMediaId() {
		return MediaId;
	}

	public void setMediaId(String mediaId) {
		MediaId = mediaId;
	}

	public String getFormat() {
		return Format;
	}

	public void setFormat(String format) {
		Format = format;
	}

	public void setRecognition(String recognition) {
		Recognition = recognition;
	}

	public String getRecognition() {
		return Recognition;
	}
}
