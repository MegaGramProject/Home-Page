package com.megagram.springBootBackend2.services;

import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;


@Service
public class UserAuthService {


    public UserAuthService() {}

    
    public Object authenticateUser(HttpServletRequest request, int userId) {
        try {
            String authTokenKey = "authToken" + userId;
            String refreshTokenKey = "refreshToken" + userId;

            String authTokenVal = getCookieValue(request, authTokenKey);
            String refreshTokenVal = getCookieValue(request, refreshTokenKey);

            boolean authTokenIsValidlyStructured = isValidBase64Token(authTokenVal);

            if (!authTokenIsValidlyStructured) {
                return "The provided authUser token, if any, in your cookies has an invalid structure.";
            }

            if (!isValidBase64Token(refreshTokenVal)) {
                refreshTokenVal = "";
            }

            String cookiesText = authTokenKey + "=" + authTokenVal + ";";
            if (!refreshTokenVal.isEmpty()) {
                cookiesText += " " + refreshTokenKey + "=" + refreshTokenVal + ";";
            }

            URL url = new URL("http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/" + userId);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Cookie", cookiesText);

            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                return false;
            }

            Map<String, List<String>> headers = connection.getHeaderFields();
            List<String> setCookies = headers.get("Set-Cookie");

            if (setCookies != null) {
                for (String cookie : setCookies) {
                    String[] cookieParts = cookie.split(";");
                    String[] keyValue = cookieParts[0].split("=");

                    if (keyValue.length == 2 && keyValue[0].trim().equals(authTokenKey)) {
                        String refreshedAuthToken = keyValue[1].trim();

                        for (String attribute : cookieParts) {
                            String trimmedAttribute = attribute.trim();
                            if (trimmedAttribute.toLowerCase().startsWith("expires=")) {
                                String expiresValue = trimmedAttribute.substring(8);
                                try {
                                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                                    LocalDateTime cookieExpirationDateTime = LocalDateTime.parse(expiresValue, formatter);
                                    long numSecondsTillCookieExpires = calculateNumSecondsBetweenNowAndThen(
                                        cookieExpirationDateTime
                                    );

                                    return new Object[]{refreshedAuthToken, numSecondsTillCookieExpires};
                                } catch (Exception e) {
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }
            return true;
        }
        catch (Exception e) {
            return "There was trouble connecting to the ExpressJS backend for user authentication";
        }
    }


    private static String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(cookieName)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }


    private static boolean isValidBase64Token(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        try {
            byte[] decodedBytes = Base64.getDecoder().decode(token);
            return decodedBytes.length == 100;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }


    private long calculateNumSecondsBetweenNowAndThen(LocalDateTime then) {
        try {
            LocalDateTime now = LocalDateTime.now(ZoneId.of("GMT"));
            return Duration.between(now, then).getSeconds();
        }
        catch (Exception e) {
            return 0;
        }
    }
}
