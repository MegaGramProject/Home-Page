package com.megagram.springBootBackend2.services;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobContainerClientBuilder;
import com.azure.storage.blob.models.BlobItem;


@Service
public class StoryService {
    private final BlobContainerClient azureBlobStorageClient;


    public StoryService(@Value("${azure.storage.account-name}") String accountName,
    @Value("${azure.storage.account-key}") String accountKey, @Value("${azure.storage.container-name}")
    String containerName) {

        String connectionString = String.format(
            "DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net",
            accountName, accountKey
        );

        this.azureBlobStorageClient = new BlobContainerClientBuilder()
            .connectionString(connectionString)
            .containerName(containerName)
            .buildClient();
    }


    public Object getIdsAndAuthorsOfUnexpiredStoriesPostedByUsersInSet(HashSet<Integer> setOfUserIds) {
        OffsetDateTime twoWeeksAgo = OffsetDateTime.now().minusWeeks(2);
        HashMap<String, Integer> storyIdsAndTheirAuthors = new HashMap<String, Integer>();

        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                if (imgOrVidStorySlideFile.getProperties().getLastModified().isAfter(twoWeeksAgo)) {
                    String[] partsOfFileName = imgOrVidStorySlideFile.getName().split("/");
                    String authorIdAsString = partsOfFileName[0];
                    int authorId = Integer.parseInt(authorIdAsString);

                    if (setOfUserIds.contains(authorId)) {
                        String storyId = partsOfFileName[1].substring(0, partsOfFileName[1].indexOf("."));
                        storyIdsAndTheirAuthors.put(storyId, authorId);
                    }
                }
            }
    
            return storyIdsAndTheirAuthors;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting ids and their authors of the unexpired stories posted by users " +
                "in the provided set",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getAuthorOfStory(String storyId) {
        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                String[] partsOfFileName = imgOrVidStorySlideFile.getName().split("/");
                String idOfThisStory = partsOfFileName[1].substring(0, partsOfFileName[1].indexOf("."));
                
                if (idOfThisStory.equals(storyId)) {
                    String authorIdAsString = partsOfFileName[0];
                    return Integer.parseInt(authorIdAsString);
                }
            }

            return null;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting the files of all the image and video slides of stories posted " +
                "to Megagram",
                "BAD_GATEWAY"
            };
        }
    }


    public byte[] retrieveFileBufferOfImgOrVidSlideOfStory(String fileName) {
        try {
            BlobClient blobClient = azureBlobStorageClient.getBlobClient(fileName);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            blobClient.downloadStream(outputStream);
            
            return outputStream.toByteArray();
        }
        catch (Exception e) {
            return null;
        }
    }


    public Object getOrderedStoriesOfUser(int userId) {
        OffsetDateTime twoWeeksAgo = OffsetDateTime.now().minusWeeks(2);
        ArrayList<HashMap<String, Object>> orderedStoriesOfUser = new ArrayList<HashMap<String, Object>>();

        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                if (imgOrVidStorySlideFile.getProperties().getLastModified().isAfter(twoWeeksAgo)) {
                    String[] partsOfFileName = imgOrVidStorySlideFile.getName().split("/");
                    String authorIdAsString = partsOfFileName[0];
                    int authorId = Integer.parseInt(authorIdAsString);

                    if (authorId == userId) {
                        String storyId = partsOfFileName[1].substring(0, partsOfFileName[1].indexOf("."));
                        
                        try {
                            BlobClient blobClient = azureBlobStorageClient.getBlobClient(userId+"/"+storyId);
                            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                            blobClient.downloadStream(outputStream);

                            HashMap<String, Object> newStoryForUser = new HashMap<String, Object>();
                            newStoryForUser.put("id", storyId);
                            
                            String contentType = imgOrVidStorySlideFile.getProperties().getContentType();
                            if (contentType.startsWith("image/")) {
                                newStoryForUser.put("type", "image");
                            }
                            else {
                                newStoryForUser.put("type", "video");
                            }

                            newStoryForUser.put("datetime", imgOrVidStorySlideFile.getProperties().getLastModified());
                            newStoryForUser.put("story", outputStream.toByteArray());
                            orderedStoriesOfUser.add(newStoryForUser);
                        }
                        catch (Exception e) {
                            //pass
                        }
                    }
                }
            }

            orderedStoriesOfUser.sort(
                Comparator.comparing(story -> ((OffsetDateTime) story.get("datetime")).toInstant())
            );
    
            return orderedStoriesOfUser;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting ids and their authors of the unexpired stories posted by users " +
                "in the provided set",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getNumberOfUnexpiredStoriesOfUser(int userId) {
        OffsetDateTime twoWeeksAgo = OffsetDateTime.now().minusWeeks(2);
        int numUnexpiredStoriesOfUser = 0;

        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                if (imgOrVidStorySlideFile.getProperties().getLastModified().isAfter(twoWeeksAgo)) {
                    String[] partsOfFileName = imgOrVidStorySlideFile.getName().split("/");
                    String authorIdAsString = partsOfFileName[0];
                    int authorId = Integer.parseInt(authorIdAsString);

                    if (authorId == userId) {
                        numUnexpiredStoriesOfUser++;
                    }
                }
            }

            return numUnexpiredStoriesOfUser;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting the number of stories of the user from the database",
                "BAD_GATEWAY"
            };
        }
    }


    public boolean uploadFile(String filename, MultipartFile file) throws IOException {
        BlobClient blobClient = azureBlobStorageClient.getBlobClient(filename);
        blobClient.upload(file.getInputStream(), file.getSize(), true);
        return true;
    }


    public boolean deleteFile(String fileNamePrefix) {
        for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
            if (imgOrVidStorySlideFile.getName().startsWith(fileNamePrefix)) {
                BlobClient blobClient = azureBlobStorageClient.getBlobClient(imgOrVidStorySlideFile.getName());
                blobClient.delete();
                return true;
            }
        }

        return false;
    }
    
}
