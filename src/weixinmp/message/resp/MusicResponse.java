package weixinmp.message.resp;


/**
 * 音乐消息
 */
public class MusicResponse extends RespMessage {
	
	public MusicResponse(){
		super();
		super.setMsgType(RESP_MESSAGE_TYPE_MUSIC);
	}
	
	
	// 音乐
	private Music Music;

	public Music getMusic() {
		return Music;
	}

	public void setMusic(Music music) {
		Music = music;
	}
}