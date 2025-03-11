using aspNetCoreBackend1.Contexts;

using System.Text;
using System.Security.Cryptography;
using System.Text.Json;

using Azure.Security.KeyVault.Keys;
using Azure.Security.KeyVault.Keys.Cryptography;
using Azure.Identity;
using Microsoft.EntityFrameworkCore.Storage;
using StackExchange.Redis;


namespace aspNetCoreBackend1.Services;


public class EncryptionAndDecryptionService
{
    private readonly KeyClient _azureKMSClient;


    public EncryptionAndDecryptionService(KeyClient azureKMSClient)
    {
        _azureKMSClient = azureKMSClient;
    }


    public async Task<bool> CreateNewAzureCustomerMasterKey(string keyAlias)
    {
        await _azureKMSClient.CreateKeyAsync(keyAlias, KeyType.Rsa);
        return true;
    }


    public async Task<bool> DeleteCustomerMasterKey(string keyAlias)
    {
        await _azureKMSClient.StartDeleteKeyAsync(keyAlias);
        return true;
    }


    public async Task<(byte[], byte[])> CreateNewDataEncryptionKey(string keyAlias)
    {
        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.GenerateKey();
        byte[] plaintextKey = aes.Key;

        var cryptoClient = new CryptographyClient(
            new Uri($"{_azureKMSClient.VaultUri}keys/{keyAlias}"),
            new DefaultAzureCredential()
        );
        EncryptResult encryptedKeyResult = await cryptoClient.EncryptAsync(
            EncryptionAlgorithm.RsaOaep256,
            plaintextKey
        );

        byte[] encryptedKey = encryptedKeyResult.Ciphertext;

        return (plaintextKey, encryptedKey);
    }

    public async Task<byte[]> DecryptEncryptedDataEncryptionKey(byte[] encryptedKey, string keyAlias)
    {
        var cryptoClient = new CryptographyClient(
            new Uri($"{_azureKMSClient.VaultUri}keys/{keyAlias}"),
            new DefaultAzureCredential()
        );

        DecryptResult decryptResult = await cryptoClient.DecryptAsync(
            EncryptionAlgorithm.RsaOaep256,
            encryptedKey
        );

        return decryptResult.Plaintext;
    }


    public (byte[] encryptedTextBuffer, byte[] iv, byte[] authTag) EncryptTextWithAzureDataEncryptionKey(
        string plaintext, byte[] plaintextDataEncryptionKey
    )
    {
        using (AesGcm aesGcm = new AesGcm(plaintextDataEncryptionKey, 16))
        {
            byte[] iv = new byte[12];
            RandomNumberGenerator.Fill(iv);

            byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            byte[] encryptedTextBuffer = new byte[plaintextBytes.Length];
            byte[] authTag = new byte[16];

            aesGcm.Encrypt(iv, plaintextBytes, encryptedTextBuffer, authTag);

            return (encryptedTextBuffer, iv, authTag);
        }
    }


     public byte[] EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
        string plaintext, byte[] plaintextDataEncryptionKey, byte[] iv, byte[] authTag
    )
    {
        using (AesGcm aesGcm = new AesGcm(plaintextDataEncryptionKey, 16))
        {
            byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            byte[] encryptedTextBuffer = new byte[plaintextBytes.Length];

            aesGcm.Encrypt(iv, plaintextBytes, encryptedTextBuffer, authTag);

            return encryptedTextBuffer;
        }
    }


    public string DecryptTextWithAzureDataEncryptionKey(
        byte[] encryptedTextBuffer, byte[] plaintextDataEncryptionKey, byte[] iv, byte[] authTag
    )
    {
        using (var aes = new AesGcm(plaintextDataEncryptionKey, 16))
        {
            byte[] decryptedData = new byte[encryptedTextBuffer.Length];

            aes.Decrypt(iv, encryptedTextBuffer, authTag, decryptedData);

            return Encoding.UTF8.GetString(decryptedData);
        }
    }

    public async Task<byte[]> getPlaintextDataEncryptionKeyOfPost(
        string overallPostId, PostgresContext postgresContext,
        EncryptionAndDecryptionService encryptionAndDecryptionService,
        StackExchange.Redis.IDatabase redisCachingDatabase
    )
    {
        byte[]? encryptedDataEncryptionKey = null;
        byte[]? redisEncryptedDEKValue = null;

        try
        {
            redisEncryptedDEKValue = await redisCachingDatabase.HashGetAsync(
                "Posts and their Encrypted Data-Encryption-Keys",
                overallPostId
            );
        }
        catch
        {
            //pass
        }

        if (redisEncryptedDEKValue != null)
        {
            encryptedDataEncryptionKey = redisEncryptedDEKValue;
        }
        else
        {
            encryptedDataEncryptionKey = postgresContext
                .captionsCommentsAndLikesEncryptionInfo
                .Where(x => x.overallPostId == overallPostId)
                .Select(x => x.encryptedDataEncryptionKey)
                .FirstOrDefault();
            
            try
            {
                await redisCachingDatabase.HashSetAsync(
                    "Posts and their Encrypted Data-Encryption-Keys",
                    overallPostId,
                    encryptedDataEncryptionKey
                );
            }
            catch
            {
                //pass
            }
        }

        byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
            encryptedDataEncryptionKey!,
            $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
        );

        return plaintextDataEncryptionKey;
    }
}