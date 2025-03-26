package com.megagram.springBootBackend2.Controllers.RestAPI.UserConvo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserConvoRepository;
import com.megagram.springBootBackend2.services.ConvoInfoFetchingService;
import com.megagram.springBootBackend2.services.EncryptionAndDecryptionService;
import com.megagram.springBootBackend2.services.UserAuthService;
import com.megagram.springBootBackend2.services.UserInfoFetchingService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@SuppressWarnings("unchecked")
@RestController
public class Mutations {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private UserInfoFetchingService userInfoFetchingService;
    @Autowired
    private EncryptionAndDecryptionService encryptionAndDecryptionService;
    @Autowired
    private ConvoInfoFetchingService convoInfoFetchingService;
    @Autowired
    private UserConvoRepository userConvoRepository;

    
    public Mutations() {}


    @PostMapping("/createNewConvo/{authUserId}")
    public HashMap<String, Object> createNewConvo(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestBody HashMap<String, Object> convoInfo) throws Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        ArrayList<Integer> membersOfNewConvo = (ArrayList<Integer>)
        convoInfo.getOrDefault("members", null);

        membersOfNewConvo = (ArrayList<Integer>) membersOfNewConvo.stream()
            .filter(x -> x != authUserId && x > 0)
            .collect(Collectors.toList());
        
        if (membersOfNewConvo.size() == 0) {
            throw new BadRequestException(
                "You must provide a valid list of ids of members you would like to converse with"
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

        if (membersOfNewConvo.size() > 250) {
            errorMessage += "• Only the first 250 user-ids were considered for membership in this new " +
            "group-chat\n";
            membersOfNewConvo = new ArrayList<Integer> (
                membersOfNewConvo.subList(0, 250)
            );
        }

        Object resultOfGettingUsersThatExist = this.userInfoFetchingService.getUserIdsThatExistInList(
            authUserId,
            membersOfNewConvo
        );
        if (resultOfGettingUsersThatExist instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUsersThatExist)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        ArrayList<Integer> validMembersOfNewConvo = (ArrayList<Integer>) resultOfGettingUsersThatExist;
        
        if (validMembersOfNewConvo.size() == 0) {
            throw new BadRequestException(
                "None of the provided members exist"
            );
        }
    
        validMembersOfNewConvo.add(0, authUserId);

        ArrayList<Integer> statusesOfMembersOfNewConvo = new ArrayList<Integer>();
        ArrayList<String> datetimeOfEarliestMsgShownPerMember = new ArrayList<String>();
        ArrayList<Boolean> hasUnseenMessageOfEachMember = new ArrayList<Boolean>();

        statusesOfMembersOfNewConvo.add(1);
        datetimeOfEarliestMsgShownPerMember.add("beginning");
        hasUnseenMessageOfEachMember.add(false);

        for(int i=1; i<validMembersOfNewConvo.size(); i++) {
            statusesOfMembersOfNewConvo.add(0);
            datetimeOfEarliestMsgShownPerMember.add("beginning");
            hasUnseenMessageOfEachMember.add(true);
        }

        String titleOfNewConvo = (String) convoInfo.getOrDefault("title", null);
        
        if (titleOfNewConvo != null && titleOfNewConvo.length() > 50) {
            titleOfNewConvo = titleOfNewConvo.substring(0,47) + "...";
            errorMessage += "• The title has been trimmed down to 47 characters followed by an " +
            "'...' to fit the 50-char-limit\n";
        }

        String keyIdOfNewAWSCMK = this.encryptionAndDecryptionService.createNewAWSCustomerMasterKey(
            "for encrypting/decrypting the data-encryption-key used for the encryption/decryption of " +
            " sensitive UserConvo data"
        );
        if (keyIdOfNewAWSCMK == null) {
            errorMessage += "• There was trouble creating the AWS Customer Master Key which is " +
            "required for encrypting/decrypting the data-encryption-key used for the encryption/" +
            "decryption of sensitive data of this convo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[][] resultOfCreatingAndEncryptingDataEncryptionKey = this.encryptionAndDecryptionService.
        createNewAWSDataEncryptionKey(keyIdOfNewAWSCMK);

        if (resultOfCreatingAndEncryptingDataEncryptionKey.length == 0) {
            errorMessage += "• There was trouble creating and encrypting the data-encryption-key " +
            "used for the encryption/decryption of sensitive data of this convo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[] plaintextDataEncryptionKey = resultOfCreatingAndEncryptingDataEncryptionKey[0];
        byte[] encryptedDataEncryptionKey = resultOfCreatingAndEncryptingDataEncryptionKey[1];

        byte[] encryptedTitle = null;
        byte[] titleEncryptionIv = null;
        byte[] titleEncryptionAuthTag = null;

        if (titleOfNewConvo != null) {
            byte[][] titleEncryptionInfo = this.encryptionAndDecryptionService
            .encryptTextWithAWSDataEncryptionKey(
                titleOfNewConvo, 
                plaintextDataEncryptionKey
            ); 
            encryptedTitle = titleEncryptionInfo[0];
            titleEncryptionIv = titleEncryptionInfo[1];
            titleEncryptionAuthTag = titleEncryptionInfo[2];
        }

        byte[] encryptedMembers;
        byte[] membersEncryptionIv;
        byte[] membersEncryptionAuthTag;

        ObjectMapper objectMapper = new ObjectMapper();
        String validMembersOfNewConvoAsJSONString = objectMapper.writeValueAsString(
            validMembersOfNewConvo
        );

        byte[][] membersEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            validMembersOfNewConvoAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        encryptedMembers = membersEncryptionInfo[0];
        membersEncryptionIv = membersEncryptionInfo[1];
        membersEncryptionAuthTag = membersEncryptionInfo[2];

        byte[] encryptedMemberStatuses;
        byte[] memberStatusesEncryptionIv;
        byte[] memberStatusesEncryptionAuthTag;

        String memberStatusesAsJSONString = objectMapper.writeValueAsString(
            statusesOfMembersOfNewConvo
        );

        byte[][] memberStatusesEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            memberStatusesAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        encryptedMemberStatuses = memberStatusesEncryptionInfo[0];
        memberStatusesEncryptionIv = memberStatusesEncryptionInfo[1];
        memberStatusesEncryptionAuthTag = memberStatusesEncryptionInfo[2];

        byte[] encDatetimeOfEarliestMsgShownPerMember;
        byte[] datetimeOfEarliestMsgShownPerMemberEncryptionIv;
        byte[] datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag;

        String datetimeOfEarliestMsgShownPerMemberAsJSONString = objectMapper.writeValueAsString(
            datetimeOfEarliestMsgShownPerMember
        );

        byte[][] datetimeOfEarliestMsgShownPerMemberEncInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            datetimeOfEarliestMsgShownPerMemberAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        encDatetimeOfEarliestMsgShownPerMember = datetimeOfEarliestMsgShownPerMemberEncInfo[0];
        datetimeOfEarliestMsgShownPerMemberEncryptionIv = datetimeOfEarliestMsgShownPerMemberEncInfo[1];
        datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag = datetimeOfEarliestMsgShownPerMemberEncInfo
        [2];

        boolean[] hasUnseenMessageOfEachMemberAsBooleanArray = new boolean[
            hasUnseenMessageOfEachMember.size()
        ];
        for (int i = 0; i < hasUnseenMessageOfEachMemberAsBooleanArray.length; i++) {
            hasUnseenMessageOfEachMemberAsBooleanArray[i] = hasUnseenMessageOfEachMember.get(i);
        }
    
        int idOfNewUserConvo;

        UserConvo newUserConvo = new UserConvo();
        newUserConvo.setEncryptedTitle(
            encryptedTitle
        );
        newUserConvo.setTitleEncryptionIv(
            titleEncryptionIv
        );
        newUserConvo.setTitleEncryptionAuthTag(
            titleEncryptionAuthTag
        );

        newUserConvo.setEncryptedMembers(
            encryptedMembers
        );
        newUserConvo.setMembersEncryptionIv(
            membersEncryptionIv
        );
        newUserConvo.setMembersEncryptionAuthTag(
            membersEncryptionAuthTag
        );

        newUserConvo.setEncryptedMemberStatuses(
            encryptedMemberStatuses
        );
        newUserConvo.setMemberStatusesEncryptionIv(
            memberStatusesEncryptionIv
        );
        newUserConvo.setMemberStatusesEncryptionAuthTag(
            memberStatusesEncryptionAuthTag
        );

        newUserConvo.setEncryptedDataEncryptionKey(
            encryptedDataEncryptionKey
        );

        newUserConvo.setEncDatetimeOfEarliestMsgShownPerMember(
            encDatetimeOfEarliestMsgShownPerMember
        );
        newUserConvo.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
            datetimeOfEarliestMsgShownPerMemberEncryptionIv
        );
        newUserConvo.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
            datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag
        );

        newUserConvo.setHasUnseenMessageOfEachMember(
            hasUnseenMessageOfEachMemberAsBooleanArray
        );

        newUserConvo.setAwsCMKId(keyIdOfNewAWSCMK);

        try {
            userConvoRepository.save(newUserConvo);
            idOfNewUserConvo = newUserConvo.getId();
        }
        catch (Exception e) {
            errorMessage += "• There was trouble adding the new convo into the database\n";
            throw new BadGatewayException(errorMessage);
        }

        try {
            HashMap<String, Object> detailsOfNewConvo = new HashMap<String, Object>();
            detailsOfNewConvo.put(
                "encryptedTitle",
                encryptedTitle
            );
            detailsOfNewConvo.put(
                "titleEncryptionIv",
                titleEncryptionIv
            );
            detailsOfNewConvo.put(
                "titleEncryptionAuthTag",
                titleEncryptionAuthTag
            );

            detailsOfNewConvo.put(
                "encryptedMembers",
                encryptedMembers
            );
            detailsOfNewConvo.put(
                "membersEncryptionIv",
                membersEncryptionIv
            );
            detailsOfNewConvo.put(
                "membersEncryptionAuthTag",
                membersEncryptionAuthTag
            );

            detailsOfNewConvo.put(
                "encryptedMemberStatuses",
                encryptedMemberStatuses
            );
            detailsOfNewConvo.put(
                "memberStatusesEncryptionIv",
                memberStatusesEncryptionIv
            );
            detailsOfNewConvo.put(
                "memberStatusesEncryptionAuthTag",
                memberStatusesEncryptionAuthTag
            );

            detailsOfNewConvo.put(
                "encryptedDataEncryptionKey",
                encryptedDataEncryptionKey
            );

            detailsOfNewConvo.put(
                "encDatetimeOfEarliestMsgShownPerMember",
                encDatetimeOfEarliestMsgShownPerMember
            );
            detailsOfNewConvo.put(
                "datetimeOfEarliestMsgShownPerMemberEncryptionIv",
                datetimeOfEarliestMsgShownPerMemberEncryptionIv
            );
            detailsOfNewConvo.put(
                "datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag",
                datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag
            );


            String hasUnseenMessageOfEachMemberAsString = objectMapper.writeValueAsString(
                hasUnseenMessageOfEachMemberAsBooleanArray
            );

            detailsOfNewConvo.put(
                "hasUnseenMessageOfEachMember",
                hasUnseenMessageOfEachMemberAsString
            );

            detailsOfNewConvo.put(
                "awsCMKId",
                keyIdOfNewAWSCMK
            );

            this.redisTemplate.opsForHash().putAll(
                "detailsForConvo" + idOfNewUserConvo, 
                detailsOfNewConvo
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating the cache of the details of this new userConvo\n";
            throw new BadGatewayException(errorMessage);
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("idOfNewUserConvo", idOfNewUserConvo);
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @PatchMapping("/requestSomeoneToJoinConvo/{authUserId}/{convoId}/{newMemberId}")
    public HashMap<String, Object> requestSomeoneToJoinConvo(HttpServletRequest request, HttpServletResponse
    response, @RequestParam int authUserId, @RequestParam int convoId, @RequestParam int newMemberId)
    throws Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (convoId < 1) {
            throw new BadRequestException(
                "There does not exist a convo with the provided convoId"
            );
        }

        if (newMemberId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided newMemberId"
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

        Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
            authUserId
        );
        if (resultOfGettingUserBlockings instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;
        
        Object resultOfCheckingIfNewMemberExists = this.userInfoFetchingService.getUserIdsThatExistInList(
            authUserId,
            (ArrayList<Integer>) Arrays.asList(newMemberId)
        );
        if (resultOfCheckingIfNewMemberExists instanceof String[]) {
            errorMessage += "•" + ((String[]) resultOfCheckingIfNewMemberExists)[0] + "\n";
        }
        ArrayList<Integer> userIdsThatExistInList = (ArrayList<Integer>) resultOfCheckingIfNewMemberExists;
        if (userIdsThatExistInList.size() == 0) {
            errorMessage += "• The user you are trying to request does not exist\n";
            throw new BadRequestException(errorMessage); 
        }

        Object resultOfGettingDetailsOfConvo = this.convoInfoFetchingService.getConvoDetails(
            convoId,
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvo instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvo)[0] + "\n";
            if (((String[]) resultOfGettingDetailsOfConvo)[1].equals("NOT_FOUND")) {
                throw new ResourceDoesNotExistException(((String[]) resultOfGettingDetailsOfConvo)[0]);
            }
            throw new BadGatewayException(errorMessage);
        }
        UserConvo convoDetails = (UserConvo) resultOfGettingDetailsOfConvo;


        byte[] encryptedDataEncryptionKey = convoDetails.getEncryptedDataEncryptionKey();
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.
        decryptEncryptedAWSDataEncryptionKey(encryptedDataEncryptionKey);

        if(plaintextDataEncryptionKey == null) {
            errorMessage += "• There was trouble decrypting the encrypted data-encryption-key of this " +
            "UserConvo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[] encryptedMembersOfConvo = convoDetails.getEncryptedMembers();
        String membersOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedMembersOfConvo,
            plaintextDataEncryptionKey,
            convoDetails.getMembersEncryptionIv(),
            convoDetails.getMembersEncryptionAuthTag()
        );
         
        ArrayList<Integer> membersOfConvo = null;

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
        }
        catch (IOException e) { }

        boolean authUserIsMemberOfConvo = false;
        boolean newUserIsAlreadyMemberOfConvo = false;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int convoMember : membersOfConvo) {
            if(convoMember == authUserId) {
                authUserIsMemberOfConvo = true;
            }
            else if (convoMember == newMemberId) {
                newUserIsAlreadyMemberOfConvo = true;
            }

            if (convoMember != authUserId && !setOfAuthUserBlockings.contains(convoMember)) {
                authUserIsBlockedByEachConvoMember = false;
            }
        }

        if (!authUserIsMemberOfConvo) {
            errorMessage += "• You cannot request new members into a user-convo that you aren't a " + 
            "member of\n";
            throw new ForbiddenException(errorMessage);
        }

        if (newUserIsAlreadyMemberOfConvo) {
            errorMessage += "• You cannot request new members into a user-convo wherein the member " + 
            "already exists\n";
            throw new BadRequestException(errorMessage);
        }
        
        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        membersOfConvo.add(newMemberId);

        boolean[] hasUnseenMessageOfEachMember = convoDetails.getHasUnseenMessageOfEachMember();
        boolean[] newHasUnseenMessageOfEachMember = new boolean[hasUnseenMessageOfEachMember.length+1];

        for(int i=0; i<hasUnseenMessageOfEachMember.length; i++) {
            newHasUnseenMessageOfEachMember[i] = hasUnseenMessageOfEachMember[i];
        }
        newHasUnseenMessageOfEachMember[hasUnseenMessageOfEachMember.length] = true;

        byte[] encryptedConvoMemberStatuses = convoDetails.getEncryptedMemberStatuses();
        String memberStatusesOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedConvoMemberStatuses,
            plaintextDataEncryptionKey,
            convoDetails.getMemberStatusesEncryptionIv(),
            convoDetails.getMemberStatusesEncryptionAuthTag()
        );
         
        ArrayList<Integer> memberStatusesOfConvo = null;

        try {
            memberStatusesOfConvo = objectMapper.readValue(
                memberStatusesOfConvoAsString, 
                ArrayList.class
            );
        }
        catch (IOException e) { }

        memberStatusesOfConvo.add(0);

        byte[] encDatetimeOfEarliestMsgShownPerMember = convoDetails
        .getEncDatetimeOfEarliestMsgShownPerMember();
        String datetimeOfEarliestMsgShownPerMemberAsString = this.encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            encDatetimeOfEarliestMsgShownPerMember,
            plaintextDataEncryptionKey,
            convoDetails.getDatetimeOfEarliestMsgShownPerMemberEncryptionIv(),
            convoDetails.getDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag()
        );
         
        ArrayList<String> datetimeOfEarliestMsgShownPerMember = null;

        try {
            datetimeOfEarliestMsgShownPerMember = objectMapper.readValue(
                datetimeOfEarliestMsgShownPerMemberAsString, 
                ArrayList.class
            );
        }
        catch (IOException e) { }

        datetimeOfEarliestMsgShownPerMember.add("beginning");

        byte[] newEncryptedMembers;
        byte[] newMembersEncryptionIv;
        byte[] newMembersEncryptionAuthTag;

        String newMembersOfConvoAsJSONString = objectMapper.writeValueAsString(
            membersOfConvo
        );

        byte[][] newMembersEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            newMembersOfConvoAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        newEncryptedMembers = newMembersEncryptionInfo[0];
        newMembersEncryptionIv = newMembersEncryptionInfo[1];
        newMembersEncryptionAuthTag = newMembersEncryptionInfo[2];

        byte[] newEncryptedMemberStatuses;
        byte[] newMemberStatusesEncryptionIv;
        byte[] newMemberStatusesEncryptionAuthTag;

        String memberStatusesOfConvoAsJSONString = objectMapper.writeValueAsString(
            memberStatusesOfConvo
        );

        byte[][] newMemberStatusesEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            memberStatusesOfConvoAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        newEncryptedMemberStatuses = newMemberStatusesEncryptionInfo[0];
        newMemberStatusesEncryptionIv = newMemberStatusesEncryptionInfo[1];
        newMemberStatusesEncryptionAuthTag = newMemberStatusesEncryptionInfo[2];

        byte[] newEncDatetimeOfEarliestMsgShownPerMember;
        byte[] newDatetimeOfEarliestMsgShownPerMemberEncryptionIv;
        byte[] newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag;

        String datetimeOfEarliestMsgShownPerMemberAsJSONString = objectMapper.writeValueAsString(
            datetimeOfEarliestMsgShownPerMember
        );

        byte[][] newDatetimeOfEarliestMsgShownPerMemberEncInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            datetimeOfEarliestMsgShownPerMemberAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        newEncDatetimeOfEarliestMsgShownPerMember = newDatetimeOfEarliestMsgShownPerMemberEncInfo[0];
        newDatetimeOfEarliestMsgShownPerMemberEncryptionIv = newDatetimeOfEarliestMsgShownPerMemberEncInfo[1];
        newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag = newDatetimeOfEarliestMsgShownPerMemberEncInfo[2];

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoId);
            UserConvo userConvoToUpdate = userConvoOptional.get();

            userConvoToUpdate.setEncryptedMembers(newEncryptedMembers);
            userConvoToUpdate.setMembersEncryptionIv(newMembersEncryptionIv);
            userConvoToUpdate.setMembersEncryptionAuthTag(newMembersEncryptionAuthTag);

            userConvoToUpdate.setEncryptedMemberStatuses(newEncryptedMemberStatuses);
            userConvoToUpdate.setMemberStatusesEncryptionIv(newMemberStatusesEncryptionIv);
            userConvoToUpdate.setMemberStatusesEncryptionAuthTag(newMemberStatusesEncryptionAuthTag);

            userConvoToUpdate.setEncDatetimeOfEarliestMsgShownPerMember(
                newEncDatetimeOfEarliestMsgShownPerMember
            );
            userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                newDatetimeOfEarliestMsgShownPerMemberEncryptionIv
            );
            userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag
            );

            userConvoToUpdate.setHasUnseenMessageOfEachMember(
                newHasUnseenMessageOfEachMember
            );
            
            this.userConvoRepository.save(userConvoToUpdate);
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating the convo-details in the database\n";
            throw new BadGatewayException(errorMessage);
        }

        try {
            HashMap<String, Object> updatedDetailsOfConvo = new HashMap<String, Object>();
            updatedDetailsOfConvo.put(
                "encryptedMembers",
                newEncryptedMembers
            );
            updatedDetailsOfConvo.put(
                "membersEncryptionIv",
                newMembersEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "membersEncryptionAuthTag",
                newMembersEncryptionAuthTag
            );

            updatedDetailsOfConvo.put(
                "encryptedMemberStatuses",
                newEncryptedMemberStatuses
            );
            updatedDetailsOfConvo.put(
                "memberStatusesEncryptionIv",
                newMemberStatusesEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "memberStatusesEncryptionAuthTag",
                newMemberStatusesEncryptionAuthTag
            );

            updatedDetailsOfConvo.put(
                "encDatetimeOfEarliestMsgShownPerMember",
                encDatetimeOfEarliestMsgShownPerMember
            );
            updatedDetailsOfConvo.put(
                "datetimeOfEarliestMsgShownPerMemberEncryptionIv",
                newDatetimeOfEarliestMsgShownPerMemberEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag",
                newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag
            );


            String newHasUnseenMessageOfEachMemberAsString = objectMapper.writeValueAsString(
                newHasUnseenMessageOfEachMember
            );

            updatedDetailsOfConvo.put(
                "hasUnseenMessageOfEachMember",
                newHasUnseenMessageOfEachMemberAsString
            );

            this.redisTemplate.opsForHash().putAll(
                "detailsForConvo" + convoId, 
                updatedDetailsOfConvo
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating the caching of the convo-details\n";
            throw new BadGatewayException(errorMessage);
        }
        
        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @PatchMapping("/setTitleOfConvo/{authUserId}/{convoId}/{newTitle}")
    public HashMap<String, Object> setTitleOfConvo(HttpServletRequest request, HttpServletResponse 
    response, @RequestParam int authUserId, @RequestParam int convoId, @RequestBody HashMap<String, 
    String> newTitleInfo) throws Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (convoId < 1) {
            throw new BadRequestException(
                "There does not exist a convo with the provided convoId"
            );
        }

        if (newTitleInfo == null || !newTitleInfo.containsKey("newTitle")) {
            throw new BadRequestException(
                "You didn't provide the info required for setting the title of this convo"
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

        Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
            authUserId
        );
        if (resultOfGettingUserBlockings instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;

        Object resultOfGettingDetailsOfConvo = this.convoInfoFetchingService.getConvoDetails(
            convoId,
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvo instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvo)[0] + "\n";
            if (((String[]) resultOfGettingDetailsOfConvo)[1].equals("NOT_FOUND")) {
                throw new ResourceDoesNotExistException(((String[]) resultOfGettingDetailsOfConvo)[0]);
            }
            throw new BadGatewayException(errorMessage);
        }
        UserConvo convoDetails = (UserConvo) resultOfGettingDetailsOfConvo;


        byte[] encryptedDataEncryptionKey = convoDetails.getEncryptedDataEncryptionKey();
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.
        decryptEncryptedAWSDataEncryptionKey(encryptedDataEncryptionKey);

        if(plaintextDataEncryptionKey == null) {
            errorMessage += "• There was trouble decrypting the encrypted data-encryption-key of this " +
            "UserConvo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[] encryptedMembersOfConvo = convoDetails.getEncryptedMembers();
        String membersOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedMembersOfConvo,
            plaintextDataEncryptionKey,
            convoDetails.getMembersEncryptionIv(),
            convoDetails.getMembersEncryptionAuthTag()
        );
         
        ArrayList<Integer> membersOfConvo = null;

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
        }
        catch (IOException e) { }

        boolean authUserIsMemberOfConvo = false;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int convoMember : membersOfConvo) {
            if(convoMember == authUserId) {
                authUserIsMemberOfConvo = true;
            }
            else if (!setOfAuthUserBlockings.contains(convoMember)) {
                authUserIsBlockedByEachConvoMember = false;
            }
        }

        if (!authUserIsMemberOfConvo) {
            errorMessage += "• You cannot set the title of a user-convo that you aren't a " + 
            "member of\n";
            throw new ForbiddenException(errorMessage);
        }

        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        String newTitleOfConvo = newTitleInfo.get("newTitle");

        if (newTitleOfConvo.length() > 50) {
            newTitleOfConvo = newTitleOfConvo.substring(0,47) + "...";
            errorMessage += "• The new title has been trimmed down to 47 characters followed by an " +
            "'...' to fit the 50-char-limit\n";
        }

        byte[] newEncryptedTitle;
        byte[] newTitleEncryptionIv;
        byte[] newTitleEncryptionAuthTag;

        byte[][] newTitleEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            newTitleOfConvo, 
            plaintextDataEncryptionKey
        ); 
        newEncryptedTitle = newTitleEncryptionInfo[0];
        newTitleEncryptionIv = newTitleEncryptionInfo[1];
        newTitleEncryptionAuthTag = newTitleEncryptionInfo[2];

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoId);
            UserConvo userConvoToUpdate = userConvoOptional.get();
            
            userConvoToUpdate.setEncryptedTitle(newEncryptedTitle);
            userConvoToUpdate.setTitleEncryptionIv(newTitleEncryptionIv);
            userConvoToUpdate.setTitleEncryptionAuthTag(newTitleEncryptionAuthTag);

            this.userConvoRepository.save(userConvoToUpdate);
        }
        catch (Error e) {
            errorMessage += "• There was trouble updating the user-convo in the database\n";
            throw new BadGatewayException(errorMessage);
        }

        try {
            HashMap<String, Object> updatedDetailsOfConvo = new HashMap<String, Object>();
            updatedDetailsOfConvo.put(
                "encryptedTitle",
                newEncryptedTitle
            );
            updatedDetailsOfConvo.put(
                "titleEncryptionIv",
                newTitleEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "titleEncryptionAuthTag",
                newTitleEncryptionAuthTag
            );

            this.redisTemplate.opsForHash().putAll(
                "detailsForConvo" + convoId, 
                updatedDetailsOfConvo
            );
        }
        catch (Error e) {
            errorMessage += "• There was trouble updating the user-convo-details in the cache\n";
            throw new BadGatewayException(errorMessage);
        }
        
        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @PatchMapping("/markConvoAsSeen/{authUserId}/{convoId}")
    public HashMap<String, Object> markConvoAsSeen(HttpServletRequest request, HttpServletResponse
    response, @RequestParam int authUserId, @RequestParam int convoId) throws Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (convoId < 1) {
            throw new BadRequestException(
                "There does not exist a convo with the provided convoId"
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

        Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
            authUserId
        );
        if (resultOfGettingUserBlockings instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;

        Object resultOfGettingDetailsOfConvo = this.convoInfoFetchingService.getConvoDetails(
            convoId,
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvo instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvo)[0] + "\n";
            if (((String[]) resultOfGettingDetailsOfConvo)[1].equals("NOT_FOUND")) {
                throw new ResourceDoesNotExistException(((String[]) resultOfGettingDetailsOfConvo)[0]);
            }
            throw new BadGatewayException(errorMessage);
        }
        UserConvo convoDetails = (UserConvo) resultOfGettingDetailsOfConvo;


        byte[] encryptedDataEncryptionKey = convoDetails.getEncryptedDataEncryptionKey();
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.
        decryptEncryptedAWSDataEncryptionKey(encryptedDataEncryptionKey);

        if(plaintextDataEncryptionKey == null) {
            errorMessage += "• There was trouble decrypting the encrypted data-encryption-key of this " +
            "UserConvo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[] encryptedMembersOfConvo = convoDetails.getEncryptedMembers();
        String membersOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedMembersOfConvo,
            plaintextDataEncryptionKey,
            convoDetails.getMembersEncryptionIv(),
            convoDetails.getMembersEncryptionAuthTag()
        );
         
        ArrayList<Integer> membersOfConvo = null;

        ObjectMapper objectMapper = new ObjectMapper();

        try {
            membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
        }
        catch (IOException e) { }

        int indexOfAuthUserInMembers = -1;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int i = 0; i < membersOfConvo.size(); i++) {
            if(membersOfConvo.get(i) == authUserId) {
                indexOfAuthUserInMembers = i;
            }
            else if (!setOfAuthUserBlockings.contains(membersOfConvo.get(i))) {
                authUserIsBlockedByEachConvoMember = false;
            }
        }

        if (indexOfAuthUserInMembers == -1) {
            errorMessage += "• You cannot mark a user-convo as seen when you aren't a member of it\n";
            throw new ForbiddenException(errorMessage);
        }

        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
            
        }

        boolean[] hasUnseenMessageOfEachMember = convoDetails.getHasUnseenMessageOfEachMember();

        if (!hasUnseenMessageOfEachMember[indexOfAuthUserInMembers]) {
            errorMessage += "• The user-convo you are trying to mark as seen is already seen\n";
            throw new BadRequestException(errorMessage);
        }
        hasUnseenMessageOfEachMember[indexOfAuthUserInMembers] = false;
         
        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoId);
            UserConvo userConvoToUpdate = userConvoOptional.get();
            
            userConvoToUpdate.setHasUnseenMessageOfEachMember(hasUnseenMessageOfEachMember);

            this.userConvoRepository.save(userConvoToUpdate);
        }
        catch (Error e) {
            errorMessage += "• There was trouble updating the user-convo in the database\n";
            throw new BadGatewayException(errorMessage);
        }

        try {   
            String newHasUnseenMessageOfEachMemberAsJSONString = objectMapper.writeValueAsString(
                hasUnseenMessageOfEachMember
            );

            this.redisTemplate.opsForHash().put(
                "detailsForConvo" + convoId, 
                "hasUnseenMessageOfEachMember",
                newHasUnseenMessageOfEachMemberAsJSONString
            );
        }
        catch (Error e) {
            errorMessage += "• There was trouble updating the user-convo-details in the cache\n";
            throw new BadGatewayException(errorMessage);
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        
        return output;
    }


    @PatchMapping("/updateMyStatusAsConvoMember/{authUserId}/{convoId}/{newStatus}")
    public HashMap<String, Object> updateMyStatusAsConvoMember(HttpServletRequest request,
    HttpServletResponse response, @RequestParam int authUserId, @RequestParam int convoId,
    @RequestParam int newStatus) throws Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (convoId < 1) {
            throw new BadRequestException(
                "There does not exist a convo with the provided convoId"
            );
        }

        if (newStatus != -1 && newStatus != 1) {
            throw new BadRequestException(
                "There provided new status is invalid. It must be either -1(if you wish to delete " +
                "this convo from your inbox), or 1(if you wish to accept the convo-request)."
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

        Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
            authUserId
        );
        if (resultOfGettingUserBlockings instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;

        Object resultOfGettingDetailsOfConvo = this.convoInfoFetchingService.getConvoDetails(
            convoId,
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvo instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvo)[0] + "\n";
            if (((String[]) resultOfGettingDetailsOfConvo)[1].equals("NOT_FOUND")) {
                throw new ResourceDoesNotExistException(((String[]) resultOfGettingDetailsOfConvo)[0]);
            }
            throw new BadGatewayException(errorMessage);
        }
        UserConvo convoDetails = (UserConvo) resultOfGettingDetailsOfConvo;


        byte[] encryptedDataEncryptionKey = convoDetails.getEncryptedDataEncryptionKey();
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.
        decryptEncryptedAWSDataEncryptionKey(encryptedDataEncryptionKey);

        if(plaintextDataEncryptionKey == null) {
            errorMessage += "• There was trouble decrypting the encrypted data-encryption-key of this " +
            "UserConvo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[] encryptedMembersOfConvo = convoDetails.getEncryptedMembers();
        String membersOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedMembersOfConvo,
            plaintextDataEncryptionKey,
            convoDetails.getMembersEncryptionIv(),
            convoDetails.getMembersEncryptionAuthTag()
        );
         
        ArrayList<Integer> membersOfConvo = null;

        ObjectMapper objectMapper = new ObjectMapper();

        try {
            membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
        }
        catch (IOException e) { }

        int indexOfAuthUserInMembers = -1;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int i = 0; i < membersOfConvo.size(); i++) {
            if(membersOfConvo.get(i) == authUserId) {
                indexOfAuthUserInMembers = i;
            }
            else if (!setOfAuthUserBlockings.contains(membersOfConvo.get(i))) {
                authUserIsBlockedByEachConvoMember = false;
            }
        }

        if (indexOfAuthUserInMembers == -1) {
            errorMessage += "• You cannot update your member-status in a user-convo you are not a "
            + "member of\n";
            throw new ForbiddenException(errorMessage);
        }

        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        byte[] encryptedConvoMemberStatuses = convoDetails.getEncryptedMemberStatuses();
        String memberStatusesOfConvoAsString = this.encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            encryptedConvoMemberStatuses,
            plaintextDataEncryptionKey,
            convoDetails.getMemberStatusesEncryptionIv(),
            convoDetails.getMemberStatusesEncryptionAuthTag()
        );
         
        ArrayList<Integer> memberStatusesOfConvo = null;

        try {
            memberStatusesOfConvo = objectMapper.readValue(
                memberStatusesOfConvoAsString, 
                ArrayList.class
            );
        }
        catch (IOException e) { }

        if (newStatus == -1) {
            if (memberStatusesOfConvo.get(indexOfAuthUserInMembers) == 0) {
                errorMessage += "• You cannot delete a convo from your inbox if you haven't " +
                "accepted it. You may be looking to use the endpoint for declining the " +
                "convo-request instead\n";
                throw new BadRequestException(errorMessage);
            }
            else if (memberStatusesOfConvo.get(indexOfAuthUserInMembers) == -1) {
                errorMessage += "• You already deleted this convo from your inbox\n";
                throw new BadRequestException(errorMessage);
            }

            if (membersOfConvo.size() == 1) {
                try {
                    this.userConvoRepository.deleteById(convoId);
                }
                catch (Exception e) {
                    errorMessage += "• There was trouble deleting this user-convo from the database\n";
                    throw new BadGatewayException(errorMessage);
                }

                try {
                    this.encryptionAndDecryptionService.deleteAWSCustomerMasterKey(
                        convoDetails.getAwsCMKId()
                    );
                }
                catch (Exception e) {
                    errorMessage += "• There was trouble deleting the AWS-CMK used for encrypting/decrypting the "
                    + "data-encryption-key used for encrypting/decrypting the sensitive data of this user-convo\n";
                    throw new BadGatewayException(errorMessage);
                }

                try {
                    this.redisTemplate.opsForHash().delete("detailsForConvo"+convoId);
                }
                catch (Exception e) {
                    errorMessage += "• There was trouble deleting this user-convo from the cache\n";
                    throw new BadGatewayException(errorMessage);
                }

                HashMap<String, Object> output = new HashMap<String, Object>();
                output.put("ErrorMessage", errorMessage);

                return output;
            }
            else {
                memberStatusesOfConvo.set(indexOfAuthUserInMembers, newStatus);
            }
        }
        else {
            if (memberStatusesOfConvo.get(indexOfAuthUserInMembers) != 0) {
                errorMessage += "• You have already accepted the convo-request for this convo\n";
                throw new BadRequestException(errorMessage);
            }
    
            memberStatusesOfConvo.set(indexOfAuthUserInMembers, newStatus);
        }

        byte[] newEncryptedConvoMemberStatuses;
        byte[] newConvoMemberStatusesEncryptionIv;
        byte[] newConvoMemberStatusesEncryptionAuthTag;

        String newMemberStatusesOfConvoAsString = objectMapper.writeValueAsString(
            memberStatusesOfConvo
        );

        byte[][] newMemberStatusesEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            newMemberStatusesOfConvoAsString, 
            plaintextDataEncryptionKey
        ); 
        newEncryptedConvoMemberStatuses = newMemberStatusesEncryptionInfo[0];
        newConvoMemberStatusesEncryptionIv = newMemberStatusesEncryptionInfo[1];
        newConvoMemberStatusesEncryptionAuthTag = newMemberStatusesEncryptionInfo[2];

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoId);
            UserConvo userConvoToUpdate = userConvoOptional.get();
            
            userConvoToUpdate.setEncryptedMemberStatuses(newEncryptedConvoMemberStatuses);
            userConvoToUpdate.setMemberStatusesEncryptionIv(newConvoMemberStatusesEncryptionIv);
            userConvoToUpdate.setMemberStatusesEncryptionAuthTag(newConvoMemberStatusesEncryptionAuthTag);

            this.userConvoRepository.save(userConvoToUpdate);
        }
        catch (Error e) {
            errorMessage += "• There was trouble updating the user-convo in the database\n";
            throw new BadGatewayException(errorMessage);
        }

        try {   
            HashMap<String, Object> updatedDetailsOfConvo = new HashMap<String, Object>();
            updatedDetailsOfConvo.put(
                "encryptedMemberStatuses",
                newEncryptedConvoMemberStatuses
            );
            updatedDetailsOfConvo.put(
                "memberStatusesEncryptionIv",
                newConvoMemberStatusesEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "memberStatusesEncryptionAuthTag",
                newConvoMemberStatusesEncryptionAuthTag
            );

            this.redisTemplate.opsForHash().putAll(
                "detailsForConvo" + convoId, 
                updatedDetailsOfConvo
            );
        }
        catch (Error e) {
            errorMessage += "• There was trouble updating the user-convo-details in the cache\n";
            throw new BadGatewayException(errorMessage);
        } 

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);

        return output;
    }

    @PatchMapping("/revokeConvoMembershipOfUser/{authUserId}/{convoId}/{acceptedOrRequestedMemberIdToRevoke}")
    public HashMap<String, Object> revokeConvoMembershipOfUser(HttpServletRequest request,
    HttpServletResponse response, @RequestParam int authUserId, @RequestParam int convoId, @RequestParam int
    acceptedOrRequestedMemberIdToRevoke) throws
    Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (convoId < 1) {
            throw new BadRequestException(
                "There does not exist a convo with the provided convoId"
            );
        }

        if (acceptedOrRequestedMemberIdToRevoke < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided acceptedOrRequestedMemberIdToRevoke"
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

        Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
            authUserId
        );
        if (resultOfGettingUserBlockings instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;

        Object resultOfGettingDetailsOfConvo = this.convoInfoFetchingService.getConvoDetails(
            convoId,
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvo instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvo)[0] + "\n";
            if (((String[]) resultOfGettingDetailsOfConvo)[1].equals("NOT_FOUND")) {
                throw new ResourceDoesNotExistException(((String[]) resultOfGettingDetailsOfConvo)[0]);
            }
            throw new BadGatewayException(errorMessage);
        }
        UserConvo convoDetails = (UserConvo) resultOfGettingDetailsOfConvo;


        byte[] encryptedDataEncryptionKey = convoDetails.getEncryptedDataEncryptionKey();
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.
        decryptEncryptedAWSDataEncryptionKey(encryptedDataEncryptionKey);

        if(plaintextDataEncryptionKey == null) {
            errorMessage += "• There was trouble decrypting the encrypted data-encryption-key of this " +
            "UserConvo\n";
            throw new BadGatewayException(errorMessage);
        }

        byte[] encryptedMembersOfConvo = convoDetails.getEncryptedMembers();
        String membersOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedMembersOfConvo,
            plaintextDataEncryptionKey,
            convoDetails.getMembersEncryptionIv(),
            convoDetails.getMembersEncryptionAuthTag()
        );
         
        ArrayList<Integer> membersOfConvo = null;

        ObjectMapper objectMapper = new ObjectMapper();

        try {
            membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
        }
        catch (IOException e) { }


        boolean authUserIsMemberOfConvo = false;
        int indexOfMemberToRemove = -1;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int i = 0; i < membersOfConvo.size(); i++) {
            if(membersOfConvo.get(i) == authUserId) {
                authUserIsMemberOfConvo = true;
            }
            else if (!setOfAuthUserBlockings.contains(membersOfConvo.get(i))) {
                authUserIsBlockedByEachConvoMember = false;
            }
            
            if (membersOfConvo.get(i) == acceptedOrRequestedMemberIdToRevoke) {
                indexOfMemberToRemove = i;
            }
        }

        if (!authUserIsMemberOfConvo) {
            errorMessage += "• You cannot update your member-status in a user-convo you are not a "
            + "member of\n";
            throw new ForbiddenException(errorMessage);
        }

        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        if (indexOfMemberToRemove == -1) {
            errorMessage += "• The convo-member you're trying to revoke does not exist\n";
            throw new BadRequestException(errorMessage);
        }

        membersOfConvo.remove(indexOfMemberToRemove);

        if (membersOfConvo.size() == 0) {
            try {
                this.userConvoRepository.deleteById(convoId);
            }
            catch (Exception e) {
                errorMessage += "• There was trouble deleting this user-convo from the database\n";
                throw new BadGatewayException(errorMessage);
            }

            try {
                this.encryptionAndDecryptionService.deleteAWSCustomerMasterKey(
                    convoDetails.getAwsCMKId()
                );
            }
            catch (Exception e) {
                errorMessage += "• There was trouble deleting the AWS-CMK used for encrypting/decrypting the "
                + "data-encryption-key used for encrypting/decrypting the sensitive data of this user-convo\n";
                throw new BadGatewayException(errorMessage);
            }

            try {
                this.redisTemplate.opsForHash().delete("detailsForConvo"+convoId);
            }
            catch (Exception e) {
                errorMessage += "• There was trouble deleting this user-convo from the cache\n";
                throw new BadGatewayException(errorMessage);
            }

            HashMap<String, Object> output = new HashMap<String, Object>();
            output.put("ErrorMessage", errorMessage);

            return output;
        }

        boolean[] hasUnseenMessageOfEachMember = convoDetails.getHasUnseenMessageOfEachMember();
        boolean[] newHasUnseenMessageOfEachMember = new boolean[
            hasUnseenMessageOfEachMember.length - 1
        ];

        for(int i=0; i<hasUnseenMessageOfEachMember.length; i++) {
            if (i==indexOfMemberToRemove) {
                continue;
            }

            newHasUnseenMessageOfEachMember[i] = hasUnseenMessageOfEachMember[i];
        }

        byte[] encryptedConvoMemberStatuses = convoDetails.getEncryptedMemberStatuses();
        String memberStatusesOfConvoAsString = this.encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
            encryptedConvoMemberStatuses,
            plaintextDataEncryptionKey,
            convoDetails.getMemberStatusesEncryptionIv(),
            convoDetails.getMemberStatusesEncryptionAuthTag()
        );
         
        ArrayList<Integer> memberStatusesOfConvo = null;

        try {
            memberStatusesOfConvo = objectMapper.readValue(
                memberStatusesOfConvoAsString, 
                ArrayList.class
            );
        }
        catch (IOException e) { }

        memberStatusesOfConvo.remove(indexOfMemberToRemove);

        byte[] encDatetimeOfEarliestMsgShownPerMember = convoDetails.getEncDatetimeOfEarliestMsgShownPerMember();
        String datetimeOfEarliestMsgShownPerMemberAsString = this.encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            encDatetimeOfEarliestMsgShownPerMember,
            plaintextDataEncryptionKey,
            convoDetails.getDatetimeOfEarliestMsgShownPerMemberEncryptionIv(),
            convoDetails.getDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag()
        );
         
        ArrayList<String> datetimeOfEarliestMsgShownPerMember = null;

        try {
            datetimeOfEarliestMsgShownPerMember = objectMapper.readValue(
                datetimeOfEarliestMsgShownPerMemberAsString, 
                ArrayList.class
            );
        }
        catch (IOException e) { }

        datetimeOfEarliestMsgShownPerMember.remove(indexOfMemberToRemove);

        
        byte[] newEncryptedMembers;
        byte[] newMembersEncryptionIv;
        byte[] newMembersEncryptionAuthTag;

        String newMembersOfConvoAsJSONString = objectMapper.writeValueAsString(
            membersOfConvo
        );

        byte[][] newMembersEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            newMembersOfConvoAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        newEncryptedMembers = newMembersEncryptionInfo[0];
        newMembersEncryptionIv = newMembersEncryptionInfo[1];
        newMembersEncryptionAuthTag = newMembersEncryptionInfo[2];

        byte[] newEncryptedMemberStatuses;
        byte[] newMemberStatusesEncryptionIv;
        byte[] newMemberStatusesEncryptionAuthTag;

        String memberStatusesOfConvoAsJSONString = objectMapper.writeValueAsString(
            memberStatusesOfConvo
        );

        byte[][] newMemberStatusesEncryptionInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            memberStatusesOfConvoAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        newEncryptedMemberStatuses = newMemberStatusesEncryptionInfo[0];
        newMemberStatusesEncryptionIv = newMemberStatusesEncryptionInfo[1];
        newMemberStatusesEncryptionAuthTag = newMemberStatusesEncryptionInfo[2];

        byte[] newEncDatetimeOfEarliestMsgShownPerMember;
        byte[] newDatetimeOfEarliestMsgShownPerMemberEncryptionIv;
        byte[] newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag;

        String datetimeOfEarliestMsgShownPerMemberAsJSONString = objectMapper.writeValueAsString(
            datetimeOfEarliestMsgShownPerMember
        );

        byte[][] newDatetimeOfEarliestMsgShownPerMemberEncInfo = this.encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            datetimeOfEarliestMsgShownPerMemberAsJSONString, 
            plaintextDataEncryptionKey
        ); 
        newEncDatetimeOfEarliestMsgShownPerMember = newDatetimeOfEarliestMsgShownPerMemberEncInfo[0];
        newDatetimeOfEarliestMsgShownPerMemberEncryptionIv = newDatetimeOfEarliestMsgShownPerMemberEncInfo[1];
        newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag = newDatetimeOfEarliestMsgShownPerMemberEncInfo[2];

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoId);
            UserConvo userConvoToUpdate = userConvoOptional.get();

            userConvoToUpdate.setEncryptedMembers(newEncryptedMembers);
            userConvoToUpdate.setMembersEncryptionIv(newMembersEncryptionIv);
            userConvoToUpdate.setMembersEncryptionAuthTag(newMembersEncryptionAuthTag);

            userConvoToUpdate.setEncryptedMemberStatuses(newEncryptedMemberStatuses);
            userConvoToUpdate.setMemberStatusesEncryptionIv(newMemberStatusesEncryptionIv);
            userConvoToUpdate.setMemberStatusesEncryptionAuthTag(newMemberStatusesEncryptionAuthTag);

            userConvoToUpdate.setEncDatetimeOfEarliestMsgShownPerMember(
                newEncDatetimeOfEarliestMsgShownPerMember
            );
            userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                newDatetimeOfEarliestMsgShownPerMemberEncryptionIv
            );
            userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag
            );

            userConvoToUpdate.setHasUnseenMessageOfEachMember(
                newHasUnseenMessageOfEachMember
            );
            
            this.userConvoRepository.save(userConvoToUpdate);
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating the convo-details in the database\n";
            throw new BadGatewayException(errorMessage);
        }

        try {
            HashMap<String, Object> updatedDetailsOfConvo = new HashMap<String, Object>();
            updatedDetailsOfConvo.put(
                "encryptedMembers",
                newEncryptedMembers
            );
            updatedDetailsOfConvo.put(
                "membersEncryptionIv",
                newMembersEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "membersEncryptionAuthTag",
                newMembersEncryptionAuthTag
            );

            updatedDetailsOfConvo.put(
                "encryptedMemberStatuses",
                newEncryptedMemberStatuses
            );
            updatedDetailsOfConvo.put(
                "memberStatusesEncryptionIv",
                newMemberStatusesEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "memberStatusesEncryptionAuthTag",
                newMemberStatusesEncryptionAuthTag
            );

            updatedDetailsOfConvo.put(
                "encDatetimeOfEarliestMsgShownPerMember",
                encDatetimeOfEarliestMsgShownPerMember
            );
            updatedDetailsOfConvo.put(
                "datetimeOfEarliestMsgShownPerMemberEncryptionIv",
                newDatetimeOfEarliestMsgShownPerMemberEncryptionIv
            );
            updatedDetailsOfConvo.put(
                "datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag",
                newDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag
            );


            String newHasUnseenMessageOfEachMemberAsString = objectMapper.writeValueAsString(
                newHasUnseenMessageOfEachMember
            );

            updatedDetailsOfConvo.put(
                "hasUnseenMessageOfEachMember",
                newHasUnseenMessageOfEachMemberAsString
            );

            this.redisTemplate.opsForHash().putAll(
                "detailsForConvo" + convoId, 
                updatedDetailsOfConvo
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating the caching of the convo-details\n";
            throw new BadGatewayException(errorMessage);
        }


        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);

        return output;
    }
}
