import { useEffect, useState } from 'react';

import StoryViewer from '../components/storyViewer';
import ErrorPopup from '../components/errorPopup';

import defaultPfp from '../assets/images/defaultPfp.png';
import blackScreen from '../assets/images/blackScreen.png';

function StoryViewerPage({urlParams}) {
    const [authUser, setAuthUser] = useState('rishavry');
    const [storyViewerUsername, setStoryViewerUsername] = useState('');
    const [displayErrorPopup, setDisplayErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');
    const [usersAndTheirRelevantInfo, setUsersAndTheirRelevantInfo] = useState({});
    const [storyId, setStoryId] = useState('');
    const [usersAndTheirStories, setUsersAndTheirStories] = useState({});
    const [usersAndYourCurrSlideInTheirStories, setUsersAndYourCurrSlideInTheirStories] = useState({});
    const [idsOfStoriesMarkedAsViewed, setIdsOfStoriesMarkedAsViewed] = useState(new Set());
    const [storyFetchingError, setStoryFetchingError] = useState(false);
    const [storyFetchingIsComplete, setStoryFetchingIsComplete] = useState(false);

    useEffect(() => {
        document.title = "Stories";
        setStoryViewerUsername(urlParams.username);
        setStoryId(urlParams.storyId);
        return;

        if(localStorage.getItem("defaultAuthUser")!==null) {
            authenticateUser(localStorage.getItem("defaultAuthUser"));
        }
        else {
            window.location.href = "http://34.111.89.101/login"
        }
    }, []);

    useEffect(() => {
        if (authUser.length > 0) {
            fetchTheNecessaryUserData();
        }
    }, [authUser]);

    async function authenticateUser(username) {
        let authenticationFailed = false;
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/${username}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            if(!response.ok) {
                authenticationFailed = true;
                showErrorPopup('The server had trouble authenticating your login-session.');
            }
            else {
                localStorage.setItem('defaultAuthUser', username);
                setAuthUser(username);
            }
        }
        catch (error) {
            authenticationFailed = true;
            showErrorPopup('There was trouble connecting to the server to check if you are logged in.');
        }
        finally {
            if(authenticationFailed) {
                setTimeout(() => {
                    window.location.href = 'http://34.111.89.101/login';
                }, 3000);
            }
        }
    }

    async function fetchTheNecessaryUserData() {
        const newUsersAndTheirRelevantInfo = {};
        newUsersAndTheirRelevantInfo[storyViewerUsername] = {};

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsVerifiedStatusAndProfilePhotoOfUser/
            ${authUser}/${storyViewerUsername}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                console.error(`The server had trouble getting the isVerified status and profile-photo of
                ${storyViewerUsername}`);
                newUsersAndTheirRelevantInfo[storyViewerUsername].isVerified = false;
                newUsersAndTheirRelevantInfo[storyViewerUsername].profilePhoto = defaultPfp;
            }
            else {
                const userData = await response.json();
                newUsersAndTheirRelevantInfo[storyViewerUsername].isVerified = userData.isVerified;
                newUsersAndTheirRelevantInfo[storyViewerUsername].profilePhoto = userData.profilePhoto;
            }
        }
        catch (error) {
            console.error(
                `There was trouble connecting to the server to get the isVerified status and profile-photo of
                ${storyViewerUsername}`
            );
            newUsersAndTheirRelevantInfo[storyViewerUsername].isVerified = false;
            newUsersAndTheirRelevantInfo[storyViewerUsername].profilePhoto = defaultPfp;
        }
        finally {
            setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
        }

        setStoryFetchingIsComplete(true);
        return;
        const newUsersAndTheirStories = {};
        const newUsersAndYourCurrSlideInTheirStories = {};
        try {
            const response1 = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getStoriesOfUserGivenUsernameAndStoryId/
            ${authUser}/${storyViewerUsername}/${storyId}`, {
                credentials: 'include'
            });
            if (!response1.ok) {
                setStoryFetchingError(true);
                showErrorPopup('The server had trouble retrieving the stories');
            }
            else {
                const storyData = await response1.json();
                newUsersAndTheirStories[storyViewerUsername] = storyData.stories;
                newUsersAndYourCurrSlideInTheirStories[storyViewerUsername] = storyData.currSlide;

                setUsersAndTheirStories(newUsersAndTheirStories);
                setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
            }
        }
        catch (error) {
            setStoryFetchingError(true);
            showErrorPopup('There was trouble connecting to the server to retrieve the stories');
        }
        finally {
            setStoryFetchingIsComplete(true);
        }
    }

    function closeStoryViewer() {
        window.location.href = 'http://localhost:8004';
    }

    function showErrorPopup(errorMessage) {
        setErrorPopupMessage(errorMessage);
        setDisplayErrorPopup(true);
    }

    function closeErrorPopup() {
        setDisplayErrorPopup(false);

        if(storyFetchingError) {
            window.location.href = 'http://localhost:8004';
        }
    }

    function updateUsersAndTheirStories(newUsersAndTheirStories) {
        setUsersAndTheirStories(newUsersAndTheirStories);
    }

    function updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories) {
        setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
    }

    function addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newUsername) {
        //do nothing
    }

    function addStoryIdToSetOfViewedStoryIds(newStoryId) {
        setIdsOfStoriesMarkedAsViewed(new Set(
            [
                ...idsOfStoriesMarkedAsViewed, 
                newStoryId
            ]
        ));
    }

    return (
        <>
            {(storyFetchingIsComplete && !storyFetchingError) &&
                (
                    <StoryViewer
                        username={storyViewerUsername}
                        authUser={authUser}
                        notifyParentToCloseStoryViewer={closeStoryViewer}
                        zIndex={'1'}
                        usersAndTheirStories={usersAndTheirStories}
                        usersAndYourCurrSlideInTheirStories={usersAndYourCurrSlideInTheirStories}
                        orderedListOfUsernamesInStoriesSection={[]}
                        isFromStoriesSection={false}
                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                        notifyParentToShowErrorPopup={showErrorPopup}
                        notifyParentToUpdateUsersAndTheirStories={updateUsersAndTheirStories}
                        notifyParentToUpdateUsersAndYourCurrSlideInTheirStories={
                            updateUsersAndYourCurrSlideInTheirStories
                        }
                        usernamesWhoseStoriesYouHaveFinished={new Set()}
                        notifyParentToAddUsernameToSetOfUsersWhoseStoriesYouHaveFinished={
                            addUsernameToSetOfUsersWhoseStoriesYouHaveFinished
                        }
                        idsOfStoriesMarkedAsViewed={idsOfStoriesMarkedAsViewed}
                        notifyParentToAddStoryIdToSetOfViewedStoryIds={
                            addStoryIdToSetOfViewedStoryIds
                        }
                    />
                )
            }

            {displayErrorPopup &&
                (
                    <>
                        <img onClick={closeErrorPopup} src={blackScreen} style={{position: 'fixed', 
                        top: '0%', left: '0%', width: '100%', height: '100%', opacity: '0.7'}}/>

                        <div style={{position: 'fixed', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)'}}>
                            <ErrorPopup
                                errorMessage={errorPopupMessage} notifyParentToClosePopup={closeErrorPopup}
                            />
                        </div>
                    </>
                )
            }

        </>
    )
}

export default StoryViewerPage;