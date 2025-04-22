<template>
    <div v-if="!storyFetchingIsComplete || storyFetchingError" style="background-color: black; position: fixed; width:
    100%; height: 100%; top: 0%; left: 0%">
        <img v-if="!storyFetchingIsComplete" :src="loadingAnimation" style="position: absolute; top: 50%; left: 50%;
        height: 3em; width: 3em; transform: translate(-50%, -50%); pointer-events: none"/>
    </div>
  
    <StoryViewer v-if="storyFetchingIsComplete && !storyFetchingError"
        :authUserId="authUserId"
        :authUsername="authUsername"
        :authUsernameWasProvidedInRoute="authUsernameWasProvidedInRoute"
        :storyAuthorUsername="storyAuthorUsername"
        :storyAuthorId="storyAuthorId"
        :zIndex="''"
        :orderedListOfUserIdsInStoriesSection="[]"
        :orderedListOfUsernamesInStoriesSection="[]"
        :orderedListOfSponsorshipStatusesInStoriesSection="[]"
        :isFromStoriesSection="false"
        :usersAndTheirStories="usersAndTheirStories"
        :usersAndTheirStoryPreviews="{}"
        :usersAndYourCurrSlideInTheirStories="usersAndYourCurrSlideInTheirStories"
        :vidStoriesAndTheirPreviewImages="vidStoriesAndTheirPreviewImages"
        :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
        :usernamesWhoseStoriesYouHaveFinished="new Set()"
        :viewedStoryIds="viewedStoryIds"
        :updateUsersAndTheirStories="updateUsersAndTheirStories"
        :updateUsersAndTheirStoryPreviews="updateUsersAndTheirStoryPreviews"
        :updateUsersAndYourCurrSlideInTheirStories="updateUsersAndYourCurrSlideInTheirStories"
        :updateVidStoriesAndTheirPreviewImages="updateVidStoriesAndTheirPreviewImages"
        :addUsernameToSetOfUsersWhoseStoriesYouHaveFinished="addUsernameToSetOfUsersWhoseStoriesYouHaveFinished"
        :addStoryIdToSetOfViewedStoryIds="addStoryIdToSetOfViewedStoryIds"
        :closeStoryViewer="closeStoryViewer"
        :showErrorPopup="showErrorPopup"
    />
  
    <template v-if="displayErrorPopup">
        <img @click="closeErrorPopup" :src="blackScreen" style="position: fixed; top: 0%; left: 0%; width: 100%; height: 100%;
        opacity: 0.7"/>

        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)">
            <ErrorPopup
                :errorMessage="errorPopupMessage"
                :closePopup="closeErrorPopup"
            />
        </div>
    </template>
</template>


<script setup>
    import ErrorPopup from '../components/Popups/ErrorPopup';
import StoryViewer from '../components/StoryViewer';

    import blackScreen from '../assets/images/blackScreen.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';

    import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';


    const route = useRoute();
    const numTimesRouteParamsWasWatched = ref(0);
    const authUsernameWasProvidedInRoute = ref(false);
    
    const authUserId = ref(-1);
    const authUsername = ref('');

    const storyId = ref(-1);
    const storyAuthorId = ref(-1);
    const storyAuthorUsername = ref('');

    const displayErrorPopup = ref(false);
    const errorPopupMessage = ref('');
   
    const storyFetchingError = ref(false);
    const storyFetchingIsComplete = ref(false);

    const viewedStoryIds = ref(new Set());

    const usersAndTheirRelevantInfo = ref({});
    const usersAndTheirStories = ref({});
    const usersAndYourCurrSlideInTheirStories = ref({});
    const vidStoriesAndTheirPreviewImages = ref({});

    
    onMounted(() => {
        document.title = 'Stories';
    });


    watch(() =>
        route.params,
        (newRouteParams) => {
            numTimesRouteParamsWasWatched.value++
            if (numTimesRouteParamsWasWatched.value < 2) {
                return;
            }

            const newRouteParamsAuthorUsernameOrStoryId = newRouteParams.authorUsernameOrStoryId;

            if (typeof newRouteParamsAuthorUsernameOrStoryId === 'string') {
                storyAuthorUsername.value = newRouteParamsAuthorUsernameOrStoryId;
            }
            else {
                storyId.value = newRouteParamsAuthorUsernameOrStoryId;
            }

            const newRouteParamsAuthUsername = newRouteParams.authUsername;

            if (typeof newRouteParamsAuthUsername !== 'undefined') {
                authUsernameWasProvidedInRoute.value = true;
            }

            if (typeof newRouteParamsAuthUsername !== 'undefined' && localStorage.getItem('defaultUsername') !==
            newRouteParamsAuthUsername) {
                authenticateUser(newRouteParamsAuthUsername, null);
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
            fetchTheNecessaryInfo();
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


    function closeStoryViewer() {
        window.location.href = 'http://34.111.89.101/';
    }


    function showErrorPopup(errorMessage) {
        errorPopupMessage.value = errorMessage;
        displayErrorPopup.value = true;
    }


    function closeErrorPopup() {
        displayErrorPopup.value = false;

        if(storyFetchingError.value) {
            window.location.href = 'http://34.111.89.101/';
        }
    }


    function updateUsersAndTheirStories(newUsersAndTheirStories) {
        usersAndTheirStories.value = newUsersAndTheirStories;
    }


    function updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews)  {
        newUsersAndTheirStoryPreviews; //do nothing
    }


    function updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories) {
        usersAndYourCurrSlideInTheirStories.value = newUsersAndYourCurrSlideInTheirStories;
    }


    function updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirPreviewImages) {
        vidStoriesAndTheirPreviewImages.value = newVidStoriesAndTheirPreviewImages;
    }
    

    function addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newUsername) {
        newUsername; //do nothing
    }


    function addStoryIdToSetOfViewedStoryIds(newlyViewedStoryId) {
        viewedStoryIds.value = new Set(
            [
                ...viewedStoryIds.value, 
                newlyViewedStoryId
            ]
        );
    }


    function formatDatetimeString(datetimeString) {
        const givenDatetime = new Date(datetimeString);
        const currentDatetime = new Date();
        const secondsDiff = Math.floor((currentDatetime - givenDatetime) / 1000);
    
        if (secondsDiff < 60) {
            return `${secondsDiff}s`;
        }
        else {
            const minutesDiff = Math.floor(secondsDiff / 60);
            if (minutesDiff < 60) {
                return `${minutesDiff}m`;
            } 
            else {
                const hoursDiff = Math.floor(minutesDiff / 60);
                if (hoursDiff < 24) {
                    return `${hoursDiff}h`;
                }
                else {
                    const daysDiff = Math.floor(hoursDiff/24);
                    if (daysDiff < 7) {
                        return `${daysDiff}d`;
                    }
                    else {
                        const weeksDiff = Math.floor(daysDiff / 7);
                        if (weeksDiff < 4) {
                            return `${weeksDiff}w`;
                        }
                        else {
                            const monthsDiff = Math.floor(daysDiff/30.417);
                            if (monthsDiff < 12) {
                                return `${monthsDiff}mo`;
                            }
                            else {
                                const yearsDiff = Math.floor(monthsDiff/12);
                                return `${yearsDiff}y`;
                            }
                        }
                    }
                }
            }
        }
    }


    async function fetchTheNecessaryInfo() {
        const newUsersAndTheirRelevantInfo = {};
        const newUsersAndTheirStories = {};
        const newUsersAndYourCurrSlideInTheirStories = {};
        
        let storyAuthorUsernameValue = '';
        let storyAuthorIdValue = -1;
        const authUserIdValue = authUserId.value;
        const storyIdValue = storyId.value;
        
        if (storyAuthorUsername.value.length == 0) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoryById/${authUserIdValue}/${storyIdValue}`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    storyFetchingError.value = true;
                    storyFetchingIsComplete.value = true;
                    showErrorPopup(`The server had trouble providing story ${storyIdValue}`);
                    return;
                }
                else {
                    const userStoryData = await response.json();

                    storyAuthorIdValue = userStoryData.authorId; 
                    storyAuthorId.value = storyAuthorIdValue;

                    if (userStoryData.authorUsername == null) {
                        storyAuthorUsernameValue = `user ${storyAuthorIdValue}`
                    }
                    else {
                        storyAuthorUsernameValue = userStoryData.authorUsername;
                    }
                    storyAuthorUsername.value = storyAuthorUsernameValue;

                    if (userStoryData.currSlide == -1) {
                        storyFetchingError.value = true;
                        storyFetchingIsComplete.value = true;
                        showErrorPopup(`User ${storyAuthorUsernameValue} does not currently have any unexpired stories`);
                        return;
                    }

                    if (!(storyAuthorIdValue in newUsersAndTheirRelevantInfo)) {
                        newUsersAndTheirRelevantInfo[storyAuthorIdValue] = {};
                    }
                    newUsersAndTheirRelevantInfo[storyAuthorIdValue].username = storyAuthorUsernameValue;

                    newUsersAndTheirStories[storyAuthorIdValue] = userStoryData.stories.map(userStory => {
                        userStory.datetime = formatDatetimeString(userStory.datetime);
                        return userStory
                    });

                    if (userStoryData.currSlide === 'finished') {
                        newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = 0;
                    }
                    else {
                        newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = userStoryData.currSlide;
                    }
                }
            }
            catch (error) {
                storyFetchingError.value = true;
                storyFetchingIsComplete.value = true;
                showErrorPopup(
                    `There was trouble connecting to the server to provide story ${storyIdValue}`
                );
                return;
            }
        }
        else {
            storyAuthorUsernameValue = storyAuthorUsername.value;
        }
        
        if (storyIdValue == -1) {
            try {
                const response1 = await fetch('http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `query getUserIdOfUsername($username: String!) {
                            getUserIdOfUsername(username: $username)
                        }`,
                        variables: {
                            username: storyAuthorUsernameValue
                        }
                    }),
                    credentials: 'include'
                },
                );
                if (!response1.ok) {
                    storyFetchingError.value = true;
                    storyFetchingIsComplete.value = true;
                    showErrorPopup(
                        `The server had trouble getting the user-id of username ${storyAuthorUsernameValue}`
                    );
                    return;
                }
                else {
                    storyAuthorIdValue = await response1.json();
                    storyAuthorIdValue = storyAuthorIdValue.data.getUserIdOfUsername;
                    
                    storyAuthorId.value = storyAuthorIdValue;
                   
                    if (!(storyAuthorIdValue in newUsersAndTheirRelevantInfo)) {
                        newUsersAndTheirRelevantInfo[storyAuthorIdValue] = {};
                    }
                    newUsersAndTheirRelevantInfo[storyAuthorIdValue].username = storyAuthorUsernameValue;
                }
            }
            catch {
                storyFetchingError.value = true;
                storyFetchingIsComplete.value = true;
                showErrorPopup(
                    `There was trouble connecting to the server to get the user-id of username ${storyAuthorUsernameValue}`
                );
                return;
            }

            try {
                const response2 = await fetch(
                `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoriesOfUser/${authUserIdValue}
                /${storyAuthorIdValue}`, {
                    credentials: 'include'
                });

                if (!response2.ok) {
                    storyFetchingError.value = true;
                    storyFetchingIsComplete.value = true;
                    showErrorPopup(`The server had trouble providing the stories of user ${storyAuthorUsernameValue}`);
                    return;
                }
                else {
                    const userStoryData = await response2.json();

                    if (userStoryData.currSlide == -1) {
                        storyFetchingError.value = true;
                        storyFetchingIsComplete.value = true;
                        showErrorPopup(`User ${storyAuthorUsernameValue} does not currently have any unexpired stories`);
                        return;
                    }

                    newUsersAndTheirStories[storyAuthorIdValue] = userStoryData.stories.map(userStory => {
                        userStory.datetime = formatDatetimeString(userStory.datetime);
                        return userStory
                    });

                    const newViewedStoryIds = new Set([...viewedStoryIds.value]);

                    if (userStoryData.currSlide === 'finished') {
                        newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = 0;

                        for(let story of userStoryData.stories) {
                            newViewedStoryIds.add(story.id)
                        }
                    }
                    else {
                        newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = userStoryData.currSlide;

                        for(let story of userStoryData.stories) {
                            newViewedStoryIds.add(story.id)
                            
                            if (story.id == userStoryData.currSlide) {
                                break;
                            }
                        }
                    }

                    viewedStoryIds.value = newViewedStoryIds;
                }
            }
            catch (error) {
                storyFetchingError.value = true;
                storyFetchingIsComplete.value = true;
                showErrorPopup(
                    `There was trouble connecting to the server to provide the stories of user ${storyAuthorUsernameValue}`
                );
                return;
            }
        }

        try {
            const response3 = await fetch(
            `http://34.111.89.101/api/Home-Page/laravelBackend1/getVerificationStatusOfUser/${authUserIdValue}
            /${storyAuthorIdValue}`);

            if (!response3.ok) {
                console.error(
                    `The server had trouble getting the verification-status of user ${storyAuthorUsernameValue}`
                );

                newUsersAndTheirRelevantInfo[storyAuthorIdValue].isVerified = false;
            }
            else {
                newUsersAndTheirRelevantInfo[storyAuthorIdValue].isVerified = await response3.json();
            }
        }
        catch (error) {
            console.error(
                `There was trouble connecting to the server to get the verification-status of user
                ${storyAuthorUsernameValue}`
            );

            newUsersAndTheirRelevantInfo[storyAuthorIdValue].isVerified = false;
        }

        try {
            const response4 = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotoOfUser/${authUserIdValue}
            /${storyAuthorIdValue}`);
            if (!response4.ok) {
                console.error(
                    `The server had trouble getting the profile-photo of user ${storyAuthorUsernameValue}`
                );

                newUsersAndTheirRelevantInfo[storyAuthorIdValue].profilePhoto = defaultPfp;
            }
            else {
                const profilePhotoBlobOfUser = await response4.blob();
                newUsersAndTheirRelevantInfo[storyAuthorIdValue].profilePhoto = URL.createObjectURL(profilePhotoBlobOfUser);
            }
        }
        catch (error) {
            console.error(
                `There was trouble connecting to the server to get the profile-photo of user ${storyAuthorUsernameValue}`
            );

            newUsersAndTheirRelevantInfo[storyAuthorIdValue].profilePhoto = defaultPfp;
        }

        usersAndTheirRelevantInfo.value = newUsersAndTheirRelevantInfo;
        usersAndTheirStories.value = newUsersAndTheirStories;
        usersAndYourCurrSlideInTheirStories.value = newUsersAndYourCurrSlideInTheirStories;

        storyFetchingIsComplete.value = true;
    }
</script>