package com.megagram.springBootBackend2.repositories.oracleSQL;

import java.util.ArrayList;
import java.util.HashSet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.megagram.springBootBackend2.models.oracleSQL.StoryView;


@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Integer> {


    @Query(
        "SELECT DISTINCT storyView.storyId FROM StoryView storyView " +
        "WHERE storyView.storyId IN (:setOfIdsToInclude) AND storyView.storyId NOT IN (" +
        "   SELECT DISTINCT sv.storyId FROM StoryView sv WHERE sv.viewerId = :authUserId AND " +
        " sv.storyId IN (:setOfIdsToInclude)" +
        ")"
    )
    HashSet<String> getIdsOfStoriesInSetThatAreNotViewedByUser(
        @Param("authUserId") int authUserId,
        @Param("setOfIdsToInclude") HashSet<String> setOfIdsToInclude
    );


    @Query(
        "SELECT sv.storyAuthorId FROM StoryView sv " +
        "WHERE sv.storyAuthorId IN (:setOfAuthorsToInclude) AND sv.viewerId = :authUserId " +
        "GROUP BY sv.storyAuthorId " +
        "ORDER BY COUNT(sv.storyId) DESC " + 
        "LIMIT :limit"
    )
    ArrayList<Integer> getAuthorIdsOfThoseInSetThatUserGivesMostStoryViewsTo(
        @Param("authUserId") int authUserId,
        @Param("setOfAuthorsToInclude") HashSet<Integer> setOfAuthorsToInclude,
        @Param("limit") int limit

    );
}
