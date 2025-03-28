package com.megagram.springBootBackend2.models.oracleSQL;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;


@Entity
@Table(name = "storyViews")
public class StoryView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public int id;
    public String storyId;
    public int viewerId;
    public int storyAuthorId;
    public LocalDateTime datetimeOfView;


    public StoryView() {}


    public StoryView(String storyId, int storyAuthorId, int viewerId) {
        this.storyId = storyId;
        this.storyAuthorId = storyAuthorId;
        this.viewerId = viewerId;
        this.datetimeOfView = LocalDateTime.now(); 
    }
}
