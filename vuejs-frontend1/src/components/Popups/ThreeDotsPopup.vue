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
  


<script>
    export default {
        props: {
            authUserId: Number,
            postDetails: Object,

            hidePost: Function,
            showAboutAccountPopup: Function,
            closePopup: Function,
            showErrorPopup: Function
        },


        data() {
            return {
                copyLinkText: 'Copy link',
                toggleFollowText: 'Unfollow'
            }
        },


        methods: {
            copyPostLinkToClipboard() {
                navigator.clipboard.writeText(
                    `http://34.111.89.101/posts/${this.postDetails.overallPostId}`
                )
                .then(() => {
                    this.copyLinkText = 'Copied';
                    setTimeout(() => {
                        this.copyLinkText = 'Copy link';
                    }, 550);
                })
                .catch(_ => {
                    _;
                    this.copyLinkText = 'Failed to copy'
                    setTimeout(() => {
                        this.copyLinkText = 'Copy link';
                    }, 550);
                });
            },


            visitPostLink() {
                window.open(`http://34.111.89.101/posts/${this.postDetails.overallPostId}`, '_blank');
            },


            visitAdLink() {
                window.open(this.postDetails.adInfo.link, '_blank');
            },


            async toggleFollowUser() {
                if (this.authUserId == -1) {
                    this.showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
                    return;
                }

                const usernameToToggleFollow = this.postDetails.authors[0];
                const userIdToToggleFollow = this.postDetails.authorIds[0];

                try {
                    const response = await fetch('http://34.111.89.101/api/Home-Page/djangoBackend2/graphql', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            query: `query toggleFollowUser($authUserId: Int!, $userIdToToggleFollow: Int!) {
                                toggleFollowUser(authUserId: $authUserId, userIdToToggleFollow: $userIdToToggleFollow)
                            }`,
                            variables: {
                                authUserId: this.authUserId,
                                userIdToToggleFollow: userIdToToggleFollow
                            }
                        }),
                        credentials: 'include'
                    });
                    if(!response.ok) {
                        this.showErrorPopup(
                        `The server had trouble toggling your follow-status of ${usernameToToggleFollow}`);
                    }
                    else {
                        let newFollowingStatus = await response.json();
                        newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                        if (newFollowingStatus==='Stranger') {
                            this.toggleFollowText = 'Follow'
                        }
                        else if(newFollowingStatus==='Following') {
                            this.toggleFollowText = 'Unfollow';
                        }
                        else {
                            this.toggleFollowText = 'Cancel Request';
                        }
                    }
                }
                catch (error) {
                    this.showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of
                    ${usernameToToggleFollow}`);
                }
            },


            async markPostAsNotInterested() {
                if (this.authUserId == -1) {
                    this.showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
                    return;
                }

                //for sake of simplicity, the code for this method has been omitted
                this.closePopup();
            }
        }
    }
</script>