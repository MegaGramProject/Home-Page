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
            :userId="userId"
            :username="username"
            :authUsername="authUsername"
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
  

<script setup>
    import UserIcon from '../UserIcon';

    import accountBasedInIcon from '../../assets/images/accountBasedIn.png';
import dateJoinedIcon from '../../assets/images/dateJoined.png';
import verifiedBlueCheck from '../../assets/images/verifiedBlueCheck.png';

    import { defineProps, ref, watch } from 'vue';

    
    const props = defineProps({
        authUserId: Number,
        userId: Number,

        username: String,
        authUsername:String,
        userPfp: String,

        userIsVerified: Boolean,
        userHasStories: Boolean,
        userHasUnseenStory: Boolean,

        usersAndTheirRelevantInfo: Object,

        addRelevantInfoToUser: Function,
        closePopup: Function,
        showStoryViewer: Function
    });

    const dateJoinedText = ref('');
    const accountBasedInText = ref('');


    async function fetchRelevantDataForTheAccount() {
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
                        authUserId: props.authUserId,
                        userId: props.userId
                    }
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                dateJoinedText.value = 'The server had trouble getting the date when this user joined Megagram';
                accountBasedInText.value = 'The server had trouble getting where this user is based in';
            }
            else {
                let relevantUserInfo = await response.json();
                relevantUserInfo = relevantUserInfo.data.getDateJoinedAndAccountBasedInOfUser;
                dateJoinedText.value = formatDateString(relevantUserInfo[0]);
                accountBasedInText.value = relevantUserInfo[1];

                props.addRelevantInfoToUser(props.userId, {
                    dateJoined: dateJoinedText.value,
                    accountBasedIn: accountBasedInText.value
                });
            }
        }
        catch {
            dateJoinedText.value = 'There was trouble connecting to server to get the date when this user joined Megagram';
            accountBasedInText.value = 'There as trouble connecting to server to get where this user is based in';
        }
    }


    function formatDateString(dateString) {
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
    }


    function takeToUsersProfile() {
        window.open(`http://34.111.89.101/profile/${props.username}`, '_blank');
    }


    watch(props.userId, (newUserId) => {
        if (newUserId in props.usersAndTheirRelevantInfo && 'dateJoined' in props.usersAndTheirRelevantInfo[newUserId]
        && 'accountBasedIn' in props.usersAndTheirRelevantInfo[newUserId]) {
            dateJoinedText.value = props.usersAndTheirRelevantInfo[newUserId].dateJoined;
            accountBasedInText.value = props.usersAndTheirRelevantInfo[newUserId].accountBasedIn;
        }
        else {
            fetchRelevantDataForTheAccount();
        }
    });
</script>