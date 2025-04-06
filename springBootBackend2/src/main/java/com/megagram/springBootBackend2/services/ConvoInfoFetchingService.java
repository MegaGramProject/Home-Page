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

    
    public Object getConvoDetails(int convoId, RedisTemplate<String, Object>
    redisTemplate, UserConvoRepository userConvoRepository) {
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
                "There was trouble fetching the details of each of the provided convo-ids from the " +
                "database",
                "BAD_GATEWAY"
            };
        }
    }
}
