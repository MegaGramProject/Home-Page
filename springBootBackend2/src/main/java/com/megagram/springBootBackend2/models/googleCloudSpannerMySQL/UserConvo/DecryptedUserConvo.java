package com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo;

import com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage.DecryptedUserMessage;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class DecryptedUserConvo {
    private int id;

    private String title;

    private int[] members;

    private DecryptedUserMessage mostRecentUserMessage;

    private String datetimeOfEarliestMsgShown;

    private boolean hasUnseenMessage;

    public DecryptedUserConvo(int id, String title, int[] members, DecryptedUserMessage
    mostRecentUserMessage, String datetimeOfEarliestMsgShown, boolean hasUnseenMessage) {
        this.id = id;
        this.title = title;
        this.members = members;
        this.mostRecentUserMessage = mostRecentUserMessage;
        this.datetimeOfEarliestMsgShown = datetimeOfEarliestMsgShown;
        this.hasUnseenMessage = hasUnseenMessage;
    }
}
