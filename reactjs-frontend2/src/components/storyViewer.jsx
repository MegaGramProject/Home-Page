import { useEffect, useRef, useState } from 'react';
//import { v4 as uuidv4 } from 'uuid';

import blackScreen from '../assets/images/blackScreen.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import mutedIcon from '../assets/images/mutedIcon.png';
import nextSlideArrow from '../assets/images/nextSlideArrow.png';
import notMutedIcon from '../assets/images/notMutedIcon.png';
import pauseIcon2 from '../assets/images/pauseIcon2.png';
//import scenicRoad from '../assets/images/scenicRoad.jpg';
import thinWhiteXIcon from '../assets/images/thinWhiteXIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';
import whitePlayIcon from '../assets/images/whitePlayIcon.png';
//import dogVid from '../assets/misc/dogVid.mp4';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import whiteTrashIcon from '../assets/images/whiteTrashIcon.png';

function StoryViewer({username, authUser, notifyParentToCloseStoryViewer, usersAndTheirStories,
usersAndYourCurrSlideInTheirStories, orderedListOfUsernamesInStoriesSection, isFromStoriesSection,
usersAndTheirRelevantInfo, notifyParentToShowErrorPopup, notifyParentToUpdateUsersAndTheirStories, 
notifyParentToUpdateUsersAndYourCurrSlideInTheirStories, usernamesWhoseStoriesYouHaveFinished,
notifyParentToAddUsernameToSetOfUsersWhoseStoriesYouHaveFinished, idsOfStoriesMarkedAsViewed,
notifyParentToAddStoryIdToSetOfViewedStoryIds}) {
    const [currUsername, setCurrUsername] = useState('');
    const [replyToStoryInput, setReplyToStoryInput] = useState('');
    const [currSlide, setCurrSlide] = useState(0);
    const [numSlides, setNumSlides] = useState(0);
    const [currSlideProgressPercent, setCurrSlideProgressPercent] = useState(0);
    const [displaySentText, setDisplaySentText] = useState(false);
    const [replyToStoryTextareaIsActive, setReplyToStoryTextareaIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currStories, setCurrStories] = useState([]);
    const [storyFetchingErrorMessage, setStoryFetchingErrorMessage] = useState('');
    const [rateOfStoryProgression, setRateOfStoryProgression] = useState(0);
    const [intervalIdForStoryProgression, setIntervalIdForStoryProgression] = useState(null);
    const [currIndexInStoriesSection, setCurrIndexInStoriesSection] = useState(-1);
    const [isCurrentlyFetchingStory, setIsCurrentlyFetchingStory] = useState(false);

    const videoSlideRef = useRef(null);

    useEffect(() => {
        setCurrUsername(username);

        if(isFromStoriesSection) {
            setCurrIndexInStoriesSection(orderedListOfUsernamesInStoriesSection.indexOf(username));
        }
    }, [username]);

    useEffect(() => {
        if (currUsername.length>0) {
            fetchTheNecessaryStories();
        }
    }, [currUsername]);

    useEffect(() => {
        setNumSlides(currStories.length);
    }, [currStories]);

    useEffect(() => {
        clearInterval(intervalIdForStoryProgression);

        if(rateOfStoryProgression>0) {
            setIntervalIdForStoryProgression(
                setInterval(() => {
                    progressThroughStories();
                }, 25)
            );
        }
        else {
            setIntervalIdForStoryProgression(null);
        }
    }, [rateOfStoryProgression]);

    useEffect(() => {
        if (currSlideProgressPercent >= 100) {
            setCurrSlide(currSlide+1);
            handleChangeInSlide(currStories, currSlide+1, currUsername);
        }
    }, [currSlideProgressPercent]);

    function handleChangeInSlide(stories, slide, username) {
        setRateOfStoryProgression(0);
        setCurrSlideProgressPercent(0);
        let newUsersAndYourCurrSlideInTheirStories = {...usersAndYourCurrSlideInTheirStories};

        if(slide >= stories.length) {
            if (!(usernamesWhoseStoriesYouHaveFinished.has(username))) {
                notifyParentToAddUsernameToSetOfUsersWhoseStoriesYouHaveFinished(username);
            }

            newUsersAndYourCurrSlideInTheirStories[username] = 0;
            notifyParentToUpdateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

            if (isFromStoriesSection && currIndexInStoriesSection+1 < orderedListOfUsernamesInStoriesSection.length) {
                setNumSlides(0);
                setCurrUsername(orderedListOfUsernamesInStoriesSection[currIndexInStoriesSection+1]);
                setCurrIndexInStoriesSection(currIndexInStoriesSection+1);
            }
            else {
                notifyParentToCloseStoryViewer();
            }
        }
        else if(slide > -1){
            const storyId = stories[slide].id;
            window.history.pushState(
                {
                    page: 'Stories',
                    username: username,
                    storyId: storyId
                },
                'Stories',
                `http://localhost:8004/stories/${username}/${storyId}`
            );

            if(stories[slide].vidDurationInSeconds==null) {
                setRateOfStoryProgression(0.5);
            }
            else {
                setRateOfStoryProgression(2.5/stories[slide].vidDurationInSeconds);
            }
            
            newUsersAndYourCurrSlideInTheirStories[username] = slide;
            notifyParentToUpdateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

            if(!(idsOfStoriesMarkedAsViewed.has(stories[slide].id))) {
               markCurrentStorySlideAsViewed(stories[slide].id);
            }
        }
        else {
            setCurrUsername(orderedListOfUsernamesInStoriesSection[currIndexInStoriesSection-1]);
            setCurrIndexInStoriesSection(currIndexInStoriesSection-1);
        }
    }
    

    async function markCurrentStorySlideAsViewed(storyId) {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/markStoryAsViewed/${authUser}/${storyId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('The server had trouble marking this story-slide as viewed');
            }
            else {
                notifyParentToAddStoryIdToSetOfViewedStoryIds(storyId);
            }
        }
        catch (error) {
            console.error('There was trouble connecting to the server to mark this story-slide as viewed');
        }
    }

    async function fetchTheNecessaryStories() {
        /*
        setCurrStories([
            {
                id: uuidv4(),
                datetime: '2025-02-05T13:49:00',
                src: scenicRoad,
                vidDurationInSeconds: null,
                adInfo: {
                    callToAction: 'fly here in 2 days!',
                    link: 'https://google.com'
                }
            },
            {
                id: uuidv4(),
                datetime: '2025-02-08T13:49:00',
                src: dogVid,
                vidDurationInSeconds: 60,
                adInfo: null
            }
        ]);
        setCurrSlide(0);
        handleChangeInSlide(
        [
            {
                id: uuidv4(),
                datetime: '2025-02-05T13:49:00',
                src: scenicRoad,
                vidDurationInSeconds: null,
                adInfo: {
                    callToAction: 'fly here in 2 days!',
                    link: 'https://google.com'
                }
            },
            {
                id: uuidv4(),
                datetime: '2025-02-08T13:49:00',
                src: dogVid,
                vidDurationInSeconds: 60,
                adInfo: null
            }
        ], 0, currUsername);
        return;
        */

        setIsCurrentlyFetchingStory(true);

        if (isFromStoriesSection) {
            const listOfUsernamesNeededForStoryFetching = [];
            let currentIndex = orderedListOfUsernamesInStoriesSection.indexOf(currUsername);

            if(!(orderedListOfUsernamesInStoriesSection[currentIndex] in usersAndTheirStories)) {
                listOfUsernamesNeededForStoryFetching.push(currUsername);
            }
            if (currentIndex+1 < orderedListOfUsernamesInStoriesSection.length &&
            !(orderedListOfUsernamesInStoriesSection[currentIndex+1] in usersAndTheirStories)) {
                listOfUsernamesNeededForStoryFetching.push(orderedListOfUsernamesInStoriesSection[currentIndex+1]);
            }
            if (currentIndex+2 < orderedListOfUsernamesInStoriesSection.length &&
            !(orderedListOfUsernamesInStoriesSection[currentIndex+2] in usersAndTheirStories)) {
                listOfUsernamesNeededForStoryFetching.push(orderedListOfUsernamesInStoriesSection[currentIndex+2]);
            }
            
            if (listOfUsernamesNeededForStoryFetching.length>0) {
                try {
                    const response = await fetch(
                    `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getStoriesOfAtMost3Users/${currUsername}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            users: listOfUsernamesNeededForStoryFetching
                        }),
                        credentials: 'include'
                    });
                    if (!response.ok) {
                        setStoryFetchingErrorMessage(`The server had trouble getting the stories of
                        ${currUsername}`);
                    }
                    else {
                        const storiesOfAtMost3Users = await response.json();
                        const newUsersAndTheirStories = {...usersAndTheirStories};
                        const newUsersAndYourCurrSlideInTheirStories = {...usersAndYourCurrSlideInTheirStories};
                        
                        for(let username of Object.keys(storiesOfAtMost3Users)) {
                            newUsersAndTheirStories[username] = storiesOfAtMost3Users[username].stories;
                            if (storiesOfAtMost3Users[username].currSlide==='finished')  {
                                newUsersAndYourCurrSlideInTheirStories[username] = 0;
                                notifyParentToAddUsernameToSetOfUsersWhoseStoriesYouHaveFinished(username);
                            }
                            else {
                                newUsersAndYourCurrSlideInTheirStories[username] = storiesOfAtMost3Users[username]
                                .currSlide;
                            }
                        }

                        notifyParentToUpdateUsersAndTheirStories(newUsersAndTheirStories);
                        notifyParentToUpdateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
                        
                        if(currUsername in newUsersAndTheirStories) {
                            setCurrStories(newUsersAndTheirStories[currUsername]);
                            setCurrSlide(newUsersAndYourCurrSlideInTheirStories[currUsername]);

                            handleChangeInSlide(
                                newUsersAndTheirStories[currUsername],
                                newUsersAndYourCurrSlideInTheirStories[currUsername],
                                currUsername
                            );
                        }
                        else {
                            setStoryFetchingErrorMessage(`The server had trouble getting the stories of
                            ${currUsername}`);
                        }
                    }
                }
                catch (error) {
                    setStoryFetchingErrorMessage(
                        `There was trouble connecting to the server to get the stories of ${currUsername}`
                    );
                }
            }
            else {
                setCurrStories(usersAndTheirStories[currUsername]);
                setCurrSlide(usersAndYourCurrSlideInTheirStories[currUsername]);

                handleChangeInSlide(usersAndTheirStories[currUsername], usersAndYourCurrSlideInTheirStories[currUsername],
                currUsername);
            }
        }
        else if(!(currUsername in usersAndTheirStories)) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getStoriesOfUser/
                ${authUser}/${currUsername}`, {
                    credentials: 'include'
                });
                if(!response.ok) {
                    setStoryFetchingErrorMessage(`The server had trouble getting the stories of
                    ${currUsername}`);
                }
                else {
                    const userStoryData = await response.json();
                    
                    const newUsersAndTheirStories = {...usersAndTheirStories};
                    newUsersAndTheirStories[currUsername] = userStoryData.stories;
                    notifyParentToUpdateUsersAndTheirStories(newUsersAndTheirStories);

                    setCurrStories(userStoryData.stories);

                    if(userStoryData.currSlide==='finished') {
                        setCurrSlide(0);
                        handleChangeInSlide(userStoryData.stories, 0, currUsername);
                        notifyParentToAddUsernameToSetOfUsersWhoseStoriesYouHaveFinished(username);
                    }
                    else {
                        setCurrSlide(userStoryData.currSlide);
                        handleChangeInSlide(userStoryData.stories, userStoryData.currSlide, currUsername);
                    }
                }
            }
            catch (error) {
                setStoryFetchingErrorMessage(
                    `There was trouble connecting to the server to get the stories of ${currUsername}`
                );
            }
        }
        else {
            setCurrStories(usersAndTheirStories[currUsername]);
            setCurrSlide(usersAndYourCurrSlideInTheirStories[currUsername]);

            handleChangeInSlide(usersAndTheirStories[currUsername], usersAndYourCurrSlideInTheirStories[currUsername],
            currUsername);
        }

        setIsCurrentlyFetchingStory(false);
    }

    function toggleIsPaused() {
        if(rateOfStoryProgression==0) {
            resumeStoryProgression();
        }
        else {
            pauseStoryProgression();
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

    function progressThroughStories() {
        setCurrSlideProgressPercent((currSlideProgressPercent) => {
            if (currSlideProgressPercent>=100) {
                return currSlideProgressPercent;
            }
            return currSlideProgressPercent + rateOfStoryProgression;
        });
    }

    function updateSlide(incrementOrDecrementText) {
        if (incrementOrDecrementText === 'increment') {
            setCurrSlide(currSlide+1);
            handleChangeInSlide(currStories, currSlide+1, currUsername);
        }
        else {
            setCurrSlide(currSlide-1);
            handleChangeInSlide(currStories, currSlide-1, currUsername);
        }
    }

    async function sendReply(replyToSend) {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/sendReplyToStory/
            ${authUser}/${currStories[currSlide].id}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    reply: replyToSend
                }),
                credentials: 'include'
            });
            if (!response.ok) {
                notifyParentToShowErrorPopup(
                    'The server had trouble sending your reply to this story'
                );
            }
            else {
                setReplyToStoryInput('');
                setDisplaySentText(true);
                setTimeout(() => setDisplaySentText(false), 850);
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(
                'There was trouble connecting to the server to send your reply to this story'
            );
        }
    }

    function toggleIsMuted() {
        videoSlideRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
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
        }

        if(videoSlideRef.current) {
            videoSlideRef.current.play();
        }
    }

    async function deleteStory() {
        try {  
            let idOfStoryToDelete = currStories[currSlide].id;
            const response = await fetch(
            `http:/34.111.89.101/api/Home-Page/aspNetCoreBackend1/deleteStory/${idOfStoryToDelete}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                notifyParentToShowErrorPopup('The server had trouble deleting this story');
            }
            else {
                const newCurrStories = currStories.filter(story => story.id !== idOfStoryToDelete);
                setCurrStories(newCurrStories);

                const newUsersAndTheirStories = {...usersAndTheirStories};
                newUsersAndTheirStories[authUser] = newCurrStories;
                notifyParentToUpdateUsersAndTheirStories(newUsersAndTheirStories);

                handleChangeInSlide(newCurrStories, currSlide, currUsername);
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup('There was trouble connecting to the server to delete this story');
        }
    }

    function takeAuthUserToTheSelectedUsersStoryInStorySection(newCurrIndexInStoriesSection) {
        setNumSlides(0);
        setCurrUsername(orderedListOfUsernamesInStoriesSection[newCurrIndexInStoriesSection]);
        setCurrIndexInStoriesSection(newCurrIndexInStoriesSection);
    }

    return (
        <div style={{position: 'fixed', height: '100%', width: '100%', top: '0%', left: '0%',
        backgroundColor: '#1c1c1c', color: 'white', zIndex: '1'}}>
            <p onClick={notifyParentToCloseStoryViewer} className="headerMegagram"
            style={{position: 'absolute', top: '2%', left: '1%', fontFamily: 'Billabong', fontSize: '2.1em',
            cursor: 'pointer', marginTop: '0em'}}>
                Megagram
            </p>

            <img onClick={notifyParentToCloseStoryViewer} src={thinWhiteXIcon}
            style={{position: 'absolute', top: '1%', right: '0%', cursor: 'pointer', height: '3.5em', width: '3.5em',
            objectFit: 'contain'}}/>

            <div style={{position: 'absolute', top: '2%', left: '35%', height: '95%', width: '30%',
            borderRadius: '1%'}}>
                {numSlides>0 &&
                    (
                        <>
                            {currSlide < currStories.length && currSlide > -1 &&
                            currStories[currSlide].vidDurationInSeconds==null &&
                                (
                                    <img src={currStories[currSlide].src} style={{position: 'absolute', left: '0%',
                                    top: '0%', height: '100%', width: '100%', borderRadius: '1%', zIndex: '1'}}/>
                                )
                            }

                            {currSlide < currStories.length && currSlide > -1 &&
                            currStories[currSlide].vidDurationInSeconds!==null &&
                                (
                                    <video ref={videoSlideRef} src={currStories[currSlide].src} autoPlay
                                    muted={isMuted} id="videoStorySlide"
                                    style={{position: 'absolute', left: '0%', top: '0%', height: '100%',
                                    width: '100%', borderRadius: '1%', zIndex: '1'}}/>
                                )
                            }
                        </>
                    )
                }

                {numSlides==0 &&
                    (
                        <div style={{position: 'absolute', left: '0%', top: '0%', height: '100%',
                        width: '100%', backgroundColor: 'black', color: 'white', zIndex: '1'}}>
                            {storyFetchingErrorMessage.length>0 &&
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

                {(currSlide > 0 ||
                (isFromStoriesSection && currIndexInStoriesSection>0)) &&
                    (
                        <img src={nextSlideArrow} className="storyViewerSlideArrows"
                        onClick={() => updateSlide('decrement')}
                        style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                        objectFit: 'contain', position: 'absolute', left: '-5%', top: '50%',
                        transform: 'translate(-50%, -50%) rotate(180deg)', filter: 'brightness(5) contrast(0)'}}/>
                    )
                }

                {(currSlide + 1 < numSlides ||
                (isFromStoriesSection && currIndexInStoriesSection+1 < orderedListOfUsernamesInStoriesSection.length)) &&
                    (
                        <img src={nextSlideArrow} className="storyViewerSlideArrows"
                        onClick={() => updateSlide('increment')}
                        style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                        objectFit: 'contain', position: 'absolute', right: '-12%', top: '50%',
                        transform: 'translate(-50%, -50%)', filter: 'brightness(5) contrast(0)'}}/>
                    )
                }
                
                {replyToStoryTextareaIsActive &&
                    (
                        <img src={blackScreen} style={{position: 'absolute', left: '0%', top: '0%', height: '100%',
                        width: '100%', borderRadius: '1%', zIndex: '3', pointerEvents: 'none', opacity: '0.7'}}/>
                    ) 
                }

                {displaySentText &&
                    (
                        <p style={{backgroundColor: '#1c1c1c', color: 'white', padding: '0.8em 1.5em', position: 'absolute',
                        top: '45%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: '3', borderRadius: '0.5em',
                        fontSize: '1.1em'}}>
                            Sent
                        </p>
                    )
                }

                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', marginTop: '1em',
                gap: '1em'}}>
                    {numSlides>0 &&
                        (
                            <div style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center',
                            gap: `${2/(numSlides-1)}%`, zIndex: '2'}}>
                                {[...Array(numSlides)].map((_, index) => (
                                    <div key={index} style={{width: `${90/numSlides}%`,
                                    height: '3px', backgroundColor: '#918f8e'}}>
                                        <div style={{width: `${
                                            currSlide > index ? 100 : 
                                            currSlide === index ? currSlideProgressPercent : 0
                                        }%`, height: '100%', backgroundColor: 'white'}}> 
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }

                    <div style={{display: 'flex', justifyContent: 'space-between', width: '95%', alignItems: 'center',
                    marginLeft: '2.5%', marginRight: '2.5%', zIndex: '2'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.85em'}}>
                            <a href={`http://34.111.89.101/profile/${currUsername}`} style={{color: 'white'}}
                            target="_blank" rel="noopener noreferrer">
                                <img src={
                                    (currUsername in usersAndTheirRelevantInfo &&
                                    'profilePhoto' in usersAndTheirRelevantInfo[currUsername]) ?
                                    usersAndTheirRelevantInfo[currUsername].profilePhoto :
                                    defaultPfp
                                }
                                style={{height: '3em', width: '3em', pointerEvents: 'none',
                                objectFit: 'contain', marginLeft: '0.5em'}}/>
                            </a>

                            <a href={`http://34.111.89.101/profile/${currUsername}`} style={{color: 'white'}}
                            target="_blank" rel="noopener noreferrer">
                                {currUsername}
                            </a>

                            {(currUsername in usersAndTheirRelevantInfo &&
                            'isVerified' in usersAndTheirRelevantInfo[currUsername] &&
                            usersAndTheirRelevantInfo[currUsername].isVerified) &&
                                (
                                    <img src={verifiedBlueCheck} style={{height: '2em',
                                    width: '2em', marginLeft: '-0.5em', pointerEvents: 'none',
                                    objectFit: 'contain'}}/>
                                )
                            }

                            {(numSlides>0 && currSlide > -1 && currSlide < currStories.length) &&
                                (
                                    <>
                                    <span style={{color: 'lightgray', marginRight: '-0.3em'}}>
                                        •
                                    </span>
        
                                    <span style={{color: 'lightgray'}}>
                                        {formatDatetimeString(currStories[currSlide].datetime)}
                                    </span>
                                    </>
                                )
                            }
                        </div>

                        {(numSlides>0 && currSlide > -1 && currSlide < currStories.length) &&
                            (
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.7em'}}>
                                    {(isMuted && currStories[currSlide].vidDurationInSeconds!==null) &&
                                        (
                                            <img onClick={toggleIsMuted} src={mutedIcon}
                                            style={{height: '1.85em', width: '1.85em', cursor: 'pointer',
                                            objectFit: 'contain'}}
                                            />
                                        )
                                    }
        
                                    {(!isMuted && currStories[currSlide].vidDurationInSeconds!==null) &&
                                        (
                                            <img onClick={toggleIsMuted} src={notMutedIcon}
                                            style={{height: '1.85em', width: '1.85em', cursor: 'pointer',
                                            objectFit: 'contain'}}
                                            />
                                        )
                                    }
        
                                    {rateOfStoryProgression>0 &&
                                        (
                                            <img onClick={toggleIsPaused} src={pauseIcon2} style={{cursor: 'pointer',
                                            height: '1.5em', width: '1.5em', objectFit: 'contain'}}/>
                                        )
                                    }
        
                                    {rateOfStoryProgression==0 &&
                                        (
                                            <img onClick={toggleIsPaused} src={whitePlayIcon} style={{cursor: 'pointer',
                                            height: '2em', width: '2em', objectFit: 'contain'}}/>
                                        )
                                    }

                                    {authUser === currUsername &&
                                        (
                                            <img onClick={deleteStory} src={whiteTrashIcon} style={{cursor: 'pointer',
                                            height: '1.3em', width: '1.3em', objectFit: 'contain'}}/>
                                        )
                                    }
                                </div>
                            )
                        }
                    </div>

                    {(numSlides>0 && currSlide > -1 && currSlide < currStories.length &&
                    currStories[currSlide].adInfo!==null) &&
                        (
                            <a href={currStories[currSlide].adInfo.link} target="_blank" rel="noopener noreferrer"
                            style={{color: 'white', marginTop: '0em', zIndex: '2', maxWidth: '65%', textAlign: 'start',
                            marginLeft: '1em', overflowWrap: 'break-word'}}>
                                Sponsored: <b>Click this to {currStories[currSlide].adInfo.callToAction}</b>
                            </a>
                        )
                    }
                </div>


                {(replyToStoryTextareaIsActive && replyToStoryInput.length==0) &&
                    
                    (
                        <div style={{position: 'absolute', bottom: '10%', left: '0%', width: '100%', height: '20%',
                        zIndex: '3', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        alignItems: 'center', color: 'white'}}>
                            <h2>Quick Reactions</h2>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1em', width: '100%', marginTop:
                            '-1em', justifyContent: 'center'}}>
                                <p onClick={() => sendReply('😂')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>😂</p>

                                <p onClick={() => sendReply('😍')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>😍</p>

                                <p onClick={() => sendReply('🥳')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>🥳</p>

                                <p onClick={() => sendReply('😎')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>😎</p>

                                <p onClick={() => sendReply('😡')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>😡</p>

                                <p onClick={() => sendReply('🥺')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>🥺</p>

                                <p onClick={() => sendReply('😢')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>😢</p>

                                <p onClick={() => sendReply('😮')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>😮</p>

                                <p onClick={() => sendReply('💯')}
                                style={{fontSize: '2em', cursor: 'pointer'}}>💯</p>
                            </div>
                        </div>
                    )
                }

                {(numSlides > 0 && authUser!==currUsername) &&
                    (
                        <div style={{position: 'absolute', bottom: '0.5%', left: '0%', width: '100%', height: '10%',
                        zIndex: '3', display: 'flex', gap: '0.75em', justifyContent: 'center', alignItems: 'center'}}>
                            <input value={replyToStoryInput} onChange={updateReplyToStoryInput}
                            onFocus={() => {
                                pauseStoryProgression();
                                setReplyToStoryTextareaIsActive(true);
                            }}
                            onBlur={() =>
                                { 
                                    resumeStoryProgression();
                                    setTimeout(() => setReplyToStoryTextareaIsActive(false) , 300);
                                }
                            } 
                            placeholder={`Reply to @${currUsername}...`}
                            style={{width: '70%', borderRadius: '2em', fontFamily: 'Arial', outline: 'none',
                            resize: 'none', backgroundColor:'black', borderColor: 'white', color: 'white',
                            height: '4em', paddingLeft: '1em', fontSize: '0.95em'}}/>

                            <button onClick={replyToStoryInput.length > 0 ? () => sendReply(replyToStoryInput) : null}
                            style={{padding: '0.5em 1em', width: '5em', backgroundColor: '#4aa4ff',
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
                        justifyContent: 'end'}}>
                            {currIndexInStoriesSection-2 > -1 &&
                                (
                                    <div onClick={() =>
                                        {
                                            takeAuthUserToTheSelectedUsersStoryInStorySection(
                                                currIndexInStoriesSection-2
                                            );
                                        }
                                    }
                                    style={{borderRadius: '5%', height: '90%', width: '45%', cursor: 'pointer',
                                    position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        
                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection-2
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-2
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection-2
                                                ]
                                            ]
                                        ].vidDurationInSeconds==null) &&
                                            (
                                                <img
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection-2
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection-2
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1'}}/>
                                            )
                                        }

                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection-2
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-2
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection-2
                                                ]
                                            ]
                                        ].vidDurationInSeconds!==null) &&
                                            (
                                                <video
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection-2
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection-2
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1', pointerEvents: 'none'}}/>
                                            )
                                        }
        
                                        <img src={blackScreen} style={{position: 'absolute', top: '0%', left: '0%',
                                        height: '100%', width: '100%', opacity: '0.7', borderRadius: '5%',
                                        zIndex: '2'}}/>
        
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        zIndex: '3', gap: '0.3em'}}>
                                            <img
                                            src={
                                                (
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-2
                                                    ] in usersAndTheirRelevantInfo &&
                                                    'profilePhoto' in usersAndTheirRelevantInfo[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection-2
                                                        ]
                                                    ]
                                                ) ?
                                                usersAndTheirRelevantInfo[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-2
                                                    ]
                                                ].profilePhoto : defaultPfp
                                            } 
                                            style={{height: '3.8em', width: '3.8em', 
                                            objectFit: 'contain'}}/>

                                            <b style={{marginTop:'0.5em', marginBottom: '-1em', overflowWrap: 'break-word',
                                            maxWidth: '7em'}}>
                                                {
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-2
                                                    ]
                                                }
                                            </b>

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-2
                                            ] in usersAndTheirStories) &&
                                                (
                                                    <p style={{fontSize: '0.90em', overflowWrap: 'break-word',
                                                    maxWidth: '4em'}}>
                                                        {
                                                            formatDatetimeString(
                                                                usersAndTheirStories[
                                                                    orderedListOfUsernamesInStoriesSection[
                                                                        currIndexInStoriesSection-2
                                                                    ]
                                                                ][
                                                                    usersAndYourCurrSlideInTheirStories[
                                                                        orderedListOfUsernamesInStoriesSection[
                                                                            currIndexInStoriesSection-2
                                                                        ]
                                                                    ]
                                                                ].datetime
                                                            )
                                                        }
                                                    </p>
                                                )
                                            }

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-2
                                            ] in usersAndTheirStories &&
                                            usersAndTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection-2
                                                ]
                                            ][
                                                usersAndYourCurrSlideInTheirStories[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-2
                                                    ]
                                                ]
                                            ].adInfo!==null) &&
                                                (
                                                    <b>Sponsored</b>
                                                )
                                            }
                                        </div>
                                    </div>
                                )
                            }

                            {currIndexInStoriesSection-1 > -1 &&
                                (
                                    <div onClick={() =>
                                        {
                                            takeAuthUserToTheSelectedUsersStoryInStorySection(
                                                currIndexInStoriesSection-1
                                            );
                                        }
                                    } style={{borderRadius: '5%', height: '90%', width: '45%', cursor: 'pointer',
                                    position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        
                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection-1
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-1
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection-1
                                                ]
                                            ]
                                        ].vidDurationInSeconds==null) &&
                                            (
                                                <img
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection-1
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection-1
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1'}}/>
                                            )
                                        }

                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection-1
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-1
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection-1
                                                ]
                                            ]
                                        ].vidDurationInSeconds!==null) &&
                                            (
                                                <video
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection-1
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection-1
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1', pointerEvents: 'none'}}/>
                                            )
                                        }
        
                                        <img src={blackScreen} style={{position: 'absolute', top: '0%', left: '0%',
                                        height: '100%', width: '100%', opacity: '0.7', borderRadius: '5%',
                                        zIndex: '2'}}/>
        
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        zIndex: '3', gap: '0.3em'}}>
                                            <img
                                            src={
                                                (
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-1
                                                    ] in usersAndTheirRelevantInfo &&
                                                    'profilePhoto' in usersAndTheirRelevantInfo[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection-1
                                                        ]
                                                    ]
                                                ) ?
                                                usersAndTheirRelevantInfo[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-1
                                                    ]
                                                ].profilePhoto : defaultPfp
                                            } 
                                            style={{height: '3.8em', width: '3.8em', 
                                            objectFit: 'contain'}}/>

                                            <b style={{marginTop:'0.5em', marginBottom: '-1em', overflowWrap: 'break-word',
                                            maxWidth: '7em'}}>
                                                {
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-1
                                                    ]
                                                }
                                            </b>

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-1
                                            ] in usersAndTheirStories) &&
                                                (
                                                    <p style={{fontSize: '0.90em', overflowWrap: 'break-word',
                                                    maxWidth: '4em'}}>
                                                        {
                                                            formatDatetimeString(
                                                                usersAndTheirStories[
                                                                    orderedListOfUsernamesInStoriesSection[
                                                                        currIndexInStoriesSection-1
                                                                    ]
                                                                ][
                                                                    usersAndYourCurrSlideInTheirStories[
                                                                        orderedListOfUsernamesInStoriesSection[
                                                                            currIndexInStoriesSection-1
                                                                        ]
                                                                    ]
                                                                ].datetime
                                                            )
                                                        }
                                                    </p>
                                                )
                                            }

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection-1
                                            ] in usersAndTheirStories &&
                                            usersAndTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection-1
                                                ]
                                            ][
                                                usersAndYourCurrSlideInTheirStories[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection-1
                                                    ]
                                                ]
                                            ].adInfo!==null) &&
                                                (
                                                    <b>Sponsored</b>
                                                )
                                            }
                                        </div>
                                    </div>
                                )
                            }
                        </div>

                        <div style={{position: 'absolute', top: '50%', right: '6%', height: '40%', width: '25%',
                        transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '3em',
                        justifyContent: 'start'}}>
                            {currIndexInStoriesSection+1 < orderedListOfUsernamesInStoriesSection.length &&
                                (
                                    <div onClick={() =>
                                        {
                                            takeAuthUserToTheSelectedUsersStoryInStorySection(
                                                currIndexInStoriesSection+1
                                            );
                                        }
                                    } style={{borderRadius: '5%', height: '90%', width: '45%', cursor: 'pointer',
                                    position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        
                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection+1
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+1
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection+1
                                                ]
                                            ]
                                        ].vidDurationInSeconds==null) &&
                                            (
                                                <img
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection+1
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection+1
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1'}}/>
                                            )
                                        }

                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection+1
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+1
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection+1
                                                ]
                                            ]
                                        ].vidDurationInSeconds!==null) &&
                                            (
                                                <video
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection+1
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection+1
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1', pointerEvents: 'none'}}/>
                                            )
                                        }
        
                                        <img src={blackScreen} style={{position: 'absolute', top: '0%', left: '0%',
                                        height: '100%', width: '100%', opacity: '0.7', borderRadius: '5%',
                                        zIndex: '2'}}/>
        
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        zIndex: '3', gap: '0.3em'}}>
                                            <img
                                            src={
                                                (
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+1
                                                    ] in usersAndTheirRelevantInfo &&
                                                    'profilePhoto' in usersAndTheirRelevantInfo[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection+1
                                                        ]
                                                    ]
                                                ) ?
                                                usersAndTheirRelevantInfo[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+1
                                                    ]
                                                ].profilePhoto : defaultPfp
                                            } 
                                            style={{height: '3.8em', width: '3.8em', 
                                            objectFit: 'contain'}}/>

                                            <b style={{marginTop:'0.5em', marginBottom: '-1em', overflowWrap: 'break-word',
                                            maxWidth: '7em'}}>
                                                {
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+1
                                                    ]
                                                }
                                            </b>

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+1
                                            ] in usersAndTheirStories) &&
                                                (
                                                    <p style={{fontSize: '0.90em', overflowWrap: 'break-word',
                                                    maxWidth: '4em'}}>
                                                        {
                                                            formatDatetimeString(
                                                                usersAndTheirStories[
                                                                    orderedListOfUsernamesInStoriesSection[
                                                                        currIndexInStoriesSection+1
                                                                    ]
                                                                ][
                                                                    usersAndYourCurrSlideInTheirStories[
                                                                        orderedListOfUsernamesInStoriesSection[
                                                                            currIndexInStoriesSection+1
                                                                        ]
                                                                    ]
                                                                ].datetime
                                                            )
                                                        }
                                                    </p>
                                                )
                                            }

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+1
                                            ] in usersAndTheirStories &&
                                            usersAndTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection+1
                                                ]
                                            ][
                                                usersAndYourCurrSlideInTheirStories[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+1
                                                    ]
                                                ]
                                            ].adInfo!==null) &&
                                                (
                                                    <b>Sponsored</b>
                                                )
                                            }
                                        </div>
                                    </div>
                                )
                            }

                            {currIndexInStoriesSection+2 < orderedListOfUsernamesInStoriesSection.length &&
                                (
                                    <div onClick={() =>
                                        {
                                            takeAuthUserToTheSelectedUsersStoryInStorySection(
                                                currIndexInStoriesSection+2
                                            );
                                        }
                                    } style={{borderRadius: '5%', height: '90%', width: '45%', cursor: 'pointer',
                                    position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        
                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection+2
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+2
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection+2
                                                ]
                                            ]
                                        ].vidDurationInSeconds==null) &&
                                            (
                                                <img
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection+2
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection+2
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1'}}/>
                                            )
                                        }

                                        {(orderedListOfUsernamesInStoriesSection[
                                            currIndexInStoriesSection+2
                                        ] in usersAndTheirStories &&
                                        usersAndTheirStories[
                                            orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+2
                                            ]
                                        ][
                                            usersAndYourCurrSlideInTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection+2
                                                ]
                                            ]
                                        ].vidDurationInSeconds!==null) &&
                                            (
                                                <video
                                                src={
                                                    usersAndTheirStories[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection+2
                                                        ]
                                                    ][
                                                        usersAndYourCurrSlideInTheirStories[
                                                            orderedListOfUsernamesInStoriesSection[
                                                                currIndexInStoriesSection+2
                                                            ]
                                                        ]
                                                    ].src
                                                }
                                                style={{position: 'absolute', top: '0%', left: '0%',
                                                height: '100%', width: '100%', objectFit: 'cover', borderRadius: '5%',
                                                zIndex: '1', pointerEvents: 'none'}}/>
                                            )
                                        }
        
                                        <img src={blackScreen} style={{position: 'absolute', top: '0%', left: '0%',
                                        height: '100%', width: '100%', opacity: '0.7', borderRadius: '5%',
                                        zIndex: '2'}}/>
        
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        zIndex: '3', gap: '0.3em'}}>
                                            <img
                                            src={
                                                (
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+2
                                                    ] in usersAndTheirRelevantInfo &&
                                                    'profilePhoto' in usersAndTheirRelevantInfo[
                                                        orderedListOfUsernamesInStoriesSection[
                                                            currIndexInStoriesSection+2
                                                        ]
                                                    ]
                                                ) ?
                                                usersAndTheirRelevantInfo[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+2
                                                    ]
                                                ].profilePhoto : defaultPfp
                                            } 
                                            style={{height: '3.8em', width: '3.8em', 
                                            objectFit: 'contain'}}/>

                                            <b style={{marginTop:'0.5em', marginBottom: '-1em', overflowWrap: 'break-word',
                                            maxWidth: '7em'}}>
                                                {
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+2
                                                    ]
                                                }
                                            </b>

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+2
                                            ] in usersAndTheirStories) &&
                                                (
                                                    <p style={{fontSize: '0.90em', overflowWrap: 'break-word',
                                                    maxWidth: '4em'}}>
                                                        {
                                                            formatDatetimeString(
                                                                usersAndTheirStories[
                                                                    orderedListOfUsernamesInStoriesSection[
                                                                        currIndexInStoriesSection+2
                                                                    ]
                                                                ][
                                                                    usersAndYourCurrSlideInTheirStories[
                                                                        orderedListOfUsernamesInStoriesSection[
                                                                            currIndexInStoriesSection+2
                                                                        ]
                                                                    ]
                                                                ].datetime
                                                            )
                                                        }
                                                    </p>
                                                )
                                            }

                                            {(orderedListOfUsernamesInStoriesSection[
                                                currIndexInStoriesSection+2
                                            ] in usersAndTheirStories &&
                                            usersAndTheirStories[
                                                orderedListOfUsernamesInStoriesSection[
                                                    currIndexInStoriesSection+2
                                                ]
                                            ][
                                                usersAndYourCurrSlideInTheirStories[
                                                    orderedListOfUsernamesInStoriesSection[
                                                        currIndexInStoriesSection+2
                                                    ]
                                                ]
                                            ].adInfo!==null) &&
                                                (
                                                    <b>Sponsored</b>
                                                )
                                            }
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </>
                )
            }
            
        </div>
    )
}

export default StoryViewer;