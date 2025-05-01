import FollowUser from '../../FollowUser';

import defaultPfp from '../../assets/images/defaultPfp.png';
import loadingAnimation from '../../assets/images/loadingAnimation.gif';
import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';

import { useEffect, useRef, useState } from 'react';


function LikersPopup({idOfPostOrComment, authUserId, usersAndTheirRelevantInfo, closePopup, showErrorPopup,
updateUsersAndTheirRelevantInfo}) {
    const [likers, setLikers] = useState([]);
    const [likerIdsToExclude, setLikerIdsToExclude] = useState([]);

    const [initialLikersFetchingErrorMessage, setInitialLikersFetchingErrorMessage] = useState('');
    const [additionalLikersFetchingErrorMessage, setAdditionalLikersFetchingErrorMessage] = useState('');

    const [fetchingInitialLikersIsComplete, setFetchingInitialLikersIsComplete] = useState(false);
    const [isCurrentlyFetchingAdditionalLikers, setIsCurrentlyFetchingAdditionalLikers] = useState(false);

    const scrollableLikersDivRef = useRef(null);


    useEffect(() => {
        fetchLikers('initial');

        return () => {
            window.removeEventListener('scroll', fetchAdditionalLikersWhenUserScrollsToBottomOfPopup);
        };
    }, []);


    async function fetchLikers(initialOrAdditionalText) {
        const isInitialFetch = initialOrAdditionalText === 'initial';
        const postOrCommentText = typeof idOfPostOrComment === 'string' ? 'post' : 'comment';

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getBatchOfLikersOfPostOrComment/${authUserId}
            /${idOfPostOrComment}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(likerIdsToExclude),
                credentials: 'include'
            });

            if(!response.ok) {
                if(isInitialFetch) {
                    setInitialLikersFetchingErrorMessage(
                        `The server had trouble getting the initial likers of this ${postOrCommentText}.`
                    );
                    setFetchingInitialLikersIsComplete(true);
                }
                else {
                    setAdditionalLikersFetchingErrorMessage(
                        `The server had trouble getting the additional likers of this ${postOrCommentText}.`
                    );
                    setIsCurrentlyFetchingAdditionalLikers(false);
                }
                
                return;
            }

            const fetchedLikers = await response.json();
            if (fetchedLikers.length == 0) {
                if(isInitialFetch) {
                    setInitialLikersFetchingErrorMessage('No one has liked this yet');
                    setFetchingInitialLikersIsComplete(true);
                }
                else {
                    setAdditionalLikersFetchingErrorMessage('No additional likers have been found yet');
                    setFetchingInitialLikersIsComplete(false);
                }

                return;
            }

            const newLikerIds = fetchedLikers.map(fetchedLiker => fetchedLiker.likerId);
            setLikerIdsToExclude([...likerIdsToExclude, ...newLikerIds]);

            const newUsersAndTheirRelevantInfo = await fetchAllTheNecessaryLikerInfo(newLikerIds);
            updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);

            const newLikers = [...likers];
            for(let fetchedLiker of fetchedLikers) {
                const likerId = fetchedLiker.likerId;

                let likerUsername = null;
                if (likerId in newUsersAndTheirRelevantInfo && 'username' in newUsersAndTheirRelevantInfo[likerId]) {
                    likerUsername = newUsersAndTheirRelevantInfo[likerId].username;
                }
                else {
                    continue;
                }

                let likerFullName = null;
                if (likerId in newUsersAndTheirRelevantInfo && 'fullName' in newUsersAndTheirRelevantInfo[likerId]) {
                    likerFullName = newUsersAndTheirRelevantInfo[likerId].fullName;
                }
                else {
                    likerFullName = 'Could not fetch full-name of this user';
                }

                let likerPfp = null;
                if (likerId in newUsersAndTheirRelevantInfo && 'profilePhoto' in newUsersAndTheirRelevantInfo[likerId]) {
                    likerPfp = newUsersAndTheirRelevantInfo[likerId].profilePhoto;
                }
                else {
                    likerPfp = defaultPfp;
                }

                let likerIsVerified = null;
                if (likerId in newUsersAndTheirRelevantInfo && 'isVerified' in newUsersAndTheirRelevantInfo[likerId]) {
                    likerIsVerified = newUsersAndTheirRelevantInfo[likerId].isVerified;
                }
                else {
                    likerIsVerified = false;
                }

                if(likerId === authUserId) {
                    newLikers.push(
                        <FollowUser
                            key={likerId}
                            authUserId={authUserId}
                            userId={likerId}
                            username={likerUsername}
                            userFullName={likerFullName}
                            userPfp={likerPfp}
                            originalFollowText={''}
                            userIsVerified={likerIsVerified}
                            showErrorPopup={showErrorPopup}
                        />
                    );
                }
                else if(fetchedLiker.isFollowedByAuthUser) {
                    newLikers.push(
                        <FollowUser
                            key={likerId}
                            authUserId={authUserId}
                            userId={likerId}
                            username={likerUsername}
                            userFullName={likerFullName}
                            userPfp={likerPfp}
                            originalFollowText={'Following'}
                            userIsVerified={likerIsVerified}
                            showErrorPopup={showErrorPopup}
                        />
                    );
                }
                else {
                    newLikers.push(
                        <FollowUser
                            key={likerId}
                            authUserId={authUserId}
                            userId={likerId}
                            username={likerUsername}
                            userFullName={likerFullName}
                            userPfp={likerPfp}
                            originalFollowText={'Follow'}
                            userIsVerified={likerIsVerified}
                            showErrorPopup={showErrorPopup}
                        />
                    );
                }
            }

            setLikers(newLikers);

            if(isInitialFetch) {
                setFetchingInitialLikersIsComplete(true);
                setTimeout(() => {
                    window.addEventListener("scroll", fetchAdditionalLikersWhenUserScrollsToBottomOfPopup);
                }, 1500);
            }
            else {
                setIsCurrentlyFetchingAdditionalLikers(false);
            }
        }
        catch {
            if(isInitialFetch) {
                setInitialLikersFetchingErrorMessage(
                    `There was trouble connecting to the server to get the initial likers of this ${postOrCommentText}.`
                );
                setFetchingInitialLikersIsComplete(true);
            }
            else {
                setAdditionalLikersFetchingErrorMessage(
                    `There was trouble connecting to the server to get the additional likers of this ${postOrCommentText}.`
                );
                setIsCurrentlyFetchingAdditionalLikers(false);
            }
        }
    }


    async function fetchAllTheNecessaryLikerInfo(newLikerIds) {
        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newLikerIdsNeededForUsernames = newLikerIds.filter(newLikerId => {
            if (!(newLikerId in usersAndTheirRelevantInfo) || !('username' in usersAndTheirRelevantInfo[newLikerId])) {
                return newLikerId;
            }
        });

        if (newLikerIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newLikerIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newLikerIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newLikerIdsNeededForUsernames = newLikerIdsNeededForUsernames;
        }

        let usersAndTheirFullNames = {};
        const newLikerIdsNeededForFullNames = newLikerIds.filter(newLikerId => {
            if (!(newLikerId in usersAndTheirRelevantInfo) || !('fullName' in usersAndTheirRelevantInfo[newLikerId])) {
                return newLikerId;
            }
        });

        if (newLikerIdsNeededForFullNames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newLikerIdsNeededForFullNames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newLikerIdsNeededForFullNames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newLikerIdsNeededForFullNames = newLikerIdsNeededForFullNames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newLikerIdsNeededForVerificationStatuses = newLikerIds.filter(newLikerId => {
            if (!(newLikerId in usersAndTheirRelevantInfo) || !('isVerified' in usersAndTheirRelevantInfo[newLikerId])) {
                return newLikerId;
            }
        });
        if (newLikerIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newLikerIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newLikerIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newLikerIdsNeededForVerificationStatuses = newLikerIdsNeededForVerificationStatuses;
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
                    if (newLikerIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched likers'
                        );
                    }

                    if (newLikerIdsNeededForFullNames.length > 0) {
                        console.error(
                            'The server had trouble fetching the full-names of all the newly fetched likers'
                        );
                    }

                    if (newLikerIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            likers`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newLikerIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewLikerIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newLikerIdsNeededForUsernames.length; i++) {
                            const newLikerId = newLikerIdsNeededForUsernames[i];
                            const newLikerUsername = listOfUsernamesForNewLikerIds[i];

                            if (newLikerUsername !== null) {
                                usersAndTheirUsernames[newLikerId] = newLikerUsername;
                            }
                        }
                    }
                    
                    if (newLikerIdsNeededForFullNames.length > 0) {
                        const listOfFullNamesForNewLikerIds = responseData.data.getListOfFullNamesForUserIds;

                        for(let i=0; i<newLikerIdsNeededForFullNames.length; i++) {
                            const newLikerId = newLikerIdsNeededForFullNames[i];
                            const newLikerFullName = listOfFullNamesForNewLikerIds[i];

                            if (newLikerFullName !== null) {
                                usersAndTheirFullNames[newLikerId] = newLikerFullName;
                            }
                        }
                    }

                    if (newLikerIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewLikerIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newLikerIdsNeededForVerificationStatuses.length; i++) {
                            const newLikerId = newLikerIdsNeededForVerificationStatuses[i];
                            const newLikerVerificationStatus = listOfVerificationStatusesForNewLikerIds[i];

                            if (newLikerVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newLikerId] = newLikerVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newLikerIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        likers`
                    );
                }

                if (newLikerIdsNeededForFullNames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the full-names of all the newly fetched
                        likers`
                    ); 
                }

                if (newLikerIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched likers`
                    );
                }
            }
        }

        let usersAndTheirPfps = {};
        const newLikerIdsNeededForPfps = newLikerIds.filter(newLikerId => {
            if (!(newLikerId in usersAndTheirRelevantInfo) || !('profilePhoto' in usersAndTheirRelevantInfo[newLikerId])) {
                return newLikerId;
            }
        });
        if (newLikerIdsNeededForPfps.length>0) {
            try {
                const response2 = await fetch(
                    `http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers/${authUserId}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userIds: newLikerIdsNeededForPfps
                        }),
                        credentials: 'include'
                    });
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched likers'
                    );
                }
                else {
                    usersAndTheirPfps = await response2.json();
                }
            }
            catch {
                console.error(
                    'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched likers'
                );
            }
        }

        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        for(let newLikerId of newLikerIds) {
            if (!(newLikerId in usersAndTheirUsernames) && !(newLikerId in usersAndTheirFullNames) &&
            !(newLikerId in usersAndTheirVerificationStatuses) && !(newLikerId in usersAndTheirPfps)) {
                continue;
            }

            if(!(newLikerId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[newLikerId] = {};
            }
            
            if (newLikerId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[newLikerId].username = usersAndTheirUsernames[newLikerId];
            }
            if (newLikerId in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[newLikerId].fullName = usersAndTheirFullNames[newLikerId];
            }
            if (newLikerId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[newLikerId].isVerified = usersAndTheirVerificationStatuses[newLikerId];
            }
            if (newLikerId in usersAndTheirPfps) {
                newUsersAndTheirRelevantInfo[newLikerId].profilePhoto = usersAndTheirPfps[newLikerId];
            }
        }
        return newUsersAndTheirRelevantInfo;
    }


    function fetchAdditionalLikersWhenUserScrollsToBottomOfPopup() {
        if (additionalLikersFetchingErrorMessage.length==0 && !isCurrentlyFetchingAdditionalLikers &&
        scrollableLikersDivRef.current && scrollableLikersDivRef.current.clientHeight + 
        scrollableLikersDivRef.current.scrollTop >= scrollableLikersDivRef.current.scrollHeight) {
            setIsCurrentlyFetchingAdditionalLikers(true);
            fetchLikers('additional');
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
                <img src={thinGrayXIcon} onClick={closePopup} style={{height:'1.3em', width:'1.3em', 
                cursor:'pointer', position: 'absolute', right: '5%', top: '30%'}}/>
            </div>

            {(fetchingInitialLikersIsComplete && initialLikersFetchingErrorMessage.length==0) &&
                (
                    likers
                )
            }

            {(fetchingInitialLikersIsComplete && initialLikersFetchingErrorMessage.length>0) &&
                (
                    <p style={{position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', width: '75%', color: 'gray'}}>
                        {initialLikersFetchingErrorMessage}
                    </p>
                )
            }

            {!fetchingInitialLikersIsComplete &&
                (
                    <img src={loadingAnimation} style={{height: '2.75em', width: '2.75em', objectFit: 'contain',
                    pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%', transform:
                    'translate(-50%, -50%)'}}/>
                )
            }

            {(!isCurrentlyFetchingAdditionalLikers && additionalLikersFetchingErrorMessage.length>0) &&
                (
                    <p style={{width: '85%', color: 'gray', fontSize: '0.88em',
                    marginTop: '3.75em'}}>
                        {additionalLikersFetchingErrorMessage}
                    </p>
                )
            } 

            {isCurrentlyFetchingAdditionalLikers &&
                (
                    <img src={loadingAnimation} style={{height: '2em', width: '2em',
                    objectFit: 'contain', pointerEvents: 'none', marginTop: '3.75em'}}/>
                )
            }
        </div>
    );
}

export default LikersPopup;