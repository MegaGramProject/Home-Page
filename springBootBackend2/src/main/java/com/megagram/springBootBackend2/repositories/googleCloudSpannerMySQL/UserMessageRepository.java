package com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL;

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


}