<template>
    <div class="popup" :style="{borderRadius:'2%', width:'35em', height:'35em', paddingTop:'1em', position: 'relative'}">
        <b>Share</b>

        <img @click="closePopup" :src="thinGrayXIcon" :style="{objectFit:'contain', height:'1.7em', width:'1.6em', position:'absolute', 
        left:'90%', top: '2%', cursor:'pointer'}" />

        <hr :style="{width: '99%', borderTop: '0.1px solid lightgray', marginTop: '1.2em'}" />

        <div :style="{display:'flex',  paddingLeft:'1em', alignItems:'center'}">
            <b>To:</b>
            <input type="text" :value="inputText" @input="fetchUsersToSendPostToGivenTextInput" placeholder="Search..."
            :style="{width:'35em', marginLeft:'1em', fontSize:'0.9em', borderStyle:'none', outline: 'none'}"/>
        </div>

        <hr :style="{width: '99%', borderTop: '0.1px solid lightgray'}" />

        <div :style="{display:'flex', flexDirection:'column', alignItems:'start', height:'26em', overflow:'scroll', gap: '1em',
        position: 'relative', width: '99%'}">
            <template v-if="selectedUsersAndGroupChats.size > 0">
                <b :style="{marginLeft: '1em', marginTop: '1em', marginBottom: '1em'}">
                    Selected
                </b>

                <SelectUserOrGroupChat v-for="selectedUserOrGroupChat in selectedUsersAndGroupChats"
                    :key="getSpecificInfoOnSelectedUserOrGroupChat('key', selectedUserOrGroupChat)"
                    :groupChatId="getSpecificInfoOnSelectedUserOrGroupChat('groupChatId', selectedUserOrGroupChat)"
                    :userId="getSpecificInfoOnSelectedUserOrGroupChat('userId', selectedUserOrGroupChat)"
                    :userOrGroupChatName="getSpecificInfoOnSelectedUserOrGroupChat(
                        'userOrGroupChatName',
                        selectedUserOrGroupChat
                    )"
                    :fullName="getSpecificInfoOnSelectedUserOrGroupChat('fullName', selectedUserOrGroupChat)"
                    :profilePhoto="getSpecificInfoOnSelectedUserOrGroupChat('profilePhoto', selectedUserOrGroupChat)"
                    :isSelected="true"
                    :isVerified="getSpecificInfoOnSelectedUserOrGroupChat('isVerified', selectedUserOrGroupChat)"
                    :selectThisUserOrGroupChat="selectUserOrGroupChat"
                    :unselectThisUserOrGroupChat="unselectUserOrGroupChat"
                />
            </template>

            <b v-if="inputText.length === 0" :style="{marginLeft: '1em', marginTop: '1em', marginBottom: '1em'}">Suggested</b>

            <template v-if="errorMessage.length === 0">
                <SelectUserOrGroupChat v-for="suggestion in currentSuggestions.filter(
                    suggestion => {
                        const isGroupChatSelected = selectedUsersAndGroupChats.has(
                            `group-chat/${suggestion.groupChatId}/${suggestion.userOrGroupChatName}`
                        );
                        const isUserSelected = selectedUsersAndGroupChats.has(
                            `user/${suggestion.userId}/${suggestion.userOrGroupChatName}`
                        );
                    
                        return (!isGroupChatSelected && !isUserSelected);
                    }
                )"
                    :key="getSpecificInfoOnPostSendingSuggestion('key', suggestion)"
                    :groupChatId="getSpecificInfoOnPostSendingSuggestion('groupChatId', suggestion)"
                    :userId="getSpecificInfoOnPostSendingSuggestion('userId', suggestion)"
                    :userOrGroupChatName="getSpecificInfoOnPostSendingSuggestion(
                        'userOrGroupChatName',
                        suggestion
                    )"
                    :fullName="getSpecificInfoOnPostSendingSuggestion('fullName', suggestion)"
                    :profilePhoto="getSpecificInfoOnPostSendingSuggestion('profilePhoto', suggestion)"
                    :isSelected="false"
                    :isVerified="getSpecificInfoOnPostSendingSuggestion('isVerified', suggestion)"
                    :selectThisUserOrGroupChat="selectUserOrGroupChat"
                    :unselectThisUserOrGroupChat="unselectUserOrGroupChat"
                />
            </template>

            <p v-if="errorMessage.length > 0" :style="{maxWidth: '90%', overflowWrap: 'break-word', color: 'gray', fontSize:
            '0.88em', textAlign:'start', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}">
                {{ errorMessage }}
            </p>

            <img v-if="statusOfFetchingResults === 'Loading...'" :src="loadingAnimation" :style="{height: '2.75em', width: '2.75em',
            objectFit: 'contain', pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%', transform:
            'translate(-50%, -50%)'}"/>
        </div>

        <button v-if="selectedUsersAndGroupChats.size === 0" class="blueButton" :style="{width:'42em'}">
            Send
        </button>

        <button v-if="statusOfSendingPost !== 'Loading...' && selectedUsersAndGroupChats.size === 1" @click="() =>
        sendPost('individually')" class="blueButton" :style="{width:'42em', cursor:'pointer', backgroundColor:'#347aeb'}">
            Send
        </button>

        <div v-if="statusOfSendingPost !== 'Loading...' && selectedUsersAndGroupChats.size > 1" :style="{display: 'flex', gap: '1em',
        alignItems: 'center', justifyContent: 'center', width: '100%'}">
            <button @click="() => sendPost('individually')" class="blueButton" :style="{width:'19em', cursor:'pointer', 
            backgroundColor:'#347aeb'}">
                Send Individually
            </button>
            <button @click="() => sendPost('as a group')" class="blueButton" :style="{width:'19em', cursor:'pointer',
            backgroundColor:'#347aeb'}">
                Send in Group-Chat
            </button>
        </div>

        <img v-if="statusOfSendingPost === 'Loading...'" :src="loadingAnimation" :style="{height: '100%', width: '2.75em',
        objectFit: 'contain', pointerEvents: 'none', position: 'absolute', top: '85%', left: '50%', transform:
        'translate(-50%, -50%)'}"/>

        <p v-if="statusOfSendingPost === 'Sent'" :style="{position: 'absolute', top: '85%', left: '50%', transform:
        'translate(-50%, -50%)', color: 'white', backgroundColor: 'black', padding: '0.4em 0.8em', borderRadius: '0.3em'}">
            Sent
        </p>
    </div>
</template>
  

<script setup>
    import SelectUserOrGroupChat from '../SelectUserOrGroupChat.vue';

    import defaultGroupChatPfp from '../../assets/images/defaultGroupChatPfp.png';
import defaultPfp from '../../assets/images/defaultPfp.png';
import loadingAnimation from '../../assets/images/loadingAnimation.gif';
import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';

    import { defineProps, onMounted, ref } from 'vue';

    
    const props = defineProps({
        authUserId: Number,

        overallPostId: String, 

        usersAndTheirRelevantInfo: Object,
        cachedMessageSendingSuggestions: Object,

        closePopup: Function,
        showErrorPopup: Function,
        updateUsersAndTheirRelevantInfo: Function,
        updateCachedMessageSendingSuggestions: Function
    });

    
    onMounted(() => {
        fetchUsersToSendPostToGivenTextInput(null);
    });

    const inputText = ref('');
    const errorMessage = ref('');
    const statusOfFetchingResults = ref('');
    const statusOfSendingPost = ref('');

    const currentSuggestions = ref([]);

    const selectedUsersAndGroupChats = ref(new Set());


    async function fetchUsersToSendPostToGivenTextInput(event) {
        errorMessage.value = '';
        let newInputText = '';

        if(event!==null) {
            newInputText = event.target.value;
            inputText.value = newInputText;
        }

        if(newInputText in props.cachedMessageSendingSuggestions) {
            currentSuggestions.value = props.cachedMessageSendingSuggestions[newInputText];
            return;
        }

        statusOfFetchingResults.value = 'Loading...';

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/getMessageSendingSuggestions/${props.authUserId}
            /${newInputText}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                errorMessage.value = `The server had trouble getting the suggested accounts/group-chats for you to send
                this post to.`
            }
            else {
                const postSendingSuggestions = await response.json();
                currentSuggestions.value = postSendingSuggestions;

                const newCachedMessageSendingSuggestions = {...props.cachedMessageSendingSuggestions};
                newCachedMessageSendingSuggestions[newInputText] = postSendingSuggestions;
                props.updateCachedMessageSendingSuggestions(newCachedMessageSendingSuggestions);

                const idsOfSuggestedUsers = postSendingSuggestions
                .filter(
                    x => x.userId !== null
                )
                .map(
                    x => x.userId
                );

                const newUsersAndTheirRelevantInfo = await fetchAllTheRelevantUserInfo(idsOfSuggestedUsers);
                for(let suggestion of postSendingSuggestions) {
                    const userId = suggestion.userId;
                    if (userId !== null) {
                        const username = suggestion.userOrGroupChatName;

                        if (!(userId in newUsersAndTheirRelevantInfo)) {
                            newUsersAndTheirRelevantInfo[userId] = {};
                        }

                        newUsersAndTheirRelevantInfo[userId].username = username;
                    }
                }
                props.updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
            }
        }
        catch (error) {
            errorMessage.value = `There was trouble connecting to the server to get the suggested accounts/group-chats for
            you to send this post to.`;
        }
        finally {
            statusOfFetchingResults.value = '';
        }
    }


    async function fetchAllTheRelevantUserInfo(newSuggestedUserIds) {
        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirFullNames = {};
        const newSuggestedUserIdsNeededForFullNames = newSuggestedUserIds.filter(newSuggestedUserId => {
            if (!(newSuggestedUserId in props.usersAndTheirRelevantInfo) || !('fullName' in
            props.usersAndTheirRelevantInfo[newSuggestedUserId])) {
                return newSuggestedUserId;
            }
        });

        if (newSuggestedUserIdsNeededForFullNames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newSuggestedUserIdsNeededForFullNames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newSuggestedUserIdsNeededForFullNames) `;
            graphqlUserVariables.authUserId = props.authUserId;
            graphqlUserVariables.newSuggestedUserIdsNeededForFullNames = newSuggestedUserIdsNeededForFullNames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newSuggestedUserIdsNeededForVerificationStatuses = newSuggestedUserIds.filter(newSuggestedUserId => {
            if (!(newSuggestedUserId in props.usersAndTheirRelevantInfo) || !('isVerified' in
            props.usersAndTheirRelevantInfo[newSuggestedUserId])) {
                return newSuggestedUserId;
            }
        });
        if (newSuggestedUserIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newSuggestedUserIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newSuggestedUserIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = props.authUserId;
            graphqlUserVariables.newSuggestedUserIdsNeededForVerificationStatuses =
            newSuggestedUserIdsNeededForVerificationStatuses;
        }

        if (graphqlUserQueryString.length > 0) {
            let graphqlUserQueryStringHeader = 'query (';
            let graphqlUserQueryStringHeaderKeys = Object.keys(graphqlUserQueryStringHeaderInfo);

            for(let i=0; i<graphqlUserQueryStringHeaderKeys.length; i++) {
                const key = graphqlUserQueryStringHeaderKeys[i];
                const value = graphqlUserQueryStringHeaderInfo[key];

                if (i < graphqlUserQueryStringHeaderKeys.length-1) {
                    graphqlUserQueryStringHeader+= `${key}: ${value}, `;
                }
                else {
                    graphqlUserQueryStringHeader+= `${key}: ${value}`;
                }
            }

            graphqlUserQueryStringHeader+= '){ ';
            graphqlUserQueryString = graphqlUserQueryStringHeader + graphqlUserQueryString + '}';

            try {
                const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: graphqlUserQueryString,
                        variables: graphqlUserVariables
                    }),
                    credentials: 'include'
                });
                if (!response.ok) {
                    if (newSuggestedUserIdsNeededForFullNames.length > 0) {
                        console.error(
                            'The server had trouble fetching the full-names of all the newly fetched post-sending suggestions'
                        );
                    }

                    if (newSuggestedUserIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            'The server had trouble fetching the verification-statuses of all the new post-sending suggestions'
                        );
                    }
                }
                else {
                    const responseData = await response.json();
                    
                    if (newSuggestedUserIdsNeededForFullNames.length > 0) {
                        const listOfFullNamesFornewSuggestedUserIds = responseData.data.getListOfFullNamesForUserIds;

                        for(let i=0; i<newSuggestedUserIdsNeededForFullNames.length; i++) {
                            const newSuggestedUserId = newSuggestedUserIdsNeededForFullNames[i];
                            const newLikerFullName = listOfFullNamesFornewSuggestedUserIds[i];

                            if (newLikerFullName !== null) {
                                usersAndTheirFullNames[newSuggestedUserId] = newLikerFullName;
                            }
                        }
                    }

                    if (newSuggestedUserIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesFornewSuggestedUserIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newSuggestedUserIdsNeededForVerificationStatuses.length; i++) {
                            const newSuggestedUserId = newSuggestedUserIdsNeededForVerificationStatuses[i];
                            const newLikerVerificationStatus = listOfVerificationStatusesFornewSuggestedUserIds[i];

                            if (newLikerVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newSuggestedUserId] = newLikerVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newSuggestedUserIdsNeededForFullNames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the full-names of all the newly fetched
                        post-sending suggestions`
                    ); 
                }

                if (newSuggestedUserIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched post-sending suggestions`
                    );
                }
            }
        }

        let usersAndTheirPfps = {};
        const newSuggestedUserIdsNeededForPfps = newSuggestedUserIds.filter(newSuggestedUserId => {
            if (!(newSuggestedUserId in props.usersAndTheirRelevantInfo) || !('profilePhoto' in
            props.usersAndTheirRelevantInfo[newSuggestedUserId])) {
                return newSuggestedUserId;
            }
        });
        if (newSuggestedUserIdsNeededForPfps.length>0) {
            try {
                const response2 = await fetch(
                    'http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userIds: newSuggestedUserIdsNeededForPfps
                        })
                    });
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched post-sending suggestions'
                    );
                }
                else {
                    usersAndTheirPfps = await response2.json();
                }
            }
            catch {
                console.error(
                    `There was trouble connecting to the server to fetch the profile-photos of all the newly fetched post-
                    sending suggestions`
                );
            }
        }

        const newUsersAndTheirRelevantInfo = {...props.usersAndTheirRelevantInfo};

        for(let newSuggestedUserId of newSuggestedUserIds) {
            if (!(newSuggestedUserId in usersAndTheirFullNames) && !(newSuggestedUserId in usersAndTheirVerificationStatuses)
            && !(newSuggestedUserId in usersAndTheirPfps)) {
                continue;
            }

            if(!(newSuggestedUserId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[newSuggestedUserId] = {};
            }
            
            if (newSuggestedUserId in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[newSuggestedUserId].fullName = usersAndTheirFullNames[newSuggestedUserId];
            }
            if (newSuggestedUserId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[newSuggestedUserId].isVerified = usersAndTheirVerificationStatuses[newSuggestedUserId];
            }
            if (newSuggestedUserId in usersAndTheirPfps) {
                newUsersAndTheirRelevantInfo[newSuggestedUserId].profilePhoto = usersAndTheirPfps[newSuggestedUserId];
            }
        }
        return newUsersAndTheirRelevantInfo;
    }


    function selectUserOrGroupChat(userOrGroupChatToBeSelected) {
        selectedUsersAndGroupChats.value.add(userOrGroupChatToBeSelected);
    }


    function unselectUserOrGroupChat(userOrGroupChatToBeUnselected) {
        selectedUsersAndGroupChats.value.delete(userOrGroupChatToBeUnselected);
    }


    async function sendPost(method) {
        if (props.authUserId === -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }
        
        statusOfSendingPost.value = 'Loading...';
        
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/sendMessageToOneOrMoreUsersAndGroups/${props.authUserId}/${method}`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    messageToSend: `http://34.111.89.101/posts/${props.overallPostId}`,
                    usersAndGroupsToSendTo: [...selectedUsersAndGroupChats]
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                props.showErrorPopup('The server had trouble sending this post to the selected member(s).');
                statusOfSendingPost.value = '';
            }
            else {
                selectedUsersAndGroupChats.value = new Set();
                statusOfSendingPost.value = 'Sent';
                setTimeout(() => {
                    statusOfSendingPost.value = '';
                }, 1600);
            }
        }
        catch (error) {
            props.showErrorPopup('There was trouble connecting to the server to send this post to the selected member(s).');
            statusOfSendingPost.value = '';
        }
    }


    function getSpecificInfoOnSelectedUserOrGroupChat(labelOfSpecificInfo, selectedUserOrGroupChat) {
        const partsOfSelectedUserOrGroupChatString = selectedUserOrGroupChat.split('/');

        switch (labelOfSpecificInfo) {
            case 'key': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    const groupChatId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                    return `group-chat ${groupChatId}`;
                }
                else {
                    const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                    return `user ${userId}`;
                }
            }

            case 'groupChatId': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    const groupChatId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                    return groupChatId;
                }
                return null;
            }

            case 'userId': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'user') {
                    const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                    return userId;
                }
                return null;
            }

            case 'userOrGroupChatName': {
                return partsOfSelectedUserOrGroupChatString[2];
            }
            
            case 'fullName': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    return 'One of your group-chats';
                }

                const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                if (userId in props.usersAndTheirRelevantInfo && 'fullName' in props.usersAndTheirRelevantInfo[userId]) {
                    return props.usersAndTheirRelevantInfo[userId].fullName;
                }
                return 'Could not get full-name';
            }

            case 'profilePhoto': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    return defaultGroupChatPfp;
                }

                const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                if (userId in props.usersAndTheirRelevantInfo && 'profilePhoto' in props.usersAndTheirRelevantInfo[userId]) {
                    return props.usersAndTheirRelevantInfo[userId].profilePhoto;
                }
                return defaultPfp;
            }
            
            case 'isVerified': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    return false;
                }

                const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                if (userId in props.usersAndTheirRelevantInfo && 'isVerified' in props.usersAndTheirRelevantInfo[userId]) {
                    return props.usersAndTheirRelevantInfo[userId].isVerified;
                }
                return false;
            }
        }
    }


    function getSpecificInfoOnPostSendingSuggestion(labelOfSpecificInfo, postSendingSuggestion) {
        switch (labelOfSpecificInfo) {
            case 'key':
                if (postSendingSuggestion.groupChatId !== null) {
                    return `group-chat ${postSendingSuggestion.groupChatId}`;
                }
                return `user ${postSendingSuggestion.userId}`;

            case 'groupChatId': 
                return postSendingSuggestion.groupChatId;

            case 'userId':
                return postSendingSuggestion.userId;

            case 'userOrGroupChatName':
                return postSendingSuggestion.userOrGroupChatName;
            
            case 'fullName':
                if (postSendingSuggestion.groupChatId !== null) {
                    return 'One of your group-chats;'
                }

                if (postSendingSuggestion.userId in props.usersAndTheirRelevantInfo && 'fullName' in
                props.usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
                    return props.usersAndTheirRelevantInfo[postSendingSuggestion.userId].fullName;
                }
                return 'Could not get full-name';

            case 'profilePhoto':
                if (postSendingSuggestion.groupChatId !== null) {
                    return defaultGroupChatPfp;
                }

                if (postSendingSuggestion.userId in props.usersAndTheirRelevantInfo && 'profilePhoto' in
                props.usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
                    return props.usersAndTheirRelevantInfo[postSendingSuggestion.userId].profilePhoto;
                }
                return defaultPfp;
            
            case 'isVerified':
                if (postSendingSuggestion.groupChatId !== null) {
                    return false;
                }

                if (postSendingSuggestion.userId in props.usersAndTheirRelevantInfo && 'isVerified' in
                props.usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
                    return props.usersAndTheirRelevantInfo[postSendingSuggestion.userId].isVerified;
                }
                return false;
        }
    }
</script>