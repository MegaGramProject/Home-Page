<template>
    <div style="display: flex; width: 100%; align-items: start; position: relative;"
    @mouseenter="setDisplayAccountPreviewToTrue" @mouseleave="setDisplayAccountPreviewToFalse">
        <a :href="`http://34.111.89.101/profile/${username}`" target="_blank" rel="noopener noreferrer">
            <img :src="userPfp" style="height: 2.5em; width: 2.5em; object-fit: contain; cursor: pointer" />
        </a>
  
        <div style="display: flex; flex-direction: column; align-items: start; margin-left: 0.7em">
            <div style="display: flex; align-items: center">
                <a :href="`http://34.111.89.101/profile/${username}`" @mouseenter="setDisplayAccountPreviewToTrue"
                @mouseleave="setDisplayAccountPreviewToFalse" style="font-size: 0.85em; cursor: pointer; max-width: 8em;
                overflow-wrap: break-word; text-align: start; font-weight: bold" target="_blank" rel="noopener
                noreferrer">
                    {{ username }}
                </a>

                <img v-if="userIsVerified" :src="verifiedBlueCheck" style="pointer-events: none; height: 1.5em; width:
                1.5em; object-fit: contain" />
            </div>

            <p style="font-size: 0.7em; margin-top: 0.1em; color: #787878; max-width: 10em; overflow-wrap: break-word;
            text-align: start">
                {{ userFullName }}
            </p>
        </div>
  
        <p @click="userId == authUserId ? takeUserToLogin() : toggleFollowUser()"
        :style="{ color: toggleFollowText === 'Follow' ? '#348feb' : 'gray', cursor: 'pointer', fontSize: '0.85em',
        fontWeight: 'bold', position: 'absolute', right: '0%', top: '0%' }">
            {{ userId == authUserId ? 'Switch' : toggleFollowText }}
        </p>
  
        <div v-if="userId != authUserId && displayAccountPreview" style="position: absolute; top: 36%; left: -2%">
            <AccountPreview
                :username="username"
                :userPfp="userPfp"
                :userFullName="userFullName"
                :toggleFollowText="toggleFollowText"
                :authUserId="authUserId"
                :userId="userId"
                :numPosts="numPosts"
                :numFollowers="numFollowers"
                :numFollowings="numFollowings"
                :userIsPrivate="userIsPrivate"
                :userIsVerified="userIsVerified"
                :updateFollowText="updateFollowTextFromAccountPreview"
                :showErrorPopup="showErrorPopup"
            />
        </div>
    </div>
</template>


<script setup>
    import AccountPreview from './AccountPreview.vue';

    import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

    import { defineProps, ref } from 'vue';
    
    
    const props = defineProps({
        username: String,
        userFullName: String,
        userPfp: String,

        authUserId: Number,
        userId: Number,
        numFollowers: Number,
        numFollowings: Number,
        numPosts: Number,

        userIsPrivate: Boolean,
        userIsVerified: Boolean,

        showErrorPopup: Function
    });

    const toggleFollowText = ref('Follow');

    const displayAccountPreview = ref(false);


    function takeUserToLogin() {
        window.open('http://34.111.89.101/login', '_blank');
    }


    function setDisplayAccountPreviewToTrue() {
        displayAccountPreview.value = true;
    }


    function setDisplayAccountPreviewToFalse() {
        displayAccountPreview.value = false;
    }


    function updateFollowTextFromAccountPreview(newToggleFollowText) {
        toggleFollowText.value = newToggleFollowText;
    }


    async function toggleFollowUser() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        const usernameToToggleFollow = props.username;
        const userIdToToggleFollow = props.userId;

        try {
            const response = await fetch('http://34.111.89.101/api/Home-Page/djangoBackend2/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `query toggleFollowUser($authUserId: Int!, $userIdToToggleFollow: Int!) {
                        toggleFollowUser(authUserId: $authUserId, userIdToToggleFollow: $userIdToToggleFollow)
                    }`,
                    variables: {
                        authUserId: props.authUserId,
                        userIdToToggleFollow: userIdToToggleFollow
                    }
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                props.showErrorPopup(
                `The server had trouble toggling your follow-status of user ${usernameToToggleFollow}`);
            }
            else {
                let newFollowingStatus = await response.json();
                newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                if (newFollowingStatus==='Stranger') {
                    toggleFollowText.value = 'Follow'
                }
                else if(newFollowingStatus==='Following') {
                    toggleFollowText.value = 'Unfollow';
                }
                else {
                    toggleFollowText.value = 'Cancel Request';
                }
            }
        }
        catch (error) {
            props.showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of
            user ${usernameToToggleFollow}`);
        }
    }
</script>