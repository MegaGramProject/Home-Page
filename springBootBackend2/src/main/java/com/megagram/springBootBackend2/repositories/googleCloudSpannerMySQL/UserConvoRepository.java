package com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL;

import java.util.ArrayList;
import java.util.HashSet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo.UserConvo;


@Repository
public interface UserConvoRepository extends JpaRepository<UserConvo, Integer> {


    @Query(
        "SELECT uc FROM UserConvo uc " +
        "WHERE uc.id NOT IN :setOfIdsToExclude "
    )
    ArrayList<UserConvo> findAllExcept(
        @Param("setOfIdsToExclude") HashSet<Integer> setOfIdsToExclude
    );


    @Query(
        "SELECT uc FROM UserConvo uc " +
        "WHERE uc.id IN :setOfIdsToInclude "
    )
    ArrayList<UserConvo> findSpecificConvosBasedOnIds(
        @Param("setOfIdsToInclude") HashSet<Integer> setOfIdsToInclude
    );
}