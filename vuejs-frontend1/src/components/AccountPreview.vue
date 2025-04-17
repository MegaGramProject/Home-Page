<template>
    <div class="popup" :style="{width:'22em', position:'absolute', padding: '1.5em 1.5em', borderRadius:'2%',
    zIndex: '10'}">
        <div :style="{display:'flex', justifyContent:'start', alignItems:'start'}">
            <a :href="'http://34.111.89.101/profile/' + username" target="_blank" rel="noopener noreferrer">
                <img :src="userPfp" :style="{width:'3em', height:'3em', cursor: 'pointer'}"/>
            </a>
  
            <div :style="{display:'flex', flexDirection:'column', marginLeft:'0.7em',
            alignItems: 'start'}">
                <div :style="{display: 'flex', alignItems: 'center'}">
                    <a :href="'http://34.111.89.101/profile/' + username" :style="{fontSize:'0.85em', cursor:'pointer',
                    maxWidth: '10em', overflowWrap:'break-word', fontWeight: 'bold', textAlign: 'start'}"
                    target="_blank" rel="noopener noreferrer">
                        {{ username }}
                    </a>
  
                    <img v-if="userIsVerified" :src="verifiedBlueCheck" :style="{pointerEvents: 'none', height: '1.5em',
                    width: '1.5em', objectFit: 'contain'}"/>
                </div>
    
                <p :style="{fontSize:'0.8em', color:'#787878', maxWidth: '12em', overflowWrap:'break-word', textAlign:
                'start'}">
                    {{ userFullName === '?' ? 'Could not get full name' : userFullName }}
                </p>
            </div>
        </div>
  
        <div :style="{display:'flex', width: '100%', justifyContent: 'space-between',
        alignItems: 'end', marginTop: '1em'}">
            <div :style="{display: 'flex', flexDirection: 'column', alignItems: 'center'}">
                <b :style="{maxWidth: '3em', overflowWrap: 'break-word', marginBottom: '-1em'}">
                    {{ formatNumber(numPosts) }}
                </b>
                <p>posts</p>
            </div>
            <div :style="{display: 'flex', flexDirection: 'column', alignItems: 'center'}">
                <b :style="{maxWidth: '3em', overflowWrap: 'break-word', marginBottom: '-1em'}">
                    {{ formatNumber(numFollowers) }}
                </b>
                <p>followers</p>
            </div>
            <div :style="{display: 'flex', flexDirection: 'column', alignItems: 'center'}">
                <b :style="{maxWidth: '3em', overflowWrap: 'break-word', marginBottom: '-1em'}">
                    {{ formatNumber(numFollowings) }}
                </b>
                <p>following</p>
            </div>
        </div>
  
        <br/>
        <br/>
  
        <div v-if="userIsPrivate==true" :style="{display:'flex', flexDirection: 'column', alignItems: 'center'}">
            <img :src="privateAccount" :style="{height:'7em', width:'7em', objectFit:'contain', pointerEvents: 'none'}"/>
            <b>
                This account is private
            </b>
            <p :style="{color:'gray', fontSize:'0.8em', marginTop:'0.1em'}">
                Follow them to see their photos and videos.
            </p>
        </div>
  
        <a v-if="userIsPrivate==false || userIsPrivate === '?'" :href="'http://34.111.89.101/profile/' + username"
        :style="{fontSize: '0.84em', color: '#666666', cursor: 'pointer'}" target="_blank" rel="noopener noreferrer">
            Click here to visit this user's profile.
        </a>
  
        <br/>
        <br/>
  
        <button @click="toggleFollowUser" class="blueButton" :style="{width:'107%', backgroundColor: toggleFollowText ===
        'Follow' ? '#327bf0' : '#f5f5f5', color: toggleFollowText === 'Follow' ? '' : 'black', cursor:'pointer',
        marginLeft: '-0.8em'}">
            {{ toggleFollowText }}
        </button>
    </div>
</template>


<script setup>
    import privateAccount from "../assets/images/privateAccount.png";
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

    import { defineProps, toRefs } from 'vue';


    const props = defineProps({
        username: String,
        userPfp: String,
        userFullName: String,
        toggleFollowText: String,

        authUserId: Number,
        userId: Number,
        numPosts: Number,
        numFollowers: Number,
        numFollowings: Number,

        userIsVerified: Boolean,
        
        userIsPrivate: Object,

        updateFollowText: Function,
        showErrorPopup: Function
    });

    const { username, userPfp, userFullName, toggleFollowText, authUserId, userId, numPosts, numFollowers, numFollowings,
    userIsVerified, userIsPrivate, updateFollowText, showErrorPopup } = toRefs(props);


    function formatNumber(number) {
        if(number==='?') {
            return '?';
        }
        else if (number < 10000) {
            return number.toLocaleString();
        }
        else if (number >= 10000 && number < 1000000) {
            return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        else if (number >= 1000000 && number < 1000000000) {
            return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        else if (number >= 1000000000 && number < 1000000000000) {
            return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        }
        else {
            return (number / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
        }
    }


    async function toggleFollowUser() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        const usernameToToggleFollow = username;
        const userIdToToggleFollow = userId;

        try {
            const response = await fetch('http://34.111.89.101/api/Home-Page/djangoBackend2/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `query toggleFollowUser($authUserId: Int!, $userIdToToggleFollow: Int!) {
                        toggleFollowUser(authUserId: $authUserId, userIdToToggleFollow: $userIdToToggleFollow)
                    }`,
                    variables: {
                        authUserId: authUserId,
                        userIdToToggleFollow: userIdToToggleFollow
                    }
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                showErrorPopup(
                    `The server had trouble toggling your follow-status of user ${usernameToToggleFollow}`
                );
            }
            else {
                let newFollowingStatus = await response.json();
                newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                if (newFollowingStatus==='Stranger') {
                    updateFollowText('Follow');
                }
                else if(newFollowingStatus==='Following') {
                    updateFollowText('Unfollow');
                }
                else {
                    updateFollowText('Cancel Request');
                }
            }
        }
        catch (error) {
            showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of
            user ${usernameToToggleFollow}`);
        }
    }
</script>