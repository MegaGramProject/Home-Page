package com.megagram.springBootBackend2.Controllers.RestAPI.Story;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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


    @GetMapping("/getOrderedListOfUsernamesForStoriesSection/{authUserId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getOrderedListOfUsernamesForStoriesSection(HttpServletRequest request,
    HttpServletResponse response, @RequestParam int authUserId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/getOrderedListOfUsernamesForStoriesSection");

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


        ArrayList<Integer> idsOfMostViewedStoryAuthorsForAuthUser = new ArrayList<Integer>();
        HashSet<Integer> setOfIdsOfMostViewedStoryAuthorsForAuthUser = new HashSet<Integer>();
        
        try {
            idsOfMostViewedStoryAuthorsForAuthUser = this.storyViewRepository
            .getAuthorIdsOfThoseInSetThatUserGivesMostStoryViewsTo(
                authUserId,
                setOfAuthorIdsOfStoriesAvailableToAuthUser,
                22
            );

            setOfIdsOfMostViewedStoryAuthorsForAuthUser = new HashSet<Integer>(
                idsOfMostViewedStoryAuthorsForAuthUser
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble getting the users in your followings that you give the " +
            "most story-views to\n";
        }

        ArrayList<Integer> orderedListOfUsernamesForStoriesSection = new ArrayList<Integer>();
        for (int authorId : idsOfMostViewedStoryAuthorsForAuthUser) {
            orderedListOfUsernamesForStoriesSection.add(authorId);
        }

        if (orderedListOfUsernamesForStoriesSection.size() < 22) {
            for(int authorId: setOfAuthorIdsOfStoriesAvailableToAuthUser) {
                if (!setOfIdsOfMostViewedStoryAuthorsForAuthUser.contains(authorId)) {
                    orderedListOfUsernamesForStoriesSection.add(authorId);

                    if (orderedListOfUsernamesForStoriesSection.size() == 22) {
                        break;
                    }
                }
            }
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("orderedListOfUsernamesForStoriesSection", orderedListOfUsernamesForStoriesSection);
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }

    
    @GetMapping("/getStoriesOfUser/{authUserId}/{userId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getStoriesOfUser(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam int userId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/getStoriesOfUser");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (userId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided userId"
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
            userId
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

        int currSlideOfAuthUser = -1;
        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("orderedStoriesOfUser", orderedStoriesOfUser);

        if (orderedStoriesOfUser.size() == 0) {
            output.put("ErrorMessage", errorMessage);
            return output;
        }

        try {
            HashSet<String> storyIdsUnseenByAuthUser = this.storyViewRepository.getIdsOfStoriesInSetThatAreNotViewedByUser(
                authUserId,
                setOfStoryIdsOfUser
            );

            if (storyIdsUnseenByAuthUser.size() > 0) {
                for(int i=0; i<orderedStoriesOfUser.size(); i++) {
                    HashMap<String, Object> storyForUser = orderedStoriesOfUser.get(i);
                    String storyId = (String) storyForUser.get("id");
                    
                    if (storyIdsUnseenByAuthUser.contains(storyId)) {
                        currSlideOfAuthUser = i;
                        break;
                    }
                }    
            }
        }
        catch (Exception e) {
            errorMessage += "• There was getting your currSlide in the stories of this user\n";
        }

        output.put("currSlideOfAuthUser", currSlideOfAuthUser);
        output.put("ErrorMessage", errorMessage);
        
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
            case "/getOrderedListOfUsernamesForStoriesSection":
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
