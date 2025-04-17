package com.megagram.springBootBackend2.services;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.DecryptedUserMessage;
import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.UserMessage;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserConvoRepository;
import com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL.UserMessageRepository;


@SuppressWarnings("unchecked")
@Service
public class ConvoInfoFetchingService {
    
    
    public ConvoInfoFetchingService() {}

    
    public Object getConvoDetails(int convoId, RedisTemplate<String, Object> redisTemplate, UserConvoRepository
    userConvoRepository) {
        UserConvo userConvoDetailsObject = new UserConvo();

        try {
            Map<Object, Object> cachedConvoDetails = redisTemplate.opsForHash().entries(
                "detailsForConvo"+convoId
            );

            if (cachedConvoDetails != null && cachedConvoDetails.size() > 0) {
                userConvoDetailsObject.setEncryptedTitle(
                    (byte[]) cachedConvoDetails.get("encryptedTitle")
                );
                userConvoDetailsObject.setTitleEncryptionIv(
                    (byte[]) cachedConvoDetails.get("titleEncryptionIv")
                );
                userConvoDetailsObject.setTitleEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get("titleEncryptionAuthTag")
                );

                userConvoDetailsObject.setEncryptedMembers(
                    (byte[]) cachedConvoDetails.get("encryptedMembers")
                );
                userConvoDetailsObject.setMembersEncryptionIv(
                    (byte[]) cachedConvoDetails.get("membersEncryptionIv")
                );
                userConvoDetailsObject.setMembersEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get("membersEncryptionAuthTag")
                );

                userConvoDetailsObject.setEncryptedMemberStatuses(
                    (byte[]) cachedConvoDetails.get("encryptedMemberStatuses")
                );
                userConvoDetailsObject.setMemberStatusesEncryptionIv(
                    (byte[]) cachedConvoDetails.get("memberStatusesEncryptionIv")
                );
                userConvoDetailsObject.setMemberStatusesEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get("memberStatusesEncryptionAuthTag")
                );

                userConvoDetailsObject.setEncryptedDataEncryptionKey(
                    (byte[]) cachedConvoDetails.get("encryptedDataEncryptionKey")
                );

                userConvoDetailsObject.setEncDatetimeOfEarliestMsgShownPerMember(
                    (byte[]) cachedConvoDetails.get("encDatetimeOfEarliestMsgShownPerMember")
                );
                userConvoDetailsObject.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                    (byte[]) cachedConvoDetails.get("datetimeOfEarliestMsgShownPerMemberEncryptionIv")
                );
                userConvoDetailsObject.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get(
                        "datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag"
                    )
                );

                boolean[] hasUnseenMessageOfEachMember = null;

                ObjectMapper objectMapper = new ObjectMapper();
                try {
                    hasUnseenMessageOfEachMember = objectMapper.readValue(
                        (String) cachedConvoDetails.get("hasUnseenMessageOfEachMember"), 
                        boolean[].class
                    );
                }
                catch (IOException e) {}

                userConvoDetailsObject.setHasUnseenMessageOfEachMember(
                    hasUnseenMessageOfEachMember
                );

                userConvoDetailsObject.setAwsCMKId(
                    (String) cachedConvoDetails.get(
                        "awsCMKId"
                    )
                );

                return userConvoDetailsObject;
            }
            return new String[] {
                "UserConvo " + convoId + " was not found",
                "NOT_FOUND"
            }; 
        }
        catch (Exception e) {
            //pass
        }

        try {
            Optional<UserConvo> userConvoOptional = userConvoRepository.findById(convoId);
            
            if (userConvoOptional.isPresent()) {
                userConvoDetailsObject = userConvoOptional.get();
            }
            else {
                return new String[] {
                    "UserConvo " + convoId + " was not found",
                    "NOT_FOUND"
                }; 
            }
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting the details of userConvo " + convoId +  " from the database",
                "BAD_GATEWAY"
            };
        }

        return userConvoDetailsObject;
    }


    public Object getMostRecentMessagesOfMultipleConvos(HashSet<Integer> setOfConvoIds,
    UserMessageRepository userMessageRepository, HashMap<Integer, byte[]>
    convoIdsAndTheirDataEncryptionKeys, EncryptionAndDecryptionService encryptionAndDecryptionService) {
        try {
            ArrayList<UserMessage> mostRecentMessagesOfMultipleConvoIds = userMessageRepository
            .getMostRecentMessagesOfMultipleConvoIds(setOfConvoIds);

            HashMap<Integer, DecryptedUserMessage> convoIdsAndTheirMostRecentMessages = new HashMap<
            Integer, DecryptedUserMessage>();

            for (UserMessage mostRecentMessageOfConvo : mostRecentMessagesOfMultipleConvoIds) {
                int convoId = mostRecentMessageOfConvo.getConvoId();
                byte[] plaintextDataEncryptionKey = convoIdsAndTheirDataEncryptionKeys.get(convoId);
                String message = encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
                    mostRecentMessageOfConvo.getEncryptedMessage(),
                    plaintextDataEncryptionKey,
                    mostRecentMessageOfConvo.getMessageEncryptionIv(),
                    mostRecentMessageOfConvo.getMessageEncryptionAuthTag()
                );

                String stringifiedSenderId = encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
                    mostRecentMessageOfConvo.getEncryptedSender(),
                    plaintextDataEncryptionKey,
                    mostRecentMessageOfConvo.getSenderEncryptionIv(),
                    mostRecentMessageOfConvo.getSenderEncryptionAuthTag()
                );
                int senderId = Integer.parseInt(stringifiedSenderId);

                convoIdsAndTheirMostRecentMessages.put(
                    convoId,
                    new DecryptedUserMessage(
                        mostRecentMessageOfConvo.getId(),
                        convoId,
                        senderId,
                        message,
                        mostRecentMessageOfConvo.getSentAt()
                    )
                );
            }

            return convoIdsAndTheirMostRecentMessages;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting the recent messages for each of the convo-ids in the list " +
                "from the database",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getDetailsOfMultipleConvos(ArrayList<Integer> convoIds, RedisTemplate<String, Object>
    redisTemplate, UserConvoRepository userConvoRepository) {
        HashMap<Integer, UserConvo> convoIdsAndTheirDetails = new HashMap<Integer, UserConvo>();

        try {
            List<Object> redisResults = redisTemplate.executePipelined(new SessionCallback<List<Object>>() {
                @Override
                public List<Object> execute(RedisOperations operations) {
                    List<Object> results = new ArrayList<>();
                    
                    for (int convoId : convoIds) {
                        results.add(operations.opsForHash().entries("detailsForConvo" + convoId));
                    }

                    return results;
                }
            });

            for (int i = 0; i < convoIds.size(); i++) {
                int convoId = convoIds.get(i);
                Object data = redisResults.get(i);
                Map<Object, Object> cachedConvoDetails = (Map<Object, Object>) data;
                
                UserConvo userConvoObject = new UserConvo();
                userConvoObject.setId(convoId);
                userConvoObject.setEncryptedTitle(
                    (byte[]) cachedConvoDetails.get("encryptedTitle")
                );
                userConvoObject.setTitleEncryptionIv(
                    (byte[]) cachedConvoDetails.get("titleEncryptionIv")
                );
                userConvoObject.setTitleEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get("titleEncryptionAuthTag")
                );

                userConvoObject.setEncryptedMembers(
                    (byte[]) cachedConvoDetails.get("encryptedMembers")
                );
                userConvoObject.setMembersEncryptionIv(
                    (byte[]) cachedConvoDetails.get("membersEncryptionIv")
                );
                userConvoObject.setMembersEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get("membersEncryptionAuthTag")
                );

                userConvoObject.setEncryptedMemberStatuses(
                    (byte[]) cachedConvoDetails.get("encryptedMemberStatuses")
                );
                userConvoObject.setMemberStatusesEncryptionIv(
                    (byte[]) cachedConvoDetails.get("memberStatusesEncryptionIv")
                );
                userConvoObject.setMemberStatusesEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get("memberStatusesEncryptionAuthTag")
                );

                userConvoObject.setEncryptedDataEncryptionKey(
                    (byte[]) cachedConvoDetails.get("encryptedDataEncryptionKey")
                );

                userConvoObject.setEncDatetimeOfEarliestMsgShownPerMember(
                    (byte[]) cachedConvoDetails.get("encDatetimeOfEarliestMsgShownPerMember")
                );
                userConvoObject.setDatetimeOfEarliestMsgShownPerMemberEncryptionIv(
                    (byte[]) cachedConvoDetails.get("datetimeOfEarliestMsgShownPerMemberEncryptionIv")
                );
                userConvoObject.setDatetimeOfEarliestMsgShownPerMemberEncryptionAuthTag(
                    (byte[]) cachedConvoDetails.get(
                        "datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag"
                    )
                );

                boolean[] hasUnseenMessageOfEachMember = null;

                ObjectMapper objectMapper = new ObjectMapper();
                try {
                    hasUnseenMessageOfEachMember = objectMapper.readValue(
                        (String) cachedConvoDetails.get("hasUnseenMessageOfEachMember"), 
                        boolean[].class
                    );
                }
                catch (IOException e) {}

                userConvoObject.setHasUnseenMessageOfEachMember(
                    hasUnseenMessageOfEachMember
                );

                userConvoObject.setAwsCMKId(
                    (String) cachedConvoDetails.get(
                        "awsCMKId"
                    )
                );

                convoIdsAndTheirDetails.put(convoId, userConvoObject);
            }

            return convoIdsAndTheirDetails;
        }
        catch (Exception e) {}

        try {
            ArrayList<UserConvo> userConvos = userConvoRepository.findSpecificConvosBasedOnIds(
                new HashSet<Integer>(convoIds)
            );
            for(UserConvo userConvo : userConvos) {
                convoIdsAndTheirDetails.put(
                    userConvo.getId(),
                    userConvo
                );
            }

            return convoIdsAndTheirDetails;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble fetching the details of each of the provided convo-ids from the database",
                "BAD_GATEWAY"
            };
        }
    }
    

    public Object getNumMessagesUserHasSentInSetOfConvos(UserConvoRepository userConvoRepository, UserMessageRepository
    userMessageRepository, RedisTemplate<String, Object> redisTemplate, EncryptionAndDecryptionService 
    encryptionAndDecryptionService, int authUserId, HashSet<Integer> setOfConvoIds) {
        HashMap<Integer, Integer> convosAndTheirNumMessagesOfAuthUser = new HashMap<Integer, Integer>();

        for (int convoId : setOfConvoIds) {
            convosAndTheirNumMessagesOfAuthUser.put(convoId, 0);
        }

        HashMap<Integer, byte[]> convosAndTheirPlaintextDEKs = new HashMap<Integer, byte[]>();

        try {
            ArrayList<UserMessage> messagesOfSetOfConvos = userMessageRepository.getAllMessagesOfSetOfConvos(setOfConvoIds);

            for(UserMessage message : messagesOfSetOfConvos) {
                int convoIdOfMessage = message.getConvoId();
                byte[] plaintextDataEncryptionKey = null;

                if (convosAndTheirPlaintextDEKs.containsKey(convoIdOfMessage)) {
                    plaintextDataEncryptionKey = convosAndTheirPlaintextDEKs.get(convoIdOfMessage);
                }
                else {
                    byte[] encryptedDataEncryptionKey = null;

                    try {
                        encryptedDataEncryptionKey = (byte[]) redisTemplate.opsForHash().get(
                            "detailsForConvo"+convoIdOfMessage, "encryptedDataEncryptionKey"
                        );
                    }
                    catch (Exception e) {}

                    if (encryptedDataEncryptionKey == null) {
                        try {
                            encryptedDataEncryptionKey = userConvoRepository.getEncryptedDataEncryptionKeyOfConvo(
                                convoIdOfMessage
                            );
                        }
                        catch (Exception e) {
                            continue;
                        }
                    }  
                    
                    plaintextDataEncryptionKey = encryptionAndDecryptionService
                    .decryptEncryptedAWSDataEncryptionKey(
                        encryptedDataEncryptionKey
                    );
                    if (plaintextDataEncryptionKey == null) {
                        continue;
                    }

                    convosAndTheirPlaintextDEKs.put(convoIdOfMessage, plaintextDataEncryptionKey);
                }

                String stringifiedSenderId = encryptionAndDecryptionService
                .decryptTextWithAWSDataEncryptionKey(
                    message.getEncryptedSender(),
                    plaintextDataEncryptionKey,
                    message.getSenderEncryptionIv(),
                    message.getSenderEncryptionAuthTag()
                );

                int senderId = Integer.parseInt(stringifiedSenderId);

                if (senderId == authUserId) {
                    convosAndTheirNumMessagesOfAuthUser.put(
                        convoIdOfMessage,
                        convosAndTheirNumMessagesOfAuthUser.get(convoIdOfMessage)+1
                    );
                }
            }

            return convosAndTheirNumMessagesOfAuthUser;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble fetching from the database all the messages of each of the convos in the provided set",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getInfoOnAllConvosOfUser(int authUserId, HashSet<Integer> setOfAuthUserBlockings, UserConvoRepository
    userConvoRepository, EncryptionAndDecryptionService encryptionAndDecryptionService) {
        HashMap<String, Object> infoOnAllConvosOfUser = new HashMap<String, Object>();
        HashMap<Integer, byte[]> convosAndTheirPlaintextDEKs = new HashMap<Integer, byte[]>();
        HashMap<Integer, UserConvo> authUserConvosAndTheirDetails = new HashMap<Integer, UserConvo>();
        ArrayList<UserConvo> allUserConvos = null;

        try {
            allUserConvos = (ArrayList<UserConvo>) userConvoRepository.findAll();
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble fetching all the user-convos from the database",
                "BAD_GATEWAY"
            };
        }

        for (UserConvo userConvo : allUserConvos) {
            byte[] encryptedDataEncryptionKey = userConvo.getEncryptedDataEncryptionKey();
            byte[] plaintextDataEncryptionKey = encryptionAndDecryptionService.decryptEncryptedAWSDataEncryptionKey(
                encryptedDataEncryptionKey
            );

            if (plaintextDataEncryptionKey == null) {
                continue;
            }

            byte[] encryptedMembersOfConvo = userConvo.getEncryptedMembers();
            String membersOfConvoAsString = encryptionAndDecryptionService.decryptTextWithAWSDataEncryptionKey(
                encryptedMembersOfConvo,
                plaintextDataEncryptionKey,
                userConvo.getMembersEncryptionIv(),
                userConvo.getMembersEncryptionAuthTag()
            );
            
            ArrayList<Integer> membersOfConvo = null;

            ObjectMapper objectMapper = new ObjectMapper();
            try {
                membersOfConvo = objectMapper.readValue(membersOfConvoAsString, ArrayList.class);
            }
            catch (IOException e) { }

            int indexOfAuthUserInConvoMembers = -1;
    
            for(int i = 0; i < membersOfConvo.size(); i++) {
                int convoMember = membersOfConvo.get(i);
    
                if(convoMember == authUserId) {
                    indexOfAuthUserInConvoMembers = i;
                }
            }

            if (indexOfAuthUserInConvoMembers == -1) {
                continue;
            }

            boolean authUserIsBlockedByEachConvoMember = true;

            for(int i = 0; i < membersOfConvo.size(); i++) {
                int convoMember = membersOfConvo.get(i);

                if (!setOfAuthUserBlockings.contains(convoMember)) {
                    authUserIsBlockedByEachConvoMember = false;
                    break;
                }
            }

            if (authUserIsBlockedByEachConvoMember) {
                continue;
            }

            int convoId = userConvo.getId();
            convosAndTheirPlaintextDEKs.put(convoId, plaintextDataEncryptionKey);
            authUserConvosAndTheirDetails.put(convoId, userConvo);
        }
        
        infoOnAllConvosOfUser.put("convosAndTheirPlaintextDEKs", convosAndTheirPlaintextDEKs);
        infoOnAllConvosOfUser.put("authUserConvosAndTheirDetails", authUserConvosAndTheirDetails);

        return infoOnAllConvosOfUser;
    }
}
