package com.megagram.springBootBackend2.models.oracleSQL;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;


@Entity
@Table(name = "postViews")
public class PostView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public int id;
    public String overallPostId;
    public int viewerId;
    public LocalDateTime datetimeOfView;


    public PostView() {}


    public PostView(String overallPostId, int viewerId) {
        this.overallPostId = overallPostId;
        this.viewerId = viewerId;
        this.datetimeOfView = LocalDateTime.now(); 
    }

}
