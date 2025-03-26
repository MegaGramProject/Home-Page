package com.megagram.springBootBackend2.models.googleCloudSpannerMySQL.UserMessage;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "userMessages")
@Getter
@Setter
public class UserMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer convoId;

    @Lob
    private byte[] encryptedSender;

    @Lob
    private byte[] senderEncryptionIv;

    @Lob
    private byte[] senderEncryptionAuthTag;

    @Lob
    private byte[] encryptedMessage;

    @Lob
    private byte[] messageEncryptionIv;

    @Lob
    private byte[] messageEncryptionAuthTag;

    private LocalDateTime sentAt;
}
