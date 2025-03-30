package com.megagram.springBootBackend2.repositories.mssqlServer;

import java.util.ArrayList;
import java.util.HashSet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.megagram.springBootBackend2.models.mssqlServer.AdLinkClick;


@Repository
public interface AdLinkClickRepository extends JpaRepository<AdLinkClick, Integer> {
    
    
    @Query(
        "SELECT alc FROM AdLinkClick alc " +
        "WHERE alc.id NOT IN :setOfIdsToExclude " +
        "AND alc.overallPostId = :overallPostId " +
        "ORDER BY alc.datetimeOfClick DESC " +
        "LIMIT :limit"
    )
    ArrayList<AdLinkClick> getBatchOfAdLinkClicksOfSponsoredPost(
        @Param("setOfIdsToExclude")HashSet<Integer> setOfIdsToExclude,
        @Param("overallPostId") String overallPostId,
        @Param("limit") int limit
    );


    @Query(
        "SELECT alc.overallPostId, COUNT(alc.overallPostId) " +
        "FROM AdLinkClick alc " +
        "WHERE alc.overallPostId IN :setOfOverallPostIds " +
        "GROUP BY alc.overallPostId"
    )
    ArrayList<Object[]> getNumAdLinkClicksOfEachSponsoredPostInList(
        @Param("setOfOverallPostIds") HashSet<String> setOfOverallPostIds
    );


    @Query(
        "SELECT alc.overallPostId, COUNT(alc.overallPostId) " +
        "FROM AdLinkClick alc " +
        "WHERE alc.overallPostId IN :setOfOverallPostIds AND alc.clickerId = :authUserId" +
        "GROUP BY alc.overallPostId"
    )
    ArrayList<Object[]> getNumAdLinkClicksByUserToEachSponsoredPostInList(
        @Param("authUserId") int authUserId,
        @Param("setOfOverallPostIds") HashSet<String> setOfOverallPostIds
    );
}
