import { useState, useRef, useEffect } from 'react';

import FollowUser from './followUser';

import thinGrayXIcon from '../assets/images/thinGrayXIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';

function PostLikersPopup({authUser, overallPostId, notifyParentToClosePopup, notifyParentToShowErrorPopup,
usersAndTheirRelevantInfo, notifyParentToUpdateUsersAndTheirRelevantInfo}) {
    const [likers, setLikers] = useState([]);
    const [initialPostLikersFetchingErrorMessage, setInitialPostLikersFetchingErrorMessage] = useState("");
    const [likersToExclude, setLikersToExclude] = useState([]);
    const [fetchingInitialPostLikersIsComplete, setFetchingInitialPostLikersIsComplete] = useState(false);
    const [isCurrentlyFetchingAdditionalPostLikers, setIsCurrentlyFetchingAdditionalPostLikers] = useState(false);
    const [additionalPostLikersFetchingErrorMessage, setAdditionalPostLikersFetchingErrorMessage] = useState('');
    const scrollableLikersDivRef = useRef(null);

    useEffect(() => {
        if (overallPostId.length==0) {
            fetchPostLikers('initial');
        }
    }, [overallPostId]);
    
    useEffect(() => {
        return () => {
          window.removeEventListener('scroll', fetchAdditionalPostLikersWhenUserScrollsToBottomOfPopup);
        };
      }, []);

    async function fetchPostLikers(initialOrAdditionalText) {
        const isInitialFetch = initialOrAdditionalText === 'initial';
        try {
            //batches of 20 likers will be fetched at a time
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getPostLikers/${authUser}/${overallPostId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    exclude: likersToExclude
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                if(isInitialFetch) {
                    setInitialPostLikersFetchingErrorMessage(
                        "The server had trouble getting the initial likers of this post."
                    );
                    setFetchingInitialPostLikersIsComplete(true);
                }
                else {
                    setAdditionalPostLikersFetchingErrorMessage(
                        "The server had trouble getting the additional likers of this post."
                    );
                    setIsCurrentlyFetchingAdditionalPostLikers(false);
                }
                return;
            }
            const fetchedLikers = await response.json();
            const usernamesOfLikers = fetchedLikers.map(x=>x.username);
            setLikersToExclude([...likersToExclude, ...usernamesOfLikers]);

            const newUsersAndTheirRelevantInfo = await fetchAllTheNecessaryLikerInfo(usernamesOfLikers);
            notifyParentToUpdateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);

            const newLikers = [...likers];
            for(let fetchedLiker of fetchedLikers) {
                const usernameOfLiker = fetchedLiker.username;
                if(usernameOfLiker===authUser) {
                    newLikers.push(
                        <FollowUser
                            key={authUser}
                            username={authUser}
                            followStatus={'N/A'}
                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                            fullName={newUsersAndTheirRelevantInfo[authUser].fullName}
                            isVerified={newUsersAndTheirRelevantInfo[authUser].isVerified}
                            profilePhoto={newUsersAndTheirRelevantInfo[authUser].profilePhoto}
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

            if(isInitialFetch) {
                setFetchingInitialPostLikersIsComplete(true);
                setTimeout(() => {
                    window.addEventListener("scroll", fetchAdditionalPostLikersWhenUserScrollsToBottomOfPopup);
                }, 1500);
            }
            else {
                setIsCurrentlyFetchingAdditionalPostLikers(false);
            }
        }
        catch (error) {
            if(isInitialFetch) {
                setInitialPostLikersFetchingErrorMessage(
                    "There was trouble connecting to the server to get the initial likers of this post."
                );
                setFetchingInitialPostLikersIsComplete(true);
            }
            else {
                setAdditionalPostLikersFetchingErrorMessage(
                    "There was trouble connecting to the server to get the additional likers of this post."
                );
                setIsCurrentlyFetchingAdditionalPostLikers(false);
            }
        }
    }

    async function fetchAllTheNecessaryLikerInfo(usernamesOfLikers) {
        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        let usersAndTheirFullNames = {};
        const uniqueListOfUsernamesNeededForFullNames = usernamesOfLikers.filter(username=> {
            if (!(username in usersAndTheirRelevantInfo) || !('fullName' in usersAndTheirRelevantInfo[username])) {
                return username;
            }
        });

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
                    for(let username in uniqueListOfUsernamesNeededForFullNames) {
                        usersAndTheirFullNames[username] = '?';
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
                for(let username in uniqueListOfUsernamesNeededForFullNames) {
                    usersAndTheirFullNames[username] = '?';
                }
            }
        }

        let usersAndTheirIsVerifiedStatuses = {};
        const uniqueListOfUsernamesNeededForIsVerifiedStatuses = usernamesOfLikers.filter(username=> {
            if (!(username in usersAndTheirRelevantInfo) || !('isVerified' in usersAndTheirRelevantInfo[username])) {
                return username;
            }
        });
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
                    for(let username in uniqueListOfUsernamesNeededForIsVerifiedStatuses) {
                        usersAndTheirIsVerifiedStatuses[username] = false;
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
                for(let username in uniqueListOfUsernamesNeededForIsVerifiedStatuses) {
                    usersAndTheirIsVerifiedStatuses[username] = false;
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const uniqueListOfUsernamesNeededForProfilePhotos = usernamesOfLikers.filter(username=> {
            if (!(username in usersAndTheirRelevantInfo) || !('profilePhoto' in usersAndTheirRelevantInfo[username])) {
                return username;
            }
        });
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
                    for(let username in uniqueListOfUsernamesNeededForProfilePhotos) {
                        usersAndTheirProfilePhotos[username] = defaultPfp;
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
                for(let username in uniqueListOfUsernamesNeededForProfilePhotos) {
                    usersAndTheirProfilePhotos[username] = defaultPfp;
                }
            }
        }

        for(let username of usernamesOfLikers) {
            if(!(username in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[username] = {};
            }
            if (username in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[username].fullName = usersAndTheirFullNames[username];
            }
            if (username in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[username].isVerified = usersAndTheirIsVerifiedStatuses[username];
            }
            if (username in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[username].profilePhoto = usersAndTheirProfilePhotos[username];
            }
        }
        return newUsersAndTheirRelevantInfo;
    }

    function fetchAdditionalPostLikersWhenUserScrollsToBottomOfPopup() {
        if (additionalPostLikersFetchingErrorMessage.length==0 &&
        !isCurrentlyFetchingAdditionalPostLikers &&
        scrollableLikersDivRef.current &&
        scrollableLikersDivRef.current.clientHeight +  scrollableLikersDivRef.current.scrollTop >=
        scrollableLikersDivRef.current.scrollHeight) {
            setIsCurrentlyFetchingAdditionalPostLikers(true);
            fetchPostLikers('additional');
        }
    }

    return (
        <div ref={scrollableLikersDivRef} className="popup" style={{backgroundColor:'white', width:'40em', height:'40em',
        display:'flex', flexDirection:'column', alignItems:'center', borderRadius:'1.5%', overflowY:'scroll',
        position: 'relative'}}>
            
            <div style={{display:'flex', justifyContent: 'center', position: 'relative',
            width: '100%', borderStyle: 'solid', borderColor: 'lightgray', borderTop: 'none',
            borderLeft: 'none', borderRight: 'none', borderWidth: '0.08em', padding: '1em 1em'}}>
                <b>Likes</b>
                <img src={thinGrayXIcon} onClick={notifyParentToClosePopup} style={{height:'1.3em', width:'1.3em', 
                cursor:'pointer', position: 'absolute', right: '5%', top: '30%'}}/>
            </div>

            {(fetchingInitialPostLikersIsComplete && initialPostLikersFetchingErrorMessage.length==0) &&
                (
                    likers
                )
            }

            {(fetchingInitialPostLikersIsComplete && initialPostLikersFetchingErrorMessage.length>0) &&
                (
                    <p style={{position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', width: '75%', color: 'gray'}}>
                        {initialPostLikersFetchingErrorMessage}
                    </p>
                )
            }

            {(!isCurrentlyFetchingAdditionalPostLikers &&
            additionalPostLikersFetchingErrorMessage.length>0) &&
                (
                    <p style={{width: '85%', color: 'gray', fontSize: '0.88em',
                    marginTop: '3.75em'}}>
                        {additionalPostLikersFetchingErrorMessage}
                    </p>
                )
            } 

            {isCurrentlyFetchingAdditionalPostLikers &&
                (
                    <img src={loadingAnimation} style={{height: '2em', width: '2em',
                    objectFit: 'contain', pointerEvents: 'none', marginTop: '3.75em'}}/>
                )
            }
        </div>
    );
}

export default PostLikersPopup;