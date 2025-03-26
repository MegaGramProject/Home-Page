package com.megagram.springBootBackend2.services;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.CreateKeyRequest;
import software.amazon.awssdk.services.kms.model.CreateKeyResponse;
import software.amazon.awssdk.services.kms.model.DataKeySpec;
import software.amazon.awssdk.services.kms.model.DecryptRequest;
import software.amazon.awssdk.services.kms.model.DecryptResponse;
import software.amazon.awssdk.services.kms.model.GenerateDataKeyRequest;
import software.amazon.awssdk.services.kms.model.GenerateDataKeyResponse;
import software.amazon.awssdk.services.kms.model.KeyUsageType;
import software.amazon.awssdk.services.kms.model.ScheduleKeyDeletionRequest;

@Service
public class EncryptionAndDecryptionService {
    private final KmsClient awsKMSClient;
    private final String ALGORITHM = "AES/GCM/NoPadding";
    private final int TAG_LENGTH_BITS = 128;


    public EncryptionAndDecryptionService() {
        this.awsKMSClient = KmsClient.builder()
            .region(Region.US_EAST_1)
            .build();
    }


    public String createNewAWSCustomerMasterKey(String description) {
        CreateKeyRequest createKeyRequest = CreateKeyRequest.builder()
            .description(description)
            .keyUsage(KeyUsageType.ENCRYPT_DECRYPT)
            .build();

        try {
            CreateKeyResponse keyResponse = this.awsKMSClient.createKey(createKeyRequest);
            String keyId = keyResponse.keyMetadata().keyId();

            return keyId;
        }
        catch (Exception e) {
            return null;
        }
    }

    public boolean deleteAWSCustomerMasterKey(String keyId) {
        ScheduleKeyDeletionRequest deleteRequest = ScheduleKeyDeletionRequest.builder()
            .keyId(keyId)
            .pendingWindowInDays(7)
            .build();
    
        try {
            this.awsKMSClient.scheduleKeyDeletion(deleteRequest);
            return true;
        }
        catch (Exception e) {
            return false;
        }
    }
    

    public byte[][] createNewAWSDataEncryptionKey(String keyId) {
        GenerateDataKeyRequest dataKeyRequest = GenerateDataKeyRequest.builder()
            .keyId(keyId)
            .keySpec(DataKeySpec.AES_256)
            .build();

        try {
            GenerateDataKeyResponse dataKeyResponse = this.awsKMSClient.generateDataKey(dataKeyRequest);
            return new byte[][] {
                dataKeyResponse.plaintext().asByteArray(),
                dataKeyResponse.ciphertextBlob().asByteArray()
            };
        }
        catch (Exception e) {
            return new byte[][] {};
        }
    }


    public byte[] decryptEncryptedAWSDataEncryptionKey(byte[] encryptedAWSDataEncryptionKey) {
        DecryptRequest decryptRequest = DecryptRequest.builder()
            .ciphertextBlob(SdkBytes.fromByteArray(encryptedAWSDataEncryptionKey))
            .build();

        try {
            DecryptResponse decryptResponse = this.awsKMSClient.decrypt(decryptRequest);
            return decryptResponse.plaintext().asByteArray();
        }
        catch (Exception e) {
            return null;
        }
    }

    
    public byte[][] encryptTextWithAWSDataEncryptionKey(String plaintext, byte[] dataEncryptionKey) {
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(dataEncryptionKey, "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
    
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
            byte[] encryptedTextBuffer = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] authTag = cipher.getIV();

            return new byte[][]{
                encryptedTextBuffer,
                iv,
                authTag
            };
        }
        catch (Exception e) {
            return new byte[][] {};
        }
    }


    public String decryptTextWithAWSDataEncryptionKey(byte[] encryptedTextBuffer, byte[] key, byte[] iv,
    byte[] authTag) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
    
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
            cipher.updateAAD(authTag);
    
            byte[] decryptedText = cipher.doFinal(encryptedTextBuffer);
            return new String(decryptedText, StandardCharsets.UTF_8);
        }
        catch (Exception e) {
            return null;
        }
    }


    public byte[][] encryptFileBufferWithAWSDataEncryptionKey(byte[] plaintextFileBuffer, byte[] key) {
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
    
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
            byte[] encryptedFileBuffer = cipher.doFinal(plaintextFileBuffer);
            byte[] authTag = cipher.getIV();
    
            return new byte[][]{
                encryptedFileBuffer,
                iv,
                authTag
            };
        }
        catch (Exception e) {
            return new byte[][] {};
        }
    }


    public byte[] decryptFileBufferWithAWSDataEncryptionKey(byte[] encryptedFileBuffer, byte[] key, byte[]
    iv, byte[] authTag) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);

            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
            cipher.updateAAD(authTag);

            byte[] decryptedFileBuffer = cipher.doFinal(encryptedFileBuffer);

            return decryptedFileBuffer;
        }
        catch (Exception e) {
            return null;
        }
    }
}
