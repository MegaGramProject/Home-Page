package com.megagram.springBootBackend2.Controllers.GraphQL.AdLinkClick;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.MutationMapping;
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
public class Mutations {
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private AdLinkClickRepository adLinkClickRepository;
    @Autowired
    private PostInfoFetchingService postInfoFetchingService;

    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();


    public Mutations() {}
    

    @MutationMapping
    public int addAdLinkClickToSponsoredPost(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam String overallPostId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/graphql-addAdLinkClickToSponsoredPost");

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


        Object resultOfCheckingIfPostIsSponsored = postInfoFetchingService
        .checkIfPostIsSponsored(overallPostId);
        if (resultOfCheckingIfPostIsSponsored instanceof String[]) {
            if (((String[]) resultOfCheckingIfPostIsSponsored)[1].equals("BAD_GATEWAY")) {
                throw new BadGatewayException(((String[]) resultOfCheckingIfPostIsSponsored)[0]);
            }

            throw new ResourceDoesNotExistException(((String[]) resultOfCheckingIfPostIsSponsored)[0]);
        }
        Boolean postIsSponsored = (Boolean) resultOfCheckingIfPostIsSponsored;
        if (!postIsSponsored) {
            throw new BadRequestException(
                "You cannot add an ad-link-click to a post that is not sponsored"
            );
        }

        Object resultOfCheckingIfAuthUserHasAccessToPost = postInfoFetchingService
        .checkIfAuthUserHasAccessToPost(authUserId, overallPostId);
        if (resultOfCheckingIfAuthUserHasAccessToPost instanceof String[]) {
            if (((String[]) resultOfCheckingIfAuthUserHasAccessToPost)[1].equals("BAD_GATEWAY")) {
                throw new BadGatewayException(((String[]) resultOfCheckingIfAuthUserHasAccessToPost)[0]);
            }
            else if (((String[]) resultOfCheckingIfAuthUserHasAccessToPost)[1].equals("UNAUTHORIZED")) {
                throw new ForbiddenException(((String[]) resultOfCheckingIfAuthUserHasAccessToPost)[0]);
            }
            
            throw new ResourceDoesNotExistException(((String[]) resultOfCheckingIfAuthUserHasAccessToPost)[0]);
        }

        
        AdLinkClick newAdLinkClick = new AdLinkClick(overallPostId, authUserId);
        try {
            adLinkClickRepository.save(newAdLinkClick);
            return newAdLinkClick.id;
        }
        catch (Exception e) {
            throw new BadGatewayException(
                "There was trouble adding your add-link-click into the database"
            );
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
