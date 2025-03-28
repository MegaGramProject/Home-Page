package com.megagram.springBootBackend2.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;


@SuppressWarnings("unchecked")
@Service
public class UserInfoFetchingService {


    public UserInfoFetchingService() {}


    public Object getBlockingsOfUser(int userId) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/getBlockingsOfUser/"
            +userId);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");

            int responseCode = connection.getResponseCode();

            if (responseCode == HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The djangoBackend2 server had trouble getting the blockings of user " + userId,
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
            ArrayList<Integer> listOfUserBlockings = new ArrayList<Integer>();

            ObjectMapper objectMapper = new ObjectMapper();
            try {
                listOfUserBlockings = objectMapper.readValue(
                    stringifiedResponseData,
                    objectMapper.getTypeFactory().constructCollectionType(
                        ArrayList.class, 
                        Integer.class
                    )
                );
            }
            catch (Exception e) {}

            HashSet<Integer> setOfUserBlockings = new HashSet<Integer>(listOfUserBlockings);

            return setOfUserBlockings;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble connecting to the djangoBackend2 server to get the blockings of " +
                "user " + userId,
                "BAD_GATEWAY"
            };
        }
    }


    public Object getUserIdsThatExistInList(int authUserId, ArrayList<Integer> userIds) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/laravelBackend1/graphql");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String query = 
                "query ($authUserId: Int!, $userIds: [Int!]!) { " + 
                    "getTheUserIdsThatExistInList(authUserId: $authUserId, userIds: $userIds)"
                + "}"
            ;
            HashMap<String, Object> variables = new HashMap<String, Object>();
            variables.put("authUserId", authUserId);
            variables.put("userIds", userIds);

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

            if (responseCode == HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The laravelBackend1 server had trouble getting the users that exist in the list",
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
            HashMap<String, HashMap<String, ArrayList<Integer>>> parsedResponseData = objectMapper
            .readValue(
                stringifiedResponseData, HashMap.class
            );
            
            ArrayList<Integer> userIdsThatExistInList = parsedResponseData.get("data").get("getTheUserIdsThatExistInList");
            
           return userIdsThatExistInList;
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the laravelBackend1 server to get the users that " +
                "exist in the list",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getIsPrivateStatusesOfUser(int authUserId, int[] userIds) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/laravelBackend1/graphql");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String query = 
                "query ($authUserId: Int!, $userIds: [Int!]!) { " + 
                    "getIsPrivateStatusesOfList(authUserId: $authUserId, userIds: $userIds)"
                + "}"
            ;
            HashMap<String, Object> variables = new HashMap<String, Object>();
            variables.put("authUserId", authUserId);
            variables.put("userIds", userIds);

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

            if (responseCode == HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The laravelBackend1 server had trouble getting the isPrivate statuses of each " +
                    "user in the provided list",
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
            HashMap<String, HashMap<String, int[]>> parsedResponseData = objectMapper
            .readValue(
                stringifiedResponseData, HashMap.class
            );

            int[] isPrivateStatuses = parsedResponseData.get("data").get("getIsPrivateStatusesOfList");


            return isPrivateStatuses;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble connecting to the laravelBackend1 server to get the isPrivate " +
                "statuses of each user in the provided list",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getFollowingsOfUser(int userId) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/graphql");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String query = 
                "query ($authUserId: Int!) { " + 
                    "getFollowingsOfUser(authUserId: $authUserId)"
                + "}"
            ;
            HashMap<String, Integer> variables = new HashMap<String, Integer>();
            variables.put("authUserId", userId);

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

            if (responseCode == HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The djangoBackend2 server had trouble getting the followings of user " + userId,
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
            HashMap<String, HashMap<String, ArrayList<Integer>>> parsedResponseData = objectMapper
            .readValue(
                stringifiedResponseData, HashMap.class
            );

            ArrayList<Integer> userFollowings = parsedResponseData.get("data").get("getFollowingsOfUser");

            return new HashSet<Integer>(userFollowings);
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble connecting to the djangoBackend2 server to get the followings of user " +
                "userId",
                "BAD_GATEWAY"
            };
        }
    }

    
    public Object checkIfUser1HasAccessToUser2(int user1, int user2) {
        int[] userIds = new int[1];
        userIds[0] = user2;

        Object resultOfGettingIsPrivateStatusOfUser =  this.getIsPrivateStatusesOfUser(
            user1,
            userIds
        );
        if (resultOfGettingIsPrivateStatusOfUser instanceof String[]) {
            return resultOfGettingIsPrivateStatusOfUser;
        }
        int[] isPrivateStatusesOfList = (int[]) resultOfGettingIsPrivateStatusOfUser;
        
        if (isPrivateStatusesOfList[0] == 1) {
            try {
                URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/graphql");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
    
                String query = 
                    "query ($authUserId: Int!, $userIds: [Int!]!) { " + 
                        "checkIfUserFollowsAtLeastOneInList(authUserId: $authUserId, userIds: $userIds)"
                    + "}"
                ;
                HashMap<String, Object> variables = new HashMap<String, Object>();
                variables.put("authUserId", user1);
                variables.put("userIds", userIds);
    
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
    
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    return new String[]{
                        "The djangoBackend2 server had trouble checking whether or not user " + user1 + " follows user " +
                        user2, 
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
                HashMap<String, HashMap<String, Boolean>> parsedResponseData = objectMapper
                .readValue(
                    stringifiedResponseData, HashMap.class
                );
    
                if (!parsedResponseData.get("data").get("checkIfUserFollowsAtLeastOneInList")) {
                    return "Does not follow private user";
                }

                return true;
            }
            catch (Exception e) {
                return new String[] {
                    "There was trouble connecting to the djangoBackend2 server to check whether or not user " + user1 +
                    " follows user " + user2,
                    "BAD_GATEWAY"
                };
            }
        }
        else if (isPrivateStatusesOfList[0] == 0) {
            return true;
        }
        else {
            return false;
        }
    }
}
