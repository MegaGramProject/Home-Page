package com.megagram.springBootBackend2.Controllers.RestAPI.UserMessage;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.exceptions.TooManyRequestsException;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.UserMessage;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserConvoRepository;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserMessageRepository;
import com.megagram.springBootBackend2.services.ConvoInfoFetchingService;
import com.megagram.springBootBackend2.services.EncryptionAndDecryptionService;
import com.megagram.springBootBackend2.services.MessageSendingService;
import com.megagram.springBootBackend2.services.UserAuthService;
import com.megagram.springBootBackend2.services.UserInfoFetchingService;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@SuppressWarnings("unchecked")
@RestController
public class Mutations {
    @Autowired
    private UserMessageRepository userMessageRepository;
    @Autowired
    private UserConvoRepository userConvoRepository;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private ConvoInfoFetchingService convoInfoFetchingService;
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private UserInfoFetchingService userInfoFetchingService;
    @Autowired
    private EncryptionAndDecryptionService encryptionAndDecryptionService;
    @Autowired
    private MessageSendingService messageSendingService;

    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();
    

    public Mutations() {}

    
    @PostMapping("/sendMessage/{authUserId}/{convoId}")
    public HashMap<String, Object> sendMessage(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam int convoId, @RequestBody HashMap<String, String>
    infoOnMessageToSend) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/sendMessage");

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

        if (infoOnMessageToSend == null || !infoOnMessageToSend.containsKey("messageToSend")) {
            throw new BadRequestException(
                "You didn't provide any info on the message you wish to send"
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

        int indexOfAuthUserInConvoMembers = -1;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int i = 0; i < membersOfConvo.size(); i++) {
            int convoMember = membersOfConvo.get(i);

            if(convoMember == authUserId) {
                indexOfAuthUserInConvoMembers = i;
            }
            else if (!setOfAuthUserBlockings.contains(convoMember)) {
                authUserIsBlockedByEachConvoMember = false;
            }
        }

        if (indexOfAuthUserInConvoMembers == -1) {
            errorMessage += "• You cannot send messages in a convo you aren't a member of\n";
            throw new ForbiddenException(errorMessage);
        }
        
        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        byte[][] encryptedMessageSenderInfo = this.encryptionAndDecryptionService.encryptTextWithAWSDataEncryptionKey(
            String.valueOf(authUserId),
            plaintextDataEncryptionKey
        );

        String messageToSend = infoOnMessageToSend.get("messageToSend");
        if (messageToSend.length() > 1000) {
            messageToSend = messageToSend.substring(0, 997) + "...";
            errorMessage += "• The message has been trimmed to 997 characters followed by a '...' to " +
            "fit the 1000-char-limit\n";
        }

        byte[][] encryptedMessageInfo = this.encryptionAndDecryptionService.encryptTextWithAWSDataEncryptionKey(
            messageToSend,
            plaintextDataEncryptionKey
        );

        int idOfNewUserMessage = -1;

        try {
            UserMessage newUserMessage = new UserMessage();
            newUserMessage.setConvoId(convoId);

            newUserMessage.setEncryptedSender(encryptedMessageSenderInfo[0]);
            newUserMessage.setSenderEncryptionIv(encryptedMessageSenderInfo[1]);
            newUserMessage.setSenderEncryptionAuthTag(encryptedMessageSenderInfo[2]);

            newUserMessage.setEncryptedMessage(encryptedMessageInfo[0]);
            newUserMessage.setMessageEncryptionIv(encryptedMessageInfo[1]);
            newUserMessage.setMessageEncryptionAuthTag(encryptedMessageInfo[2]);

            newUserMessage.setSentAt(LocalDateTime.now());

            this.userMessageRepository.save(newUserMessage);

            idOfNewUserMessage = newUserMessage.getId();
        }
        catch (Exception e) {
            errorMessage += "• There was trouble adding the message into the database\n";
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("idOfNewUserMessage", idOfNewUserMessage);
        output.put("ErrorMessage", errorMessage);

        return output;
    }


    @DeleteMapping("/unsendMessage/{authUserId}/{messageId}")
    public HashMap<String, Object> unsendMessage(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam int messageId) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/unsendMessage");

        if (authUserId < 1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId"
            );
        }

        if (messageId < 1) {
            throw new BadRequestException(
                "There does not exist a message with the provided messageId"
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

        Integer convoId = -1;

        try {
            convoId = this.userMessageRepository.getConvoIdOfMessage(messageId);

            if (convoId == null) {
                errorMessage += "• The message you are trying to unsend does not exist\n";
                throw new ResourceDoesNotExistException(errorMessage);
            }
        }
        catch (Exception e) {
            errorMessage += "• There was trouble getting the convo-id of this message\n";
            throw new BadGatewayException(errorMessage);
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

        int indexOfAuthUserInConvoMembers = -1;
        boolean authUserIsBlockedByEachConvoMember = true;

        for(int i = 0; i < membersOfConvo.size(); i++) {
            int convoMember = membersOfConvo.get(i);

            if(convoMember == authUserId) {
                indexOfAuthUserInConvoMembers = i;
            }
            else if (!setOfAuthUserBlockings.contains(convoMember)) {
                authUserIsBlockedByEachConvoMember = false;
            }
        }

        if (indexOfAuthUserInConvoMembers == -1) {
            errorMessage += "• You cannot unsend messages in a convo you aren't a member of\n";
            throw new ForbiddenException(errorMessage);
        }
        
        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

        boolean messageWasFound = false;

        try {
            Optional<UserMessage> userMessageToDeleteOptional = this.userMessageRepository.findById(messageId);

            if (userMessageToDeleteOptional.isPresent()) {
                UserMessage userMessageToDelete = userMessageToDeleteOptional.get(); 
                String senderIdAsString = this.encryptionAndDecryptionService.
                decryptTextWithAWSDataEncryptionKey(
                    userMessageToDelete.getEncryptedSender(),
                    plaintextDataEncryptionKey,
                    userMessageToDelete.getSenderEncryptionIv(),
                    userMessageToDelete.getSenderEncryptionAuthTag()
                );
                int senderId = Integer.parseInt(senderIdAsString);

                if (senderId != authUserId) {
                    errorMessage += "• You cannot unsend messages that you did not send\n";
                    throw new ForbiddenException(errorMessage);
                }
                
                this.userMessageRepository.delete(userMessageToDelete);
                messageWasFound = true;
            }
        }
        catch (Exception e) {
            errorMessage += "• There was trouble removing the message from the database\n";
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("messageWasFound", messageWasFound);
        output.put("ErrorMessage", errorMessage);

        return output;
    }


    @PostMapping("/sendMessageToOneOrMoreUsersAndGroups/{authUserId}/{method}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> sendMessageToOneOrMoreUsersAndGroups(HttpServletRequest request, HttpServletResponse
    response, @RequestParam int authUserId, @RequestParam String method, @RequestBody HashMap<String, Object>
    relevantInfoForThisRequest) throws Exception {
        if (authUserId < 1) {
            throw new BadRequestException(
                "The provided authUserId is invalid"
            );
        }

        if (!method.equals("individually") && !method.equals("as a group")) {
            throw new BadRequestException(
                "The method must either be 'individually' or 'as a group'"
            );      
        }

        if (!relevantInfoForThisRequest.containsKey("messageToSend") || !(relevantInfoForThisRequest.get(
        "messageToSend") instanceof String) || ((String) relevantInfoForThisRequest.get("messageToSend"))
        .length()>1000) {
            throw new BadRequestException(
                "The provided message-to-send is either over the 1000-character limit, or does not even exist"
            );
        }

        String messageToSend = (String) relevantInfoForThisRequest.get("messageToSend");

        HashSet<Integer> setOfUserIdsToSendTo = new HashSet<Integer>();
        HashSet<Integer> setOfGroupChatIdsSendTo = new HashSet<Integer>();

        if (relevantInfoForThisRequest.containsKey("usersAndGroupsToSendTo")) {
            ArrayList<String> usersAndGroupsToSendTo = (ArrayList<String>) relevantInfoForThisRequest.get(
                "usersAndGroupsToSendTo"
            );

            for(String userOrGroup : usersAndGroupsToSendTo) {
                String[] infoOnUserOrGroupChat = userOrGroup.split("/");
                if (infoOnUserOrGroupChat.length == 0) {
                    continue;
                }

                if (infoOnUserOrGroupChat[0].equals("user")) {
                    if (infoOnUserOrGroupChat.length > 1) {
                        String stringifiedUserId = infoOnUserOrGroupChat[1];
                        try {
                            int userId = Integer.parseInt(stringifiedUserId);
                            if (userId > 0) {
                                setOfUserIdsToSendTo.add(userId);
                            }
                        }
                        catch (Exception e) {}
                    }
                }
                else if (infoOnUserOrGroupChat[0].equals("group-chat")) {
                    if (infoOnUserOrGroupChat.length > 1) {
                        String stringifiedGroupChatId = infoOnUserOrGroupChat[1];
                        try {
                            int groupChatId = Integer.parseInt(stringifiedGroupChatId);
                            if (groupChatId > 0) {
                                setOfGroupChatIdsSendTo.add(groupChatId);
                            }
                        }
                        catch (Exception e) {}
                    }
                }
            }
        }

        if (setOfUserIdsToSendTo.size() == 0 && setOfGroupChatIdsSendTo.size() == 0) {
            throw new BadGatewayException(
                "No valid users and groups to send the post to have been provided"
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

        Iterator<Integer> userIdsToSendToIterator = setOfUserIdsToSendTo.iterator();
        while (userIdsToSendToIterator.hasNext()) {
            int userIdToSendTo = userIdsToSendToIterator.next();

            if (setOfAuthUserBlockings.contains(userIdToSendTo)) {
                userIdsToSendToIterator.remove();
            }
        }

        Object resultOfFetchingInfoOnAllAuthUserConvos = this.convoInfoFetchingService.getInfoOnAllConvosOfUser(
            authUserId,
            setOfAuthUserBlockings,
            this.userConvoRepository,
            this.encryptionAndDecryptionService
        );
        if (resultOfFetchingInfoOnAllAuthUserConvos instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }

        HashMap<String, Object> infoOnAllConvosOfAuthUser = (HashMap<String, Object>) resultOfFetchingInfoOnAllAuthUserConvos;
        HashMap<Integer, byte[]> authUserConvosAndTheirPlaintextDEKs =
        (HashMap<Integer, byte[]>) infoOnAllConvosOfAuthUser.get(
            "convosAndTheirPlaintextDEKs"
        );
        HashMap<Integer, UserConvo> authUserConvosAndTheirDetails =
        (HashMap<Integer, UserConvo>) infoOnAllConvosOfAuthUser.get(
            "authUserConvosAndTheirDetails"
        );

        ObjectMapper objectMapper = new ObjectMapper();

        int convoIdOfNewMessage = -1;
        HashMap<Integer, Integer> userIdsToSendToAndTheirConvoIdsOfTheNewlySentMessage = new HashMap<Integer, Integer>();
        ArrayList<Integer> idsOfGroupChatsThatHaveSuccessfullyReceivedNewMessage = new ArrayList<Integer>();

        if (method.equals("as a group")) {
            HashSet<Integer> allSpecifiedMembersToSendTo = setOfUserIdsToSendTo;
            allSpecifiedMembersToSendTo.add(authUserId);

            if (allSpecifiedMembersToSendTo.size() > 250) {
                errorMessage += "• The maximum number of members of a user-convo is 250.\n";
                throw new BadRequestException(errorMessage);
            }
            
            if (setOfGroupChatIdsSendTo.size() > 0) {
                for(int convoId : setOfGroupChatIdsSendTo) {
                    if (authUserConvosAndTheirDetails.containsKey(convoId)) {
                        UserConvo detailsOfGroupChat = authUserConvosAndTheirDetails.get(convoId);
                        byte[] plaintextDataEncryptionKey = authUserConvosAndTheirPlaintextDEKs.get(convoId);

                        String membersOfConvoAsString = this.encryptionAndDecryptionService
                        .decryptTextWithAWSDataEncryptionKey(
                            detailsOfGroupChat.getEncryptedMembers(),
                            plaintextDataEncryptionKey,
                            detailsOfGroupChat.getMembersEncryptionIv(),
                            detailsOfGroupChat.getMembersEncryptionAuthTag()
                        );
                        
                        ArrayList<Integer> membersOfConvo = null;

                        try {
                            membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
                        }
                        catch (IOException e) {}

                        allSpecifiedMembersToSendTo.addAll(new HashSet<Integer>(membersOfConvo));

                        if (allSpecifiedMembersToSendTo.size() > 250) {
                            errorMessage += "• The maximum number of members of a user-convo is 250.\n";
                            throw new BadRequestException(errorMessage);
                        }
                    }
                }
            }

            HashMap<String, Object> resultOfSendingMessageToSpecifiedMembersAsGroup = this.messageSendingService
            .sendMessageToSpecifiedMembersAsGroup(
                this.userConvoRepository,
                this.userMessageRepository,
                this.redisTemplate,
                this.encryptionAndDecryptionService,
                this.convoInfoFetchingService,
                allSpecifiedMembersToSendTo,
                authUserConvosAndTheirDetails,
                authUserConvosAndTheirPlaintextDEKs,
                messageToSend,
                authUserId,
                objectMapper
            );

            errorMessage += (String) resultOfSendingMessageToSpecifiedMembersAsGroup.get("ErrorMessage");

            if (!(resultOfSendingMessageToSpecifiedMembersAsGroup.get("status").equals("CROSSED_THE_FINISH_LINE"))) {
                throw new BadGatewayException(errorMessage);
            }

            convoIdOfNewMessage = (int) resultOfSendingMessageToSpecifiedMembersAsGroup.get("convoIdOfNewMessage");
        }
        else {
            for (int userIdToSendTo : setOfUserIdsToSendTo) {
                HashMap<String, Object> resultOfSendingMessageToSpecifiedMembersAsGroup = this.messageSendingService
                .sendMessageToSpecifiedMembersAsGroup(
                    this.userConvoRepository,
                    this.userMessageRepository,
                    this.redisTemplate,
                    this.encryptionAndDecryptionService,
                    this.convoInfoFetchingService,
                    new HashSet<Integer>(Set.of(userIdToSendTo)),
                    authUserConvosAndTheirDetails,
                    authUserConvosAndTheirPlaintextDEKs,
                    messageToSend,
                    authUserId,
                    objectMapper
                );

                errorMessage += (String) resultOfSendingMessageToSpecifiedMembersAsGroup.get("ErrorMessage");

                if (!resultOfSendingMessageToSpecifiedMembersAsGroup.get("status").equals("CROSSED_THE_FINISH_LINE")) {
                    errorMessage +=  "• There was trouble sending the message to user " + userIdToSendTo + "\n";
                }
                else {
                    int convoIdOfNewMessageSentToThisUser = (int) resultOfSendingMessageToSpecifiedMembersAsGroup.get(
                        "convoIdOfNewMessage"
                    );

                    userIdsToSendToAndTheirConvoIdsOfTheNewlySentMessage.put(userIdToSendTo, convoIdOfNewMessageSentToThisUser);
                }
            }

            for (int groupChatId : setOfGroupChatIdsSendTo) {
                HashMap<String, Object> resultOfSendingMessageToSpecifiedConvo = this.messageSendingService
                .sendMessageToSpecificConvo(
                    this.userConvoRepository,
                    this.userMessageRepository,
                    this.redisTemplate,
                    this.encryptionAndDecryptionService,
                    this.convoInfoFetchingService,
                    authUserConvosAndTheirDetails,
                    authUserConvosAndTheirPlaintextDEKs,
                    messageToSend,
                    authUserId,
                    groupChatId,
                    objectMapper
                );

                errorMessage += (String) resultOfSendingMessageToSpecifiedConvo.get("ErrorMessage");

                if (!resultOfSendingMessageToSpecifiedConvo.get("status").equals("CROSSED_THE_FINISH_LINE")) {
                    errorMessage +=  "• There was trouble sending the message to convo " + groupChatId + "\n";
                }
                else {
                    idsOfGroupChatsThatHaveSuccessfullyReceivedNewMessage.add(groupChatId);
                }
            }
        }
        
        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);

        if (method.equals("as a group")) {
            output.put("convoIdOfNewMessage", convoIdOfNewMessage);
        }
        else {
            output.put(
                "userIdsToSendToAndTheirConvoIdsOfTheNewlySentMessage",
                userIdsToSendToAndTheirConvoIdsOfTheNewlySentMessage
            );

            output.put(
                "idsOfGroupChatsThatHaveSuccessfullyReceivedNewMessage",
                idsOfGroupChatsThatHaveSuccessfullyReceivedNewMessage
            );
        }
        
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
        Bandwidth limit = Bandwidth.classic(25, Refill.greedy(25, Duration.ofMinutes(1)));

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
