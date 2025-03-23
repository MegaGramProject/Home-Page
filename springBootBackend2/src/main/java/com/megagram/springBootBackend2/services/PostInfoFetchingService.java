package com.megagram.springBootBackend2.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.springframework.stereotype.Service;


@Service
public class PostInfoFetchingService {


    public Object checkIfPostIsSponsored(String overallPostId) {   
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/expressJSBackend1/" +
            "checkIfPostIsSponsored/"+overallPostId);
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
                    "The expressJSBackend1 server had trouble checking if the post is sponsored",
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
            Boolean postIsSponsored = Boolean.parseBoolean(stringifiedResponseData);
            return postIsSponsored;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble connecting to the expressJSBackend1 server to check if the post is " +
                "sponsored",
                "BAD_GATEWAY"
            };
        }
    }
}
