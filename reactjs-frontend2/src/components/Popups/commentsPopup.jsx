import Comment from '../../Comment';
import FollowUser from '../../FollowUser';
import PostDots from '../../PostDots';
import UserIcon from '../../UserIcon';

import blackSavedIcon from '../../assets/images/blackSavedIcon.png';
import blankHeartIcon from '../../assets/images/blankHeartIcon.png';
import blankSavedIcon from '../../assets/images/blankSavedIcon.png';
import commentIcon from '../../assets/images/commentIcon.png';
import defaultPfp from '../../assets/images/defaultPfp.png';
import heartAnimationIcon from '../../assets/images/heartAnimationIcon.webp';
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

import { useEffect, useRef, useState } from 'react';


function CommentsPopup({authUserId, authUsername, postDetails, usersAndTheirRelevantInfo, updateUsersAndTheirRelevantInfo,
mainPostAuthorInfo, currSlide, zIndex, closePopup, showErrorPopup, showThreeDotsPopup, showSendPostPopup, showLikersPopup,
showStoryViewer, updatePostDetails}) {
    const [overallPostId, setOverallPostId] = useState('');

    const [mainPostAuthorId, setMainPostAuthorId] = useState(-1);

    const [bgMusicIsPlaying, setBgMusicIsPlaying] = useState(false);
    const [bgMusicObject, setBgMusicObject] = useState(null);

    const [currSlideState, setCurrSlideState] = useState(0);
    const [displayTaggedAccountsOfSlide, setDisplayTaggedAccountsOfSlide] = useState(false);
    const [displaySectionsOfVidSlide, setDisplaySectionsOfVidSlide] = useState(false);

    const [commentInput, setCommentInput] = useState('');
    const [commentInputTextareaIsActive, setCommentInputTextareaIsActive] = useState(false);

    const [slideToVidTimeToFrameMappings, setSlideToVidTimeToFrameMappings] = useState({});

    const [heartAnimationCoordinates, setHeartAnimationCoordinates] = useState([-1, -1]);
    const [intervalIdForHeartAnimation, setIntervalIdForHeartAnimation] = useState(null);

    const [orderedListOfComments, setOrderedListOfComments] = useState([]);
    const [commentIdsToExclude, setCommentIdsToExclude] = useState([]);

    const [newlyPostedCommentsByAuthUser, setNewlyPostedCommentsByAuthUser] = useState([]);
    const [newlyPostedRepliesByAuthUser, setNewlyPostedRepliesByAuthUser] = useState([]);

    const [initialCommentsFetchingIsComplete, setInitialCommentsFetchingIsComplete] = useState(false);
    const [isCurrentlyFetchingAdditionalComments, setIsCurrentlyFetchingAdditionalComments] = useState(false);
    const [initialCommentsFetchingErrorMessage, setInitialCommentsFetchingErrorMessage] = useState("");
    const [additionalCommentsFetchingErrorMessage, setAdditionalCommentsFetchingErrorMessage] = useState("");
    
    const [replyingToCommentInfo, setReplyingToCommentInfo] = useState(null);

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
        setCurrSlideState(currSlide);

        if(postDetails.backgroundMusic !== null) {
            setBgMusicObject(new Audio(postDetails.backgroundMusic.src));
        }

        window.addEventListener('keydown', handleKeyDownEvents);
        fetchComments('initial');

        return () => {
            window.removeEventListener('keydown', handleKeyDownEvents);
        }
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


    function handleKeyDownEvents(event) {
        const currSlideIsVid = postDetails.slides[currSlideState].type === 'video';

        switch (event.key) {
            case 'Escape':
                if (!currSlideIsVid) {
                    closePopup();
                }
                break;
            case 'Enter':
                if (commentInputTextareaIsActive && commentInput.length > 0) {
                    postComment();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                if (!commentInputTextareaIsActive && !currSlideIsVid && currSlideState > 0) {
                    changeSlide('decrement');
                }
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                if (!commentInputTextareaIsActive && !currSlideIsVid && currSlideState + 1 <
                postDetails.slides.length) {
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


    function changeSlide(incrementOrDecrementText) {
        setDisplaySectionsOfVidSlide(false);
        setDisplayTaggedAccountsOfSlide(false);

        if(incrementOrDecrementText === 'increment') {
            setCurrSlideState(currSlideState+1);
        }
        else {
            setCurrSlideState(currSlideState-1);
        }
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


    function takeUserToSectionInVideo(timeInSeconds) {
        if (vidSlideRef.current) {
            vidSlideRef.current.currentTime = timeInSeconds;
            vidSlideRef.current.play();
        }
    }


    async function toggleShowSectionsOfVidSlide() {
        if (!displaySectionsOfVidSlide && postDetails.slides[currSlideState].sections.length > 0 &&
        !(currSlideState in slideToVidTimeToFrameMappings)) {
            for(let sectionInfo of postDetails.slides[currSlideState].sections) {
                await getVideoFrameAtSpecifiedSlideAndTime(currSlideState, sectionInfo[0]);
            }
        }

        setDisplayTaggedAccountsOfSlide(false);
        setDisplaySectionsOfVidSlide(!displaySectionsOfVidSlide);
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
            video.src = postDetails.slides[slide].src;


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

                resolve(imageDataURL);
            });


            video.onerror = (e) => {
                e;
                reject(new Error('Error loading video'));
            };
        });
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


    function updateCommentInput(event) {
        setCommentInput(event.target.value);
    }


    function updateCommentDetails(id, updatedDetails) {
        let commentFound = false;

        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.filter(commentDetails => {
            if(commentDetails.id == id) {
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
            if(replyDetails.id == id) {
                commentFound = true;

                const newCommentDetails = {...replyDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newCommentDetails[key] = updatedDetails[key];
                }
                
                return newCommentDetails;
            }
        });
        if (commentFound) {
            setNewlyPostedRepliesByAuthUser(newNewlyPostedRepliesByAuthUser);
            return;
        }


        const newOrderedListOfComments = orderedListOfComments.map(commentDetails => {
            if(commentDetails.id == id) {
                commentFound = true;

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
        if(replyingToCommentInfo !== null && replyingToCommentInfo.id == newReplyingToCommentInfo.id) {
            setReplyingToCommentInfo(null);
        }
        else {
            setReplyingToCommentInfo(newReplyingToCommentInfo);
        }
    }


    function editComment(id, newContent) {
        let commentFound = false;

        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.map(commentDetails => {
            if(commentDetails.id == id) {
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
            if(replyDetails.id == id) {
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
            if(commentDetails.id == id) {
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


    function deleteComment(id) {
        let commentFound = false;

        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.filter(commentDetails => {
            if(commentDetails.id == id) {
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
            if(replyDetails.id == id) {
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
            if(commentDetails.id == id) {
                return false;
            }
            return true;
        });

        setOrderedListOfComments(newOrderedListOfComments);
    }


    function formatDatetimeString(datetimeString) {
        const now = new Date();
        const pastDate = new Date(datetimeString);
        const diff = now - pastDate;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) {
            return `${seconds}s`;
        }
        else if (minutes < 60) {
            return `${minutes}m`;
        }
        else if (hours < 24) {
            return `${hours}h`;
        }
        else if (days < 7) {
            return `${days}d`;
        }
        else if (weeks < 4) {
            return `${weeks}w`;
        }
        else if (months < 12) {
            return `${months}mo`;
        }
        else {
            return `${years}y`;
        }
    }


    async function fetchComments(initialOrAdditionalText) {
        if(initialOrAdditionalText === 'additional') {
            setIsCurrentlyFetchingAdditionalComments(true);
        }

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getBatchOfCommentsOfPost/${authUserId}/${overallPostId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    commentIdsToExclude: commentIdsToExclude
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                if(initialOrAdditionalText === 'initial') {
                    setInitialCommentsFetchingErrorMessage(
                        'The server had trouble getting the initial batch of comments of this post'
                    );
                }
                else {
                    setAdditionalCommentsFetchingErrorMessage(
                        'The server had trouble getting the additional batch of comments of this post'
                    );
                }
            }
            else {
                let newlyFetchedOrderedComments = await response.json();
                newlyFetchedOrderedComments = newlyFetchedOrderedComments.map(comment => {
                    comment.datetime = formatDatetimeString(comment.datetime);
                    return comment;
                });

                let newOrderedListOfComments = [...orderedListOfComments, ...newlyFetchedOrderedComments];
                
                const newCommentIdsToExclude = [...commentIdsToExclude];
                for(let newlyFetchedComment of newlyFetchedOrderedComments) {
                    newCommentIdsToExclude.push(newlyFetchedComment.id);
                }

                setCommentIdsToExclude(newCommentIdsToExclude);
                setOrderedListOfComments(newOrderedListOfComments);
                fetchAllTheNecessaryInfo(newlyFetchedOrderedComments.map(comment => comment.authorId));
            }
        }
        catch (error) {
            if(initialOrAdditionalText === 'initial') {
                setInitialCommentsFetchingErrorMessage(
                    'There was trouble connecting to the server to get the initial batch of comments of this post'
                );
            }
            else {
                setAdditionalCommentsFetchingErrorMessage(
                    'There was trouble connecting to the server to get the additional batch of comments of this post'
                );
            }
        }
        finally {
            if(initialOrAdditionalText === 'initial') {
                setInitialCommentsFetchingIsComplete(true);
            }
            else {
                setIsCurrentlyFetchingAdditionalComments(false);
            }
        }
    }


    async function fetchAllTheNecessaryInfo(newCommenterIds) {
        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newCommenterIdsNeededForUsernames = newCommenterIds.filter(newCommenterId => {
            if (!(newCommenterId in usersAndTheirRelevantInfo) || !('username' in usersAndTheirRelevantInfo[newCommenterId])) {
                return true;
            }
            return false;
        });

        if (newCommenterIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newCommenterIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newCommenterIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newCommenterIdsNeededForUsernames = newCommenterIdsNeededForUsernames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newCommenterIdsNeededForVerificationStatuses = newCommenterIds.filter(newCommenterId => {
            if (!(newCommenterId in usersAndTheirRelevantInfo) || !('isVerified' in usersAndTheirRelevantInfo[newCommenterId])) {
                return true;
            }
            return false;
        });
        if (newCommenterIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newCommenterIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newCommenterIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newCommenterIdsNeededForVerificationStatuses = newCommenterIdsNeededForVerificationStatuses;
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
                    if (newCommenterIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched comment-authors'
                        );
                    }

                    if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            comment-authors`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newCommenterIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewCommenterIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newCommenterIdsNeededForUsernames.length; i++) {
                            const newCommenterId = newCommenterIdsNeededForUsernames[i];
                            const newCommenterUsername = listOfUsernamesForNewCommenterIds[i];

                            if (newCommenterUsername !== null) {
                                usersAndTheirUsernames[newCommenterId] = newCommenterUsername;
                            }
                        }
                    }

                    if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewCommenterIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newCommenterIdsNeededForVerificationStatuses.length; i++) {
                            const newCommenterId = newCommenterIdsNeededForVerificationStatuses[i];
                            const newCommenterVerificationStatus = listOfVerificationStatusesForNewCommenterIds[i];

                            if (newCommenterVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newCommenterId] = newCommenterVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newCommenterIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        comment-authors`
                    );
                }

                if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched comment-authors`
                    );
                }
            }
        }

        let usersAndTheirPfps = {};
        const newCommenterIdsNeededForPfps = newCommenterIds.filter(newCommenterId => {
            if (!(newCommenterId in usersAndTheirRelevantInfo) || !('profilePhoto' in usersAndTheirRelevantInfo[newCommenterId])) {
                return true;
            }
            return false;
        });
        if (newCommenterIdsNeededForPfps.length>0) {
            try {
                const response2 = await fetch(
                'http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        userIds: newCommenterIdsNeededForPfps
                    })
                });

                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched comment-authors'
                    );
                }
                else {
                    usersAndTheirPfps = await response2.json();
                }
            }
            catch {
                console.error(
                    `There was trouble connecting to the server to fetch the profile-photos of all the newly fetched
                    comment-authors`
                );
            }
        }

        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        for(let newCommenterId of newCommenterIds) {
            if (!(newCommenterId in usersAndTheirUsernames) && !(newCommenterId in usersAndTheirVerificationStatuses) &&
            !(newCommenterId in usersAndTheirPfps)) {
                continue;
            }

            if(!(newCommenterId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[newCommenterId] = {};
            }
            
            if (newCommenterId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[newCommenterId].username = usersAndTheirUsernames[newCommenterId];
            }
            if (newCommenterId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[newCommenterId].isVerified = usersAndTheirVerificationStatuses[newCommenterId];
            }
            if (newCommenterId in usersAndTheirPfps) {
                newUsersAndTheirRelevantInfo[newCommenterId].profilePhoto = usersAndTheirPfps[newCommenterId];
            }
        }

        updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);

        return newUsersAndTheirRelevantInfo;
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
            showErrorPopup('You cannot post comments/replies without logging into an account');
            return;
        }

        let commentOrReplyText = '';

        try {
            let response;

            if(replyingToCommentInfo == null) {
                commentOrReplyText = 'comment';

                response = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `mutation ($authUserId: Int!, $overallPostId: String!, $commentContent: String!) {
                            addCommentToPost(authUserId: $authUserId, overallPostId: $overallPostId, commentContent: $commentContent)
                        }`,
                        variables: {
                            authUserId: authUserId,
                            overallPostId: overallPostId,
                            commentContent: commentInput
                        }
                    }),
                    credentials: 'include'
                });
            }
            else {
                commentOrReplyText = 'reply';

                response = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `mutation ($authUserId: Int!, $commentId: Int!, $commentContent: String!) {
                            addReplyToComment(authUserId: $authUserId, commentId: $commentId, commentContent: $commentContent)
                        }`,
                        variables: {
                            authUserId: authUserId,
                            commentId: replyingToCommentInfo.id,
                            commentContent: commentInput
                        }
                    }),
                    credentials: 'include'
                });
            }

            if(!response.ok) {
                showErrorPopup(`The server had trouble adding your ${commentOrReplyText}.`);
            }
            else {
                let newCommentOrReplyId = await response.json();

                if (commentOrReplyText === 'comment') {
                    newCommentOrReplyId = newCommentOrReplyId.data.addCommentToPost;

                    updatePostDetails(
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
                    setCommentIdsToExclude([
                        ...commentIdsToExclude, newCommentOrReplyId
                    ])
                }
                else {
                    newCommentOrReplyId = newCommentOrReplyId.data.addReplyToComment;

                    updateCommentDetails(
                        replyingToCommentInfo.id,
                        { numReplies: replyingToCommentInfo.numReplies + 1 }
                    );
                    setNewlyPostedRepliesByAuthUser([
                        {
                            id: newCommentOrReplyId,
                            content: commentInput,
                            datetime: (new Date()).toISOString(),
                            isEdited: false,
                            numLikes: 0,
                            numReplies: 0,
                            isLikedByAuthUser: false,
                            parentCommentId: replyingToCommentInfo.id
                        },
                        ...newlyPostedRepliesByAuthUser
                    ]);
                    setReplyingToCommentInfo(null);
                }

                setCommentInput('');
            }
        }
        catch (error) {
            showErrorPopup(
                `There was trouble connecting to the server to add your ${commentOrReplyText}.`
            );
        }
    }


    return (
        <>
            <div className="popup" style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type === 'video') ||
            displaySectionsOfVidSlide) ? '90%' : '70%', height: '90%', display: 'flex', zIndex: zIndex}}>
                <div ref={currSlideRef} style={{height: '100%', width: ((displayTaggedAccountsOfSlide &&
                postDetails.slides[currSlideState].type === 'video') || displaySectionsOfVidSlide) ? '50%' : '58%',
                position: 'relative', backgroundColor: 'black'}}>
                    {postDetails.slides[currSlideState].type === 'image' &&
                        (
                            <>
                                <img src={postDetails.slides[currSlideState].src} onDoubleClick={likePost}
                                style={{position: 'absolute', objectFit: 'cover', top: '0%', left: '0%', height: '100%', width:
                                '100%'}}/>

                                {currSlideState > 0 &&
                                    (
                                        <img src={nextSlideArrow} onClick={() => changeSlide('decrement')} style={{cursor:
                                        'pointer', height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute',
                                        left: '1%', top: '50%', transform: 'translateY(-50%) rotate(180deg)'}}/>
                                    )
                                }

                                {currSlideState < postDetails.slides.length-1 &&
                                    (
                                        <img src={nextSlideArrow} onClick={() => changeSlide('increment')} style={{cursor:
                                        'pointer', height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute',
                                        right: '1%', top: '50%', transform: 'translateY(-50%)'}}/>
                                    )
                                }

                                <PostDots
                                    numSlides={postDetails.slides.length}
                                    currSlide={currSlideState}
                                    currSlideIsImage={true}
                                />

                                {postDetails.slides[currSlideState].taggedAccounts.length > 0 &&
                                    (
                                        <img src={taggedAccountsIcon} onClick={toggleShowTaggedAccountsOfSlide}
                                        style={{height: '2.4em', width: '2.4em', objectFit: 'contain',
                                        position: 'absolute', bottom: '2%', left: '3%', cursor: 'pointer'}}/>
                                    )
                                }

                                {displayTaggedAccountsOfSlide &&
                                    (
                                        postDetails.slides[currSlideState].taggedAccounts.map(taggedAccountInfo => {
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
                                        pointerEvents: 'none', objectFit: 'contain', position: 'absolute', left:
                                        `${heartAnimationCoordinates[0]}%`, top: `${heartAnimationCoordinates[1]}%`,
                                        transform: 'translate(-50%, -50%)'}}/>
                                    )
                                }
                            </>
                        )
                    }

                    {postDetails.slides[currSlideState].type === 'Video' &&
                        (
                            <>
                                <video ref={vidSlideRef} controls src={postDetails.slides[currSlideState].src}
                                onDoubleClick={likePost} style={{width: '100%', height: '100%', position: 'absolute', top: '0%',
                                left: '0%'}}>
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
                                
                                {currSlideState > 0 &&
                                    (
                                        <img src={nextSlideArrow} onClick={() => changeSlide('decrement')} style={{cursor:
                                        'pointer', height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute',
                                        left: '1%', top: '50%', transform: 'translateY(-50%) rotate(180deg)'}}/>
                                    )
                                }

                                {currSlideState < postDetails.slides.length-1 &&
                                    (
                                        <img src={nextSlideArrow} onClick={() => changeSlide('increment')} style={{cursor:
                                        'pointer', height: '2.4em', width: '2.4em', objectFit: 'contain', position: 'absolute',
                                        right: '1%', top: '50%', transform: 'translateY(-50%)'}}/>
                                    )
                                }
                                
                                <PostDots
                                    numSlides={postDetails.slides.length}
                                    currSlide={currSlideState}
                                    currSlideIsImage={false}
                                />

                                {postDetails.slides[currSlideState].taggedAccounts.length>0 &&
                                    (
                                        <img src={taggedAccountsIcon} onClick={toggleShowTaggedAccountsOfSlide}
                                        style={{height: '2.4em', width: '2.4em', objectFit: 'contain',
                                        position: 'absolute', bottom: '16%', left: '3%', cursor: 'pointer'}}/>
                                    )
                                }

                                {intervalIdForHeartAnimation!==null &&
                                    (
                                        <img src={heartAnimationIcon} style={{height: '6.6em',
                                        width: '6.6em', pointerEvents: 'none', objectFit: 'contain',
                                        position: 'absolute', left: `${heartAnimationCoordinates[0]}%`,
                                        top: `${heartAnimationCoordinates[1]}%`,
                                        transform: 'translate(-50%, -50%)'}}/>
                                    )
                                }
                            </>
                        )
                    }
                </div>

                {(displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type === 'video') &&
                    (
                        <div style={{height: '100%', width: '27%', borderStyle: 'solid', borderColor: 'lightgray',
                        borderBottom: 'none', borderLeft: 'none', borderTop: 'none', borderWidth: '0.06em', overflowY:
                        'scroll'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 
                            'center', padding: '0.4em 1.5em', borderStyle: 'solid', borderColor: 'lightgray',
                            borderWidth: '0.08em', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>
                                <h4>Tagged Accounts of this Video-Slide</h4>
                                
                                <img src={thinGrayXIcon} onClick={toggleShowTaggedAccountsOfSlide} style={{cursor:
                                'pointer', height: '1.6em', width: '1.6em', objectFit: 'contain'}}/>
                            </div>

                            <br/>

                            {
                                postDetails.slides[currSlideState].taggedAccounts.map(taggedAccountInfo=>
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

                {displaySectionsOfVidSlide &&
                    (
                        <div style={{height: '100%', width: '27%', borderStyle: 'solid', borderColor: 'lightgray',
                        borderBottom: 'none', borderLeft: 'none', borderTop: 'none', borderWidth: '0.06em', overflowY:
                        'scroll'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 
                            'center', padding: '0.4em 1.5em', borderStyle: 'solid', borderColor: 'lightgray',
                            borderWidth: '0.08em', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>
                                <h4>Sections of this Video-Slide</h4>
                                
                                <img src={thinGrayXIcon} onClick={toggleShowSectionsOfVidSlide} style={{cursor:
                                'pointer', height: '1.6em', width: '1.6em', objectFit: 'contain'}}/>
                            </div>

                            <br/>
                            
                            {postDetails.slides[currSlideState].sections.map(sectionInfo =>
                                (
                                    <div key={sectionInfo[0]} onClick={() => takeUserToSectionInVideo(sectionInfo[0])}
                                    className="videoSlideSection" style={{display: 'flex', width: '100%', alignItems:
                                    'center', cursor: 'pointer', padding: '0.4em 1.5em', gap: '1.5em'}}>
                                        <img src={
                                            slideToVidTimeToFrameMappings[currSlideState]?.[sectionInfo[0]] ??
                                            defaultVideoFrame
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

                <div style={{height: '100%', width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type ===
                'video') || displaySectionsOfVidSlide) ? '23%' : '42%', overflowX: 'scroll', overflowY: 'scroll'}}>
                    <div style={{width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding:
                    '0.5em 1em'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1em'}}>
                            <UserIcon
                                authUserId={authUserId}
                                userId={mainPostAuthorId}
                                username={postDetails.authorUsernames[0]}
                                userPfp={mainPostAuthorInfo.profilePhoto ?? defaultPfp}
                                inStoriesSection={false}
                                userHasStories={mainPostAuthorInfo.hasStories ?? false}
                                userHasUnseenStory={mainPostAuthorInfo.hasUnseenStory ?? false}
                                userIsVerified={mainPostAuthorInfo.isVerified ?? false}
                                showStoryViewer={showStoryViewer}
                            />

                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '0.5em'}}>
                                <p style={{marginBottom: '0em', maxWidth: '80%', textAlign: 'start', overflowWrap:
                                'break-word'}}>
                                    {postDetails.authorUsernames.map((authorUsername, index) => 
                                        (
                                            <>
                                                <a
                                                    href={`http://34.111.89.101/profile/${authorUsername}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center',
                                                    wordBreak: 'break-word', marginRight: '0.2em'}}
                                                >
                                                    { authorUsername }

                                                    {(usersAndTheirRelevantInfo[postDetails.authorIds[index]]?.isVerified ??
                                                    false) &&
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
                                </p>

                                {postDetails.locationOfPost!==null &&
                                    (
                                        <a href={`http://34.111.89.101/search/locations/${postDetails.locationOfPost}`}
                                        target="_blank" rel="noopener noreferrer" style={{fontSize: '0.9em', marginBottom: '0',
                                        maxWidth: '80%', textAlign: 'start', overflowWrap: 'break-word'}}>
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
                                            
                                            <p style={{maxWidth: '14em', textAlign: 'start', overflowWrap: 'break-word'}}>
                                                <b>{ postDetails.bgMusic.title }</b> • <b>{ postDetails.bgMusic.artist }</b>
                                            </p>

                                            {!bgMusicIsPlaying &&
                                                (
                                                    <img src={playIcon} className="iconToBeAdjustedForDarkMode"
                                                    onClick={togglePauseBackgroundMusic} style={{cursor: 'pointer', height:
                                                    '1.3em', width: '1.3em', objectFit: 'contain'}}/>
                                                )
                                            }

                                            {bgMusicIsPlaying &&
                                                (
                                                    <img src={pauseIcon} className="iconToBeAdjustedForDarkMode"
                                                    onClick={togglePauseBackgroundMusic} style={{cursor: 'pointer', height:
                                                    '1.5em', width: '1.5em', objectFit: 'contain'}}/>
                                                )
                                            }
                                        </div>
                                    )
                                }

                                {postDetails.adInfo !== null &&
                                    (
                                        <a href={postDetails.adInfo.link}
                                        style={{fontSize: 'small', marginTop: '0.5em'}}>
                                            Sponsored
                                        </a>
                                    )
                                }
                            </div>
                        </div>

                        <img src={threeHorizontalDots} className="iconToBeAdjustedForDarkMode"
                        onClick={() => {
                            showThreeDotsPopup(postDetails);
                        }} style={{cursor: 'pointer', height: '2em', width: '2em', objectFit: 'contain'}}
                        />
                    </div>

                    <br/>

                    {(!displaySectionsOfVidSlide && postDetails.slides[currSlideState].type === 'video' &&
                    postDetails.slides[currSlideState].sections.length > 0) &&
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

                    {postDetails.adInfo !== null &&
                        (
                            <a href={postDetails.adInfo.link}
                            style={{fontWeight: 'bold', fontSize: '1.1em', width: '100%'}}>
                                <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: '1em',
                                justifyContent: 'start', borderStyle: 'solid', borderBottom: 'none', borderColor: 'lightgray',
                                borderWidth: '0.065em', padding: '1em 1em', borderLeft: 'none', borderRight: 'none'}}>
                                    <img src={megaphone} style={{height: '1.8em', width: '1.8em', objectFit: 'contain',
                                    pointerEvents: 'none'}}/>

                                    <p style={{maxWidth: '77%', overflowWrap: 'break-word', textAlign: 'start'}}>
                                        postDetails.adInfo.callToAction
                                    </p>
                                </div>
                            </a>
                        )
                    }

                    <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '61%', overflowX: 'scroll',
                    overflowY: 'scroll', borderStyle: 'solid', borderLeft: 'none', borderRight: 'none', borderColor:
                    'lightgray', borderWidth: '0.065em', padding: '2em 1em', position: 'relative', gap: '1.5em'}}>
                        <Comment
                            id={postDetails.caption.id}
                            authUserId={authUserId}
                            isLikedByAuthUser={false}
                            newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                            authorId={postDetails.caption.authorId}
                            authorUsername={postDetails.authorUsernames[postDetails.authorIds.indexOf(
                                postDetails.caption.authorId
                            )]}
                            authorIsVerified={usersAndTheirRelevantInfo[postDetails.caption.authorId]?.isVerified ?? false}
                            authorPfp={usersAndTheirRelevantInfo[postDetails.caption.authorId]?.profilePhoto ?? defaultPfp}
                            authorStatusToAuthUser={'Caption'}
                            isEdited={postDetails.caption.isEdited}
                            datetime={postDetails.caption.datetime}
                            content={postDetails.caption.content}
                            isLikedByPostAuthor={false}
                            numLikes={0}
                            numReplies={0}
                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                            showErrorPopup={showErrorPopup}
                            updateCommentDetails={updateCommentDetails}
                            replyToComment={updateReplyingToCommentInfo}
                            showLikersPopup={showLikersPopup}
                            fetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                            notifyParentToEditComment={editComment}
                            notifyParentToDeleteComment={deleteComment}
                        />

                        {newlyPostedCommentsByAuthUser.map(comment =>
                                (
                                    <Comment
                                        key={comment.id}
                                        id={comment.id}
                                        authUserId={authUserId}
                                        isLikedByAuthUser={comment.isLikedByAuthUser}
                                        newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                        authorId={authUserId}
                                        authorUsername={authUsername}
                                        authorIsVerified={usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false}
                                        authorPfp={usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp}
                                        authorStatusToAuthUser={'You'}
                                        isEdited={comment.isEdited}
                                        datetime={comment.datetime}
                                        content={comment.content}
                                        isLikedByPostAuthor={false}
                                        numLikes={comment.numLikes}
                                        numReplies={comment.numReplies}
                                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                        showErrorPopup={showErrorPopup}
                                        updateCommentDetails={updateCommentDetails}
                                        replyToComment={updateReplyingToCommentInfo}
                                        showLikersPopup={showLikersPopup}
                                        fetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                        notifyParentToEditComment={editComment}
                                        notifyParentToDeleteComment={deleteComment}
                                    />
                                )
                            )
                        }   

                        {(initialCommentsFetchingIsComplete && initialCommentsFetchingErrorMessage.length == 0) &&
                            (
                                <>
                                    {
                                        orderedListOfComments.map(comment =>
                                            (
                                                <Comment
                                                    key={comment.id}
                                                    id={comment.id}
                                                    authUserId={authUserId}
                                                    isLikedByAuthUser={comment.isLikedByAuthUser}
                                                    newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                                    authorId={comment.authorId}
                                                    authorUsername={comment.authorUsername}
                                                    authorIsVerified={usersAndTheirRelevantInfo[comment.authorId]?.isVerified ??
                                                    false}
                                                    authorPfp={usersAndTheirRelevantInfo[comment.authorId]?.profilePhoto ??
                                                    defaultPfp}
                                                    authorStatusToAuthUser={'You'}
                                                    isEdited={comment.isEdited}
                                                    datetime={comment.datetime}
                                                    content={comment.content}
                                                    isLikedByPostAuthor={comment.isLikedByPostAuthor}
                                                    numLikes={comment.numLikes}
                                                    numReplies={comment.numReplies}
                                                    usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                                    showErrorPopup={showErrorPopup}
                                                    updateCommentDetails={updateCommentDetails}
                                                    replyToComment={updateReplyingToCommentInfo}
                                                    showLikersPopup={showLikersPopup}
                                                    fetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                                    notifyParentToEditComment={editComment}
                                                    notifyParentToDeleteComment={deleteComment}
                                                />
                                            )
                                        )
                                    }

                                    {(!isCurrentlyFetchingAdditionalComments && additionalCommentsFetchingErrorMessage.length ==
                                    0) &&
                                        (
                                            <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                            alignItems: 'center', marginTop: '2.5em'}}>
                                                <img src={plusIconInCircle} onClick={() => fetchComments('additional')}
                                                className='iconToBeAdjustedForDarkMode' style={{cursor: 'pointer', height: '2em',
                                                width: '2em', objectFit: 'contain'}}/>
                                            </div>
                                        )
                                    }


                                    {(!isCurrentlyFetchingAdditionalComments &&
                                    additionalCommentsFetchingErrorMessage.length > 0) &&
                                        (
                                            <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                            marginTop: '2.5em'}}>
                                                <p style={{fontSize: '0.88em', width: '85%', color: 'gray'}}>
                                                    { additionalCommentsFetchingErrorMessage }
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

                        {(initialCommentsFetchingIsComplete && initialCommentsFetchingErrorMessage.length > 0) &&
                            (
                                <div style={{width: '100%', display: 'flex', justifyContent: 'center',
                                marginTop: '2.5em'}}>
                                    <p style={{fontSize: '0.88em', width: '65%', color: 'gray'}}>
                                        { initialCommentsFetchingErrorMessage }
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

                    <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingLeft: '0.5em', marginTop: '1em'}}>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            {!postDetails.isLiked &&
                                (
                                    <img src={blankHeartIcon} onClick={toggleLikePost}
                                    className="mediaPostButton iconToBeAdjustedForDarkMode"
                                    />
                                )
                            }

                            {postDetails.isLiked &&
                                (
                                    <img src={redHeartIcon} onClick={toggleLikePost} className="mediaPostButton"/>
                                )
                            }

                            <img src={commentIcon} className="mediaPostButton iconToBeAdjustedForDarkMode"/>
                            
                            <img src={sendPostIcon}
                                onClick={() => {
                                    showSendPostPopup(overallPostId);
                                }}
                                className="mediaPostButton iconToBeAdjustedForDarkMode"
                            />
                        </div>

                        {!postDetails.isSaved &&
                            (
                                <img src={blankSavedIcon} onClick={toggleSavePost}
                                className="mediaPostButton iconToBeAdjustedForDarkMode"/>
                            )
                        }

                        {postDetails.isSaved &&
                            (
                                <img src={blackSavedIcon} onClick={toggleSavePost}
                                className="mediaPostButton iconToBeAdjustedForDarkMode"/>
                            )
                        }
                    </div>

                    {postDetails.likersFollowedByAuthUser.length == 0 &&
                        (
                            <b onClick={() => {
                                showLikersPopup(overallPostId);
                            }}
                            style={{marginBottom: '0em', maxWidth: '74%', overflowWrap: 'break-word', textAlign: 'start',
                            marginTop: '1em', marginLeft: '1em', cursor: 'pointer'}}>
                                { postDetails.numLikes.toLocaleString() + (postDetails.numLikes == 1 ? ' like' : ' likes') }
                            </b>
                        )
                    }

                    {postDetails.likersFollowedByAuthUser.length > 0 &&
                        (
                            <p style={{marginBottom: '0em', maxWidth: '74%', marginLeft: '1em', overflowWrap: 'break-word',
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
                                                                showLikersPopup(overallPostId);
                                                            }}
                                                            style={{cursor: 'pointer'}}> other</b>
                                                        }

                                                        {postDetails.numLikes - postDetails.likersFollowedByAuthUser.length !== 1 &&
                                                            <b onClick={() => {
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

                    <div style={{width: '100%', height: '2em', position: 'relative', marginTop: '2em', padding: '1em 1em',
                    borderStyle: 'solid', borderColor: 'lightgray', borderLeft: 'none', borderRight: 'none', borderBottom:
                    'none'}}>
                        <input value={commentInput} onChange={updateCommentInput}
                        onFocus={() => setCommentInputTextareaIsActive(true)} onBlur={() => setCommentInputTextareaIsActive(
                        false)} placeholder={replyingToCommentInfo !== null ? 
                        `Replying to @${replyingToCommentInfo.authorUsername}: ${replyingToCommentInfo.content}` : 
                        "Add a comment..."} style={{fontFamily: 'Arial', width: '85%', outline: 'none', border: 'none',
                        fontSize: '1em', paddingLeft: '1em', marginLeft: '-5em'}}/>

                        {commentInput.length > 0 &&
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

            <img src={thinWhiteXIcon} onClick={closePopup} style={{height: '3em', width: '3em', objectFit: 'contain', cursor:
            'pointer', position: 'fixed', top: '1.5%', right: '1.5%', zIndex: zIndex}}/>
        </>
    )
}

export default CommentsPopup;