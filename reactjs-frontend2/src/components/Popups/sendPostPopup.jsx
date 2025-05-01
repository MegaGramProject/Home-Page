import SelectUserOrGroupChat from '../../SelectUserOrGroupChat';

import defaultGroupChatPfp from '../../assets/images/defaultGroupChatPfp.png';
import defaultPfp from '../../assets/images/defaultPfp.png';
import loadingAnimation from '../../assets/images/loadingAnimation.gif';
import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';

import { useEffect, useState } from 'react';


function SendPostPopup({authUserId, overallPostId, usersAndTheirRelevantInfo, cachedMessageSendingSuggestions, closePopup,
showErrorPopup, updateUsersAndTheirRelevantInfo, updateCachedMessageSendingSuggestions}) {
    const [inputText, setInputText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [statusOfFetchingResults, setStatusOfFetchingResults] = useState('');
    const [statusOfSendingPost, setStatusOfSendingPost] = useState('');

    const [currentSuggestions, setCurrentSuggestions] = useState([]);

    const [selectedUsersAndGroupChats, setSelectedUsersAndGroupChats] = useState(new Set());


    useEffect(() => {
        fetchUsersToSendPostToGivenTextInput(null);
    }, []);


    async function fetchUsersToSendPostToGivenTextInput(event) {
        setErrorMessage('');
        let newInputText = '';

        if(event!==null) {
            newInputText = event.target.value;
            setInputText(newInputText);
        }

        if(newInputText in cachedMessageSendingSuggestions) {
            setCurrentSuggestions(cachedMessageSendingSuggestions[newInputText]);
            return;
        }

        setStatusOfFetchingResults('Loading...');

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/getMessageSendingSuggestions/${authUserId}
            /${newInputText}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                setErrorMessage(`The server had trouble getting the suggested accounts/group-chats for you to send
                this post to.`)
            }
            else {
                const postSendingSuggestions = await response.json();
                setCurrentSuggestions(postSendingSuggestions);

                const newCachedMessageSendingSuggestions = {...cachedMessageSendingSuggestions};
                newCachedMessageSendingSuggestions[newInputText] = postSendingSuggestions;
                updateCachedMessageSendingSuggestions(newCachedMessageSendingSuggestions);

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
                updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
            }
        }
        catch (error) {
            setErrorMessage(`There was trouble connecting to the server to get the suggested accounts/group-chats for you to send
            this post to.`);
        }
        finally {
            setStatusOfFetchingResults('');
        }
    }


    async function fetchAllTheRelevantUserInfo(newSuggestedUserIds) {
        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirFullNames = {};
        const newSuggestedUserIdsNeededForFullNames = newSuggestedUserIds.filter(newSuggestedUserId => {
            if (!(newSuggestedUserId in usersAndTheirRelevantInfo) || !('fullName' in
            usersAndTheirRelevantInfo[newSuggestedUserId])) {
                return newSuggestedUserId;
            }
        });

        if (newSuggestedUserIdsNeededForFullNames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newSuggestedUserIdsNeededForFullNames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newSuggestedUserIdsNeededForFullNames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newSuggestedUserIdsNeededForFullNames = newSuggestedUserIdsNeededForFullNames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newSuggestedUserIdsNeededForVerificationStatuses = newSuggestedUserIds.filter(newSuggestedUserId => {
            if (!(newSuggestedUserId in usersAndTheirRelevantInfo) || !('isVerified' in
            usersAndTheirRelevantInfo[newSuggestedUserId])) {
                return newSuggestedUserId;
            }
        });
        if (newSuggestedUserIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newSuggestedUserIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newSuggestedUserIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId;
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
            if (!(newSuggestedUserId in usersAndTheirRelevantInfo) || !('profilePhoto' in
            usersAndTheirRelevantInfo[newSuggestedUserId])) {
                return newSuggestedUserId;
            }
        });
        if (newSuggestedUserIdsNeededForPfps.length>0) {
            try {
                const response2 = await fetch(
                    `http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers/${authUserId}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userIds: newSuggestedUserIdsNeededForPfps
                        }),
                        credentials: 'include'
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

        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        for(let newSuggestedUserId of newSuggestedUserIds) {
            if (!(newSuggestedUserId in usersAndTheirFullNames) && !(newSuggestedUserId in usersAndTheirVerificationStatuses) &&
            !(newSuggestedUserId in usersAndTheirPfps)) {
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
        setSelectedUsersAndGroupChats(
            originalSelectedUsersAndGroupChats => new Set(originalSelectedUsersAndGroupChats).add(userOrGroupChatToBeSelected)
        );
    }
    

    function unselectUserOrGroupChat(userOrGroupChatToBeUnselected) {
        setSelectedUsersAndGroupChats(originalSelectedUsersAndGroupChats => {
            const updatedSet = new Set(originalSelectedUsersAndGroupChats);
            updatedSet.delete(userOrGroupChatToBeUnselected);
            return updatedSet;
        });
    }
    

    async function sendPost(method) {
        if (authUserId === -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }
        
        setStatusOfSendingPost('Loading...');

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/sendMessageToOneOrMoreUsersAndGroups/${authUserId}/${method}`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    messageToSend: `http://34.111.89.101/posts/${overallPostId}`,
                    usersAndGroupsToSendTo: [...selectedUsersAndGroupChats]
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                showErrorPopup('The server had trouble sending this post to the selected member(s).');
                setStatusOfSendingPost('');
            }
            else {
                setSelectedUsersAndGroupChats(new Set());
                setStatusOfSendingPost('Sent');
                setTimeout(() => {
                    setStatusOfSendingPost('');
                }, 1600);
            }
        }
        catch (error) {
            showErrorPopup('There was trouble connecting to the server to send this post to the selected member(s).');
            setStatusOfSendingPost('');
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
                if (userId in usersAndTheirRelevantInfo && 'fullName' in usersAndTheirRelevantInfo[userId]) {
                    return usersAndTheirRelevantInfo[userId].fullName;
                }
                return 'Could not get full-name';
            }

            case 'profilePhoto': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    return defaultGroupChatPfp;
                }

                const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                if (userId in usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[userId]) {
                    return usersAndTheirRelevantInfo[userId].profilePhoto;
                }
                return defaultPfp;
            }
            
            case 'isVerified': {
                if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
                    return false;
                }

                const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
                if (userId in usersAndTheirRelevantInfo && 'isVerified' in usersAndTheirRelevantInfo[userId]) {
                    return usersAndTheirRelevantInfo[userId].isVerified;
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

                if (postSendingSuggestion.userId in usersAndTheirRelevantInfo && 'fullName' in
                usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
                    return usersAndTheirRelevantInfo[postSendingSuggestion.userId].fullName;
                }
                return 'Could not get full-name';

            case 'profilePhoto':
                if (postSendingSuggestion.groupChatId !== null) {
                    return defaultGroupChatPfp;
                }

                if (postSendingSuggestion.userId in usersAndTheirRelevantInfo && 'profilePhoto' in
                usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
                    return usersAndTheirRelevantInfo[postSendingSuggestion.userId].profilePhoto;
                }
                return defaultPfp;
            
            case 'isVerified':
                if (postSendingSuggestion.groupChatId !== null) {
                    return false;
                }

                if (postSendingSuggestion.userId in usersAndTheirRelevantInfo && 'isVerified' in
                usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
                    return usersAndTheirRelevantInfo[postSendingSuggestion.userId].isVerified;
                }
                return false;
        }
    }


    return (
        <div className="popup" style={{borderRadius:'2%', width:'35em', height:'35em', paddingTop:'1em',
        position: 'relative'}}>
            <b>Share</b>

            <img onClick={closePopup} src={thinGrayXIcon} style={{objectFit:'contain', height:'1.7em',
            width:'1.6em', position:'absolute', left:'90%', top: '2%', cursor:'pointer'}}/>

            <hr style={{width: '99%', borderTop: '0.1px solid lightgray', marginTop: '1.2em'}} />
            
            <div style={{display:'flex',  paddingLeft:'1em', alignItems:'center'}}>
                <b>To:</b>
                <input type="text" value={inputText} onChange={fetchUsersToSendPostToGivenTextInput}
                placeholder='Search...' style={{width:'35em', marginLeft:'1em', fontSize:'0.9em', borderStyle:'none',
                outline: 'none'}}/>
            </div>

            <hr style={{width: '99%', borderTop: '0.1px solid lightgray'}} />

            <div style={{display:'flex', flexDirection:'column', alignItems:'start', height:'26em', overflow:'scroll', gap: '1em',
            position: 'relative', width: '99%'}}>
                {selectedUsersAndGroupChats.size > 0 &&
                    (
                        <>
                            <b style={{marginLeft: '1em', marginTop: '1em', marginBottom: '1em'}}>
                                Selected
                            </b>

                            {
                                [...selectedUsersAndGroupChats].map(selectedUserOrGroupChat =>
                                    <SelectUserOrGroupChat
                                        key={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'key',
                                            selectedUserOrGroupChat
                                        )}
                                        groupChatId={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'groupChatId',
                                            selectedUserOrGroupChat
                                        )}
                                        userId={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'userId',
                                            selectedUserOrGroupChat
                                        )}
                                        userOrGroupChatName={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'userOrGroupChatName',
                                            selectedUserOrGroupChat
                                        )}
                                        fullName={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'fullName',
                                            selectedUserOrGroupChat
                                        )}
                                        profilePhoto={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'profilePhoto',
                                            selectedUserOrGroupChat
                                        )}
                                        isSelected={true}
                                        isVerified={getSpecificInfoOnSelectedUserOrGroupChat(
                                            'isVerified',
                                            selectedUserOrGroupChat
                                        )}
                                        selectThisUserOrGroupChat={selectUserOrGroupChat}
                                        unselectThisUserOrGroupChat={unselectUserOrGroupChat}
                                    />
                                )
                            }
                        </>
                    )
                }

                {inputText.length==0 && 
                    (
                        <b style={{marginLeft: '1em', marginTop: '1em', marginBottom: '1em'}}>
                            Suggested
                        </b>
                    )
                }
                

                {errorMessage.length==0 &&
                    (
                        currentSuggestions.filter(
                            suggestion => {
                                const isGroupChatSelected = selectedUsersAndGroupChats.has(
                                    `group-chat/${suggestion.groupChatId}/${suggestion.userOrGroupChatName}`
                                );
                                const isUserSelected = selectedUsersAndGroupChats.has(
                                    `user/${suggestion.userId}/${suggestion.userOrGroupChatName}`
                                );
                            
                                if (isGroupChatSelected || isUserSelected) return false;
        
                                return true;
                            }
                        ).map(suggestion =>
                            <SelectUserOrGroupChat
                                key={getSpecificInfoOnPostSendingSuggestion('key', suggestion)}
                                groupChatId={getSpecificInfoOnPostSendingSuggestion('groupChatId', suggestion)}
                                userId={getSpecificInfoOnPostSendingSuggestion('userId', suggestion)}
                                userOrGroupChatName={getSpecificInfoOnPostSendingSuggestion(
                                    'userOrGroupChatName',
                                    suggestion
                                )}
                                fullName={getSpecificInfoOnPostSendingSuggestion('fullName', suggestion)}
                                profilePhoto={getSpecificInfoOnPostSendingSuggestion('profilePhoto', suggestion)}
                                isSelected={false}
                                isVerified={getSpecificInfoOnPostSendingSuggestion('isVerified', suggestion)}
                                selectThisUserOrGroupChat={selectUserOrGroupChat}
                                unselectThisUserOrGroupChat={unselectUserOrGroupChat}
                            />
                        )
                    )
                }

                {errorMessage.length>0 &&
                    (
                        <p style={{maxWidth: '90%', overflowWrap: 'break-word', color: 'gray', fontSize: '0.88em', textAlign:
                        'start', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                            {errorMessage}
                        </p>
                    )
                }

                {statusOfFetchingResults === 'Loading...' &&
                    (
                        <img src={loadingAnimation} style={{height: '2.75em', width: '2.75em', objectFit: 'contain',
                        pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%', transform: 
                        'translate(-50%, -50%)'}}/>
                    )
                }
            </div>

            {selectedUsersAndGroupChats.size == 0 && 
                (
                    <button className="blueButton" style={{width:'42em'}}>
                        Send
                    </button>
                )
            }

            {(statusOfSendingPost !== 'Loading...' && selectedUsersAndGroupChats.size == 1) && 
                (
                    <button onClick={()=>sendPost('individually')} className="blueButton"
                    style={{width:'42em', cursor:'pointer', backgroundColor:'#347aeb'}}>
                        Send
                    </button>
                )
            }

            {(statusOfSendingPost !== 'Loading...' && selectedUsersAndGroupChats.size > 1) &&
                (
                    <div style={{display: 'flex', gap: '1em', alignItems: 'center', justifyContent: 'center',
                    width: '100%'}}>
                        <button onClick={()=>sendPost('individually')} className="blueButton"
                        style={{width:'19em', cursor:'pointer', backgroundColor:'#347aeb'}}>
                            Send Individually
                        </button>

                        <button onClick={()=>sendPost('as a group')} className="blueButton"
                        style={{width:'19em', cursor:'pointer', backgroundColor:'#347aeb'}}>
                            Send in Group-Chat
                        </button>
                    </div>
                )
            }

            {statusOfSendingPost === 'Loading...' &&
                (
                    <img src={loadingAnimation} style={{height: '100%', width: '2.75em', objectFit: 'contain', pointerEvents:
                    'none', position: 'absolute', top: '85%', left: '50%', transform: 'translate(-50%, -50%)'}}/>
                )
            }   

            {(statusOfSendingPost==='Sent') &&
                <p style={{position: 'absolute', top: '85%', left: '50%', transform: 'translate(-50%, -50%)',
                color: 'white', backgroundColor: 'black', padding: '0.4em 0.8em', borderRadius: '0.3em'}}>
                    Sent
                </p>
            }
        </div>
    );
};

export default SendPostPopup;