import { useEffect, useRef, useState } from 'react';

import UserIcon from './UserIcon';
import FollowUser from './FollowUser';
import PostDots from './PostDots';

import blackSavedIcon from '../assets/images/blackSavedIcon.png';
import blankHeartIcon from '../assets/images/blankHeartIcon.png';
import blankSavedIcon from '../assets/images/blankSavedIcon.png';
import commentIcon from '../assets/images/commentIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import megaphone from '../assets/images/megaphone.png';
import musicSymbol from '../assets/images/musicSymbol.png';
import nextSlideArrow from '../assets/images/nextSlideArrow.png';
import pauseIcon from '../assets/images/pauseIcon.png';
import playIcon from '../assets/images/playIcon.webp';
import redHeartIcon from '../assets/images/redHeartIcon.png';
import sendPostIcon from '../assets/images/sendPostIcon.png';
import taggedAccountsIcon from '../assets/images/taggedAccountsIcon.png';
import threeHorizontalDots from '../assets/images/threeHorizontalDots.png';
import thinGrayXIcon from '../assets/images/thinGrayXIcon.png';
import defaultVideoFrame from '../assets/images/defaultVideoFrame.jpg';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';
import likePostAnimationHeartIcon from '../assets/images/likePostAnimationHeartIcon.webp';

function MediaPost({postDetails, authUsername, notifyParentToShowThreeDotsPopup, notifyParentToShowCommentsPopup,
notifyParentToShowSendPostPopup, notifyParentToShowLikersPopup, notifyParentToShowErrorPopup,
mainPostAuthorInfo, notifyParentToUpdatePostDetails, usersAndTheirRelevantInfo}) {
    const [overallPostId, setOverallPostId] = useState('');
    const [mainPostAuthor, setMainPostAuthor] = useState('');
    const [currSlide, setCurrSlide] = useState(0);
    const [backgroundMusicIsPlaying, setBackgroundMusicIsPlaying] = useState(false);
    const [backgroundMusicObject, setBackgroundMusicObject] = useState(null);
    const [displayTaggedAccountsOfSlide, setDisplayTaggedAccountsOfSlide] = useState(false);
    const [elementsForCaption, setElementsForCaption] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [elementsForTaggedAccountsOfImageSlide, setElementsForTaggedAccountsOfImageSlide] = useState([]);
    const [displaySectionsOfVidSlide, setDisplaySectionsOfVidSlide] = useState(false);
    const [slideToVidTimeToFrameMappings, setSlideToVidTimeToFrameMappings] = useState({});
    const [thisMediaPostHasBeenViewed, setThisMediaPostHasBeenViewed] = useState(false);
    const [likePostHeartAnimationCoordinates, setLikePostHeartAnimationCoordinates] = useState([-1, -1]);
    const [intervalIdForLikePostHeartAnimation, setIntervalIdForLikePostHeartAnimation] = useState(null);

    const videoSlideRef = useRef(null);
    const hiddenVideoSlideForFrameCollectionRef = useRef(null);
    const canvasRef = useRef(null);
    const slideContainerRef = useRef(null);
    
    const languageCodeToLabelMappings = {
        "af": "Afrikaans",
        "sq": "Albanian",
        "am": "Amharic",
        "ar": "Arabic",
        "hy": "Armenian",
        "az": "Azerbaijani",
        "eu": "Basque",
        "be": "Belarusian",
        "bn": "Bengali",
        "bs": "Bosnian",
        "bg": "Bulgarian",
        "ca": "Catalan",
        "zh-CN": "Chinese (Simplified)",
        "zh-TW": "Chinese (Traditional)",
        "hr": "Croatian",
        "cs": "Czech",
        "da": "Danish",
        "nl": "Dutch",
        "en": "English",
        "et": "Estonian",
        "fi": "Finnish",
        "fr": "French",
        "gl": "Galician",
        "ka": "Georgian",
        "de": "German",
        "el": "Greek",
        "gu": "Gujarati",
        "ht": "Haitian Creole",
        "ha": "Hausa",
        "he": "Hebrew",
        "hi": "Hindi",
        "hu": "Hungarian",
        "is": "Icelandic",
        "id": "Indonesian",
        "ga": "Irish",
        "it": "Italian",
        "ja": "Japanese",
        "kn": "Kannada",
        "kk": "Kazakh",
        "km": "Khmer",
        "ko": "Korean",
        "ku": "Kurdish",
        "ky": "Kyrgyz",
        "lo": "Lao",
        "lv": "Latvian",
        "lt": "Lithuanian",
        "mk": "Macedonian",
        "ms": "Malay",
        "ml": "Malayalam",
        "mt": "Maltese",
        "mi": "Maori",
        "mr": "Marathi",
        "mn": "Mongolian",
        "ne": "Nepali",
        "no": "Norwegian",
        "fa": "Persian",
        "pl": "Polish",
        "pt-BR": "Portuguese (Brazil)",
        "pt-PT": "Portuguese (Portugal)",
        "pa": "Punjabi",
        "ro": "Romanian",
        "ru": "Russian",
        "sr": "Serbian",
        "si": "Sinhala",
        "sk": "Slovak",
        "sl": "Slovenian",
        "so": "Somali",
        "es": "Spanish",
        "sw": "Swahili",
        "sv": "Swedish",
        "tl": "Tagalog",
        "ta": "Tamil",
        "te": "Telugu",
        "th": "Thai",
        "tr": "Turkish",
        "uk": "Ukrainian",
        "ur": "Urdu",
        "uz": "Uzbek",
        "vi": "Vietnamese",
        "cy": "Welsh",
        "xh": "Xhosa",
        "yi": "Yiddish",
        "zu": "Zulu"
    };
      

    useEffect(() => {
        setOverallPostId(postDetails.overallPostId);
        setMainPostAuthor(postDetails.authors[0]);

        if(postDetails.backgroundMusic!==null) {
            setBackgroundMusicObject(new Audio(postDetails.backgroundMusic.src));
        }

        finishSettingElementsForCaption();

        window.addEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
        return () => {
            window.removeEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
        };
    }, []);

    useEffect(() => {
        markPostAsViewed();
    }, [thisMediaPostHasBeenViewed]);


    function checkIfPostIsViewedAsUserScrolls() {
        if (slideContainerRef.current) {
            const rect = slideContainerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
    
            if (rect.bottom <= viewportHeight) {
                setThisMediaPostHasBeenViewed(true);
                window.removeEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
            }
          }
    }

    async function markPostAsViewed() {
        if (authUsername === 'Anonymous Guest') {
            return;
        }

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/markPostAsViewed/${authUsername}/${overallPostId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if(!response.ok) {
                console.error(`The server had trouble marking the post with id ${overallPostId} as viewed`);
            }
        }
        catch (error) {
            console.error(`There was trouble connecting to the server to mark the post with id ${overallPostId}
            as viewed`);
        }
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

    function togglePauseBackgroundMusic() {
        if(!backgroundMusicIsPlaying) {
            backgroundMusicObject.play();
        }
        else {
            backgroundMusicObject.pause();
        }
        setBackgroundMusicIsPlaying(!backgroundMusicIsPlaying);
    }

    function toggleShowTaggedAccountsOfSlide() {
        setDisplaySectionsOfVidSlide(false);
        if(!displayTaggedAccountsOfSlide) {
            if(postDetails.slides[currSlide].type==='Image' && 
            postDetails.slides[currSlide].taggedAccounts.length>0 &&
            elementsForTaggedAccountsOfImageSlide.length==0) {
                finishSettingElementsForTaggedAccountsOfImageSlide();
            }
            setDisplayTaggedAccountsOfSlide(true);
        }
        else {
            setDisplayTaggedAccountsOfSlide(false);
        }
    }
    
    function changeSlide(incrementOrDecrementText) {
        setElementsForTaggedAccountsOfImageSlide([]);
        setDisplaySectionsOfVidSlide(false);
        setDisplayTaggedAccountsOfSlide(false);

        if(incrementOrDecrementText==='increment') {
            setCurrSlide(currSlide+1);
        }
        else {
            setCurrSlide(currSlide-1);
        }
    }

    async function likePost(event) {
        let likeWasSuccessful = true;
        if(!postDetails.isLiked) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/addPostLike/${authUsername}/${overallPostId}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    notifyParentToShowErrorPopup('The server had trouble adding your like to this post');
                    likeWasSuccessful = false;
                }
                else {
                    notifyParentToUpdatePostDetails(
                        overallPostId,
                        {
                            isLiked: true,
                            numLikes: postDetails.numLikes+1
                        }
                    );
                }
            }
            catch (error) {
                notifyParentToShowErrorPopup(
                    'There was trouble connecting to the server to add your like to this post'
                );
                likeWasSuccessful = false;
            }
        }

        if (likeWasSuccessful) {
            if(event==null) {
                startLikePostHeartAnimation(50, 50);
            }
            else if (slideContainerRef.current) {
                const rect = slideContainerRef.current.getBoundingClientRect();
                const x = event.clientX;
                const y = event.clientY;
                const xPercent = ((x - rect.left) / rect.width) * 100;
                const yPercent = ((y - rect.top) / rect.height) * 100;
                startLikePostHeartAnimation(xPercent, yPercent);
            }
        }
    }

    async function toggleLikePost() {
        if (authUsername === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot like posts without logging into an account');
            return;
        }

        if(!postDetails.isLiked) {
            likePost(null);
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/removePostLike/${authUsername}/${overallPostId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    notifyParentToShowErrorPopup('The server had trouble removing your like of this post');
                }
                else {
                    setIntervalIdForLikePostHeartAnimation(null);
                    notifyParentToUpdatePostDetails(
                        overallPostId,
                        {
                            isLiked: false,
                            numLikes: postDetails.numLikes-1
                        }
                    );
                }
            }
            catch (error) {
                notifyParentToShowErrorPopup(
                    'There was trouble connecting to the server to remove your like of this post'
                );
            }
        }
    }

    async function toggleSavePost() {
        if (authUsername === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot save posts without logging into an account');
            return;
        }

        let toggleSaveWasSuccessful = false;
        if(postDetails.isSaved) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/removeSave/${authUsername}/${overallPostId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    notifyParentToShowErrorPopup(
                        'The server had trouble removing your save of this post'
                    );
                }
                else {
                    toggleSaveWasSuccessful = true;
                }
            }
            catch (error) {
                notifyParentToShowErrorPopup(
                    'There was trouble connecting to the server for removing your save of this post'
                );
            }
        }
        else {
           try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/addSave/${authUsername}/${overallPostId}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    notifyParentToShowErrorPopup(
                        'The server had trouble adding your save to this post'
                    );
                }
                else {
                    toggleSaveWasSuccessful = true;
                }
           }
           catch (error) {
                notifyParentToShowErrorPopup(
                    'There was trouble connecting to the server for adding your save to this post'
                );
           }
        }

        if(toggleSaveWasSuccessful) {
            notifyParentToUpdatePostDetails(
                overallPostId,
                {
                    isSaved: !postDetails.isSaved
                }
            );
        }
    }

    function finishSettingElementsForCaption() {
        const newElementsForCaption = [' '];

        let caption = postDetails.caption.content;
        while (caption.length > 0) {
            const indexOfNextAtSymbol = caption.indexOf('@');
            const indexOfNextHashtag = caption.indexOf('#');
        
            if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
                newElementsForCaption.push(<span>{caption}</span>);
                break;
            } 
            else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 &&
            indexOfNextHashtag < indexOfNextAtSymbol)) {
                newElementsForCaption.push(<span>{caption.substring(0, indexOfNextHashtag)}</span>);
        
                caption = caption.substring(indexOfNextHashtag);
                let indexOfSpaceAfterHashtagUsed = caption.indexOf(" ");
                
                if (indexOfSpaceAfterHashtagUsed === -1) indexOfSpaceAfterHashtagUsed = caption.length;
        
                const hashtagUsed = caption.substring(0, indexOfSpaceAfterHashtagUsed);
                newElementsForCaption.push(
                    <a 
                        href={`http://34.111.89.101/search/tags/${hashtagUsed.substring(1)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hashtagOrMention"
                        style={{ color: '#71a3f5' }}
                    >
                        {hashtagUsed}
                    </a>
                );
        
                caption = caption.substring(indexOfSpaceAfterHashtagUsed);
            } 
            else {
                newElementsForCaption.push(<span>{caption.substring(0, indexOfNextAtSymbol)}</span>);
        
                caption = caption.substring(indexOfNextAtSymbol);
                let indexOfSpaceAfterMentionedUsername = caption.indexOf(" ");
        
                if (indexOfSpaceAfterMentionedUsername === -1) indexOfSpaceAfterMentionedUsername = caption.length;
        
                const mentionedUsername = caption.substring(0, indexOfSpaceAfterMentionedUsername);
                newElementsForCaption.push(
                    <a 
                        href={`http://34.111.89.101/profile/${mentionedUsername.substring(1)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hashtagOrMention"
                        style={{ color: '#71a3f5' }}
                    >
                        {mentionedUsername}
                    </a>
                );
        
                caption = caption.substring(indexOfSpaceAfterMentionedUsername);
            }
        }

        setElementsForCaption(newElementsForCaption);
    }

    function updateCommentInput(event) {
        setCommentInput(event.target.value);
    }

    async function postComment() {
        if (authUsername === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot post comments without logging into an account');
            return;
        }

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/postComment/${authUsername}/${overallPostId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    newComment: commentInput
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                notifyParentToShowErrorPopup('The server had trouble adding your comment.');
            }
            else {
                notifyParentToUpdatePostDetails(
                    overallPostId,
                    {
                        numComments: postDetails.numComments+1
                    }
                );
                setCommentInput('');
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup('There was trouble connecting to the server to add your comment.');
        }
    }

    function finishSettingElementsForTaggedAccountsOfImageSlide() {
        const newTaggedAccountElementsOfImageSlide = [];
        
        for(let taggedAccountInfo of postDetails.slides[currSlide].taggedAccounts) {
            newTaggedAccountElementsOfImageSlide.push(
                <a
                    key={taggedAccountInfo[0]}
                    href={`http://34.111.89.101/profile/${taggedAccountInfo[0]}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '1.2%',
                    padding: '0.3em 0.7em', position: 'absolute', top: `${taggedAccountInfo[1]}%`,
                    left: `${taggedAccountInfo[2]}%`, maxWidth: '10em', textAlign: 'start',
                    overflowWrap: 'break'}}
                >
                    {taggedAccountInfo[0]}
                </a>
            );
        }

        setElementsForTaggedAccountsOfImageSlide(newTaggedAccountElementsOfImageSlide);
    }

    function toggleShowSectionsOfVidSlide() {
        setDisplayTaggedAccountsOfSlide(false);
        setDisplaySectionsOfVidSlide(!displaySectionsOfVidSlide);
    }

    function takeUserToSectionInVideo(timeInSeconds) {
        if (videoSlideRef.current) {
            videoSlideRef.current.currentTime = timeInSeconds;
            videoSlideRef.current.play();
        }
    }

    function formatSecondsOfTimeAsString(timeInSeconds) {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const remainingSeconds = timeInSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
        }
    }

    function getVideoFrameAtSpecifiedSlideAndTime(slide, timeInSeconds) {
        const newSlideToVidTimeToFrameMappings = { ...slideToVidTimeToFrameMappings };
    
        if (!(slide in slideToVidTimeToFrameMappings)) {
            newSlideToVidTimeToFrameMappings[slide] = {};
        }
    
        const hiddenVideoSlideForFrameCollection = hiddenVideoSlideForFrameCollectionRef.current;
    
        if (!hiddenVideoSlideForFrameCollection) {
            return defaultVideoFrame;
        }
    
        const canvas = canvasRef.current;
        hiddenVideoSlideForFrameCollection.currentTime = timeInSeconds;
    
        hiddenVideoSlideForFrameCollection.onseeked = () => {
            const ctx = canvas.getContext("2d");
            canvas.width = hiddenVideoSlideForFrameCollection.videoWidth;
            canvas.height = hiddenVideoSlideForFrameCollection.videoHeight;
            ctx.drawImage(hiddenVideoSlideForFrameCollection, 0, 0, canvas.width, canvas.height);
    
            const frameImage = canvas.toDataURL("image/png");
            newSlideToVidTimeToFrameMappings[slide][timeInSeconds] = frameImage;
            setSlideToVidTimeToFrameMappings(newSlideToVidTimeToFrameMappings);
        };
    
        return defaultVideoFrame;
    }

    function startLikePostHeartAnimation(startX, startY) {
        if (intervalIdForLikePostHeartAnimation !== null) {
            return;
        }
    
        setLikePostHeartAnimationCoordinates([startX, startY]);
        
        setIntervalIdForLikePostHeartAnimation('on the way...');
        setTimeout(() => {
            const intervalId = setInterval(() => {
                setLikePostHeartAnimationCoordinates(([x, y]) => {
                    if (y < -7) {
                        clearInterval(intervalId);
                        setIntervalIdForLikePostHeartAnimation(null);
                        return [-1, -1];
                    }
                    return [x, y - 1];
                });
            }, 10);

            setIntervalIdForLikePostHeartAnimation(intervalId);
        }, 400);
    }
    
    

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '61%', alignItems: 'start', padding: '1em 1em'}}>

            <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1em'}}>
                    <UserIcon
                        username={mainPostAuthor}
                        authUsername={authUsername}
                        inStoriesSection={false}
                        hasStories={
                            ('hasStories' in mainPostAuthorInfo) ?
                            mainPostAuthorInfo.hasStories : false
                        }
                        hasUnseenStory={
                            ('hasUnseenStory' in mainPostAuthorInfo) ?
                            mainPostAuthorInfo.hasUnseenStory : false
                        } 
                        profilePhoto={
                            ('profilePhoto' in mainPostAuthorInfo) ?
                            mainPostAuthorInfo.profilePhoto : defaultPfp
                        }
                        isVerified={
                            ('isVerified' in mainPostAuthorInfo) ?
                            mainPostAuthorInfo.isVerified : false
                        }
                    />

                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '0.5em'}}>
                        <p style={{marginBottom: '0em', maxWidth: '18em', textAlign: 'start',
                        overflowWrap: 'break-word'}}>
                            {postDetails.authors.map((author, index) => 
                                (
                                    <>
                                        <a
                                            href={`http://34.111.89.101/profile/${author}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ fontWeight: 'bold' }}
                                        >
                                            {author}
                                        </a>

                                        {(author in usersAndTheirRelevantInfo &&
                                        'isVerified' in usersAndTheirRelevantInfo[author] &&
                                        usersAndTheirRelevantInfo[author].isVerified) &&
                                            (
                                                <img src={verifiedBlueCheck} style={{height: '1.4em',
                                                width: '1.4em', marginLeft: '-0.1em', pointerEvents: 'none',
                                                marginRight: '-0.2em', objectFit: 'contain'}}/>
                                            )
                                        }

                                        {index < postDetails.authors.length - 2 &&
                                            <span style={{ fontWeight: 'bold', marginRight: '0.2em'}}>, </span>
                                        }

                                        {(index === postDetails.authors.length - 2 && index === 0) &&
                                            <span style={{ fontWeight: 'bold', marginRight: '0.2em'}}> and </span>
                                        }

                                        {(index === postDetails.authors.length - 2 && index > 0) &&
                                            <span style={{ fontWeight: 'bold', marginRight: '0.2em'}}>, and </span>
                                        }
                                    </>
                                ))
                            }

                            <span style={{ color: 'gray' }}>
                                {' • ' + formatDatetimeString(postDetails.datetimeOfPost)}
                            </span> 
                        </p>

                        {postDetails.locationOfPost!==null &&
                            (
                                <a href={`http://34.111.89.101/search/locations/${postDetails.locationOfPost}`}
                                style={{fontSize: 'small', marginBottom: '-1em', maxWidth: '20em', textAlign: 'start',
                                overflowWrap: 'break-word'}}>
                                    {postDetails.locationOfPost}
                                </a>
                            )
                        }

                        {backgroundMusicObject!==null &&
                            (
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5em',
                                fontSize: '0.88em', marginBottom: '-1em'}}>
                                    <img src={musicSymbol}
                                    className="iconToBeAdjustedForDarkMode"
                                    style={{pointerEvents: 'none',
                                    height: '1.1em', width: '1.1em', objectFit: 'contain'}}
                                    />
                                    
                                    <p style={{maxWidth: '17em', textAlign: 'start', overflowWrap: 'break-word'}}>
                                        <b>{postDetails.backgroundMusic.songTitle}</b> •
                                        <b>{' ' + postDetails.backgroundMusic.songArtist}</b>
                                    </p>

                                    {!backgroundMusicIsPlaying &&
                                        (
                                            <img src={playIcon}
                                            className="iconToBeAdjustedForDarkMode"
                                            onClick={togglePauseBackgroundMusic}
                                            style={{cursor: 'pointer',
                                            height: '1.3em', width: '1.3em', objectFit: 'contain'}}
                                            />
                                        )
                                    }

                                    {backgroundMusicIsPlaying &&
                                        (
                                            <img src={pauseIcon}
                                            className="iconToBeAdjustedForDarkMode"
                                            onClick={togglePauseBackgroundMusic}
                                            style={{cursor: 'pointer',
                                            height: '1.5em', width: '1.5em', objectFit: 'contain'}}
                                            />
                                        )
                                    }
                                </div>
                            )
                        }

                        {postDetails.adInfo!==null &&
                            (
                                <a href={postDetails.adInfo.link}
                                style={{fontSize: 'small', marginTop: '0.5em'}}>
                                    Sponsored
                                </a>
                            )
                        }
                    </div>
                </div>

                <img src={threeHorizontalDots}
                    className="iconToBeAdjustedForDarkMode"
                    onClick={() => {
                        setDisplayTaggedAccountsOfSlide(false);
                        setDisplaySectionsOfVidSlide(false);
                        notifyParentToShowThreeDotsPopup(postDetails);
                    }}
                    style={{cursor: 'pointer',
                    height: '2em', width: '2em', objectFit: 'contain'}}
                />
            </div>

            <br/>
                    
            {postDetails.slides[currSlide].type==='Image' &&
                (
                    <div ref={slideContainerRef} style={{width: '100%', height: '42em', position: 'relative'}}>
                        <img src={postDetails.slides[currSlide].src}
                        onDoubleClick={likePost}
                        style={{position: 'absolute', objectFit: 'cover',
                        top: '0%', left: '0%', height: '100%', width: '100%'}}/>

                        {currSlide > 0 &&
                            (
                                <img src={nextSlideArrow}
                                onClick={() => changeSlide('decrement')}
                                style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                                objectFit: 'contain', position: 'absolute', left: '1%', top: '50%',
                                transform: 'translateY(-50%) rotate(180deg)'}}/>
                            )
                        }

                        {currSlide < postDetails.slides.length-1 &&
                            (
                                <img src={nextSlideArrow}
                                onClick={() => changeSlide('increment')}
                                style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                                objectFit: 'contain', position: 'absolute', right: '1%', top: '50%',
                                transform: 'translateY(-50%)'}}/>
                            )
                        }

                        <PostDots
                            numSlides={postDetails.slides.length}
                            currSlide={currSlide}
                            currSlideIsImage={true}
                        />

                        {postDetails.slides[currSlide].taggedAccounts.length>0 &&
                                (
                                    <img src={taggedAccountsIcon}
                                    onClick={toggleShowTaggedAccountsOfSlide}
                                    style={{height: '2.4em', width: '2.4em', objectFit: 'contain',
                                    position: 'absolute', bottom: '2%', left: '3%', cursor: 'pointer'}}/>
                                )
                        }

                        {displayTaggedAccountsOfSlide &&
                            (
                                elementsForTaggedAccountsOfImageSlide
                            )
                        }

                        {intervalIdForLikePostHeartAnimation!==null &&
                            (
                                <img src={likePostAnimationHeartIcon} style={{height: '6.6em', width: '6.6em',
                                pointerEvents: 'none', objectFit: 'contain', position: 'absolute',
                                top: `${likePostHeartAnimationCoordinates[1]}%`,
                                left: `${likePostHeartAnimationCoordinates[0]}%`, transform: 'translate(-50%, -50%)'}}/>
                            )
                        }
                    </div>
                )
            }

            {postDetails.slides[currSlide].type==='Video' &&
                (
                    <div ref={slideContainerRef} style={{width: '100%', height: '42em', position: 'relative',
                    backgroundColor: 'black'}}>
                        <video ref={videoSlideRef} muted controls src={postDetails.slides[currSlide].src}
                        onDoubleClick={likePost}
                        style={{width: '100%', height: '100%', position: 'absolute', top: '0%', left: '0%'}}>
                            {postDetails.slides[currSlide].subtitles.map(subtitlesInfo =>
                                (
                                    <track
                                        src={subtitlesInfo.src}
                                        kind="subtitles"
                                        srcLang={subtitlesInfo.langCode}
                                        label={languageCodeToLabelMappings[subtitlesInfo.langCode]}
                                        default={'default' in subtitlesInfo && subtitlesInfo.default}
                                    />
                                ))
                            }
                        </video>

                        <video ref={hiddenVideoSlideForFrameCollectionRef} src={postDetails.slides[currSlide].src}
                        style={{display: 'none'}}/>
                        
                        <canvas ref={canvasRef} style={{ display: "none" }} />

                        {currSlide > 0 &&
                            (
                                <img src={nextSlideArrow}
                                onClick={() => changeSlide('decrement')}
                                style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                                objectFit: 'contain', position: 'absolute', left: '1%', top: '50%',
                                transform: 'translateY(-50%) rotate(180deg)'}}/>
                            )
                        }

                        {currSlide < postDetails.slides.length-1 &&
                            (
                                <img src={nextSlideArrow}
                                onClick={() => changeSlide('increment')}
                                style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                                objectFit: 'contain', position: 'absolute', right: '1%', top: '50%',
                                transform: 'translateY(-50%)'}}/>
                            )
                        } 

                        <PostDots
                            numSlides={postDetails.slides.length}
                            currSlide={currSlide}
                            currSlideIsImage={false}
                        />

                        {postDetails.slides[currSlide].taggedAccounts.length>0 &&
                                (
                                    <img src={taggedAccountsIcon}
                                    onClick={toggleShowTaggedAccountsOfSlide}
                                    style={{height: '2.4em', width: '2.4em', objectFit: 'contain',
                                    position: 'absolute', bottom: '16%', left: '3%', cursor: 'pointer'}}/>
                                )
                        }

                        {(!displaySectionsOfVidSlide && postDetails.slides[currSlide].sections.length>0
                        && !displayTaggedAccountsOfSlide) &&
                            (
                                <div className="videoSlideChaptersOrTaggedAccountsDiv"
                                onClick={toggleShowSectionsOfVidSlide}
                                style={{position: 'absolute',
                                bottom: '0%', right: '-55%', overflowY: 'scroll',
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                padding: '0.5em 1em', cursor: 'pointer', borderRadius: '2em'}}>
                                    <small style={{fontWeight: 'bold'}}>
                                        Show Sections of this Video-Slide
                                    </small>
                                </div>
                            )
                        }

                        {displaySectionsOfVidSlide &&
                            (
                                <div className="videoSlideChaptersOrTaggedAccountsDiv"
                                style={{position: 'absolute', width: '100%',
                                top: '0%', right: '-105%', height: '100%', overflowY: 'scroll', 
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', zIndex: '3'}}>

                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 
                                    'center', padding: '0.4em 1.5em', borderStyle: 'solid', borderColor: 'lightgray',
                                    borderWidth: '0.08em', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>
                                        <h4>Sections of this Video-Slide</h4>
                                        <img src={thinGrayXIcon} onClick={toggleShowSectionsOfVidSlide}
                                        style={{cursor: 'pointer', height: '1.6em',
                                        width: '1.6em', objectFit: 'contain'}}/>
                                    </div>

                                    <br/>
                                    
                                    {postDetails.slides[currSlide].sections.map(sectionInfo =>
                                        (
                                            <div onClick={() => takeUserToSectionInVideo(sectionInfo[0])}
                                            className="videoSlideSection"
                                            style={{display: 'flex', width: '100%', alignItems: 'center',
                                            cursor: 'pointer', padding: '0.4em 1.5em', gap: '1.5em'}}>
                                                <img src={
                                                    (currSlide in slideToVidTimeToFrameMappings &&
                                                    sectionInfo[0] in slideToVidTimeToFrameMappings[currSlide]
                                                    ) ?
                                                    slideToVidTimeToFrameMappings[currSlide][sectionInfo[0]] :
                                                    getVideoFrameAtSpecifiedSlideAndTime(currSlide, sectionInfo[0])
                                                }
                                                style={{pointerEvents: 'none',
                                                height: '8em', width: '8em', objectFit: 'contain'}}/>

                                                <div style={{display: 'flex', flexDirection: 'column',
                                                alignItems: 'start'}}>
                                                    <b>
                                                        {sectionInfo[1]}
                                                    </b>
                                                    <p>
                                                        {formatSecondsOfTimeAsString(sectionInfo[0])}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )
                        }

                        {displayTaggedAccountsOfSlide &&
                            (
                                <div className="videoSlideChaptersOrTaggedAccountsDiv"
                                style={{backgroundColor: 'white', position: 'absolute', width: '100%',
                                zIndex: '3', top: '0%', right: '-105%', height: '100%', overflowY: 'scroll', 
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}}>
                                    <h2 style={{maxWidth: '65%', marginLeft: '20%'}}>
                                        Tagged Accounts of this Video-Slide
                                    </h2>
                                    <hr style={{width: '100%', color: 'lightgray'}}/>
                                    {
                                        postDetails.slides[currSlide].taggedAccounts.map(taggedAccountInfo=>
                                            (
                                                <FollowUser
                                                    key={taggedAccountInfo[0]}
                                                    username={taggedAccountInfo[0]}
                                                    authUsername={authUsername}
                                                    fullName={
                                                       (taggedAccountInfo[0] in usersAndTheirRelevantInfo &&
                                                        'fullName' in
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]) ?
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]].fullName : '?'
                                                    }
                                                    profilePhoto={
                                                        (taggedAccountInfo[0] in usersAndTheirRelevantInfo &&
                                                        'profilePhoto' in
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]) ?
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]].profilePhoto :
                                                        defaultPfp
                                                    }
                                                    isVerified={
                                                        (taggedAccountInfo[0] in usersAndTheirRelevantInfo &&
                                                        'isVerified' in
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]) ?
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]].isVerified :
                                                        false
                                                    }
                                                    followStatus={taggedAccountInfo[1]}
                                                    notifyParentToShowErrorPopup={
                                                        (errorMessage) => {
                                                            setDisplayTaggedAccountsOfSlide(false);
                                                            setDisplaySectionsOfVidSlide(false);
                                                            notifyParentToShowErrorPopup(errorMessage);
                                                        }
                                                    }
                                                />
                                            )
                                        )
                                    }
                                </div>
                            )
                        }

                        {intervalIdForLikePostHeartAnimation!==null &&
                            (
                                <img src={likePostAnimationHeartIcon} style={{height: '6.6em', width: '6.6em',
                                pointerEvents: 'none', objectFit: 'contain', position: 'absolute',
                                top: `${likePostHeartAnimationCoordinates[1]}%`,
                                left: `${likePostHeartAnimationCoordinates[0]}%`, transform: 'translate(-50%, -50%)'}}/>
                            )
                        }
                    </div>
                )
            }

            {postDetails.adInfo!==null &&
                (
                    <a href={postDetails.adInfo.link}
                    style={{fontWeight: 'bold', fontSize: '1.1em', width: '92%'}}>
                        <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: '1em',
                        justifyContent: 'start', borderStyle: 'solid', borderTop: 'none', borderColor: 'lightgray',
                        borderWidth: '0.065em', padding: '1em 1em'}}>
                            <img src={megaphone} style={{height: '1.8em', width: '1.8em', objectFit: 'contain',
                            pointerEvents: 'none'}}/>

                            <p style={{maxWidth: '77%', overflowWrap: 'break-word', textAlign: 'start'}}>
                                {'Click this to ' + postDetails.adInfo.callToAction}
                            </p>
                        </div>
                    </a>
                )
            }

            <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '1em'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    {!postDetails.isLiked &&
                        (
                            <img src={blankHeartIcon}
                                onClick={toggleLikePost}
                                className="mediaPostButton iconToBeAdjustedForDarkMode"
                            />
                        )
                    }

                    {postDetails.isLiked &&
                        (
                            <img src={redHeartIcon}
                                onClick={toggleLikePost}
                                className="mediaPostButton"
                            />
                        )
                    }

                    <img src={commentIcon}
                        onClick={() => {
                            setDisplayTaggedAccountsOfSlide(false);
                            setDisplaySectionsOfVidSlide(false);
                            notifyParentToShowCommentsPopup(
                                postDetails, currSlide, mainPostAuthorInfo
                            );
                        }}
                        className="mediaPostButton iconToBeAdjustedForDarkMode"
                    />
                    
                    <img src={sendPostIcon}
                        onClick={() => {
                            setDisplayTaggedAccountsOfSlide(false);
                            setDisplaySectionsOfVidSlide(false);
                            notifyParentToShowSendPostPopup(overallPostId);
                        }}
                        className="mediaPostButton iconToBeAdjustedForDarkMode"
                    />
                </div>

                {!postDetails.isSaved &&
                    (
                        <img src={blankSavedIcon}
                            onClick={toggleSavePost}
                            className="mediaPostButton iconToBeAdjustedForDarkMode"
                        />
                    )
                }

                {postDetails.isSaved &&
                    (
                        <img src={blackSavedIcon}
                            onClick={toggleSavePost}
                            className="mediaPostButton iconToBeAdjustedForDarkMode"
                        />
                    )
                }
            </div>
            
            {postDetails.likersFollowedByAuthUser.length==0 &&
                (
                    <b onClick={() => {
                        setDisplayTaggedAccountsOfSlide(false);
                        setDisplaySectionsOfVidSlide(false);
                        notifyParentToShowLikersPopup('post', overallPostId);
                    }}
                    style={{marginBottom: '0em', maxWidth: '60%',
                    overflowWrap: 'break-word', textAlign: 'start'}}>
                        {postDetails.numLikes.toLocaleString() + (postDetails.numLikes==1 ? ' like' : ' likes')}
                    </b>
                )
            }

            {postDetails.likersFollowedByAuthUser.length>0 &&
                (
                    <p style={{marginBottom: '0em', maxWidth: '74%', overflowWrap: 'break-word',
                    textAlign: 'start'}}>
                        <span>Liked by </span>
                        {postDetails.likersFollowedByAuthUser.map((username, index) =>
                            (
                                <>
                                    <span style={{ display: 'inline-flex', alignItems: 'center'}}>
                                        <a
                                            href={`http://34.111.89.101/profile/${username}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ fontWeight: 'bold' }}
                                        >
                                            {username}
                                        </a>

                                        {(username in usersAndTheirRelevantInfo &&
                                        'isVerified' in usersAndTheirRelevantInfo[username] &&
                                        usersAndTheirRelevantInfo[username].isVerified) &&
                                            (
                                                <img src={verifiedBlueCheck} style={{height: '1.4em',
                                                width: '1.4em', pointerEvents: 'none', objectFit: 'contain',
                                                marginLeft: '-0.1em', marginRight: '-0.2em'}}/>
                                            )
                                        }
                                    </span>

                                    <span style={{marginRight: '0.15em'}}>, </span>

                                    {index == postDetails.likersFollowedByAuthUser.length-1 &&
                                        (
                                            <>
                                                <span>and </span>
                                                <b onClick={() => {
                                                    setDisplayTaggedAccountsOfSlide(false);
                                                    setDisplaySectionsOfVidSlide(false);
                                                    notifyParentToShowLikersPopup('post', overallPostId);
                                                }}
                                                style={{cursor: 'pointer'}}>
                                                    {
                                                        (postDetails.numLikes-postDetails.likersFollowedByAuthUser.length).
                                                        toLocaleString()
                                                    }
                                                </b>

                                                {postDetails.numLikes-postDetails.likersFollowedByAuthUser.length == 1 &&
                                                    <b onClick={() => {
                                                        setDisplayTaggedAccountsOfSlide(false);
                                                        setDisplaySectionsOfVidSlide(false);
                                                        notifyParentToShowLikersPopup('post', overallPostId);
                                                    }}
                                                    style={{cursor: 'pointer'}}> other</b>
                                                }

                                                {postDetails.numLikes-postDetails.likersFollowedByAuthUser.length !== 1 &&
                                                    <b onClick={() => {
                                                        setDisplayTaggedAccountsOfSlide(false);
                                                        setDisplaySectionsOfVidSlide(false);
                                                        notifyParentToShowLikersPopup('post', overallPostId);
                                                    }}
                                                    style={{cursor: 'pointer'}}> others</b>
                                                }
                                            </>
                                        )
                                    }
                                </>
                            ))
                        }
                    </p>
                )
            }

            <p style={{maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'start', marginBottom: '0em'}}>
                <span style={{ display: 'inline-flex', alignItems: 'center'}}>
                    <a
                        href={`http://34.111.89.101/profile/${mainPostAuthor}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontWeight: 'bold' }}
                    >
                        {mainPostAuthor}
                    </a>

                    {('isVerified' in mainPostAuthorInfo && mainPostAuthorInfo.isVerified) &&
                        (
                            <img src={verifiedBlueCheck} style={{height: '1.4em',
                            width: '1.4em', marginLeft: '-0.1em', pointerEvents: 'none', objectFit: 'contain'}}/>
                        )
                    }
                </span>
                {elementsForCaption}
            </p>

            <p onClick={() => {
                setDisplayTaggedAccountsOfSlide(false);
                setDisplaySectionsOfVidSlide(false);
                notifyParentToShowCommentsPopup(
                    postDetails, currSlide, mainPostAuthorInfo
                );
            }} className="loseOpacityWhenActive"
            style={{color: 'gray', cursor: 'pointer', marginBottom: '1em'}}>
                {
                    postDetails.numComments==0 ? 'No comments yet' :
                    postDetails.numComments==1 ? 'View 1 comment' :
                    `View all ${postDetails.numComments.toLocaleString()} comments`
                }
            </p>

            <div style={{width: '100%', height: '3em', position: 'relative'}}>
                <input value={commentInput} onChange={updateCommentInput}
                placeholder="Add a comment..."
                style={{fontFamily: 'Arial', width: '100%', outline: 'none', borderTop: 'none',
                borderLeft: 'none', borderRight: 'none', borderColor: 'lightgray',
                fontSize: '1em', paddingBottom: '1em'}}/>

                {commentInput.length>0 &&
                    (
                        <b onClick={postComment} style={{cursor: 'pointer', color: '#28a2fa', position: 'absolute',
                        right: '0%', top: '0%'}}>
                            Post
                        </b>
                    )
                }
            </div>

        </div>
    );
}

export default MediaPost;