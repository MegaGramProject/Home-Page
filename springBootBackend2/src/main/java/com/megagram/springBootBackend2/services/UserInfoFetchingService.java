package com.megagram.springBootBackend2.services;

import java.io.BufferedReader;
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

            if (responseCode != HttpURLConnection.HTTP_OK) {
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

            if (responseCode != HttpURLConnection.HTTP_OK) {
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


    public Object getIsPrivateStatusesOfMultipleUsers(int authUserId, int[] userIds) {
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

            if (responseCode != HttpURLConnection.HTTP_OK) {
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

            if (responseCode != HttpURLConnection.HTTP_OK) {
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

        Object resultOfGettingIsPrivateStatusOfUser =  this.getIsPrivateStatusesOfMultipleUsers(
            user1,
            userIds
        );
        if (resultOfGettingIsPrivateStatusOfUser instanceof String[]) {
            return resultOfGettingIsPrivateStatusOfUser;
        }
        int[] isPrivateStatusesOfList = (int[]) resultOfGettingIsPrivateStatusOfUser;
        
        if (isPrivateStatusesOfList[0] == 1) {
            if (user1 == -1) {
                return "Does not follow private user";
            }
            
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
    
                if (responseCode != HttpURLConnection.HTTP_OK) {
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


    public Object checkIfUser1HasAccessToMultipleUsers(int authUserId, int[] userIds) {
        Object resultOfGettingIsPrivateStatusOfUser =  this.getIsPrivateStatusesOfMultipleUsers(
            authUserId,
            userIds
        );
        if (resultOfGettingIsPrivateStatusOfUser instanceof String[]) {
            return resultOfGettingIsPrivateStatusOfUser;
        }
        int[] isPrivateStatusesOfList = (int[]) resultOfGettingIsPrivateStatusOfUser;

        ArrayList<Integer> privateUserIds = new ArrayList<Integer>();
        HashMap<Integer, Object> usersAndTheAccessAuthUserHasToThem = new HashMap<Integer, Object>();

        for (int i=0; i<userIds.length; i++) {
            int userId = userIds[i];
            int isPrivateStatusOfUser = isPrivateStatusesOfList[i];

            if (isPrivateStatusOfUser == 1) {
                privateUserIds.add(userId);
            }
            else if (isPrivateStatusOfUser == 0) {
                usersAndTheAccessAuthUserHasToThem.put(userId, true);
            }
            else {
                usersAndTheAccessAuthUserHasToThem.put(userId, false);
            }
        }

        if (privateUserIds.size() > 0) {
            boolean thereWasTroubleWithAPIRequest = false;

            try {
                URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/graphql");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
    
                String query = "query ($authUserId: Int!, $userIds: [Int!]!) { " + 
                    "getUserFollowStatusesOfEachUserInList(authUserId: $authUserId, userIds: $userIds)"
                + "}";
                HashMap<String, Object> variables = new HashMap<String, Object>();
                variables.put("authUserId", authUserId);
                variables.put("userIds", privateUserIds);
    
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
    
                if (responseCode != HttpURLConnection.HTTP_OK) {
                   thereWasTroubleWithAPIRequest = true;
                }
                else {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
        
                    String stringifiedResponseData = response.toString();
                    HashMap<String, HashMap<String, ArrayList<Boolean>>> parsedResponseData = objectMapper.readValue(
                        stringifiedResponseData, HashMap.class
                    );

                    ArrayList<Boolean> followStatusesOfEachUserInList = parsedResponseData.get("data").get(
                        "getUserFollowStatusesOfEachUserInList"
                    );

                    for(int i=0; i<privateUserIds.size(); i++) {
                        int privateUserId = privateUserIds.get(i);
                        boolean authUserFollowsThisUser = followStatusesOfEachUserInList.get(i);

                        if (authUserFollowsThisUser) {
                            usersAndTheAccessAuthUserHasToThem.put(privateUserId, false);
                        }
                        else {
                            usersAndTheAccessAuthUserHasToThem.put(privateUserId, "Does not follow private user");
                        }
                    }
                }
            }
            catch (Exception e) {
                thereWasTroubleWithAPIRequest = true;
            }

            if (thereWasTroubleWithAPIRequest) {
                for(int privateUserId : privateUserIds) {
                    usersAndTheAccessAuthUserHasToThem.put(privateUserId, false);
                }
            }
        }

        return usersAndTheAccessAuthUserHasToThem;
    }


    public Object getUsernamesForListOfUserIds(int authUserId, ArrayList<Integer> userIds) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/laravelBackend1/graphql");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String query = 
                "query ($authUserId: Int!, $userIds: [Int!]!) { " + 
                    "getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $userIds)"
                + "}"
            ;
            HashMap<String, ArrayList<Integer>> variables = new HashMap<String, ArrayList<Integer>>();
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

            if (responseCode != HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The laravelBackend1 server had trouble getting the usernames for the provided list of user-ids", 
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
            HashMap<String, HashMap<String, ArrayList<String>>> parsedResponseData = objectMapper
            .readValue(
                stringifiedResponseData, HashMap.class
            );

            ArrayList<String> usernamesForListOfUserIds = parsedResponseData.get("data").get(
                "getUsernamesForListOfUserIdsAsAuthUser"
            );
            HashMap<Integer, String> usersAndTheirUsernames = new HashMap<Integer, String>();

            for(int i=0; i<userIds.size(); i++) {
                int userId = userIds.get(i);
                String username = usernamesForListOfUserIds.get(i);
                usersAndTheirUsernames.put(userId, username);
            }

            return usersAndTheirUsernames;
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the laravelBackend1 server to get the usernames for the provided list of user-ids", 
                "BAD_GATEWAY"
            };
        }
    }


    public Object getUserIdOfUsername(int authUserId, String username) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/laravelBackend1/graphql");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String query = 
                "query ($authUserId: Int!, $username: String!) { " + 
                    "getUserIdOfUsername(authUserId: $authUserId, username: $username)"
                + "}"
            ;
            HashMap<String, Object> variables = new HashMap<String, Object>();
            variables.put("authUserId", authUserId);
            variables.put("username", username);

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

            if (responseCode != HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The laravelBackend1 server had getting the userId of user " + username + ", if they even exist",
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
            HashMap<String, HashMap<String, Integer>> parsedResponseData = objectMapper
            .readValue(
                stringifiedResponseData, HashMap.class
            );
            
            Integer userIdOfGivenUsername = parsedResponseData.get("data").get("getUserIdOfUsername");
            
            return userIdOfGivenUsername;
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the  laravelBackend1 server to get the userId of user " + username + ", if they " +
                "even exist",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getOrderedListOfUserSuggestionsBasedOnNumFollowersAndOtherMetrics(int authUserId, HashSet<Integer>
    setOfAuthUserFollowings, HashSet<Integer> setOfUserIdsToExclude, String usernameStartsWithThis, int limit) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2" +
            "/getOrderedListOfUserSuggestionsBasedOnNumFollowersAndOtherMetrics/" + authUserId + "/" +
            usernameStartsWithThis + "/" + limit);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            HashMap<String, Object> requestBody = new HashMap<String, Object>();
            requestBody.put("auth_user_followings", new ArrayList<Integer>(setOfAuthUserFollowings));
            requestBody.put("user_ids_to_exclude", new ArrayList<Integer>(setOfUserIdsToExclude));

            ObjectMapper objectMapper = new ObjectMapper();
            String requestBodyAsJSONString = objectMapper.writeValueAsString(requestBody);

            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = requestBodyAsJSONString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            int responseCode = connection.getResponseCode();

            if (responseCode != HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The djangoBackend2 server had trouble getting the ordered list of user-suggestions for user " +
                    authUserId,
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
            HashMap<String, Object> parsedResponseData = objectMapper.readValue(
                stringifiedResponseData, HashMap.class
            );
            
            return parsedResponseData;
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the djangoBackend2 server to get the ordered list of user-suggestions " +
                "for user " + authUserId,
                "BAD_GATEWAY"
            };
        }
    }


    public Object getOrderedAuthUserFollowingsBasedOnNumFollowersAndOtherMetrics(int authUserId, HashSet<Integer>
    setOfAuthUserFollowings, int limit) {
        try {
            URL url = new URL("http://34.111.89.101/api/Home-Page/djangoBackend2/graphql");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String query = "query ($authUserId: Int!, $authUserFollowings: [Int!]!, $limit: Int) { " + 
                "getOrderedAuthUserFollowingsBasedOnNumFollowersAndOtherMetrics(authUserId: $authUserId, " +
                " authUserFollowings: $authUserFollowings, limit: $limit) " +
            "}";
            HashMap<String, Object> variables = new HashMap<String, Object>();
            variables.put("authUserId", authUserId);
            variables.put("authUserFollowings", new ArrayList<Integer>(setOfAuthUserFollowings));
            variables.put("limit", limit);

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

            if (responseCode != HttpURLConnection.HTTP_OK) {
                return new String[]{
                    "The djangoBackend2 server had trouble getting the ordered(based on numFollowers and other criteria) " +
                    "user-ids of the given set of auth-user followings",
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
            HashMap<String, HashMap<String, ArrayList<Integer>>> parsedResponseData = objectMapper.readValue(
                stringifiedResponseData, HashMap.class
            );

            ArrayList<Integer> orderedAuthUserFollowingsOutput = parsedResponseData.get("data").get(
                "getOrderedAuthUserFollowingsBasedOnNumFollowersAndOtherMetrics"
            );
            
            return orderedAuthUserFollowingsOutput;
        }
        catch (Exception e) {
            return new String[]{
                "There was trouble connecting to the djangoBackend2 server to get the ordered(based on numFollowers and " +
                "other criteria) user-ids of the given set of auth-user followings",
                "BAD_GATEWAY"
            };
        }
    }
}
