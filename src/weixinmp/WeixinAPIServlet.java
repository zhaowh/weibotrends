package weixinmp;

import java.io.BufferedReader;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Collection;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import weibotrends.Tweet;
import weibotrends.WeiboTops;
import weibotrends.WeiboUtils;

@SuppressWarnings("serial")
public class WeixinAPIServlet extends HttpServlet {
	private final static String token = "iotfUOP87095";
	
	private static Logger log = Logger.getLogger(WeixinAPIServlet.class.getName());
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException,ServletException {
		doPost(req,resp);
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
	throws IOException,ServletException {
		req.setCharacterEncoding("UTF-8");
		resp.setCharacterEncoding("UTF-8");
		resp.setContentType("text/xml; charset=UTF-8");

		try {
			if (!checkSign(req, resp)) return;
		} catch (NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return;
		}
		
		BufferedReader reader = req.getReader();
		StringBuffer xml = new StringBuffer();
		while(true){
			String s = reader.readLine();
			if (s == null) break;
			xml.append(s);
		}
		log.info("req xml: \n" + xml );
		
		String respXML = WeixinService.execute(xml.toString());

		log.info("resp xml: \n" + respXML );
		resp.getWriter().write(respXML);
			 
	}	
	
	public boolean checkSign(HttpServletRequest req, HttpServletResponse resp)throws IOException, ServletException, NoSuchAlgorithmException {
		log.fine("checkSign");
		String signature = req.getParameter("signature");
		String timestamp = req.getParameter("timestamp");
		String nonce = req.getParameter("nonce");
		String echostr = req.getParameter("echostr");
		
		if (timestamp==null || nonce == null) return false;
		
		String[] arr = new String[] { token, timestamp, nonce };  
		// 将token、timestamp、nonce三个参数进行字典序排序  
        Arrays.sort(arr);  
        StringBuilder content = new StringBuilder();  
        for (int i = 0; i < arr.length; i++) {  
        	content.append(arr[i]);  
        }
        
		
		MessageDigest messageDigest;
		messageDigest = MessageDigest.getInstance("SHA1");
		messageDigest.update(content.toString().getBytes());
		String mysign =  byteToHexStr(messageDigest.digest());
		log.info("signature="+signature);
		log.info("mysign="+mysign);
		
		if (mysign.equals(signature)){
			//resp.getWriter().println(echostr);
			return true;
		}else{
			return false;
		}
	}
	
    /**
     * Takes the raw bytes from the digest and formats them correct.
     *
     * @param bytes
     *            the raw bytes from the digest.
     * @return the formatted bytes.
     */
    private static String byteToHexStr(byte[] bytes) {
    	char[] HEX_DIGITS = { '0', '1', '2', '3', '4', '5',
            '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

        int len = bytes.length;
        StringBuilder buf = new StringBuilder(len * 2);
        
        // 把密文转换成十六进制的字符串形式
        for (int j = 0; j < len; j++) {         
        	buf.append(HEX_DIGITS[(bytes[j] >> 4) & 0x0f]);
            buf.append(HEX_DIGITS[bytes[j] & 0x0f]);
        }
        return buf.toString();
    }	

}
