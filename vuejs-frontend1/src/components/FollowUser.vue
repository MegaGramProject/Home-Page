<template>
    <div class="selectUserOrGroupChat" :style="{width: '95%', display: 'flex', alignItems: 'center', justifyContent:
    'space-between', boxShadow: 'none', padding: '0.5em 1em'}">
        <div :style="{ display: 'flex', alignItems: 'start' }">
            <a :href="'http://34.111.89.101/profile/' + username" target="_blank" rel="noopener noreferrer">
                <img :src="userPfp" :style="{objectFit: 'contain', height: '3em', width: '3em', cursor: 'pointer'}" />
            </a>

            <div :style="{display: 'flex', flexDirection: 'column', alignItems: 'start', marginLeft: '1em'}">
                <div :style="{ display: 'flex', alignItems: 'center' }">
                    <b :style="{maxWidth: '10em', overflowWrap: 'break-word', cursor: 'pointer', textAlign: 'start',
                    fontWeight: 'bold'}">
                        {{ username }}
                    </b>
                    <img v-if="userIsVerified" :src="verifiedBlueCheck" :style="{pointerEvents: 'none', height: '1.5em',
                    width: '1.5em', objectFit: 'contain'}"/>
                </div>

                <p :style="{maxWidth: '10em', overflowWrap: 'break-word', color: 'gray', marginTop: '0.5em', textAlign: 'start'}">
                    {{ userFullName === '?' ? 'Could not get full name' : userFullName }}
                </p>
            </div>
        </div>
    
        <button @click="toggleFollowUser" :style="{backgroundColor: toggleFollowText !== 'Follow' ? '#f5f5f5' : '#1f86ed',
        color: toggleFollowText !== 'Follow' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', borderStyle: 'none',
        width: '10em', borderRadius: '0.5em', paddingLeft: '0.5em', paddingBottom: '0.5em', paddingTop: '0.5em'}">
            {{ toggleFollowText }}
        </button>
    </div>
</template>
  


<script>
    import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';


    export default {
        props: {
            authUserId: Number,
            userId: Number,

            username: String,
            userFullName: String,
            userPfp: String,
            originalFollowText: String,

            userIsVerified: Boolean,

            showErrorPopup: Function
        },


        data() {
            return {
                verifiedBlueCheck,

                toggleFollowText: ''
            }
        },


        mounted() {
            this.toggleFollowText = this.originalFollowText;
        },


        methods: {
            async toggleFollowUser() {
                if (this.authUserId === -1) {
                    this.showErrorPopup(`You cannot toggle your follow-status of user ${this.username} when you are on 'Anonymous
                    Guest' mode`);
                    return;
                }

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
                                userIdToToggleFollow: this.userId
                            }
                        }),
                        credentials: 'include'
                    });
                    if(!response.ok) {
                        this.showErrorPopup(`The server had trouble toggling your follow-status of user ${this.username}`);
                    }
                    else {
                        let newFollowingStatus = await response.json();
                        newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                        if(newFollowingStatus === 'Stranger') {
                            newFollowingStatus = 'Follow';
                        }
                        this.toggleFollowText = newFollowingStatus;
                    }
                }

                catch (error) {
                    this.showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of user
                    ${this.username}`);
                }
            }
        }
    };
</script>