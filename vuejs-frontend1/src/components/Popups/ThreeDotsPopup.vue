<template>
    <div v-if="postDetails.adInfo == null" class="popup" :style="{ height: '30em', width: '30em', borderRadius: '5%',
    display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <b @click="hidePost()" style="font-size: 1.1em; color: #ed6258; padding-bottom: 0.7em;
        padding-top: 1em; cursor: pointer;">
            Hide post
        </b>
  
        <hr style="width: 99%; border-top: 1px solid lightgray" />
  
        <b @click="toggleFollowUser" :style="{ fontSize: '1.1em', color: toggleFollowText === 'Follow' ? '#3db0fc' : '#ed6258',
        paddingBottom: '0.7em', paddingTop: '0.7em', cursor: 'pointer' }">
            {{ toggleFollowText }}
        </b>
    
        <hr style="width: 99%; border-top: 1px solid lightgray" />
  
        <b @click="markPostAsNotInterested" style="font-size: 1.1em; color: #ed6258; padding-bottom: 0.7em; padding-top: 0.7em;
        cursor: pointer;">
            Not Interested
        </b>
    
        <hr style="width: 99%; border-top: 1px solid lightgray" />
    
        <p @click="visitPostLink" style="font-size: 1.1em; cursor: pointer;">
            Go to post
        </p>
    
        <hr style="width: 99%; border-top: 1px solid lightgray" />
    
        <p @click="copyPostLinkToClipboard" style="font-size: 1.1em; cursor: pointer;">
            {{ copyLinkText }}
        </p>
    
        <hr style="width: 99%; border-top: 1px solid lightgray" />
    
        <p @click="showAboutAccountPopup(postDetails.authors[0], postDetails.authorIds[0])" style="font-size: 1.1em; cursor:
        pointer;">
            About this account
        </p>
    
        <hr style="width: 99%; border-top: 1px solid lightgray" />
    
        <p @click="closePopup" style="font-size: 1.1em; cursor: pointer;">
            Cancel
        </p>
    </div>
  
    <div v-else class="popup" :style="{ height: '17em', width: '30em', borderRadius: '5%', display: 'flex', flexDirection:
    'column', alignItems: 'center' }">
        <b @click="hidePost()" style="font-size: 1.1em; color: #ed6258; padding-bottom: 0.7em;
        padding-top: 1em; cursor: pointer;">
            Hide ad
        </b>
        
        <hr style="width: 99%; border-top: 1px solid lightgray" />

        <b @click="markPostAsNotInterested" style="font-size: 1.1em; color: #ed6258; padding-bottom: 0.7em; padding-top: 0.7em;
        cursor: pointer;">
            Not Interested
        </b>

        <hr style="width: 99%; border-top: 1px solid lightgray" />
        
        <p @click="visitAdLink" style="font-size: 1.1em; cursor: pointer;">
            Visit ad-link
        </p>

        <hr style="width: 99%; border-top: 1px solid lightgray" />

        <p @click="closePopup" style="font-size: 1.1em; cursor: pointer;">
            Cancel
        </p>
    </div>
</template>
  

<script setup>
    import { defineProps, ref } from 'vue';

    const props = defineProps({
        authUserId: Number,
            
        postDetails: Object,

        hidePost: Function,
        showAboutAccountPopup: Function,
        closePopup: Function,
        showErrorPopup: Function
    });

    const copyLinkText = ref('Copy link');
    const toggleFollowText = ref('Unfollow');


    function copyPostLinkToClipboard() {
        navigator.clipboard.writeText(
            `http://34.111.89.101/posts/${props.postDetails.overallPostId}`
        )
        .then(() => {
            copyLinkText.value = 'Copied';
            setTimeout(() => {
                copyLinkText.value = 'Copy link';
            }, 550);
        })
        .catch(_ => {
            _;
            copyLinkText.value = 'Failed to copy'
            setTimeout(() => {
                copyLinkText.value = 'Copy link';
            }, 550);
        });
    }


    function visitPostLink() {
        window.open(`http://34.111.89.101/posts/${props.postDetails.overallPostId}`, '_blank');
    }


    function visitAdLink() {
        window.open(props.postDetails.adInfo.link, '_blank');
    }


    async function toggleFollowUser() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        const usernameToToggleFollow = props.postDetails.authors[0];
        const userIdToToggleFollow = props.postDetails.authorIds[0];

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
                    `The server had trouble toggling your follow-status of ${usernameToToggleFollow}`
                );
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
            ${usernameToToggleFollow}`);
        }
    }


    async function markPostAsNotInterested() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        //for sake of simplicity, the code for this method has been omitted
        props.closePopup();
    }
</script>