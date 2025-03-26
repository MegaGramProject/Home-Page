package com.megagram.springBootBackend2.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;


@SuppressWarnings("unchecked")
@Service
public class PostInfoFetchingService {
    

    public PostInfoFetchingService() {}


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


    public Object checkIfAuthUserHasAccessToPost(int authUserId, String overallPostId) {
        List<Integer> authorsOfPost = new ArrayList<Integer>();
        Boolean isEncrypted = false;

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

            authorsOfPost = (ArrayList<Integer>) parsedResponseData.get("authorsOfPost");

            if(authorsOfPost.contains(authUserId)) {
                return true;
            }

            isEncrypted = (Boolean) parsedResponseData.get("isEncrypted");
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the expressJSBackend1 server to get the authors of the post.",
                "BAD_GATEWAY"
            };
        }

        if (isEncrypted) {
            try {
                URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/graphql");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);

                String query = 
                    "query ($authUserId: Int!, $user_ids: [Int!]!) { " + 
                        "checkIfUserFollowsAtLeastOneInList(authUserId: $authUserId, user_ids: $user_ids)"
                   + "}"
                ;
                HashMap<String, Object> variables = new HashMap<String, Object>();
                variables.put("authUserId", authUserId);
                variables.put("user_ids", authorsOfPost);

                HashMap<String, Object> requestBody = new HashMap<String, Object>();
                requestBody.put("query", query);
                requestBody.put("variables", variables);

                ObjectMapper objectMapper = new ObjectMapper();
                String requestBodyAsJSONString = objectMapper.writeValueAsString(requestBody);

                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = requestBodyAsJSONString.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
    
                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_NOT_FOUND) {
                    return new String[]{
                        "There doesn\'t currently exist a post with the overallPostId that you provided.",
                        "NOT_FOUND"
                    };
                }
    
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    return new String[]{
                        "The djangoBackend2 server had trouble checking whether or not you follow " +
                        "at-least one of the authors of this post",
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
                objectMapper = new ObjectMapper();
                HashMap<String, HashMap<String, Boolean>> parsedResponseData = objectMapper.readValue(
                    stringifiedResponseData, HashMap.class
                );
                
                Boolean authUserFollowsAtLeastOnePostAuthor = parsedResponseData
                    .get("data")
                    .get("checkIfUserFollowsAtLeastOneInList");
                
                if (!authUserFollowsAtLeastOnePostAuthor) {
                    return new String[]{
                        "You do not follow at-least one of the authors of this post",
                        "UNAUTHORIZED"
                    };
                }
                return true;
            }
            catch (Exception e) {
                return new String[]{
                    "There was trouble connecting to the djangoBackend2 server to check if you follow " +
                    "at-least one of the authors of this post",
                    "BAD_GATEWAY"
                };
            }
        }
        else {
            try {
                URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/" +
                "isEachUserInListInTheBlockingsOfAuthUser/" + authUserId);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);

                HashMap<String, List<Integer>> requestBody = new HashMap<String, List<Integer>>();
                requestBody.put("user_ids", authorsOfPost);

                ObjectMapper objectMapper = new ObjectMapper();
                String requestBodyAsJSONString = objectMapper.writeValueAsString(requestBody);

                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = requestBodyAsJSONString.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
    
                int responseCode = connection.getResponseCode();
    
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    return new String[]{
                        "The djangoBackend2 server had trouble checking whether or not each author of " +
                        "this post is in your blockings.",
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
                Boolean eachPostAuthorIsInBlockingsOfAuthUser = Boolean.parseBoolean(
                    stringifiedResponseData
                );
                
                if (!eachPostAuthorIsInBlockingsOfAuthUser) {
                    return new String[]{
                        "There doesn\'t currently exist a post with the overallPostId that you provided.",
                        "NOT_FOUND"
                    };
                }
                return true;
            }
            catch (Exception e) {
                return new String[]{
                    "There was trouble connecting to the djangoBackend2 server to check whether or not " +
                    "each author of the post is in your blockings",
                    "BAD_GATEWAY"
                };
            }
        }
    }
}
