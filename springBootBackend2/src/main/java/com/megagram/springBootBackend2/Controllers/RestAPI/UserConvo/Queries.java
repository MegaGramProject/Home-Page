package com.megagram.springBootBackend2.Controllers.RestAPI.UserConvo;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.megagram.springBootBackend2.exceptions.BadGatewayException;
import com.megagram.springBootBackend2.exceptions.ForbiddenException;
import com.megagram.springBootBackend2.exceptions.ResourceDoesNotExistException;
import com.megagram.springBootBackend2.exceptions.TooManyRequestsException;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.DecryptedUserConvo;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.DecryptedUserMessage;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserConvoRepository;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserMessageRepository;
import com.megagram.springBootBackend2.services.ConvoInfoFetchingService;
import com.megagram.springBootBackend2.services.EncryptionAndDecryptionService;
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
    private RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private UserAuthService userAuthService;
    @Autowired
    private UserConvoRepository userConvoRepository;
    @Autowired
    private UserMessageRepository userMessageRepository;
    @Autowired
    private UserInfoFetchingService userInfoFetchingService;
    @Autowired
    private ConvoInfoFetchingService convoInfoFetchingService;
    @Autowired
    private EncryptionAndDecryptionService encryptionAndDecryptionService;

    private final Map<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();

    
    public Queries() {}


    @PostMapping("/getBatchOfMyMostRecentConvos/{authUserId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getBatchOfMyMostRecentConvos(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestBody HashMap<String, List<Integer>> infoOnConvoIdsToExclude) throws Exception {
        this.processRequest(this.getClientIpAddress(request), "/getBatchOfMyMostRecentConvos");

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
        
        Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
            authUserId
        );
        if (resultOfGettingUserBlockings instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
            throw new BadGatewayException(errorMessage);
        }
        HashSet<Integer> setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;


        List<Integer> convoIdsToExclude = infoOnConvoIdsToExclude.get("convoIdsToExclude");
        convoIdsToExclude = convoIdsToExclude.stream()
            .filter(id -> id > 0)
            .collect(Collectors.toList());
        HashSet<Integer> setOfConvoIdsToExclude = new HashSet<>(convoIdsToExclude);

        ArrayList<UserConvo> allUserConvos = new ArrayList<UserConvo>();
        HashMap<String, Object> batchOfMostRecentConvosOfAuthUser = new HashMap<String, Object>();

        batchOfMostRecentConvosOfAuthUser.put("Requested", new ArrayList<DecryptedUserConvo>());
        batchOfMostRecentConvosOfAuthUser.put("Accepted with Seen Messages", new
        ArrayList<DecryptedUserConvo>());

        batchOfMostRecentConvosOfAuthUser.put("Accepted with Unseen Messages", new ArrayList<DecryptedUserConvo>());
        batchOfMostRecentConvosOfAuthUser.put("ErrorMessage", "");

        HashMap<Integer, byte[]> convoIdsAndTheirDataEncryptionKeys = new HashMap<Integer, byte[]>();

        try {
            allUserConvos = userConvoRepository.findAllExcept(setOfConvoIdsToExclude);
            for (UserConvo userConvo : allUserConvos) {
                int convoId = userConvo.getId();
                byte[] encryptedDataEncryptionKey = userConvo.getEncryptedDataEncryptionKey();
                byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService
                .decryptEncryptedAWSDataEncryptionKey(
                    encryptedDataEncryptionKey
                );
                if (plaintextDataEncryptionKey == null) {
                    errorMessage += "• There was trouble getting the plaintextDataEncryptionKey of " +
                    "convo " + convoId + ", which may or may not be a convo of yours\n";
                    continue;
                }
                convoIdsAndTheirDataEncryptionKeys.put(convoId, plaintextDataEncryptionKey);
    
                String stringifiedConvoMembers = this.encryptionAndDecryptionService
                .decryptTextWithAWSDataEncryptionKey(
                    userConvo.getEncryptedMembers(),
                    plaintextDataEncryptionKey,
                    userConvo.getMembersEncryptionIv(),
                    userConvo.getMemberStatusesEncryptionAuthTag()
                );

                int[] convoMembers;

                ObjectMapper objectMapper = new ObjectMapper();
                try {
                    convoMembers = objectMapper.readValue(stringifiedConvoMembers, int[].class);
                }
                catch (IOException e) {
                    continue;
                }
                
                int indexOfAuthUserInConvoMembers = -1;

                for (int i = 0; i < convoMembers.length; i++) {
                    if (convoMembers[i] == authUserId) {
                        indexOfAuthUserInConvoMembers = i;
                        break;
                    }
                }

                if(indexOfAuthUserInConvoMembers > -1) {
                    boolean authUserIsBlockedByEachConvoMember = true;
                    for (int i = 0; i < convoMembers.length; i++) {
                        if (i == indexOfAuthUserInConvoMembers) {
                            continue;
                        }
                        
                        if (!setOfAuthUserBlockings.contains(convoMembers[i])) {
                            authUserIsBlockedByEachConvoMember = false;
                            break;
                        }
                    }

                    if (authUserIsBlockedByEachConvoMember) {
                        continue;
                    }

                    String stringifiedMemberStatuses = this.encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncryptedMemberStatuses(),
                        plaintextDataEncryptionKey,
                        userConvo.getMemberStatusesEncryptionIv(),
                        userConvo.getMemberStatusesEncryptionAuthTag()
                    );

                    int[] memberStatuses;

                    objectMapper = new ObjectMapper();
                    try {
                        memberStatuses = objectMapper.readValue(
                            stringifiedMemberStatuses,
                            int[].class);
                    }
                    catch (IOException e) {
                        continue;
                    }

                    int convoMemberStatusOfAuthUser = memberStatuses[indexOfAuthUserInConvoMembers];

                    if (convoMemberStatusOfAuthUser == -1) {
                        continue;
                    }

                    String convoTitle = this.encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncryptedTitle(),
                        plaintextDataEncryptionKey,
                        userConvo.getTitleEncryptionIv(),
                        userConvo.getTitleEncryptionAuthTag()
                    );

                    String stringifiedDatetimeOfEarliestMsgShownPerMember = this
                    .encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncDatetimeOfEarliestMsgShownPerMember(),
                        plaintextDataEncryptionKey,
                        userConvo.getDatetimeOfEarliestMsgShownPerMemberEncryptionIv(),
                        userConvo.getDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag()
                    );

                    objectMapper = new ObjectMapper();
                    String[] datetimeOfEarliestMsgShownPerMember;

                    try {
                        datetimeOfEarliestMsgShownPerMember = objectMapper.readValue(
                            stringifiedDatetimeOfEarliestMsgShownPerMember,
                            String[].class
                        );
                    }
                    catch (IOException e) {
                        continue;
                    }

                    boolean authUserHasUnseenMessageInThisConvo = userConvo.getHasUnseenMessageOfEachMember()[
                        indexOfAuthUserInConvoMembers
                    ];

                    ArrayList<Integer> newConvoMembers = new ArrayList<Integer>();
                    for (int i = 0; i < convoMembers.length; i++) {
                        int convoMember = convoMembers[i];
    
                        if (!setOfAuthUserBlockings.contains(convoMember)) {
                            newConvoMembers.add(convoMember);
                        }
                    }

                    DecryptedUserConvo newDecryptedUserConvoOfAuthUser = new DecryptedUserConvo(
                        convoId,
                        convoTitle,
                        newConvoMembers.stream().mapToInt(Integer::intValue).toArray(),
                        null,
                        datetimeOfEarliestMsgShownPerMember[indexOfAuthUserInConvoMembers],
                        authUserHasUnseenMessageInThisConvo
                    );

                    if (convoMemberStatusOfAuthUser == 0) {
                        ((ArrayList<DecryptedUserConvo>)batchOfMostRecentConvosOfAuthUser.
                        get("Requested")).add(
                            newDecryptedUserConvoOfAuthUser
                        );
                    }
                    else {
                        if (authUserHasUnseenMessageInThisConvo) {
                            ((ArrayList<DecryptedUserConvo>)batchOfMostRecentConvosOfAuthUser
                            .get("Accepted with Unseen Messages")).add(
                                newDecryptedUserConvoOfAuthUser
                            );
                        }
                        else {
                            ((ArrayList<DecryptedUserConvo>)batchOfMostRecentConvosOfAuthUser
                            .get("Accepted with Seen Messages")).add(
                                newDecryptedUserConvoOfAuthUser
                            );
                        }
                    }
                }
            }
        }
        catch (Exception e) {
            errorMessage += "• There was trouble getting all the user-convos from the database\n";
            throw new BadGatewayException(errorMessage);
        }

        List<DecryptedUserConvo> requestedConvosOfAuthUser = (List<DecryptedUserConvo>)
        batchOfMostRecentConvosOfAuthUser.get(
            "Requested"
        );
        requestedConvosOfAuthUser.sort(Comparator.comparing(
            convo -> convo.getMostRecentUserMessage() != null ?
            convo.getMostRecentUserMessage().getSentAt() : null,
            Comparator.nullsLast(Comparator.reverseOrder())
        ));

        if (requestedConvosOfAuthUser.size() > 10) {
            batchOfMostRecentConvosOfAuthUser.put(
                "Requested",
                new ArrayList<>(requestedConvosOfAuthUser.subList(0,10))
            );
        }

        List<DecryptedUserConvo> acceptedConvosOfAuthUserWithUnseenMsgs = (List<DecryptedUserConvo>)
        batchOfMostRecentConvosOfAuthUser.get(
            "Accepted with Unseen Messages"
        );
        acceptedConvosOfAuthUserWithUnseenMsgs.sort(Comparator.comparing(
            convo -> convo.getMostRecentUserMessage() != null ?
            convo.getMostRecentUserMessage().getSentAt() : null,
            Comparator.nullsLast(Comparator.reverseOrder())
        ));

        if (acceptedConvosOfAuthUserWithUnseenMsgs.size() > 10) {
            batchOfMostRecentConvosOfAuthUser.put(
                "Accepted with Unseen Messages",
                new ArrayList<>(acceptedConvosOfAuthUserWithUnseenMsgs.subList(0, 10))
            );
        }

        List<DecryptedUserConvo> acceptedConvosOfAuthUserWithSeenMsgs = (List<DecryptedUserConvo>)
        batchOfMostRecentConvosOfAuthUser.get(
            "Accepted with Seen Messages"
        );
        acceptedConvosOfAuthUserWithSeenMsgs.sort(Comparator.comparing(
            convo -> convo.getMostRecentUserMessage() != null ?
            convo.getMostRecentUserMessage().getSentAt() : null,
            Comparator.nullsLast(Comparator.reverseOrder())
        ));

        if (acceptedConvosOfAuthUserWithSeenMsgs.size() > 10) {
            batchOfMostRecentConvosOfAuthUser.put(
                "Accepted with Seen Messages",
                new ArrayList<>(acceptedConvosOfAuthUserWithSeenMsgs.subList(0, 10))
            );
        }

        acceptedConvosOfAuthUserWithUnseenMsgs.addAll(acceptedConvosOfAuthUserWithSeenMsgs);
        batchOfMostRecentConvosOfAuthUser.put(
            "Accepted",
            acceptedConvosOfAuthUserWithUnseenMsgs
        );
        batchOfMostRecentConvosOfAuthUser.remove("Accepted with Unseen Messages");
        batchOfMostRecentConvosOfAuthUser.remove("Accepted with Seen Messages");
        

        HashSet<Integer> convoIdsOfAuthUser = new HashSet<Integer>();
        for (DecryptedUserConvo requestedUserConvoOfAuthUser : (List<DecryptedUserConvo>)
        batchOfMostRecentConvosOfAuthUser.get("Requested")) {
            convoIdsOfAuthUser.add(requestedUserConvoOfAuthUser.getId());
        }

        for (DecryptedUserConvo acceptedUserConvoOfAuthUser : (List<DecryptedUserConvo>)
        batchOfMostRecentConvosOfAuthUser.get("Accepted")) {
            convoIdsOfAuthUser.add(acceptedUserConvoOfAuthUser.getId());
        }

        if (convoIdsOfAuthUser.size() > 0) {
            Object resultOfGettingMostRecentMessagesOfMultipleConvos = convoInfoFetchingService
            .getMostRecentMessagesOfMultipleConvos(
                convoIdsOfAuthUser,
                this.userMessageRepository,
                convoIdsAndTheirDataEncryptionKeys,
                this.encryptionAndDecryptionService
            );
            if (resultOfGettingMostRecentMessagesOfMultipleConvos instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfGettingMostRecentMessagesOfMultipleConvos)[0] +
                "\n";
            }

            HashMap<Integer, DecryptedUserMessage> convoIdsAndTheirMostRecentMessages = (HashMap<
            Integer, DecryptedUserMessage>) resultOfGettingMostRecentMessagesOfMultipleConvos;

            for (DecryptedUserConvo requestedUserConvoOfAuthUser : (List<DecryptedUserConvo>)
            batchOfMostRecentConvosOfAuthUser.get("Requested")) {
                requestedUserConvoOfAuthUser.setMostRecentUserMessage(
                    convoIdsAndTheirMostRecentMessages.get(requestedUserConvoOfAuthUser.getId())
                );
            }

            for (DecryptedUserConvo acceptedUserConvoOfAuthUser : (List<DecryptedUserConvo>)
            batchOfMostRecentConvosOfAuthUser.get("Accepted")) {
                acceptedUserConvoOfAuthUser.setMostRecentUserMessage(
                    convoIdsAndTheirMostRecentMessages.get(acceptedUserConvoOfAuthUser.getId())
                );
            }
        }

        batchOfMostRecentConvosOfAuthUser.put("ErrorMessage", errorMessage);

        return batchOfMostRecentConvosOfAuthUser;
    }

    
    @GetMapping("/getStatusOfUserInConvo/{userId}/{convoId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getStatusOfUserInConvo(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int userId, @RequestParam int convoId) throws Exception {
        String errorMessage = "";
        
        Object resultOfGettingConvoDetails = this.convoInfoFetchingService.getConvoDetails(
            convoId, 
            this.redisTemplate,
            this.userConvoRepository
        );
        if (resultOfGettingConvoDetails instanceof String[]) {
            errorMessage += "• " + ((String[]) resultOfGettingConvoDetails)[0] + "\n";
            if (((String[]) resultOfGettingConvoDetails)[1].equals("NOT_FOUND")) {
                throw new ResourceDoesNotExistException(errorMessage);
            }   
            throw new BadGatewayException(errorMessage);
        }
        UserConvo userConvo = (UserConvo) resultOfGettingConvoDetails;

        byte[] encryptedDataEncryptionKey = userConvo.getEncryptedDataEncryptionKey();
        byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService
        .decryptEncryptedAWSDataEncryptionKey(
            encryptedDataEncryptionKey
        );
        if (plaintextDataEncryptionKey == null) {
            errorMessage += "• There was trouble getting the plaintextDataEncryptionKey of the specified convo\n";
            throw new BadGatewayException(errorMessage);
        }

        String stringifiedConvoMembers = this.encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            userConvo.getEncryptedMembers(),
            plaintextDataEncryptionKey,
            userConvo.getMembersEncryptionIv(),
            userConvo.getMemberStatusesEncryptionAuthTag()
        );

        int[] convoMembers = null;
        ObjectMapper objectMapper = new ObjectMapper();

        try {
            convoMembers = objectMapper.readValue(stringifiedConvoMembers, int[].class);
        }
        catch (IOException e) {}

        int indexOfUserInConvoMembers = -1;
        for(int i=0; i<convoMembers.length; i++) {
            if (convoMembers[i] == userId) {
                indexOfUserInConvoMembers = i;
                break;
            }
        }

        String usersStatusInConvo = null;

        if (indexOfUserInConvoMembers == -1) {
            usersStatusInConvo = "not a member";
        }
        else {
            String stringifiedMemberStatuses = this.encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                userConvo.getEncryptedMemberStatuses(),
                plaintextDataEncryptionKey,
                userConvo.getMemberStatusesEncryptionIv(),
                userConvo.getMemberStatusesEncryptionAuthTag()
            );
    
            int[] memberStatuses = null;
    
            try {
                memberStatuses = objectMapper.readValue(stringifiedMemberStatuses, int[].class);
            }
            catch (IOException e) {}

            if (memberStatuses[indexOfUserInConvoMembers] > 0) {
                usersStatusInConvo = "is member";
            }
            else {
                usersStatusInConvo = "is requested to be member";
            }
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("usersStatusInConvo", usersStatusInConvo);
        return output;
    }


    @GetMapping("/getAcceptedConvoIdsOfUser/{userId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getAcceptedConvoIdsOfUser(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int userId) throws Exception {
        String errorMessage = "";

        ArrayList<Integer> acceptedConvoIdsOfUser = new ArrayList<Integer>();
        List<UserConvo> allUserConvos = null;

        try {
            allUserConvos = this.userConvoRepository.findAll();
        }
        catch (Exception e) {
            errorMessage += "• There was trouble getting all the convos from the database\n";
            throw new BadGatewayException(errorMessage);
        }

        for(UserConvo userConvo : allUserConvos) {
            byte[] encryptedDataEncryptionKey = userConvo.getEncryptedDataEncryptionKey();
            byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService
            .decryptEncryptedAWSDataEncryptionKey(
                encryptedDataEncryptionKey
            );

            if (plaintextDataEncryptionKey == null) {
                errorMessage += "• There was trouble getting the plaintextDataEncryptionKey of convo " +
                userConvo.getId() + ", which may or may not be an accepted convo-id of user " + userId + "\n";
            }
            else {
                String stringifiedConvoMembers = this.encryptionAndDecryptionService
                .decryptTextWithAWSDataEncryptionKey(
                    userConvo.getEncryptedMembers(),
                    plaintextDataEncryptionKey,
                    userConvo.getMembersEncryptionIv(),
                    userConvo.getMemberStatusesEncryptionAuthTag()
                );
        
                int[] convoMembers = null;
                ObjectMapper objectMapper = new ObjectMapper();
        
                try {
                    convoMembers = objectMapper.readValue(stringifiedConvoMembers, int[].class);
                }
                catch (IOException e) {}
        
                int indexOfUserInConvoMembers = -1;
                for(int i=0; i<convoMembers.length; i++) {
                    if (convoMembers[i] == userId) {
                        indexOfUserInConvoMembers = i;
                        break;
                    }
                }

                if (indexOfUserInConvoMembers > -1) {
                    String stringifiedMemberStatuses = this.encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncryptedMemberStatuses(),
                        plaintextDataEncryptionKey,
                        userConvo.getMemberStatusesEncryptionIv(),
                        userConvo.getMemberStatusesEncryptionAuthTag()
                    );
            
                    int[] memberStatuses = null;
            
                    try {
                        memberStatuses = objectMapper.readValue(stringifiedMemberStatuses, int[].class);
                    }
                    catch (IOException e) {}
        
                    if (memberStatuses[indexOfUserInConvoMembers] > 0) {
                        acceptedConvoIdsOfUser.add(userConvo.getId());
                    }
                }
            }
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("acceptedConvoIdsOfUser", acceptedConvoIdsOfUser);
        return output;
    }


    @PostMapping("/getAcceptedConvoIdsOfMultipleUsers")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getAcceptedConvoIdsOfMultipleUsers(HttpServletRequest request, HttpServletResponse response,
    @RequestBody HashMap<String, ArrayList<Integer>> userIdsInfo) throws Exception {
        HashSet<Integer> setOfUserIds = new HashSet<Integer>(userIdsInfo.get("userIds"));
        String errorMessage = "";

        HashMap<Integer, ArrayList<Integer>> usersAndTheirAcceptedConvoIds = new HashMap<Integer, ArrayList<Integer>>();
        for(int userId : setOfUserIds) {
            usersAndTheirAcceptedConvoIds.put(userId, new ArrayList<Integer>());
        }

        List<UserConvo> allUserConvos = null;

        try {
            allUserConvos = this.userConvoRepository.findAll();
        }
        catch (Exception e) {
            errorMessage += "• There was trouble getting all the convos from the database\n";
            throw new BadGatewayException(errorMessage);
        }

        for(UserConvo userConvo : allUserConvos) {
            byte[] encryptedDataEncryptionKey = userConvo.getEncryptedDataEncryptionKey();
            byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService
            .decryptEncryptedAWSDataEncryptionKey(
                encryptedDataEncryptionKey
            );

            if (plaintextDataEncryptionKey == null) {
                errorMessage += "• There was trouble getting the plaintextDataEncryptionKey of convo " +
                userConvo.getId() + ", which may or may not be an accepted convo-id of one of the users in the provided list\n";
            }
            else {
                String stringifiedConvoMembers = this.encryptionAndDecryptionService
                .decryptTextWithAWSDataEncryptionKey(
                    userConvo.getEncryptedMembers(),
                    plaintextDataEncryptionKey,
                    userConvo.getMembersEncryptionIv(),
                    userConvo.getMemberStatusesEncryptionAuthTag()
                );
        
                int[] convoMembers = null;
                ObjectMapper objectMapper = new ObjectMapper();
        
                try {
                    convoMembers = objectMapper.readValue(stringifiedConvoMembers, int[].class);
                }
                catch (IOException e) {}

                HashMap<Integer, Integer> membersAndTheirIndices = new HashMap<Integer, Integer>();
        
                for(int i=0; i<convoMembers.length; i++) {
                    int convoMember = convoMembers[i];
                    if (setOfUserIds.contains(convoMember)) {
                        membersAndTheirIndices.put(convoMember, i);
                    }
                }

                if (!(membersAndTheirIndices.isEmpty())) {
                    String stringifiedMemberStatuses = this.encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncryptedMemberStatuses(),
                        plaintextDataEncryptionKey,
                        userConvo.getMemberStatusesEncryptionIv(),
                        userConvo.getMemberStatusesEncryptionAuthTag()
                    );
            
                    int[] memberStatuses = null;
            
                    try {
                        memberStatuses = objectMapper.readValue(stringifiedMemberStatuses, int[].class);
                    }
                    catch (IOException e) {}

                    int convoId = userConvo.getId();
        
                    for(int member : membersAndTheirIndices.keySet()) {
                        int indexOfMemberInConvoMembers = membersAndTheirIndices.get(member);
                        int statusOfMember = memberStatuses[indexOfMemberInConvoMembers];
                        if (statusOfMember > 0) {
                            usersAndTheirAcceptedConvoIds.get(member).add(convoId);
                        }
                    }
                }
            }
        }

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("usersAndTheirAcceptedConvoIds", usersAndTheirAcceptedConvoIds);
        return output;
    }


    @GetMapping("/getMessageSendingSuggestions/{authUserId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getMessageSendingSuggestions(HttpServletRequest request, HttpServletResponse response,
    @RequestParam int authUserId, @RequestBody HashMap<String, String> infoOnInputText)
    throws Exception {
        if (authUserId < 1 && authUserId != -1) {
            throw new BadRequestException(
                "There does not exist a user with the provided authUserId. If you are an anonymous guest, you must set the " +
                "the authUserId to -1"
            );
        }

        String inputText = "";
        if(infoOnInputText.containsKey("inputText")) {
            inputText = infoOnInputText.get("inputText");
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

        HashSet<Integer> setOfAuthUserBlockings = new HashSet<Integer>();
        ArrayList<HashMap<String, Object>> messageSendingSuggestions = new ArrayList<HashMap<String, Object>>();
        HashSet<Integer> setOfUserIdsThatAuthUserHasOneOnOneConvosWith = new HashSet<Integer>();
        HashMap<Integer, ArrayList<Integer>> usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser = new HashMap<Integer,
        ArrayList<Integer>>();

        HashSet<Integer> setOfUserIdsOfAuthUserGroupChatsWithNoTitle = new HashSet<Integer>();
        HashMap<Integer, ArrayList<Integer>> idsOfAuthUserGroupChatsWithNoTitlesAndTheirMembers = new HashMap<Integer,
        ArrayList<Integer>>();
        HashSet<Integer> setOfSuggestedConvoIds = new HashSet<Integer>();
        String errorMessage = "";

        if (!authUserIsAnonymousGuest) {
            Object resultOfGettingUserBlockings = this.userInfoFetchingService.getBlockingsOfUser(
                authUserId
            );
            if (resultOfGettingUserBlockings instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfGettingUserBlockings)[0] + "\n";
                throw new BadGatewayException(errorMessage);
            }
            
            setOfAuthUserBlockings = (HashSet<Integer>) resultOfGettingUserBlockings;

            ArrayList<UserConvo> allUserConvos = new ArrayList<UserConvo>();

            try {
                allUserConvos = (ArrayList<UserConvo>) this.userConvoRepository.findAll();
            }
            catch (Exception e) {
                errorMessage += "• There was trouble getting all the user-convos from the database\n";
            }
    
            for(UserConvo userConvo : allUserConvos) {
                byte[] encryptedDataEncryptionKey = userConvo.getEncryptedDataEncryptionKey();
                byte[] plaintextDataEncryptionKey = this.encryptionAndDecryptionService
                .decryptEncryptedAWSDataEncryptionKey(
                    encryptedDataEncryptionKey
                );
    
                if (plaintextDataEncryptionKey == null) {
                    errorMessage += "• There was trouble getting the plaintextDataEncryptionKey of convo " +
                    userConvo.getId() + ", which may or may not be a valid message-sending-suggestion for the given input-text\n";
                }
                else {
                    String stringifiedConvoMembers = this.encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncryptedMembers(),
                        plaintextDataEncryptionKey,
                        userConvo.getMembersEncryptionIv(),
                        userConvo.getMemberStatusesEncryptionAuthTag()
                    );
            
                    ArrayList<Integer> convoMembers = null;
                    ObjectMapper objectMapper = new ObjectMapper();
            
                    try {
                        convoMembers = objectMapper.readValue(stringifiedConvoMembers, ArrayList.class);
                    }
                    catch (IOException e) {}
    
                    int indexOfAuthUserInConvoMembers = -1;
            
                    for(int i=0; i<convoMembers.size(); i++) {
                        int convoMember = convoMembers.get(i);
    
                        if (convoMember == authUserId) {
                            indexOfAuthUserInConvoMembers = i;
                            break;
                        }
                    }
    
                    if (indexOfAuthUserInConvoMembers == -1) {
                        continue;
                    }
                    else {
                        ArrayList<Integer> newConvoMembers = new ArrayList<Integer>();
    
                        for(int i=0; i<convoMembers.size(); i++) {
                            int convoMember = convoMembers.get(i);
        
                            if(!setOfAuthUserBlockings.contains(convoMember)) {
                                newConvoMembers.add(convoMember);
                            }
                        }
                        
                        if (convoMembers.size() > 1 && newConvoMembers.size() == 1) {
                            continue;
                        }
                        else {
                            convoMembers = newConvoMembers;
                        }
                    }
    
                    String stringifiedMemberStatuses = this.encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        userConvo.getEncryptedMemberStatuses(),
                        plaintextDataEncryptionKey,
                        userConvo.getMemberStatusesEncryptionIv(),
                        userConvo.getMemberStatusesEncryptionAuthTag()
                    );
    
                    ArrayList<Integer> memberStatuses = null;
    
                    try {
                        memberStatuses = objectMapper.readValue(
                            stringifiedMemberStatuses,
                            ArrayList.class);
                    }
                    catch (IOException e) {}
    
                    int convoMemberStatusOfAuthUser = memberStatuses.get(indexOfAuthUserInConvoMembers);
    
                    if (convoMemberStatusOfAuthUser < 1) {
                        continue;
                    }
    
                    String nameOfThisConvo = "";
                    byte[] encryptedConvoTitle = userConvo.getEncryptedTitle();
    
                    if (encryptedConvoTitle != null) {
                        nameOfThisConvo = this.encryptionAndDecryptionService
                        .decryptTextWithAWSDataEncryptionKey(
                            encryptedConvoTitle,
                            plaintextDataEncryptionKey,
                            userConvo.getTitleEncryptionIv(),
                            userConvo.getTitleEncryptionAuthTag()
                        );
    
                        if (nameOfThisConvo.startsWith(inputText)) {
                            setOfSuggestedConvoIds.add(userConvo.getId());
    
                            HashMap<String, Object> suggestionInfo = new HashMap<String, Object>();
                            suggestionInfo.put("userId", null);
                            suggestionInfo.put("groupChatId", userConvo.getId());
                            suggestionInfo.put("userOrGroupChatName", nameOfThisConvo);
                            messageSendingSuggestions.add(suggestionInfo);
                        }
                    }
                    else {
                        if (convoMembers.size() <= 2) {
                            for(int convoMember: convoMembers) {
                                setOfUserIdsThatAuthUserHasOneOnOneConvosWith.add(convoMember);

                                if (!usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser.containsKey(convoMember)) {
                                    usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser.put(convoMember, new ArrayList<Integer>());
                                }
                                usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser.get(convoMember).add(userConvo.getId());
                            }
                        }
                        else {
                            for(int convoMember: convoMembers) {
                                setOfUserIdsOfAuthUserGroupChatsWithNoTitle.add(convoMember);
                            }

                            idsOfAuthUserGroupChatsWithNoTitlesAndTheirMembers.put(userConvo.getId(), convoMembers);
                        }
                    }
                }
            }
        }

        boolean exactUsernameMatchToInputTextHasBeenFound = false;

        HashSet<Integer> combinedSetOfUserIds = new HashSet<Integer>(setOfUserIdsThatAuthUserHasOneOnOneConvosWith);
        combinedSetOfUserIds.addAll(setOfUserIdsOfAuthUserGroupChatsWithNoTitle);
        ArrayList<Integer> listOfUserIdsToGetUsernamesOf = new ArrayList<Integer>(combinedSetOfUserIds);

        if (listOfUserIdsToGetUsernamesOf.size() > 0) {
            Object resultOfGettingUsernamesOfUserIds = this.userInfoFetchingService.getUsernamesForListOfUserIds(
                authUserId,
                listOfUserIdsToGetUsernamesOf
            );
            if (resultOfGettingUsernamesOfUserIds instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfGettingUsernamesOfUserIds)[0] + " of members in your convos\n";
            }
            else {
                HashMap<Integer, String> usersAndTheirUsernames = (HashMap<Integer, String>)
                resultOfGettingUsernamesOfUserIds;
                
                for (int userId : usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser.keySet()) {
                    ArrayList<Integer> oneOnConvosOfThisUserAndAuthUser =
                    usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser.get(userId);

                    String username = usersAndTheirUsernames.get(userId);

                    if (username != null && username.startsWith(inputText)) {
                        for(int oneOnOneConvoId : oneOnConvosOfThisUserAndAuthUser) {
                            setOfSuggestedConvoIds.add(oneOnOneConvoId);
                        }

                        HashMap<String, Object> suggestionInfo = new HashMap<String, Object>();
                        suggestionInfo.put("userId", userId);
                        suggestionInfo.put("groupChatId", null);
                        suggestionInfo.put("userOrGroupChatName", username);
                        messageSendingSuggestions.add(suggestionInfo);

                        if (username.equals(inputText)) {
                            exactUsernameMatchToInputTextHasBeenFound = true;
                        }
                    }
                }

                for (int groupChatId : idsOfAuthUserGroupChatsWithNoTitlesAndTheirMembers.keySet()) {
                    ArrayList<Integer> membersOfThisConvo =
                    idsOfAuthUserGroupChatsWithNoTitlesAndTheirMembers.get(groupChatId);

                    ArrayList<String> usernamesOfMembersOfThisConvo = new ArrayList<String>();

                    for(int i=0; i<membersOfThisConvo.size(); i++) {
                        int convoMember = membersOfThisConvo.get(i);

                        if (convoMember != authUserId) {
                            String convoMemberName = usersAndTheirUsernames.get(convoMember);
                            if (convoMemberName != null) {
                                usernamesOfMembersOfThisConvo.add(convoMemberName);
                            }
                        }
                    }

                    String nameOfThisConvo = "Group-chat with ";
                    int numMembersOfThisConvoWithUsernames = usernamesOfMembersOfThisConvo.size();
                    
                    if (numMembersOfThisConvoWithUsernames > 1) {
                        for(int i=0; i<numMembersOfThisConvoWithUsernames; i++) {
                            nameOfThisConvo += usernamesOfMembersOfThisConvo.get(i);

                            if (i < numMembersOfThisConvoWithUsernames-2) {
                                nameOfThisConvo += ", ";
                            }
                            else if (i == numMembersOfThisConvoWithUsernames-2) {
                                if (numMembersOfThisConvoWithUsernames==2) {
                                    nameOfThisConvo += " and ";
                                }
                                else {
                                    nameOfThisConvo += ", and ";
                                }
                            }
                        }

                        if(nameOfThisConvo.startsWith(inputText)) {
                            setOfSuggestedConvoIds.add(groupChatId);

                            HashMap<String, Object> suggestionInfo = new HashMap<String, Object>();
                            suggestionInfo.put("userId", null);
                            suggestionInfo.put("groupChatId", groupChatId);
                            suggestionInfo.put("userOrGroupChatName", nameOfThisConvo);
                            messageSendingSuggestions.add(suggestionInfo);
                        }
                    }
                }
            }
        }

        if (!exactUsernameMatchToInputTextHasBeenFound && inputText.matches("^[a-z0-9._]{1,30}$")) {
            Object resultOfGettingUserIdOfExactMatchUser = this.userInfoFetchingService.getUserIdOfUsername(
                authUserId,
                inputText
            );

            if (resultOfGettingUserIdOfExactMatchUser instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfGettingUserIdOfExactMatchUser)[0] + "\n";
            }
            else {
                Integer userIdOfUserWhoseNameIsExactMatch = (Integer) resultOfGettingUserIdOfExactMatchUser;

                if (userIdOfUserWhoseNameIsExactMatch != null) {                    
                    HashMap<String, Object> suggestionInfo = new HashMap<String, Object>();
                    suggestionInfo.put("userId", userIdOfUserWhoseNameIsExactMatch);
                    suggestionInfo.put("groupChatId", null);
                    suggestionInfo.put("userOrGroupChatName", inputText);
                    messageSendingSuggestions.add(suggestionInfo);
                }
            }
        }

        HashSet<Integer> setOfAuthUserFollowings = new HashSet<Integer>();
        HashMap<Integer, String> potentialUserSuggestionsFollowedByAuthUserAndTheirUsernames = new HashMap<Integer, String>();
        ArrayList<HashMap<String, Object>> messageSendingSuggestionsDirectlyFromStrangers = new
        ArrayList<HashMap<String, Object>>();
        int numMessageSendingSuggestions = messageSendingSuggestions.size();
        int numMessageSendingSuggestionsFromAuthUserFollowings = 0;

        if (numMessageSendingSuggestions < 5) {
            if (!authUserIsAnonymousGuest) {
                Object resultOfGettingUserFollowings = this.userInfoFetchingService.getFollowingsOfUser(
                    authUserId
                );
                if (resultOfGettingUserFollowings instanceof String[]) {
                    errorMessage += "• " + ((String[]) resultOfGettingUserFollowings)[0] + "\n";
                }
                else {
                    setOfAuthUserFollowings = (HashSet<Integer>) resultOfGettingUserFollowings;
                }

                setOfAuthUserFollowings.removeAll(combinedSetOfUserIds);
                listOfUserIdsToGetUsernamesOf = new ArrayList<Integer>(setOfAuthUserFollowings);

                if (listOfUserIdsToGetUsernamesOf.size() > 0) {
                    Object resultOfGettingUsernamesOfUserIds = this.userInfoFetchingService.getUsernamesForListOfUserIds(
                        authUserId,
                        listOfUserIdsToGetUsernamesOf
                    );
                    if (resultOfGettingUsernamesOfUserIds instanceof String[]) {
                        errorMessage += "• " + ((String[]) resultOfGettingUsernamesOfUserIds)[0] + " of those that are followed " +
                        "by you" + "\n";
                    }
                    else {
                        HashMap<Integer, String> usersAndTheirUsernames = (HashMap<Integer, String>)
                        resultOfGettingUsernamesOfUserIds;
                        
                        for(int idOfUserFollowedByAuthUser : setOfAuthUserFollowings) {
                            String username = usersAndTheirUsernames.get(idOfUserFollowedByAuthUser);
                            
                            if (username != null && username.startsWith(inputText)) {
                                potentialUserSuggestionsFollowedByAuthUserAndTheirUsernames.put(
                                    idOfUserFollowedByAuthUser,
                                    username
                                );

                                numMessageSendingSuggestionsFromAuthUserFollowings++;
                            }
                        }
                    }
                }
            }

            if (numMessageSendingSuggestions + numMessageSendingSuggestionsFromAuthUserFollowings < 5) {
                HashSet<Integer> setOfUserIdsToExclude = new HashSet<Integer>();
                setOfUserIdsToExclude.addAll(setOfUserIdsThatAuthUserHasOneOnOneConvosWith);
                setOfUserIdsToExclude.addAll(potentialUserSuggestionsFollowedByAuthUserAndTheirUsernames.keySet());
                
                Object resultOfGettingOrderedListOfUserSuggestions = this.userInfoFetchingService
                .getOrderedListOfUserSuggestionsBasedOnNumFollowersAndOtherMetrics(
                    authUserId, 
                    setOfAuthUserFollowings,
                    setOfUserIdsToExclude,
                    inputText,
                    5 - (numMessageSendingSuggestions+numMessageSendingSuggestionsFromAuthUserFollowings)
                );

                if (resultOfGettingOrderedListOfUserSuggestions instanceof String[]) {
                    errorMessage += "• " + ((String[]) resultOfGettingOrderedListOfUserSuggestions)[0] + "\n";
                }
                else {
                    ArrayList<Integer> orderedListOfUserIds = (ArrayList<Integer>) ((HashMap<String, Object>)
                    resultOfGettingOrderedListOfUserSuggestions).get("ordered_list_of_user_ids");
                    ArrayList<String> orderedListOfUsernames = (ArrayList<String>) ((HashMap<String, Object>)
                    resultOfGettingOrderedListOfUserSuggestions).get("ordered_list_of_usernames");

                    for (int i=0; i<orderedListOfUserIds.size(); i++) {
                        int userId = orderedListOfUserIds.get(i);
                        String username = orderedListOfUsernames.get(i);

                        HashMap<String, Object> suggestionInfo = new HashMap<String, Object>();
                        suggestionInfo.put("userId", userId);
                        suggestionInfo.put("groupChatId", null);
                        suggestionInfo.put("userOrGroupChatName", username);
                        messageSendingSuggestionsDirectlyFromStrangers.add(suggestionInfo);
                    }
                }
            }
        }

        if (numMessageSendingSuggestions > 0) {
            Object resultOfGettingNumMessagesUserHasSentInEachConvo = this.convoInfoFetchingService
            .getNumMessagesUserHasSentInSetOfConvos(
                this.userConvoRepository,
                this.userMessageRepository,
                this.redisTemplate,
                this.encryptionAndDecryptionService,
                authUserId,
                setOfSuggestedConvoIds
            );

            if (resultOfGettingNumMessagesUserHasSentInEachConvo instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfGettingNumMessagesUserHasSentInEachConvo)[0] + "\n";

                if (numMessageSendingSuggestions>5) {
                    messageSendingSuggestions = new ArrayList<HashMap<String, Object>>(
                        messageSendingSuggestions.subList(0, 5)
                    );
                }
            }
            else {
                HashMap<Integer, Integer> convosAndTheirNumMessagesOfAuthUser = (HashMap<Integer, Integer>)
                resultOfGettingNumMessagesUserHasSentInEachConvo;

                for(HashMap<String, Object> suggestion : messageSendingSuggestions) {
                    int numMessagesOfAuthUser = 0;

                    if (suggestion.get("groupChatId") != null) {
                        numMessagesOfAuthUser = convosAndTheirNumMessagesOfAuthUser.get(
                            (int) suggestion.get("groupChatId")
                        );
                    }
                    else {
                        int userId = (int) suggestion.get("userId");
                        ArrayList<Integer> oneOnOneConvoIdsBetweenAuthUserAndThisUser =
                        usersAndTheIdsOfTheirOneOnOneConvosWithAuthUser.get(userId);
                        for(int oneOnOneConvoId : oneOnOneConvoIdsBetweenAuthUserAndThisUser) {
                            numMessagesOfAuthUser += convosAndTheirNumMessagesOfAuthUser.get(oneOnOneConvoId);
                        }
                    }

                    suggestion.put("numMessagesOfAuthUser", numMessagesOfAuthUser);
                }

                messageSendingSuggestions.sort((a, b) -> {
                    Integer valA = (Integer) a.get("numMessagesOfAuthUser");
                    Integer valB = (Integer) b.get("numMessagesOfAuthUser");
                    return valB.compareTo(valA);
                });

                ArrayList<HashMap<String, Object>> exactMatchSuggestions = new ArrayList<HashMap<String, Object>>();
                ArrayList<HashMap<String, Object>> inexactMatchSuggestions = new ArrayList<HashMap<String, Object>>();

                for(HashMap<String, Object> suggestion : messageSendingSuggestions) {
                    String userOrGroupChatName = (String) suggestion.get("userOrGroupChatName");

                    if (userOrGroupChatName.equals(inputText)) {
                        if (suggestion.get("userId") != null) {
                            exactMatchSuggestions.add(0, suggestion);
                        }
                        else {
                            exactMatchSuggestions.add(suggestion);
                        }
                    }
                    else {
                        inexactMatchSuggestions.add(suggestion);
                    }
                }

                messageSendingSuggestions = exactMatchSuggestions;
                messageSendingSuggestions.addAll(inexactMatchSuggestions);

                if (messageSendingSuggestions.size() > 5) {
                    messageSendingSuggestions = (ArrayList<HashMap<String, Object>>)
                    messageSendingSuggestions.subList(0, 5);
                }

                for (HashMap<String, Object> suggestion : messageSendingSuggestions) {
                    suggestion.remove("numMessagesOfAuthUser");
                }
            }
        }

        ArrayList<HashMap<String, Object>> additionalMessageSendingSuggestions = new ArrayList<HashMap<String,
        Object>>();

        if (numMessageSendingSuggestionsFromAuthUserFollowings > 0) {
            Object resultOfGettingOrderedAuthUserFollowings = this.userInfoFetchingService
            .getOrderedAuthUserFollowingsBasedOnNumFollowersAndOtherMetrics(
                authUserId,
                (HashSet<Integer>) potentialUserSuggestionsFollowedByAuthUserAndTheirUsernames.keySet(),
                5-numMessageSendingSuggestions
            );

            if (resultOfGettingOrderedAuthUserFollowings instanceof String[]) {
                errorMessage += "• " + ((String[]) resultOfGettingOrderedAuthUserFollowings)[0] + "\n";
            }
            else {
                ArrayList<Integer> orderedAuthUserFollowings = (ArrayList<Integer>)
                resultOfGettingOrderedAuthUserFollowings;

                for(int idOfUserFollowedByAuthUser : orderedAuthUserFollowings) {
                    String username = potentialUserSuggestionsFollowedByAuthUserAndTheirUsernames.get(
                        idOfUserFollowedByAuthUser
                    );

                    HashMap<String, Object> suggestionInfo = new HashMap<String, Object>();
                    suggestionInfo.put("userId", idOfUserFollowedByAuthUser);
                    suggestionInfo.put("groupChatId", null);
                    suggestionInfo.put("userOrGroupChatName", username);
                    additionalMessageSendingSuggestions.add(suggestionInfo);
                }
            }
        }

        additionalMessageSendingSuggestions.addAll(messageSendingSuggestionsDirectlyFromStrangers);
        messageSendingSuggestions.addAll(additionalMessageSendingSuggestions);

        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("ErrorMessage", errorMessage);
        output.put("messageSendingSuggestions", messageSendingSuggestions);
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
        Bandwidth limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1)));

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
