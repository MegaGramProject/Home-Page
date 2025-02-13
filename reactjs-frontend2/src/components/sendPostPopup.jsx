import { useEffect, useState } from 'react';

import SelectUserOrGroupChat from './selectUserOrGroupChat';

import thinGrayXIcon from '../assets/images/thinGrayXIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';

function SendPostPopup({authUser, overallPostId, notifyParentToClosePopup, usersAndTheirRelevantInfo,
notifyParentToUpdateUsersAndTheirRelevantInfo, notifyParentToShowErrorPopup}) {
    const [accountToSendTo, setAccountToSendTo] = useState("");
    const [suggestedResults, setSuggestedResults] = useState([]);
    const [selectedUsersAndGroupChats, setSelectedUsersAndGroupChats] = useState(new Set());
    const [errorMessage, setErrorMessage] = useState("");
    const [cachedSuggestionResults, setCachedSuggestionResults] = useState({});
    const [sendPostStatus, setSendPostStatus] = useState("");

    useEffect(() => {
        fetchUsersToSendPostToGivenTextInput(null);
    }, []);

    async function fetchUsersToSendPostToGivenTextInput(event) {
        let givenTextInput = "";
        if(event!==null) {
            givenTextInput = event.target.value;
            setAccountToSendTo(givenTextInput);
        }

        if(givenTextInput in cachedSuggestionResults) {
            setErrorMessage("");
            setSuggestedResults(cachedSuggestionResults[givenTextInput]);
            return;
        }
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getPostSendingSuggestions/${authUser}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    usernameOrGroupChatStartsWith: givenTextInput
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                setErrorMessage(`The server had trouble getting the suggested accounts/group-chats for you to send
                this post.`)
            }
            else {
                const postSendingSuggestions = await response.json();
                const suggestedUsernamesAndGroupChatIds = postSendingSuggestions.map(x=> {
                    if(x.groupChatId==null) {
                        return x.username;
                    }
                    else {
                        return 'GROUP CHAT ID: ' + x.groupChatId;
                    }
                });
                const newUsersAndTheirRelevantInfo = await fetchAllTheNecessaryInfo(suggestedUsernamesAndGroupChatIds);
                notifyParentToUpdateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);

                const newSuggestedResults = [];
                const newCachedSuggestedResults = {...cachedSuggestionResults};
                for(let suggestion of postSendingSuggestions) {
                    newSuggestedResults.push(
                        <SelectUserOrGroupChat
                            key={
                                (suggestion.groupChatId!==null) ?
                                'GROUP CHAT ID: ' + suggestion.groupChatId : suggestion.username
                            }
                            groupChatId={suggestion.groupChatId}
                            usernameOrGroupChatName={
                                (suggestion.groupChatId!==null) ?
                                suggestion.groupChatName : suggestion.username
                            }
                            fullName={
                                (suggestion.groupChatId!==null) ?
                                'Group-chat' : newUsersAndTheirRelevantInfo[suggestion.username].fullName
                            }
                            notifyParentToSelect={selectUserOrGroupChat}
                            notifyParentToUnselect={unselectUserOrGroupChat}
                            isSelected={
                                (suggestion.groupChatId!==null) ?
                                selectedUsersAndGroupChats.has('GROUP CHAT ID: ' + suggestion.groupChatId) :
                                selectedUsersAndGroupChats.has(suggestion.username)
                            }
                            profilePhoto={
                                (suggestion.groupChatId!==null) ?
                                //yes, the usersAndRelevantInfo dict will contain the profilePhotos of group-chats!
                                newUsersAndTheirRelevantInfo['GROUP CHAT ID: ' + suggestion.groupChatId].profilePhoto :
                                newUsersAndTheirRelevantInfo[suggestion.username].profilePhoto
                            }
                            isVerified={
                                (suggestion.groupChatId!==null) ?
                                false :
                                newUsersAndTheirRelevantInfo[suggestion.username].isVerified
                            }
                        />
                    );
                }
                newCachedSuggestedResults[givenTextInput] = newSuggestedResults;
                setErrorMessage("");
                setCachedSuggestionResults(newCachedSuggestedResults);
                setSuggestedResults(newSuggestedResults);
            }
        }
        catch (error) {
            setErrorMessage(`There was trouble connecting to the server to get suggested accounts/group-chats for you
            to send this post.`)
        }
    }

    async function fetchAllTheNecessaryInfo(suggestedUsernamesAndGroupChatIds) {
        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        let usersAndTheirFullNames = {};
        const uniqueListOfUsernamesNeededForFullNames = [];
        for(let suggestion of suggestedUsernamesAndGroupChatIds) {  
            if(suggestion.startsWith('GROUP CHAT ID: ')) {
                continue;
            }
            if(!(suggestion in newUsersAndTheirRelevantInfo) ||
            !('fullName' in newUsersAndTheirRelevantInfo[suggestion])) {
                uniqueListOfUsernamesNeededForFullNames.push(suggestion);
            }
        }
        if (uniqueListOfUsernamesNeededForFullNames.length>0) {
            try {
                const response = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getFullNamesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesNeededForFullNames
                    })
                });
                if(!response.ok) {
                    console.error("The server had trouble fetching all the necessary fullNames");
                    for(let user_name in uniqueListOfUsernamesNeededForFullNames) {
                        usersAndTheirFullNames[user_name] = '?';
                    }
                }
                else {
                    usersAndTheirFullNames = await response.json();
                }
            }
            catch(error) {
                console.error(
                    "There was trouble connecting to the server to fetch all the necessary fullNames"
                );
                for(let user_name in uniqueListOfUsernamesNeededForFullNames) {
                    usersAndTheirFullNames[user_name] = '?';
                }
            }
        }

        let usersAndTheirIsVerifiedStatuses = {};
        const uniqueListOfUsernamesNeededForIsVerifiedStatuses = [];
        for(let suggestion of suggestedUsernamesAndGroupChatIds) {  
            if(suggestion.startsWith('GROUP CHAT ID: ')) {
                continue;
            }
            if(!(suggestion in newUsersAndTheirRelevantInfo) ||
            !('isVerified' in newUsersAndTheirRelevantInfo[suggestion])) {
                uniqueListOfUsernamesNeededForIsVerifiedStatuses.push(suggestion);
            }
        }
        if (uniqueListOfUsernamesNeededForIsVerifiedStatuses.length>0) {
            try {
                const response1 = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsVerifiedStatusesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesNeededForIsVerifiedStatuses
                    })
                });
                if(!response1.ok) {
                    console.error("The server had trouble fetching all the necessary isVerified statuses");
                    for(let user_name in uniqueListOfUsernamesNeededForIsVerifiedStatuses) {
                        usersAndTheirIsVerifiedStatuses[user_name] = false;
                    }
                }
                else {
                    usersAndTheirIsVerifiedStatuses = await response1.json();
                }
            }
            catch (error) {
                console.error(
                    "There was trouble connecting to the server to fetch all the necessary isVerified statuses"
                );
                for(let user_name in uniqueListOfUsernamesNeededForIsVerifiedStatuses) {
                    usersAndTheirIsVerifiedStatuses[user_name] = false;
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const uniqueListOfUsernamesNeededForProfilePhotos= [];
        for(let suggestion of suggestedUsernamesAndGroupChatIds) {  
            if(suggestion.startsWith('GROUP CHAT ID: ')) {
                continue;
            }
            if(!(suggestion in newUsersAndTheirRelevantInfo) ||
            !('profilePhoto' in newUsersAndTheirRelevantInfo[suggestion])) {
                uniqueListOfUsernamesNeededForProfilePhotos.push(suggestion);
            }
        }
        if (uniqueListOfUsernamesNeededForProfilePhotos.length>0) {
            try {
                const response2 = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotosOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesNeededForProfilePhotos
                    })
                });
                if(!response2.ok) {
                    console.error("The server had trouble fetching all the necessary profile-photos");
                    for(let user_name in uniqueListOfUsernamesNeededForProfilePhotos) {
                        usersAndTheirProfilePhotos[user_name] = defaultPfp;
                    }
                }
                else {
                    usersAndTheirProfilePhotos = await response2.json();
                }
            }
            catch (error) {
                console.error(
                    "There was trouble connecting to the server to fetch all the necessary profile-photos"
                );
                for(let user_name in uniqueListOfUsernamesNeededForProfilePhotos) {
                    usersAndTheirProfilePhotos[user_name] = defaultPfp;
                }
            }
        }

        let groupChatsAndTheirProfilePhotos = {};
        const uniqueListOfGroupChatIdsNeededForProfilePhotos= [];
        for(let suggestion of suggestedUsernamesAndGroupChatIds) {  
            if(!(suggestion.startsWith('GROUP CHAT ID: '))) {
                continue;
            }
            if(!(suggestion in newUsersAndTheirRelevantInfo) ||
            !('profilePhoto' in newUsersAndTheirRelevantInfo[suggestion])) {
                uniqueListOfGroupChatIdsNeededForProfilePhotos.push(suggestion.substring(15));
            }
        }
        if (uniqueListOfGroupChatIdsNeededForProfilePhotos.length>0) {
            try {
                const response3 = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotosOfMultipleGroupChats', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        groupChatIds: uniqueListOfGroupChatIdsNeededForProfilePhotos
                    })
                });
                if(!response3.ok) {
                    console.error(`The server had trouble fetching all the necessary profile-photos
                    for the group-chats`);
                    for(let groupChatId in uniqueListOfGroupChatIdsNeededForProfilePhotos) {
                        groupChatsAndTheirProfilePhotos['GROUP CHAT ID: ' + groupChatId] = defaultPfp;
                    }
                }
                else {
                    groupChatsAndTheirProfilePhotos = await response3.json();
                    for(let groupChatId of Object.keys(groupChatsAndTheirProfilePhotos)) {
                        groupChatsAndTheirProfilePhotos['GROUP CHAT ID: ' + groupChatId] =
                        groupChatsAndTheirProfilePhotos[groupChatId]; 
                        delete groupChatsAndTheirProfilePhotos[groupChatId];
                    }
                }
            }
            catch (error) {
                console.error(
                    `There was trouble connecting to the server to fetch all the necessary profile-photos
                    for the group-chats`
                );
                for(let groupChatId in uniqueListOfGroupChatIdsNeededForProfilePhotos) {
                    groupChatsAndTheirProfilePhotos['GROUP CHAT ID: ' + groupChatId] = defaultPfp;
                }
            }
        }

        for(let suggestion of suggestedUsernamesAndGroupChatIds) {
            if(!(suggestion in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[suggestion] = {};
            }
            if (suggestion in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[suggestion].fullName = usersAndTheirFullNames[suggestion];
            }
            if (suggestion in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[suggestion].isVerified = usersAndTheirIsVerifiedStatuses[suggestion];
            }

            if (suggestion in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[suggestion].profilePhoto = usersAndTheirProfilePhotos[suggestion];
            }
            else if (suggestion in groupChatsAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[suggestion].profilePhoto = groupChatsAndTheirProfilePhotos[suggestion];
            }
        }
        return newUsersAndTheirRelevantInfo;
    }

    function selectUserOrGroupChat(usernameOrGroupChatToBeSelected) {
        setSelectedUsersAndGroupChats(prevSelected => new Set(prevSelected).add(usernameOrGroupChatToBeSelected));
    }
    
    function unselectUserOrGroupChat(usernameOrGroupChatToBeUnselected) {
        setSelectedUsersAndGroupChats(prevSelected => {
            const updatedSet = new Set(prevSelected);
            updatedSet.delete(usernameOrGroupChatToBeUnselected);
            return updatedSet;
        });
    }
    

    async function sendPost(method) {
        //method is either 'individually' or 'as a group'
        //simply send a message that contains the link to the post
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup(`As an anonymous guest, you cannot send posts to anybody. If you would like to do so,
            you must login to an account of yours`);
            return;
        }
        
        setSendPostStatus('Loading...');
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/sendPostToMultipleUsersAndGroups/
            ${authUser}/${overallPostId}`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    method: method,
                    usersAndGroupsToSendTo: selectedUsersAndGroupChats
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                notifyParentToShowErrorPopup(`The server had trouble sending the post to the selected
                member(s).`);
            }
            else {
                setSendPostStatus('Sent');
                setTimeout(() => {
                    setSendPostStatus('');
                }, 2500);
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(`There was trouble connecting to the server to send the post
            to the selected member(s).`);
        }
    }



    return (
        <div className="popup" style={{borderRadius:'2%', width:'35em', height:'35em', paddingTop:'1em',
        position: 'relative'}}>
            <b>Share</b>

            <img onClick={notifyParentToClosePopup} src={thinGrayXIcon} style={{objectFit:'contain', height:'1.7em',
            width:'1.6em', position:'absolute', left:'90%', top: '2%', cursor:'pointer'}}/>

            <hr style={{width: '99%', borderTop: '0.1px solid lightgray', marginTop: '1.2em'}} />
            
            <div style={{display:'flex',  paddingLeft:'1em', alignItems:'center'}}>
                <b>To:</b>
                <input type="text" value={accountToSendTo} onChange={fetchUsersToSendPostToGivenTextInput}
                placeholder='Search...' style={{width:'35em', marginLeft:'1em', fontSize:'0.9em', borderStyle:'none',
                outline: 'none'}}/>
            </div>

            <hr style={{width: '99%', borderTop: '0.1px solid lightgray'}} />

            <div style={{display:'flex', flexDirection:'column', alignItems:'start', height:'26em',
            overflow:'scroll', gap: '1em'}}>
                {accountToSendTo.length==0 && 
                    (
                        <b style={{marginLeft: '1em', marginTop: '1em', marginBottom: '1em'}}>
                            Suggested
                        </b>
                    )
                }

                {errorMessage.length==0 &&
                    (
                        suggestedResults
                    )
                }

                {errorMessage.length>0 &&
                    (
                        <p style={{width: '90%', color: 'gray', fontSize: '0.88em', marginLeft: '2em',
                        textAlign: 'start'}}>
                            {errorMessage}
                        </p>
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

            {(sendPostStatus!=='Loading...' && selectedUsersAndGroupChats.size == 1) && 
                (
                    <button onClick={()=>sendPost('individually')} className="blueButton"
                    style={{width:'42em', cursor:'pointer', backgroundColor:'#347aeb'}}>
                        Send
                    </button>
                )
            }

            {(sendPostStatus!=='Loading...' && selectedUsersAndGroupChats.size > 1) &&
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

            {(sendPostStatus==='Sent') &&
                <p style={{position: 'absolute', top: '85%', left: '50%', transform: 'translate(-50%, -50%)',
                color: 'white', backgroundColor: 'black', padding: '0.4em 0.8em', borderRadius: '0.3em'}}>
                    Sent
                </p>
            }
        </div>
    );
};

export default SendPostPopup;