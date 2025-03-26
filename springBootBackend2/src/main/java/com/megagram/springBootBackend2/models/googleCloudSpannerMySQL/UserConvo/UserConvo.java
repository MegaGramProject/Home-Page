package com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserConvo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "userConvos")
@Getter
@Setter
public class UserConvo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Lob
    @Column(nullable = true)
    private byte[] encryptedTitle;

    @Lob
    @Column(nullable = true)
    private byte[] titleEncryptionIv;

    @Lob
    @Column(nullable = true)
    private byte[] titleEncryptionAuthTag;

    @Lob
    private byte[] encryptedMembers;

    @Lob
    private byte[] membersEncryptionIv;

    @Lob
    private byte[] membersEncryptionAuthTag;

    /*
        0 => not accepted convo-request yet. -1 => deleted convo from inbox. 1 => convo is accepted and
        in inbox
    */
    @Lob
    private byte[] encryptedMemberStatuses;
 
    @Lob
    private byte[] memberStatusesEncryptionIv; 

    @Lob
    private byte[] memberStatusesEncryptionAuthTag;

    @Lob
    private byte[] encryptedDataEncryptionKey;

    /*
       whenever a member deletes the convo from their inbox, if a new message appears,
       that new message will be the earliest message shown for that member, and the 
       convo will no longer be deleted from their inbox (since they never left the convo)
       values in the decrypted array will be 'waiting for new message', a date-time-string,
       or 'beginning'(meaning all messages of the convo from the beginning of the convo will be shown,
       indicating that the member never deleted the convo from their inbox at any point in time
       yet)
    */
    @Lob
    private byte[] encDatetimeOfEarliestMsgShownPerMember;
 
    @Lob
    private byte[] datetimeOfEarliestMsgShownPerMemberEncryptionIv; 

    @Lob
    private byte[] datetimeOfEarliestMsgShownPerMemberEncryptionAuthTag;
    
    private boolean[] hasUnseenMessageOfEachMember;

    private String awsCMKId;
}
