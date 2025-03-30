package com.megagram.springBootBackend2.Controllers.GraphQL.AdLinkClick;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestParam;

import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.exceptions.TooManyRequestsException;
import com.megagram.springBootBackend2.models.mssqlServer.AdLinkClick;
import com.megagram.springBootBackend2.repositories.mssqlServer.AdLinkClickRepository;
import com.megagram.springBootBackend2.services.PostInfoFetchingService;
import com.megagram.springBootBackend2.services.UserAuthService;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@Controller
public class Queries {
    @Autowired
    private PostInfoFetchingService postInfoFetchingService;
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private AdLinkClickRepository adLinkClickRepository;

    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();


    public Queries() {}
   

    @QueryMapping
    public ArrayList<HashMap<String, Object>> getBatchOfRecentAdLinkClicksOfSponsoredPost(
    HttpServletRequest request, HttpServletResponse response, @RequestParam int authUserId, @RequestParam
    String overallPostId, @RequestParam List<Integer> idsToExclude) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/graphql-getBatchOfRecentAdLinkClicksOfSponsoredPost");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (ObjectId.isValid(overallPostId)) {
            throw new BadRequestException("The provided overallPostId is invalid");
        }
        
        Object userAuthenticationResult = userAuthService.authenticateUser(request, authUserId);

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


        Object resultOfCheckingIfAuthUserIsPostAuthor = postInfoFetchingService
        .checkIfAuthUserIsAnAuthorOfPost(authUserId, overallPostId);
        if (resultOfCheckingIfAuthUserIsPostAuthor instanceof String[]) {
            if (((String[]) resultOfCheckingIfAuthUserIsPostAuthor)[1].equals("BAD_GATEWAY")) {
                throw new BadGatewayException(((String[]) resultOfCheckingIfAuthUserIsPostAuthor)[0]);
            }

            throw new ResourceDoesNotExistException(((String[]) resultOfCheckingIfAuthUserIsPostAuthor)[0]);
        }
        Boolean authUserIsPostAuthor = (Boolean) resultOfCheckingIfAuthUserIsPostAuthor;
        if (!authUserIsPostAuthor) {
            throw new ForbiddenException(
                "You cannot check the ad-link-clickers of a post that you are not an author of"
            );
        }


        if (idsToExclude == null) {
            idsToExclude = new ArrayList<Integer>();
        }
        HashSet<Integer> setOfIdsToExclude = new HashSet<Integer>(idsToExclude);
        
        ArrayList<AdLinkClick> batchOfRecentAdLinkClickersOfSponsoredPost  = new ArrayList<AdLinkClick>();
        try {
            batchOfRecentAdLinkClickersOfSponsoredPost = adLinkClickRepository
            .getBatchOfAdLinkClicksOfSponsoredPost(
                setOfIdsToExclude, 
                overallPostId,
                25
            );
        }
        catch (Exception e) {
            throw new BadGatewayException(
                "There was trouble getting the batch of recent post ad-link-clickers of this post"
            );
        }
        
        ArrayList<HashMap<String, Object>> output = new  ArrayList<HashMap<String, Object>>();
        for (AdLinkClick recentAdLinkClick : batchOfRecentAdLinkClickersOfSponsoredPost) {
            HashMap<String, Object> relevantAdLinkClickInfo = new HashMap<String, Object>();
            relevantAdLinkClickInfo.put("id", recentAdLinkClick.id);
            relevantAdLinkClickInfo.put("clickerId", recentAdLinkClick.clickerId);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String datetimeOfClickAsString = recentAdLinkClick.datetimeOfClick.format(formatter);
            relevantAdLinkClickInfo.put("datetimeOfClick", datetimeOfClickAsString);

            output.add(relevantAdLinkClickInfo);
        }

        return output;
    }


    @QueryMapping
    public ArrayList<HashMap<String, Object>> getNumAdLinkClicksOfEachSponsoredPostInList(HttpServletRequest request,
    HttpServletResponse response, @RequestParam ArrayList<String> overallPostIds) throws Exception {
        try {
            ArrayList<Object[]> overallPostIdsAndTheirNumAdLinkClicks = this.adLinkClickRepository
            .getNumAdLinkClicksOfEachSponsoredPostInList(
                new HashSet<String>(overallPostIds)
            );

            ArrayList<HashMap<String, Object>> listOfOverallPostIdsAndTheirNumAdLinkClicks = new ArrayList<HashMap<String,
            Object>>();
            for(Object[] overallPostIdAndItsNumAdLinkClicks : overallPostIdsAndTheirNumAdLinkClicks) {
                HashMap<String, Object> infoOnNumAdLinkClicksOfPost = new HashMap<String, Object>();
                infoOnNumAdLinkClicksOfPost.put(
                    "overallPostId",
                    (String) overallPostIdAndItsNumAdLinkClicks[0]
                );

                infoOnNumAdLinkClicksOfPost.put(
                    "numAdLinkClicks",
                    (Integer) overallPostIdAndItsNumAdLinkClicks[1]
                );

                listOfOverallPostIdsAndTheirNumAdLinkClicks.add(
                    infoOnNumAdLinkClicksOfPost
                );
            }

            return listOfOverallPostIdsAndTheirNumAdLinkClicks;
        }
        catch (Exception e) {
            throw new BadGatewayException("There was trouble getting the asked-for data from the database");
        }
    }


    @QueryMapping
    public ArrayList<HashMap<String, Object>> getNumAdLinkClicksByAuthUserToEachSponsoredPostInList(HttpServletRequest request,
    HttpServletResponse response, @RequestParam int authUserId, @RequestParam ArrayList<String> overallPostIds) throws Exception {
        try {
            ArrayList<Object[]> overallPostIdsAndTheirNumAdLinkClicksByAuthUser = this.adLinkClickRepository
            .getNumAdLinkClicksByUserToEachSponsoredPostInList(
                authUserId,
                new HashSet<String>(overallPostIds)
            );

            ArrayList<HashMap<String, Object>> listOfOverallPostIdsAndTheirNumAdLinkClicksByAuthUser = new ArrayList<HashMap<String,
            Object>>();
            for(Object[] overallPostIdAndItsNumAdLinkClicksByAuthUser : overallPostIdsAndTheirNumAdLinkClicksByAuthUser) {
                HashMap<String, Object> infoOnNumAdLinkClicksOfPostByAuthUser = new HashMap<String, Object>();
                infoOnNumAdLinkClicksOfPostByAuthUser.put(
                    "overallPostId",
                    (String) overallPostIdAndItsNumAdLinkClicksByAuthUser[0]
                );

                infoOnNumAdLinkClicksOfPostByAuthUser.put(
                    "numAdLinkClicks",
                    (Integer) overallPostIdAndItsNumAdLinkClicksByAuthUser[1]
                );

                listOfOverallPostIdsAndTheirNumAdLinkClicksByAuthUser.add(
                    infoOnNumAdLinkClicksOfPostByAuthUser
                );
            }

            return listOfOverallPostIdsAndTheirNumAdLinkClicksByAuthUser;
        }
        catch (Exception e) {
            throw new BadGatewayException("There was trouble getting the asked-for data from the database");
        }
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
        Bandwidth limit = Bandwidth.classic(12, Refill.greedy(12, Duration.ofMinutes(1)));

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