<template>
    <div style="display: flex; justify-content: space-between; align-items: start; width: 100%;">
        <LeftSidebar
            :profilePhoto="defaultPfp"
            :displayPopup="displayLeftSidebarPopup"
            :authUserIsAnonymousGuest="authUserId == -1"
            :toggleDisplayPopup="toggleDisplayLeftSidebarPopup"
        />
    </div>

    <img v-if="displayLeftSidebarPopup || displayErrorPopup" @click="closeAllPopups" :src="blackScreen" style="position: fixed;
    top: 0%; left: 0%; width: 100%; height: 100%; opacity: 0.7; zIndex: 2;"/>

    <div v-if="displayLeftSidebarPopup" :style="[
        { position: 'fixed', bottom: '10%', left: '1%' },
        { zIndex: displayErrorPopup ? '1' : '3' }
    ]">
        <LeftSidebarPopup
            :authUserId="authUserId"
            :originalURL="originalURL"
            :notifyParentToShowErrorPopup="showErrorPopup"
        />
    </div>


</template>


<script>
    import blackScreen from '@/assets/images/blackScreen.png';
import defaultPfp from '@/assets/images/defaultPfp.png';

    import LeftSidebar from '@/components/LeftSidebar.vue';
import LeftSidebarPopup from '@/components/LeftSidebarPopup.vue';

    import '../assets/HomePageStyles.css';


    export default {
        components: {
            LeftSidebar,
            LeftSidebarPopup
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

                errorPopupMessage: '',
                displayErrorPopup: false,
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
                    /${userId}`);
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


            toggleDisplayLeftSidebarPopup() {
                this.displayLeftSidebarPopup = !this.displayLeftSidebarPopup;
            },

            
            closeAllPopups() {
                this.displayLeftSidebarPopup = false;
                this.displayErrorPopup = false;
            },


            showErrorPopup(newErrorPopupMessage) {
                this.errorPopupMessage = newErrorPopupMessage;
                this.displayErrorPopup = true;
            },


            closeErrorPopup() {
                this.displayErrorPopup = false;
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

                    if(typeof newRouteParams.username !== 'undefined' && localStorage.getItem('defaultUsername') !==
                    newRouteParams.username) {
                        this.authenticateUser(newRouteParams.username, null);
                    }
                    else if(localStorage.getItem('defaultUsername')) {
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