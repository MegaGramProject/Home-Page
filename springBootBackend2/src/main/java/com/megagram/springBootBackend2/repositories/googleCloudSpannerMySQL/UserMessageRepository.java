package com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.UserMessage;


@Repository
public interface UserMessageRepository extends JpaRepository<UserMessage, Integer> {

    
    @Query(
        "SELECT um FROM UserMessage um " +
        "WHERE um.convoId IN :setOfConvoIdsToInclude " +
        "AND um.sentAt = (SELECT MAX(subUm.sentAt) FROM UserMessage subUm WHERE subUm.convoId = um.convoId)"
    )
    ArrayList<UserMessage> getMostRecentMessagesOfMultipleConvoIds(
        @Param("setOfConvoIdsToInclude") HashSet<Integer> setOfConvoIdsToInclude
    );


    @Query(
        "SELECT um FROM UserMessage um " +
        "WHERE um.convoId = :convoId " +
        "AND um.id NOT IN :setOfMessageIdsToExclude " +
        "LIMIT :batchSize"
    )
    ArrayList<UserMessage> fetchBatchOfMostRecentMessagesOfConvo(
        @Param("batchSize") int batchSize,
        @Param("convoId") int convoId,
        @Param("setOfMessageIdsToExclude") HashSet<Integer> setOfMessageIdsToExclude
    );


    @Query(
        "SELECT um FROM UserMessage um " +
        "WHERE um.convoId = :convoId " +
        "AND um.id NOT IN :setOfMessageIdsToExclude " +
        "AND um.sentAt > :datetimeRestriction " +
        "LIMIT :batchSize"
    )
    ArrayList<UserMessage> fetchBatchOfMostRecentMessagesOfConvoWithDatetimeRestriction(
        @Param("batchSize") int batchSize,
        @Param("convoId") int convoId,
        @Param("setOfMessageIdsToExclude") HashSet<Integer> setOfMessageIdsToExclude,
        @Param("datetimeRestriction") LocalDateTime datetimeRestriction
    );


    @Query(
        "SELECT um.convoId FROM UserMessage um " +
        "WHERE um.id = :messageId"
    )
    Integer getConvoIdOfMessage(
        @Param("messageId") int messageId
    );


    @Query(
        "SELECT um FROM UserMessage um " +
        "WHERE um.convoId IN :setOfConvoIds " +
        "AND um.sentAt > :datetimeToFetchNewMessages " +
        "ORDER BY um.sentAt"
    )
    ArrayList<UserMessage> getOrderedNewMessagesForListOfConvos(
        @Param("setOfConvoIds") HashSet<Integer> setOfConvoIds,
        @Param("datetimeToFetchNewMessages") LocalDateTime datetimeToFetchNewMessages
    );


    @Query(
        "SELECT um FROM UserMessage um " +
        "WHERE um.convoId IN :setOfConvoIds " +
        "ORDER BY um.sentAt"
    )
    ArrayList<UserMessage> getOrderedUptoDateMessagesOfMultipleConvos(
        @Param("setOfConvoIds") HashSet<Integer> setOfConvoIds
    );


    @Query(
        "SELECT um FROM UserMessage um " +
        "WHERE um.convoId IN :setOfConvoIdsToInclude "
    )
    ArrayList<UserMessage> getAllMessagesOfSetOfConvos(
        @Param("setOfConvoIdsToInclude") HashSet<Integer> setOfConvoIdsToInclude
    );
}