<template>
    <LeftSidebar
        :profilePhoto="usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp"
        :displayPopup="displayLeftSidebarPopup"
        :authUserIsAnonymousGuest="authUserId == -1"
        :toggleDisplayPopup="toggleDisplayLeftSidebarPopup"
    />

    <div style="margin-top: 2.3em; width: 82%; position: absolute; left: 18%; display: flex; gap: 2%;">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: start; width: 65%;">
            <div style="display: flex; align-items: start; justify-content: center; gap: 1em; position: relative; width:
            100%;">
                <div style="height: 4.6em; width: 2em; position: relative;">
                    <img v-if="currStoryLevel > 0" :src="nextArrow" class="iconToBeAdjustedForDarkMode"
                    @click="changeStoryLevel('decrement')" style="height: 1.5em; width: 1.5em; object-fit: contain; cursor:
                    pointer; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(180deg);"/>
                </div>
                
                <UserIcon v-if="currStoryLevel == 0"
                    :authUserId="authUserId"
                    :userId="authUserId"
                    :username="authUsername"
                    :userPfp="usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp"
                    :inStoriesSection="true"
                    :isSponsored="false"
                    :userHasStories="authUserId in usersAndTheirStories"
                    :userHasUnseenStory="!(userIdsWhoseStoriesYouHaveFinished.has(authUserId))"
                    :userIsVerified="usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false"
                    :showStoryViewer="showStoryViewer"
                />

                <template v-if="fetchingStoriesIsComplete && storiesSectionErrorMessage.length == 0">
                    <UserIcon v-for="(userId, index) in orderedListOfUserIdsInStoriesSection.slice(
                        currStoryLevel * 6, currStoryLevel * 6 + 6
                    )"
                        :key="userId"
                        :authUserId="authUserId"
                        :userId="userId"
                        :username="orderedListOfUsernamesInStoriesSection[currStoryLevel * 6 + index]"
                        :userPfp="usersAndTheirRelevantInfo[userId]?.profilePhoto ?? defaultPfp"
                        :inStoriesSection="true"
                        :isSponsored="orderedListOfSponsorshipStatusesInStoriesSection[currStoryLevel * 6 + index]"
                        :userHasStories="true"
                        :userHasUnseenStory="!(userIdsWhoseStoriesYouHaveFinished.has(userId))"
                        :userIsVerified="usersAndTheirRelevantInfo[userId]?.isVerified ?? false"
                        :showStoryViewer="showStoryViewer"
                    />

                    <div style="height: 4.6em; width: 2em; position: relative;">
                        <img v-if="(currStoryLevel + 1) * 6 < orderedListOfUsernamesInStoriesSection.length" :src="nextArrow" 
                        class="iconToBeAdjustedForDarkMode" @click="changeStoryLevel('increment')" style="height: 1.5em; width:
                        1.5em; object-fit: contain; cursor: pointer; position: absolute; top: 50%; left: 50%; transform:
                        translate(-50%, -50%);"/>
                    </div>
                </template>

                <div v-else-if="fetchingStoriesIsComplete && storiesSectionErrorMessage.length>0" style="height: 4.6em;
                width: 50%; position: relative; margin-left: 10%;">
                    <p style="font-size: 0.9em; max-width: 100%; overflow-wrap: break-word; color: gray;
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -80%);">
                        {{ storiesSectionErrorMessage }}
                    </p>
                </div>

                <div v-else style="height: 4.6em; width: 2em; position: relative; margin-left: 20%;">
                    <img :src="loadingAnimation" style="height: 1.5em; width: 1.5em; object-fit: contain; pointer-events: none;
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"/>
                </div>
            </div>

            <br/>
            <br/>

            <template v-if="initialPostsFetchingIsComplete && initialPostsFetchingErrorMessage.length == 0">
                <MediaPost v-for="postDetails in orderedListOfPosts"
                    :key="postDetails.overallPostId"
                    :authUserId="authUserId"
                    :postDetails="postDetails"
                    :mainPostAuthorInfo="usersAndTheirRelevantInfo[postDetails.authorIds[0]] ?? {}"
                    :isFocused="focusedMediaPostId === postDetails.overallPostId"
                    :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
                    :updatePostDetails="updatePostDetails"
                    :showThreeDotsPopup="showThreeDotsPopup"
                    :showCommentsPopup="showCommentsPopup"
                    :showSendPostPopup:="showSendPostPopup"
                    :showLikersPopup="showLikersPopup"
                    :showErrorPopup="showErrorPopup"
                    :showStoryViewer="showStoryViewer"
                    :focusOnThisMediaPost="updateFocusedMediaPost"
                />
            </template>

            <div v-if="!isCurrentlyFetchingAdditionalPosts && additionalPostsFetchingErrorMessage.length > 0"
            style="margin-top: 2.5em; display: flex; width: 100%; justify-content: center;">
                <p style="max-width: 50%; overflow-wrap: break-word; color: gray; font-size: 0.9em;">
                    {{ additionalPostsFetchingErrorMessage }}
                </p>
            </div>

            <div v-else-if="isCurrentlyFetchingAdditionalPosts" style="margin-top: 2.5em; display: flex; width: 100%;
            justify-content: center;">
                <img :src="loadingAnimation" style="height: 1.5em; width: 1.5em; object-fit: contain; pointer-events: none;"/>
            </div>
        </div>


        <div id="rightmostSection" style="display: flex; flex-direction: column; align-items: start; justify-content: start;
        width: 22%; gap: 1em; position: relative;">
            <UserBar v-if="authUserId !== -1"
                :username="authUsername"
                :userFullName="usersAndTheirRelevantInfo[authUserId]?.fullName ?? 'Could not get full-name'"
                :userPfp="usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp"
                :authUserId="authUserId"
                :userId="authUserId"
                :numFollowers="0"
                :numFollowings="0"
                :numPosts="0"
                :userIsPrivate="usersAndTheirRelevantInfo[authUserId]?.isPrivate ?? false"
                :userIsVerified="usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false"
                :showErrorPopup="showErrorPopup"
            />

            <div style="width: 100%; position: relative; margin-bottom: 2em;">
                <b style="color: #787878; position: absolute; left: 0%; top: 0%;">Suggested for you</b>

                <a href="http://34.111.89.101/user-suggestions" target="_blank" rel="noopener noreferrer"
                style="font-size: 0.9em; position: absolute; right: 0%; top: 0%;">
                    See all
                </a>
            </div>

            <template v-if="fetchingSuggestedUsersIsComplete && suggestedUsersSectionErrorMessage.length == 0">
                <UserBar v-for="(suggestedUserId, index) in orderedListOfSuggestedUserIds"
                    :key="suggestedUserId"
                    :username="orderedListOfSuggestedUsernames[index]"
                    :userFullName="usersAndTheirRelevantInfo[suggestedUserId]?.fullName ?? 'Could not get full-name'"
                    :userPfp="usersAndTheirRelevantInfo[suggestedUserId]?.profilePhoto ?? defaultPfp"
                    :authUserId="authUserId"
                    :userId="suggestedUserId"
                    :numFollowers="usersAndTheirRelevantInfo[suggestedUserId]?.numFollowers ?? -1"
                    :numFollowings="usersAndTheirRelevantInfo[suggestedUserId]?.numFollowings ?? -1"
                    :numPosts="usersAndTheirRelevantInfo[suggestedUserId]?.numPosts ?? -1"
                    :userIsPrivate="usersAndTheirRelevantInfo[suggestedUserId]?.isPrivate ?? false"
                    :userIsVerified="usersAndTheirRelevantInfo[suggestedUserId]?.isVerified ?? false"
                    :showErrorPopup="showErrorPopup"
                />
            </template>

            <p v-else-if="fetchingSuggestedUsersIsComplete && suggestedUsersSectionErrorMessage.length > 0" style="color: gray;
            width: 100%; overflow-wrap: break-word; margin-top: 2em; margin-bottom: 2em; font-size: 0.85em;">
                {{ suggestedUsersSectionErrorMessage }}
            </p>

            <img v-else :src="loadingAnimation" style="height: 1.5em; width: 1.5em; object-fit: contain; pointer-events:
            none; margin-top: 2em; margin-bottom: 2em; margin-left: 50%;"/>
            
            <br/>

            <footer style="color: gray; fontSize: 0.8em; width: 100%;">
                Megagram, a full-stack web-application that blends a bit of Instagram with a bit of Amazon, is a personal
                project of Rishav Ray.
            </footer>
        </div>
    </div>

    <p v-if="initialPostsFetchingIsComplete && initialPostsFetchingErrorMessage.length > 0" style="position: absolute; top: 50%;
    left: 50%; transform: translate(-50%, -50%); max-width: 35%; overflow-wrap: break-word; color: gray; font-size: 0.9em;">
        {{ initialPostsFetchingErrorMessage }}
    </p>

    <img v-else-if="!initialPostsFetchingIsComplete" :src="loadingAnimation" style="position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%); height: 1.5em; width: 1.5em; object-fit: contain; pointer-events: none;"/>

    <img v-if="displayLeftSidebarPopup || displayErrorPopup || displayThreeDotsPopup || displayAboutAccountPopup ||
    displayLikersPopup || displaySendPostPopup || displayCommentsPopup" @click="closeAllPopups" :src="blackScreen"
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
        :userIdsWhoseStoriesYouHaveFinished="userIdsWhoseStoriesYouHaveFinished"
        :updateUsersAndTheirStories="updateUsersAndTheirStories"
        :updateUsersAndTheirStoryPreviews="updateUsersAndTheirStoryPreviews"
        :updateUsersAndYourCurrSlideInTheirStories="updateUsersAndYourCurrSlideInTheirStories"
        :updateVidStoriesAndTheirPreviewImages="updateVidStoriesAndTheirPreviewImages"
        :addUserIdToSetOfUsersWhoseStoriesYouHaveFinished="addUserIdToSetOfUsersWhoseStoriesYouHaveFinished"
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

    import LeftSidebar from '@/components/LeftSidebar.vue';
import MediaPost from '@/components/MediaPost.vue';
import StoryViewer from '@/components/StoryViewer.vue';
import UserBar from '@/components/UserBar.vue';
import UserIcon from '@/components/UserIcon.vue';
import UserNotification from '@/components/UserNotification.vue';

    import blackScreen from '@/assets/images/blackScreen.png';
import defaultGroupChatPfp from '@/assets/images/defaultGroupChatPfp.png';
import defaultPfp from '@/assets/images/defaultPfp.png';
import defaultVideoFrame from '@/assets/images/defaultVideoFrame.jpg';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import nextArrow from '../assets/images/nextArrow.png';

    import '../assets/styles.css';

    import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

    import * as signalR from '@microsoft/signalr';
import { io } from 'socket.io-client';


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
    const userIdsWhoseStoriesYouHaveFinished = ref(new Set());
    const usersAndTheirStories = ref({});
    const usersAndTheirStoryPreviews = ref({});
    const usersAndYourCurrSlideInTheirStories = ref({});
    const vidStoriesAndTheirPreviewImages = ref({});

    const usersAndTheirRelevantInfo = ref({});
    const postsAndTheirPreviewImgs = ref({});

    const cachedMessageSendingSuggestions = ref({});

    const orderedListOfPosts = ref([]);
    const focusedMediaPostId = ref('');
    const initialPostsFetchingIsComplete = ref(false);
    const isCurrentlyFetchingAdditionalPosts = ref(false);
    const initialPostsFetchingErrorMessage = ref('');
    const additionalPostsFetchingErrorMessage = ref('');

    const orderedListOfSuggestedUserIds = ref([]);
    const orderedListOfSuggestedUsernames = ref([]);
    const fetchingSuggestedUsersIsComplete = ref(false);
    const suggestedUsersSectionErrorMessage = ref('');

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

            newRouteParams;

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


    watch([fetchingStoriesIsComplete, fetchingSuggestedUsersIsComplete, initialPostsFetchingIsComplete],
    ([newFetchingStoriesIsComplete, newFetchingSuggestedUsersIsComplete, newInitialPostsFetchingIsComplete]) =>
        {
            if (newFetchingStoriesIsComplete && newFetchingSuggestedUsersIsComplete && newInitialPostsFetchingIsComplete) {
                fetchAllTheNecessaryUserInfo();
            }
        }
    );


    function fetchAdditionalPostsWhenUserScrollsToBottomOfPage() {
        if (!isCurrentlyFetchingAdditionalPosts.value && window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight) {
            isCurrentlyFetchingAdditionalPosts.value = true;
            fetchPosts('additional');
        }
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


    function addUserIdToSetOfUsersWhoseStoriesYouHaveFinished(newFinishedUserId) {
        userIdsWhoseStoriesYouHaveFinished.value = new Set(
            [
                ...userIdsWhoseStoriesYouHaveFinished.value,
                newFinishedUserId
            ]
        );
    }


    function changeStoryLevel(incrementOrDecrementText) {
        if (incrementOrDecrementText === 'increment') {
            currStoryLevel.value++;
        }
        else {
            currStoryLevel.value--;
        }
    }


    function updateFocusedMediaPost(newFocusedMediaPostId) {
        focusedMediaPostId.value = newFocusedMediaPostId;
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
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/springBootBackend2/getMyOwnStories
            /${authUserId.value}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('The springBootBackend2 server had trouble getting your stories, if any');
            }
            else {
                const responseData = await response.json();

                if (responseData.currSlide === 'finished') {
                    usersAndYourCurrSlideInTheirStories.value[authUserId.value] = 0;
                    userIdsWhoseStoriesYouHaveFinished.value = new Set([
                        ...userIdsWhoseStoriesYouHaveFinished.value,
                        authUserId.value
                    ]);
                }
                else if (responseData.currSlide > -1) {
                    usersAndYourCurrSlideInTheirStories.value[authUserId.value] = 0;
                }

                if (responseData.currSlide !== -1) {
                    usersAndTheirStories.value[authUserId.value] = responseData.stories;
                }
            }
        }
        catch {
            console.error('There was trouble connecting to the springBootBackend2 server to get your stories, if any');
        }

        try {
            const response2 = await fetch(`http://34.111.89.101/api/Home-Page/springBootBackend2/
            getOrderedListOfUsersForMyStoriesSection/${authUserId.value}`, {
                credentials: 'include'
            });
            if (!response2.ok) {
                storiesSectionErrorMessage.value = `The server had trouble getting the ordered list of users for your
                stories-section.`;
            }
            else {
                const response2Data = await response2.json();

                orderedListOfUserIdsInStoriesSection.value = response2Data.orderedListOfUserIds;

                const newOrderedListOfUsernamesInStoriesSection = [];
                for(let storyAuthorId of response2Data.orderedListOfUserIds) {
                    newOrderedListOfUsernamesInStoriesSection.push(`user ${storyAuthorId}`);
                }
                orderedListOfUsernamesInStoriesSection.value = newOrderedListOfUsernamesInStoriesSection;

                orderedListOfSponsorshipStatusesInStoriesSection.value =
                response2Data.orderedListOfSponsorshipStatuses
            }
        }
        catch {
            storiesSectionErrorMessage.value = `There was trouble connecting to the server to get the ordered list of users for
            your stories-section.`;
        }

        fetchingStoriesIsComplete.value = true;
    }


    async function fetchSuggestedAccounts() {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/djangoBackend2
            /getNumFollowersFollowingsAndPostsOfMyTopFiveUserSuggestions/${authUserId.value}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                suggestedUsersSectionErrorMessage.value = 'The server had trouble getting your top-5 user-suggestions';
            }
            else {
                const responseData = await response.json();

                orderedListOfSuggestedUserIds.value = responseData.userIdsOfTheTop5;

                const newOrderedListOfSuggestedUsernames = [];
                for(let topSuggestedUserId of responseData.userIdsOfTheTop5) {
                    newOrderedListOfSuggestedUsernames.push(`user ${topSuggestedUserId}`);
                }
                orderedListOfSuggestedUsernames.value = newOrderedListOfSuggestedUsernames;

                const { numFollowersFollowingsAndPostsOfTheTop5 } = responseData;

                for(let suggestedUserId of responseData.userIdsOfTheTop5) {
                    if (!(suggestedUserId in usersAndTheirRelevantInfo.value)) {
                        usersAndTheirRelevantInfo.value[suggestedUserId] = {};
                    }

                    usersAndTheirRelevantInfo.value[suggestedUserId].numFollowers = numFollowersFollowingsAndPostsOfTheTop5[
                        suggestedUserId
                    ].numFollowers;

                    usersAndTheirRelevantInfo.value[suggestedUserId].numFollowings = numFollowersFollowingsAndPostsOfTheTop5[
                        suggestedUserId
                    ].numFollowings;

                    usersAndTheirRelevantInfo.value[suggestedUserId].numPosts = numFollowersFollowingsAndPostsOfTheTop5[
                        suggestedUserId
                    ].numPosts;
                }
            }
        }
        catch {
            suggestedUsersSectionErrorMessage.value = `There was trouble connecting to the server to get your top-5 
            user-suggestions.`;
        }

        fetchingSuggestedUsersIsComplete.value = true;
    }


    async function fetchPosts(initialOrAdditionalText) {
        let isInitialFetch;

        if (initialOrAdditionalText === 'initial') {
            isInitialFetch = true;
        } 
        else {
            isInitialFetch = false;
        }

        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/getBatchOfPostsForHomePageFeed
            /${authUserId.value}`, {
                credentials: 'include'
            });
            if (!response.ok) { 
                if (isInitialFetch) {
                    initialPostsFetchingErrorMessage.value = `The server had trouble getting the initial batch of posts for your
                    home-page feed`;
                }
                else {
                    additionalPostsFetchingErrorMessage.value = `The server had trouble getting an additional batch of posts
                    for your home-page feed`;

                    window.removeEventListener('scroll', fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
                }
            }
            else {
                const batchOfPostsForHomePageFeed = await response.json();
                
                orderedListOfPosts.value = [
                    ...orderedListOfPosts.value,
                    ...batchOfPostsForHomePageFeed.map(postDetails => postDetails.authorUsernames = postDetails.authorIds.map(
                    authorId => `user ${authorId}`))
                ];

                if (isInitialFetch) {
                    window.addEventListener('scroll', fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
                }
                else {
                    fetchAllTheNecessaryUserInfoOfAdditionalPosts(batchOfPostsForHomePageFeed);
                }
            }
        }
        catch {
            if (isInitialFetch) {
                initialPostsFetchingErrorMessage.value = `There was trouble connecting to the server to get the intial batch of
                posts for your home-page feed`;
            }
            else {
                additionalPostsFetchingErrorMessage.value = `There was trouble connecting to the server to get an additional
                batch of posts for your home-page feed`;

                window.removeEventListener('scroll', fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
            }
        }

        if (isInitialFetch) {
            initialPostsFetchingIsComplete.value = true;
        }
        else {
            isCurrentlyFetchingAdditionalPosts.value = false;
        }
    }


    async function fetchAllTheNecessaryUserInfo() {
        const setOfStoryAuthorIds = new Set(orderedListOfUserIdsInStoriesSection.value);

        const setOfSuggestedUserIds = new Set(orderedListOfSuggestedUserIds.value);

        const setOfAuthorIds = new Set();
        const setOfMainAuthorIds = new Set();
        const setOfLikerIdsFollowedByAuthUser = new Set();

        for(let postDetails of orderedListOfPosts.value) {
            setOfMainAuthorIds.add(postDetails.authorIds[0]);

            for(let authorId of postDetails.authorIds) {
                setOfAuthorIds.add(authorId);
            }

            for(let likerIdFollowedByAuthUser of postDetails.likersFollowedByAuthUser) {
                setOfLikerIdsFollowedByAuthUser.add(likerIdFollowedByAuthUser);
            }
        }

        const setOfAllUserIds = new Set([
            ...setOfStoryAuthorIds, ...setOfSuggestedUserIds, ...setOfAuthorIds, ...setOfMainAuthorIds,
            ...setOfLikerIdsFollowedByAuthUser
        ]);

        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newUserIdsNeededForUsernames = [...setOfAllUserIds];

        if (newUserIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newUserIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = authUserId.value;
            graphqlUserVariables.newUserIdsNeededForUsernames = newUserIdsNeededForUsernames;
        }

        let usersAndTheirFullNames = {};
        const newUserIdsNeededForFullNames = [...setOfSuggestedUserIds];

        if (newUserIdsNeededForFullNames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForFullNames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newUserIdsNeededForFullNames) `;
            graphqlUserVariables.authUserId = authUserId.value;
            graphqlUserVariables.newUserIdsNeededForFullNames = newUserIdsNeededForFullNames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newUserIdsNeededForVerificationStatuses = newUserIdsNeededForUsernames;

        if (newUserIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newUserIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId.value;
            graphqlUserVariables.newUserIdsNeededForVerificationStatuses = newUserIdsNeededForVerificationStatuses;
        }

        if (graphqlUserQueryString.length > 0) {
            let graphqlUserQueryStringHeader = 'query (';
            let graphqlUserQueryStringHeaderKeys = Object.keys(graphqlUserQueryStringHeaderInfo);

            for(let i=0; i<graphqlUserQueryStringHeaderKeys.length; i++) {
                const key = graphqlUserQueryStringHeaderKeys[i];
                const value = graphqlUserQueryStringHeaderInfo[key];

                if (i < graphqlUserQueryStringHeaderKeys.length-1) {
                    graphqlUserQueryStringHeader+= `${key}: ${value}, `;
                }
                else {
                    graphqlUserQueryStringHeader+= `${key}: ${value}`;
                }
            }

            graphqlUserQueryStringHeader+= '){ ';
            graphqlUserQueryString = graphqlUserQueryStringHeader + graphqlUserQueryString + '}';

            try {
                const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: graphqlUserQueryString,
                        variables: graphqlUserVariables
                    }),
                    credentials: 'include'
                });
                if (!response.ok) {
                    if (newUserIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched users'
                        );
                    }

                    if (newUserIdsNeededForFullNames.length > 0) {
                        console.error(
                            'The server had trouble fetching the full-names of all the newly fetched users'
                        );
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            users`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newUserIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewUserIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newUserIdsNeededForUsernames.length; i++) {
                            const newUserId = newUserIdsNeededForUsernames[i];
                            const newUsername = listOfUsernamesForNewUserIds[i];

                            if (newUsername !== null) {
                                usersAndTheirUsernames[newUserId] = newUsername;
                            }
                        }
                    }
                    
                    if (newUserIdsNeededForFullNames.length > 0) {
                        const listOfFullNamesForNewUserIds = responseData.data.getListOfFullNamesForUserIds;

                        for(let i=0; i<newUserIdsNeededForFullNames.length; i++) {
                            const newUserId = newUserIdsNeededForFullNames[i];
                            const newUserFullName = listOfFullNamesForNewUserIds[i];

                            if (newUserFullName !== null) {
                                usersAndTheirFullNames[newUserId] = newUserFullName;
                            }
                        }
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewUserIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newUserIdsNeededForVerificationStatuses.length; i++) {
                            const newUserId = newUserIdsNeededForVerificationStatuses[i];
                            const newUserVerificationStatus = listOfVerificationStatusesForNewUserIds[i];

                            if (newUserVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newUserId] = newUserVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newUserIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        users`
                    );
                }

                if (newUserIdsNeededForFullNames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the full-names of all the newly fetched
                        users`
                    ); 
                }

                if (newUserIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched users`
                    );
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const newUserIdsNeededForProfilePhotos = [
            ...new Set([
                ...setOfStoryAuthorIds, ...setOfSuggestedUserIds, ...setOfMainAuthorIds
            ])
        ];

        if (newUserIdsNeededForProfilePhotos.length>0) {
            try {
                const response2 = await fetch(
                `http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers/${authUserId.value}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        userIds: newUserIdsNeededForProfilePhotos
                    }),
                    credentials: 'include'
                });
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched users'
                    );
                }
                else {
                    usersAndTheirProfilePhotos = await response2.json();
                }
            }
            catch {
                console.error(
                    'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched users'
                );
            }
        }

        const newUsersAndTheirRelevantInfo = { ...usersAndTheirRelevantInfo.value };

        for(let userId of setOfAllUserIds) {
            if (!(userId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[userId] = {};
            }

            if (userId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[userId].username = usersAndTheirUsernames[userId];
            }

            if (userId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[userId].isVerified = usersAndTheirVerificationStatuses[userId];
            }
            
            if (userId in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[userId].fullName = usersAndTheirFullNames[userId];
            }

            if (userId in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[userId].profilePhoto = usersAndTheirProfilePhotos[userId];
            }
        }

        const newOrderedListOfUsernamesInStoriesSection = [];
        for(let userId of orderedListOfUserIdsInStoriesSection.value) {
            newOrderedListOfUsernamesInStoriesSection.push(
                newUsersAndTheirRelevantInfo[userId].username ?? `user ${userId}`
            );
        }
        orderedListOfUsernamesInStoriesSection.value = newOrderedListOfUsernamesInStoriesSection;

        const newOrderedListOfSuggestedUsernames = [];
        for(let userId of orderedListOfSuggestedUsernames.value) {
            newOrderedListOfSuggestedUsernames.push(
                newUsersAndTheirRelevantInfo[userId].username ?? `user ${userId}`
            );
        }
        orderedListOfSuggestedUsernames.value = newOrderedListOfSuggestedUsernames;

        usersAndTheirRelevantInfo.value = { ...newUsersAndTheirRelevantInfo };
    }


    async function fetchAllTheNecessaryUserInfoOfAdditionalPosts(additionalPosts) {
        const setOfAuthorIds = new Set();
        const setOfMainAuthorIds = new Set();
        const setOfLikerIdsFollowedByAuthUser = new Set();

        for(let postDetails of additionalPosts) {
            setOfMainAuthorIds.add(postDetails.authorIds[0]);

            for(let authorId of postDetails.authorIds) {
                setOfAuthorIds.add(authorId);
            }

            for(let likerIdFollowedByAuthUser of postDetails.likersFollowedByAuthUser) {
                setOfLikerIdsFollowedByAuthUser.add(likerIdFollowedByAuthUser);
            }
        }

        const setOfAllUserIds = new Set([...setOfAuthorIds, ...setOfMainAuthorIds, ...setOfLikerIdsFollowedByAuthUser]);

        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newUserIdsNeededForUsernames = [...setOfAllUserIds].filter(userId => {
            if (!(userId in usersAndTheirRelevantInfo.value) || !('username' in usersAndTheirRelevantInfo.value)) {
                return true;
            }
            return false;
        });

        if (newUserIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newUserIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = authUserId.value;
            graphqlUserVariables.newUserIdsNeededForUsernames = newUserIdsNeededForUsernames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newUserIdsNeededForVerificationStatuses = [...setOfAllUserIds].filter(userId => {
            if (!(userId in usersAndTheirRelevantInfo.value) || !('isVerified' in usersAndTheirRelevantInfo.value[userId])) {
                return true;
            }
            return false;
        });

        if (newUserIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newUserIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId.value;
            graphqlUserVariables.newUserIdsNeededForVerificationStatuses = newUserIdsNeededForVerificationStatuses;
        }

        if (graphqlUserQueryString.length > 0) {
            let graphqlUserQueryStringHeader = 'query (';
            let graphqlUserQueryStringHeaderKeys = Object.keys(graphqlUserQueryStringHeaderInfo);

            for(let i=0; i<graphqlUserQueryStringHeaderKeys.length; i++) {
                const key = graphqlUserQueryStringHeaderKeys[i];
                const value = graphqlUserQueryStringHeaderInfo[key];

                if (i < graphqlUserQueryStringHeaderKeys.length-1) {
                    graphqlUserQueryStringHeader+= `${key}: ${value}, `;
                }
                else {
                    graphqlUserQueryStringHeader+= `${key}: ${value}`;
                }
            }

            graphqlUserQueryStringHeader+= '){ ';
            graphqlUserQueryString = graphqlUserQueryStringHeader + graphqlUserQueryString + '}';

            try {
                const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: graphqlUserQueryString,
                        variables: graphqlUserVariables
                    }),
                    credentials: 'include'
                });
                if (!response.ok) {
                    if (newUserIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched users'
                        );
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            users`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newUserIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewUserIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newUserIdsNeededForUsernames.length; i++) {
                            const newUserId = newUserIdsNeededForUsernames[i];
                            const newUsername = listOfUsernamesForNewUserIds[i];

                            if (newUsername !== null) {
                                usersAndTheirUsernames[newUserId] = newUsername;
                            }
                        }
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewUserIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newUserIdsNeededForVerificationStatuses.length; i++) {
                            const newUserId = newUserIdsNeededForVerificationStatuses[i];
                            const newUserVerificationStatus = listOfVerificationStatusesForNewUserIds[i];

                            if (newUserVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newUserId] = newUserVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newUserIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        users`
                    );
                }

                if (newUserIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched users`
                    );
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const newUserIdsNeededForProfilePhotos = [...setOfMainAuthorIds].filter(userId => {
            if (!(userId in usersAndTheirRelevantInfo.value) || !('profilePhoto' in usersAndTheirRelevantInfo.value[userId])) {
                return true;
            }
            return false;
        });

        if (newUserIdsNeededForProfilePhotos.length>0) {
            try {
                const response2 = await fetch(
                `http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers/${authUserId.value}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        userIds: newUserIdsNeededForProfilePhotos
                    }),
                    credentials: 'include'
                });
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched users'
                    );
                }
                else {
                    usersAndTheirProfilePhotos = await response2.json();
                }
            }
            catch {
                console.error(
                    'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched users'
                );
            }
        }

        const newUsersAndTheirRelevantInfo = { ...usersAndTheirRelevantInfo.value };

        for(let userId of setOfAllUserIds) {
            if (!(userId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[userId] = {};
            }

            if (userId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[userId].username = usersAndTheirUsernames[userId];
            }

            if (userId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[userId].isVerified = usersAndTheirVerificationStatuses[userId];
            }
            
            if (userId in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[userId].profilePhoto = usersAndTheirProfilePhotos[userId];
            }
        }

        usersAndTheirRelevantInfo.value = { ...newUsersAndTheirRelevantInfo };
    }
</script>