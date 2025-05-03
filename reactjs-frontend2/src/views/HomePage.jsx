import AboutAccountPopup from '../components/Popups/AboutAccountPopup';
import CommentsPopup from '../components/Popups/CommentsPopup';
import ErrorPopup from '../components/Popups/ErrorPopup';
import LeftSidebarPopup from '../components/Popups/LeftSidebarPopup';
import LikersPopup from '../components/Popups/LikersPopup';
import SendPostPopup from '../components/Popups/SendPostPopup';
import ThreeDotsPopup from '../components/Popups/ThreeDotsPopup';

import LeftSidebar from '../components/LeftSidebar';
import MediaPost from '../components/MediaPost';
import StoryViewer from '../components/StoryViewer';
import UserBar from '../components/UserBar';
import UserIcon from '../components/UserIcon';
import UserNotification from '../components/UserNotification';

import blackScreen from '../assets/images/blackScreen.png';
import defaultGroupChatPfp from '../assets/images/defaultGroupChatPfp.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import defaultVideoFrame from '../assets/images/defaultVideoFrame.jpg';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import nextArrow from '../assets/images/nextArrow.png';

import '../assets/styles.css';

import { useEffect, useState } from 'react';

import * as signalR from '@microsoft/signalr';
import { io } from "socket.io-client";


function HomePage({urlParams}) {
    const [authUsername, setAuthUsername] = useState('');
    const [authUserId, setAuthUserId] = useState(-1);

    const [originalURL, setOriginalURL] = useState('');

    const [displayLeftSidebarPopup, setDisplayLeftSidebarPopup] = useState(false);

    const [displayErrorPopup, setDisplayErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');

    const [displayThreeDotsPopup, setDisplayThreeDotsPopup] = useState(false);
    const [threeDotsPopupPostDetails, setThreeDotsPopupPostDetails] = useState(null);

    const [displayAboutAccountPopup, setDisplayAboutAccountPopup] = useState(false);
    const [aboutAccountUsername, setAboutAccountUsername] = useState('');
    const [aboutAccountUserId, setAboutAccountUserId] = useState(-1);
    const [aboutAccountUserIsVerified, setAboutAccountUserIsVerified] = useState(false);
    const [aboutAccountUserHasStories, setAboutAccountUserHasStories] = useState(false);
    const [aboutAccountUserHasUnseenStory, setAboutAccountUserHasUnseenStory] = useState(false);
    const [aboutAccountUserProfilePhoto, setAboutAccountUserProfilePhoto] = useState(null);

    const [displayStoryViewer, setDisplayStoryViewer] = useState(false);
    const [currStoryLevel, setCurrStoryLevel] = useState(0);
    const [storyViewerIsFromStoriesSection, setStoryViewerIsFromStoriesSection] = useState(false);
    const [storyViewerMainUserId, setStoryViewerMainUserId] = useState(-1);
    const [storyViewerMainUsername, setStoryViewerMainUsername] = useState('');
    const [orderedListOfUserIdsInStoriesSection, setOrderedListOfUserIdsInStoriesSection] = useState([]);
    const [orderedListOfUsernamesInStoriesSection, setOrderedListOfUsernamesInStoriesSection] = useState([]);
    const [orderedListOfSponsorshipStatusesInStoriesSection, setOrderedListOfSponsorshipStatusesInStoriesSection] = useState([]);
    const [fetchingStoriesIsComplete, setFetchingStoriesIsComplete] = useState(false);
    const [storiesSectionErrorMessage, setStoriesSectionErrorMessage] = useState('');
    const [userIdsWhoseStoriesYouHaveFinished, setUserIdsWhoseStoriesYouHaveFinished] = useState(new Set());
    const [usersAndTheirStories, setUsersAndTheirStories] = useState({});
    const [usersAndTheirStoryPreviews, setUsersAndTheirStoryPreviews] = useState({});
    const [usersAndYourCurrSlideInTheirStories, setUsersAndYourCurrSlideInTheirStories] = useState({});
    const [vidStoriesAndTheirPreviewImages, setVidStoriesAndTheirPreviewImages] = useState({});

    const [displayCommentsPopup, setDisplayCommentsPopup] = useState(false);
    const [commentsPopupPostDetails, setCommentsPopupPostDetails] = useState({});
    const [commentsPopupCurrSlide, setCommentsPopupCurrSlide] = useState(0);

    const [orderedListOfPosts, setOrderedListOfPosts] = useState([]);
    const [focusedMediaPostId, setFocusedMediaPostId] = useState('');
    const [initialPostsFetchingIsComplete, setInitialPostsFetchingIsComplete] = useState(false);
    const [isCurrentlyFetchingAdditionalPosts, setIsCurrentlyFetchingAdditionalPosts] = useState(false);
    const [initialPostsFetchingErrorMessage, setInitialPostsFetchingErrorMessage] = useState('');
    const [additionalPostsFetchingErrorMessage, setAdditionalPostsFetchingErrorMessage] = useState('');

    const [orderedListOfSuggestedUserIds, setOrderedListOfSuggestedUserIds] = useState([]);
    const [orderedListOfSuggestedUsernames, setOrderedListOfSuggestedUsernames] = useState([]);
    const [fetchingSuggestedUsersIsComplete, setFetchingSuggestedUsersIsComplete] = useState(false);
    const [suggestedUsersSectionErrorMessage, setSuggestedUsersSectionErrorMessage] = useState('');

    const [usersAndTheirRelevantInfo, setUsersAndTheirRelevantInfo] = useState({});
    const [postsAndTheirPreviewImgs, setPostsAndTheirPreviewImgs] = useState({});

    const [cachedMessageSendingSuggestions, setCachedMessageSendingSuggestions] = useState({});

    const [displayLikersPopup, setDisplayLikersPopup] = useState(false);
    const [likersPopupIdOfPostOrComment, setLikersPopupIdOfPostOrComment] = useState('');

    const [displaySendPostPopup, setDisplaySendPostPopup] = useState(false);
    const [sendPostPopupOverallPostId, setSendPostPopupOverallPostId] = useState('');

    const [orderedListOfNotifications, setOrderedListOfNotifications] = useState([]);


    useEffect(() => {
        document.title = 'Megagram';
        setOriginalURL(window.location.href);
        
        if (urlParams) {
            authenticateUser(urlParams.username);
        }
        else if (localStorage.getItem("defaultUsername")) {
            authenticateUser(localStorage.getItem("defaultUsername"));
        }
        else {
            setAuthUsername('Anonymous Guest');
        }

        if(urlParams && localStorage.getItem('defaultUsername') !== urlParams.username) {
            authenticateUser(urlParams.username, null);
        }
        else if(localStorage.getItem('defaultUsername')) {
            if (localStorage.getItem('defaultUsername') === 'Anonymous Guest') {
                setAuthUsername('Anonymous Guest');
            }
            else {
                authenticateUser(
                    localStorage.getItem('defaultUsername'),
                    parseInt(localStorage.getItem('defaultUserId'))
                );
            }
        }
        else {
            setAuthUsername('Anonymous Guest');
        }
    }, []);


    useEffect(() => {
        localStorage.setItem('defaultUserId', authUserId.toString());

        if (authUserId !== -1) {
            establishCollaborationWithNodeJSWebSocketDotIO();
            establishCollaborationWithCSharpSignalRWebSocket();
            establishCollaborationWithPhpRatchetWebSocket();
            establishCollaborationWithPythonWebSocket();
        }
    }, [authUserId]);
    
    
    useEffect(() => {
        if (authUsername.length > 0) {
            localStorage.setItem('defaultUsername', authUsername);
            fetchStories();
            fetchSuggestedAccounts();
            fetchPosts('initial');
        }
    }, [authUsername]);


    useEffect(() => {
        if (fetchingStoriesIsComplete && fetchingSuggestedUsersIsComplete && initialPostsFetchingIsComplete) {
            fetchAllTheNecessaryUserInfo();
        }
    }, [fetchingStoriesIsComplete, fetchingSuggestedUsersIsComplete, initialPostsFetchingIsComplete]);
       

    function showThreeDotsPopup(newThreeDotsPopupPostDetails) {
        setThreeDotsPopupPostDetails(newThreeDotsPopupPostDetails);
        setDisplayThreeDotsPopup(true);
    }


    function showCommentsPopup(postDetails, currSlide) {
        setCommentsPopupPostDetails(postDetails);
        setCommentsPopupCurrSlide(currSlide);
        setDisplayCommentsPopup(true);
    }


    function closeCommentsPopup() {
        setDisplayCommentsPopup(false);
    }


    function deleteNotification(event) {
        if (event !== null) {
            event.preventDefault();
        }

        setOrderedListOfNotifications([...orderedListOfNotifications.slice(1)]);
    }


    function showSendPostPopup(newSendPostPopupOverallPostId) {
        setSendPostPopupOverallPostId(newSendPostPopupOverallPostId);
        setDisplaySendPostPopup(true);
    }


    function closeSendPostPopup() {
        setDisplaySendPostPopup(false);
    };


    function closeThreeDotsPopup() {
        setDisplayThreeDotsPopup(false);
    };


    function hidePost() {
        const newOrderedListOfPosts = orderedListOfPosts.filter(
            postDetails => (postDetails.overallPostId !== threeDotsPopupPostDetails.overallPostId)
        );
        setOrderedListOfPosts(newOrderedListOfPosts);

        setDisplayThreeDotsPopup(false);
        setDisplayCommentsPopup(false);
    }


    function fetchAdditionalPostsWhenUserScrollsToBottomOfPage() {
        if (!isCurrentlyFetchingAdditionalPosts && window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight) {
            setIsCurrentlyFetchingAdditionalPosts(true);
            fetchPosts('additional');
        }
    }


    function showLikersPopup(newLikersPopupIdOfPostOrComment) {
        setLikersPopupIdOfPostOrComment(newLikersPopupIdOfPostOrComment);
        setDisplayLikersPopup(true);
    }


    function closeLikersPopup () {
        setDisplayLikersPopup(false);
    }


    function changeStoryLevel(incrementOrDecrementText) {
        if (incrementOrDecrementText === 'increment') {
            setCurrStoryLevel(currStoryLevel+1);
        }
        else {
            setCurrStoryLevel(currStoryLevel-1);
        }
    }


    function showAboutAccountPopup(newAboutAccountUsername, newAboutAccountUserId) {
        setAboutAccountUsername(newAboutAccountUsername);
        setAboutAccountUserId(newAboutAccountUserId);

        setAboutAccountUserIsVerified(newAboutAccountUserId in usersAndTheirRelevantInfo && 'isVerified' in
        usersAndTheirRelevantInfo[newAboutAccountUserId] ? usersAndTheirRelevantInfo[newAboutAccountUserId]
        .isVerified : false);

        setAboutAccountUserHasStories(newAboutAccountUserId in usersAndTheirRelevantInfo &&
        'hasStories' in usersAndTheirRelevantInfo[newAboutAccountUserId] ? usersAndTheirRelevantInfo
        [newAboutAccountUserId].hasStories : false);

        setAboutAccountUserHasUnseenStory(newAboutAccountUserId in usersAndTheirRelevantInfo &&
        'hasUnseenStory' in usersAndTheirRelevantInfo[newAboutAccountUserId] ? usersAndTheirRelevantInfo
        [newAboutAccountUserId].hasUnseenStory : false);

        setAboutAccountUserProfilePhoto(newAboutAccountUserId in usersAndTheirRelevantInfo &&
        'profilePhoto' in usersAndTheirRelevantInfo[newAboutAccountUserId] ? usersAndTheirRelevantInfo
        [newAboutAccountUserId].profilePhoto : defaultPfp);
        

        setDisplayAboutAccountPopup(true);
    }


    function closeAboutAccountPopup() {
        setDisplayAboutAccountPopup(false);
        setDisplayThreeDotsPopup(false);
    }


    function closeAllPopups() {
        if(!(displayCommentsPopup && (displayThreeDotsPopup || displayAboutAccountPopup ||
        displayErrorPopup || displaySendPostPopup || displayLikersPopup))) {
            setDisplayCommentsPopup(false);
        }

        setDisplayThreeDotsPopup(false);
        setDisplaySendPostPopup(false);
        setDisplayLikersPopup(false);
        setDisplayAboutAccountPopup(false);
        setDisplayLeftSidebarPopup(false);
        setDisplayErrorPopup(false);
    }


    function toggleDisplayLeftSidebarPopup() {
        setDisplayLeftSidebarPopup(!displayLeftSidebarPopup);
    }


    function showErrorPopup(errorMessage) {
        setErrorPopupMessage(errorMessage);
        setDisplayErrorPopup(true);
    }


    function closeErrorPopup() {
        setDisplayErrorPopup(false);
    }

    
    function updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo) {
        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }


    function updateCachedMessageSendingSuggestions(newCachedMessageSendingSuggestions) {
        setCachedMessageSendingSuggestions(newCachedMessageSendingSuggestions);
    }


    function addRelevantInfoToUser(userId, userFieldsAndTheirValues) {
        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};

        if (!(userId in newUsersAndTheirRelevantInfo)) {
            newUsersAndTheirRelevantInfo[userId] = {};
        }

        for(let field of Object.keys(userFieldsAndTheirValues)) {
            newUsersAndTheirRelevantInfo[userId][field] = userFieldsAndTheirValues[field];
        }

        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }


    function updatePostDetails(overallPostId, updatedKeyValuePairs) {
        const newOrderedListOfPosts = [...orderedListOfPosts];
        for(let i=0; i<newOrderedListOfPosts.length; i++) {
            const postDetails = {...newOrderedListOfPosts[i]};
            if(postDetails.overallPostId === overallPostId) {
                for(let key of Object.keys(updatedKeyValuePairs)) {
                    postDetails[key] = updatedKeyValuePairs[key];
                }

                newOrderedListOfPosts[i] = postDetails
                setOrderedListOfPosts(newOrderedListOfPosts);
                return;
            }
        }
    }


    function updateFocusedMediaPost(newFocusedMediaPostId) {
        setFocusedMediaPostId(newFocusedMediaPostId);
    }


    function showStoryViewer(newStoryViewerMainUserId, newStoryViewerMainUsername, newStoryViewerIsFromStoriesSection) {
        document.title = 'Stories';

        setStoryViewerMainUserId(newStoryViewerMainUserId);
        setStoryViewerMainUsername(newStoryViewerMainUsername);
        setStoryViewerIsFromStoriesSection(newStoryViewerIsFromStoriesSection);
        setDisplayStoryViewer(true);
    }


    function closeStoryViewer() {
        document.title = 'Megagram';

        setDisplayStoryViewer(false);

        window.history.pushState(
            {
                page: 'Megagram',
            },
            'Megagram',
            originalURL
        );
    }


    function updateUsersAndTheirStories(newUsersAndTheirStories) {
        setUsersAndTheirStories(newUsersAndTheirStories);
    }


    function updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews) {
        setUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews);
    }


    function updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories) {
        setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
    }


    function updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirPreviewImages) {
        setVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirPreviewImages);
    }


    function addUserIdToSetOfUsersWhoseStoriesYouHaveFinished(newFinishedUserId) {
        setUserIdsWhoseStoriesYouHaveFinished(new Set(
            [
                ...userIdsWhoseStoriesYouHaveFinished,
                newFinishedUserId
            ]
        ));
    }


    function establishCollaborationWithNodeJSWebSocketDotIO() {
        const nodeJSWebSocketDotIO = io('http://34.111.89.101/socket/Home-Page/nodeJSWebSocketDotIO',
            {
                withCredentials: true, 
                query: {
                    userId: authUserId,
                    updatesToSubscribeTo: JSON.stringify(['post-likes', 'post-comments'])
                }
            }
        );


        nodeJSWebSocketDotIO.on('error', (_) => {
            console.error(`There was trouble with the nodeJSWebSocketDotIO connection, which is responsible
            for providing info for notifications of updates to post-likes and post-comments.`);
        });


        nodeJSWebSocketDotIO.on('PostLike', async (data) => {
            const { likeId, overallPostId, likerId, likerName } = data;

            let likerProfilePhoto = null;

            if (!(likerId in usersAndTheirRelevantInfo) || !('profilePhoto' in usersAndTheirRelevantInfo[likerId])) {
                likerProfilePhoto =  await getProfilePhotoOfUser(likerId);
            }

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
                    postLikeId: likeId,
                    leftImage: likerProfilePhoto !== null ? likerProfilePhoto :
                    usersAndTheirRelevantInfo[likerId]?.profilePhoto ?? defaultPfp,
                    rightImage: postPreviewImage !== null ? postPreviewImage :
                    postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                    description: `@${likerName} liked your post`,
                    leftImageLink: `http://34.111.89.101/profile/${likerName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}`
                }
            ]);
        });


        nodeJSWebSocketDotIO.on('PostUnlike', (data) => {
            const { likeId } = data;

            setOrderedListOfNotifications([
                ...orderedListOfNotifications.filter(notification => {
                    if ('postLikeId' in notification && notification.postLikeId == likeId) {
                        return false;
                    }
                    return true;
                })
            ]);
        });


        nodeJSWebSocketDotIO.on('PostComment', async (data) => {
            const { commentId, overallPostId, commenterId, commenterName, comment } = data;

            let commenterProfilePhoto = null;

            if (!(commenterId in usersAndTheirRelevantInfo) || !('profilePhoto' in usersAndTheirRelevantInfo[commenterId])) {
                commenterProfilePhoto = await getProfilePhotoOfUser(commenterId);
            }

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
                    postCommentId: commentId,
                    leftImage: commenterProfilePhoto !== null ? commenterProfilePhoto :
                    usersAndTheirRelevantInfo[commenterId]?.profilePhoto ?? defaultPfp,
                    rightImage: postPreviewImage !== null ? postPreviewImage :
                    postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                    description: `@${commenterName} commented on your post: '${comment}'`,
                    leftImageLink: `http://34.111.89.101/profile/${commenterName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
                }
            ]);
        });


        nodeJSWebSocketDotIO.on('EditedPostComment', async (data) => {
            const { commentId, commenterId, commenterName, comment } = data;

            let commentIdWasFoundInNotifications = false;

            setOrderedListOfNotifications([
                ...orderedListOfNotifications.map(notification => {
                    if ('postCommentId' in notification && notification.postCommentId == commentId) {
                        commentIdWasFoundInNotifications = true;
                        notification.description = `@${commenterName} edited their comment on your post to this: '${comment}'`;
                    }
                    return notification;
                }),
            ]);

            if (!commentIdWasFoundInNotifications) {
                let commenterProfilePhoto = null;

                if (!(commenterId in usersAndTheirRelevantInfo) ||
                !('profilePhoto' in usersAndTheirRelevantInfo[commenterId])) {
                    commenterProfilePhoto = await getProfilePhotoOfUser(commenterId);
                }

                const { overallPostId } = data;

                let postPreviewImage = null;

                if (!(overallPostId in postsAndTheirPreviewImgs)) {
                    postPreviewImage = await getPreviewImageOfPost(overallPostId);
                }

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications,
                    {
                        postCommentId: commentId,
                        leftImage: commenterProfilePhoto !== null ? commenterProfilePhoto :
                        usersAndTheirRelevantInfo[commenterId]?.profilePhoto ?? defaultPfp,
                        rightImage: postPreviewImage !== null ? postPreviewImage :
                        postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                        description: `@${commenterName} edited their comment on your post to this: '${comment}'`,
                        leftImageLink: `http://34.111.89.101/profile/${commenterName}`,
                        entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
                    }
                ]);
            }
        });


        nodeJSWebSocketDotIO.on('DeletedPostComment', (data) => {
            const { commentId } = data;

            setOrderedListOfNotifications([
                ...orderedListOfNotifications.filter(notification => {
                    if ('postCommentId' in notification && notification.postCommentId == commentId) {
                        return false;
                    }
                    return true;
                })
            ]);
        });
    }


    function establishCollaborationWithCSharpSignalRWebSocket() {
        const webSocketForCommentLikes = new signalR.HubConnectionBuilder()
        .withUrl(`http://34.111.89.101/socket/Home-Page/cSharpSignalRWebSocket/websocketForCommentLikes?userId=${authUserId}`, {
            withCredentials: true,
            accessTokenFactory: () => '',
            transport: signalR.HttpTransportType.WebSockets
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();


        webSocketForCommentLikes.onclose((_) => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentLikes connection.`);
        });


        webSocketForCommentLikes.on('CommentLike', async (data) => {
            const { likeId, overallPostId, commentId, comment, likerId, likerName } = data;

            let likerProfilePhoto = null;

            if (!(likerId in usersAndTheirRelevantInfo) ||
            !('profilePhoto' in usersAndTheirRelevantInfo[likerId])) {
                likerProfilePhoto =  await getProfilePhotoOfUser(likerId);
            }

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
                    commentLikeId: likeId,
                    leftImage: likerProfilePhoto !== null ? likerProfilePhoto :
                    usersAndTheirRelevantInfo[likerId]?.profilePhoto ?? defaultPfp,
                    rightImage: postPreviewImage !== null ? postPreviewImage :
                    postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                    description: `@${likerName} liked your comment: '${comment}'`,
                    leftImageLink: `http://34.111.89.101/profile/${likerName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
                }
            ]);
        });


        webSocketForCommentLikes.on('CommentUnlike', (data) => {
            const { likeId } = data;

            setOrderedListOfNotifications([
                ...orderedListOfNotifications.filter(notification => {
                    if ('commentLikeId' in notification && notification.commentLikeId == likeId) {
                        return false;
                    }
                    return true;
                })
            ]);
        });


        webSocketForCommentLikes.start().catch(_ => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentLikes connection.`);
        });


        const webSocketForCommentReplies = new signalR.HubConnectionBuilder()
        .withUrl(`http://34.111.89.101/socket/Home-Page/cSharpSignalRWebSocket/websocketForCommentReplies?userId=${authUserId}`, {
            withCredentials: true,
            accessTokenFactory: () => '',
            transport: signalR.HttpTransportType.WebSockets
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();


        webSocketForCommentReplies.onclose((_) => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentReplies connection.`);
        });


        webSocketForCommentReplies.on('CommentReply', async (data) => {
            const { replyId, overallPostId, replierId, replierName, reply } = data;

            let replierProfilePhoto = null;

            if (!(replierId in usersAndTheirRelevantInfo) ||
            !('profilePhoto' in usersAndTheirRelevantInfo[replierId])) {
                replierProfilePhoto = await getProfilePhotoOfUser(replierId);
            }

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
                    commentReplyId: replyId,
                    leftImage: replierProfilePhoto !== null ? replierProfilePhoto :
                    usersAndTheirRelevantInfo[replierId]?.profilePhoto ?? defaultPfp,
                    rightImage: postPreviewImage !== null ? postPreviewImage :
                    postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                    description: `@${replierName} replied to your comment with this: '${reply}'`,
                    leftImageLink: `http://34.111.89.101/profile/${replierName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${replyId}`
                }
            ]);
        });


        webSocketForCommentReplies.on('EditedCommentReply', async (data) => {
            const { replyId, replierId, replierName, reply } = data;

            let replyIdWasFoundInNotifications = false;

            setOrderedListOfNotifications([
                ...orderedListOfNotifications.map(notification => {
                    if ('commentReplyId' in notification && notification.commentReplyId == replyId) {
                        replyIdWasFoundInNotifications = true;
                        notification.description =
                        `@${replierName} edited their reply to your comment with this: '${reply}'`;
                    }
                    return notification;
                }),
            ]);

            let replierProfilePhoto = null;

            if (!replyIdWasFoundInNotifications) {
                if (!(replierId in usersAndTheirRelevantInfo) ||
                !('profilePhoto' in usersAndTheirRelevantInfo[replierId])) {
                    replierProfilePhoto = await getProfilePhotoOfUser(replierId);
                }

                const { overallPostId } = data;

                let postPreviewImage = null;

                if (!(overallPostId in postsAndTheirPreviewImgs)) {
                    postPreviewImage = await getPreviewImageOfPost(overallPostId);
                }

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications,
                    {
                        commentReplyId: replyId,
                        leftImage: replierProfilePhoto !== null ? replierProfilePhoto :
                        usersAndTheirRelevantInfo[replierId]?.profilePhoto ?? defaultPfp,
                        rightImage: postPreviewImage !== null ? postPreviewImage :
                        postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                        description: `@${replierName} edited their reply to your comment with this: '${reply}'`,
                        leftImageLink: `http://34.111.89.101/profile/${replierName}`,
                        entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${replyId}`
                    }
                ]);
            }
        });


        webSocketForCommentReplies.on('DeletedCommentReply', (data) => {
            const { replyId } = data;

            setOrderedListOfNotifications([
                ...orderedListOfNotifications.filter(notification => {
                    if ('commentReplyId' in notification && notification.commentReplyId == replyId) {
                        return false;
                    }
                    return true;
                })
            ]);
        });


        webSocketForCommentReplies.start().catch(_ => {
            console.error(`There was trouble with the C#-SignalR webSocketForCommentReplies connection.`);
        });
    }


    function establishCollaborationWithPhpRatchetWebSocket() {
        const queryParams = new URLSearchParams({
            userId: authUserId.toString()
        });


        const phpRatchetWebSocket = new WebSocket(
            `ws://34.111.89.101/socket/Home-Page/phpRatchetWebSocket?${queryParams.toString()}`
        );


        phpRatchetWebSocket.onerror = (_) => {
            console.error(`There was trouble with the phpRatchetWebSocket connection, which is responsible
            for providing info for notifications of updates to followings/follow-requests.`);
        };


        phpRatchetWebSocket.onmessage = async (messageEvent) => {
            const parsedMessageData = JSON.parse(messageEvent.data);

            if (parsedMessageData.event === 'FollowRequest') {
                const { requesterId } = parsedMessageData.data;

                let requesterProfilePhoto = null;

                if (!(requesterId in usersAndTheirRelevantInfo) ||
                !('profilePhoto' in usersAndTheirRelevantInfo[requesterId])) {
                    requesterProfilePhoto = await getProfilePhotoOfUser(requesterId);
                }

                const { requesterName } = parsedMessageData.data;

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications,
                    {
                        requesterId: requesterId,
                        leftImage: requesterProfilePhoto !== null ? requesterProfilePhoto :
                        usersAndTheirRelevantInfo[requesterId]?.profilePhoto ?? defaultPfp,
                        rightImage: null, 
                        description: `@${requesterName} requested to follow you`,
                        leftImageLink: `http://34.111.89.101/profile/${requesterName}`,
                        entireNotificationLink: `http://34.111.89.101/profile/${requesterName}`
                    }
                ]);
            }
            else if (parsedMessageData.event === 'FollowRequestCancellation') {
                const { requesterId } = parsedMessageData.data;

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications.filter(notification => {
                        if ('requesterId' in notification && notification.requesterId == requesterId) {
                            return false;
                        }
                        return true;
                    })
                ]);
            }
            else if (parsedMessageData.event === 'Following') {
                const { followerId } = parsedMessageData.data;

                let followerProfilePhoto = null;

                if (!(followerId in usersAndTheirRelevantInfo) ||
                !('profilePhoto' in usersAndTheirRelevantInfo[followerId])) {
                    followerProfilePhoto = await getProfilePhotoOfUser(followerId);
                }

                const { followerName } = parsedMessageData.data;

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications,
                    {
                        followerId: followerId,
                        leftImage: followerProfilePhoto !== null ? followerProfilePhoto :
                        usersAndTheirRelevantInfo[followerId]?.profilePhoto ?? defaultPfp,
                        rightImage: null, 
                        description: `@${followerName} is now following you`,
                        leftImageLink: `http://34.111.89.101/profile/${followerName}`,
                        entireNotificationLink: `http://34.111.89.101/profile/${followerName}`
                    }
                ]);
            }
            else if (parsedMessageData.event === 'Unfollowing') {
                const { followerId } = parsedMessageData.data;
                setOrderedListOfNotifications([
                    ...orderedListOfNotifications.filter(notification => {
                        if ('followerId' in notification && notification.requesterId == followerId) {
                            return false;
                        }
                        return true;
                    })
                ]);
            }
        }
    }


    function establishCollaborationWithPythonWebSocket() {
        const pythonWebSocket = new WebSocket(
            `ws://34.111.89.101/socket/Home-Page/pythonWebSocket?userId=${encodeURIComponent(authUserId)}&updatesToSubscribeTo=${encodeURIComponent(JSON.stringify(['new-messages']))}`
        );

        
        pythonWebSocket.onerror = (_) => {
            console.error(`There was trouble with the pythonWebSocket connection, which is responsible for providing info for
            notifications of updates to messages.`);
        };


        pythonWebSocket.onmessage = async (messageEvent) => {
            const parsedMessageData = JSON.parse(messageEvent.data);

            if (parsedMessageData.event === 'Message') {
                const { messageId, convoId, convoTitle, isGroupChat, senderId, senderName, message } = parsedMessageData.data;

                let senderProfilePhoto = null;

                if (!(senderId in usersAndTheirRelevantInfo) ||
                !('profilePhoto' in usersAndTheirRelevantInfo[senderId])) {
                    senderProfilePhoto = await getProfilePhotoOfUser(senderId);
                }

                let description = '';

                if (isGroupChat) {
                    if (convoTitle !== null) {
                        description = `@${senderName} sent a message in your group-chat named '${convoTitle}': ${message}`;
                    }
                    else {
                        description = `@${senderName} sent a message in your group-chat: ${message}`;
                    }
                }
                else {
                    if (convoTitle !== null) {
                        description = `@${senderName} sent a message to you in the convo named '${convoTitle}': ${message}`;
                    }
                    else {
                        description = `@${senderName} sent a message to you: ${message}`;
                    }
                }

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications,
                    {
                        messageId: messageId,
                        leftImage: senderProfilePhoto !== null ? senderProfilePhoto : 
                        usersAndTheirRelevantInfo[senderId]?.profilePhoto ?? defaultPfp,
                        rightImage: isGroupChat ? defaultGroupChatPfp : null, 
                        description: description,
                        leftImageLink: `http://34.111.89.101/profile/${senderId}`,
                        entireNotificationLink: `http://34.111.89.101/messages/${convoId}`
                    }
                ]);
            }
            else if (parsedMessageData.event === 'MessageDelete') {
                const { messageId } = parsedMessageData.data;

                setOrderedListOfNotifications([
                    ...orderedListOfNotifications.filter(notification => {
                        if ('messageId' in notification && notification.messageId == messageId) {
                            return false;
                        }
                        return true;
                    })
                ]);
            }
        }
    }


    async function getProfilePhotoOfUser(userId) {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotoOfUser
            /${authUserId}/${userId}`, {
                credentials: 'include'
            });

            if(response.ok) {
                const userProfilePhotoBlob = await response.blob();
                const userProfilePhotoURL = URL.createObjectURL(userProfilePhotoBlob);

                setUsersAndTheirRelevantInfo((currentUsersAndTheirRelevantInfo) => {
                    if (!(userId in currentUsersAndTheirRelevantInfo)) {
                        currentUsersAndTheirRelevantInfo[userId] = {};
                    }

                    currentUsersAndTheirRelevantInfo[userId].profilePhoto = userProfilePhotoURL;

                    return currentUsersAndTheirRelevantInfo;
                });

                return userProfilePhotoURL;
            }
        }
        catch {
            console.error(`There was trouble getting the profile-photo of user ${userId}, which is needed for at-least one
            of the notifications`);
        }

        return null;
    }


    async function getPreviewImageOfPost(overallPostId) {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/getPreviewImageOfPost
            /${authUserId}/${overallPostId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const previewImageBlob = await response.blob();
                const previewImageURL = URL.createObjectURL(previewImageBlob);

                postsAndTheirPreviewImgs[overallPostId] = previewImageURL;
                setPostsAndTheirPreviewImgs((currentPostsAndTheirPreviewImgs) => {
                    currentPostsAndTheirPreviewImgs[overallPostId] = previewImageURL;
                    return currentPostsAndTheirPreviewImgs;
                });

                return previewImageURL;
            }
        }
        catch {
            console.error(`There was trouble getting the preview-image of post ${overallPostId}, which is needed
            for at-least one of the notifications`);
        }

        return null;
    }


    async function authenticateUser(username, userId) {
        if (userId == null) {
            try {
                const response = await fetch('http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `query getUserIdOfUsername($username: String!) {
                            getUserIdOfUsername(username: $username)
                        }`,
                        variables: {
                            username: username
                        }
                    }),
                    credentials: 'include'
                });
                if (!response.ok) {
                    setAuthUsername('Anonymous Guest');

                    throw new Error(
                        `The laravelBackend1 server had trouble getting the user-id of username ${username}`
                    );
                }

                let userId = await response.json();
                userId = userId.data.getUserIdOfUsername;
                
                setAuthUserId(userId);
            }
            catch {
                setAuthUsername('Anonymous Guest');

                throw new Error(
                    `There was trouble connecting to the laravelBackend1 server to get the user-id of username
                    ${username}`
                );
            }
        }
        else {
            setAuthUserId(userId);
        }

        try {
            const response1 = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/${userId}`, {
                credentials: 'include'
            });
            if (!response1.ok) {
                setAuthUsername('Anonymous Guest');
                setAuthUserId(-1);

                throw new Error(
                    `The expressJSBackend1 server had trouble verifying you as having the proper credentials to
                    be logged in as user ${userId}`
                );
            }

            setAuthUsername(username);
        }
        catch {
            setAuthUsername('Anonymous Guest');
            setAuthUserId(-1);

            throw new Error(
                `There was trouble connecting to the expressJSBackend1 server to verify you as having the proper
                credentials to be logged in as user ${userId}`
            );
        }
    }


    async function fetchStories() {
        try {
            const response = await fetch( `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoriesOfUser
            /${authUserId}/${authUserId}/true/false`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.error('The springBootBackend2 server had trouble getting your stories, if any');
            }
            else {
                const responseData = await response.json();

                const newUsersAndYourCurrSlideInTheirStories = {};

                if (responseData.currSlide === 'finished') {
                    newUsersAndYourCurrSlideInTheirStories[authUserId] = 0;
                    setUserIdsWhoseStoriesYouHaveFinished(new Set([
                        ...userIdsWhoseStoriesYouHaveFinished,
                        authUserId
                    ]));
                }
                else if (responseData.currSlide > -1) {
                    newUsersAndYourCurrSlideInTheirStories[authUserId] = 0;
                }

                setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

                if (responseData.currSlide !== -1) {
                    const newUsersAndTheirStories = {};
                    newUsersAndTheirStories[authUserId] = responseData.stories;
                    setUsersAndTheirStories(newUsersAndTheirStories);
                }
            }
        }
        catch {
            console.error('There was trouble connecting to the springBootBackend2 server to get your stories, if any');
        }

        try {
            const response2 = await fetch(`http://34.111.89.101/api/Home-Page/springBootBackend2/
            getOrderedListOfUsersForMyStoriesSection/${authUserId}`, {
                credentials: 'include'
            });
            if (!response2.ok) {
                setStoriesSectionErrorMessage(
                    'The server had trouble getting the ordered list of users for your stories-section.'
                );
            }
            else {
                const response2Data = await response2.json();

                setOrderedListOfUserIdsInStoriesSection(response2Data.orderedListOfUserIds);

                const newOrderedListOfUsernamesInStoriesSection = [];
                for(let storyAuthorId of response2Data.orderedListOfUserIds) {
                    newOrderedListOfUsernamesInStoriesSection.push(`user ${storyAuthorId}`);
                }
                setOrderedListOfUsernamesInStoriesSection(newOrderedListOfUsernamesInStoriesSection);

                setOrderedListOfSponsorshipStatusesInStoriesSection(response2Data.orderedListOfSponsorshipStatuses);
            }
        }
        catch {
            setStoriesSectionErrorMessage(
                'There was trouble connecting to the server to get the ordered list of users for your stories-section.'
            );
        }

        setFetchingStoriesIsComplete(true);
    }


    async function fetchSuggestedAccounts() {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/djangoBackend2
            /getNumFollowersFollowingsAndPostsOfMyTop5UserSuggestions/${authUserId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                setSuggestedUsersSectionErrorMessage('The server had trouble getting your top-5 user-suggestions');
            }
            else {
                const responseData = await response.json();

                setOrderedListOfSuggestedUserIds(responseData.userIdsOfTheTop5);

                const newOrderedListOfSuggestedUsernames = [];
                for(let topSuggestedUserId of responseData.userIdsOfTheTop5) {
                    newOrderedListOfSuggestedUsernames.push(`user ${topSuggestedUserId}`);
                }
                setOrderedListOfSuggestedUsernames(newOrderedListOfSuggestedUsernames);

                const { numFollowersFollowingsAndPostsOfTheTop5 } = responseData;

                const newUsersAndTheirRelevantInfo = {};

                for(let suggestedUserId of responseData.userIdsOfTheTop5) {
                    if (!(suggestedUserId in newUsersAndTheirRelevantInfo)) {
                        newUsersAndTheirRelevantInfo[suggestedUserId] = {};
                    }

                    newUsersAndTheirRelevantInfo[suggestedUserId].numFollowers = numFollowersFollowingsAndPostsOfTheTop5[
                        suggestedUserId
                    ].numFollowers;

                    newUsersAndTheirRelevantInfo[suggestedUserId].numFollowings = numFollowersFollowingsAndPostsOfTheTop5[
                        suggestedUserId
                    ].numFollowings;

                    newUsersAndTheirRelevantInfo[suggestedUserId].numPosts = numFollowersFollowingsAndPostsOfTheTop5[
                        suggestedUserId
                    ].numPosts;
                }

                setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
            }
        }
        catch {
            setSuggestedUsersSectionErrorMessage(
                'There was trouble connecting to the server to get your top-5 user-suggestions.'
            );
        }

        setFetchingSuggestedUsersIsComplete(true);
    }

    
    async function fetchPosts(initialOrAdditionalText) {
        let isInitialFetch;

        if (initialOrAdditionalText === 'initial') {
            isInitialFetch = true;
        } 
        else {
            isInitialFetch = false;
        }

        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/getBatchOfPostsForHomePageFeed
            /${authUserId}`, {
                credentials: 'include'
            });
            if (!response.ok) { 
                if (isInitialFetch) {
                    setInitialPostsFetchingErrorMessage(
                        'The server had trouble getting the initial batch of posts for your home-page feed'
                    );
                }
                else {
                    setAdditionalPostsFetchingErrorMessage(
                        'The server had trouble getting an additional batch of posts for your home-page feed'
                    );

                    window.removeEventListener('scroll', fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
                }
            }
            else {
                const responseData = await response.json();
                const orderedBatchOfPostsForHomePageFeed = responseData.orderedBatchOfPostsForHomePageFeed;
                
                setOrderedListOfPosts([
                    ...orderedListOfPosts,
                    ...orderedBatchOfPostsForHomePageFeed.map(postDetails => postDetails.authorUsernames =
                    postDetails.authorIds.map(authorId => `user ${authorId}`))
                ]);

                if (isInitialFetch) {
                    window.addEventListener('scroll', fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
                }
                else {
                    fetchAllTheNecessaryUserInfoOfAdditionalPosts(orderedBatchOfPostsForHomePageFeed);
                }
            }
        }
        catch {
            if (isInitialFetch) {
                setInitialPostsFetchingErrorMessage(
                    'There was trouble connecting to the server to get the intial batch of posts for your home-page feed'
                );
            }
            else {
                setAdditionalPostsFetchingErrorMessage(
                    'There was trouble connecting to the server to get an additional batch of posts for your home-page feed'
                );

                window.removeEventListener('scroll', fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
            }
        }

        if (isInitialFetch) {
            setInitialPostsFetchingIsComplete(true);
        }
        else {
            setIsCurrentlyFetchingAdditionalPosts(false);
        }
    }


    async function fetchAllTheNecessaryUserInfo() {
        const setOfStoryAuthorIds = new Set(orderedListOfUserIdsInStoriesSection);

        const setOfSuggestedUserIds = new Set(orderedListOfSuggestedUserIds);

        const setOfAuthorIds = new Set();
        const setOfMainAuthorIds = new Set();
        const setOfLikerIdsFollowedByAuthUser = new Set();

        for(let postDetails of orderedListOfPosts) {
            setOfMainAuthorIds.add(postDetails.authorIds[0]);

            for(let authorId of postDetails.authorIds) {
                setOfAuthorIds.add(authorId);
            }

            for(let likerIdFollowedByAuthUser of postDetails.likersFollowedByAuthUser) {
                setOfLikerIdsFollowedByAuthUser.add(likerIdFollowedByAuthUser);
            }
        }

        const setOfAllUserIds = new Set([
            ...setOfStoryAuthorIds, ...setOfSuggestedUserIds, ...setOfAuthorIds, ...setOfMainAuthorIds,
            ...setOfLikerIdsFollowedByAuthUser
        ]);

        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newUserIdsNeededForUsernames = [...setOfAllUserIds];

        if (newUserIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newUserIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newUserIdsNeededForUsernames = newUserIdsNeededForUsernames;
        }

        let usersAndTheirFullNames = {};
        const newUserIdsNeededForFullNames = [...setOfSuggestedUserIds];

        if (newUserIdsNeededForFullNames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForFullNames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newUserIdsNeededForFullNames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newUserIdsNeededForFullNames = newUserIdsNeededForFullNames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newUserIdsNeededForVerificationStatuses = newUserIdsNeededForUsernames;

        if (newUserIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newUserIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newUserIdsNeededForVerificationStatuses = newUserIdsNeededForVerificationStatuses;
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
                    if (newUserIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched users'
                        );
                    }

                    if (newUserIdsNeededForFullNames.length > 0) {
                        console.error(
                            'The server had trouble fetching the full-names of all the newly fetched users'
                        );
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            users`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newUserIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewUserIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newUserIdsNeededForUsernames.length; i++) {
                            const newUserId = newUserIdsNeededForUsernames[i];
                            const newUsername = listOfUsernamesForNewUserIds[i];

                            if (newUsername !== null) {
                                usersAndTheirUsernames[newUserId] = newUsername;
                            }
                        }
                    }
                    
                    if (newUserIdsNeededForFullNames.length > 0) {
                        const listOfFullNamesForNewUserIds = responseData.data.getListOfFullNamesForUserIds;

                        for(let i=0; i<newUserIdsNeededForFullNames.length; i++) {
                            const newUserId = newUserIdsNeededForFullNames[i];
                            const newUserFullName = listOfFullNamesForNewUserIds[i];

                            if (newUserFullName !== null) {
                                usersAndTheirFullNames[newUserId] = newUserFullName;
                            }
                        }
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewUserIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newUserIdsNeededForVerificationStatuses.length; i++) {
                            const newUserId = newUserIdsNeededForVerificationStatuses[i];
                            const newUserVerificationStatus = listOfVerificationStatusesForNewUserIds[i];

                            if (newUserVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newUserId] = newUserVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newUserIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        users`
                    );
                }

                if (newUserIdsNeededForFullNames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the full-names of all the newly fetched
                        users`
                    ); 
                }

                if (newUserIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched users`
                    );
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const newUserIdsNeededForProfilePhotos = [
            ...new Set([
                ...setOfStoryAuthorIds, ...setOfSuggestedUserIds, ...setOfMainAuthorIds
            ])
        ];

        if (newUserIdsNeededForProfilePhotos.length>0) {
            try {
                const response2 = await fetch(
                `http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers/${authUserId}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        userIds: newUserIdsNeededForProfilePhotos
                    }),
                    credentials: 'include'
                });
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched users'
                    );
                }
                else {
                    usersAndTheirProfilePhotos = await response2.json();
                }
            }
            catch {
                console.error(
                    'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched users'
                );
            }
        }

        const newUsersAndTheirRelevantInfo = { ...usersAndTheirRelevantInfo };

        for(let userId of setOfAllUserIds) {
            if (!(userId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[userId] = {};
            }

            if (userId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[userId].username = usersAndTheirUsernames[userId];
            }

            if (userId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[userId].isVerified = usersAndTheirVerificationStatuses[userId];
            }
            
            if (userId in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[userId].fullName = usersAndTheirFullNames[userId];
            }

            if (userId in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[userId].profilePhoto = usersAndTheirProfilePhotos[userId];
            }
        }

        const newOrderedListOfUsernamesInStoriesSection = [];
        for(let userId of orderedListOfUserIdsInStoriesSection) {
            newOrderedListOfUsernamesInStoriesSection.push(
                newUsersAndTheirRelevantInfo[userId].username ?? `user ${userId}`
            );
        }
        setOrderedListOfUsernamesInStoriesSection(newOrderedListOfUsernamesInStoriesSection);

        const newOrderedListOfSuggestedUsernames = [];
        for(let userId of orderedListOfSuggestedUsernames) {
            newOrderedListOfSuggestedUsernames.push(
                newUsersAndTheirRelevantInfo[userId].username ?? `user ${userId}`
            );
        }
        setOrderedListOfSuggestedUsernames(newOrderedListOfSuggestedUsernames);

        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }


    async function fetchAllTheNecessaryUserInfoOfAdditionalPosts(additionalPosts) {
        const setOfAuthorIds = new Set();
        const setOfMainAuthorIds = new Set();
        const setOfLikerIdsFollowedByAuthUser = new Set();

        for(let postDetails of additionalPosts) {
            setOfMainAuthorIds.add(postDetails.authorIds[0]);

            for(let authorId of postDetails.authorIds) {
                setOfAuthorIds.add(authorId);
            }

            for(let likerIdFollowedByAuthUser of postDetails.likersFollowedByAuthUser) {
                setOfLikerIdsFollowedByAuthUser.add(likerIdFollowedByAuthUser);
            }
        }

        const setOfAllUserIds = new Set([...setOfAuthorIds, ...setOfMainAuthorIds, ...setOfLikerIdsFollowedByAuthUser]);

        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newUserIdsNeededForUsernames = [...setOfAllUserIds].filter(userId => {
            if (!(userId in usersAndTheirRelevantInfo) || !('username' in usersAndTheirRelevantInfo)) {
                return true;
            }
            return false;
        });

        if (newUserIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newUserIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newUserIdsNeededForUsernames = newUserIdsNeededForUsernames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newUserIdsNeededForVerificationStatuses = [...setOfAllUserIds].filter(userId => {
            if (!(userId in usersAndTheirRelevantInfo) || !('isVerified' in usersAndTheirRelevantInfo[userId])) {
                return true;
            }
            return false;
        });

        if (newUserIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newUserIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newUserIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = authUserId;
            graphqlUserVariables.newUserIdsNeededForVerificationStatuses = newUserIdsNeededForVerificationStatuses;
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
                    if (newUserIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched users'
                        );
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            users`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newUserIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewUserIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newUserIdsNeededForUsernames.length; i++) {
                            const newUserId = newUserIdsNeededForUsernames[i];
                            const newUsername = listOfUsernamesForNewUserIds[i];

                            if (newUsername !== null) {
                                usersAndTheirUsernames[newUserId] = newUsername;
                            }
                        }
                    }

                    if (newUserIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewUserIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newUserIdsNeededForVerificationStatuses.length; i++) {
                            const newUserId = newUserIdsNeededForVerificationStatuses[i];
                            const newUserVerificationStatus = listOfVerificationStatusesForNewUserIds[i];

                            if (newUserVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newUserId] = newUserVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newUserIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        users`
                    );
                }

                if (newUserIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched users`
                    );
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const newUserIdsNeededForProfilePhotos = [...setOfMainAuthorIds].filter(userId => {
            if (!(userId in usersAndTheirRelevantInfo) || !('profilePhoto' in usersAndTheirRelevantInfo[userId])) {
                return true;
            }
            return false;
        });

        if (newUserIdsNeededForProfilePhotos.length>0) {
            try {
                const response2 = await fetch(
                `http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers/${authUserId}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        userIds: newUserIdsNeededForProfilePhotos
                    }),
                    credentials: 'include'
                });
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched users'
                    );
                }
                else {
                    usersAndTheirProfilePhotos = await response2.json();
                }
            }
            catch {
                console.error(
                    'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched users'
                );
            }
        }

        const newUsersAndTheirRelevantInfo = { ...usersAndTheirRelevantInfo };

        for(let userId of setOfAllUserIds) {
            if (!(userId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[userId] = {};
            }

            if (userId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[userId].username = usersAndTheirUsernames[userId];
            }

            if (userId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[userId].isVerified = usersAndTheirVerificationStatuses[userId];
            }
            
            if (userId in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[userId].profilePhoto = usersAndTheirProfilePhotos[userId];
            }
        }

        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }


    return (
        <>
            <LeftSidebar 
                profilePhoto={usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp}
                displayPopup={displayLeftSidebarPopup}
                authUserIsAnonymousGuest={authUserId == -1}
                toggleDisplayPopup={toggleDisplayLeftSidebarPopup}
            />

            <div style={{ marginTop: '2.3em', width: '82%', position: 'absolute', left: '18%', display: 'flex', gap: '2%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', width:
                '65%'}}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'center', gap: '1em', position:
                    'relative', width: '100%' }}>
                        <div style={{ height: '4.6em', width: '2em', position: 'relative' }}>
                            {currStoryLevel > 0 && (
                                <img src={nextArrow} className="iconToBeAdjustedForDarkMode"
                                    onClick={() => changeStoryLevel('decrement')}
                                    style={{
                                        height: '1.5em', width: '1.5em', objectFit: 'contain', cursor: 'pointer', position:
                                        'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(180deg)'
                                    }} />
                            )}
                        </div>

                        {currStoryLevel === 0 && (
                            <UserIcon
                                authUserId={authUserId}
                                userId={authUserId}
                                username={authUsername}
                                userPfp={usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp}
                                inStoriesSection={true}
                                isSponsored={false}
                                userHasStories={authUserId in usersAndTheirStories}
                                userHasUnseenStory={!userIdsWhoseStoriesYouHaveFinished.has(authUserId)}
                                userIsVerified={usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false}
                                showStoryViewer={showStoryViewer}
                            />
                        )}

                        {fetchingStoriesIsComplete && storiesSectionErrorMessage.length === 0 ? (
                            <>
                                {orderedListOfUserIdsInStoriesSection.slice(currStoryLevel * 6, currStoryLevel * 6 + 6).map(
                                    (userId, index) => (
                                    <UserIcon
                                        key={userId}
                                        authUserId={authUserId}
                                        userId={userId}
                                        username={orderedListOfUsernamesInStoriesSection[currStoryLevel * 6 + index]}
                                        userPfp={usersAndTheirRelevantInfo[userId]?.profilePhoto ?? defaultPfp}
                                        inStoriesSection={true}
                                        isSponsored={orderedListOfSponsorshipStatusesInStoriesSection[
                                            currStoryLevel * 6 + index
                                        ]}
                                        userHasStories={true}
                                        userHasUnseenStory={!userIdsWhoseStoriesYouHaveFinished.has(userId)}
                                        userIsVerified={usersAndTheirRelevantInfo[userId]?.isVerified ?? false}
                                        showStoryViewer={showStoryViewer}
                                    />
                                ))}
                                <div style={{ height: '4.6em', width: '2em', position: 'relative' }}>
                                    {(currStoryLevel + 1) * 6 < orderedListOfUsernamesInStoriesSection.length && (
                                        <img src={nextArrow} className="iconToBeAdjustedForDarkMode"
                                            onClick={() => changeStoryLevel('increment')}
                                            style={{
                                                height: '1.5em', width: '1.5em', objectFit: 'contain', cursor: 'pointer',
                                                position: 'absolute', top: '50%', left: '50%',
                                                transform: 'translate(-50%, -50%)'
                                            }} />
                                    )}
                                </div>
                            </>
                        ) : fetchingStoriesIsComplete && storiesSectionErrorMessage.length > 0 ? (
                            <div style={{ height: '4.6em', width: '50%', position: 'relative', marginLeft: '10%' }}>
                                <p style={{
                                    fontSize: '0.9em', maxWidth: '100%', overflowWrap: 'break-word', color: 'gray',
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -80%)'
                                }}>
                                    {storiesSectionErrorMessage}
                                </p>
                            </div>
                        ) : (
                            <div style={{ height: '4.6em', width: '2em', position: 'relative', marginLeft: '20%' }}>
                                <img src={loadingAnimation} style={{
                                    height: '1.5em', width: '1.5em', objectFit: 'contain', pointerEvents: 'none',
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
                                }} />
                            </div>
                        )}
                    </div>

                    <br />
                    <br />

                    {(initialPostsFetchingIsComplete && initialPostsFetchingErrorMessage.length == 0) &&
                        (
                            orderedListOfPosts.map(postDetails =>(
                                <MediaPost
                                    key={postDetails.overallPostId}
                                    authUserId={authUserId}
                                    postDetails={postDetails}
                                    mainPostAuthorInfo={usersAndTheirRelevantInfo[postDetails.authorIds[0]] ?? {}}
                                    isFocused={focusedMediaPostId === postDetails.overallPostId}
                                    usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                    updatePostDetails={updatePostDetails}
                                    showThreeDotsPopup={showThreeDotsPopup}
                                    showCommentsPopup={showCommentsPopup}
                                    showSendPostPopup={showSendPostPopup}
                                    showLikersPopup={showLikersPopup}
                                    showErrorPopup={showErrorPopup}
                                    showStoryViewer={showStoryViewer}
                                    focusOnThisMediaPost={updateFocusedMediaPost}
                            />))
                        )
                    }

                    {(!isCurrentlyFetchingAdditionalPosts && additionalPostsFetchingErrorMessage.length > 0) &&
                        (
                            <div style={{marginTop: '2.5em', display: 'flex', width: '100', justifyContent: 'center'}}>
                                <p style={{maxWidth: '50%', overflowWrap: 'break-word', color: 'gray', fontSize: '0.9em'}}>
                                    { additionalPostsFetchingErrorMessage }
                                </p>
                            </div>
                        )
                    }


                    {isCurrentlyFetchingAdditionalPosts &&
                        (
                            <div style={{marginTop: '2.5em', display: 'flex', width: '100%', justifyContent: 'center'}}>
                                <img src={loadingAnimation} style={{height: '1.5em', width: '1.5em', objectFit: 'contain',
                                pointerEvents: 'none'}}/>
                            </div>
                        )
                    }
                </div>

                <div id="rightmostSection" style={{ display: 'flex', flexDirection: 'column', alignItems: 'start',
                justifyContent: 'start', width: '22%', gap: '1em', position: 'relative' }}>
                    {authUserId !== -1 && (
                        <UserBar
                            username={authUsername}
                            userFullName={usersAndTheirRelevantInfo[authUserId]?.fullName ?? 'Could not get full-name'}
                            userPfp={usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp}
                            authUserId={authUserId}
                            userId={authUserId}
                            numFollowers={0}
                            numFollowings={0}
                            numPosts={0}
                            userIsPrivate={usersAndTheirRelevantInfo[authUserId]?.isPrivate ?? false}
                            userIsVerified={usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false}
                            showErrorPopup={showErrorPopup}
                        />
                    )}

                    <div style={{ width: '100%', position: 'relative', marginBottom: '2em' }}>
                        <b style={{ color: '#787878', position: 'absolute', left: '0%', top: '0%' }}>Suggested for you</b>
                        <a href="http://34.111.89.101/user-suggestions" target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.9em', position: 'absolute', right: '0%', top: '0%' }}>
                            See all
                        </a>
                    </div>

                    {fetchingSuggestedUsersIsComplete && suggestedUsersSectionErrorMessage.length === 0 ? (
                        orderedListOfSuggestedUserIds.map((suggestedUserId, index) => (
                            <UserBar
                                key={suggestedUserId}
                                username={orderedListOfSuggestedUsernames[index]}
                                userFullName={usersAndTheirRelevantInfo[suggestedUserId]?.fullName ?? 'Could not get full-name'}
                                userPfp={usersAndTheirRelevantInfo[suggestedUserId]?.profilePhoto ?? defaultPfp}
                                authUserId={authUserId}
                                userId={suggestedUserId}
                                numFollowers={usersAndTheirRelevantInfo[suggestedUserId]?.numFollowers ?? -1}
                                numFollowings={usersAndTheirRelevantInfo[suggestedUserId]?.numFollowings ?? -1}
                                numPosts={usersAndTheirRelevantInfo[suggestedUserId]?.numPosts ?? -1}
                                userIsPrivate={usersAndTheirRelevantInfo[suggestedUserId]?.isPrivate ?? false}
                                userIsVerified={usersAndTheirRelevantInfo[suggestedUserId]?.isVerified ?? false}
                                showErrorPopup={showErrorPopup}
                            />
                        ))
                    ) : fetchingSuggestedUsersIsComplete && suggestedUsersSectionErrorMessage.length > 0 ? (
                        <p style={{
                            color: 'gray', width: '100%', overflowWrap: 'break-word',
                            marginTop: '2em', marginBottom: '2em', fontSize: '0.85em'
                        }}>
                            {suggestedUsersSectionErrorMessage}
                        </p>
                    ) : (
                        <img src={loadingAnimation} style={{
                            height: '1.5em', width: '1.5em', objectFit: 'contain', pointerEvents: 'none',
                            marginTop: '2em', marginBottom: '2em', marginLeft: '50%'
                        }} />
                    )}

                    <br />

                    <footer style={{ color: 'gray', fontSize: '0.8em', width: '100%' }}>
                        Megagram, a full-stack web-application that blends a bit of Instagram with a bit of Amazon, is a
                        personal project of Rishav Ray.
                    </footer>
                </div>
            </div>

            {(initialPostsFetchingIsComplete && initialPostsFetchingErrorMessage.length > 0) &&
                (
                    <p style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth:
                    '35%', overflowWrap: 'break-word', color: 'gray', fontSize: '0.9em'}}>
                        { initialPostsFetchingErrorMessage }
                    </p>
                )
            }

            {!initialPostsFetchingIsComplete &&
                (
                    <img src={loadingAnimation} style={{position: 'absolute', top: '50%', left: '50%', transform:
                    'translate(-50%, -50%)', height: '1.5em', width: '1.5em', objectFit: 'contain', pointerEvents: 'none'}}/>
                )
            }

            {(displayThreeDotsPopup || displayCommentsPopup ||  displaySendPostPopup ||  displayLikersPopup ||
            displayAboutAccountPopup || displayLeftSidebarPopup || displayErrorPopup)
            &&  (
                    <img onClick={closeAllPopups} src={blackScreen} style={{position: 'fixed', 
                    top: '0%', left: '0%', width: '100%', height: '100%', opacity: '0.7', 
                    zIndex: '2'}}/>
                )
            }

            {displayCommentsPopup &&
                (
                    <CommentsPopup
                        authUserId={authUserId}
                        authUsername={authUsername}
                        postDetails={commentsPopupPostDetails}
                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                        updateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                        mainPostAuthorInfo={
                            usersAndTheirRelevantInfo[commentsPopupPostDetails.authorIds[0]] ?? {}
                        }
                        currSlide={commentsPopupCurrSlide}
                        zIndex={
                            (displayThreeDotsPopup ||  displaySendPostPopup || displayLikersPopup ||
                            displayAboutAccountPopup || displayErrorPopup || displayStoryViewer) ? 
                            '1' : '2'
                        }
                        closePopup={closeCommentsPopup}
                        showErrorPopup={showErrorPopup}
                        showThreeDotsPopup={showThreeDotsPopup}
                        showSendPostPopup={showSendPostPopup}
                        showLikersPopup={showLikersPopup}
                        showStoryViewer={showStoryViewer}
                        updatePostDetails={updatePostDetails}
                    />
                )
            }

            {displayAboutAccountPopup &&
                (
                    <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: displayStoryViewer ? '1' : '2'}}>
                        <AboutAccountPopup
                            authUserId={authUserId}
                            userId={aboutAccountUserId}
                            username={aboutAccountUsername}
                            authUsername={authUsername}
                            userPfp={aboutAccountUserProfilePhoto}
                            userIsVerified={aboutAccountUserIsVerified}
                            userHasStories={aboutAccountUserHasStories}
                            userHasUnseenStory={aboutAccountUserHasUnseenStory}
                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                            addRelevantInfoToUser={addRelevantInfoToUser}
                            closePopup={closeAboutAccountPopup}
                            showStoryViewer={showStoryViewer}
                        />
                    </div>
                )
            }

            {displayStoryViewer &&
                (
                    <StoryViewer
                        authUserId={authUserId}
                        authUsername={authUsername}
                        storyAuthorUsername={storyViewerMainUsername}
                        storyAuthorId={storyViewerMainUserId}
                        zIndex={displayErrorPopup ? '1' : '2'}
                        orderedListOfUserIdsInStoriesSection={orderedListOfUserIdsInStoriesSection}
                        orderedListOfUsernamesInStoriesSection={orderedListOfUsernamesInStoriesSection}
                        orderedListOfSponsorshipStatusesInStoriesSection={
                            orderedListOfSponsorshipStatusesInStoriesSection
                        }
                        isFromStoriesSection={storyViewerIsFromStoriesSection}
                        usersAndTheirStories={usersAndTheirStories}
                        usersAndTheirStoryPreviews={usersAndTheirStoryPreviews}
                        usersAndYourCurrSlideInTheirStories={usersAndYourCurrSlideInTheirStories}
                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                        vidStoriesAndTheirPreviewImages={vidStoriesAndTheirPreviewImages}
                        userIdsWhoseStoriesYouHaveFinished={userIdsWhoseStoriesYouHaveFinished}
                        updateUsersAndTheirStories={updateUsersAndTheirStories}
                        updateUsersAndTheirStoryPreviews={updateUsersAndTheirStoryPreviews}
                        updateUsersAndYourCurrSlideInTheirStories={updateUsersAndYourCurrSlideInTheirStories}
                        updateVidStoriesAndTheirPreviewImages={updateVidStoriesAndTheirPreviewImages}
                        addUserIdToSetOfUsersWhoseStoriesYouHaveFinished={
                            addUserIdToSetOfUsersWhoseStoriesYouHaveFinished
                        }
                        closeStoryViewer={closeStoryViewer}
                        showErrorPopup={showErrorPopup}
                    />
                )
            }

            {displayLeftSidebarPopup &&
                (
                    <div style={{position: 'fixed', bottom: '10%', left: '1%', zIndex: displayErrorPopup ? '1'
                    : '2'}}>
                        <LeftSidebarPopup
                            authUserId={authUserId}
                            originalURL={originalURL}
                            notifyParentToShowErrorPopup={showErrorPopup}
                        />
                    </div>
                )
            }

            {displayThreeDotsPopup &&
                (
                    <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: displayErrorPopup ? '1': '2'}}>
                        <ThreeDotsPopup
                            authUserId={authUserId}
                            postDetails={threeDotsPopupPostDetails} 
                            hidePost={hidePost}
                            showErrorPopup={showErrorPopup}
                            closePopup={closeThreeDotsPopup}
                            showAboutAccountPopup={showAboutAccountPopup}
                        />
                    </div>
                )
            }

            {displaySendPostPopup &&
                (
                    <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: displayErrorPopup ? '1': '2'}}>
                        <SendPostPopup
                            authUserId={authUserId}
                            overallPostId={sendPostPopupOverallPostId}
                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                            cachedMessageSendingSuggestions={cachedMessageSendingSuggestions}
                            updateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                            updateCachedMessageSendingSuggestions={updateCachedMessageSendingSuggestions}
                            showErrorPopup={showErrorPopup}
                            closePopup={closeSendPostPopup}
                        />
                    </div>
                )
            }

            {displayLikersPopup &&
                (
                    <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: displayErrorPopup ? '1': '2'}}>
                        <LikersPopup
                            idOfPostOrComment={likersPopupIdOfPostOrComment}
                            authUserId={authUserId}
                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                            closePopup={closeLikersPopup}
                            showErrorPopup={showErrorPopup}
                            updateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                        />
                    </div>
                )
            }

            {displayErrorPopup &&
                (
                    <div style={{position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', zIndex: '2'}}>
                        <ErrorPopup
                            errorMessage={errorPopupMessage}
                            closePopup={closeErrorPopup}
                        />
                    </div>
                )
            }
            
            {orderedListOfNotifications.length > 0 &&
                (
                    orderedListOfNotifications.slice(0,1).map(notification =>
                        (
                            <UserNotification
                                key={notification.description}
                                leftImage={notification.leftImage}
                                rightImage={notification.rightImage}
                                description={notification.description}
                                leftImageLink={notification.leftImageLink}
                                entireNotificationLink={notification.entireNotificationLink}
                                deleteThis={deleteNotification}
                            />
                        )
                    )
                )
            }
        </>
    );
}

export default HomePage;