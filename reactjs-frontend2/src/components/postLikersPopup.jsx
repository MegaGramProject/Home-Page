import { useState, useEffect } from 'react';

import FollowUser from './followUser';

import thinGrayXIcon from '../assets/images/thinGrayXIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';

function PostLikersPopup({username, overallPostId, notifyParentToClosePopup, notifyParentToShowErrorPopup,
usersAndTheirRelevantInfo, notifyParentToUpdateUsersAndTheirRelevantInfo}) {
    const [likers, setLikers] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [likersToExclude, setLikersToExclude] = useState([]);

    useEffect(() => {
        if (overallPostId.length==0) {
            fetchPostLikers();
        }
    }, [overallPostId]);


    async function fetchPostLikers() {
        try {
            //batches of 20 likers will be fetched at a time
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getPostLikers/${username}/${overallPostId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    exclude: [likersToExclude]
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                setErrorMessage("The server had trouble getting the likers of this post.");
            }

            const fetchedLikers = await response.json();
            const usernamesOfLikers = fetchedLikers.map(x=>x.username);
            setLikersToExclude([...likersToExclude, ...usernamesOfLikers]);

            const newUsersAndTheirRelevantInfo = await fetchAllTheNecessaryLikerInfo(usernamesOfLikers);
            notifyParentToUpdateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);

            const newLikers = [];
            for(let fetchedLiker of fetchedLikers) {
                const usernameOfLiker = fetchedLiker.username;
                if(usernameOfLiker===username) {
                    newLikers.push(
                        <FollowUser
                            key={username}
                            username={username}
                            followStatus={'N/A'}
                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                            fullName={newUsersAndTheirRelevantInfo[username].fullName}
                            isVerified={newUsersAndTheirRelevantInfo[username].isVerified}
                            profilePhoto={newUsersAndTheirRelevantInfo[username].profilePhoto}
                        />
                    );
                }
                else if(fetchedLiker.isFollowedByAuthUser) {
                    newLikers.push(
                        <FollowUser
                            key={usernameOfLiker}
                            username={usernameOfLiker}
                            followStatus={'Following'}
                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                            fullName={newUsersAndTheirRelevantInfo[usernameOfLiker].fullName}
                            isVerified={newUsersAndTheirRelevantInfo[usernameOfLiker].isVerified}
                            profilePhoto={newUsersAndTheirRelevantInfo[usernameOfLiker].profilePhoto}
                        />
                    );
                }
                else if(fetchedLiker.isRequestedToBeFollowedByAuthUser) {
                    newLikers.push(
                        <FollowUser
                            key={usernameOfLiker}
                            username={usernameOfLiker}
                            followStatus={'Requested'}
                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                            fullName={newUsersAndTheirRelevantInfo[usernameOfLiker].fullName}
                            isVerified={newUsersAndTheirRelevantInfo[usernameOfLiker].isVerified}
                            profilePhoto={newUsersAndTheirRelevantInfo[usernameOfLiker].profilePhoto}
                        />
                    );
                }
                else {
                    newLikers.push(
                        <FollowUser
                            key={usernameOfLiker}
                            username={usernameOfLiker}
                            followStatus={'Follow'}
                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                            fullName={newUsersAndTheirRelevantInfo[usernameOfLiker].fullName}
                            isVerified={newUsersAndTheirRelevantInfo[usernameOfLiker].isVerified}
                            profilePhoto={newUsersAndTheirRelevantInfo[usernameOfLiker].profilePhoto}
                        />
                    );
                }
            }

            setLikers(newLikers);
        }
        catch (error) {
            setErrorMessage("There was trouble connecting to the server to get the likers of this post.");
        }
    }

    async function fetchAllTheNecessaryLikerInfo(usernamesOfLikers) {
        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        let usersAndTheirFullNames = {};
        const uniqueListOfUsernamesNeededForFullNames = [];
        for(let username of usernamesOfLikers) {
            if(!(username in newUsersAndTheirRelevantInfo) ||
            !('fullName' in newUsersAndTheirRelevantInfo[username])) {
                uniqueListOfUsernamesNeededForFullNames.push(username);
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
        for(let username of usernamesOfLikers) {
            if(!(username in newUsersAndTheirRelevantInfo) ||
            !('isVerified' in newUsersAndTheirRelevantInfo[username])) {
                uniqueListOfUsernamesNeededForIsVerifiedStatuses.push(username);
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
        for(let username of usernamesOfLikers) {
            if(!(username in newUsersAndTheirRelevantInfo) ||
            !('profilePhoto' in newUsersAndTheirRelevantInfo[username])) {
                uniqueListOfUsernamesNeededForProfilePhotos.push(username);
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

        for(let user_name of usernamesOfLikers) {
            if(!(user_name in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[user_name] = {};
            }
            if (user_name in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[user_name].fullName = usersAndTheirFullNames[user_name];
            }
            if (user_name in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[user_name].isVerified = usersAndTheirIsVerifiedStatuses[user_name];
            }
            if (user_name in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[user_name].profilePhoto = usersAndTheirProfilePhotos[user_name];
            }
        }
        return newUsersAndTheirRelevantInfo;

    }

    return (
        <div className="popup" style={{backgroundColor:'white', width:'40em', height:'40em', display:'flex',
        flexDirection:'column', alignItems:'center', borderRadius:'1.5%', overflowY:'scroll',
        position: 'relative'}}>
            
            <div style={{display:'flex', justifyContent: 'center', position: 'relative',
            width: '100%', borderStyle: 'solid', borderColor: 'lightgray', borderTop: 'none',
            borderLeft: 'none', borderRight: 'none', borderWidth: '0.08em', padding: '1em 1em'}}>
                <b>Likes</b>
                <img src={thinGrayXIcon} onClick={notifyParentToClosePopup} style={{height:'1.3em', width:'1.3em', 
                cursor:'pointer', position: 'absolute', right: '5%', top: '30%'}}/>
            </div>
            
            {errorMessage.length==0 ?
                likers :
                (
                    <p style={{position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', width: '75%', color: 'gray'}}>
                        {errorMessage}
                    </p>
                )
            }
        </div>
    );
}

export default PostLikersPopup;