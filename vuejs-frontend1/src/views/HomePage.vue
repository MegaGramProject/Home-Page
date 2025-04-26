<template>
    <LeftSidebar
        :profilePhoto="defaultPfp"
        :displayPopup="displayLeftSidebarPopup"
        :authUserIsAnonymousGuest="authUserId == -1"
        :toggleDisplayPopup="toggleDisplayLeftSidebarPopup"
    />


    <div style="position: absolute; left: 24%;">
       
    </div>

    <img v-if="displayLeftSidebarPopup || displayErrorPopup || displayThreeDotsPopup || displayAboutAccountPopup ||
    displayLikersPopup || displaySendPostPopup" @click="closeAllPopups" :src="blackScreen" style="position: fixed; top: 0%; left: 0%;
    width: 100%; height: 100%; opacity: 0.7; zIndex: 2;"/>

    <div v-if="displayAboutAccountPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayStoryViewer ? '1' : '3' }
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
        :zIndex="displayErrorPopup ? '1' : '3'"
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
        { zIndex: displayErrorPopup ? '1' : '3' }
    ]">
        <LeftSidebarPopup
            :authUserId="authUserId"
            :originalURL="originalURL"
            :showErrorPopup="showErrorPopup"
        />
    </div>

    <div v-if="displayThreeDotsPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayErrorPopup ? '1' : '3' }
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
        { zIndex: displayErrorPopup ? '1' : '3' }
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
        { zIndex: displayErrorPopup ? '1' : '3' }
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
    3;">
        <ErrorPopup
            :errorMessage="errorPopupMessage"
            :closePopup="closeErrorPopup"
        />
    </div>
</template>


<script setup>
/* eslint-disable no-unused-vars */
    import AboutAccountPopup from '@/components/Popups/AboutAccountPopup.vue';
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
    FooterSection; MediaPost; UserBar; UserIcon;

    import blackScreen from '@/assets/images/blackScreen.png';
import defaultPfp from '@/assets/images/defaultPfp.png';

    
    import '../assets/styles.css';

    import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';


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
    const commentsPopupMainPostAuthorInfo = ref({});

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

    const cachedMessageSendingSuggestions = ref({});

    const orderedListOfPosts = ref([]);
    const focusedMediaPostId = ref('');


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


    function showCommentsPopup(postDetails, currSlide, mainPostAuthorInfo) {
        commentsPopupPostDetails.value = postDetails;
        commentsPopupCurrSlide.value = currSlide;
        commentsPopupMainPostAuthorInfo.value = mainPostAuthorInfo;

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
</script>