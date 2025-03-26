package com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class DecryptedUserMessage {
    private int id;

    private int convoId;

    private int sender;

    private String message;

    private LocalDateTime sentAt;


    public DecryptedUserMessage(int id, int convoId, int sender, String message, LocalDateTime sentAt) {
        this.id = id;
        this.convoId = convoId;
        this.sender = sender;
        this.message = message;
        this.sentAt = sentAt;
    }
}
