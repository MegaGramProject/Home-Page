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
            
            ArrayList<Integer> userIdsThatExistInList = parsedResponseData
                .get("data")
                .get("getTheUserIdsThatExistInList");
            
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
}
