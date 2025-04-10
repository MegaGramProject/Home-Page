<template>
    <div class="popup" :style="{backgroundColor:'white', borderRadius:'1.5%', display:'flex', flexDirection:'column',
    alignItems:'center', width:'40em', height: '40em', overflowY: 'scroll', position: 'relative'}">
  
        <div :style="{width: '100%', borderStyle: 'solid', borderColor: 'lightgray', borderWidth: '0.08em', borderTop: 'none',
        borderLeft: 'none', borderRight: 'none', paddingTop: '1em', paddingBottom: '1em'}">
            <b :style="{fontSize:'1.2em'}">
                About this account
            </b>
        </div>
  
        <br />
    
        <UserIcon
            :username="username"
            :authUser="authUser"
            :inStoriesSection="false"
            :hasStories="userHasStories"
            :hasUnseenStory="userHasUnseenStory"
            :profilePhoto="userPfp"
            :isVerified="userIsVerified"
            :showStoryViewer="showStoryViewer"
        />

        <div :style="{display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: '1em'}">
            <b @click="username.length > 0 ? takeToUsersProfile : null"
            :style="{maxWidth: '10em', overflowWrap: 'break-word', cursor: 'pointer'}">
                {{ username }}
            </b>

            <img v-if="userIsVerified" :src="verifiedBlueCheck" :style="{pointerEvents: 'none', height: '1.5em', width: '1.5em',
            objectFit: 'contain'}" />
        </div>
  
        <br />
    
        <p :style="{width:'85%', color:'#616161', fontSize:'0.95em'}">
            To help keep our community authentic, we’re showing information about accounts on Megagram.
        </p>
    
        <br />
  
        <div :style="{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65em', overflowY: 'scroll',
        width: '100%', height: '48%'}">
            <div :style="{display:'flex', gap:'0.7em', marginLeft: '-2em'}">
                <img class="iconToBeAdjustedForDarkMode" :src="dateJoinedIcon"
                :style="{height:'2.9em', width:'2.9em', objectFit:'contain', pointerEvents:'none'}" />
                <div :style="{display:'flex', flexDirection:'column', alignItems:'start'}">
                    <b>Date Joined</b>
                    <p :style="{color:'gray', marginTop:'0.1em', maxWidth: '25em', overflowWrap:'break-word', textAlign: 'start'}">
                        {{ dateJoinedText }}  
                    </p>
                </div>
            </div>
    
            <div :style="{display:'flex', gap:'0.5em', marginLeft: '-2em'}">
                <img class="iconToBeAdjustedForDarkMode" :src="accountBasedInIcon"
                :style="{height:'2.9em', width:'2.9em', objectFit:'contain', pointerEvents:'none'}" />
                <div :style="{display:'flex', flexDirection:'column', alignItems:'start'}">
                    <b>Account Based In</b>
                    <p :style="{color:'gray', marginTop:'0.1em', maxWidth: '25em', overflowWrap:'break-word', textAlign: 'start'}">
                        {{ accountBasedInText }}
                    </p>
                </div>
            </div>
        </div>
  
        <div id="closeAboutAccountSection" :style="{width:'100%', borderStyle: 'solid', borderColor: 'lightgray',
        borderWidth:'0.08em', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', position: 'fixed', bottom: '0%',
        backgroundColor: 'white'}">
            <p @click="closePopup" :style="{cursor:'pointer'}">
                Close
            </p>
        </div>
    </div>
</template>
  

<script>
    import UserIcon from '../UserIcon';

    import accountBasedInIcon from '../../assets/images/accountBasedIn.png';
    import dateJoinedIcon from '../../assets/images/dateJoined.png';
    import verifiedBlueCheck from '../../assets/images/verifiedBlueCheck.png';


    export default {
        props: {
            authUserId: Number,
            userId: Number,

            username: String,
            authUser:String,
            userPfp: String,

            userIsVerified: Boolean,
            userHasStories: Boolean,
            userHasUnseenStory: Boolean,

            usersAndTheirRelevantInfo: Object,

            addRelevantInfoToUser: Function,
            closePopup: Function,
            showStoryViewer: Function
        },

        
        components: {
            UserIcon
        },


        data() {
            return {
                accountBasedInIcon,
                dateJoinedIcon,
                verifiedBlueCheck,

                dateJoinedText: '',
                accountBasedInText: ''
            }
        },


        methods: {
            async fetchRelevantDataForTheAccount() {
                try {
                    const response = await fetch(
                    'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            query: `query getDateJoinedAndAccountBasedInOfUser($authUserId: Int!, $userId: Int!) {
                                getDateJoinedAndAccountBasedInOfUser(authUserId: $authUserId, userId: $userId)
                            }`,
                            variables: {
                                authUserId: this.authUserId,
                                userId: this.userId
                            }
                        }),
                        credentials: 'include'
                    });
                    if(!response.ok) {
                        this.dateJoinedText = 'The server had trouble getting the date when this user joined Megagram';
                        this.accountBasedInText = 'The server had trouble getting where this user is based in';
                    }
                    else {
                        let relevantUserInfo = await response.json();
                        relevantUserInfo = relevantUserInfo.data.getDateJoinedAndAccountBasedInOfUser;
                        this.dateJoinedText = this.formatDateString(relevantUserInfo[0]);
                        this.accountBasedInText = relevantUserInfo[1];

                        this.addRelevantInfoToUser(this.userId, {
                            dateJoined: this.dateJoinedText,
                            accountBasedIn: this.accountBasedInText
                        });
                    }
                }
                catch {
                    this.dateJoinedText = 'There was trouble connecting to server to get the date when this user joined Megagram';
                    this.accountBasedInText = 'There as trouble connecting to server to get where this user is based in';
                }
            },


            formatDateString(dateString) {
                if (dateString.includes("joined Megagram")) {
                    return dateString;
                }

                const date = new Date(dateString);
                
                const months = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];
                const month = months[date.getUTCMonth()];

                const day = date.getUTCDate();
                const year = date.getUTCFullYear();

                return `${month} ${day}, ${year}`;
            },


            takeToUsersProfile() {
                window.open(`http://34.111.89.101/profile/${this.username}`, '_blank');
            }
        },


        watch: {
            userId(newVal) {
                if (newVal in this.usersAndTheirRelevantInfo && 'dateJoined' in this.usersAndTheirRelevantInfo[newVal]
                && 'accountBasedIn' in this.usersAndTheirRelevantInfo[newVal]) {
                    this.dateJoinedText = this.usersAndTheirRelevantInfo[newVal].dateJoined;
                    this.accountBasedInText = this.usersAndTheirRelevantInfo[newVal].accountBasedIn;
                }
                else {
                    this.fetchRelevantDataForTheAccount();
                }
            }
        }
    }
</script>