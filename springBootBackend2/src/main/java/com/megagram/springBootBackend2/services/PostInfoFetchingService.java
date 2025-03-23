package com.megagram.springBootBackend2.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;


@Service
public class PostInfoFetchingService {

    
    public PostInfoFetchingService() {}
    

    public Object checkIfAuthUserIsAnAuthorOfPost(int authUserId, String overallPostId) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/expressJSBackend1/" +
            "getAuthorsAndEncryptionStatusOfPost/"+overallPostId);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");

            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_NOT_FOUND) {
                return new String[]{
                    "There doesn\'t currently exist a post with the overallPostId that you provided.",
                    "NOT_FOUND"
                };
            }

            if (responseCode == HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The expressJSBackend1 server had trouble getting the authors of the post.",
                    "BAD_GATEWAY"
                };
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            String stringifiedResponseData = response.toString();
            ObjectMapper objectMapper = new ObjectMapper();
            HashMap<String, Object> parsedResponseData = objectMapper.readValue(
                stringifiedResponseData, HashMap.class
            );

            List<Integer> authorsOfPost = (List<Integer>) parsedResponseData.get("authorsOfPost");

            return authorsOfPost.contains(authUserId);
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the expressJSBackend1 server to get the authors of the post.",
                "BAD_GATEWAY"
            };
        }
    }
}
