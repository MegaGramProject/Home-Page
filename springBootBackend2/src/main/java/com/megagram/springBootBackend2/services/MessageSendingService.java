package com.megagram.springBootBackend2.services;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.UserMessage;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserConvoRepository;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserMessageRepository;


@SuppressWarnings("unchecked")
@Service
public class MessageSendingService {


    public MessageSendingService() {}


    public HashMap<String, Object> sendMessageToSpecifiedMembersAsGroup(UserConvoRepository userConvoRepository,
    UserMessageRepository userMessageRepository, RedisTemplate<String, Object> redisTemplate, EncryptionAndDecryptionService
    encryptionAndDecryptionService, ConvoInfoFetchingService convoInfoFetchingService, HashSet<Integer>
    allSpecifiedMembersToSendTo, HashMap<Integer, UserConvo> authUserConvosAndTheirDetails, HashMap<Integer, byte[]>
    authUserConvosAndTheirPlaintextDEKs, String messageToSend, int authUserId, ObjectMapper objectMapper)
    throws Exception {
        int convoIdOfNewMessage = -1;
        String errorMessage = "";
        byte[] plaintextDataEncryptionKey = null;
        HashMap<String, Object> detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg = new HashMap<String, Object>();
        HashMap<String, Object> outcomeInfo = new HashMap<String, Object>();

        for (int convoIdOfAuthUser : authUserConvosAndTheirDetails.keySet()) {
            UserConvo detailsOfAuthUserConvo = authUserConvosAndTheirDetails.get(convoIdOfAuthUser);
            plaintextDataEncryptionKey = authUserConvosAndTheirPlaintextDEKs.get(convoIdOfAuthUser);

            String convoMembersAsString = encryptionAndDecryptionService
            .decryptTextWithAWSDataEncryptionKey(
                detailsOfAuthUserConvo.getEncryptedMembers(),
                plaintextDataEncryptionKey,
                detailsOfAuthUserConvo.getMembersEncryptionIv(),
                detailsOfAuthUserConvo.getMembersEncryptionAuthTag()
            );
            
            int[] convoMembers = null;

            try {
                convoMembers = objectMapper.readValue(convoMembersAsString, int[].class);
            }
            catch (IOException e) { }

            HashSet<Integer> setOfMembersOfConvo = new HashSet<Integer>();
            for(int convoMember: convoMembers) {
                setOfMembersOfConvo.add(convoMember);
            }
            
            if (setOfMembersOfConvo.equals(allSpecifiedMembersToSendTo)) {
                String convoMemberStatusesAsString = encryptionAndDecryptionService
                .decryptTextWithAWSDataEncryptionKey(
                    detailsOfAuthUserConvo.getEncryptedMemberStatuses(),
                    plaintextDataEncryptionKey,
                    detailsOfAuthUserConvo.getMemberStatusesEncryptionIv(),
                    detailsOfAuthUserConvo.getMemberStatusesEncryptionAuthTag()
                );
                
                int[] convoMemberStatuses = null;

                try {
                    convoMemberStatuses = objectMapper.readValue(convoMemberStatusesAsString, int[].class);
                }
                catch (IOException e) { }

                boolean authUserAcceptedThisConvo = true;
                boolean authUserIsTheOnlyAcceptedMemberOfConvo = true;

                for(int i=0; i<convoMembers.length; i++) {
                    int memberOfConvo = convoMembers[i];
                    int statusOfMember = convoMemberStatuses[i];

                    if (memberOfConvo == authUserId) {
                        if (statusOfMember == 0) {
                            authUserAcceptedThisConvo = false;
                            break;
                        }
                    }
                    else if (statusOfMember != 0){
                        authUserIsTheOnlyAcceptedMemberOfConvo = false;
                    }
                }

                if (authUserAcceptedThisConvo && authUserIsTheOnlyAcceptedMemberOfConvo) {
                    Object resultOfGettingNumMessagesOfAuthUserInThisConvo = convoInfoFetchingService
                    .getNumMessagesUserHasSentInSetOfConvos(
                        userConvoRepository,
                        userMessageRepository,
                        redisTemplate,
                        encryptionAndDecryptionService,
                        authUserId,
                        (HashSet<Integer>) Set.of(convoIdOfAuthUser)
                    );

                    if (resultOfGettingNumMessagesOfAuthUserInThisConvo instanceof String[]) {
                        errorMessage += "• There was trouble checking if you can send any messages to convo " +
                        convoIdOfAuthUser + ", which is a convo that contains some of(if not all) the members that you wanted to " + 
                        "send this message to, but you are the only accepted-member of it\n";
                    }
                    else {
                        HashMap<Integer, Integer> convosAndTheirNumMessagesByAuthUser = 
                        (HashMap<Integer, Integer>) resultOfGettingNumMessagesOfAuthUserInThisConvo;

                        int numMessagesByAuthUserInThisConvo = convosAndTheirNumMessagesByAuthUser.get(convoIdOfAuthUser);

                        if (numMessagesByAuthUserInThisConvo < 3) {
                            convoIdOfNewMessage = convoIdOfAuthUser;
                        }
                    }
                }
                else if (authUserAcceptedThisConvo) {
                    convoIdOfNewMessage = convoIdOfAuthUser;
                }

                if (convoIdOfNewMessage != -1) {
                    detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                        "convoMembers",
                        convoMembers
                    );

                    detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                        "convoMemberStatuses",
                        convoMemberStatuses
                    );
                    
                    detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                        "hasUnseenMessageOfEachMember",
                        detailsOfAuthUserConvo.getHasUnseenMessageOfEachMember()
                    );

                    String datetimeOfEarliestMsgShownPerMemberAsJSONString = encryptionAndDecryptionService
                    .decryptTextWithAWSDataEncryptionKey(
                        detailsOfAuthUserConvo.getEncDatetimeOfEarliestMsgShownPerMember(),
                        plaintextDataEncryptionKey,
                        detailsOfAuthUserConvo.getDatetimeOfEarliestMsgShownPerMemberEncryptionIv(),
                        detailsOfAuthUserConvo.getDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag()
                    );
                    
                    String[] datetimeOfEarliestMsgShownPerMember = null;
    
                    try {
                        datetimeOfEarliestMsgShownPerMember = objectMapper.readValue(
                            datetimeOfEarliestMsgShownPerMemberAsJSONString, 
                            String[].class
                        );
                    }
                    catch (IOException e) { }

                    detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                        "datetimeOfEarliestMsgShownPerMember",
                        datetimeOfEarliestMsgShownPerMember
                    );
                }
            }

            if (convoIdOfNewMessage != -1) {
                break;
            }
        }

        if (convoIdOfNewMessage == -1) {
            String idOfNewAWSCMK = encryptionAndDecryptionService.createNewAWSCustomerMasterKey(
                "for encrypting/decrypting the data-encryption-key used for the encryption/decryption of " +
                " sensitive UserConvo data"
            );

            if (idOfNewAWSCMK == null) {
                errorMessage += "• There was trouble creating a new AWS Customer Master Key which is required for " +
                "generating, encrypting, and decrypting the data-encryption-key for keeping sensitive user-convo " +
                "information secure\n";
                
                outcomeInfo.put("ErrorMessage", errorMessage);
                outcomeInfo.put("status", "BAD_GATEWAY");
                return outcomeInfo;
            }

            byte[][] newDataEncryptionKeyInfo = encryptionAndDecryptionService.createNewAWSDataEncryptionKey(
                idOfNewAWSCMK
            );
            if (newDataEncryptionKeyInfo.length == 0) {
                errorMessage += "• There was trouble with the new AWS Customer Master Key generating and encrypting " +
                "the data-encryption-key for keeping sensitive user-convo information secure\n";
               
                outcomeInfo.put("ErrorMessage", errorMessage);
                outcomeInfo.put("status", "BAD_GATEWAY");
                return outcomeInfo;
            }

            plaintextDataEncryptionKey = newDataEncryptionKeyInfo[0];
            byte[] encryptedDataEncryptionKey = newDataEncryptionKeyInfo[1];

            UserConvo newUserConvo = new UserConvo();

            newUserConvo.setAwsCMKId(idOfNewAWSCMK);
            newUserConvo.setEncryptedDataEncryptionKey(encryptedDataEncryptionKey);
        
            int numberOfMembersToSendTo = allSpecifiedMembersToSendTo.size();
            int[] membersOfNewConvo = new int[numberOfMembersToSendTo];
            membersOfNewConvo[0] = authUserId;
            allSpecifiedMembersToSendTo.remove(authUserId);

            int index = 1;
            for(int memberId : allSpecifiedMembersToSendTo) {
                membersOfNewConvo[index] = memberId;
                index++;
            }

            allSpecifiedMembersToSendTo.add(authUserId);

            detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                "convoMembers",
                membersOfNewConvo
            );

            String membersOfNewConvoAsJSONString = objectMapper.writeValueAsString(membersOfNewConvo);

            byte[][] membersOfNewConvoEncryptionInfo = encryptionAndDecryptionService
            .encryptTextWithAWSDataEncryptionKey(
                membersOfNewConvoAsJSONString,
                plaintextDataEncryptionKey
            );

            newUserConvo.setEncryptedMembers(membersOfNewConvoEncryptionInfo[0]);
            newUserConvo.setMemberStatusesEncryptionIv(membersOfNewConvoEncryptionInfo[1]);
            newUserConvo.setMemberStatusesEncryptionAuthTag(membersOfNewConvoEncryptionInfo[2]);

            int[] memberStatusesOfNewConvo = new int[numberOfMembersToSendTo];
            memberStatusesOfNewConvo[0] = 1;
            for(int i=1; i< membersOfNewConvo.length; i++) {
                memberStatusesOfNewConvo[i] = 0;
            }

            detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                "convoMemberStatuses",
                memberStatusesOfNewConvo
            );

            String memberStatusesOfNewConvoAsJSONString = objectMapper.writeValueAsString(memberStatusesOfNewConvo);

            byte[][] memberStatusesOfNewConvoEncryptionInfo = encryptionAndDecryptionService
            .encryptTextWithAWSDataEncryptionKey(
                memberStatusesOfNewConvoAsJSONString,
                plaintextDataEncryptionKey
            );

            newUserConvo.setEncryptedMemberStatuses(memberStatusesOfNewConvoEncryptionInfo[0]);
            newUserConvo.setMemberStatusesEncryptionIv(memberStatusesOfNewConvoEncryptionInfo[1]);
            newUserConvo.setMemberStatusesEncryptionAuthTag(memberStatusesOfNewConvoEncryptionInfo[2]);

            String[] datetimeOfEarliestMsgShownPerMember = new String[numberOfMembersToSendTo];
            for(int i=0; i<membersOfNewConvo.length; i++) {
                datetimeOfEarliestMsgShownPerMember[i] = "beginning";
            }

            detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                "datetimeOfEarliestMsgShownPerMember",
                datetimeOfEarliestMsgShownPerMember
            );


            String datetimeOfEarliestMsgShownPerMemberAsJSONString = objectMapper.writeValueAsString(
                datetimeOfEarliestMsgShownPerMember
            );

            byte[][] datetimeOfEarliestMsgShownPerMemberEncryptionInfo = encryptionAndDecryptionService
            .encryptTextWithAWSDataEncryptionKey(
                datetimeOfEarliestMsgShownPerMemberAsJSONString,
                plaintextDataEncryptionKey
            );

            newUserConvo.setEncDatetimeOfEarliestMsgShownPerMember(
                datetimeOfEarliestMsgShownPerMemberEncryptionInfo[0]
            );
            newUserConvo.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                datetimeOfEarliestMsgShownPerMemberEncryptionInfo[1]
            );
            newUserConvo.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                datetimeOfEarliestMsgShownPerMemberEncryptionInfo[2]
            );

            boolean[] hasUnseenMessageOfEachMember = new boolean[numberOfMembersToSendTo];
            for(int i=0; i<membersOfNewConvo.length; i++) {
                hasUnseenMessageOfEachMember[i] = false;
            }

            detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
                "hasUnseenMessageOfEachMember",
                hasUnseenMessageOfEachMember
            );

            try {
                userConvoRepository.save(newUserConvo);
                convoIdOfNewMessage = newUserConvo.getId();
            }
            catch (Exception e) {
                errorMessage += "• There was trouble adding your new user-convo into the database\n";
                
                outcomeInfo.put("ErrorMessage", errorMessage);
                outcomeInfo.put("status", "BAD_GATEWAY");
                return outcomeInfo;
            }
        }

        UserMessage newUserMessage = new UserMessage();
        newUserMessage.setConvoId(convoIdOfNewMessage);

        byte[][] encryptedMessageSenderInfo = encryptionAndDecryptionService.encryptTextWithAWSDataEncryptionKey(
            String.valueOf(authUserId),
            plaintextDataEncryptionKey
        );

        newUserMessage.setEncryptedSender(encryptedMessageSenderInfo[0]);
        newUserMessage.setSenderEncryptionIv(encryptedMessageSenderInfo[1]);
        newUserMessage.setSenderEncryptionAuthTag(encryptedMessageSenderInfo[2]);

        byte[][] encryptedMessageInfo = encryptionAndDecryptionService.encryptTextWithAWSDataEncryptionKey(
            messageToSend,
            plaintextDataEncryptionKey
        );

        newUserMessage.setEncryptedMessage(encryptedMessageInfo[0]);
        newUserMessage.setMessageEncryptionIv(encryptedMessageInfo[1]);
        newUserMessage.setMessageEncryptionAuthTag(encryptedMessageInfo[2]);

        LocalDateTime localDateTimeOfNewlySentMessage = LocalDateTime.now();
        newUserMessage.setSentAt(localDateTimeOfNewlySentMessage);

        try {
            userMessageRepository.save(newUserMessage);
        }
        catch (Exception e) {
            errorMessage += "• There was trouble adding your new message into the database\n";
            
            outcomeInfo.put("ErrorMessage", errorMessage);
            outcomeInfo.put("status", "BAD_GATEWAY");
            return outcomeInfo;
        }

        int[] convoMembers = (int[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "convoMembers"
        );

        int[] convoMemberStatuses = (int[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "convoMemberStatuses"
        );

        String[] datetimeOfEarliestMsgShownPerMember =
        (String[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "datetimeOfEarliestMsgShownPerMember"
        );

        boolean[] hasUnseenMessageOfEachMember = (boolean[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "hasUnseenMessageOfEachMember"
        );
        
        for(int i=0; i<convoMembers.length; i++) {
            if (convoMembers[i] != authUserId) {
                hasUnseenMessageOfEachMember[i] = true;
            }

            if (convoMemberStatuses[i] == -1) {
                convoMemberStatuses[i] = 1;
                datetimeOfEarliestMsgShownPerMember[i] = localDateTimeOfNewlySentMessage.format(
                    DateTimeFormatter.ISO_LOCAL_DATE_TIME
                );
            }
        }

        String updatedConvoMemberStatusesAsJSONString = objectMapper.writeValueAsString(convoMemberStatuses);

        byte[][] updatedConvoMemberStatusesEncryptionInfo = encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            updatedConvoMemberStatusesAsJSONString,
            plaintextDataEncryptionKey
        );

        String updatedDatetimeOfEarliestMsgShownPerMemberAsJSONString = objectMapper.writeValueAsString(
            datetimeOfEarliestMsgShownPerMember
        );

        byte[][] updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo = encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            updatedDatetimeOfEarliestMsgShownPerMemberAsJSONString,
            plaintextDataEncryptionKey
        );

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoIdOfNewMessage);
            if (userConvoOptional.isPresent()) {
                UserConvo userConvoToUpdate = userConvoOptional.get();

                userConvoToUpdate.setEncryptedMemberStatuses(updatedConvoMemberStatusesEncryptionInfo[0]);
                userConvoToUpdate.setMemberStatusesEncryptionIv(updatedConvoMemberStatusesEncryptionInfo[1]);
                userConvoToUpdate.setMemberStatusesEncryptionAuthTag(updatedConvoMemberStatusesEncryptionInfo[2]);

                userConvoToUpdate.setEncDatetimeOfEarliestMsgShownPerMember(
                    updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo[0]
                );
                userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                    updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo[1]
                );
                userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                    updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo[2]
                );

                userConvoToUpdate.setHasUnseenMessageOfEachMember(
                    hasUnseenMessageOfEachMember
                );
                
                userConvoRepository.save(userConvoToUpdate);
            }
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating changed-fields of this new message's convo in the database\n";
            
            outcomeInfo.put("ErrorMessage", errorMessage);
            outcomeInfo.put("status", "BAD_GATEWAY");
            return outcomeInfo;
        }

        outcomeInfo.put("ErrorMessage", errorMessage);
        outcomeInfo.put("status", "CROSSED_THE_FINISH_LINE");
        outcomeInfo.put("convoIdOfNewMessage", convoIdOfNewMessage);
        return outcomeInfo;
    }


    public HashMap<String, Object> sendMessageToSpecificConvo(UserConvoRepository userConvoRepository,
    UserMessageRepository userMessageRepository, RedisTemplate<String, Object> redisTemplate, EncryptionAndDecryptionService
    encryptionAndDecryptionService, ConvoInfoFetchingService convoInfoFetchingService, HashMap<Integer, UserConvo>
    authUserConvosAndTheirDetails, HashMap<Integer, byte[]> authUserConvosAndTheirPlaintextDEKs, String messageToSend, int
    authUserId, int convoIdToSendMessageTo, ObjectMapper objectMapper)
    throws Exception {
        String errorMessage = "";
        byte[] plaintextDataEncryptionKey = null;
        HashMap<String, Object> detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg = new HashMap<String, Object>();
        HashMap<String, Object> outcomeInfo = new HashMap<String, Object>();

        if (!(authUserConvosAndTheirDetails.containsKey(convoIdToSendMessageTo))) {
            errorMessage += "• You cannot send a message to a convo that isn't yours\n";

            outcomeInfo.put("ErrorMessage", errorMessage);
            outcomeInfo.put("status", "UNAUTHORIZED");
            return outcomeInfo;
        }
        
        UserConvo detailsOfConvoToSendMessageTo = authUserConvosAndTheirDetails.get(convoIdToSendMessageTo);
        plaintextDataEncryptionKey = authUserConvosAndTheirPlaintextDEKs.get(convoIdToSendMessageTo);

        String convoMembersAsString = encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            detailsOfConvoToSendMessageTo.getEncryptedMembers(),
            plaintextDataEncryptionKey,
            detailsOfConvoToSendMessageTo.getMembersEncryptionIv(),
            detailsOfConvoToSendMessageTo.getMembersEncryptionAuthTag()
        );
        
        int[] convoMembers = null;

        try {
            convoMembers = objectMapper.readValue(convoMembersAsString, int[].class);
        }
        catch (IOException e) { }

        HashSet<Integer> setOfMembersOfConvo = new HashSet<Integer>();
        for(int convoMember: convoMembers) {
            setOfMembersOfConvo.add(convoMember);
        }
        
        String convoMemberStatusesAsString = encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            detailsOfConvoToSendMessageTo.getEncryptedMemberStatuses(),
            plaintextDataEncryptionKey,
            detailsOfConvoToSendMessageTo.getMemberStatusesEncryptionIv(),
            detailsOfConvoToSendMessageTo.getMemberStatusesEncryptionAuthTag()
        );
        
        int[] convoMemberStatuses = null;

        try {
            convoMemberStatuses = objectMapper.readValue(convoMemberStatusesAsString, int[].class);
        }
        catch (IOException e) { }

        boolean authUserAcceptedThisConvo = true;
        boolean authUserIsTheOnlyAcceptedMemberOfConvo = true;

        for(int i=0; i<convoMembers.length; i++) {
            int memberOfConvo = convoMembers[i];
            int statusOfMember = convoMemberStatuses[i];

            if (memberOfConvo == authUserId) {
                if (statusOfMember == 0) {
                    authUserAcceptedThisConvo = false;
                    break;
                }
            }
            else if (statusOfMember != 0){
                authUserIsTheOnlyAcceptedMemberOfConvo = false;
            }
        }

        if (authUserAcceptedThisConvo && authUserIsTheOnlyAcceptedMemberOfConvo) {
            Object resultOfGettingNumMessagesOfAuthUserInThisConvo = convoInfoFetchingService
            .getNumMessagesUserHasSentInSetOfConvos(
                userConvoRepository,
                userMessageRepository,
                redisTemplate,
                encryptionAndDecryptionService,
                authUserId,
                (HashSet<Integer>) Set.of(convoIdToSendMessageTo)
            );

            if (resultOfGettingNumMessagesOfAuthUserInThisConvo instanceof String[]) {
                errorMessage += "• There was trouble checking if you can send any messages to convo " +
                convoIdToSendMessageTo + ", which is a convo that contains some of(if not all) the members that you wanted to " + 
                "send this message to, but you are the only accepted-member of it\n";
            }
            else {
                HashMap<Integer, Integer> convosAndTheirNumMessagesByAuthUser = 
                (HashMap<Integer, Integer>) resultOfGettingNumMessagesOfAuthUserInThisConvo;

                int numMessagesByAuthUserInThisConvo = convosAndTheirNumMessagesByAuthUser.get(convoIdToSendMessageTo);

                if (numMessagesByAuthUserInThisConvo >= 3) {
                    errorMessage += "• You cannot send any more messages to convo " + convoIdToSendMessageTo + ", since " +
                    "you are the only accepted-member of the convo, and you have already sent 3 messages";

                    outcomeInfo.put("ErrorMessage", errorMessage);
                    outcomeInfo.put("status", "UNAUTHORIZED");
                    return outcomeInfo;
                }
            }
        }
        else if (!authUserAcceptedThisConvo) {
            errorMessage += "• You cannot send messages to convo " + convoIdToSendMessageTo + ", since " +
            "you haven't accepted it yet";

            outcomeInfo.put("ErrorMessage", errorMessage);
            outcomeInfo.put("status", "UNAUTHORIZED");
            return outcomeInfo;
        }

        detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
            "convoMembers",
            convoMembers
        );

        detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
            "convoMemberStatuses",
            convoMemberStatuses
        );
        
        detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
            "hasUnseenMessageOfEachMember",
            detailsOfConvoToSendMessageTo.getHasUnseenMessageOfEachMember()
        );

        String datetimeOfEarliestMsgShownPerMemberAsJSONString = encryptionAndDecryptionService
        .decryptTextWithAWSDataEncryptionKey(
            detailsOfConvoToSendMessageTo.getEncDatetimeOfEarliestMsgShownPerMember(),
            plaintextDataEncryptionKey,
            detailsOfConvoToSendMessageTo.getDatetimeOfEarliestMsgShownPerMemberEncryptionIv(),
            detailsOfConvoToSendMessageTo.getDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag()
        );
        
        String[] datetimeOfEarliestMsgShownPerMember = null;

        try {
            datetimeOfEarliestMsgShownPerMember = objectMapper.readValue(
                datetimeOfEarliestMsgShownPerMemberAsJSONString, 
                String[].class
            );
        }
        catch (IOException e) { }

        detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.put(
            "datetimeOfEarliestMsgShownPerMember",
            datetimeOfEarliestMsgShownPerMember
        );

        UserMessage newUserMessage = new UserMessage();
        newUserMessage.setConvoId(convoIdToSendMessageTo);

        byte[][] encryptedMessageSenderInfo = encryptionAndDecryptionService.encryptTextWithAWSDataEncryptionKey(
            String.valueOf(authUserId),
            plaintextDataEncryptionKey
        );

        newUserMessage.setEncryptedSender(encryptedMessageSenderInfo[0]);
        newUserMessage.setSenderEncryptionIv(encryptedMessageSenderInfo[1]);
        newUserMessage.setSenderEncryptionAuthTag(encryptedMessageSenderInfo[2]);

        byte[][] encryptedMessageInfo = encryptionAndDecryptionService.encryptTextWithAWSDataEncryptionKey(
            messageToSend,
            plaintextDataEncryptionKey
        );

        newUserMessage.setEncryptedMessage(encryptedMessageInfo[0]);
        newUserMessage.setMessageEncryptionIv(encryptedMessageInfo[1]);
        newUserMessage.setMessageEncryptionAuthTag(encryptedMessageInfo[2]);

        LocalDateTime localDateTimeOfNewlySentMessage = LocalDateTime.now();
        newUserMessage.setSentAt(localDateTimeOfNewlySentMessage);

        try {
            userMessageRepository.save(newUserMessage);
        }
        catch (Exception e) {
            errorMessage += "• There was trouble adding your new message into the database\n";
            
            outcomeInfo.put("ErrorMessage", errorMessage);
            outcomeInfo.put("status", "BAD_GATEWAY");
            return outcomeInfo;
        }

        convoMembers = (int[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "convoMembers"
        );

        convoMemberStatuses = (int[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "convoMemberStatuses"
        );

        datetimeOfEarliestMsgShownPerMember =
        (String[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "datetimeOfEarliestMsgShownPerMember"
        );

        boolean[] hasUnseenMessageOfEachMember = (boolean[]) detailsOfConvoThatAreSubjectToChangeAfterSendingNewMsg.get(
            "hasUnseenMessageOfEachMember"
        );
        
        for(int i=0; i<convoMembers.length; i++) {
            if (convoMembers[i] != authUserId) {
                hasUnseenMessageOfEachMember[i] = true;
            }

            if (convoMemberStatuses[i] == -1) {
                convoMemberStatuses[i] = 1;
                datetimeOfEarliestMsgShownPerMember[i] = localDateTimeOfNewlySentMessage.format(
                    DateTimeFormatter.ISO_LOCAL_DATE_TIME
                );
            }
        }

        String updatedConvoMemberStatusesAsJSONString = objectMapper.writeValueAsString(convoMemberStatuses);

        byte[][] updatedConvoMemberStatusesEncryptionInfo = encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            updatedConvoMemberStatusesAsJSONString,
            plaintextDataEncryptionKey
        );

        String updatedDatetimeOfEarliestMsgShownPerMemberAsJSONString = objectMapper.writeValueAsString(
            datetimeOfEarliestMsgShownPerMember
        );

        byte[][] updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo = encryptionAndDecryptionService
        .encryptTextWithAWSDataEncryptionKey(
            updatedDatetimeOfEarliestMsgShownPerMemberAsJSONString,
            plaintextDataEncryptionKey
        );

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoIdToSendMessageTo);
            if (userConvoOptional.isPresent()) {
                UserConvo userConvoToUpdate = userConvoOptional.get();

                userConvoToUpdate.setEncryptedMemberStatuses(updatedConvoMemberStatusesEncryptionInfo[0]);
                userConvoToUpdate.setMemberStatusesEncryptionIv(updatedConvoMemberStatusesEncryptionInfo[1]);
                userConvoToUpdate.setMemberStatusesEncryptionAuthTag(updatedConvoMemberStatusesEncryptionInfo[2]);

                userConvoToUpdate.setEncDatetimeOfEarliestMsgShownPerMember(
                    updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo[0]
                );
                userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                    updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo[1]
                );
                userConvoToUpdate.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                    updatedDatetimeOfEarliestMsgShownPerMemberEncryptionInfo[2]
                );

                userConvoToUpdate.setHasUnseenMessageOfEachMember(
                    hasUnseenMessageOfEachMember
                );
                
                userConvoRepository.save(userConvoToUpdate);
            }
        }
        catch (Exception e) {
            errorMessage += "• There was trouble updating changed-fields of this new message's convo in the database\n";
            
            outcomeInfo.put("ErrorMessage", errorMessage);
            outcomeInfo.put("status", "BAD_GATEWAY");
            return outcomeInfo;
        }

        outcomeInfo.put("ErrorMessage", errorMessage);
        outcomeInfo.put("status", "CROSSED_THE_FINISH_LINE");
        return outcomeInfo;
    }
}
