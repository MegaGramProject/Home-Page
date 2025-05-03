package com.megagram.springBootBackend2.Controllers.RestAPI.Story;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.exceptions.TooManyRequestsException;
import com.megagram.springBootBackend2.repositories.oracleSQL.StoryViewRepository;
import com.megagram.springBootBackend2.services.StoryService;
import com.megagram.springBootBackend2.services.UserAuthService;
import com.megagram.springBootBackend2.services.UserInfoFetchingService;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@SuppressWarnings("unchecked")
@RestController
public class Queries {
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private UserInfoFetchingService userInfoFetchingService;
    @Autowired
    private StoryViewRepository storyViewRepository;
    @Autowired
    private StoryService storyService;
    
    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();
    

    public Queries() {}


    @GetMapping("/getOrderedListOfUsersForStoriesSection/{authUserId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getOrderedListOfUsersForStoriesSection(HttpServletRequest request, HttpServletResponse
    response, @RequestParam int authUserId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/getOrderedListOfUsersForStoriesSection");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        Object userAuthenticationResult = this.userAuthService.authenticateUser(request, authUserId);

        if (userAuthenticationResult instanceof Boolean) {
            if (!(Boolean) userAuthenticationResult) {
                throw new ForbiddenException("The expressJSBackend1 server could not verify you as " + 
                "having the proper credentials to be logged in as " + authUserId);
            }
        }
        else if (userAuthenticationResult instanceof String) {
            String errorMessage = (String) userAuthenticationResult;
            
            if (errorMessage.equals("The provided authUser token, if any, in your cookies has an " +
            "invalid structure.")) {
                throw new ForbiddenException(errorMessage);
            }

            throw new BadGatewayException(errorMessage);
        }
        else if (userAuthenticationResult instanceof Object[]) {
            String authToken = (String) ((Object[])userAuthenticationResult)[0];
            long numSecondsTillCookieExpires = (long) ((Object[])userAuthenticationResult)[1];

            ResponseCookie cookie = ResponseCookie.from("authToken", authToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(numSecondsTillCookieExpires)
                .sameSite("Strict")
                .build();

            response.addHeader("Set-Cookie", cookie.toString());
        }

        String errorMessage = "";

        Object resultOfGettingFollowingsOfAuthUser = this.userInfoFetchingService.getFollowingsOfUser(
            authUserId
        );
        if (resultOfGettingFollowingsOfAuthUser instanceof String[]) {
            errorMessage += "• " +  ((String[]) resultOfGettingFollowingsOfAuthUser)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserFollowings = (HashSet<Integer>) resultOfGettingFollowingsOfAuthUser;

        Object resultOfGettingIdsAndAuthorsOfUnexpiredStoriesPostedByAuthUserFollowings = this.storyService
        .getIdsAndAuthorsOfUnexpiredStoriesPostedByUsersInSet(setOfAuthUserFollowings);
        if (resultOfGettingIdsAndAuthorsOfUnexpiredStoriesPostedByAuthUserFollowings instanceof String[]) {
            errorMessage += "• " +
            ((String[]) resultOfGettingIdsAndAuthorsOfUnexpiredStoriesPostedByAuthUserFollowings)[0] +
            "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashMap<String, Integer> storyIdsAndTheirAuthors = (HashMap<String, Integer>)
        resultOfGettingIdsAndAuthorsOfUnexpiredStoriesPostedByAuthUserFollowings;

        HashSet<String> setOfStoryIdsAvailableToAuthUser = new HashSet<String>(
            storyIdsAndTheirAuthors.keySet()
        );

        HashSet<Integer> setOfAuthorIdsOfStoriesAvailableToAuthUser = new HashSet<Integer>();

        try {
            HashSet<String> storyIdsAvailableToAuthUser = this.storyViewRepository.
            getIdsOfStoriesInSetThatAreNotViewedByUser(
                authUserId,
                setOfStoryIdsAvailableToAuthUser
            );

            for (String storyId : storyIdsAvailableToAuthUser) {
                setOfAuthorIdsOfStoriesAvailableToAuthUser.add(storyIdsAndTheirAuthors.get(storyId));
            }
        }   
        catch (Exception e) {
            errorMessage += "• There was trouble fetching the stories from users in your followings " +
            "that have not been viewed by you yet\n";
            throw new BadGatewayException(errorMessage);
        }

        ArrayList<Integer> orderedListOfUsersForStoriesSection = new ArrayList<Integer>();
    
        try {
            orderedListOfUsersForStoriesSection = this.storyViewRepository
            .getAuthorIdsOfThoseInSetThatUserGivesMostStoryViewsTo(
                authUserId,
                setOfAuthorIdsOfStoriesAvailableToAuthUser,
                22
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble getting the users in your followings that you give the " +
            "most story-views to\n";
        }

        ArrayList<Boolean> orderedListOfSponsorshipStatuses = new ArrayList<Boolean>();

        for (int authorId : orderedListOfUsersForStoriesSection) {
            orderedListOfSponsorshipStatuses.add(false);
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("orderedListOfUsersForStoriesSection", orderedListOfUsersForStoriesSection);
        output.put("orderedListOfSponsorshipStatuses", orderedListOfSponsorshipStatuses);
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }

    
    @GetMapping("/getStoriesOfUser/{authUserId}/{userId}/{onlyShowUnexpired}/{onlyShowSponsoredStories}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getStoriesOfUser(HttpServletRequest request, HttpServletResponse response, @RequestParam int
    authUserId, @RequestParam int userId, @RequestParam boolean onlyShowUnexpired, @RequestParam boolean onlyShowSponsoredStories)
    throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/getStoriesOfUser");

        if (authUserId < 1 && authUserId != -1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId. If you are an anonymous guest, you must " +
                "set the authUserId to -1"
            );
        }

        if (userId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided userId"
            );
        }

        if (!onlyShowUnexpired && authUserId != userId) {
            throw new ForbiddenException(
                "You are not authorized to see all the stories(i.e expired + unexpired) of a user that isn't yourself"
            );
        }

        boolean authUserIsAnonymousGuest = authUserId == -1;
        if (!authUserIsAnonymousGuest) {
            Object userAuthenticationResult = this.userAuthService.authenticateUser(request, authUserId);

            if (userAuthenticationResult instanceof Boolean) {
                if (!(Boolean) userAuthenticationResult) {
                    throw new ForbiddenException("The expressJSBackend1 server could not verify you as " + 
                    "having the proper credentials to be logged in as " + authUserId);
                }
            }
            else if (userAuthenticationResult instanceof String) {
                String errorMessage = (String) userAuthenticationResult;
                
                if (errorMessage.equals("The provided authUser token, if any, in your cookies has an " +
                "invalid structure.")) {
                    throw new ForbiddenException(errorMessage);
                }
    
                throw new BadGatewayException(errorMessage);
            }
            else if (userAuthenticationResult instanceof Object[]) {
                String authToken = (String) ((Object[])userAuthenticationResult)[0];
                long numSecondsTillCookieExpires = (long) ((Object[])userAuthenticationResult)[1];
    
                ResponseCookie cookie = ResponseCookie.from("authToken", authToken)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(numSecondsTillCookieExpires)
                    .sameSite("Strict")
                    .build();
    
                response.addHeader("Set-Cookie", cookie.toString());
            }
        }

        String errorMessage = "";

        Object resultOfCheckingIfAuthUserHasAccessToUser = this.userInfoFetchingService.checkIfUser1HasAccessToUser2(
            authUserId,
            userId
        );
        if (resultOfCheckingIfAuthUserHasAccessToUser instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfCheckingIfAuthUserHasAccessToUser)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        else if (resultOfCheckingIfAuthUserHasAccessToUser instanceof String) {
            errorMessage += "•  You cannot get the stories of a private user that you do not follow\n";
            throw new ForbiddenException(errorMessage);
        }
        else {
            boolean authUserHasAccessToUser = (boolean) resultOfCheckingIfAuthUserHasAccessToUser;
            if (!authUserHasAccessToUser) {
                errorMessage += "• You are trying to fetch the stories of a user that does not exist\n";
                throw new ResourceDoesNotExistException(errorMessage);
            }
        }

        Object resultOfGettingOrderedStoriesOfUser = this.storyService.getOrderedStoriesOfUser(
            userId,
            onlyShowUnexpired,
            onlyShowSponsoredStories
        );
        if (resultOfGettingOrderedStoriesOfUser instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingOrderedStoriesOfUser)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        
        ArrayList<HashMap<String, Object>>  orderedStoriesOfUser = (ArrayList<HashMap<String, Object>>)
        resultOfGettingOrderedStoriesOfUser;
        HashSet<String> setOfStoryIdsOfUser = new HashSet<String>();

        for(HashMap<String, Object> storyForUser : orderedStoriesOfUser) {
            setOfStoryIdsOfUser.add((String) storyForUser.get("id"));
        }        

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("stories", orderedStoriesOfUser);

        if (orderedStoriesOfUser.size() > 0) {
            output.put("currSlide", 0);

            try {
                HashSet<String> storyIdsUnseenByAuthUser = this.storyViewRepository.getIdsOfStoriesInSetThatAreNotViewedByUser(
                    authUserId,
                    setOfStoryIdsOfUser
                );
    
                if (storyIdsUnseenByAuthUser.size() > 0) {
                    for(int i=0; i<orderedStoriesOfUser.size(); i++) {
                        HashMap<String, Object> storyOfUser = orderedStoriesOfUser.get(i);
                        String storyId = (String) storyOfUser.get("id");
                        
                        if (storyIdsUnseenByAuthUser.contains(storyId)) {
                            output.put("currSlide", i);
                            break;
                        }
                    }    
                }
                else {
                    output.put("currSlide", "finished");
                }
            }
            catch (Exception e) {
                errorMessage += "• There was trouble getting your currSlide in the stories of this user\n";
            }
        }

        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @GetMapping("/getStoryById/{authUserId}/{storyId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getStoryById(HttpServletRequest request, HttpServletResponse response, @RequestParam int
    authUserId, @RequestParam String storyId) throws Exception {
        if (authUserId < 1 && authUserId != -1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId. If you are an anonymous guest, you must " +
                "set the authUserId to -1"
            );
        }

        boolean storyIdIsValid = true;

        try {
            UUID storyIdAsUUID = UUID.fromString(storyId);
            
            if (!(storyId.equals(storyIdAsUUID.toString()))) {
                storyIdIsValid = false;
            }
        }
        catch (IllegalArgumentException e) {
            storyIdIsValid = false;
        }

        if (!storyIdIsValid) {
            throw new BadRequestException(
                "There does not exist a story with the provided storyId"
            );
        }

        boolean authUserIsAnonymousGuest = authUserId == -1;

        if (!authUserIsAnonymousGuest) {
            Object userAuthenticationResult = this.userAuthService.authenticateUser(request, authUserId);

            if (userAuthenticationResult instanceof Boolean) {
                if (!(Boolean) userAuthenticationResult) {
                    throw new ForbiddenException("The expressJSBackend1 server could not verify you as " + 
                    "having the proper credentials to be logged in as " + authUserId);
                }
            }
            else if (userAuthenticationResult instanceof String) {
                String errorMessage = (String) userAuthenticationResult;
                
                if (errorMessage.equals("The provided authUser token, if any, in your cookies has an " +
                "invalid structure.")) {
                    throw new ForbiddenException(errorMessage);
                }
    
                throw new BadGatewayException(errorMessage);
            }
            else if (userAuthenticationResult instanceof Object[]) {
                String authToken = (String) ((Object[])userAuthenticationResult)[0];
                long numSecondsTillCookieExpires = (long) ((Object[])userAuthenticationResult)[1];
    
                ResponseCookie cookie = ResponseCookie.from("authToken", authToken)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(numSecondsTillCookieExpires)
                    .sameSite("Strict")
                    .build();
    
                response.addHeader("Set-Cookie", cookie.toString());
            }
        }

        String errorMessage = "";

        Object resultOfGettingAuthorOfStory = this.storyService.getAuthorOfStory(
            storyId,
            true
        );
        if (resultOfGettingAuthorOfStory instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingAuthorOfStory)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        Integer storyAuthorId = (Integer) resultOfGettingAuthorOfStory;

        if (storyAuthorId == null) {
            errorMessage += "• There does not exist a story with the provided storyId\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        if (authUserId != storyAuthorId) {
            Object resultOfCheckingIfAuthUserHasAccessToStoryAuthor = this.userInfoFetchingService.checkIfUser1HasAccessToUser2(
                authUserId,
                storyAuthorId
            );
            if (resultOfCheckingIfAuthUserHasAccessToStoryAuthor instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfCheckingIfAuthUserHasAccessToStoryAuthor)[0] + "\n";
                throw new BadGatewayException(errorMessage);
            }
            else if (resultOfCheckingIfAuthUserHasAccessToStoryAuthor instanceof String) {
                errorMessage += "•  You cannot get the stories of a private user that you do not follow\n";
                throw new ForbiddenException(errorMessage);
            }
            else {
                boolean authUserHasAccessToUser = (boolean) resultOfCheckingIfAuthUserHasAccessToStoryAuthor;
                if (!authUserHasAccessToUser) {
                    errorMessage += "• You are trying to fetch the stories of a user that does not exist\n";
                    throw new ResourceDoesNotExistException(errorMessage);
                }
            }
        }

        Object resultOfGettingOrderedStoriesOfUser = this.storyService.getOrderedStoriesOfUser(
            storyAuthorId,
            true,
            false
        );
        if (resultOfGettingOrderedStoriesOfUser instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingOrderedStoriesOfUser)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        
        ArrayList<HashMap<String, Object>> orderedStoriesOfUser = (ArrayList<HashMap<String, Object>>)
        resultOfGettingOrderedStoriesOfUser;
        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("authorId", storyAuthorId);
        output.put("authorUsername", null);
        output.put("stories", orderedStoriesOfUser);
        output.put("currSlide", 0);

        for(int i=0; i<orderedStoriesOfUser.size(); i++) {
            HashMap<String, Object> storyOfUser = orderedStoriesOfUser.get(i);
            String idOfThisStoryOfUser = (String) storyOfUser.get("id");

            if (idOfThisStoryOfUser.equals(storyId)) {
                output.put("currSlide", i);
                break;
            } 
        }

        output.put("ErrorMessage", errorMessage);
        return output;
    }


    @PostMapping("/getStoryPreviewsOfAtMost4Users/{authUserId}")
    public HashMap<String, Object> getStoryPreviewsOfAtMost4Users(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam HashMap<String, Object> infoOnUsers) throws Exception {
        if (authUserId < 1 && authUserId != -1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId. If you are an anonymous guest, you must " +
                "set the authUserId to -1"
            );
        }

        int[] userIds = null;

        if ((infoOnUsers.containsKey("userIds"))) {
            userIds = (int[]) infoOnUsers.get("userIds");

            if (userIds.length < 5) {
                userIds = Arrays.stream(userIds)
                    .filter(userId -> userId > 0)
                    .toArray();
            }
            else {
                userIds = null;
            }
        }

        if (userIds == null || userIds.length == 0) {
            throw new BadRequestException(
                "No valid users were provided"
            );
        }

        HashMap<Integer, Boolean> usersAndTheirStorySponsorshipStatuses = new HashMap<Integer, Boolean>();

        if ((infoOnUsers.containsKey("storySponsorshipStatusesForUsers"))) {
            boolean[] storySponsorshipStatusesForUsers = (boolean[]) infoOnUsers.get("storySponsorshipStatusesForUsers");

            if (storySponsorshipStatusesForUsers.length == userIds.length) {
                for(int i=0; i<storySponsorshipStatusesForUsers.length; i++) {
                    int userId = userIds[i];
                    boolean storySponsorshipStatusOfThisUser = storySponsorshipStatusesForUsers[i];

                    usersAndTheirStorySponsorshipStatuses.put(userId, storySponsorshipStatusOfThisUser);
                }
            }
            else {
                for(int userId: userIds) {
                    usersAndTheirStorySponsorshipStatuses.put(userId, false);
                } 
            }
        }
        else {
            for(int userId: userIds) {
                usersAndTheirStorySponsorshipStatuses.put(userId, false);
            }
        }

        boolean authUserIsAnonymousGuest = authUserId == -1;
        
        if (authUserIsAnonymousGuest) {
            Object userAuthenticationResult = this.userAuthService.authenticateUser(request, authUserId);

            if (userAuthenticationResult instanceof Boolean) {
                if (!(Boolean) userAuthenticationResult) {
                    throw new ForbiddenException("The expressJSBackend1 server could not verify you as " + 
                    "having the proper credentials to be logged in as " + authUserId);
                }
            }
            else if (userAuthenticationResult instanceof String) {
                String errorMessage = (String) userAuthenticationResult;
                
                if (errorMessage.equals("The provided authUser token, if any, in your cookies has an " +
                "invalid structure.")) {
                    throw new ForbiddenException(errorMessage);
                }
    
                throw new BadGatewayException(errorMessage);
            }
            else if (userAuthenticationResult instanceof Object[]) {
                String authToken = (String) ((Object[])userAuthenticationResult)[0];
                long numSecondsTillCookieExpires = (long) ((Object[])userAuthenticationResult)[1];
    
                ResponseCookie cookie = ResponseCookie.from("authToken", authToken)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(numSecondsTillCookieExpires)
                    .sameSite("Strict")
                    .build();
    
                response.addHeader("Set-Cookie", cookie.toString());
            }
        }

        String errorMessage = "";

        Object resultOfCheckingIfAuthUserHasAccessToMultipleUsers = this.userInfoFetchingService.
        checkIfUser1HasAccessToMultipleUsers(
            authUserId,
            userIds
        );
        if (resultOfCheckingIfAuthUserHasAccessToMultipleUsers instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfCheckingIfAuthUserHasAccessToMultipleUsers)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }

        HashMap<Integer, Object> usersAndTheAccessAuthUserHasToThem =
        (HashMap<Integer, Object>) resultOfCheckingIfAuthUserHasAccessToMultipleUsers;

        userIds = Arrays.stream(userIds)
            .filter(userId ->
                Boolean.TRUE.equals(usersAndTheAccessAuthUserHasToThem.get(userId))
            )
            .toArray();
        
        if (userIds.length == 0) {
            throw new BadRequestException(
                "No valid users were provided"
            );
        }

        HashSet<Integer> setOfUserIds = new HashSet<Integer>();
        for (int userId : userIds) {
            setOfUserIds.add(userId);
        }

        Object resultOfGettingUnexpiredOrderedStoriesOfMultipleUsers = this.storyService.getUnexpiredOrderedStoriesOfMultipleUsers(
            setOfUserIds,
            usersAndTheirStorySponsorshipStatuses
        );
        if (resultOfGettingUnexpiredOrderedStoriesOfMultipleUsers instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUnexpiredOrderedStoriesOfMultipleUsers)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        
        HashMap<Integer, ArrayList<HashMap<String, Object>>> usersAndTheirUnexpiredOrderedStories =
        (HashMap<Integer, ArrayList<HashMap<String, Object>>>) resultOfGettingUnexpiredOrderedStoriesOfMultipleUsers;

        HashSet<String> setOfStoryIdsOfTheUsers = new HashSet<String>();

        for(int userId : setOfUserIds) {
            for (HashMap<String, Object> storyInfo : usersAndTheirUnexpiredOrderedStories.get(userId)) {
                setOfStoryIdsOfTheUsers.add((String) storyInfo.get("id"));
            }
        }

        HashMap<Integer, HashMap<String, Object>> usersAndTheirStoryPreviewInfo = new HashMap<Integer, HashMap<String, Object>>();
        HashSet<String> storyIdsUnseenByAuthUser = new HashSet<String>();

        if (setOfStoryIdsOfTheUsers.size() > 0) {
            try {
                storyIdsUnseenByAuthUser = this.storyViewRepository.getIdsOfStoriesInSetThatAreNotViewedByUser(
                    authUserId,
                    setOfStoryIdsOfTheUsers
                );
            }
            catch (Exception e) {
                errorMessage += "• There was trouble getting your unseen storyIds of the users you provided\n";
                throw new BadGatewayException(errorMessage);
            }
    
            for(int userId : setOfUserIds) {
                ArrayList<HashMap<String, Object>> unexpiredOrderedStoriesOfUser = usersAndTheirUnexpiredOrderedStories.get(userId);
                if (unexpiredOrderedStoriesOfUser.size() == 0) {
                    continue;
                }

                String storyIdOfCurrSlideOfAuthUser = (String) unexpiredOrderedStoriesOfUser.get(0).get("id");
                String storyTypeOfCurrSlideOfAuthUser = (String) unexpiredOrderedStoriesOfUser.get(0).get("type");
                String filenameOfCurrSlideOfAuthUser = (String) unexpiredOrderedStoriesOfUser.get(0).get("filename");

                for(int i=0; i<unexpiredOrderedStoriesOfUser.size(); i++) {
                    HashMap<String, Object> userStory = unexpiredOrderedStoriesOfUser.get(i);
                    String userStoryId = (String) userStory.get("id");

                    if (storyIdsUnseenByAuthUser.contains(userStoryId)) {
                        storyIdOfCurrSlideOfAuthUser = userStoryId;
                        storyTypeOfCurrSlideOfAuthUser = (String) userStory.get("type");
                        filenameOfCurrSlideOfAuthUser = (String) userStory.get("filename");
                        break;
                    }
                }

                byte[] fileBufferOfImgOrVidSlideOfStory = null;

                try {
                    fileBufferOfImgOrVidSlideOfStory = this.storyService.retrieveFileBufferOfImgOrVidSlideOfStory(
                        filenameOfCurrSlideOfAuthUser
                    );
                }
                catch (Exception e) {
                    errorMessage += "There was trouble fetching the file-buffer required for the story-preview of user " +
                    userId;
                    continue;
                }

                HashMap<String, Object> storyPreviewInfoOfThisUser = new HashMap<String, Object>();
                storyPreviewInfoOfThisUser.put("storyId", storyIdOfCurrSlideOfAuthUser);
                storyPreviewInfoOfThisUser.put("fileType", storyTypeOfCurrSlideOfAuthUser);
                storyPreviewInfoOfThisUser.put("fileBuffer", fileBufferOfImgOrVidSlideOfStory);

                usersAndTheirStoryPreviewInfo.put(userId, storyPreviewInfoOfThisUser);
            }
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("usersAndTheirStoryPreviewInfo", usersAndTheirStoryPreviewInfo);

        return output;
    }


    private void processRequest(String clientIPAddress, String endpoint) {
        String key = clientIPAddress + ":" + endpoint;
        Bucket bucket = this.rateLimitBuckets.computeIfAbsent(key, k -> createBucket(endpoint));

        if (bucket.tryConsume(1)) {
            //pass
        }
        else {
            throw new TooManyRequestsException();
        }
    }


    private Bucket createBucket(String endpoint) {
        Bandwidth limit = null;

        switch (endpoint) {
            case "/getOrderedListOfUsersForStoriesSection":
                limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofMinutes(1)));
                break;
            case "/getStoriesOfUser":
                limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
        }

        return Bucket.builder().addLimit(limit).build();
    }


    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }

        return ip.split(",")[0].trim();
    }
}
