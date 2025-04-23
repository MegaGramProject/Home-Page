import { useEffect, useRef, useState } from 'react';

import Comment from '../../Comment';
import FollowUser from '../../followUser';
import PostDots from '../../PostDots';
import UserIcon from '../../userIcon';

import blackSavedIcon from '../../assets/images/blackSavedIcon.png';
import blankHeartIcon from '../../assets/images/blankHeartIcon.png';
import blankSavedIcon from '../../assets/images/blankSavedIcon.png';
import commentIcon from '../../assets/images/commentIcon.png';
import defaultPfp from '../../assets/images/defaultPfp.png';
import defaultVideoFrame from '../../assets/images/defaultVideoFrame.jpg';
import likePostAnimationHeartIcon from '../../assets/images/likePostAnimationHeartIcon.webp';
import loadingAnimation from '../../assets/images/loadingAnimation.gif';
import megaphone from '../../assets/images/megaphone.png';
import musicSymbol from '../../assets/images/musicSymbol.png';
import nextSlideArrow from '../../assets/images/nextSlideArrow.png';
import pauseIcon from '../../assets/images/pauseIcon.png';
import playIcon from '../../assets/images/playIcon.webp';
import plusIconInCircle from '../../assets/images/plusIconInCircle.png';
import redHeartIcon from '../../assets/images/redHeartIcon.png';
import sendPostIcon from '../../assets/images/sendPostIcon.png';
import taggedAccountsIcon from '../../assets/images/taggedAccountsIcon.png';
import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';
import thinWhiteXIcon from '../../assets/images/thinWhiteXIcon.png';
import threeHorizontalDots from '../../assets/images/threeHorizontalDots.png';
import verifiedBlueCheck from '../../assets/images/verifiedBlueCheck.png';

function CommentsPopup({authUser, postDetails, currSlide, notifyParentToClosePopup, notifyParentToShowErrorPopup,
notifyParentToUpdatePostDetails, usersAndTheirRelevantInfo, mainPostAuthorInfo,
notifyParentToShowThreeDotsPopup, notifyParentToShowSendPostPopup, notifyParentToShowLikersPopup,
zIndex, notifyParentToUpdateUsersAndTheirRelevantInfo}) {
    const [overallPostId, setOverallPostId] = useState('');
    const [mainPostAuthor, setMainPostAuthor] = useState('');
    const [currSlideState, setCurrSlideState] = useState(0);
    const [elementsForTaggedAccountsOfImageSlide, setElementsForTaggedAccountsOfImageSlide] = useState([]);
    const [displaySectionsOfVidSlide, setDisplaySectionsOfVidSlide] = useState(false);
    const [displayTaggedAccountsOfSlide, setDisplayTaggedAccountsOfSlide] = useState(false);
    const [likePostHeartAnimationCoordinates, setLikePostHeartAnimationCoordinates] = useState([-1, -1]);
    const [intervalIdForLikePostHeartAnimation, setIntervalIdForLikePostHeartAnimation] = useState(null);
    const [slideToVidTimeToFrameMappings, setSlideToVidTimeToFrameMappings] = useState({});
    const [backgroundMusicIsPlaying, setBackgroundMusicIsPlaying] = useState(false);
    const [backgroundMusicObject, setBackgroundMusicObject] = useState(null);
    const [commentInput, setCommentInput] = useState('');
    const [newlyPostedCommentsByAuthUser, setNewlyPostedCommentsByAuthUser] = useState([]);
    const [orderedListOfComments, setOrderedListOfComments] = useState([]);
    const [commentIdsToExclude, setCommentIdsToExclude] = useState([]);
    const [initialCommentsFetchingIsComplete, setInitialCommentsFetchingIsComplete] = useState(false);
    const [isCurrentlyFetchingAdditionalComments, setIsCurrentlyFetchingAdditionalComments] = useState(false);
    const [initialCommentsFetchingErrorMessage, setInitialCommentsFetchingErrorMessage] = useState("");
    const [additionalCommentsFetchingErrorMessage, setAdditionalCommentsFetchingErrorMessage] = useState("");
    const [replyingToCommentInfo, setReplyingToCommentInfo] = useState(null);
    const [newlyPostedRepliesByAuthUser, setNewlyPostedRepliesByAuthUser] = useState([]);

    const slideContainerRef = useRef(null);
    const videoSlideRef = useRef(null);
    const hiddenVideoSlideForFrameCollectionRef = useRef(null);
    const canvasRef = useRef(null);

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
        setCurrSlideState(currSlide);

        if(postDetails.backgroundMusic!==null) {
            setBackgroundMusicObject(new Audio(postDetails.backgroundMusic.src));
        }

        fetchComments('initial');
    }, []);

    async function fetchComments(initialOrAdditionalText) {
        if(initialOrAdditionalText==='additional') {
            setIsCurrentlyFetchingAdditionalComments(true);
        }

        let newOrderedListOfComments = [...orderedListOfComments];
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getCommentsOfPost/${authUser}/${overallPostId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    commentIdsToExclude: commentIdsToExclude
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                if(initialOrAdditionalText==='initial') {
                    setInitialCommentsFetchingErrorMessage(
                        'The server had trouble getting the initial comments of this post'
                    );
                }
                else {
                    setAdditionalCommentsFetchingErrorMessage(
                        'The server had trouble getting the additional comments of this post'
                    );
                }
            }
            else {
                const newlyFetchedOrderedComments = await response.json();
                newOrderedListOfComments+=newlyFetchedOrderedComments;
                const newCommentIdsToExclude = [...commentIdsToExclude];

                for(let newlyFetchedComment of newlyFetchedOrderedComments) {
                    newCommentIdsToExclude.push(newlyFetchedComment.id);
                }

                setCommentIdsToExclude(newCommentIdsToExclude);
                setOrderedListOfComments(newOrderedListOfComments);
                fetchAllTheNecessaryInfo(newlyFetchedOrderedComments);
            }
        }
        catch (error) {
            if(initialOrAdditionalText==='initial') {
                setInitialCommentsFetchingErrorMessage(
                    'There was trouble connecting to the server to get the initial comments of this post'
                );
            }
            else {
                setAdditionalCommentsFetchingErrorMessage(
                    'There was trouble connecting to the server to get the additional comments of this post'
                );
            }
        }
        finally {
            if(initialOrAdditionalText==='initial') {
                setInitialCommentsFetchingIsComplete(true);
            }
            else {
                setIsCurrentlyFetchingAdditionalComments(false);
            }
        }
    }

    async function fetchAllTheNecessaryInfo(newComments) {
       const newCommenters = newComments.map(newComment=>newComment.username);

       let usersAndTheirIsVerifiedStatuses = {};
       const uniqueListOfNewCommentersNeededForIsVerifiedStatuses = [
            ...new Set(
                newCommenters.filter(username => {
                    return (
                        !(username in usersAndTheirRelevantInfo) ||
                        !('isVerified' in usersAndTheirRelevantInfo[username])
                    )
                })
            )
       ];
       if (uniqueListOfNewCommentersNeededForIsVerifiedStatuses.length>0) {
            try {
                const response = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsVerifiedStatusesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfNewCommentersNeededForIsVerifiedStatuses
                    })
                });
                if(!response.ok) {
                    console.error("The server had trouble fetching all the necessary isVerified statuses");
                    for(let username in uniqueListOfNewCommentersNeededForIsVerifiedStatuses) {
                        usersAndTheirIsVerifiedStatuses[username] = false;
                    }
                }
                else {
                    usersAndTheirIsVerifiedStatuses = await response.json();
                }
            }
            catch (error) {
                console.error(
                    "There was trouble connecting to the server to fetch all the necessary isVerified statuses"
                );
                for(let username in uniqueListOfNewCommentersNeededForIsVerifiedStatuses) {
                    usersAndTheirIsVerifiedStatuses[username] = false;
                }
            }
       }

       let usersAndTheirProfilePhotos = {};
       const uniqueListOfNewCommentersNeededForProfilePhotos = [
            ...new Set(
                newCommenters.filter(username => {
                    return (
                        !(username in usersAndTheirRelevantInfo) ||
                        !('profilePhoto' in usersAndTheirRelevantInfo[username])
                    )
                })
            )
       ];
       if (uniqueListOfNewCommentersNeededForProfilePhotos.length>0) {
            try {
                const response1 = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotosOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfNewCommentersNeededForProfilePhotos
                    })
                });
                if(!response1.ok) {
                    console.error("The server had trouble fetching all the necessary profile-photos");
                    for(let username in uniqueListOfNewCommentersNeededForProfilePhotos) {
                        usersAndTheirProfilePhotos[username] = defaultPfp;
                    }
                }
                else {
                    usersAndTheirProfilePhotos = await response1.json();
                }
            }
            catch (error) {
                console.error("There was trouble connecting to the server to fetch all the necessary profile-photos");
                for(let username in uniqueListOfNewCommentersNeededForProfilePhotos) {
                    usersAndTheirProfilePhotos[username] = defaultPfp;
                }
            }
       }

       const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};
       for(let newCommenter of newCommenters) {
            if(!(newCommenter in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[newCommenter] = {};
            }
            if(newCommenter in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[newCommenter].isVerified = usersAndTheirIsVerifiedStatuses[newCommenter];
            }
            if(newCommenter in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[newCommenter].profilePhoto = usersAndTheirProfilePhotos[newCommenter];
            }
       }
       notifyParentToUpdateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }

    function changeSlide(incrementOrDecrementText) {
        setElementsForTaggedAccountsOfImageSlide([]);
        setDisplaySectionsOfVidSlide(false);
        setDisplayTaggedAccountsOfSlide(false);

        if(incrementOrDecrementText==='increment') {
            setCurrSlideState(currSlideState+1);
        }
        else {
            setCurrSlideState(currSlideState-1);
        }
    }

    function toggleShowTaggedAccountsOfSlide() {
        setDisplaySectionsOfVidSlide(false);
        if(!displayTaggedAccountsOfSlide) {
            if(postDetails.slides[currSlideState].type==='Image') {
                if(postDetails.slides[currSlideState].taggedAccounts.length>0 &&
                elementsForTaggedAccountsOfImageSlide.length==0) {
                    finishSettingElementsForTaggedAccountsOfImageSlide();
                }
            }
            setDisplayTaggedAccountsOfSlide(true);
        }
        else {
            setDisplayTaggedAccountsOfSlide(false);
        }
    }

    function finishSettingElementsForTaggedAccountsOfImageSlide() {
        const newTaggedAccountElementsOfImageSlide = [];
        
        for(let taggedAccountInfo of postDetails.slides[currSlideState].taggedAccounts) {
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

    async function likePost(event) {
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot like posts without logging into an account');
            return;
        }

        let likeWasSuccessful = true;
        if(!postDetails.isLiked) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/addPostLike/${authUser}/${overallPostId}`, {
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


    function takeUserToSectionInVideo(timeInSeconds) {
        if (videoSlideRef.current) {
            videoSlideRef.current.currentTime = timeInSeconds;
            videoSlideRef.current.play();
        }
    }

    function toggleShowSectionsOfVidSlide() {
        setDisplayTaggedAccountsOfSlide(false);
        setDisplaySectionsOfVidSlide(!displaySectionsOfVidSlide);
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

    async function toggleLikePost() {
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot like posts without logging into an account');
            return;
        }

        if(!postDetails.isLiked) {
            likePost(null);
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/removePostLike/${authUser}/${overallPostId}`, {
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
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot save posts without logging into an account');
            return;
        }

        let toggleSaveWasSuccessful = false;
        if(postDetails.isSaved) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/removeSave/${authUser}/${overallPostId}`, {
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
                `http://34.111.89.101/api/Home-Page/expressJSBackend1/addSave/${authUser}/${overallPostId}`, {
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

    async function postComment() {
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot post comments/replies without logging into an account');
            return;
        }

        let commentOrReplyText = '';
        try {
            let response;
            if(replyingToCommentInfo==null) {
                commentOrReplyText = 'comment';
                response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/postComment/${authUser}/${overallPostId}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        newComment: commentInput
                    }),
                    credentials: 'include'
                });
            }
            else {
                commentOrReplyText = 'reply';
                response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/postReply/${authUser}/${replyingToCommentInfo.id}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        newReply: commentInput
                    }),
                    credentials: 'include'
                });
            }
            if(!response.ok) {
                notifyParentToShowErrorPopup(`The server had trouble adding your ${commentOrReplyText}.`);
            }
            else {
                const newCommentOrReplyId = await response.json();
                if (commentOrReplyText==='comment') {
                    notifyParentToUpdatePostDetails(
                        overallPostId,
                        {
                            numComments: postDetails.numComments+1
                        }
                    );
                    setNewlyPostedCommentsByAuthUser([
                        {
                            id: newCommentOrReplyId,
                            content: commentInput,
                            datetime: (new Date()).toISOString(),
                            isEdited: false,
                            numLikes: 0,
                            numReplies: 0,
                            isLikedByAuthUser: false
                        },
                        ...newlyPostedCommentsByAuthUser
                    ]);
                }
                else {
                    setNewlyPostedRepliesByAuthUser([
                        {
                            id: newCommentOrReplyId,
                            content: commentInput,
                            datetime: (new Date()).toISOString(),
                            isEdited: false,
                            numLikes: 0,
                            numReplies: 0,
                            isLikedByAuthUser: false,
                            idOfParentComment: replyingToCommentInfo.id
                        },
                        ...newlyPostedRepliesByAuthUser
                    ]);
                    setReplyingToCommentInfo(null);
                }
                setCommentInput('');
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(
                `There was trouble connecting to the server to add your ${commentOrReplyText}.`
            );
        }
    }

    function updateCommentInput(event) {
        setCommentInput(event.target.value);
    }

    function updateCommentDetails(commentId, updatedDetails) {
        let commentFound = false;
        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.filter(commentDetails => {
            if(commentDetails.id === commentId) {
                commentFound = true;
                const newCommentDetails = {...commentDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newCommentDetails[key] = updatedDetails[key];
                }
                return newCommentDetails;
            }
        });
        if (commentFound) {
            setNewlyPostedCommentsByAuthUser(newNewlyPostedCommentsByAuthUser);
            return;
        }

        const newNewlyPostedRepliesByAuthUser = newlyPostedCommentsByAuthUser.filter(replyDetails => {
            if(replyDetails.id === commentId) {
                commentFound = true;
                const newReplyDetails = {...replyDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newReplyDetails[key] = updatedDetails[key];
                }
                return newReplyDetails;
            }
        });
        if (commentFound) {
            setNewlyPostedRepliesByAuthUser(newNewlyPostedRepliesByAuthUser);
            return;
        }


        const newOrderedListOfComments = orderedListOfComments.map(commentDetails => {
            if(commentDetails.id === commentId) {
                const newCommentDetails = {...commentDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newCommentDetails[key] = updatedDetails[key];
                }
                return newCommentDetails;
            }
        });
        setOrderedListOfComments(newOrderedListOfComments);
    }

    function updateReplyingToCommentInfo(newReplyingToCommentInfo) {
        if(replyingToCommentInfo!==null && replyingToCommentInfo.id === newReplyingToCommentInfo.id) {
            setReplyingToCommentInfo(null);
        }
        else {
            setReplyingToCommentInfo(newReplyingToCommentInfo);
        }
    }

    function deleteComment(id) {
        let commentFound = false;
        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.filter(commentDetails => {
            if(commentDetails.id === id) {
                commentFound = true;
                return false;
            }
            return true;
        });

        if (commentFound) {
            setNewlyPostedCommentsByAuthUser(newNewlyPostedCommentsByAuthUser);
            return;
        }

        const newNewlyPostedRepliesByAuthUser = newlyPostedRepliesByAuthUser.filter(replyDetails => {
            if(replyDetails.id === id) {
                commentFound = true;
                return false;
            }
            return true;
        });

        if (commentFound) {
            setNewlyPostedRepliesByAuthUser(newNewlyPostedRepliesByAuthUser);
            return;
        }

        const newOrderedListOfComments = orderedListOfComments.filter(commentDetails => {
            if(commentDetails.id === id) {
                return false;
            }
            return true;
        });
        setOrderedListOfComments(newOrderedListOfComments);
    }

    function editComment(idOfCommentToEdit, newContent) {
        let commentFound = false;
        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.map(commentDetails => {
            if(commentDetails.id === idOfCommentToEdit) {
                commentFound = true;
                const newCommentDetails = {...commentDetails};
                newCommentDetails.content = newContent;
                newCommentDetails.datetime = (new Date()).toISOString();
                newCommentDetails.isEdited = true;
                return newCommentDetails;
            }
            return commentDetails;
        });

        if (commentFound) {
            setNewlyPostedCommentsByAuthUser(newNewlyPostedCommentsByAuthUser);
            return;
        }

        const newNewlyPostedRepliesByAuthUser = newlyPostedRepliesByAuthUser.map(replyDetails => {
            if(replyDetails.id === idOfCommentToEdit) {
                commentFound = true;
                const newReplyDetails = {...replyDetails};
                newReplyDetails.content = newContent;
                newReplyDetails.datetime = (new Date()).toISOString();
                newReplyDetails.isEdited = true;
                return newReplyDetails;
            }
            return replyDetails;
        });

        if (commentFound) {
            setNewlyPostedRepliesByAuthUser(newNewlyPostedRepliesByAuthUser);
            return;
        }
        
        const newOrderedListOfComments = orderedListOfComments.map(commentDetails => {
            if(commentDetails.id === idOfCommentToEdit) {
                const newCommentDetails = {...commentDetails};
                newCommentDetails.content = newContent;
                newCommentDetails.datetime = (new Date()).toISOString();
                newCommentDetails.isEdited = true;
                return newCommentDetails;  
            }
            return commentDetails;
        });
        setOrderedListOfComments(newOrderedListOfComments);
    }

    return (
        <>
            <div className="popup" style={{position: 'fixed', top: '50%', left: '50%', transform:
            'translate(-50%, -50%)',
            width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type==='Video') ||
            displaySectionsOfVidSlide) ? '90%' : '70%', height: '90%', display: 'flex',
            zIndex: zIndex}}>

                    <div ref={slideContainerRef} style={{height: '100%',
                    width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type==='Video') ||
                    displaySectionsOfVidSlide) ? '50%' : '58%',
                    position: 'relative', backgroundColor: 'black'}}>
                        {postDetails.slides[currSlideState].type === 'Image' &&
                            (
                                <>
                                    <img src={postDetails.slides[currSlideState].src}
                                    onDoubleClick={likePost}
                                    style={{position: 'absolute', objectFit: 'cover',
                                    top: '0%', left: '0%', height: '100%', width: '100%'}}/>

                                    {currSlideState > 0 &&
                                        (
                                            <img src={nextSlideArrow}
                                            onClick={() => changeSlide('decrement')}
                                            style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                                            objectFit: 'contain', position: 'absolute', left: '1%', top: '50%',
                                            transform: 'translateY(-50%) rotate(180deg)'}}/>
                                        )
                                    }

                                    {currSlideState < postDetails.slides.length-1 &&
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
                                        currSlide={currSlideState}
                                        currSlideIsImage={true}
                                    />

                                    {postDetails.slides[currSlideState].taggedAccounts.length>0 &&
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
                                            <img src={likePostAnimationHeartIcon} style={{height: '6.6em',
                                            width: '6.6em', pointerEvents: 'none', objectFit: 'contain',
                                            position: 'absolute', left: `${likePostHeartAnimationCoordinates[0]}%`,
                                            top: `${likePostHeartAnimationCoordinates[1]}%`,
                                            transform: 'translate(-50%, -50%)'}}/>
                                        )
                                    }
                                </>
                            )
                        }

                        {postDetails.slides[currSlideState].type === 'Video' &&
                            (
                                <>
                                    <video ref={videoSlideRef} controls src={postDetails.slides[currSlideState].src}
                                    onDoubleClick={likePost}
                                    style={{width: '100%', height: '100%', position: 'absolute', top: '0%', left: '0%'}}>
                                        {postDetails.slides[currSlideState].subtitles.map(subtitlesInfo =>
                                            (
                                                <track
                                                    key={subtitlesInfo.langCode}
                                                    src={subtitlesInfo.src}
                                                    kind="subtitles"
                                                    srcLang={subtitlesInfo.langCode}
                                                    label={languageCodeToLabelMappings[subtitlesInfo.langCode]}
                                                    default={'default' in subtitlesInfo && subtitlesInfo.default}
                                                />
                                            ))
                                        }
                                    </video>

                                    <video ref={hiddenVideoSlideForFrameCollectionRef}
                                    src={postDetails.slides[currSlideState].src}
                                    style={{display: 'none'}}/>
                                    
                                    <canvas ref={canvasRef} style={{ display: "none" }} />
                                    
                                    {currSlideState > 0 &&
                                        (
                                            <img src={nextSlideArrow}
                                            onClick={() => changeSlide('decrement')}
                                            style={{cursor: 'pointer', height: '2.4em', width: '2.4em',
                                            objectFit: 'contain', position: 'absolute', left: '1%', top: '50%',
                                            transform: 'translateY(-50%) rotate(180deg)'}}/>
                                        )
                                    }

                                    {currSlideState < postDetails.slides.length-1 &&
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
                                        currSlide={currSlideState}
                                        currSlideIsImage={false}
                                    />

                                    {postDetails.slides[currSlideState].taggedAccounts.length>0 &&
                                            (
                                                <img src={taggedAccountsIcon}
                                                onClick={toggleShowTaggedAccountsOfSlide}
                                                style={{height: '2.4em', width: '2.4em', objectFit: 'contain',
                                                position: 'absolute', bottom: '16%', left: '3%', cursor: 'pointer'}}/>
                                            )
                                    }

                                    {intervalIdForLikePostHeartAnimation!==null &&
                                        (
                                            <img src={likePostAnimationHeartIcon} style={{height: '6.6em',
                                            width: '6.6em', pointerEvents: 'none', objectFit: 'contain',
                                            position: 'absolute', left: `${likePostHeartAnimationCoordinates[0]}%`,
                                            top: `${likePostHeartAnimationCoordinates[1]}%`,
                                            transform: 'translate(-50%, -50%)'}}/>
                                        )
                                    }
                                </>
                            )
                        }
                    </div>

                    {(displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type==='Video') &&
                        (
                            <div style={{height: '100%', width: '27%', borderStyle: 'solid', borderColor: 'lightgray',
                            borderBottom: 'none', borderLeft: 'none', borderTop: 'none', overflowY: 'scroll',
                            paddingLeft: '1em', paddingRight: '1em'}}>
                                <h2 style={{maxWidth: '65%', marginLeft: '20%'}}>
                                    Tagged Accounts of this Video-Slide
                                </h2>
                                <hr style={{width: '100%', color: 'lightgray'}}/>
                                {
                                    postDetails.slides[currSlideState].taggedAccounts.map(taggedAccountInfo=>
                                        (
                                            <FollowUser
                                                key={taggedAccountInfo[0]}
                                                username={taggedAccountInfo[0]}
                                                authUser={authUser}
                                                fullName={
                                                (taggedAccountInfo[0] in usersAndTheirRelevantInfo &&
                                                    'fullName' in
                                                    usersAndTheirRelevantInfo[taggedAccountInfo[0]]) ?
                                                    usersAndTheirRelevantInfo[taggedAccountInfo[0]].
                                                    fullName : '?'
                                                }
                                                profilePhoto={
                                                    (taggedAccountInfo[0] in usersAndTheirRelevantInfo &&
                                                    'profilePhoto' in
                                                    usersAndTheirRelevantInfo[taggedAccountInfo[0]]) ?
                                                    usersAndTheirRelevantInfo[taggedAccountInfo[0]].
                                                    profilePhoto :
                                                    defaultPfp
                                                }
                                                isVerified={
                                                    (taggedAccountInfo[0] in usersAndTheirRelevantInfo &&
                                                    'isVerified' in
                                                    usersAndTheirRelevantInfo[taggedAccountInfo[0]]) ?
                                                    usersAndTheirRelevantInfo[taggedAccountInfo[0]].
                                                    isVerified : false
                                                }
                                                followStatus={taggedAccountInfo[1]}
                                                notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                                            />
                                        )
                                    )
                                }
                            </div>
                        )
                    }

                    {displaySectionsOfVidSlide &&
                            (
                                <div style={{height: '100%', width: '27%', borderStyle: 'solid',
                                borderColor: 'lightgray', borderBottom: 'none', borderLeft: 'none', borderTop: 'none',
                                overflowY: 'scroll'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 
                                    'center', padding: '0.4em 1.5em', borderStyle: 'solid', borderColor: 'lightgray',
                                    borderWidth: '0.08em', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>
                                        <h4>Sections of this Video-Slide</h4>
                                        <img src={thinGrayXIcon} onClick={toggleShowSectionsOfVidSlide}
                                        style={{cursor: 'pointer', height: '1.6em',
                                        width: '1.6em', objectFit: 'contain'}}/>
                                    </div>

                                    <br/>
                                    
                                    {postDetails.slides[currSlideState].sections.map(sectionInfo =>
                                        (
                                            <div key={sectionInfo[0]} className="videoSlideSection"
                                            onClick={() =>takeUserToSectionInVideo(sectionInfo[0])}
                                            style={{display: 'flex', width: '100%', alignItems: 'center',
                                            cursor: 'pointer', padding: '0.4em 1.5em', gap: '1.5em'}}>
                                                <img src={
                                                    (currSlideState in slideToVidTimeToFrameMappings &&
                                                    sectionInfo[0] in slideToVidTimeToFrameMappings[currSlideState]
                                                    ) ?
                                                    slideToVidTimeToFrameMappings[currSlideState][sectionInfo[0]] :
                                                    getVideoFrameAtSpecifiedSlideAndTime(currSlideState, sectionInfo[0])
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

                    <div style={{height: '100%',
                    width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type==='Video') ||
                    displaySectionsOfVidSlide) ? '23%' : '42%', overflowX: 'scroll', overflowY: 'scroll'}}>
                        <div style={{width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.5em 1em'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1em'}}>
                                <UserIcon
                                    username={mainPostAuthor}
                                    authUser={authUser}
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
                                    <p style={{marginBottom: '0em', maxWidth: '12em', textAlign: 'start',
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
                                            style={{fontSize: 'small', marginBottom: '-1em', maxWidth: '12em', textAlign: 'start',
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
                                                
                                                <p style={{maxWidth: '12em', textAlign: 'start', overflowWrap: 'break-word'}}>
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

                        {(!displaySectionsOfVidSlide && postDetails.slides[currSlideState].type==='Video' &&
                        postDetails.slides[currSlideState].sections.length>0) &&
                            (
                                <p onClick={toggleShowSectionsOfVidSlide}
                                style={{boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                padding: '0.5em 1em', cursor: 'pointer', borderRadius: '2em', width: '15em',
                                marginLeft: '1em'}}>
                                    <small style={{fontWeight: 'bold'}}>
                                        Show Sections of this Video-Slide
                                    </small>
                                </p>
                            )
                        }
    
                        {postDetails.adInfo!==null &&
                            (
                                <a href={postDetails.adInfo.link}
                                style={{fontWeight: 'bold', fontSize: '1.1em', width: '92%'}}>
                                    <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: '1em',
                                    justifyContent: 'start', borderStyle: 'solid', borderBottom: 'none', borderColor: 'lightgray',
                                    borderWidth: '0.065em', padding: '1em 1em', borderLeft: 'none', borderRight: 'none'}}>
                                        <img src={megaphone} style={{height: '1.8em', width: '1.8em', objectFit: 'contain',
                                        pointerEvents: 'none'}}/>

                                        <p style={{maxWidth: '77%', overflowWrap: 'break-word', textAlign: 'start'}}>
                                            {'Click this to ' + postDetails.adInfo.callToAction}
                                        </p>
                                    </div>
                                </a>
                            )
                        }

                        <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '61%',
                        overflowX: 'scroll', overflowY: 'scroll', borderStyle: 'solid',
                        borderLeft: 'none', borderRight: 'none', borderColor: 'lightgray', borderWidth: '0.065em',
                        padding: '1em 1em', position: 'relative', gap: '1.5em'}}>
                            <Comment
                                id={''}
                                username={mainPostAuthor}
                                profilePhoto={
                                    ('profilePhoto' in mainPostAuthorInfo) ?
                                    mainPostAuthorInfo.profilePhoto : defaultPfp
                                }
                                isVerified={
                                    ('isVerified' in mainPostAuthorInfo) ?
                                    mainPostAuthorInfo.isVerified : false
                                }
                                isEdited={postDetails.caption.isEdited}
                                datetime={postDetails.caption.datetime}
                                commentContent={postDetails.caption.content}
                                numLikes={0}
                                numReplies={0}
                                commenterStatus={'Caption'}
                                authUser={authUser}
                                isLikedByAuthUser={false}
                                isLikedByAuthor={false}
                                notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                                notifyParentToUpdateCommentDetails={updateCommentDetails}
                                notifyParentToReplyToComment={null}
                                notifyParentToShowLikersPopup={notifyParentToShowLikersPopup}
                                isPinned={false}
                                usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                notifyParentToFetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                notifyParentToDeleteComment={deleteComment}
                                notifyParentToEditComment={editComment}
                            />

                            {
                                newlyPostedCommentsByAuthUser.map(comment => 
                                    (
                                        <Comment
                                            key={comment.id}
                                            id={comment.id}
                                            username={authUser}
                                            profilePhoto={
                                                (
                                                    !(authUser in usersAndTheirRelevantInfo) ||
                                                    !('profilePhoto' in usersAndTheirRelevantInfo[authUser])
                                                ) ?
                                                    defaultPfp :
                                                    usersAndTheirRelevantInfo[authUser]
                                                    .profilePhoto
                                            }
                                            isVerified={
                                                (
                                                    !(authUser in usersAndTheirRelevantInfo) ||
                                                    !('isVerified' in usersAndTheirRelevantInfo[authUser])
                                                ) ?
                                                    false :
                                                    usersAndTheirRelevantInfo[authUser]
                                                    .isVerified
                                            }
                                            isEdited={comment.isEdited}
                                            datetime={comment.datetime}
                                            commentContent={comment.content}
                                            numLikes={comment.numLikes}
                                            numReplies={comment.numReplies}
                                            commenterStatus={'You'}
                                            isLikedByAuthUser={comment.isLikedByAuthUser}
                                            authUser={authUser}
                                            isLikedByAuthor={false}
                                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                                            notifyParentToUpdateCommentDetails={updateCommentDetails}
                                            notifyParentToReplyToComment={updateReplyingToCommentInfo}
                                            notifyParentToShowLikersPopup={notifyParentToShowLikersPopup}
                                            isPinned={false}
                                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                            newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                            notifyParentToFetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                            notifyParentToDeleteComment={deleteComment}
                                            notifyParentToEditComment={editComment}
                                        />
                                    )
                                )
                            }

                            {(initialCommentsFetchingIsComplete && initialCommentsFetchingErrorMessage.length==0) &&
                                (
                                    <>
                                        {
                                            orderedListOfComments.map(comment =>
                                                (
                                                    <Comment
                                                        key={comment.id}
                                                        id={comment.id}
                                                        username={comment.username}
                                                        profilePhoto={
                                                            (
                                                                !(comment.username in usersAndTheirRelevantInfo) ||
                                                                !('profilePhoto' in usersAndTheirRelevantInfo[
                                                                    comment.username
                                                                ])
                                                            ) ?
                                                                defaultPfp :
                                                                usersAndTheirRelevantInfo[comment.username]
                                                                .profilePhoto
                                                        }
                                                        isVerified={
                                                            (
                                                                !(comment.username in usersAndTheirRelevantInfo) ||
                                                                !('isVerified' in usersAndTheirRelevantInfo[
                                                                    comment.username
                                                                ])
                                                            ) ?
                                                                false :
                                                                usersAndTheirRelevantInfo[comment.username]
                                                                .isVerified
                                                        }
                                                        isEdited={comment.isEdited}
                                                        datetime={comment.datetime}
                                                        commentContent={comment.content}
                                                        numLikes={comment.numLikes}
                                                        numReplies={comment.numReplies}
                                                        commenterStatus={comment.commenterStatus}
                                                        isLikedByAuthUser={comment.isLikedByAuthUser}
                                                        authUser={authUser}
                                                        isLikedByAuthor={comment.isLikedByAuthor}
                                                        notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                                                        notifyParentToUpdateCommentDetails={updateCommentDetails}
                                                        notifyParentToReplyToComment={updateReplyingToCommentInfo}
                                                        notifyParentToShowLikersPopup={notifyParentToShowLikersPopup}
                                                        isPinned={'isPinned' in comment}
                                                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                                        newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                                        notifyParentToFetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                                        notifyParentToDeleteComment={deleteComment}
                                                        notifyParentToEditComment={editComment}
                                                    />
                                                )
                                            )
                                        }

                                        {(!isCurrentlyFetchingAdditionalComments &&
                                        additionalCommentsFetchingErrorMessage.length==0) &&
                                            (
                                                <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                                alignItems: 'center', marginTop: '2.5em'}}>
                                                    <img onClick={() => fetchComments('additional')}
                                                    className='iconToBeAdjustedForDarkMode' src={plusIconInCircle}
                                                    style={{cursor: 'pointer', height: '2em',
                                                    width: '2em', objectFit: 'contain'}}/>
                                                </div>
                                            )
                                        }

                                        {(!isCurrentlyFetchingAdditionalComments &&
                                        additionalCommentsFetchingErrorMessage.length>0) &&
                                            (
                                                <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                                marginTop: '2.5em'}}>
                                                    <p style={{fontSize: '0.88em', width: '85%', color: 'gray'}}>
                                                        {additionalCommentsFetchingErrorMessage}
                                                    </p>
                                                </div>
                                            )
                                        }

                                        {isCurrentlyFetchingAdditionalComments &&
                                            (
                                                <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                                marginTop: '2.5em'}}>
                                                    <img src={loadingAnimation} style={{height: '2em', width: '2em',
                                                    objectFit: 'contain', pointerEvents: 'none'}}/>
                                                </div>
                                            )
                                        }
                                    </>
                                )
                            }

                            {(initialCommentsFetchingIsComplete && initialCommentsFetchingErrorMessage.length>0) &&
                                (
                                    <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                    marginTop: '2.5em'}}>
                                        <p style={{fontSize: '0.88em', width: '65%', color: 'gray'}}>
                                            {initialCommentsFetchingErrorMessage}
                                        </p>
                                    </div>
                                )
                            }

                            {!initialCommentsFetchingIsComplete &&
                                (
                                    <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                    marginTop: '2.5em'}}>
                                        <img src={loadingAnimation} style={{height: '2em', width: '2em',
                                        objectFit: 'contain', pointerEvents: 'none'}}/>
                                    </div>
                                )
                            }
                        </div>

                        <div style={{width: '95%', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', paddingLeft: '0.5em', marginTop: '1em'}}>
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
                                style={{marginBottom: '0em', maxWidth: '60%', marginLeft: '0.5em', marginTop: '0.5em',
                                overflowWrap: 'break-word', textAlign: 'start', cursor: 'pointer'}}>
                                    {postDetails.numLikes.toLocaleString() + (postDetails.numLikes==1 ? ' like' : ' likes')}
                                </b>
                            )
                        }

                        {postDetails.likersFollowedByAuthUser.length>0 &&
                            (
                                <p style={{marginBottom: '0em', maxWidth: '75%', overflowWrap: 'break-word',
                                textAlign: 'start', marginLeft: '1em', marginTop: '0.5em'}}>
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

                        <div style={{width: '100%', height: '3em', position: 'relative', marginTop: '2em',
                        padding: '1em 1em', borderStyle: 'solid', borderColor: 'lightgray', borderLeft: 'none',
                        borderRight: 'none', borderBottom: 'none'}}>
                            <input value={commentInput} onChange={updateCommentInput}
                            placeholder={replyingToCommentInfo !== null ? 
                            `Replying to @${replyingToCommentInfo.username}: ${replyingToCommentInfo.content}` : 
                            "Add a comment..."}
                            style={{fontFamily: 'Arial', width: '85%', outline: 'none', border: 'none',
                            fontSize: '1em', paddingLeft: '1em', marginLeft: '-5em'}}/>

                            {commentInput.length>0 &&
                                (
                                    <b onClick={postComment} style={{cursor: 'pointer', color: '#28a2fa',
                                    position: 'absolute', right: '10%', top: '30%', backgroundColor: 'white',
                                    padding: '0.3em 0.3em'}}>
                                        Post
                                    </b>
                                )
                            }
                        </div>
                    </div>
            </div>

            <img src={thinWhiteXIcon} onClick={notifyParentToClosePopup}
            style={{height: '3em', width: '3em', objectFit: 'contain', cursor: 'pointer', position: 'fixed',
            top: '1.5%', right: '1.5%', zIndex: zIndex}}/>
        </>
    )
}

export default CommentsPopup;