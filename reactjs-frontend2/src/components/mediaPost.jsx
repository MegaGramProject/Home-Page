import FollowUser from './FollowUser';
import PostDots from './PostDots';
import UserIcon from './UserIcon';

import blackSavedIcon from '../assets/images/blackSavedIcon.png';
import blankHeartIcon from '../assets/images/blankHeartIcon.png';
import blankSavedIcon from '../assets/images/blankSavedIcon.png';
import commentIcon from '../assets/images/commentIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import heartAnimationIcon from '../assets/images/heartAnimationIcon.webp';
import megaphone from '../assets/images/megaphone.png';
import musicSymbol from '../assets/images/musicSymbol.png';
import nextSlideArrow from '../assets/images/nextSlideArrow.png';
import pauseIcon from '../assets/images/pauseIcon.png';
import playIcon from '../assets/images/playIcon.webp';
import redHeartIcon from '../assets/images/redHeartIcon.png';
import sendPostIcon from '../assets/images/sendPostIcon.png';
import taggedAccountsIcon from '../assets/images/taggedAccountsIcon.png';
import thinGrayXIcon from '../assets/images/thinGrayXIcon.png';
import threeHorizontalDots from '../assets/images/threeHorizontalDots.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';
import defaultVideoFrame from '../assets/images/defaultVideoFrame.jpg';

import { useEffect, useRef, useState } from 'react';


function MediaPost({authUserId, postDetails, mainPostAuthorInfo, isFocused, usersAndTheirRelevantInfo, updatePostDetails,
showThreeDotsPopup, showCommentsPopup, showSendPostPopup, showLikersPopup, showErrorPopup, showStoryViewer, focusOnThisMediaPost}) {
    const [overallPostId, setOverallPostId] = useState('');

    const [mainPostAuthorId, setMainPostAuthorId] = useState(-1);

    const [bgMusicIsPlaying, setBgMusicIsPlaying] = useState(false);
    const [bgMusicObject, setBgMusicObject] = useState(null);

    const [currSlide, setCurrSlide] = useState(0);
    const [displayTaggedAccountsOfSlide, setDisplayTaggedAccountsOfSlide] = useState(false);
    const [displaySectionsOfVidSlide, setDisplaySectionsOfVidSlide] = useState(false);

    const [elementsForCaption, setElementsForCaption] = useState([]);

    const [commentInput, setCommentInput] = useState('');
    const [commentInputTextareaIsActive, setCommentInputTextareaIsActive] = useState(false);

    const [slideToVidTimeToFrameMappings, setSlideToVidTimeToFrameMappings] = useState({});

    const [heartAnimationCoordinates, setHeartAnimationCoordinates] = useState([-1, -1]);
    const [intervalIdForHeartAnimation, setIntervalIdForHeartAnimation] = useState(null);

    const [yourPostViewHasBeenAdded, setYourPostViewHasBeenAdded] = useState(false);

    const vidSlideRef = useRef(null);
    const currSlideRef = useRef(null);
    
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
        setMainPostAuthorId(postDetails.authorIds[0]);

        if(postDetails.bgMusic !== null) {
            setBgMusicObject(new Audio(postDetails.bgMusic.src));
        }

        finishSettingElementsForCaption();

        window.addEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
        checkIfPostIsViewedAsUserScrolls();

        return () => {
            window.removeEventListener('scroll', checkIfPostIsViewedAsUserScrolls);

            if (isFocused) {
                window.removeEventListener('keydown', handleKeyDownEventsWhenFocused);
            }
        };
    }, []);


    useEffect(() => {
        bgMusicObject.addEventListener('loadedmetadata', () => {
            if (postDetails.bgMusic.startTime > 0) {
                bgMusicObject.currentTime = postDetails.bgMusic.startTime;
            }
        });

        bgMusicObject.addEventListener('timeupdate', () => {
            let bgMusicEndTime = -1;

            if (postDetails.bgMusic.endTime == -1) {
                bgMusicEndTime = bgMusicObject.duration;
            }
            else {
                bgMusicEndTime = postDetails.bgMusic.endTime;
            }

            if (bgMusicObject.currentTime >= bgMusicEndTime) {
                if (postDetails.bgMusic.startTime > 0) {
                    bgMusicObject.currentTime = postDetails.bgMusic.startTime;
                }
                else {
                    bgMusicObject.currentTime = 0;
                }
            }
        });
    }, [bgMusicObject]);

 
    useEffect(() => {
        if (isFocused) {
            window.addEventListener('keydown', handleKeyDownEventsWhenFocused);
        }
        else {
            window.removeEventListener('keydown', handleKeyDownEventsWhenFocused);
        }
    }, [isFocused]);


    function handleKeyDownEventsWhenFocused(event) {
        const currSlideIsVid = postDetails.slides[currSlide].type === 'video';

        switch (event.key) {
            case 'Escape':
                if (!currSlideIsVid) {
                    focusOnThisMediaPost('');
                }
                break;
            case 'Enter':
                if (commentInputTextareaIsActive && commentInput.length > 0) {
                    postComment();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                if (!commentInputTextareaIsActive && !currSlideIsVid && currSlide > 0) {
                    changeSlide('decrement');
                }
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                if (!commentInputTextareaIsActive && !currSlideIsVid && currSlide + 1 < postDetails.slides.length) {
                    changeSlide('increment');
                }
                break;
            case 'm':
            case 'M':
                if (!commentInputTextareaIsActive && !currSlideIsVid && bgMusicIsPlaying) {
                    togglePauseBackgroundMusic();
                }
                break;
            case 'k':
            case 'K':
            case ' ':
                if (!commentInputTextareaIsActive && !currSlideIsVid && bgMusicObject !== null) {
                    togglePauseBackgroundMusic();
                }
        }
    }


    function checkIfPostIsViewedAsUserScrolls() {
        if (currSlideRef.current) {
            const rect = currSlideRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (rect.bottom <= viewportHeight && !yourPostViewHasBeenAdded) {
                setYourPostViewHasBeenAdded(true);
                addViewToPost();
                window.removeEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
            }
        }
    }


    function togglePauseBackgroundMusic() {
        if(!bgMusicIsPlaying) {
            bgMusicObject.play();
        }
        else {
            bgMusicObject.pause();
        }
        
        setBgMusicIsPlaying(!bgMusicIsPlaying);
    }


    function toggleShowTaggedAccountsOfSlide() {
        if(!displayTaggedAccountsOfSlide) {
            setDisplaySectionsOfVidSlide(false);
            setDisplayTaggedAccountsOfSlide(true);
        }
        else {
            setDisplayTaggedAccountsOfSlide(false);
        }
    }

    
    function changeSlide(incrementOrDecrementText) {
        setDisplayTaggedAccountsOfSlide(false);
        setDisplaySectionsOfVidSlide(false);

        if(incrementOrDecrementText==='increment') {
            setCurrSlide(currSlide+1);
        }
        else {
            setCurrSlide(currSlide-1);
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


    async function toggleShowSectionsOfVidSlide() {
        if (!displaySectionsOfVidSlide && postDetails.slides[currSlide].sections.length > 0 &&
        !(currSlide in slideToVidTimeToFrameMappings)) {
            for(let sectionInfo of postDetails.slides[currSlide].sections) {
                await getVideoFrameAtSpecifiedSlideAndTime(currSlide, sectionInfo[0]);
            }
        }

        setDisplayTaggedAccountsOfSlide(false);
        setDisplaySectionsOfVidSlide(!displaySectionsOfVidSlide);
    }


    function takeUserToSectionInVideo(timeInSeconds) {
        if (vidSlideRef.current) {
            vidSlideRef.current.currentTime = timeInSeconds;
            vidSlideRef.current.play();
        }
    }


    async function getVideoFrameAtSpecifiedSlideAndTime(slide, timeInSeconds) {
        return new Promise((resolve, reject) => {
            if (slide in slideToVidTimeToFrameMappings && timeInSeconds in slideToVidTimeToFrameMappings[slide]) {
                resolve(slideToVidTimeToFrameMappings[slide][timeInSeconds]);
            }
    
            const newSlideToVidTimeToFrameMappings = { ...slideToVidTimeToFrameMappings };
        
            if (!(slide in slideToVidTimeToFrameMappings)) {
                newSlideToVidTimeToFrameMappings[slide] = {};
            }

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.src = postDetails.slides[currSlide].src;


            video.addEventListener('loadeddata', () => {
                video.currentTime = timeInSeconds;
            });


            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const frameImage = canvas.toDataURL('image/png');

                newSlideToVidTimeToFrameMappings[slide][timeInSeconds] = frameImage;
                setSlideToVidTimeToFrameMappings(newSlideToVidTimeToFrameMappings);

                resolve(frameImage);
            });


            video.onerror = () => {
                reject(new Error('Error loading video'));
            };
        });
    }


    function startHeartAnimation(startX, startY) {
        if (intervalIdForHeartAnimation !== null) {
            return;
        }
    
        setHeartAnimationCoordinates([startX, startY]);
        
        setIntervalIdForHeartAnimation('on the way...');

        setTimeout(() => {
            const newIntervalIdForLikePostHeartAnimation = setInterval(() => {
                setHeartAnimationCoordinates(([x, y]) => {
                    if (y < -7) {
                        clearInterval(newIntervalIdForLikePostHeartAnimation);
                        setIntervalIdForHeartAnimation(null);
                        return [-7, -7];
                    }
                    return [x, y - 1];
                });
            }, 10);

            setIntervalIdForHeartAnimation(newIntervalIdForLikePostHeartAnimation);
        }, 400);
    }


    function notifyParentToFocusOnThisMediaPost() {
        if (isFocused) {
            return;
        }

        focusOnThisMediaPost(overallPostId);
    }


    async function addViewToPost() {
        try {
            const response = await fetch(
            'http://34.111.89.101/api/Home-Page/springBootBackend2/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `mutation ($authUserId: Int!, $overallPostId: String!) {
                        addViewToPost(authUserId: $authUserId, overallPostId: $overallPostId)
                    }`,
                    variables: {
                        authUserId: authUserId,
                        overallPostId: overallPostId
                    }
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                console.error(`The server had trouble adding your view to post ${overallPostId}`);
            }
        }
        catch (error) {
            console.error(`There was trouble connecting to the server to add your view to post ${overallPostId}`);
        }
    }


    async function likePost(event) {
        if (postDetails.isLiked) {
            return;
        }

        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like posts');
            return;
        }

        let likeWasSuccessful = true;

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addLikeToPostOrComment/${authUserId}/${overallPostId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if(!response.ok) {
                showErrorPopup('The server had trouble adding your like to this post');
                likeWasSuccessful = false;
            }
            else {
                updatePostDetails(
                    overallPostId,
                    {
                        isLiked: true,
                        numLikes: postDetails.numLikes+  1
                    }
                );
            }
        }
        catch (error) {
            showErrorPopup(
                'There was trouble connecting to the server to add your like to this post'
            );
            likeWasSuccessful = false;
        }

        if (likeWasSuccessful) {
            if(event == null) {
                startHeartAnimation(50, 50);
            }
            else if (currSlideRef.current) {
                const rect = currSlideRef.current.getBoundingClientRect();
                const x = event.clientX;
                const y = event.clientY;
                const xPercent = ((x - rect.left) / rect.width) * 100;
                const yPercent = ((y - rect.top) / rect.height) * 100;
                
                startHeartAnimation(xPercent, yPercent);
            }
        }
    }


    async function toggleLikePost() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like posts');
            return;
        }

        if(!postDetails.isLiked) {
            likePost(null);
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeLikeFromPostOrComment/${authUserId}
                /${overallPostId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    showErrorPopup('The server had trouble removing your like of this post');
                }
                else {
                    setIntervalIdForHeartAnimation(null);
                    updatePostDetails(
                        overallPostId,
                        {
                            isLiked: false,
                            numLikes: postDetails.numLikes - 1
                        }
                    );
                }
            }
            catch (error) {
                showErrorPopup(
                    'There was trouble connecting to the server to remove your like of this post'
                );
            }
        }
    }


    async function toggleSavePost() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to save posts');
            return;
        }

        let toggleSaveWasSuccessful = true;

        if(postDetails.isSaved) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/djangoBackend2/unsavePost/${authUserId}/${overallPostId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    showErrorPopup(
                        'The server had trouble removing your save of this post'
                    );

                    toggleSaveWasSuccessful = false;
                }
            }
            catch (error) {
                showErrorPopup(
                    'There was trouble connecting to the server to remove your save of this post'
                );
                toggleSaveWasSuccessful = false;
            }
        }
        else {
           try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/djangoBackend2/savePost/${authUserId}/${overallPostId}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    showErrorPopup(
                        'The server had trouble adding your save to this post'
                    );
                    toggleSaveWasSuccessful = false;
                }
           }
           catch (error) {
                showErrorPopup(
                    'There was trouble connecting to the server to add your save to this post'
                );
                toggleSaveWasSuccessful = false;
           }
        }

        if(toggleSaveWasSuccessful) {
            updatePostDetails(
                overallPostId,
                {
                    isSaved: !postDetails.isSaved
                }
            );
        }
    }


    async function postComment() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to add comments to posts');
            return;
        }

        try {
            const response = await fetch(
            'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `mutation ($authUserId: Int!, $overallPostId: String!, $commentContent: String!) {
                        addCommentToPost(
                            authUserId: $authUserId, overallPostId: $overallPostId, commentContent: $commentContent
                        )
                    }`,
                    variables: {
                        authUserId: authUserId,
                        overallPostId: overallPostId,
                        commentContent: commentInput
                    }
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                showErrorPopup('The server had trouble adding your comment.');
            }
            else {
                updatePostDetails(
                    overallPostId,
                    {
                        numComments: postDetails.numComments+1
                    }
                );
                setCommentInput('');
            }
        }
        catch (error) {
            showErrorPopup('There was trouble connecting to the server to add your comment.');
        }
    }


    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '61%', alignItems: 'start', padding: '1em 1em',
        marginBottom: '2em'}}>
            <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1em'}}>
                    <UserIcon
                        authUserId={authUserId}
                        userId={mainPostAuthorId}
                        username={postDetails.authorUsernames[0]}
                        userPfp={mainPostAuthorInfo.profilePhoto ?? defaultPfp}
                        inStoriesSection={false}
                        isSponsored={false}
                        userHasStories={mainPostAuthorInfo.hasStories ?? false}
                        userHasUnseenStory={mainPostAuthorInfo.hasUnseenStory ?? false}
                        userIsVerified={mainPostAuthorInfo.isVerified ?? false}
                        showStoryViewer={showStoryViewer}
                    />

                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '0.5em'}}>
                        <p style={{marginBottom: '0em', maxWidth: '20em', textAlign: 'start',
                        overflowWrap: 'break-word'}}>
                            {postDetails.authorUsernames.map((authorUsername, index) => 
                                (
                                    <>
                                        <a
                                            href={`http://34.111.89.101/profile/${authorUsername}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', wordBreak:
                                            'break-word', marginRight: '0.2em'}}
                                        >
                                            { authorUsername }

                                            {(usersAndTheirRelevantInfo[postDetails.authorIds[index]]?.isVerified ?? false) &&
                                                (
                                                    <img src={verifiedBlueCheck} style={{height: '1.4em', width: '1.4em',
                                                    pointerEvents: 'none', objectFit: 'contain', marginLeft: '-0.1em',
                                                    marginRight: '-0.2em'}}/>
                                                )
                                            }
                                        </a>

                                        {index < postDetails.authorUsernames.length - 2 &&
                                            <span style={{ fontWeight: 'bold', marginRight: '0.2em'}}>, </span>
                                        }

                                        {(index == postDetails.authorUsernames.length - 2 && index == 0) &&
                                            <span style={{ fontWeight: 'bold', marginRight: '0.2em'}}> and </span>
                                        }

                                        {(index == postDetails.authorUsernames.length - 2 && index > 0) &&
                                            <span style={{ fontWeight: 'bold', marginRight: '0.2em'}}>, and </span>
                                        }
                                    </>
                                ))
                            }

                            <span style={{ color: 'gray' }}>
                                { ' • ' + postDetails.datetime }
                            </span> 
                        </p>

                        {postDetails.locationOfPost!==null &&
                            (
                                <a href={`http://34.111.89.101/search/locations/${postDetails.locationOfPost}`}
                                target="_blank" rel="noopener noreferrer" style={{fontSize: '0.9em', marginBottom: '0', maxWidth:
                                '20em', textAlign: 'start', overflowWrap: 'break-word'}}>
                                    { postDetails.locationOfPost }
                                </a>
                            )
                        }

                        {bgMusicObject !== null &&
                            (
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '0.9em',
                                marginBottom: '-0.5em', marginTop: '-0.5em'}}>
                                    <img src={musicSymbol}
                                        className="iconToBeAdjustedForDarkMode"
                                        style={{pointerEvents: 'none',
                                        height: '1.1em', width: '1.1em', objectFit: 'contain'}}
                                    />
                                    
                                    <p style={{maxWidth: '17em', textAlign: 'start', overflowWrap: 'break-word'}}>
                                        <b>{ postDetails.bgMusic.title }</b> • <b>{ postDetails.bgMusic.artist }</b>
                                    </p>

                                    {!bgMusicIsPlaying &&
                                        (
                                            <img src={playIcon} className="iconToBeAdjustedForDarkMode"
                                            onClick={togglePauseBackgroundMusic} style={{cursor: 'pointer', height: '1.3em',
                                            width: '1.3em', objectFit: 'contain'}}/>
                                        )
                                    }

                                    {bgMusicIsPlaying &&
                                        (
                                            <img src={pauseIcon} className="iconToBeAdjustedForDarkMode"
                                            onClick={togglePauseBackgroundMusic} style={{cursor: 'pointer', height: '1.5em',
                                            width: '1.5em', objectFit: 'contain'}}/>
                                        )
                                    }
                                </div>
                            )
                        }

                        {postDetails.adInfo !== null &&
                            (
                                <a href={postDetails.adInfo.link} target="_blank" rel="noopener noreferrer"
                                style={{fontSize: '0.9em'}}>
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
                        showThreeDotsPopup(postDetails);
                    }}
                    style={{cursor: 'pointer',
                    height: '2em', width: '2em', objectFit: 'contain'}}
                />
            </div>

            <br/>
                    
            {postDetails.slides[currSlide].type === 'image' &&
                (
                    <div ref={currSlideRef} style={{width: '100%', height: '42em', position: 'relative', marginTop: '1em'}}>
                        <img src={postDetails.slides[currSlide].src} onClick={notifyParentToFocusOnThisMediaPost}
                        onDoubleClick={likePost} style={{position: 'absolute', objectFit: 'cover', top: '0%', left: '0%', height:
                        '100%', width: '100%'}}/>

                        {currSlide > 0 &&
                            (
                                <img src={nextSlideArrow} onClick={() => changeSlide('decrement')}
                                style={{cursor: 'pointer', height: '2.4em', width: '2.4em', objectFit: 'contain', position:
                                'absolute', left: '1%', top: '50%', transform: 'translateY(-50%) rotate(180deg)'}}/>
                            )
                        }

                        {currSlide < postDetails.slides.length-1 &&
                            (
                                <img src={nextSlideArrow} onClick={() => changeSlide('increment')}
                                style={{cursor: 'pointer', height: '2.4em', width: '2.4em', objectFit: 'contain', position:
                                'absolute', right: '1%', top: '50%', transform: 'translateY(-50%)'}}/>
                            )
                        }

                        {postDetails.slides.length > 1 &&
                            (
                                <PostDots
                                    numSlides={postDetails.slides.length}
                                    currSlide={currSlide}
                                    currSlideIsImage={true}
                                />
                            )
                        }
    
                        {postDetails.slides[currSlide].taggedAccounts.length > 0 &&
                            (
                                <img src={taggedAccountsIcon} onClick={toggleShowTaggedAccountsOfSlide}
                                style={{height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute', bottom: '2%',
                                left: '3%', cursor: 'pointer'}}/>
                            )
                        }

                        {displayTaggedAccountsOfSlide &&
                            (
                                postDetails.slides[currSlide].taggedAccounts.map(taggedAccountInfo => {
                                    <a
                                        key={taggedAccountInfo[0]}
                                        href={`http://34.111.89.101/profile/${taggedAccountInfo[0]}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '0.3em;',
                                        padding: '0.3em 0.7em', position: 'absolute', top: `${taggedAccountInfo[1]}%`,
                                        left: `${taggedAccountInfo[2]}%`, maxWidth: '10em', textAlign: 'start',
                                        overflowWrap: 'break'}}
                                    >
                                        { taggedAccountInfo[0] }
                                    </a>
                                })
                            )
                        }

                        {intervalIdForHeartAnimation !== null &&
                            (
                                <img src={heartAnimationIcon} style={{height: '6.6em', width: '6.6em',
                                pointerEvents: 'none', objectFit: 'contain', position: 'absolute',
                                top: `${heartAnimationCoordinates[1]}%`, left: `${heartAnimationCoordinates[0]}%`,
                                transform: 'translate(-50%, -50%)'}}/>
                            )
                        }
                    </div>
                )
            }

            {postDetails.slides[currSlide].type === 'video' &&
                (
                    <div ref={currSlideRef} style={{width: '100%', height: '42em', position: 'relative',
                    backgroundColor: 'black', marginTop: '1em'}}>
                        <video ref={vidSlideRef} src={postDetails.slides[currSlide].src} muted controls
                        onClick={notifyParentToFocusOnThisMediaPost} onDoubleClick={likePost} style={{width: '100%', height: '100%',
                        position: 'absolute', top: '0%', left:
                        '0%'}}>
                            {postDetails.slides[currSlide].subtitles.map(subtitlesInfo =>
                                (
                                    <track
                                        key={subtitlesInfo.langCode}
                                        kind="subtitles"
                                        src={subtitlesInfo.src}
                                        srcLang={subtitlesInfo.langCode}
                                        label={languageCodeToLabelMappings[subtitlesInfo.langCode]}
                                        default={subtitlesInfo.default ?? false}
                                    />
                                ))
                            }
                        </video>
            

                        {currSlide > 0 &&
                            (
                                <img src={nextSlideArrow} onClick={() => changeSlide('decrement')} style={{cursor: 'pointer',
                                height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute', left: '1%', top:
                                '50%', transform: 'translateY(-50%) rotate(180deg)'}}/>
                            )
                        }

                        {currSlide < postDetails.slides.length-1 &&
                            (
                                <img src={nextSlideArrow} onClick={() => changeSlide('increment')} style={{cursor: 'pointer',
                                height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute', right: '1%', top:
                                '50%', transform: 'translateY(-50%)'}}/>
                            )
                        } 

                        {postDetails.slides.length > 1 &&
                            (
                                <PostDots
                                    numSlides={postDetails.slides.length}
                                    currSlide={currSlide}
                                    currSlideIsImage={false}
                                />
                            )
                        }

                        {postDetails.slides[currSlide].taggedAccounts.length > 0 &&
                                (
                                    <img src={taggedAccountsIcon} onClick={toggleShowTaggedAccountsOfSlide}
                                    style={{height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute', bottom:
                                    '16%', left: '3%', cursor: 'pointer'}}/>
                                )
                        }

                        {(!displaySectionsOfVidSlide && !displayTaggedAccountsOfSlide &&
                        postDetails.slides[currSlide].sections.length > 0) &&
                            (
                                <div className="videoSlideChaptersOrTaggedAccountsDiv" onClick={toggleShowSectionsOfVidSlide}
                                style={{position: 'absolute', bottom: '0%', right: '-55%', overflowY: 'scroll',
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', padding: '0.5em 1em', cursor: 'pointer',
                                borderRadius: '2em'}}>
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
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', zIndex: '2'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 
                                    'center', padding: '0.4em 1.5em', borderStyle: 'solid', borderColor: 'lightgray',
                                    borderWidth: '0.08em', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>
                                        <h4>Sections of this Video-Slide</h4>
                                        
                                        <img src={thinGrayXIcon} onClick={toggleShowSectionsOfVidSlide} style={{cursor: 'pointer',
                                        height: '1.6em', width: '1.6em', objectFit: 'contain'}}/>
                                    </div>

                                    <br/>
                                    
                                    {postDetails.slides[currSlide].sections.map(sectionInfo =>
                                        (
                                            <div key={sectionInfo[0]} onClick={() => takeUserToSectionInVideo(sectionInfo[0])}
                                            className="videoSlideSection" style={{display: 'flex', width: '100%', alignItems:
                                            'center', cursor: 'pointer', padding: '0.4em 1.5em', gap: '1.5em'}}>
                                                <img src={
                                                    slideToVidTimeToFrameMappings[currSlide]?.[sectionInfo[0]] ?? defaultVideoFrame
                                                }
                                                style={{pointerEvents: 'none',  height: '8em', width: '8em', objectFit:
                                                'contain'}}/>

                                                <div style={{display: 'flex', flexDirection: 'column',
                                                alignItems: 'start'}}>
                                                    <b>
                                                        { sectionInfo[2] }
                                                    </b>
                                                    <p>
                                                        { sectionInfo[1] }
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
                                <div className="videoSlideChaptersOrTaggedAccountsDiv" style={{backgroundColor: 'white', position:
                                'absolute', width: '100%', zIndex: '2', top: '0%', right: '-105%', height: '100%', overflowY:
                                'scroll', boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 
                                    'center', padding: '0.4em 1.5em', borderStyle: 'solid', borderColor: 'lightgray',
                                    borderWidth: '0.08em', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>
                                        <h4>Tagged Accounts of this Video-Slide</h4>
                                        
                                        <img src={thinGrayXIcon} onClick={toggleShowTaggedAccountsOfSlide} style={{cursor:
                                        'pointer', height: '1.6em', width: '1.6em', objectFit: 'contain'}}/>
                                    </div>

                                    <br/>

                                    {
                                        postDetails.slides[currSlide].taggedAccounts.map(taggedAccountInfo=>
                                            (
                                                <FollowUser
                                                    key={taggedAccountInfo[0]}
                                                    authUserId={authUserId}
                                                    userId={taggedAccountInfo[0]}
                                                    username={
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.username ??
                                                        `user ${taggedAccountInfo[0]}`
                                                    }
                                                    userFullName={
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.fullName ??
                                                        'Could not find full name'
                                                    }
                                                    userPfp={
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.profilePhoto ??
                                                        defaultPfp
                                                    }
                                                    originalFollowText={taggedAccountInfo[1]}
                                                    userIsVerified={
                                                        usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.isVerified ?? 
                                                        false
                                                    }
                                                    showErrorPopup={showErrorPopup}
                                                />
                                            )
                                        )
                                    }
                                </div>
                            )
                        }

                        {intervalIdForHeartAnimation !== null &&
                            (
                                <img src={heartAnimationIcon} style={{height: '6.6em', width: '6.6em',
                                pointerEvents: 'none', objectFit: 'contain', position: 'absolute',
                                top: `${heartAnimationCoordinates[1]}%`,
                                left: `${heartAnimationCoordinates[0]}%`, transform: 'translate(-50%, -50%)'}}/>
                            )
                        }
                    </div>
                )
            }

            {postDetails.adInfo !== null &&
                (
                    <a href={postDetails.adInfo.link}
                    style={{fontWeight: 'bold', fontSize: '1.1em', width: '92%'}}>
                        <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: '1em',
                        justifyContent: 'start', borderStyle: 'solid', borderTop: 'none', borderColor: 'lightgray',
                        borderWidth: '0.065em', padding: '1em 1em'}}>
                            <img src={megaphone} style={{height: '1.8em', width: '1.8em', objectFit: 'contain',
                            pointerEvents: 'none'}}/>

                            <p style={{maxWidth: '77%', overflowWrap: 'break-word', textAlign: 'start'}}>
                                { postDetails.adInfo.callToAction }
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
                            <img src={blankHeartIcon} onClick={toggleLikePost}
                            className="mediaPostButton iconToBeAdjustedForDarkMode"/>
                        )
                    }

                    {postDetails.isLiked &&
                        (
                            <img src={redHeartIcon} onClick={toggleLikePost} className="mediaPostButton"/>
                        )
                    }

                    <img src={commentIcon} className="mediaPostButton iconToBeAdjustedForDarkMode"
                    onClick={() => {
                        setDisplayTaggedAccountsOfSlide(false);
                        setDisplaySectionsOfVidSlide(false);
                        showCommentsPopup(
                            postDetails, currSlide
                        );
                    }}/>
                    
                    <img src={sendPostIcon} className="mediaPostButton iconToBeAdjustedForDarkMode"
                    onClick={() => {
                        setDisplayTaggedAccountsOfSlide(false);
                        setDisplaySectionsOfVidSlide(false);
                        showSendPostPopup(overallPostId);
                    }}/>
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
            
            {postDetails.likersFollowedByAuthUser.length == 0 &&
                (
                    <b onClick={() => {
                        setDisplayTaggedAccountsOfSlide(false);
                        setDisplaySectionsOfVidSlide(false);
                        showLikersPopup(overallPostId);
                    }}
                    style={{marginBottom: '0em', maxWidth: '60%', overflowWrap: 'break-word', textAlign: 'start', marginTop: '1em',
                    marginLeft: '0.4em', cursor: 'pointer'}}>
                        { postDetails.numLikes.toLocaleString() + (postDetails.numLikes == 1 ? ' like' : ' likes') }
                    </b>
                )
            }

            {postDetails.likersFollowedByAuthUser.length>0 &&
                (
                    <p style={{marginBottom: '0em', maxWidth: '74%', overflowWrap: 'break-word',
                    textAlign: 'start'}}>
                        <span>Liked by </span>

                        {postDetails.likersFollowedByAuthUser.map((likerId, index) =>
                            (
                                <>
                                    <a 
                                        href={`http://34.111.89.101/profile/${usersAndTheirRelevantInfo[likerId]?.username ??
                                        `user ${likerId}`}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', wordBreak:
                                        'break-word', marginRight: '0.2em'}}
                                    >
                                        { usersAndTheirRelevantInfo[likerId]?.username ?? `user ${likerId}` }

                                        {(usersAndTheirRelevantInfo[likerId]?.isVerified ?? false) &&
                                            (
                                                <img src={verifiedBlueCheck} style={{height: '1.4em', width: '1.4em',
                                                pointerEvents: 'none', objectFit: 'contain', marginLeft: '-0.1em', marginRight:
                                                '-0.2em'}}/>
                                            )
                                        }
                                    </a>

                                    <span style={{marginRight: '0.15em'}}>, </span>

                                    {index == postDetails.likersFollowedByAuthUser.length - 1 &&
                                        (
                                            <>
                                                <span>and </span>

                                                <b onClick={() => {
                                                    setDisplayTaggedAccountsOfSlide(false);
                                                    setDisplaySectionsOfVidSlide(false);
                                                    showLikersPopup(overallPostId);
                                                }}
                                                style={{cursor: 'pointer'}}>
                                                    {
                                                        (postDetails.numLikes - postDetails.likersFollowedByAuthUser.length).
                                                        toLocaleString()
                                                    }
                                                </b>

                                                {postDetails.numLikes - postDetails.likersFollowedByAuthUser.length == 1 &&
                                                    <b onClick={() => {
                                                        setDisplayTaggedAccountsOfSlide(false);
                                                        setDisplaySectionsOfVidSlide(false);
                                                        showLikersPopup(overallPostId);
                                                    }}
                                                    style={{cursor: 'pointer'}}> other</b>
                                                }

                                                {postDetails.numLikes - postDetails.likersFollowedByAuthUser.length !== 1 &&
                                                    <b onClick={() => {
                                                        setDisplayTaggedAccountsOfSlide(false);
                                                        setDisplaySectionsOfVidSlide(false);
                                                        showLikersPopup(overallPostId);
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

            {postDetails.caption !== null &&
                (
                    <p style={{maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'start', marginBottom: '0em'}}>
                        <a 
                            href={`http://34.111.89.101/profile/${usersAndTheirRelevantInfo[postDetails.caption.authorId]?.username ??
                            `user ${postDetails.caption.authorId}`}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', wordBreak: 'break-word',
                            marginRight: '0.2em'}}
                        >
                            { usersAndTheirRelevantInfo[postDetails.caption.authorId]?.username ?? `postDetails.caption.authorId` }

                            {(usersAndTheirRelevantInfo[postDetails.caption.authorId]?.isVerified ?? false) &&
                                (
                                    <img src={verifiedBlueCheck} style={{height: '1.4em', width: '1.4em', pointerEvents: 'none',
                                    objectFit: 'contain', marginLeft: '-0.1em', marginRight: '-0.2em'}}/>
                                )
                            }
                        </a>

                        { elementsForCaption }
                    </p>
                )
            }

            <p onClick={() => {
                setDisplayTaggedAccountsOfSlide(false);
                setDisplaySectionsOfVidSlide(false);
                showCommentsPopup(
                    postDetails, currSlide
                );
            }} className="loseOpacityWhenActive" style={{color: 'gray', cursor: 'pointer', marginBottom: '1em'}}>
                {
                    postDetails.numComments == 0 ? 'No comments yet' :
                    postDetails.numComments == 1 ? 'View 1 comment' :
                    `View all ${postDetails.numComments.toLocaleString()} comments`
                }
            </p>

            <div style={{width: '100%', height: '3em', position: 'relative'}}>
                <input value={commentInput} onChange={updateCommentInput} onFocus={
                    () => { setCommentInputTextareaIsActive(true); }
                } onBlur={ () => { setCommentInputTextareaIsActive(false); } }
                placeholder="Add a comment..." style={{fontFamily:
                'Arial', width: '100%', outline: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderColor:
                'lightgray', fontSize: '1em', paddingBottom: '1em'}}/>

                {commentInput.length > 0 &&
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