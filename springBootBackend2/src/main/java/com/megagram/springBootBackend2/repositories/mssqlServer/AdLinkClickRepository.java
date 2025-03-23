package com.megagram.springBootBackend2.repositories.mssqlServer;

import java.util.ArrayList;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.megagram.springBootBackend2.models.mssqlServer.AdLinkClick;


@Repository
public interface AdLinkClickRepository extends JpaRepository<AdLinkClick, Integer> {
    
    
    @Query(
        "SELECT alc FROM AdLinkClick alc " +
        "WHERE alc.id NOT IN :idsToExclude " +
        "AND alc.overallPostId = :overallPostId " +
        "ORDER BY alc.datetimeOfClick DESC " +
        "LIMIT :limit"
    )
    ArrayList<AdLinkClick> getBatchOfAdLinkClicksOfSponsoredPost(
        Set<Integer> idsToExclude, String overallPostId, int limit
    );
}
