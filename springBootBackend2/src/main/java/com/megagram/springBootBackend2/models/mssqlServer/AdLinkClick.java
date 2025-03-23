package com.megagram.springBootBackend2.models.mssqlServer;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "adLinkClicks")
public class AdLinkClick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public int id;
    public String overallPostId;
    public int clickerId;
    public LocalDateTime datetimeOfClick;


    public AdLinkClick() {}

    
    public AdLinkClick(String overallPostId, int clickerId) {
        this.overallPostId = overallPostId;
        this.clickerId = clickerId;
        this.datetimeOfClick = LocalDateTime.now(); 
    }

}
