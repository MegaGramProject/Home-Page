import blackScreen from '../assets/images/blackScreen.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import mutedIcon from '../assets/images/mutedIcon.png';
import nextSlideArrow from '../assets/images/nextSlideArrow.png';
import notMutedIcon from '../assets/images/notMutedIcon.png';
import pauseIcon2 from '../assets/images/pauseIcon2.png';
import thinWhiteXIcon from '../assets/images/thinWhiteXIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';
import whitePlayIcon from '../assets/images/whitePlayIcon.png';
import whiteTrashIcon from '../assets/images/whiteTrashIcon.png';
import defaultVideoFrame from '../assets/images/defaultVideoFrame.jpg';

import { useEffect, useRef, useState } from 'react';


function StoryViewer({authUserId, authUsername, authUsernameWasProvidedInRoute, storyAuthorUsername, storyAuthorId, zIndex,
orderedListOfUserIdsInStoriesSection, orderedListOfUsernamesInStoriesSection, orderedListOfSponsorshipStatusesInStoriesSection,
isFromStoriesSection, usersAndTheirStories, usersAndTheirStoryPreviews, usersAndYourCurrSlideInTheirStories,
vidStoriesAndTheirPreviewImages, usersAndTheirRelevantInfo, usernamesWhoseStoriesYouHaveFinished,
updateUsersAndTheirStories, updateUsersAndTheirStoryPreviews, updateUsersAndYourCurrSlideInTheirStories,
updateVidStoriesAndTheirPreviewImages, addUsernameToSetOfUsersWhoseStoriesYouHaveFinished, closeStoryViewer, showErrorPopup}) {
    const [currStoryAuthorUsername, setCurrStoryAuthorUsername] = useState('');
    const [currStoryAuthorId, setCurrStoryAuthorId] = useState(-1);

    const [currStories, setCurrStories] = useState([]);
    const [currSlide, setCurrSlide] = useState(-1);
    const [currIndexInStoriesSection, setCurrIndexInStoriesSection] = useState(-1);
    const [numSlides, setNumSlides] = useState(-1);
    
    const [currSlideProgressPercent, setCurrSlideProgressPercent] = useState(-1);
    const [rateOfStoryProgression, setRateOfStoryProgression] = useState(-1);
    const [intervalIdForStoryProgression, setIntervalIdForStoryProgression] = useState(null);

    const [displaySentText, setDisplaySentText] = useState(false);

    const [replyToStoryTextareaIsActive, setReplyToStoryTextareaIsActive] = useState(false);
    const [replyToStoryInput, setReplyToStoryInput] = useState('');

    const [isMuted, setIsMuted] = useState(true);
    const [isCurrentlyFetchingStory, setIsCurrentlyFetchingStory] = useState(false);
    
    const [storyFetchingErrorMessage, setStoryFetchingErrorMessage] = useState('');
    
    const videoSlideRef = useRef(null);


    useEffect(() => {
        setCurrStoryAuthorUsername(storyAuthorUsername);
        setCurrStoryAuthorId(storyAuthorId);

        window.addEventListener('keydown', handleKeyDownEvents);

        return () => {
            window.removeEventListener('keydown', handleKeyDownEvents);
        };
    }, []);


    useEffect(() => {
        if (currStoryAuthorUsername.length>0) {
            setNumSlides(0);

            if(isFromStoriesSection) {
                const newCurrIndexInStoriesSection = orderedListOfUsernamesInStoriesSection.indexOf(
                    currStoryAuthorUsername
                );
                setCurrIndexInStoriesSection(newCurrIndexInStoriesSection);
                setCurrStoryAuthorId(orderedListOfUserIdsInStoriesSection[newCurrIndexInStoriesSection]);

                fetchTheNecessaryStories(
                    newCurrIndexInStoriesSection,
                    orderedListOfUserIdsInStoriesSection[newCurrIndexInStoriesSection]
                );
            }
            else {
                for(let userId of Object.keys(usersAndTheirRelevantInfo)) {
                    if('username' in usersAndTheirRelevantInfo[userId] && usersAndTheirRelevantInfo[userId].username ===
                    currStoryAuthorUsername) {
                        setCurrStoryAuthorId(userId);

                        fetchTheNecessaryStories(-1, userId);
                        break;
                    }
                }
            }
        }
    }, [currStoryAuthorUsername]);


    useEffect(() => {
        setNumSlides(currStories.length);
    }, [currStories]);


    useEffect(() => {
        clearInterval(intervalIdForStoryProgression);

        if(rateOfStoryProgression>0) {
            setIntervalIdForStoryProgression(
                setInterval(updateStoryProgression, 25)
            );
        }
        else {
            setIntervalIdForStoryProgression(null);
        }
    }, [rateOfStoryProgression]);


    useEffect(() => {
        if (currSlideProgressPercent >= 100) {
            setCurrSlide(currSlide + 1);
            handleChangeInStory(currStories, currSlide + 1);
        }
    }, [currSlideProgressPercent]);


    //the method below is called right after the value of currSlide/currStories changes.
    async function handleChangeInStory(currStoriesValue, currSlideValue) {
        setRateOfStoryProgression(0);
        setCurrSlideProgressPercent(0);

        let currStoryAuthorUsernameValue = currStoryAuthorUsername;
        let currStoryAuthorIdValue = currStoryAuthorId;
        let currIndexInStoriesSectionValue = currIndexInStoriesSection;

        let newUsersAndYourCurrSlideInTheirStories = {...usersAndYourCurrSlideInTheirStories};

        if(currSlideValue >= currStoriesValue.length) {
            newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = 0;
            updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

            if (!(usernamesWhoseStoriesYouHaveFinished.has(currStoryAuthorUsernameValue))) {
                addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(currStoryAuthorUsernameValue);
            }

            if (isFromStoriesSection && currIndexInStoriesSectionValue + 1 < orderedListOfUsernamesInStoriesSection.length) {
                currStoryAuthorUsernameValue = orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 1];
                setCurrStoryAuthorUsername(currStoryAuthorUsernameValue);
            }
            else {
                closeStoryViewer();
            }
        }
        else if (currSlideValue > -1) {
            const currStoryId = currStoriesValue[currSlideValue].id;

            if(authUsernameWasProvidedInRoute) {
                window.history.pushState(
                    { page: 'stories' },
                    'Stories',
                    `/stories/${authUsername}/${currStoryId}`
                );
            }
            else {
                window.history.pushState(
                    { page: 'stories' },
                    'Stories',
                    `/stories/${currStoryId}`
                );
            }

            addViewToStory(currStoryId);
    
            if(currStoriesValue[currSlideValue].vidDurationInSeconds==null) {
                setRateOfStoryProgression(0.5);
            } 
            else {
                setRateOfStoryProgression(2.5/currStoriesValue[currSlideValue].vidDurationInSeconds);
            }

            const yourNextSlideOfCurrStoryAuthor = currSlideValue + 1 < currStoriesValue.length ? currSlideValue + 1 : 0;

            newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = yourNextSlideOfCurrStoryAuthor;     
            updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

            const yourNextStoryOfCurrStoryAuthor = currStoriesValue[yourNextSlideOfCurrStoryAuthor];
            const newUsersAndTheirStoryPreviews = {...usersAndTheirStoryPreviews};

            if (yourNextStoryOfCurrStoryAuthor.vidDurationInSeconds == null) {
                newUsersAndTheirStoryPreviews[currStoryAuthorIdValue] = yourNextStoryOfCurrStoryAuthor.src;
            }
            else {
                if (!(yourNextStoryOfCurrStoryAuthor.id in vidStoriesAndTheirPreviewImages)) {
                    const newVidStoriesAndTheirFirstFrames = {...vidStoriesAndTheirPreviewImages};
                    newVidStoriesAndTheirFirstFrames[yourNextStoryOfCurrStoryAuthor.id] = await getFirstFrameForPreviewImgOfVid(
                        yourNextStoryOfCurrStoryAuthor.src
                    );
                    updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirFirstFrames);
                }

                newUsersAndTheirStoryPreviews[currStoryAuthorIdValue] = vidStoriesAndTheirPreviewImages[
                    yourNextStoryOfCurrStoryAuthor.id
                ];
            }

            updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews);
        }
        else if (isFromStoriesSection && currIndexInStoriesSectionValue - 1 > -1) {
            currStoryAuthorUsernameValue = orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 1];
            setCurrStoryAuthorUsername(currStoryAuthorUsernameValue);
        }
        else {
            closeStoryViewer();
        }
    }


    function updateStoryProgression() {
        setCurrSlideProgressPercent((currentCurrSlideProgressPercent) => {
            if (currentCurrSlideProgressPercent + rateOfStoryProgression > 100) {
                return 100;
            }
            return currentCurrSlideProgressPercent + rateOfStoryProgression;
        });
    }


    function incrementOrDecrementSlideByOne(incrementOrDecrementText) {
        if (incrementOrDecrementText === 'increment') {
            setCurrSlide(currSlide + 1);
            handleChangeInStory(currStories, currSlide + 1);
        }
        else {
            setCurrSlide(currSlide - 1);
            handleChangeInStory(currStories, currSlide - 1);
        }
    }


    function takeAuthUserToTheSelectedUsersStoryInStorySection(newCurrIndexInStoriesSection) {
        setCurrStoryAuthorUsername(orderedListOfUsernamesInStoriesSection[newCurrIndexInStoriesSection]);
    }


    function togglePause() {
        if(rateOfStoryProgression == 0) {
            resumeStoryProgression();
        }
        else {
            pauseStoryProgression();
        }
    }


    function pauseStoryProgression() {
        setRateOfStoryProgression(0);

        if(videoSlideRef.current) {
            videoSlideRef.current.pause();
        }
    }


    function resumeStoryProgression() {
        if(currStories[currSlide].vidDurationInSeconds==null) {
            setRateOfStoryProgression(0.5);
        }
        else {
            setRateOfStoryProgression(2.5/currStories[currSlide].vidDurationInSeconds);

            if(videoSlideRef.current) {
                videoSlideRef.current.play();
            }
        }
    }


    function updateReplyToStoryInput(event) {
        setReplyToStoryInput(event.target.value);
    }


    function formatDatetimeString(datetimeString) {
        const givenDatetime = new Date(datetimeString);
        const currentDatetime = new Date();
        const secondsDiff = Math.floor((currentDatetime - givenDatetime) / 1000);
    
        if (secondsDiff < 60) {
            return `${secondsDiff}s`;
        }
        else {
            const minutesDiff = Math.floor(secondsDiff / 60);
            if (minutesDiff < 60) {
                return `${minutesDiff}m`;
            } 
            else {
                const hoursDiff = Math.floor(minutesDiff / 60);
                if (hoursDiff < 24) {
                    return `${hoursDiff}h`;
                }
                else {
                    const daysDiff = Math.floor(hoursDiff/24);
                    if (daysDiff < 7) {
                        return `${daysDiff}d`;
                    }
                    else {
                        const weeksDiff = Math.floor(daysDiff / 7);
                        if (weeksDiff < 4) {
                            return `${weeksDiff}w`;
                        }
                        else {
                            const monthsDiff = Math.floor(daysDiff/30.417);
                            if (monthsDiff < 12) {
                                return `${monthsDiff}mo`;
                            }
                            else {
                                const yearsDiff = Math.floor(monthsDiff/12);
                                return `${yearsDiff}y`;
                            }
                        }
                    }
                }
            }
        }
    }


    function toggleIsMuted() {
        if (videoSlideRef.current) {
            videoSlideRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }


    function convertByteArrayToBase64String(byteArray) {
        const binaryString = String.fromCharCode(...byteArray);
        return btoa(binaryString);
    }


    async function getFirstFrameForPreviewImgOfVid(videoBase64String) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.src = videoBase64String;


            video.addEventListener('loadeddata', () => {
                video.currentTime = 0;
            });


            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageDataURL = canvas.toDataURL('image/png');
                resolve(imageDataURL);
            });


            video.onerror = (e) => {
                e;
                reject(new Error('Error loading video'));
            };
        });
    }


    function handleOnBlurOfReplyToStoryTextInput() {
        setTimeout(() => setReplyToStoryTextareaIsActive(false), 300);
        resumeStoryProgression();
    }


    function handleKeyDownEvents(event) {
        switch (event.key) {
            case 'Escape':
                closeStoryViewer();
                break;
            case 'ArrowLeft':
                incrementOrDecrementSlideByOne('decrement');
                break;
            case 'ArrowRight':
                incrementOrDecrementSlideByOne('increment');
                break;
            case 'ArrowUp':
                incrementOrDecrementSlideByOne('decrement');
                break;
            case 'ArrowDown':
                incrementOrDecrementSlideByOne('increment');
                break;
            case 'm':
            case 'M':
                if (!replyToStoryTextareaIsActive) {
                    toggleIsMuted();
                }
                break;
            case 'k':
            case 'K':
                if (!replyToStoryTextareaIsActive) {
                    togglePause();
                }
                break;
            case ' ':
                togglePause();
                break;
        }
    }


    async function addViewToStory(storyId) {
        if (authUserId == -1) {
            return;
        } 

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/addViewToStory/${authUserId}/${storyId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                console.error(`The springBootBackend2 server had trouble mark story ${storyId} as viewed`);
            }
        }
        catch (error) {
            console.error(`There was trouble connecting to the springBootBackend2 server to mark story ${storyId} as viewed`);
        }
    }


    async function sendReplyToStory(replyToSend) {
        if (replyToSend.length == 0) {
            return;
        }

        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to send replies to stories');
            return;
        } 

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/sendMessageToOneOrMoreUsersAndGroups/${authUserId}
            /individually`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    messageToSend: `Replied to story ${currStories[currSlide].id}: ${replyToSend}`,
                    usersAndGroupsToSendTo: [`user/${currStoryAuthorId}`]
                }),
                credentials: 'include'
            });
            if (!response.ok) {
                showErrorPopup(
                    'The server had trouble sending your reply to this story'
                );
            }
            else {
                setReplyToStoryInput('');
                setDisplaySentText(true);
                setTimeout(() => setDisplaySentText(false), 850);

                setReplyToStoryTextareaIsActive(false);
                resumeStoryProgression();
            }
        }
        catch (error) {
            showErrorPopup(
                'There was trouble connecting to the server to send your reply to this story'
            );
        }
    }


    async function deleteStory() {
        let idOfStoryToDelete = currStories[currSlide].id;

        try { 
            const response = await fetch(
            `http:/34.111.89.101/api/Home-Page/springBootBackend2/deleteStory/${authUserId}/${idOfStoryToDelete}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                showErrorPopup('The server had trouble deleting this story of yours');
            }
            else {
                const newCurrStories = currStories.filter(story => story.id !== idOfStoryToDelete);
                setCurrStories(newCurrStories);

                const newUsersAndTheirStories = {...usersAndTheirStories};
                newUsersAndTheirStories[authUserId] = newCurrStories;
                updateUsersAndTheirStories(newUsersAndTheirStories);

                handleChangeInStory(newCurrStories, currSlide);
            }
        }
        catch (error) {
            showErrorPopup('There was trouble connecting to the server to delete this story of yours');
        }
    }


    async function fetchTheNecessaryStories(currIndexInStoriesSectionValue, currStoryAuthorIdValue) {
        const newUsersAndYourCurrSlideInTheirStories = {...usersAndYourCurrSlideInTheirStories};

        if (isFromStoriesSection) {
            const userIdsNeededForStoryPreviewFetching = [];
            const userIdsAndTheirUsernames = {};
            const storySponsorshipStatusesForUsers = [];

            if (currIndexInStoriesSectionValue + 1 < orderedListOfUserIdsInStoriesSection.length &&
            !(orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 1] in usersAndTheirStoryPreviews)) {
                const userId = orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 1];
                const storySponsorshipStatus = orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue + 1
                ];
                const username =  orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 1];

                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }

            if (currIndexInStoriesSectionValue + 2 < orderedListOfUserIdsInStoriesSection.length &&
            !(orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 2] in usersAndTheirStoryPreviews)) {
                const userId = orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 2];
                const storySponsorshipStatus = orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue + 2
                ];
                const username =  orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 2];

                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }

            if (currIndexInStoriesSectionValue - 1 > -1 &&
            !(orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 1] in usersAndTheirStoryPreviews)) {
                const userId = orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 1];
                const storySponsorshipStatus = orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue - 1
                ];
                const username =  orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 1];

                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }

            if (currIndexInStoriesSectionValue - 2 > -1 &&
            !(orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 2] in usersAndTheirStoryPreviews)) {
                const userId = orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 2];
                const storySponsorshipStatus = orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue - 2
                ];
                const username =  orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 2];
                
                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }
            
            if (userIdsNeededForStoryPreviewFetching.length>0) {
                try {
                    const response = await fetch(
                    `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoryPreviewsOfAtMost4Users/${authUserId}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userIds: userIdsNeededForStoryPreviewFetching,
                            storySponsorshipStatusesForUsers: storySponsorshipStatusesForUsers
                        }),
                        credentials: 'include'
                    });
                    if (!response.ok) {
                        console.error('The server had trouble providing some of the required story-previews');
                    }
                    else {
                        let responseData = await response.json();
                        let usersAndTheirStoryPreviewInfo = responseData.usersAndTheirStoryPreviewInfo;

                        const newUsersAndTheirStoryPreviews = {...usersAndTheirStoryPreviews};

                        for(let userId of Object.keys(usersAndTheirStoryPreviewInfo)) {
                            const userStoryPreviewInfo = usersAndTheirStoryPreviewInfo[userId];
                            const storyId = userStoryPreviewInfo.storyId;
                            const storyFileType = userStoryPreviewInfo.storyFileType;
                            const storyFileBuffer = userStoryPreviewInfo.storyFileBuffer;

                            if (storyFileType === 'image') {
                                newUsersAndTheirStoryPreviews[userId] = storyFileBuffer;
                            }
                            else {
                                const newVidStoriesAndTheirFirstFrames = {...vidStoriesAndTheirPreviewImages};
                                newVidStoriesAndTheirFirstFrames[storyId] = await getFirstFrameForPreviewImgOfVid(
                                    convertByteArrayToBase64String(storyFileBuffer)
                                );
                                updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirFirstFrames);

                                newUsersAndTheirStoryPreviews[userId] = newVidStoriesAndTheirFirstFrames[storyId];
                            }
                        }

                        updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews);
                    }
                }
                catch (error) {
                    console.error('There was trouble connecting to the server to provide some of the required story-previews');
                }
            }
        }

        const currStoryAuthorIdValue = currStoryAuthorId;
        const currStoryAuthorUsernameValue = currStoryAuthorUsername;
        const authUserIdValue = authUserId;

        if(!(currStoryAuthorIdValue in usersAndTheirStories)) {
            let onlyShowSponsoredStories = false;
            if (isFromStoriesSection && orderedListOfSponsorshipStatusesInStoriesSection[currIndexInStoriesSectionValue] == true) {
                onlyShowSponsoredStories = true;
            }

            try {
                const response1 = await fetch(
                `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoriesOfUser/${authUserIdValue}
                /${currStoryAuthorIdValue}/true/${onlyShowSponsoredStories}`, {
                    credentials: 'include'
                });

                if (!response1.ok) {
                    setStoryFetchingErrorMessage(
                        `The server had trouble getting the stories of ${currStoryAuthorUsernameValue}`
                    );
                }
                else {
                    const userStoryData = await response1.json();

                    userStoryData.stories = userStoryData.stories.map(userStory => {
                        userStory.datetime = formatDatetimeString(userStory.datetime);
                        return userStory
                    });

                    const newUsersAndTheirStories = {...usersAndTheirStories};
                    newUsersAndTheirStories[currStoryAuthorIdValue] = userStoryData.stories;
                    updateUsersAndTheirStories(newUsersAndTheirStories);

                    setCurrStories(userStoryData.stories);

                    if (userStoryData.currSlide === 'finished') {
                        setCurrSlide(0);

                        newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = 0;

                        addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(currStoryAuthorUsernameValue);

                        handleChangeInStory(userStoryData.stories, 0);
                    }
                    else if (userStoryData.currSlide == -1) {
                        setStoryFetchingErrorMessage(
                            `User ${currStoryAuthorUsernameValue} does not currently have any unexpired stories`
                        );
                    }
                    else {
                        setCurrSlide(userStoryData.currSlide);

                        newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = userStoryData.currSlide;

                        handleChangeInStory(userStoryData.stories, userStoryData.currSlide);
                    }
                }
            }
            catch (error) {
                setStoryFetchingErrorMessage(
                    `There was trouble connecting to the server to get the stories of ${currStoryAuthorUsernameValue}`
                );  
            }
        }
        else {
            setCurrStories(usersAndTheirStories[currStoryAuthorIdValue]);
            setCurrSlide(usersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue]);

            handleChangeInStory(
                usersAndTheirStories[currStoryAuthorIdValue],
                usersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue]
            );
        }

        updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

        setIsCurrentlyFetchingStory(false);
    }


    return (
        <div style={{position: 'fixed', height: '100%', width: '100%', top: '0%', left: '0%',
        backgroundColor: '#1c1c1c', color: 'white', zIndex: zIndex}}>
            <p onClick={closeStoryViewer} className="loseOpacityWhenActive"
            style={{position: 'absolute', top: '2%', left: '1%', fontFamily: 'Billabong', fontSize: '2.1em',
            cursor: 'pointer', marginTop: '0em'}}>
                Megagram
            </p>

            <img onClick={closeStoryViewer} src={thinWhiteXIcon} className="loseOpacityWhenActive"
            style={{position: 'absolute', top: '1%', right: '0%', cursor: 'pointer', height: '3.5em', width: '3.5em',
            objectFit: 'contain'}}/>

            <div style={{position: 'absolute', top: '2%', left: '35%', height: '95%', width: '30%',
            borderRadius: '1%'}}>
                {(numSlides > 0 && currSlide < numSlides && currSlide > -1) &&
                    (
                        <>
                            {currStories[currSlide].vidDurationInSeconds == null &&
                                (
                                    <img src={currStories[currSlide].src} style={{position: 'absolute', left: '0%',
                                    top: '0%', height: '100%', width: '100%', borderRadius: '1%', zIndex: '1'}}/>
                                )
                            }

                            {currStories[currSlide].vidDurationInSeconds !== null &&
                                (
                                    <video ref={videoSlideRef} src={currStories[currSlide].src} autoPlay
                                    muted={isMuted} style={{position: 'absolute', left: '0%', top: '0%', height: '100%',
                                    width: '100%', borderRadius: '1%', zIndex: '1'}}/>
                                )
                            }
                        </>
                    )
                }

                {numSlides == 0 &&
                    (
                        <div style={{position: 'absolute', left: '0%', top: '0%', height: '100%',
                        width: '100%', backgroundColor: 'black', color: 'white', zIndex: '1'}}>
                            {storyFetchingErrorMessage.length > 0 &&
                                (
                                    <p style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                                    maxWidth: '75%'}}>
                                        {storyFetchingErrorMessage}
                                    </p>
                                )
                            }

                            {isCurrentlyFetchingStory &&
                                (
                                    <img src={loadingAnimation} style={{pointerEvents: 'none', height: '2em', width:
                                    '2em', objectFit: 'contain', position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%,-50%)'}}/>
                                )
                            }
                        </div>
                    )
                }

                {(currSlide > 0 || (isFromStoriesSection && currIndexInStoriesSection > 0)) &&
                    (
                        <img src={nextSlideArrow} className="storyViewerSlideArrows"
                        onClick={() => incrementOrDecrementSlideByOne('decrement')}
                        style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                        objectFit: 'contain', position: 'absolute', left: '-5%', top: '50%',
                        transform: 'translate(-50%, -50%) rotate(180deg)', filter: 'brightness(5) contrast(0)',
                        zIndex: '1'}}/>
                    )
                }

                {(currSlide + 1 < numSlides || (isFromStoriesSection && currIndexInStoriesSection + 1 <
                orderedListOfUsernamesInStoriesSection.length)) &&
                    (
                        <img src={nextSlideArrow} className="storyViewerSlideArrows"
                        onClick={() => incrementOrDecrementSlideByOne('increment')}
                        style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                        objectFit: 'contain', position: 'absolute', right: '-12%', top: '50%',
                        transform: 'translate(-50%, -50%)', filter: 'brightness(5) contrast(0)', zIndex: '1'}}/>
                    )
                }
                
                {replyToStoryTextareaIsActive &&
                    (
                        <img src={blackScreen} style={{position: 'absolute', left: '0%', top: '0%', height: '100%',
                        width: '100%', borderRadius: '1%', zIndex: '2', pointerEvents: 'none', opacity: '0.7'}}/>
                    ) 
                }

                {displaySentText &&
                    (
                        <p style={{backgroundColor: '#1c1c1c', color: 'white', padding: '0.8em 1.5em', position: 'absolute',
                        top: '45%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: '2', borderRadius: '0.5em',
                        fontSize: '1.1em', pointerEvents: 'none'}}>
                            Sent
                        </p>
                    )
                }

                <div style={{display: 'flex', flexDirection: 'column', marginTop: '1em', gap: '1em'}}>
                    {numSlides > 0 &&
                        (
                            <div style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center',
                            gap: `${2/(numSlides-1)}%`, zIndex: '2'}}>
                                {[...Array(numSlides)].map((_, index) => (
                                    <div key={index} style={{width: `${90/numSlides}%`,
                                    height: '3px', backgroundColor: '#918f8e'}}>
                                        <div style={{width: `${
                                            currSlide > index ? 100 : 
                                            currSlide == index ? currSlideProgressPercent : 0
                                        }%`, height: '100%', backgroundColor: 'white'}}> 
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }

                    <div style={{display: 'flex', justifyContent: 'space-between', width: '95%', alignItems: 'start',
                    marginLeft: '2.5%', marginRight: '2.5%', zIndex: '2'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.85em'}}>
                            <a href={`http://34.111.89.101/profile/${currStoryAuthorUsername}`} target="_blank"
                            rel="noopener noreferrer">
                                <img src={
                                    (currStoryAuthorId in usersAndTheirRelevantInfo &&
                                    'profilePhoto' in usersAndTheirRelevantInfo[currStoryAuthorId]) ?
                                    usersAndTheirRelevantInfo[currStoryAuthorId].profilePhoto :
                                    defaultPfp
                                }
                                style={{height: '3em', width: '3em', pointerEvents: 'none', objectFit: 'contain', marginLeft:
                                '0.5em'}}/>
                            </a>

                            <a href={`http://34.111.89.101/profile/${currStoryAuthorUsername}`} style={{color: 'white',
                            textAlign: 'start', maxWidth: '9em', overflowWrap: 'break-word'}}
                            target="_blank" rel="noopener noreferrer">
                                {currStoryAuthorUsername}
                            </a>

                            {(currStoryAuthorId in usersAndTheirRelevantInfo && 'isVerified' in
                            usersAndTheirRelevantInfo[currStoryAuthorId] && usersAndTheirRelevantInfo[currStoryAuthorId]
                            .isVerified) &&
                                (
                                    <img src={verifiedBlueCheck} style={{height: '1.58em', width: '1.58em', marginLeft: '-0.6em',
                                    pointerEvents: 'none', objectFit: 'contain'}}/>
                                )
                            }

                            {(numSlides > 0 && currSlide < numSlides && currSlide > -1) &&
                                (
                                    <>
                                        <span style={{color: 'lightgray', marginRight: '-0.3em', marginLeft: '-0.3em'}}>
                                            •
                                        </span>
            
                                        <span style={{color: 'lightgray'}}>
                                            {currStories[currSlide].datetime}
                                        </span>
                                    </>
                                )
                            }
                        </div>

                        {(numSlides > 0 && currSlide < numSlides && currSlide > -1) &&
                            (
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.7em'}}>
                                    {(isMuted && currStories[currSlide].vidDurationInSeconds !== null) &&
                                        (
                                            <img className="loseOpacityWhenActive" onClick={toggleIsMuted} src={mutedIcon}
                                            style={{height: '1.85em', width: '1.85em', cursor: 'pointer',
                                            objectFit: 'contain'}}
                                            />
                                        )
                                    }
        
                                    {(!isMuted && currStories[currSlide].vidDurationInSeconds !== null) &&
                                        (
                                            <img className="loseOpacityWhenActive" onClick={toggleIsMuted} src={notMutedIcon}
                                            style={{height: '1.85em', width: '1.85em', cursor: 'pointer',
                                            objectFit: 'contain'}}
                                            />
                                        )
                                    }
        
                                    {rateOfStoryProgression>0 &&
                                        (
                                            <img className="loseOpacityWhenActive" onClick={togglePause} src={pauseIcon2}
                                            style={{cursor: 'pointer', height: '1.5em', width: '1.5em', objectFit: 'contain'}}/>
                                        )
                                    }
        
                                    {rateOfStoryProgression==0 &&
                                        (
                                            <img className="loseOpacityWhenActive" onClick={togglePause} src={whitePlayIcon}
                                            style={{cursor: 'pointer', height: '2em', width: '2em', objectFit: 'contain'}}/>
                                        )
                                    }

                                    {authUserId == currStoryAuthorId &&
                                        (
                                            <img className="loseOpacityWhenActive" onClick={deleteStory} src={whiteTrashIcon}
                                            style={{cursor: 'pointer', height: '1.3em', width: '1.3em', objectFit: 'contain'}}/>
                                        )
                                    }
                                </div>
                            )
                        }
                    </div>

                    {(numSlides>0 && currSlide > -1 && currSlide < currStories.length &&
                    currStories[currSlide].adInfo !== null) &&
                        (
                            <a href={currStories[currSlide].adInfo.link} target="_blank" rel="noopener noreferrer"
                            style={{color: 'white', marginTop: '0em', maxWidth: '65%', textAlign: 'start', zIndex: '2',
                            marginLeft: '1.5em', overflowWrap: 'break-word', fontSize: '0.93em'}}>
                                <b>Sponsored: </b> {currStories[currSlide].adInfo.callToAction}
                            </a>
                        )
                    }
                </div>

                {(replyToStoryTextareaIsActive && replyToStoryInput.length == 0) &&
                    
                    (
                        <div style={{position: 'absolute', bottom: '10%', left: '0%', width: '100%', height: '20%',
                        zIndex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        color: 'white'}}>
                            <h2>Quick Reactions</h2>

                            <div style={{display: 'flex', alignItems: 'center', gap: '1em', width: '100%', marginTop:
                            '-1em', justifyContent: 'center'}}>
                                <p onClick={() => sendReplyToStory('😂')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    😂
                                </p>

                                <p onClick={() => sendReplyToStory('😍')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    😍
                                </p>

                                <p onClick={() => sendReplyToStory('🥳')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    🥳
                                </p>

                                <p onClick={() => sendReplyToStory('😎')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    😎
                                </p>

                                <p onClick={() => sendReplyToStory('😡')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    😡
                                </p>

                                <p onClick={() => sendReplyToStory('🥺')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    🥺
                                </p>

                                <p onClick={() => sendReplyToStory('😢')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    😢
                                </p>

                                <p onClick={() => sendReplyToStory('😮')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    😮
                                </p>

                                <p onClick={() => sendReplyToStory('💯')} style={{fontSize: '2em', cursor: 'pointer'}}>
                                    💯
                                </p>
                            </div>
                        </div>
                    )
                }

                {(numSlides > 0 && authUserId !== currStoryAuthorId) &&
                    (
                        <div style={{position: 'absolute', bottom: '0.5%', left: '0%', width: '100%', height: '10%',
                        zIndex: '2', display: 'flex', gap: '2em', justifyContent: 'center', alignItems: 'center'}}>
                            <input value={replyToStoryInput} onChange={updateReplyToStoryInput}
                            onFocus={() => {
                                pauseStoryProgression();
                                setReplyToStoryTextareaIsActive(true);
                            }}
                            onBlur={handleOnBlurOfReplyToStoryTextInput} 
                            placeholder={`Reply to @${currStoryAuthorUsername}...`}
                            style={{width: '66%', borderRadius: '2em', fontFamily: 'Arial', outline: 'none',
                            resize: 'none', backgroundColor:'black', borderColor: 'white', color: 'white',
                            height: '3.5em', paddingLeft: '1em', fontSize: '0.95em'}}/>

                            <button onClick={() => sendReplyToStory(replyToStoryInput)}
                            style={{padding: '0.8em 0.5em', width: '6em', backgroundColor: '#4aa4ff',
                            color: 'white', cursor: replyToStoryInput.length > 0 ? 'pointer' : '',
                            borderRadius: '0.5em', border: 'none', fontWeight: 'bold',
                            opacity: replyToStoryInput.length > 0 ? '1' : '0.5'}}>
                                Send
                            </button>
                        </div>
                    )
                }
            </div>


            {isFromStoriesSection &&
                (
                    <>
                        <div style={{position: 'absolute', top: '50%', left: '6%', height: '40%', width: '25%',
                        transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '3em',
                        justifyContent: 'end', color: 'white'}}>

                            {[2, 1].filter(value => currIndexInStoriesSection - value > -1).map((absoluteDiff) => (
                                <div key={absoluteDiff} onClick={() =>
                                    {
                                        takeAuthUserToTheSelectedUsersStoryInStorySection(
                                            currIndexInStoriesSection - absoluteDiff
                                        );
                                    }
                                }
                                style={{borderRadius: '5%', height: '90%', width: '45%', cursor: 'pointer',
                                position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                    <img src={orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff] in
                                    usersAndTheirStoryPreviews ? usersAndTheirStoryPreviews[
                                        orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]
                                    ] :  defaultVideoFrame}
                                    style={{position: 'absolute', top: '0%', left: '0%',
                                    height: '100%', width: '100%', borderRadius: '5%', zIndex: '1', objectFit: 'cover'}}/>
    
                                    <img src={blackScreen} style={{position: 'absolute', top: '0%', left: '0%',
                                    height: '100%', width: '100%', opacity: '0.7', borderRadius: '5%',
                                    zIndex: '2'}}/>
    
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: '2',
                                    gap: '0.3em'}}>
                                        <img src={
                                            (
                                                orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff] in
                                                usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[
                                                    orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]
                                                ]
                                            ) ?
                                            usersAndTheirRelevantInfo[
                                                orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]
                                            ].profilePhoto : defaultPfp
                                        } 
                                        style={{height: '3.8em', width: '3.8em', objectFit: 'contain'}}/>

                                        <b style={{marginTop:'0.5em', marginBottom: '-1em', overflowWrap: 'break-word',
                                        maxWidth: '7em'}}>
                                            {
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection - absoluteDiff
                                                ]
                                            }
                                        </b>

                                        {(orderedListOfUserIdsInStoriesSection[
                                            currIndexInStoriesSection - absoluteDiff
                                        ] in usersAndTheirStories) &&
                                            (
                                                <p style={{fontSize: '0.90em', overflowWrap: 'break-word',
                                                maxWidth: '4em'}}>
                                                    {
                                                        
                                                        usersAndTheirStories[
                                                            orderedListOfUserIdsInStoriesSection[
                                                                currIndexInStoriesSection - absoluteDiff
                                                            ]
                                                        ][
                                                            usersAndYourCurrSlideInTheirStories[
                                                                orderedListOfUserIdsInStoriesSection[
                                                                    currIndexInStoriesSection - absoluteDiff
                                                                ]
                                                            ]
                                                        ].datetime
                                                    
                                                    }
                                                </p>
                                            )
                                        }

                                        {(orderedListOfSponsorshipStatusesInStoriesSection[
                                            currIndexInStoriesSection - absoluteDiff
                                        ] == true) &&
                                            (
                                                <b style={{marginTop: '1.5em'}}>Sponsored</b>
                                            )
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{position: 'absolute', top: '50%', right: '6%', height: '40%', width: '25%',
                        transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '3em',
                        justifyContent: 'start', color: 'white'}}>
                            {[1, 2].filter(value => currIndexInStoriesSection + value < orderedListOfUserIdsInStoriesSection
                            .length).map((absoluteDiff) => (
                                <div key={absoluteDiff} onClick={() =>
                                    {
                                        takeAuthUserToTheSelectedUsersStoryInStorySection(
                                            currIndexInStoriesSection + absoluteDiff
                                        );
                                    }
                                }
                                style={{borderRadius: '5%', height: '90%', width: '45%', cursor: 'pointer',
                                position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                    <img src={orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff] in
                                    usersAndTheirStoryPreviews ? usersAndTheirStoryPreviews[
                                        orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]
                                    ] :  defaultVideoFrame}
                                    style={{position: 'absolute', top: '0%', left: '0%',
                                    height: '100%', width: '100%', borderRadius: '5%', zIndex: '1', objectFit: 'cover'}}/>
    
                                    <img src={blackScreen} style={{position: 'absolute', top: '0%', left: '0%',
                                    height: '100%', width: '100%', opacity: '0.7', borderRadius: '5%',
                                    zIndex: '2'}}/>
    
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: '2',
                                    gap: '0.3em'}}>
                                        <img src={
                                            (
                                                orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff] in
                                                usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[
                                                    orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]
                                                ]
                                            ) ?
                                            usersAndTheirRelevantInfo[
                                                orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]
                                            ].profilePhoto : defaultPfp
                                        } 
                                        style={{height: '3.8em', width: '3.8em', objectFit: 'contain'}}/>

                                        <b style={{marginTop:'0.5em', marginBottom: '-1em', overflowWrap: 'break-word',
                                        maxWidth: '7em'}}>
                                            {
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection + absoluteDiff
                                                ]
                                            }
                                        </b>

                                        {(orderedListOfUserIdsInStoriesSection[
                                            currIndexInStoriesSection + absoluteDiff
                                        ] in usersAndTheirStories) &&
                                            (
                                                <p style={{fontSize: '0.90em', overflowWrap: 'break-word',
                                                maxWidth: '4em'}}>
                                                    {
                                                        
                                                        usersAndTheirStories[
                                                            orderedListOfUserIdsInStoriesSection[
                                                                currIndexInStoriesSection + absoluteDiff
                                                            ]
                                                        ][
                                                            usersAndYourCurrSlideInTheirStories[
                                                                orderedListOfUserIdsInStoriesSection[
                                                                    currIndexInStoriesSection + absoluteDiff
                                                                ]
                                                            ]
                                                        ].datetime
                                                    
                                                    }
                                                </p>
                                            )
                                        }

                                        {(orderedListOfSponsorshipStatusesInStoriesSection[
                                            currIndexInStoriesSection - absoluteDiff
                                        ] == true) &&
                                            (
                                                <b style={{marginTop: '1.5em'}}>Sponsored</b>
                                            )
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )
            }
        </div>
    )
}

export default StoryViewer;