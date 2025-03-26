package com.megagram.springBootBackend2.repositories.oracleSQL;

import java.util.ArrayList;
import java.util.HashSet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.megagram.springBootBackend2.models.oracleSQL.PostView;


@Repository
public interface PostViewRepository extends JpaRepository<PostView, Integer> {


    @Query(
        "SELECT pv FROM PostView pv " +
        "WHERE pv.id NOT IN :idsToExclude " +
        "AND pv.overallPostId = :overallPostId " +
        "ORDER BY pv.datetimeOfView DESC " +
        "LIMIT :limit"
    )
    ArrayList<PostView> getBatchOfRecentViewsOfPost(
        @Param("setOfIdsToExclude") HashSet<Integer> setOfIdsToExclude,
        @Param("overallPostId") String overallPostId,
        @Param("limit") int limit
    );
}
