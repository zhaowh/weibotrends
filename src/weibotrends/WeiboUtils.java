package weibotrends;

public class WeiboUtils {
	private static final String STR62_KEYS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	
	/**
	* 10进制值转换为62进制
	* @param {String} int10 10进制值
	* @return {String} 62进制值
	*/	
	public static String int10to62(int num){
		String s62 = "";
	    int r = 0;
	    do {
	        r =  num % 62;
	        s62 = STR62_KEYS.charAt(r) + s62;
	        num = (int) Math.floor(num / 62);
	    }while (num != 0) ;
	    return s62;
	}
	
	/**
	* mid转换为URL字符
	* @param {String} mid 微博mid，如 "201110410216293360"
	* @return {String} 微博URL字符，如 "wr4mOFqpbO"
	*/
	public static String mid2url(String mid) {
	    String url = "";

	    for (int i = mid.length() - 7; i > -7; i = i - 7) //从最后往前以7字节为一组读取mid
	    {
	        int offset1 = i < 0 ? 0 : i;
	        int offset2 = i + 7;
	        int num = Integer.parseInt(mid.substring(offset1, offset2));

	        String s62 = int10to62(num) ;
	        
		    if (offset1>0) while (s62.length()<4){ //若不是第一组，则不足4位补0
		    	s62='0'+s62;
		    }
	        
	        url = s62 + url;
	    }

	    return url;
	}
	
	
	/**
	* 62进制值转换为10进制
	* @param {String} str62 62进制值
	* @return {String} 10进制值
	*/	
	public static int str62to10(String str62) {
	    int i10 = 0;
	    for (int i = 0; i < str62.length(); i++) {
	        int n = str62.length() - i - 1;
	        int s = str62.charAt(i);
	        i10 += STR62_KEYS.indexOf(s) * Math.pow(62, n);
	    }
	    return i10;
	};
	
	/**
	* URL字符转换为mid
	* @param {String} url 微博URL字符，如 "wr4mOFqpbO"
	* @return {String} 微博mid，如 "201110410216293360"
	*/
	public static String url2mid(String url) {
	    String mid = "";

	    for (int i = url.length() - 4; i > -4; i = i - 4) //从最后往前以4字节为一组读取URL字符
	    {
	        int offset1 = i < 0 ? 0 : i;
	        int offset2 = i + 4;
	        String str = url.substring(offset1, offset2);

	        str = String.valueOf(str62to10(str));
	        
	        if (offset1 > 0) //若不是第一组，则不足7位补0
	        {
	            while (str.length() < 7) {
	                str = '0' + str;
	            }
	        }

	        mid = str + mid;
	    }
	    return mid;
	};	
	
	public static void main(String args[]){
		String s62 = "ypIxt0DsG";
		String s10 = url2mid(s62);
		s62 = mid2url(s10);
		System.out.println(s10);
		System.out.println(s62);
	}
}
