package com.megagram.springBootBackend2.Controllers.RestAPI.UserMessage;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.exceptions.TooManyRequestsException;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.DecryptedUserMessage;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.UserMessage;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserConvoRepository;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserMessageRepository;
import com.megagram.springBootBackend2.services.ConvoInfoFetchingService;
import com.megagram.springBootBackend2.services.EncryptionAndDecryptionService;
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
public class Queries {
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private UserInfoFetchingService userInfoFetchingService;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private ConvoInfoFetchingService convoInfoFetchingService;
    @Autowired
    private UserConvoRepository userConvoRepository;
    @Autowired
    private EncryptionAndDecryptionService encryptionAndDecryptionService;
    @Autowired
    private UserMessageRepository userMessageRepository;

    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();
    
    
    public Queries() {}

    
    @PostMapping("/getBatchOfMostRecentMessagesOfMyConvo/{authUserId}/{convoId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getBatchOfMostRecentMessagesOfMyConvo(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestParam int convoId, @RequestBody HashMap<String, ArrayList<Integer>>
    infoOnMessageIdsToExclude) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/getBatchOfMostRecentMessagesOfMyConvo");

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
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.decryptEncryptedAWSDataEncryptionKey(
            encryptedDataEncryptionKey
        );

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
            errorMessage += "• You cannot fetch messages of a convo you aren't a member of\n";
            throw new ForbiddenException(errorMessage);
        }
        
        if (authUserIsBlockedByEachConvoMember) {
            errorMessage += "• UserConvo " + convoId + " was not found\n";
            throw new ResourceDoesNotExistException(errorMessage);
        }

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

        String datetimeOfEarliestMsgShownForAuthUserAsString = datetimeOfEarliestMsgShownPerMember.get(
            indexOfAuthUserInConvoMembers
        );
        LocalDateTime datetimeOfEarliestMsgShownForAuthUser = null;

        if (!datetimeOfEarliestMsgShownForAuthUser.equals("beginning") &&
        !datetimeOfEarliestMsgShownForAuthUser.equals("waiting for new message")) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
            datetimeOfEarliestMsgShownForAuthUser = LocalDateTime.parse(
                datetimeOfEarliestMsgShownForAuthUserAsString,
                formatter);
        }

        HashSet<Integer> messageIdsToExclude = null;

        if (infoOnMessageIdsToExclude != null && infoOnMessageIdsToExclude.containsKey(
        "messageIdsToExclude")) {
            messageIdsToExclude = new HashSet<Integer>(
                infoOnMessageIdsToExclude.get("messageIdsToExclude")
            );
        }

        ArrayList<UserMessage> encryptedBatchOfMessages = new ArrayList<UserMessage>
        ();
        ArrayList<DecryptedUserMessage> decryptedBatchOfMessages = new ArrayList<DecryptedUserMessage>
        ();

        if (datetimeOfEarliestMsgShownForAuthUser == null) {
            encryptedBatchOfMessages = this.userMessageRepository.fetchBatchOfMostRecentMessagesOfConvo(
                10,
                convoId,
                messageIdsToExclude
            );
        }
        else {
            encryptedBatchOfMessages = this.userMessageRepository
            .fetchBatchOfMostRecentMessagesOfConvoWithDatetimeRestriction(
                10,
                convoId,
                messageIdsToExclude,
                datetimeOfEarliestMsgShownForAuthUser
            );
        }

        for (UserMessage encryptedUserMessage : encryptedBatchOfMessages) {
            String messageSenderIdAsString = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                encryptedUserMessage.getEncryptedSender(),
                plaintextDataEncryptionKey,
                encryptedUserMessage.getSenderEncryptionIv(),
                encryptedUserMessage.getSenderEncryptionAuthTag()
            );

            int messageSenderId = Integer.parseInt(messageSenderIdAsString);

            String decryptedMessage = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                encryptedUserMessage.getEncryptedMessage(),
                plaintextDataEncryptionKey,
                encryptedUserMessage.getMessageEncryptionIv(),
                encryptedUserMessage.getMessageEncryptionAuthTag()
            );

            decryptedBatchOfMessages.add(
                new DecryptedUserMessage(
                    encryptedUserMessage.getId(),
                    convoId,
                    messageSenderId,
                    decryptedMessage,
                    encryptedUserMessage.getSentAt()
                )
            );
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("batchOfMostRecentMessagesOfConvo", decryptedBatchOfMessages);
        
        return output;
    }


    @PostMapping("/getOrderedNewMessagesOfListOfConvos")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getOrderedNewMessagesOfListOfConvos(HttpServletRequest request, HttpServletResponse response,
    @RequestBody HashMap<String, Object> convoIdsInfo) throws Exception {
        String errorMessage = "";

        HashSet<Integer> setOfConvoIds = new HashSet<Integer>((ArrayList<Integer>) convoIdsInfo.get("convoIds"));

        Object resultOfGettingDetailsOfConvos = this.convoInfoFetchingService.getDetailsOfMultipleConvos(
            new ArrayList<Integer>(setOfConvoIds),
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvos instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvos)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashMap<Integer, UserConvo> convoIdsAndTheirDetails = (HashMap<Integer, UserConvo>) resultOfGettingDetailsOfConvos;

        LocalDateTime datetimeToFetchNewMessages = (LocalDateTime) convoIdsInfo.get("datetimeToFetchNewMessages");
        
        ArrayList<UserMessage> encryptedNewMessagesOfListOfConvos = null;

        try {
            encryptedNewMessagesOfListOfConvos = this.userMessageRepository.getOrderedNewMessagesForListOfConvos(
                setOfConvoIds,
                datetimeToFetchNewMessages
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble fetching the asked-for data from the database\n";
            throw new BadGatewayException(errorMessage);
        }

        HashMap<Integer, byte[]> convoIdsAndTheirPlaintextDEKs = new HashMap<Integer, byte[]>();
        ArrayList<DecryptedUserMessage> orderedNewMessagesOfListOfConvos = new ArrayList<DecryptedUserMessage>();

        for (UserMessage encryptedNewMessage : encryptedNewMessagesOfListOfConvos) {
            int messageId = encryptedNewMessage.getId();
            int convoIdOfMessage = encryptedNewMessage.getConvoId();
            byte[] plaintextDataEncryptionKey = null;

            if(convoIdsAndTheirPlaintextDEKs.containsKey(convoIdOfMessage)) {
                plaintextDataEncryptionKey = convoIdsAndTheirPlaintextDEKs.get(convoIdOfMessage);
            }
            else {
                plaintextDataEncryptionKey = this.encryptionAndDecryptionService.decryptEncryptedAWSDataEncryptionKey(
                    convoIdsAndTheirDetails.get(convoIdOfMessage).getEncryptedDataEncryptionKey()
                );

                if(plaintextDataEncryptionKey == null) {
                    errorMessage += "• There was trouble decrypting new message " + messageId + ", which is for convo " +
                    convoIdOfMessage + "\n";
                    continue;
                }
            }

            String messageSenderIdAsString = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                encryptedNewMessage.getEncryptedSender(),
                plaintextDataEncryptionKey,
                encryptedNewMessage.getSenderEncryptionIv(),
                encryptedNewMessage.getSenderEncryptionAuthTag()
            );

            int messageSenderId = Integer.parseInt(messageSenderIdAsString);

            String decryptedMessage = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                encryptedNewMessage.getEncryptedMessage(),
                plaintextDataEncryptionKey,
                encryptedNewMessage.getMessageEncryptionIv(),
                encryptedNewMessage.getMessageEncryptionAuthTag()
            );

            orderedNewMessagesOfListOfConvos.add(
                new DecryptedUserMessage(
                    encryptedNewMessage.getId(),
                    convoIdOfMessage,
                    messageSenderId,
                    decryptedMessage,
                    encryptedNewMessage.getSentAt()
                )
            );
        }
        
        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("orderedNewMessagesOfListOfConvos", orderedNewMessagesOfListOfConvos);
        
        return output;
    }


    @PostMapping("/getOrderedUptoDateMessagesOfMultipleConvos")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getOrderedUptoDateMessagesOfMultipleConvos(HttpServletRequest request, HttpServletResponse
    response, @RequestBody HashMap<String, Object> convoIdsInfo) throws Exception {
        String errorMessage = "";

        HashSet<Integer> setOfConvoIds = new HashSet<Integer>((ArrayList<Integer>) convoIdsInfo.get("convoIds"));

        Object resultOfGettingDetailsOfConvos = this.convoInfoFetchingService.getDetailsOfMultipleConvos(
            new ArrayList<Integer>(setOfConvoIds),
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingDetailsOfConvos instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingDetailsOfConvos)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashMap<Integer, UserConvo> convoIdsAndTheirDetails = (HashMap<Integer, UserConvo>) resultOfGettingDetailsOfConvos;

        HashMap<Integer, byte[]> convoIdsAndTheirPlaintextDEKs = new HashMap<Integer, byte[]>();
        HashSet<Integer> newSetOfConvoIds = new HashSet<Integer>();

        for(int convoId : setOfConvoIds) {
            byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService.decryptEncryptedAWSDataEncryptionKey(
                convoIdsAndTheirDetails.get(convoId).getEncryptedDataEncryptionKey()
            );

            if (plaintextDataEncryptionKey != null) {
                convoIdsAndTheirPlaintextDEKs.put(convoId, plaintextDataEncryptionKey);
                newSetOfConvoIds.add(convoId);
            }
            else {
                errorMessage += "• There was trouble getting the plaintext-DEK of user-convo " + convoId + "\n";
            }
        }

        HashMap<Integer, ArrayList<DecryptedUserMessage>> convosAndTheirOrderedUptoDateMessages = new
        HashMap<Integer, ArrayList<DecryptedUserMessage>>();
        for (int convoId : setOfConvoIds) {
            if (newSetOfConvoIds.contains(convoId)) {
                convosAndTheirOrderedUptoDateMessages.put(convoId, new ArrayList<DecryptedUserMessage>());
            }
            else {
                convosAndTheirOrderedUptoDateMessages.put(convoId, null);
            }
        }

        if (newSetOfConvoIds.size() == 0) {
            HashMap<String, Object> output = new HashMap<String, Object>();
            output.put("ErrorMessage", errorMessage);
            output.put("convosAndTheirOrderedUptoDateMessages", convosAndTheirOrderedUptoDateMessages);
            
            return output;
        }

        setOfConvoIds = newSetOfConvoIds;

        ArrayList<UserMessage> encryptedUptoDateMessagesOfConvos = null;
        try {
            encryptedUptoDateMessagesOfConvos = this.userMessageRepository.getOrderedUptoDateMessagesOfMultipleConvos(
                setOfConvoIds
            );
        }
        catch (Exception e) {
            errorMessage += "• There was trouble fetching the asked-for data from the database\n";
            throw new BadGatewayException(errorMessage);
        }

        for (UserMessage encryptedUptoDateMessage : encryptedUptoDateMessagesOfConvos) {
            int convoIdOfMessage = encryptedUptoDateMessage.getConvoId();
            byte[] plaintextDataEncryptionKey = convoIdsAndTheirPlaintextDEKs.get(convoIdOfMessage);

            String messageSenderIdAsString = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                encryptedUptoDateMessage.getEncryptedSender(),
                plaintextDataEncryptionKey,
                encryptedUptoDateMessage.getSenderEncryptionIv(),
                encryptedUptoDateMessage.getSenderEncryptionAuthTag()
            );

            int messageSenderId = Integer.parseInt(messageSenderIdAsString);

            String decryptedMessage = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                encryptedUptoDateMessage.getEncryptedMessage(),
                plaintextDataEncryptionKey,
                encryptedUptoDateMessage.getMessageEncryptionIv(),
                encryptedUptoDateMessage.getMessageEncryptionAuthTag()
            );

            convosAndTheirOrderedUptoDateMessages.get(convoIdOfMessage).add(
                new DecryptedUserMessage(
                    encryptedUptoDateMessage.getId(),
                    convoIdOfMessage,
                    messageSenderId,
                    decryptedMessage,
                    encryptedUptoDateMessage.getSentAt()
                )
            );
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("convosAndTheirOrderedUptoDateMessages", convosAndTheirOrderedUptoDateMessages);
        
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
        Bandwidth limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));

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
