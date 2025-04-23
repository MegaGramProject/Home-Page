package com.megagram.springBootBackend2.services;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
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
    private final ArrayList<String> videoFileExtensions = (ArrayList<String>) Arrays.asList(
        "mp4", "mkv", "avi", "mov", "flv", "wmv", "webm", "mpeg", "mpg", "3gp"
    );


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


    public Object getAuthorOfStory(String storyId, boolean onlyShowUnexpired) {
        OffsetDateTime twoWeeksAgo = OffsetDateTime.now().minusWeeks(2);

        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                if (onlyShowUnexpired && !(imgOrVidStorySlideFile.getProperties().getLastModified().isAfter(twoWeeksAgo))) {
                    continue;
                }

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


    public Object getOrderedStoriesOfUser(int userId, boolean onlyShowUnexpired, boolean onlyShowSponsoredStories) {
        OffsetDateTime twoWeeksAgo = OffsetDateTime.now().minusWeeks(2);
        ArrayList<HashMap<String, Object>> orderedStoriesOfUser = new ArrayList<HashMap<String, Object>>();

        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                if (onlyShowUnexpired && !(imgOrVidStorySlideFile.getProperties().getLastModified().isAfter(twoWeeksAgo))) {
                    continue;
                }

                String storyFileName = imgOrVidStorySlideFile.getName();
                String[] partsOfStoryFileName = storyFileName.split("/");
                String authorIdAsString = partsOfStoryFileName[0];
                int authorId = Integer.parseInt(authorIdAsString);

                if (authorId == userId) {
                    String storyId = partsOfStoryFileName[1].substring(0, partsOfStoryFileName[1].indexOf("."));
                    
                    try {
                        BlobClient blobClient = azureBlobStorageClient.getBlobClient(storyFileName);

                        HashMap<String, String> storyMetadata = (HashMap<String, String>) blobClient.getProperties().getMetadata();

                        String adLink = storyMetadata.getOrDefault("adLink", null);
                        if (onlyShowSponsoredStories && adLink == null) {
                            continue;
                        }

                        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                        blobClient.downloadStream(outputStream);

                        HashMap<String, Object> newStoryForUser = new HashMap<String, Object>();
                        newStoryForUser.put("id", storyId);

                        newStoryForUser.put("datetime", imgOrVidStorySlideFile.getProperties().getLastModified());
                        newStoryForUser.put("src", outputStream.toByteArray());

                        String vidDurationInSecondsAsString = storyMetadata.getOrDefault(
                            "vidDurationInSeconds", 
                            null
                        );
                        
                        if (vidDurationInSecondsAsString != null) {
                            int vidDurationInSeconds = Integer.parseInt(vidDurationInSecondsAsString);
                            newStoryForUser.put("vidDurationInSeconds", vidDurationInSeconds);
                        }

                        if (adLink != null) {
                            String adCallToAction = storyMetadata.get("adCallToAction");

                            HashMap<String, String> adInfo = new HashMap<String, String>();
                            adInfo.put("link", adLink);
                            adInfo.put("callToAction", adCallToAction);

                            newStoryForUser.put("adInfo", adInfo);
                        }

                        orderedStoriesOfUser.add(newStoryForUser);
                    }
                    catch (Exception e) {}
                }
            }

            orderedStoriesOfUser.sort(
                Comparator.comparing(story -> ((OffsetDateTime) story.get("datetime")).toInstant())
            );
    
            return orderedStoriesOfUser;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting ids and their authors of the stories posted by users in the provided set",
                "BAD_GATEWAY"
            };
        }
    }


    public Object getUnexpiredOrderedStoriesOfMultipleUsers(HashSet<Integer> setOfUserIds, HashMap<Integer, Boolean>
    usersAndTheirStorySponsorshipStatuses) {
        HashMap<Integer, ArrayList<HashMap<String, Object>>> usersAndTheirOrderedStories = new HashMap<Integer,
        ArrayList<HashMap<String, Object>>> ();

        for(int userId : setOfUserIds) {
            usersAndTheirOrderedStories.put(userId, new ArrayList<HashMap<String, Object>>()); 
        }

        OffsetDateTime twoWeeksAgo = OffsetDateTime.now().minusWeeks(2);

        try {
            for (BlobItem imgOrVidStorySlideFile : this.azureBlobStorageClient.listBlobs()) {
                if (!(imgOrVidStorySlideFile.getProperties().getLastModified().isAfter(twoWeeksAgo))) {
                    continue;
                }

                String storyFileName = imgOrVidStorySlideFile.getName();
                String[] partsOfStoryFileName = storyFileName.split("/");
                String storyAuthorIdAsString = partsOfStoryFileName[0];
                int storyAuthorId = Integer.parseInt(storyAuthorIdAsString);
                boolean storyIsToBeSponsored = usersAndTheirStorySponsorshipStatuses.get(storyAuthorId);

                if (storyIsToBeSponsored) {
                    try {
                        BlobClient blobClient = azureBlobStorageClient.getBlobClient(storyFileName);
    
                        HashMap<String, String> storyMetadata = (HashMap<String, String>) blobClient.getProperties().getMetadata();
        
                        String adLink = storyMetadata.getOrDefault("adLink", null);
                        if (adLink == null) {
                            continue;
                        }
                    }
                    catch (Exception e) {
                        continue;
                    }
                }

                if (setOfUserIds.contains(storyAuthorId)) {
                    String storyId = partsOfStoryFileName[1].substring(0, partsOfStoryFileName[1].indexOf("."));

                    HashMap<String, Object> storyInfo = new HashMap<String, Object>();

                    storyInfo.put("id", storyId);
                    storyInfo.put("filename", storyFileName);

                    String storyFileExtension = partsOfStoryFileName[1].substring(partsOfStoryFileName[1].indexOf(".") + 1);
                    
                    if (this.videoFileExtensions.contains(storyFileExtension)) {
                        storyInfo.put("type", "video");
                    }
                    else {
                        storyInfo.put("type", "image");
                    }

                    usersAndTheirOrderedStories.get(storyAuthorId).add(storyInfo);
                }
            }

            for(int userId: setOfUserIds) {
                usersAndTheirOrderedStories.get(userId).sort(
                    Comparator.comparing(story -> ((OffsetDateTime) story.get("datetime")).toInstant())
                );
            }

            return usersAndTheirOrderedStories;
        }
        catch (Exception e) {
            return new String[] {
                "There was trouble getting the ordered stories of the users in the provided set",
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


    public boolean uploadFile(String filename, MultipartFile file, HashMap<String, String> fileMetadata) throws IOException {
        BlobClient blobClient = azureBlobStorageClient.getBlobClient(filename);
        blobClient.upload(file.getInputStream(), file.getSize(), true);

        if (!fileMetadata.isEmpty()) {
            blobClient.setMetadata(fileMetadata);
        }
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
