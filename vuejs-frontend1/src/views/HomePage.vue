<template>
    <LeftSidebar
        :profilePhoto="defaultPfp"
        :displayPopup="displayLeftSidebarPopup"
        :authUserIsAnonymousGuest="authUserId == -1"
        :toggleDisplayPopup="toggleDisplayLeftSidebarPopup"
    />

    <img v-if="displayLeftSidebarPopup || displayErrorPopup || displayThreeDotsPopup || displayAboutAccountPopup ||
    displayLikersPopup || displaySendPostPopup || displayCommentsPopup || 2==2" @click="closeAllPopups" :src="blackScreen"
    style="position: fixed; top: 0%; left: 0%; width: 100%; height: 100%; opacity: 0.7; zIndex: 2;"/>

    <CommentsPopup v-if="displayCommentsPopup"
        :authUserId="authUserId"
        :authUsername="authUsername"
        :postDetails="commentsPopupPostDetails"
        :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
        :updateUsersAndTheirRelevantInfo="updateUsersAndTheirRelevantInfo"
        :mainPostAuthorInfo="usersAndTheirRelevantInfo[commentsPopupPostDetails.authorIds[0]] ?? {}"
        :currSlide="commentsPopupCurrSlide"
        :zIndex="displayThreeDotsPopup ||  displaySendPostPopup || displayLikersPopup || displayAboutAccountPopup ||
        displayErrorPopup || displayStoryViewer ? '1' : '2'"
        :closePopup="closeCommentsPopup"
        :showErrorPopup="showErrorPopup"
        :showThreeDotsPopup="showThreeDotsPopup"
        :showSendPostPopup="showSendPostPopup"
        :showLikersPopup="showLikersPopup"
        :showStoryViewer="showStoryViewer"
        :updatePostDetails="updatePostDetails"
    />

    <div v-if="displayAboutAccountPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayStoryViewer ? '1' : '2' }
    ]">
        <AboutAccountPopup
            :authUserId="authUserId"
            :userId="aboutAccountUserId"
            :username="aboutAccountUsername"
            :authUsername="authUsername"
            :userPfp="aboutAccountUserProfilePhoto"
            :userIsVerified="aboutAccountUserIsVerified"
            :userHasStories="aboutAccountUserHasStories"
            :userHasUnseenStory="aboutAccountUserHasUnseenStory"
            :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
            :addRelevantInfoToUser="addRelevantInfoToUser"
            :closePopup="closeAboutAccountPopup"
            :showStoryViewer="showStoryViewer"
        />
    </div>

    <StoryViewer v-if="displayStoryViewer"
        :authUserId="authUserId"
        :authUsername="authUsername"
        :storyAuthorUsername="storyViewerMainUsername"
        :storyAuthorId="storyViewerMainUserId"
        :zIndex="displayErrorPopup ? '1' : '2'"
        :orderedListOfUserIdsInStoriesSection="orderedListOfUserIdsInStoriesSection"
        :orderedListOfUsernamesInStoriesSection="orderedListOfUsernamesInStoriesSection"
        :orderedListOfSponsorshipStatusesInStoriesSection="orderedListOfSponsorshipStatusesInStoriesSection"
        :isFromStoriesSection="storyViewerIsFromStoriesSection"
        :usersAndTheirStories="usersAndTheirStories"
        :usersAndTheirStoryPreviews="usersAndTheirStoryPreviews"
        :usersAndYourCurrSlideInTheirStories="usersAndYourCurrSlideInTheirStories"
        :vidStoriesAndTheirPreviewImages="vidStoriesAndTheirPreviewImages"
        :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
        :usernamesWhoseStoriesYouHaveFinished="usernamesWhoseStoriesYouHaveFinished"
        :updateUsersAndTheirStories="updateUsersAndTheirStories"
        :updateUsersAndTheirStoryPreviews="updateUsersAndTheirStoryPreviews"
        :updateUsersAndYourCurrSlideInTheirStories="updateUsersAndYourCurrSlideInTheirStories"
        :updateVidStoriesAndTheirPreviewImages="updateVidStoriesAndTheirPreviewImages"
        :addUsernameToSetOfUsersWhoseStoriesYouHaveFinished="addUsernameToSetOfUsersWhoseStoriesYouHaveFinished"
        :closeStoryViewer="closeStoryViewer"
        :showErrorPopup="showErrorPopup"
    />

    <div v-if="displayLeftSidebarPopup" :style="[
        { position: 'fixed', bottom: '10%', left: '1%' },
        { zIndex: displayErrorPopup ? '1' : '2' }
    ]">
        <LeftSidebarPopup
            :authUserId="authUserId"
            :originalURL="originalURL"
            :showErrorPopup="showErrorPopup"
        />
    </div>

    <div v-if="displayThreeDotsPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayErrorPopup ? '1' : '2' }
    ]">
        <ThreeDotsPopup
            :authUserId="authUserId"
            :postDetails="threeDotsPopupPostDetails"
            :hidePost="hidePost"
            :showErrorPopup="showErrorPopup"
            :closePopup="closeThreeDotsPopup"
            :showAboutAccountPopup="showAboutAccountPopup"
        />
    </div>

    <div v-if="displayLikersPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayErrorPopup ? '1' : '2' }
    ]">
        <LikersPopup
            :idOfPostOrComment="likersPopupIdOfPostOrComment"
            :authUserId="authUserId"
            :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo" 
            :closePopup="closeLikersPopup"
            :showErrorPopup="showErrorPopup"
            :updateUsersAndTheirRelevantInfo="updateUsersAndTheirRelevantInfo"
        />
    </div>

    <div v-if="displaySendPostPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayErrorPopup ? '1' : '2' }
    ]">
        <SendPostPopup
            :authUserId="authUserId"
            :overallPostId="sendPostPopupOverallPostId"
            :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
            :cachedMessageSendingSuggestions="cachedMessageSendingSuggestions"
            :updateUsersAndTheirRelevantInfo="updateUsersAndTheirRelevantInfo"
            :updateCachedMessageSendingSuggestions="updateCachedMessageSendingSuggestions"
            :showErrorPopup="showErrorPopup"
            :closePopup="closeSendPostPopup"
        />
    </div>

    <div v-if="displayErrorPopup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); zIndex:
    2;">
        <ErrorPopup
            :errorMessage="errorPopupMessage"
            :closePopup="closeErrorPopup"
        />
    </div>

    <UserNotification v-if="orderedListOfNotifications.length > 0"
        :key="orderedListOfNotifications[0].description"
        :leftImage="orderedListOfNotifications[0].leftImage"
        :rightImage="orderedListOfNotifications[0].rightImage"
        :description="orderedListOfNotifications[0].description"
        :leftImageLink="orderedListOfNotifications[0].leftImageLink"
        :entireNotificationLink="orderedListOfNotifications[0].entireNotificationLink"
        :deleteThis="deleteNotification"
    />
</template>


<script setup>
/* eslint-disable no-unused-vars */
    import AboutAccountPopup from '@/components/Popups/AboutAccountPopup.vue';
import CommentsPopup from '@/components/Popups/CommentsPopup.vue';
import ErrorPopup from '@/components/Popups/ErrorPopup.vue';
import LeftSidebarPopup from '@/components/Popups/LeftSidebarPopup.vue';
import LikersPopup from '@/components/Popups/LikersPopup.vue';
import SendPostPopup from '@/components/Popups/SendPostPopup.vue';
import ThreeDotsPopup from '@/components/Popups/ThreeDotsPopup.vue';

    import FooterSection from '@/components/FooterSection.vue';
import LeftSidebar from '@/components/LeftSidebar.vue';
import MediaPost from '@/components/MediaPost.vue';
import StoryViewer from '@/components/StoryViewer.vue';
import UserBar from '@/components/UserBar.vue';
import UserIcon from '@/components/UserIcon.vue';
import UserNotification from '@/components/UserNotification.vue';
    FooterSection; MediaPost; UserBar; UserIcon;

    import blackScreen from '@/assets/images/blackScreen.png';
import defaultGroupChatPfp from '@/assets/images/defaultGroupChatPfp.png';
import defaultPfp from '@/assets/images/defaultPfp.png';
import defaultVideoFrame from '@/assets/images/defaultVideoFrame.jpg';

    import '../assets/styles.css';

    import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

    import * as signalR from '@microsoft/signalr';
import { io } from "socket.io-client";


    const route = useRoute();
    const numTimesRouteParamsWasWatched = ref(0);
    const originalURL = ref('');
    
    const authUsername = ref('');
    const authUserId = ref(-1);

    const displayLeftSidebarPopup = ref(false);

    const displayErrorPopup = ref(false);
    const errorPopupMessage = ref('');

    const displayThreeDotsPopup = ref(false);
    const threeDotsPopupPostDetails = ref({});

    const displayAboutAccountPopup = ref(false);
    const aboutAccountUsername = ref('');
    const aboutAccountUserId = ref(-1);
    const aboutAccountUserIsVerified = ref(false);
    const aboutAccountUserHasStories = ref(false);
    const aboutAccountUserHasUnseenStory = ref(false);
    const aboutAccountUserProfilePhoto = ref(null);

    const displayLikersPopup = ref(false);
    const likersPopupIdOfPostOrComment = ref('');

    const displaySendPostPopup = ref(false);
    const sendPostPopupOverallPostId = ref('');

    const displayCommentsPopup = ref(false);
    const commentsPopupPostDetails = ref({});
    const commentsPopupCurrSlide = ref(-1);

    const displayStoryViewer = ref(false);
    const currStoryLevel = ref(0);
    const storyViewerIsFromStoriesSection = ref(false);
    const storyViewerMainUserId = ref(-1);
    const storyViewerMainUsername = ref('');
    const orderedListOfUserIdsInStoriesSection = ref([]);
    const orderedListOfUsernamesInStoriesSection = ref([]);
    const orderedListOfSponsorshipStatusesInStoriesSection = ref([]);
    const fetchingStoriesIsComplete = ref(false);
    const storiesSectionErrorMessage = ref('');
    const usernamesWhoseStoriesYouHaveFinished = ref(new Set());
    const usersAndTheirStories = ref({});
    const usersAndTheirStoryPreviews = ref({});
    const usersAndYourCurrSlideInTheirStories = ref({});
    const vidStoriesAndTheirPreviewImages = ref({});

    const usersAndTheirRelevantInfo = ref({});
    const postsAndTheirPreviewImgs = ref({});

    const cachedMessageSendingSuggestions = ref({});

    const orderedListOfPosts = ref([]);
    const focusedMediaPostId = ref('');

    const orderedListOfNotifications = ref([]);


    onMounted(() => {
        document.title = "Megagram";
        originalURL.value = window.location.href;
    });


    watch(() =>
        route.params,
        (newRouteParams) => {
            numTimesRouteParamsWasWatched.value++
            if (numTimesRouteParamsWasWatched.value < 2) {
                return;
            }

            if (typeof newRouteParams.username !== 'undefined' && localStorage.getItem('defaultUsername') !==
            newRouteParams.username) {
                authenticateUser(newRouteParams.username, null);
            }
            else if (localStorage.getItem('defaultUsername')) {
                if (localStorage.getItem('defaultUsername') === 'Anonymous Guest') {
                    authUsername.value = 'Anonymous Guest'
                }
                else {
                    authenticateUser(
                        localStorage.getItem('defaultUsername'),
                        parseInt(localStorage.getItem('defaultUserId'))
                    );
                }
            }
            else {
                authUsername.value = 'Anonymous Guest'
            }
        },
        { immediate: true }
    );


    watch(authUserId, (newAuthUserId) => {
        localStorage.setItem('defaultUserId', newAuthUserId.toString());

        if (newAuthUserId !== -1) {
            establishCollaborationWithNodeJSWebSocketDotIO();
            establishCollaborationWithCSharpSignalRWebSocket();
            establishCollaborationWithPhpRatchetWebSocket();
            establishCollaborationWithPythonWebSocket();
        }
    });
    
    
    watch(authUsername, (newAuthUsername) => {
        if (newAuthUsername.length > 0) {
            localStorage.setItem('defaultUsername', newAuthUsername);
            fetchStories();
            fetchSuggestedAccounts();
            fetchPosts('initial');
        }
    });


    async function authenticateUser(username, userId) {
        if (userId == null) {
            try {
                const response = await fetch('http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `query getUserIdOfUsername($username: String!) {
                            getUserIdOfUsername(username: $username)
                        }`,
                        variables: {
                            username: username
                        }
                    }),
                    credentials: 'include'
                });
                if (!response.ok) {
                    authUsername.value = 'Anonymous Guest';

                    throw new Error(
                        `The laravelBackend1 server had trouble getting the user-id of username ${username}`
                    );
                }

                let userId = await response.json();
                userId = userId.data.getUserIdOfUsername;
                
                authUserId.value = userId;
            }
            catch {
                authUsername.value = 'Anonymous Guest';

                throw new Error(
                    `There was trouble connecting to the laravelBackend1 server to get the user-id of username
                    ${username}`
                );
            }
        }
        else {
            authUserId.value = userId;
        }

        try {
            const response1 = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/${userId}`, {
                credentials: 'include'
            });
            if (!response1.ok) {
                authUsername.value = 'Anonymous Guest';
                authUserId.value = -1;

                throw new Error(
                    `The expressJSBackend1 server had trouble verifying you as having the proper credentials to
                    be logged in as user ${userId}`
                );
            }

            authUsername.value = username;
        }
        catch {
            authUsername.value = 'Anonymous Guest';
            authUserId.value = -1;

            throw new Error(
                `There was trouble connecting to the expressJSBackend1 server to verify you as having the proper
                credentials to be logged in as user ${userId}`
            );
        }
    }


    async function fetchStories() {

    }


    async function fetchSuggestedAccounts() {

    }


    async function fetchPosts(initialOrAdditionalText) {
        initialOrAdditionalText;
    }


    function hidePost() {
        orderedListOfPosts.value = orderedListOfPosts.value.filter(
            postDetails => (postDetails.overallPostId !== threeDotsPopupPostDetails.value.overallPostId)
        );

        displayThreeDotsPopup.value = false;
        displayCommentsPopup.value = false;
    }


    function updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo) {
        usersAndTheirRelevantInfo.value = newUsersAndTheirRelevantInfo;
    }


    function updateCachedMessageSendingSuggestions(newCachedMessageSendingSuggestions) {
        cachedMessageSendingSuggestions.value = newCachedMessageSendingSuggestions;
    }


    function showErrorPopup(newErrorPopupMessage) {
        errorPopupMessage.value = newErrorPopupMessage;
        displayErrorPopup.value = true;
    }


    function showAboutAccountPopup(newAboutAccountUsername, newAboutAccountUserId) {
        aboutAccountUsername.value = newAboutAccountUsername;
        aboutAccountUserId.value = newAboutAccountUserId;

        aboutAccountUserIsVerified.value = 
            newAboutAccountUserId in usersAndTheirRelevantInfo.value &&
            'isVerified' in usersAndTheirRelevantInfo.value[newAboutAccountUserId]
            ? usersAndTheirRelevantInfo.value[newAboutAccountUserId].isVerified
            : false;

        aboutAccountUserHasStories.value = 
            newAboutAccountUserId in usersAndTheirRelevantInfo.value &&
            'hasStories' in usersAndTheirRelevantInfo.value[newAboutAccountUserId]
            ? usersAndTheirRelevantInfo.value[newAboutAccountUserId].hasStories
            : false;

        aboutAccountUserHasUnseenStory.value = 
            newAboutAccountUserId in usersAndTheirRelevantInfo.value &&
            'hasUnseenStory' in usersAndTheirRelevantInfo.value[newAboutAccountUserId]
            ? usersAndTheirRelevantInfo.value[newAboutAccountUserId].hasUnseenStory
            : false;

        aboutAccountUserProfilePhoto.value = 
            newAboutAccountUserId in usersAndTheirRelevantInfo.value &&
            'profilePhoto' in usersAndTheirRelevantInfo.value[newAboutAccountUserId]
            ? usersAndTheirRelevantInfo.value[newAboutAccountUserId].profilePhoto
            : defaultPfp;

        displayAboutAccountPopup.value = true;
    }


    function showLikersPopup(newLikersPopupIdOfPostOrComment) {
        likersPopupIdOfPostOrComment.value = newLikersPopupIdOfPostOrComment;
        displayLikersPopup.value = true;
    }


    function showStoryViewer(newStoryViewerMainUserId, newStoryViewerMainUsername, newStoryViewerIsFromStoriesSection) {
        document.title = 'Stories';

        storyViewerMainUserId.value = newStoryViewerMainUserId;
        storyViewerMainUsername.value = newStoryViewerMainUsername;
        storyViewerIsFromStoriesSection.value = newStoryViewerIsFromStoriesSection;
        displayStoryViewer.value = true;
    }


    function showThreeDotsPopup(newThreeDotsPopupPostDetails) {
        threeDotsPopupPostDetails.value = newThreeDotsPopupPostDetails;
        displayThreeDotsPopup.value = true;
    }


    function showCommentsPopup(postDetails, currSlide) {
        commentsPopupPostDetails.value = postDetails;
        commentsPopupCurrSlide.value = currSlide;

        displayCommentsPopup.value = true;
    }


    function showSendPostPopup(newSendPostPopupOverallPostId) {
        sendPostPopupOverallPostId.value = newSendPostPopupOverallPostId;
        displaySendPostPopup.value = true;
    }


    function updatePostDetails(overallPostId, updatedKeyValuePairs) {
        const newOrderedListOfPosts = [...orderedListOfPosts.value];

        for(let i=0; i<newOrderedListOfPosts.length; i++) {
            const postDetails = {...newOrderedListOfPosts[i]};
            if(postDetails.overallPostId === overallPostId) {
                for(let key of Object.keys(updatedKeyValuePairs)) {
                    postDetails[key] = updatedKeyValuePairs[key];
                }

                newOrderedListOfPosts[i] = postDetails
                orderedListOfPosts.value = newOrderedListOfPosts;
                return;
            }
        }
    }


    function updateFocusedMediaPost(newFocusedMediaPostId) {
        focusedMediaPostId.value = newFocusedMediaPostId;
    }


    function toggleDisplayLeftSidebarPopup() {
        displayLeftSidebarPopup.value = !displayLeftSidebarPopup.value;
    }


    function closeAllPopups() {
        if(!( displayCommentsPopup.value && (displayThreeDotsPopup.value || displayAboutAccountPopup.value  ||
        displayErrorPopup.value  || displayLikersPopup.value || displaySendPostPopup.value))) {
            displayCommentsPopup.value = false;
        }

        displayLeftSidebarPopup.value = false;
        displayErrorPopup.value = false;
        displayThreeDotsPopup.value = false;
        displayAboutAccountPopup.value = false;
        displayLikersPopup.value = false;
        displaySendPostPopup.value = false;
    }


    function closeErrorPopup() {
        displayErrorPopup.value = false;
    }


    function closeThreeDotsPopup() {
        displayThreeDotsPopup.value = false;
    }


    function closeAboutAccountPopup() {
        displayAboutAccountPopup.value = false;
        displayThreeDotsPopup.value = false;
    }


    function closeLikersPopup () {
        displayLikersPopup.value = false;
    }


    function closeSendPostPopup() {
        displaySendPostPopup.value = false;
    }


    function closeStoryViewer() {
        document.title = 'Megagram';
        
        displayStoryViewer.value = false;

        window.history.pushState(
            {
                page: 'Megagram',
            },
            'Megagram',
            originalURL.value
        );
    }


    function closeCommentsPopup() {
        displayCommentsPopup.value = false;
    }


    function deleteNotification(event) {
        if (event !== null) {
            event.preventDefault();
        }

        orderedListOfNotifications.value = [...orderedListOfNotifications.value.slice(1)];
    }


    function addRelevantInfoToUser(userId, userFieldsAndTheirValues) {
        if (!(userId in usersAndTheirRelevantInfo.value)) {
            usersAndTheirRelevantInfo.value[userId] = {};
        }

        for(let field of Object.keys(userFieldsAndTheirValues)) {
            usersAndTheirRelevantInfo.value[userId][field] = userFieldsAndTheirValues[field];
        }
    }


    function updateUsersAndTheirStories(newUsersAndTheirStories) {
        usersAndTheirStories.value = newUsersAndTheirStories;
    }


    function updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews) {
        usersAndTheirStoryPreviews.value = newUsersAndTheirStoryPreviews;
    }


    function updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories) {
        usersAndYourCurrSlideInTheirStories.value = newUsersAndYourCurrSlideInTheirStories;
    }


    function updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirPreviewImages) {
        vidStoriesAndTheirPreviewImages.value = newVidStoriesAndTheirPreviewImages;
    }


    function addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newFinishedUsername) {
        usernamesWhoseStoriesYouHaveFinished.value = new Set(
            [
                ...usernamesWhoseStoriesYouHaveFinished.value,
                newFinishedUsername
            ]
        );
    }


    function establishCollaborationWithNodeJSWebSocketDotIO() {
        const nodeJSWebSocketDotIO = io('http://34.111.89.101/socket/Home-Page/nodeJSWebSocketDotIO',
            {
                withCredentials: true, 
                query: {
                    userId: authUserId.value,
                    updatesToSubscribeTo: JSON.stringify(['post-likes', 'post-comments'])
                }
            }
        );


        nodeJSWebSocketDotIO.on('error', (_) => {
            console.error(`There was trouble with the nodeJSWebSocketDotIO connection, which is responsible
            for providing info for notifications of updates to post-likes and post-comments.`);
        });


        nodeJSWebSocketDotIO.on('PostLike', async (data) => {
            const { likeId, overallPostId, likerId, likerName } = data;
            
            if (!(likerId in usersAndTheirRelevantInfo.value) ||
            !('profilePhoto' in usersAndTheirRelevantInfo.value[likerId])) {
                await getProfilePhotoOfUser(likerId);
            }
    

            if (!(overallPostId in postsAndTheirPreviewImgs.value)) {
                await getPreviewImageOfPost(overallPostId);
            }

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value,
                {
                    postLikeId: likeId,
                    leftImage: usersAndTheirRelevantInfo.value[likerId]?.profilePhoto ?? defaultPfp,
                    rightImage: postsAndTheirPreviewImgs.value[overallPostId] ?? defaultVideoFrame,
                    description: `@${likerName} liked your post`,
                    leftImageLink: `http://34.111.89.101/profile/${likerName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}`
                }
            ];
        });


        nodeJSWebSocketDotIO.on('PostUnlike', (data) => {
            const { likeId } = data;

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value.filter(notification => {
                    if ('postLikeId' in notification && notification.postLikeId == likeId) {
                        return false;
                    }
                    return true;
                })
            ];
        });


        nodeJSWebSocketDotIO.on('PostComment', async (data) => {
            const { commentId, overallPostId, commenterId, commenterName, comment } = data;

            if (!(commenterId in usersAndTheirRelevantInfo.value) ||
            !('profilePhoto' in usersAndTheirRelevantInfo.value[commenterId])) {
                await getProfilePhotoOfUser(commenterId);
            }

            if (!(overallPostId in postsAndTheirPreviewImgs.value)) {
                await getPreviewImageOfPost(overallPostId);
            }

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value,
                {
                    postCommentId: commentId,
                    leftImage: usersAndTheirRelevantInfo.value[commenterId]?.profilePhoto ?? defaultPfp,
                    rightImage: postsAndTheirPreviewImgs.value[overallPostId] ?? defaultVideoFrame,
                    description: `@${commenterName} commented on your post: '${comment}'`,
                    leftImageLink: `http://34.111.89.101/profile/${commenterName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
                }
            ];
        });


        nodeJSWebSocketDotIO.on('EditedPostComment', async (data) => {
            const { commentId, commenterId, commenterName, comment } = data;

            let commentIdWasFoundInNotifications = false;

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value.map(notification => {
                    if ('postCommentId' in notification && notification.postCommentId == commentId) {
                        commentIdWasFoundInNotifications = true;
                        notification.description = `@${commenterName} edited their comment on your post to this: '${comment}'`;
                    }
                    return notification;
                }),
            ];

            if (!commentIdWasFoundInNotifications) {
                if (!(commenterId in usersAndTheirRelevantInfo.value) ||
                !('profilePhoto' in usersAndTheirRelevantInfo.value[commenterId])) {
                    await getProfilePhotoOfUser(commenterId);
                }

                const { overallPostId } = data;

                if (!(overallPostId in postsAndTheirPreviewImgs.value)) {
                    await getPreviewImageOfPost(overallPostId);
                }

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value,
                    {
                        postCommentId: commentId,
                        leftImage: usersAndTheirRelevantInfo.value[commenterId]?.profilePhoto ?? defaultPfp,
                        rightImage: postsAndTheirPreviewImgs.value[overallPostId] ?? defaultVideoFrame,
                        description: `@${commenterName} edited their comment on your post to this: '${comment}'`,
                        leftImageLink: `http://34.111.89.101/profile/${commenterName}`,
                        entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
                    }
                ];
            }
        });


        nodeJSWebSocketDotIO.on('DeletedPostComment', (data) => {
            const { commentId } = data;

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value.filter(notification => {
                    if ('postCommentId' in notification && notification.postCommentId == commentId) {
                        return false;
                    }
                    return true;
                })
            ];
        });
    }


    function establishCollaborationWithCSharpSignalRWebSocket() {
        const webSocketForCommentLikes = new signalR.HubConnectionBuilder()
        .withUrl(`http://34.111.89.101/socket/Home-Page/cSharpSignalRWebSocket/websocketForCommentLikes?userId=${authUserId.value}`, {
            withCredentials: true,
            accessTokenFactory: () => '',
            transport: signalR.HttpTransportType.WebSockets
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();


        webSocketForCommentLikes.onclose((_) => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentLikes connection.`);
        });


        webSocketForCommentLikes.on('CommentLike', async (data) => {
            const { likeId, overallPostId, commentId, comment, likerId, likerName } = data;

            if (!(likerId in usersAndTheirRelevantInfo.value) ||
            !('profilePhoto' in usersAndTheirRelevantInfo.value[likerId])) {
                await getProfilePhotoOfUser(likerId);
            }

            if (!(overallPostId in postsAndTheirPreviewImgs.value)) {
                await getPreviewImageOfPost(overallPostId);
            }

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value,
                {
                    commentLikeId: likeId,
                    leftImage: usersAndTheirRelevantInfo.value[likerId]?.profilePhoto ?? defaultPfp,
                    rightImage: postsAndTheirPreviewImgs.value[overallPostId] ?? defaultVideoFrame,
                    description: `@${likerName} liked your comment: '${comment}'`,
                    leftImageLink: `http://34.111.89.101/profile/${likerName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
                }
            ];
        });


        webSocketForCommentLikes.on('CommentUnlike', (data) => {
            const { likeId } = data;

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value.filter(notification => {
                    if ('commentLikeId' in notification && notification.commentLikeId == likeId) {
                        return false;
                    }
                    return true;
                })
            ];
        });


        webSocketForCommentLikes.start().catch(_ => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentLikes connection.`);
        });


        const webSocketForCommentReplies = new signalR.HubConnectionBuilder()
        .withUrl(`http://34.111.89.101/socket/Home-Page/cSharpSignalRWebSocket/websocketForCommentReplies?userId=${authUserId.value}`, {
            withCredentials: true,
            accessTokenFactory: () => '',
            transport: signalR.HttpTransportType.WebSockets
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();


        webSocketForCommentReplies.onclose((_) => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentReplies connection.`);
        });


        webSocketForCommentReplies.on('CommentReply', async (data) => {
            const { replyId, overallPostId, replierId, replierName, reply } = data;

            if (!(replierId in usersAndTheirRelevantInfo.value) ||
            !('profilePhoto' in usersAndTheirRelevantInfo.value[replierId])) {
                await getProfilePhotoOfUser(replierId);
            }

            if (!(overallPostId in postsAndTheirPreviewImgs.value)) {
                await getPreviewImageOfPost(overallPostId);
            }

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value,
                {
                    commentReplyId: replyId,
                    leftImage: usersAndTheirRelevantInfo.value[replierId]?.profilePhoto ?? defaultPfp,
                    rightImage: postsAndTheirPreviewImgs.value[overallPostId] ?? defaultVideoFrame,
                    description: `@${replierName} replied to your comment with this: '${reply}'`,
                    leftImageLink: `http://34.111.89.101/profile/${replierName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${replyId}`
                }
            ];
        });


        webSocketForCommentReplies.on('EditedCommentReply', async (data) => {
            const { replyId, replierId, replierName, reply } = data;

            let replyIdWasFoundInNotifications = false;

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value.map(notification => {
                    if ('commentReplyId' in notification && notification.commentReplyId == replyId) {
                        replyIdWasFoundInNotifications = true;
                        notification.description =
                        `@${replierName} edited their reply to your comment with this: '${reply}'`;
                    }
                    return notification;
                }),
            ];

            if (!replyIdWasFoundInNotifications) {
                if (!(replierId in usersAndTheirRelevantInfo.value) ||
                !('profilePhoto' in usersAndTheirRelevantInfo.value[replierId])) {
                    await getProfilePhotoOfUser(replierId);
                }

                const { overallPostId } = data;

                if (!(overallPostId in postsAndTheirPreviewImgs.value)) {
                    await getPreviewImageOfPost(overallPostId);
                }

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value,
                    {
                        commentReplyId: replyId,
                        leftImage: usersAndTheirRelevantInfo.value[replierId]?.profilePhoto ?? defaultPfp,
                        rightImage: postsAndTheirPreviewImgs.value[overallPostId] ?? defaultVideoFrame,
                        description: `@${replierName} edited their reply to your comment with this: '${reply}'`,
                        leftImageLink: `http://34.111.89.101/profile/${replierName}`,
                        entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${replyId}`
                    }
                ];
            }
        });


        webSocketForCommentReplies.on('DeletedCommentReply', (data) => {
            const { replyId } = data;

            orderedListOfNotifications.value = [
                ...orderedListOfNotifications.value.filter(notification => {
                    if ('commentReplyId' in notification && notification.commentReplyId == replyId) {
                        return false;
                    }
                    return true;
                })
            ];
        });


        webSocketForCommentReplies.start().catch(_ => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentReplies connection.`);
        });
    }


    function establishCollaborationWithPhpRatchetWebSocket() {
        const phpRatchetWebSocket = new WebSocket(
            `ws://34.111.89.101/socket/Home-Page/phpRatchetWebSocket?userId=${authUserId.value}`
        );


        phpRatchetWebSocket.onerror = (_) => {
            console.error(`There was trouble with the phpRatchetWebSocket connection, which is responsible
            for providing info for notifications of updates to followings/follow-requests.`);
        };


        phpRatchetWebSocket.onmessage = async (messageEvent) => {
            const parsedMessageData = JSON.parse(messageEvent.data);

            if (parsedMessageData.event === 'FollowRequest') {
                const { requesterId } = parsedMessageData.data;

                if (!(requesterId in usersAndTheirRelevantInfo.value) ||
                !('profilePhoto' in usersAndTheirRelevantInfo.value[requesterId])) {
                    await getProfilePhotoOfUser(requesterId);
                }

                const { requesterName } = parsedMessageData.data;

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value,
                    {
                        requesterId: requesterId,
                        leftImage: usersAndTheirRelevantInfo.value[requesterId]?.profilePhoto ?? defaultPfp,
                        rightImage: null, 
                        description: `@${requesterName} requested to follow you`,
                        leftImageLink: `http://34.111.89.101/profile/${requesterName}`,
                        entireNotificationLink: `http://34.111.89.101/profile/${requesterName}`
                    }
                ];
            } 
            else if (parsedMessageData.event === 'FollowRequestCancellation') {
                const { requesterId } = parsedMessageData.data;

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value.filter(notification => {
                        if ('requesterId' in notification && notification.requesterId == requesterId) {
                            return false;
                        }
                        return true;
                    })
                ];
            }
            else if (parsedMessageData.event === 'Following') {
                const { followerId } = parsedMessageData.data;

                if (!(followerId in usersAndTheirRelevantInfo.value) ||
                !('profilePhoto' in usersAndTheirRelevantInfo.value[followerId])) {
                    await getProfilePhotoOfUser(followerId);
                }

                const { followerName } = parsedMessageData.data;

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value,
                    {
                        followerId: followerId,
                        leftImage: usersAndTheirRelevantInfo.value[followerId]?.profilePhoto ?? defaultPfp,
                        rightImage: null, 
                        description: `@${followerName} is now following you`,
                        leftImageLink: `http://34.111.89.101/profile/${followerName}`,
                        entireNotificationLink: `http://34.111.89.101/profile/${followerName}`
                    }
                ];
            }
            else if (parsedMessageData.event === 'Unfollowing') {
                const { followerId } = parsedMessageData.data;
                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value.filter(notification => {
                        if ('followerId' in notification && notification.requesterId == followerId) {
                            return false;
                        }
                        return true;
                    })
                ];
            }
        }
    }


    function establishCollaborationWithPythonWebSocket() {
        const pythonWebSocket = new WebSocket(
            `ws://34.111.89.101/socket/Home-Page/pythonWebSocket?userId=${encodeURIComponent(authUserId.value)}&updatesToSubscribeTo=${encodeURIComponent(JSON.stringify(['new-messages']))}`
        );

        
        pythonWebSocket.onerror = (_) => {
            console.error(`There was trouble with the pythonWebSocket connection, which is responsible for providing info for
            notifications of updates to messages.`);
        };


        pythonWebSocket.onmessage = async (messageEvent) => {
            const parsedMessageData = JSON.parse(messageEvent.data);

            if (parsedMessageData.event === 'Message') {
                const { messageId, convoId, convoTitle, isGroupChat, senderId, senderName, message } = parsedMessageData.data;

                if (!(senderId in usersAndTheirRelevantInfo.value) ||
                !('profilePhoto' in usersAndTheirRelevantInfo.value[senderId])) {
                    await getProfilePhotoOfUser(senderId);
                }

                let description = '';

                if (isGroupChat) {
                    if (convoTitle !== null) {
                        description = `@${senderName} sent a message in your group-chat named '${convoTitle}': ${message}`;
                    }
                    else {
                        description = `@${senderName} sent a message in your group-chat: ${message}`;
                    }
                }
                else {
                    if (convoTitle !== null) {
                        description = `@${senderName} sent a message to you in the convo named '${convoTitle}': ${message}`;
                    }
                    else {
                        description = `@${senderName} sent a message to you: ${message}`;
                    }
                }

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value,
                    {
                        messageId: messageId,
                        leftImage: usersAndTheirRelevantInfo.value[senderId]?.profilePhoto ?? defaultPfp,
                        rightImage: isGroupChat ? defaultGroupChatPfp : null, 
                        description: description,
                        leftImageLink: `http://34.111.89.101/profile/${senderId}`,
                        entireNotificationLink: `http://34.111.89.101/messages/${convoId}`
                    }
                ];
            }
            else if (parsedMessageData.event === 'MessageDelete') {
                const { messageId } = parsedMessageData.data;

                orderedListOfNotifications.value = [
                    ...orderedListOfNotifications.value.filter(notification => {
                        if ('messageId' in notification && notification.messageId == messageId) {
                            return false;
                        }
                        return true;
                    })
                ];
            }
        }
    }


    async function getProfilePhotoOfUser(userId) {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotoOfUser
            /${authUserId.value}/${userId}`, {
                credentials: 'include'
            });

            if(response.ok) {
                const userProfilePhotoBlob = await response.blob();
                const userProfilePhotoURL = URL.createObjectURL(userProfilePhotoBlob);

                if (!(userId in usersAndTheirRelevantInfo.value)) {
                    usersAndTheirRelevantInfo.value[userId] = {};
                }

                usersAndTheirRelevantInfo.value[userId].profilePhoto = userProfilePhotoURL;
            }
        }
        catch {
            console.error(`There was trouble getting the profile-photo of user ${userId}, which is needed for at-least one
            of the notifications`);
        }
    }


    async function getPreviewImageOfPost(overallPostId) {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/getPreviewImageOfPost
            /${authUserId.value}/${overallPostId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const previewImageBlob = await response.blob();
                const previewImageURL = URL.createObjectURL(previewImageBlob);

                postsAndTheirPreviewImgs.value[overallPostId] = previewImageURL;
            }
        }
        catch {
            console.error(`There was trouble getting the preview-image of post ${overallPostId}, which is needed
            for at-least one of the notifications`);
        }
    }
</script>