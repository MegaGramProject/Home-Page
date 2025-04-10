<template>
    <LeftSidebar
        :profilePhoto="defaultPfp"
        :displayPopup="displayLeftSidebarPopup"
        :authUserIsAnonymousGuest="authUserId == -1"
        :toggleDisplayPopup="toggleDisplayLeftSidebarPopup"
    />


    <div style="position: absolute; left: 24%;">
        
    </div>

    <img v-if="displayLeftSidebarPopup || displayErrorPopup || displayThreeDotsPopup || displayAboutAccountPopup"
    @click="closeAllPopups" :src="blackScreen" style="position: fixed; top: 0%; left: 0%; width: 100%; height: 100%; opacity: 0.7;
    zIndex: 2;"/>

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

    <div v-if="displayAboutAccountPopup" :style="[
        { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { zIndex: displayStoryViewer ? '1' : '3' }
    ]">
        <AboutAccountPopup
            :authUserId="authUserId"
            :userId="aboutAccountUserId"
            :username="aboutAccountUsername"
            :authUser="authUser"
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


    <div v-if="displayErrorPopup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); zIndex: 3;">
        <ErrorPopup
            :errorMessage="errorPopupMessage"
            :closePopup="closeErrorPopup"
        />
    </div>
</template>


<script>
    import AboutAccountPopup from '@/components/Popups/AboutAccountPopup.vue';
import ErrorPopup from '@/components/Popups/ErrorPopup.vue';
import LeftSidebarPopup from '@/components/Popups/LeftSidebarPopup.vue';
import ThreeDotsPopup from '@/components/Popups/ThreeDotsPopup.vue';

    //import FooterSection from '@/components/FooterSection.vue';
import LeftSidebar from '@/components/LeftSidebar.vue';
//import UserIcon from '@/components/UserIcon.vue';

    import blackScreen from '@/assets/images/blackScreen.png';
import defaultPfp from '@/assets/images/defaultPfp.png';

    import '../assets/HomePageStyles.css';


    export default {
        components: {
            LeftSidebarPopup,
            ErrorPopup,
            ThreeDotsPopup,
            AboutAccountPopup,

            LeftSidebar,
            //FooterSection,
            //UserIcon,
        },


        data() {
            return {
                defaultPfp,
                blackScreen,

                authUser: '',
                authUserId: -1,

                originalURL: '',
                numTimesRouteParamsWasWatched: 0,

                displayLeftSidebarPopup: false,

                displayErrorPopup: false,
                errorPopupMessage: '',

                displayThreeDotsPopup: false,
                threeDotsPopupPostDetails: {},

                displayAboutAccountPopup: true,
                aboutAccountUsername: 'rishavry2',
                aboutAccountUserId: 2,
                aboutAccountUserIsVerified: true,
                aboutAccountUserHasStories: false,
                aboutAccountUserHasUnseenStory: false,
                aboutAccountUserProfilePhoto: null,

                displayCommentsPopup: false,

                displayStoryViewer: false,
                storyViewerUsername: '',
                storyViewerIsFromStoriesSection: false,

                usersAndTheirRelevantInfo: {},

                orderedListOfPosts: [],
            }
        },


        mounted() {
            this.originalURL = window.location.href;
        },


        methods: {
            async authenticateUser(username, userId) {
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
                            })
                        });
                        if (!response.ok) {
                            this.authUser = 'Anonymous Guest';

                            throw new (
                                `The laravelBackend1 server had trouble getting the user-id of username ${username}`
                            );
                        }
                        userId = await response.json();
                        this.authUserId = userId;
                    }
                    catch {
                        this.authUser = 'Anonymous Guest';

                        throw new Error(
                            `There was trouble connecting to the laravelBackend1 server to get the user-id of username
                            ${username}`
                        );
                    }
                }
                else {
                    this.authUserId = userId;
                }

                try {
                    const response1 = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser
                    /${userId}`, {
                        credentials: 'include'
                    });
                    if (!response1.ok) {
                        this.authUser = 'Anonymous Guest';
                        this.authUserId = -1;

                        throw new Error(
                            `The expressJSBackend1 server had trouble verifying you as having the proper credentials to be 
                            logged in as user ${userId}`
                        );
                    }

                    this.authUser = username;
                }
                catch {
                    this.authUser = 'Anonymous Guest';
                    this.authUserId = -1;

                    throw new Error(
                        `There was trouble connecting to the expressJSBackend1 server to verify you as having the proper
                        credentials to be logged in as user ${userId}`
                    );
                }
            },


            async fetchStories() {

            },


            async fetchSuggestedAccounts() {

            },


            async fetchPosts(initialOrAdditionalText) {
                initialOrAdditionalText;
            },


            hidePost() {
                this.orderedListOfPosts = this.orderedListOfPosts.filter(
                    postDetails => (postDetails.overallPostId !== this.threeDotsPopupPostDetails.overallPostId)
                );
                this.displayThreeDotsPopup = false;
                this.displayCommentsPopup = false;
            },


            showErrorPopup(newErrorPopupMessage) {
                this.errorPopupMessage = newErrorPopupMessage;
                this.displayErrorPopup = true;
            },

            
            showAboutAccountPopup(newAboutAccountUsername, newAboutAccountUserId) {
                this.aboutAccountUsername = newAboutAccountUsername;
                this.aboutAccountUserId = newAboutAccountUserId;

                this.aboutAccountUserIsVerified = 
                    newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
                    'isVerified' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
                    ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].isVerified
                    : false;

                this.aboutAccountUserHasStories = 
                    newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
                    'hasStories' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
                    ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].hasStories
                    : false;

                this.aboutAccountUserHasUnseenStory = 
                    newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
                    'hasUnseenStory' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
                    ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].hasUnseenStory
                    : false;

                this.aboutAccountUserProfilePhoto = 
                    newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
                    'profilePhoto' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
                    ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].profilePhoto
                    : defaultPfp;

                this.displayAboutAccountPopup = true;
            },


            showStoryViewer(newStoryViewerUsername, newStoryViewerIsFromStoriesSection) {
                this.storyViewerUsername = newStoryViewerUsername;
                this.storyViewerIsFromStoriesSection = newStoryViewerIsFromStoriesSection;
                this.displayStoryViewer = true;
            },


            toggleDisplayLeftSidebarPopup() {
                this.displayLeftSidebarPopup = !this.displayLeftSidebarPopup;
            },


            closeAllPopups() {
                this.displayLeftSidebarPopup = false;
                this.displayErrorPopup = false;
                this.displayThreeDotsPopup = false;
                this.displayAboutAccountPopup = false;
                this.displayCommentsPopup = false;
            },


            closeErrorPopup() {
                this.displayErrorPopup = false;
            },


            closeThreeDotsPopup() {
                this.displayThreeDotsPopup = false;
            },


            closeAboutAccountPopup() {
                this.displayAboutAccountPopup = false;
                this.displayThreeDotsPopup = false;
            },


            addRelevantInfoToUser(userId, userFieldsAndTheirValues) {
                if (!(userId in this.usersAndTheirRelevantInfo)) {
                    this.usersAndTheirRelevantInfo[userId] = {};
                }

                for(let field of Object.keys(userFieldsAndTheirValues)) {
                    this.usersAndTheirRelevantInfo[userId][field] = userFieldsAndTheirValues[field];
                }
            }
        },


        watch: {
            '$route.params': {
                immediate: true,
                handler(newRouteParams) {
                    this.numTimesRouteParamsWasWatched++;
                    if(this.numTimesRouteParamsWasWatched<2) {
                        return;
                    }

                    if (typeof newRouteParams.username !== 'undefined' && localStorage.getItem('defaultUsername') !==
                    newRouteParams.username) {
                        this.authenticateUser(newRouteParams.username, null);
                    }
                    else if (localStorage.getItem('defaultUsername')) {
                        if (localStorage.getItem('defaultUsername') === 'Anonymous Guest') {
                            this.authUser = 'Anonymous Guest';
                        }
                        else {
                            this.authenticateUser(
                                localStorage.getItem('defaultUsername'),
                                localStorage.getItem('defaultUserId')
                            );
                        }
                    }
                    else {
                        this.authUser = 'Anonymous Guest';
                    }
                }
            },


            authUser(newVal) {
                if (newVal.length > 0) {
                    localStorage.setItem('defaultUsername', newVal);
                    this.fetchStories();
                    this.fetchSuggestedAccounts();
                    this.fetchPosts('initial');
                }
            },


            authUserId(newVal) {
                localStorage.setItem('defaultUserId', newVal);
            }
        }
    }

</script>