package com.megagram.springBootBackend2.Controllers.RestAPI.UserConvo;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

        if (requestedConvosOfAuthUser.size() > 5) {
            batchOfMostRecentConvosOfAuthUser.put(
                "Requested",
                new ArrayList<>(requestedConvosOfAuthUser.subList(0, 5))
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
