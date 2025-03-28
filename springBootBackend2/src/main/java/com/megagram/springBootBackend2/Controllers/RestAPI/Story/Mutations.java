package com.megagram.springBootBackend2.Controllers.RestAPI.Story;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.exceptions.TooManyRequestsException;
import com.megagram.springBootBackend2.models.oracleSQL.StoryView;
import com.megagram.springBootBackend2.repositories.oracleSQL.StoryViewRepository;
import com.megagram.springBootBackend2.services.StoryService;
import com.megagram.springBootBackend2.services.UserAuthService;
import com.megagram.springBootBackend2.services.UserInfoFetchingService;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@RestController
public class Mutations {
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private StoryViewRepository storyViewRepository;
    @Autowired
    private StoryService storyService;
    @Autowired
    private UserInfoFetchingService userInfoFetchingService;

    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();

    
    public Mutations() {}


    @PostMapping("/addViewToStory/{authUserId}/{storyId}")
    public HashMap<String, Object> addViewToStory(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam String storyId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/addViewToStory");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        try {
            UUID.fromString(storyId);
        }
        catch (IllegalArgumentException e) {
            throw new BadRequestException(
                "There does not exist a story with the provided storyId"
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

        Object resultOfGettingAuthorOfStory = this.storyService.getAuthorOfStory(
            storyId
        );
        if (resultOfGettingAuthorOfStory instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingAuthorOfStory)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        
        int storyAuthorId = (int) resultOfGettingAuthorOfStory;

        Object resultOfCheckingIfAuthUserHasAccessToUser = this.userInfoFetchingService.checkIfUser1HasAccessToUser2(
            authUserId,
            storyAuthorId
        );
        if (resultOfCheckingIfAuthUserHasAccessToUser instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfCheckingIfAuthUserHasAccessToUser)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        else if (resultOfCheckingIfAuthUserHasAccessToUser instanceof String) {
            errorMessage += "•  You cannot add a view to a story of a private user that you do not follow\n";
            throw new ForbiddenException(errorMessage);
        }
        else {
            boolean authUserHasAccessToUser = (boolean) resultOfCheckingIfAuthUserHasAccessToUser;
            if (!authUserHasAccessToUser) {
                errorMessage += "• You are trying to add a view to a story of a private user that does not exist\n";
                throw new ResourceDoesNotExistException(errorMessage);
            }
        }

        StoryView newStoryView = new StoryView(storyId, storyAuthorId, authUserId);

        try {
            this.storyViewRepository.save(newStoryView);
        }
        catch (Exception e) {
            errorMessage += "• There was trouble adding the story-view into the database\n";
            throw new BadGatewayException(errorMessage);
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @PostMapping("/uploadStoryOrStories/{authUserId}")
    public HashMap<String, Object> uploadStoryOrStories(HttpServletRequest request, HttpServletResponse
    response, @RequestParam int authUserId, @RequestBody HashMap<String, Object> newStoryInfo, @RequestParam("files")
    MultipartFile[] storySlideFilesToUpload) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/uploadStoryOrStories");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        ArrayList<MultipartFile> storiesToUpload = new ArrayList<MultipartFile>();

        for (MultipartFile storySlideFile : storySlideFilesToUpload) {
            if (!storySlideFile.isEmpty() &&  (storySlideFile.getContentType().startsWith("image/") ||
            storySlideFile.getContentType().startsWith("video/"))) {
                storiesToUpload.add(storySlideFile);
            }
        }

        if (storiesToUpload.size() == 0) {
            throw new BadRequestException(
                "You didn't upload any img/vid files for your story"
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

        if (storiesToUpload.size() > 11) {
            storiesToUpload = new ArrayList<MultipartFile>(
                storiesToUpload.subList(0, 11)
            );
            errorMessage += "• Only the first 11 img/vid files that have been uploaded to this endpoint are considered\n";
        }

        Object resultOfGettingNumUnexpiredStoriesOfUser = this.storyService.getNumberOfUnexpiredStoriesOfUser(authUserId);
        if (resultOfGettingNumUnexpiredStoriesOfUser instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingNumUnexpiredStoriesOfUser)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }

        int numStoriesThatCanBeUploaded = (int) resultOfGettingNumUnexpiredStoriesOfUser;

        if (numStoriesThatCanBeUploaded == 11) {
            errorMessage += "• You already have 11 unexpired stories at the moment, which is the maximum\n";
            throw new BadRequestException(errorMessage);
        }

        ArrayList<String> idsOfNewlyPostedStories = new ArrayList<String>();

        for(MultipartFile storyToUpload : storiesToUpload.subList(0, numStoriesThatCanBeUploaded)) {
            try {
                UUID uuid = UUID.randomUUID();
                String newStoryId = uuid.toString();
                String[] partsOfStoryContentType = storyToUpload.getContentType().split("/");

                this.storyService.uploadFile(
                    authUserId + "/" + newStoryId + "." + partsOfStoryContentType[1], 
                    storyToUpload
                );

                idsOfNewlyPostedStories.add(newStoryId);
            }
            catch (Exception e) {
                errorMessage += "• There was trouble uploading the file which had the name " +
                storyToUpload.getOriginalFilename() + "\n";
            }
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("idsOfNewlyPostedStories", idsOfNewlyPostedStories);
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @DeleteMapping("/deleteStory/{authUserId}/{storyId}")
    public HashMap<String, Object> deleteStory(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam String storyId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/deleteStory");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        try {
            UUID.fromString(storyId);
        }
        catch (IllegalArgumentException e) {
            throw new BadRequestException(
                "There does not exist a story with the provided storyId"
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
        boolean storyWasFound = false;

        try {
            storyWasFound = this.storyService.deleteFile(authUserId + "/" + storyId);
        }
        catch (Exception e) {
            errorMessage += "• There was trouble deleting your story from the database\n";
        }


        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("storyWasFound", storyWasFound);
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
            case "/addViewToStory":
                limit = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)));
                break;
            case "/uploadStoryOrStories":
                limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofMinutes(1)));
                break;
            case "/deleteStory":
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
