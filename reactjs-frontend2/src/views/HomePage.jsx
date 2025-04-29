import AboutAccountPopup from '../components/Popups/AboutAccountPopup';
import CommentsPopup from '../components/Popups/CommentsPopup';
import ErrorPopup from '../components/Popups/ErrorPopup';
import LeftSidebarPopup from '../components/Popups/LeftSidebarPopup';
import LikersPopup from '../components/Popups/LikersPopup';
import SendPostPopup from '../components/Popups/SendPostPopup';
import ThreeDotsPopup from '../components/Popups/ThreeDotsPopup';

import Footer from '../components/Footer';
import LeftSidebar from '../components/LeftSidebar';
import MediaPost from '../components/MediaPost';
import StoryViewer from '../components/StoryViewer';
import UserBar from '../components/UserBar';
import UserIcon from '../components/UserIcon';
import UserNotification from '../components/UserNotification';

import backArrow from "../assets/images/backArrow.png";
import blackScreen from "../assets/images/blackScreen.png";
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import rightArrow from "../assets/images/nextArrow.png";

import '../assets/styles.css';

import { useEffect, useState } from 'react';

import * as signalR from '@microsoft/signalr';
import { io } from "socket.io-client";


function HomePage({urlParams}) {
    const [authUsername, setAuthUsername] = useState('');
    const [authUserId, setAuthUserId] = useState(-1);

    const [originalURL, setOriginalURL] = useState('');

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
    const [usernamesWhoseStoriesYouHaveFinished, setUsernamesWhoseStoriesYouHaveFinished] = useState(new Set());
    const [usersAndTheirStories, setUsersAndTheirStories] = useState({});
    const [usersAndTheirStoryPreviews, setUsersAndTheirStoryPreviews] = useState({});
    const [usersAndYourCurrSlideInTheirStories, setUsersAndYourCurrSlideInTheirStories] = useState({});
    const [vidStoriesAndTheirPreviewImages, setVidStoriesAndTheirPreviewImages] = useState({});

    const [displayCommentsPopup, setDisplayCommentsPopup] = useState(false);
    const [commentsPopupPostDetails, setCommentsPopupPostDetails] = useState({});
    const [commentsPopupCurrSlide, setCommentsPopupCurrSlide] = useState(0);

    const [orderedListOfPosts, setOrderedListOfPosts] = useState([]);
    const [focusedMediaPostId, setFocusedMediaPostId] = useState('');

    const [usersAndTheirRelevantInfo, setUsersAndTheirRelevantInfo] = useState({});
    const [postsAndTheirPreviewImgs, setPostsAndTheirPreviewImgs] = useState({});

    const [cachedMessageSendingSuggestions, setCachedMessageSendingSuggestions] = useState({});

    const [displayLikersPopup, setDisplayLikersPopup] = useState(false);
    const [likersPopupIdOfPostOrComment, setLikersPopupIdOfPostOrComment] = useState('');

    const [displaySendPostPopup, setDisplaySendPostPopup] = useState(false);
    const [sendPostPopupOverallPostId, setSendPostPopupOverallPostId] = useState('');
    
    const [displayLeftSidebarPopup, setDisplayLeftSidebarPopup] = useState(false);

    const [fetchingSuggestedAccountsIsComplete, setFetchingSuggestedAccountsIsComplete] = useState(false);
    const [fetchingInitialPostsIsComplete, setFetchingInitialPostsIsComplete] = useState(false);
    const [orderedListOfUsernamesOfSuggestedAccounts, setOrderedListOfUsernamesOfSuggestedAccounts] = useState([]);
    const [suggestedAccountsSectionErrorMessage, setSuggestedAccountsSectionErrorMessage] = useState('');
    const [initialPostsFetchingErrorMessage, setInitialPostsFetchingErrorMessage] = useState('');
    const [isCurrentlyFetchingAdditionalPosts, setIsCurrentlyFetchingAdditionalPosts] = useState(false);
    const [additionalPostsFetchingErrorMessage, setAdditionalPostsFetchingErrorMessage] = useState('');

    const [orderedListOfNotifications, setOrderedListOfNotifications] = useState([]);


    useEffect(() => {
        document.title = "Megagram";
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
        if (fetchingStoriesIsComplete && fetchingSuggestedAccountsIsComplete && fetchingInitialPostsIsComplete) {
            fetchAllTheNecessaryUserInfo();
        }
    }, [fetchingStoriesIsComplete, fetchingSuggestedAccountsIsComplete, fetchingInitialPostsIsComplete]);
       

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
        if (authUsername !== 'Anonymous Guest') {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOwnUnexpiredStories/${authUsername}`, {
                    credentials: 'include'
                });
                if(!response.ok) {
                    console.error('The server could not find an unexpired story of yours.');
                }
                else {
                    const ownUnexpiredStoryData = await response.json();
                    const newUsersAndTheirStories = {};
                    const newUsersAndYourCurrSlideInTheirStories = {};
                    
                    newUsersAndTheirStories[authUsername] = ownUnexpiredStoryData.stories;
                    
                    if (ownUnexpiredStoryData.currSlide==='finished') {
                        newUsersAndYourCurrSlideInTheirStories[authUsername] = 0;
                        setUsernamesWhoseStoriesYouHaveFinished(new Set([authUsername]));
                    }
                    else {
                        newUsersAndYourCurrSlideInTheirStories[authUsername] = ownUnexpiredStoryData.currSlide;
                    }
                    setUsersAndTheirStories(newUsersAndTheirStories);
                    setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
                }
            }
            catch (error) {
                console.error('There was trouble connecting to the server to find an unexpired story of yours');
            }
        }

        try {
            const response1 = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOrderedListOfUsernamesInStoriesSection/
            ${authUsername}`, {
                credentials: 'include'
            });
            if(!response1.ok) {
                setStoriesSectionErrorMessage('The server could not retrieve the stories for this section.');
            }
            else {
                const newOrderedListOfUsernamesInStoriesSection = await response1.json();
                setOrderedListOfUsernamesInStoriesSection(newOrderedListOfUsernamesInStoriesSection);
            }
        }
        catch (error) {
            setStoriesSectionErrorMessage(
                'There was trouble connecting to the server to retrieve the stories for this section.'
            );
        }
        finally {
            setFetchingStoriesIsComplete(true);
        }
    }


    async function fetchSuggestedAccounts() {
        try {
            const response = await fetch(
                `http://34.111.89.101/api/Home-Page/djangoBackend2/getSuggestedAccountsForUser/${authUsername}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                setSuggestedAccountsSectionErrorMessage(
                    'The server could not retrieve your suggested accounts for this section.'
                );
            }
            else {
                const newOrderedListOfSuggestedAccounts = await response.json();
                setOrderedListOfUsernamesOfSuggestedAccounts(newOrderedListOfSuggestedAccounts);
            }
        }
        catch (error) {
            setSuggestedAccountsSectionErrorMessage(
                'There was trouble connecting to the server to retrieve your suggested accounts for this section.'
            );
        }
        finally {
            setFetchingSuggestedAccountsIsComplete(true);
        }

    }

    
    async function fetchPosts(initialOrAdditionalText) {
        const isInitialFetch = initialOrAdditionalText==='initial';
        let fetchError = false;
        let listOfNewPostsForFeed = [];

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getBatchOfPostsForUserFeed/${authUsername}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                if(isInitialFetch) {
                    setInitialPostsFetchingErrorMessage(
                        'The server could not retrieve the initial posts of this section.'
                    );
                }
                else {
                    setAdditionalPostsFetchingErrorMessage(
                        'The server could not retrieve the additional posts of this section.'
                    );
                }
                fetchError = true;
            }
            else {
                listOfNewPostsForFeed = await response.json();
                const newOrderedListOfPosts = [...orderedListOfPosts, ...listOfNewPostsForFeed];
                setOrderedListOfPosts(newOrderedListOfPosts);
            }
        }
        catch (error) {
            if(isInitialFetch) {
                setInitialPostsFetchingErrorMessage(
                    'There was trouble connecting to the server to retrieve the initial posts of this section.'
                );
            }
            else {
                setAdditionalPostsFetchingErrorMessage(
                    'There was trouble connecting to the server to retrieve the additional posts of this section.'
                );
            }
            fetchError = true;
        }
        finally {
            if(isInitialFetch) {
                setFetchingInitialPostsIsComplete(true);
                if (!fetchError) {
                    setTimeout(() => {
                        window.addEventListener("scroll", fetchAdditionalPostsWhenUserScrollsToBottomOfPage);
                    }, 1500);
                }
            }
            else {
                setIsCurrentlyFetchingAdditionalPosts(false);
                if (!fetchError) {
                    fetchAllTheNecessaryUserInfoForAdditionalUserPosts(listOfNewPostsForFeed);
                }
            }
        }
    }


    async function fetchAllTheNecessaryUserInfo() {
        let usernamesOfAllPostAuthors = [];
        const usernamesOfAllMainPostAuthors = [];
        let usernamesOfLikersFollowedByAuthUser = [];
        const usernamesTaggedInVidSlides = [];
        for(let postDetails of orderedListOfPosts) {
            usernamesOfAllPostAuthors+= postDetails.authors;
            usernamesOfAllMainPostAuthors.push(postDetails.authors[0]);
            usernamesOfLikersFollowedByAuthUser+= postDetails.likersFollowedByAuthUser;
            for(let slide of postDetails.slides) {
                if(slide.type==='Video') {
                    for(let taggedAccountInfo of slide.taggedAccounts) {
                        usernamesTaggedInVidSlides.push(taggedAccountInfo[0]);
                    }
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        let usernamesNeededForProfilePhotos = [
            ...orderedListOfUsernamesInStoriesSection,
            ...orderedListOfUsernamesOfSuggestedAccounts,
            ...usernamesOfAllMainPostAuthors,
            ...usernamesTaggedInVidSlides
        ];
        if (authUsername !== 'Anonymous Guest') {
            usernamesNeededForProfilePhotos.push(authUsername);
        }
        const uniqueListOfUsernamesNeededForProfilePhotos = [...new Set(usernamesNeededForProfilePhotos)];
        if (uniqueListOfUsernamesNeededForProfilePhotos.length > 0) {
            try {
                const response = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotosOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesNeededForProfilePhotos
                    })
                });
                if(!response.ok) {
                    console.error("The server had trouble fetching all the necessary profile-photos");
                    for(let username in uniqueListOfUsernamesNeededForProfilePhotos) {
                        usersAndTheirProfilePhotos[username] = defaultPfp;
                    }
                }
                else {
                    usersAndTheirProfilePhotos = await response.json();
                }
            }
            catch (error) {
                console.error("There was trouble connecting to the server to fetch all the necessary profile-photos");
                for(let username in uniqueListOfUsernamesNeededForProfilePhotos) {
                    usersAndTheirProfilePhotos[username] = defaultPfp;
                }
            }
        }
        
        let usersAndTheirIsVerifiedStatuses = {};
        const usernamesNeededForIsVerifiedStatuses = [
            ...orderedListOfUsernamesInStoriesSection,
            ...orderedListOfUsernamesOfSuggestedAccounts,
            ...usernamesOfAllPostAuthors,
            ...usernamesTaggedInVidSlides,
            ...usernamesOfLikersFollowedByAuthUser
        ];
        if (authUsername !== 'Anonymous Guest') {
            usernamesNeededForIsVerifiedStatuses.push(authUsername);
        }
        const uniqueListOfUsernamesRequiredForIsVerifiedStatuses = [... new Set(usernamesNeededForIsVerifiedStatuses)];
        if (uniqueListOfUsernamesRequiredForIsVerifiedStatuses.length > 0) {
            try {
                const response1 = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsVerifiedStatusesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesRequiredForIsVerifiedStatuses
                    })
                });
                if(!response1.ok) {
                    console.error("The server had trouble fetching all the necessary isVerified statuses");
                    for(let username in uniqueListOfUsernamesRequiredForIsVerifiedStatuses) {
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
                for(let username in uniqueListOfUsernamesRequiredForIsVerifiedStatuses) {
                    usersAndTheirIsVerifiedStatuses[username] = false;
                }
            }
        }

        let usersAndTheirFullNames = {};
        const usernamesNeededForFullNames = [
            ...orderedListOfUsernamesOfSuggestedAccounts,
            ...usernamesTaggedInVidSlides
        ];
        if (authUsername !== 'Anonymous Guest') {
            usernamesNeededForFullNames.push(authUsername);
        }
        const uniqueListOfUsernamesNeededForFullNames = [...new Set(usernamesNeededForFullNames)];
        if (uniqueListOfUsernamesNeededForFullNames.length > 0) {
            try {
                const response2 = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getFullNamesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesNeededForFullNames
                    })
                });
                if(!response2.ok) {
                    console.error("The server had trouble fetching all the necessary fullNames");
                    for(let username in uniqueListOfUsernamesNeededForFullNames) {
                        usersAndTheirFullNames[username] = '?';
                    }
                }
                else {
                    usersAndTheirFullNames = await response2.json();
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

        let usersAndTheirIsPrivateStatuses = {};
        if (orderedListOfUsernamesOfSuggestedAccounts.length > 0) {
            try {
                const response3 = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsPrivateStatusesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: orderedListOfUsernamesOfSuggestedAccounts
                    })
                });
                if(!response3.ok) {
                    console.error("The server had trouble fetching all the necessary isPrivate statuses");
                    for(let username in orderedListOfUsernamesOfSuggestedAccounts) {
                        usersAndTheirIsPrivateStatuses[username] = '?';
                    }
                }
                else {
                    usersAndTheirIsPrivateStatuses = await response3.json();
                }
            }
            catch(error) {
                console.error(
                    "There was trouble connecting to the server to fetch all the necessary isPrivate statuses"
                );
                for(let username in orderedListOfUsernamesOfSuggestedAccounts) {
                    usersAndTheirIsPrivateStatuses[username] = '?';
                }
            }
        }


        let usersAndTheirNumPostsFollowersAndFollowings = {};
        if (orderedListOfUsernamesOfSuggestedAccounts.length > 0) {
            try {
                const response4 = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/
                getNumPostsFollowersAndFollowingsOfMultipleUsers`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: orderedListOfUsernamesOfSuggestedAccounts
                    })
                });
                if(!response4.ok) {
                    console.error(
                        `The server had trouble fetching all the necessary
                        numPosts/numFollowers/numFollowings combos.`
                    );
                    for(let username in orderedListOfUsernamesOfSuggestedAccounts) {
                        usersAndTheirNumPostsFollowersAndFollowings[username] = {
                            numPosts: '?',
                            numFollowers: '?',
                            numFollowings: '?'
                        };
                    }
                }
                else {
                    usersAndTheirNumPostsFollowersAndFollowings = await response4.json();
                }
            }
            catch(error) {
                console.error(
                    `There was trouble connecting to the server to fetch all the necessary
                    numPosts/numFollowers/numFollowings combos.`
                );
                for(let username in orderedListOfUsernamesOfSuggestedAccounts) {
                    usersAndTheirNumPostsFollowersAndFollowings[username] = {
                        numPosts: '?',
                        numFollowers: '?',
                        numFollowings: '?'
                    };
                }
            }
        }

        let usersAndTheirHasStoriesAndUnseenStoryStatuses = {};
        const uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses = [
            ...new Set(
                [
                    ...usernamesOfAllMainPostAuthors
                ]
            )
        ]; 
        if (uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses.length > 0) {
            try {
                const response5 = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/
                getHasStoriesAndUnseenStoryStatusesOfMultipleUsers`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses
                    }),
                    credentials: 'include'
                });
                if(!response5.ok) {
                    console.error(
                        `The server had trouble fetching all the necessary
                        'hasStoriesAndUnseenStoryStatuses'.`
                    );
                    for(let username in uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses) {
                        usersAndTheirHasStoriesAndUnseenStoryStatuses[username] = {
                            hasStories: false,
                            hasUnseenStory: false
                        };
                    }
                }
                else {
                    usersAndTheirHasStoriesAndUnseenStoryStatuses = await response5.json();
                }
            }
            catch(error) {
                console.error(
                    `There was trouble connecting to the server to fetch all the necessary
                    'hasStoriesAndUnseenStoryStatuses'.`
                );
                for(let username in uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses) {
                    usersAndTheirHasStoriesAndUnseenStoryStatuses[username] = {
                        hasStories: false,
                        hasUnseenStory: false
                    };
                }
            }
        }

        const newUsersAndTheirRelevantInfo = {};
        const uniqueSetOfAllUsernames = new Set(
            [
                ...orderedListOfUsernamesInStoriesSection,
                ...orderedListOfUsernamesOfSuggestedAccounts,
                ...usernamesOfAllPostAuthors,
                ...usernamesTaggedInVidSlides,
                ...usernamesOfLikersFollowedByAuthUser
            ]
        );
        if (authUsername !== 'Anonymous Guest') {
            uniqueSetOfAllUsernames.add(authUsername);
        }
        else {
            newUsersAndTheirRelevantInfo['Anonymous Guest'] = {
                profilePhoto: defaultPfp,
                isVerified: false,
                fullName: '' 
            }
        }

        for(let username of uniqueSetOfAllUsernames) {
            newUsersAndTheirRelevantInfo[username] = {};
            if (username in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[username].profilePhoto = usersAndTheirProfilePhotos[username];
            }
            if (username in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[username].isVerified = usersAndTheirIsVerifiedStatuses[username];
            }
            if (username in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[username].fullName = usersAndTheirFullNames[username];
            }
            if (username in usersAndTheirIsPrivateStatuses) {
                newUsersAndTheirRelevantInfo[username].isPrivate = usersAndTheirIsPrivateStatuses[username];
            }
            if (username in usersAndTheirNumPostsFollowersAndFollowings) {
                newUsersAndTheirRelevantInfo[username].numPosts =
                usersAndTheirNumPostsFollowersAndFollowings[username].numPosts;

                newUsersAndTheirRelevantInfo[username].numFollowers =
                usersAndTheirNumPostsFollowersAndFollowings[username].numFollowers;

                newUsersAndTheirRelevantInfo[username].numFollowings =
                usersAndTheirNumPostsFollowersAndFollowings[username].numFollowings;
            }
            if (username in usersAndTheirHasStoriesAndUnseenStoryStatuses) {
                newUsersAndTheirRelevantInfo[username].hasStories =
                usersAndTheirHasStoriesAndUnseenStoryStatuses[username].hasStories;

                newUsersAndTheirRelevantInfo[username].hasUnseenStory =
                usersAndTheirHasStoriesAndUnseenStoryStatuses[username].hasUnseenStory;
            }
        }
        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }


    async function fetchAllTheNecessaryUserInfoForAdditionalUserPosts(listOfNewPostsForFeed) {
        const usernamesOfNewPostAuthors = [];
        const usernamesOfNewMainPostAuthors = [];
        const usernamesOfLikersFollowedByAuthUser = [];
        const usernamesTaggedInVidSlides = [];
        for(let postDetails of listOfNewPostsForFeed) {
            usernamesOfNewPostAuthors+= postDetails.authors;
            usernamesOfNewMainPostAuthors.push(postDetails.authors[0]);
            usernamesOfLikersFollowedByAuthUser+= postDetails.likersFollowedByAuthUser;
            for(let slide of postDetails.slides) {
                if(slide.type==='Video') {
                    for(let taggedAccountInfo of slide.taggedAccounts) {
                        usernamesTaggedInVidSlides.push(taggedAccountInfo[0]);
                    }
                }
            }
        }

        let usersAndTheirProfilePhotos = {};
        const uniqueListOfNewUsernamesNeededForProfilePhotos = [
            ...new Set(
                [
                    ...(usernamesOfNewMainPostAuthors.filter(username=> {
                        if (!(username in usersAndTheirRelevantInfo) || !('profilePhoto' in
                        usersAndTheirRelevantInfo[username])) {
                            return username;
                        }
                    })),

                    ...(usernamesTaggedInVidSlides.filter(username=> {
                        if (!(username in usersAndTheirRelevantInfo) || !('profilePhoto' in
                        usersAndTheirRelevantInfo[username])) {
                            return username;
                        }
                    }))
                ]
            )
        ];
        if(uniqueListOfNewUsernamesNeededForProfilePhotos.length>0) {
            try {
                const response = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotosOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfNewUsernamesNeededForProfilePhotos
                    })
                });
                if(!response.ok) {
                    console.error("The server had trouble fetching all the necessary profile-photos");
                    for(let username in uniqueListOfNewUsernamesNeededForProfilePhotos) {
                        usersAndTheirProfilePhotos[username] = defaultPfp;
                    }
                }
                else {
                    usersAndTheirProfilePhotos = await response.json();
                }
            }
            catch (error) {
                console.error("There was trouble connecting to the server to fetch all the necessary profile-photos");
                for(let username in uniqueListOfNewUsernamesNeededForProfilePhotos) {
                    usersAndTheirProfilePhotos[username] = defaultPfp;
                }
            }
        }

        let usersAndTheirIsVerifiedStatuses = {};
        const uniqueListOfNewUsernamesNeededForIsVerifiedStatuses = [
            ...new Set(
                [
                    ...(usernamesOfNewPostAuthors.filter(username=> {
                        if (!(username in usersAndTheirRelevantInfo) || !('isVerified' in
                        usersAndTheirRelevantInfo[username])) {
                            return username;
                        }
                    })),

                    ...(usernamesOfLikersFollowedByAuthUser.filter(username=> {
                        if (!(username in usersAndTheirRelevantInfo) || !('isVerified' in
                        usersAndTheirRelevantInfo[username])) {
                            return username;
                        }
                    })),

                    ...(usernamesTaggedInVidSlides.filter(username=> {
                        if (!(username in usersAndTheirRelevantInfo) || !('isVerified' in
                        usersAndTheirRelevantInfo[username])) {
                            return username;
                        }
                    })),
                ]
            )
        ];
        if(uniqueListOfNewUsernamesNeededForIsVerifiedStatuses.length>0) {
            try {
                const response1 = await fetch(
                'http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsVerifiedStatusesOfMultipleUsers', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        usernames: uniqueListOfNewUsernamesNeededForIsVerifiedStatuses
                    })
                });
                if(!response1.ok) {
                    console.error("The server had trouble fetching all the necessary isVerified statuses");
                    for(let username in uniqueListOfNewUsernamesNeededForIsVerifiedStatuses) {
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
                for(let username in uniqueListOfNewUsernamesNeededForIsVerifiedStatuses) {
                    usersAndTheirIsVerifiedStatuses[username] = false;
                }
            }
        }

        let usersAndTheirFullNames = {};
        const uniqueListOfNewUsernamesNeededForFullNames = [
            ...new Set(
                [
                    ...(usernamesTaggedInVidSlides.filter(username=> {
                        if (!(username in usersAndTheirRelevantInfo) || !('fullName' in
                        usersAndTheirRelevantInfo[username])) {
                            return username;
                        }
                    })),
                ]
            )
        ];
        try {
            const response2 = await fetch(
            'http://34.111.89.101/api/Home-Page/expressJSBackend1/getFullNamesOfMultipleUsers', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    usernames: uniqueListOfNewUsernamesNeededForFullNames
                })
            });
            if(!response2.ok) {
                console.error("The server had trouble fetching all the necessary fullNames");
                for(let username in uniqueListOfNewUsernamesNeededForFullNames) {
                    usersAndTheirFullNames[username] = '?';
                }
            }
            else {
                usersAndTheirFullNames = await response2.json();
            }
        }
        catch(error) {
            console.error(
                "There was trouble connecting to the server to fetch all the necessary fullNames"
            );
            for(let username in uniqueListOfNewUsernamesNeededForFullNames) {
                usersAndTheirFullNames[username] = '?';
            }
        }

        const uniqueListOfAllNewUsernames = [
                ...new Set(
                [
                    ...usernamesOfNewPostAuthors,
                    ...usernamesOfLikersFollowedByAuthUser,
                    ...usernamesTaggedInVidSlides
                ]
            )
        ];
        const newUsersAndTheirRelevantInfo = {...usersAndTheirRelevantInfo};
        for(let username of uniqueListOfAllNewUsernames) {
            if(!(username in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[username] = {};
            }
            if (username in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[username].profilePhoto = usersAndTheirProfilePhotos[username];
            }
            if (username in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[username].isVerified = usersAndTheirIsVerifiedStatuses[username];
            }
        }
        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }


    function fetchAdditionalPostsWhenUserScrollsToBottomOfPage() {
        if (additionalPostsFetchingErrorMessage.length==0 && !isCurrentlyFetchingAdditionalPosts &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight) {
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


    function incrementStoryLevel() {
        setCurrStoryLevel(currStoryLevel+1);
    }


    function decrementStoryLevel() {
        setCurrStoryLevel(currStoryLevel-1);
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


    function addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newFinishedUsername) {
        setUsernamesWhoseStoriesYouHaveFinished(new Set(
            [
                ...usernamesWhoseStoriesYouHaveFinished,
                newFinishedUsername
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
            for providing info for notifications of new post-likes and post-comments.`);
        });


        nodeJSWebSocketDotIO.on('NewLikeOfPost', async (data) => {
            const { likerId } = data;

            if (likerId == authUserId) {
                return;
            }

            let likerProfilePhoto = null;

            if (!(likerId in usersAndTheirRelevantInfo) ||
            !('profilePhoto' in usersAndTheirRelevantInfo[likerId])) {
                likerProfilePhoto = await getProfilePhotoOfUser(likerId);
            }

            const { overallPostId, likerName } = data;

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
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


        nodeJSWebSocketDotIO.on('NewCommentOfPost', async (data) => {
            const { commenterId } = data;
            if (authUserId == commenterId) {
                return;
            }

            let commenterProfilePhoto = null;

            if (!(commenterId in usersAndTheirRelevantInfo) ||
            !('profilePhoto' in usersAndTheirRelevantInfo[commenterId])) {
                commenterProfilePhoto = await getProfilePhotoOfUser(commenterId);
            }

            const { overallPostId, id, commenterName, comment } = data;

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
                    leftImage: commenterProfilePhoto !== null ? commenterProfilePhoto :
                    usersAndTheirRelevantInfo[commenterId]?.profilePhoto ?? defaultPfp,
                    rightImage: postPreviewImage !== null ? postPreviewImage :
                    postsAndTheirPreviewImgs[overallPostId] ?? defaultVideoFrame,
                    description: `@${commenterName} commented on your post: '${comment}'`,
                    leftImageLink: `http://34.111.89.101/profile/${commenterName}`,
                    entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${id}`
                }
            ]);
        });
    }


    function establishCollaborationWithCSharpSignalRWebSocket() {
        const cSharpSignalRWebSocket = new signalR.HubConnectionBuilder()
        .withUrl('http://34.111.89.101/socket/Home-Page/cSharpSignalRWebSocket', {
            withCredentials: true,
            accessTokenFactory: () => "",
            transport: signalR.HttpTransportType.WebSockets,
            headers: {
                "userId": authUserId.toString(),
                "updatesToSubscribeTo": JSON.stringify(['comment-likes', 'comment-replies'])
            }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();


        cSharpSignalRWebSocket.onclose((_) => {
            console.error(`There was trouble with the cSharpSignalRWebSocket connection, which is responsible
            for providing info for notifications of new comment-likes and comment-replies.`);
        });


        cSharpSignalRWebSocket.on('NewLikeOfComment', async (data) => {
            const { likerId } = data;

            if (likerId == authUserId) {
                return;
            }

            let likerProfilePhoto = null;

            if (!(likerId in usersAndTheirRelevantInfo) ||
            !('profilePhoto' in usersAndTheirRelevantInfo[likerId])) {
                likerProfilePhoto = await getProfilePhotoOfUser(likerId);
            }

            const { overallPostId, commentId, comment, likerName } = data;

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
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


        cSharpSignalRWebSocket.on('NewReplyOfComment', async (data) => {
            const { replierId } = data;

            if (replierId == authUserId) {
                return;
            }

            let replierProfilePhoto = null;

            if (!(replierId in usersAndTheirRelevantInfo) ||
            !('profilePhoto' in usersAndTheirRelevantInfo[replierId])) {
                replierProfilePhoto = await getProfilePhotoOfUser(replierId);
            }

            const { overallPostId, replyId, replierName, reply } = data;

            let postPreviewImage = null;

            if (!(overallPostId in postsAndTheirPreviewImgs)) {
                postPreviewImage = await getPreviewImageOfPost(overallPostId);
            }

            setOrderedListOfNotifications([
                ...orderedListOfNotifications,
                {
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


        cSharpSignalRWebSocket.start().catch(_ => {
            console.error(`There was trouble with the cSharpSignalRWebSocket connection, which is responsible
            for providing info for notifications of new comment-likes and comment-replies.`);
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
            for providing info for notifications of new followings/follow-requests.`);
        };


        phpRatchetWebSocket.onmessage = async (messageEvent) => {
            const parsedMessageData = JSON.parse(messageEvent.data);

            if (parsedMessageData.event === 'NewFollowRequest') {
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
                        leftImage: requesterProfilePhoto !== null ? requesterProfilePhoto :
                        usersAndTheirRelevantInfo[requesterId]?.profilePhoto ?? defaultPfp,
                        rightImage: null, 
                        description: `@${requesterName} requested to follow you`,
                        leftImageLink: `http://34.111.89.101/profile/${requesterName}`,
                        entireNotificationLink: `http://34.111.89.101/profile/${requesterName}`
                    }
                ]);
            } 
            else if (parsedMessageData.event === 'NewFollowing') {
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
                        leftImage: followerProfilePhoto !== null ? followerProfilePhoto :
                        usersAndTheirRelevantInfo[followerId]?.profilePhoto ?? defaultPfp,
                        rightImage: null, 
                        description: `@${followerName} is now following you`,
                        leftImageLink: `http://34.111.89.101/profile/${followerName}`,
                        entireNotificationLink: `http://34.111.89.101/profile/${followerName}`
                    }
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
            new messages.`);
        };


        pythonWebSocket.onmessage = async (messageEvent) => {
            const parsedMessageData = JSON.parse(messageEvent.data);

            if (parsedMessageData.event === 'NewMessageOfConvo') {
                const { senderId } = parsedMessageData.data;

                if (senderId == authUserId) {
                    return;
                }

                let senderProfilePhoto = null;

                if (!(senderId in usersAndTheirRelevantInfo) ||
                !('profilePhoto' in usersAndTheirRelevantInfo[senderId])) {
                    senderProfilePhoto = await getProfilePhotoOfUser(senderId);
                }

                const { convoId, convoTitle, isGroupChat, senderName, message } = parsedMessageData.data;

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
                        leftImage: senderProfilePhoto !== null ? senderProfilePhoto : 
                        usersAndTheirRelevantInfo[senderId]?.profilePhoto ?? defaultPfp,
                        rightImage: isGroupChat ? defaultGroupChatPfp : null, 
                        description: description,
                        leftImageLink: `http://34.111.89.101/profile/${senderId}`,
                        entireNotificationLink: `http://34.111.89.101/messages/${convoId}`
                    }
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


    return (
        <>
            {authUsername.length > 0 &&
                <>
                    <LeftSidebar 
                        profilePhoto={
                            (authUsername in usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[authUsername]) ?
                            usersAndTheirRelevantInfo[authUsername].profilePhoto : defaultPfp
                        }
                        displayPopup={displayLeftSidebarPopup}
                        authUserIsAnonymousGuest={authUserId == -1}
                        toggleDisplayPopup={toggleDisplayLeftSidebarPopup}
                    />

                    <div style={{marginTop:'2.3em', width:'50em', position: 'absolute', left: '24%'}}>
                        <div style={{display:'flex', justifyContent:'start', alignItems:'center', gap:'1em',
                        position: 'relative'}}>
                            {currStoryLevel > 0 &&
                                (
                                    <img className="leftArrow" onClick={decrementStoryLevel} src={backArrow}
                                    style={{height:'1em', width:'1em', objectFit:'contain', cursor:'pointer'}}/>
                                )
                            }
                            
                            {(fetchingStoriesIsComplete && currStoryLevel == 0) &&
                                (
                                    <UserIcon
                                        username={authUsername}
                                        authUsername={authUsername}
                                        inStoriesSection={true}
                                        userHasStories={
                                            (authUsername in usersAndTheirStories)
                                        }
                                        userHasUnseenStory={
                                            !(usernamesWhoseStoriesYouHaveFinished.has(authUsername))
                                        } 
                                        userPfp={
                                            (authUsername in usersAndTheirRelevantInfo) ?
                                            usersAndTheirRelevantInfo[authUsername].profilePhoto : defaultPfp
                                        }
                                        userIsVerified={
                                            (authUsername in usersAndTheirRelevantInfo) ?
                                            usersAndTheirRelevantInfo[authUsername].isVerified : false
                                        }
                                        showStoryViewer={showStoryViewer}
                                    />
                                )
                            }

                            {(fetchingStoriesIsComplete && storiesSectionErrorMessage.length==0) &&
                                (
                                orderedListOfUsernamesInStoriesSection
                                    .filter(username => username!==authUsername)
                                    .slice(
                                        currStoryLevel * 6,
                                        currStoryLevel * 6 + 6
                                    )
                                    .map((username) => (
                                        <UserIcon
                                            key={username}
                                            username={username} 
                                            inStoriesSection={true}
                                            userHasStories={true}
                                            userHasUnseenStory={
                                                !(usernamesWhoseStoriesYouHaveFinished.has(username))
                                            } 
                                            userPfp={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].profilePhoto : defaultPfp
                                            }
                                            userIsVerified={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].isVerified : false
                                            }
                                            showStoryViewer={showStoryViewer}
                                        />
                                    ))
                                )
                            }

                            {(fetchingStoriesIsComplete && storiesSectionErrorMessage.length>0) &&
                                (
                                    <p style={{marginLeft: '2em', width: '85%', color: 'gray',
                                    fontSize: '0.88em'}}>
                                        {storiesSectionErrorMessage}
                                    </p>
                                )
                            }

                            {!fetchingStoriesIsComplete &&
                                (
                                    <img src={loadingAnimation} style={{position: 'absolute', top: '50%',
                                    left: '50%', transform: 'translate(-50%, -50%)', height: '2em', width: '2em',
                                    objectFit: 'contain', pointerEvents: 'none'}}/>
                                )
                            }

                            {(currStoryLevel*6 + 5 < orderedListOfUsernamesInStoriesSection.length) &&
                                (
                                    <img className="rightArrow" onClick={incrementStoryLevel} src={rightArrow}
                                    style={{height:'1.5em', width:'1.5em', objectFit:'contain', cursor:'pointer'}}/>
                                )
                            }

                        </div>
                    
                        <div style={{display:'flex', flexDirection:'column', justifyContent:'center',
                        alignItems:'center', marginTop: '2em', gap:'3em', position: 'relative'}}>
                            {(fetchingInitialPostsIsComplete && initialPostsFetchingErrorMessage.length==0) &&
                                (
                                    orderedListOfPosts
                                    .map((postDetails) => (
                                        <MediaPost
                                            key={postDetails.overallPostId}
                                            postDetails={postDetails}
                                            authUsername={authUsername}
                                            mainPostAuthorInfo={
                                                (postDetails.authors[0] in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[postDetails.authors[0]] :
                                                {}
                                            }
                                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                            notifyParentToShowThreeDotsPopup={showThreeDotsPopup}
                                            notifyParentToShowCommentsPopup={showCommentsPopup}
                                            notifyParentToShowSendPostPopup={showSendPostPopup}
                                            notifyParentToShowLikersPopup={showLikersPopup}
                                            notifyParentToShowErrorPopup={showErrorPopup}
                                            notifyParentToUpdatePostDetails={updatePostDetails}
                                        />
                                    ))
                                )
                            }

                            {(fetchingInitialPostsIsComplete && initialPostsFetchingErrorMessage.length>0) &&
                                (
                                    <p style={{width: '85%', color: 'gray', fontSize: '0.88em',
                                    marginTop: '7em'}}>
                                        {initialPostsFetchingErrorMessage}
                                    </p>
                                )
                            }

                            {(!isCurrentlyFetchingAdditionalPosts &&
                            additionalPostsFetchingErrorMessage.length>0) &&
                                (
                                    <p style={{width: '85%', color: 'gray', fontSize: '0.88em',
                                    marginTop: '3.75em'}}>
                                        {additionalPostsFetchingErrorMessage}
                                    </p>
                                )
                            } 

                            {isCurrentlyFetchingAdditionalPosts &&
                                (
                                    <img src={loadingAnimation} style={{height: '2em', width: '2em',
                                    objectFit: 'contain', pointerEvents: 'none', marginTop: '3.75em'}}/>
                                )
                            }
                        </div>
                        
                        {!fetchingInitialPostsIsComplete &&
                            (
                                <img src={loadingAnimation} style={{position: 'absolute', top: '50%',
                                left: '50%', transform: 'translate(-50%, -50%)', height: '2em', width: '2em',
                                objectFit: 'contain', pointerEvents: 'none'}}/>
                            )
                        }
                    </div>
                    
                    <div id="rightmostSection" style={{display:'flex', flexDirection:'column', alignItems: 'start',
                    position: 'absolute', right:'0%', marginTop:'4em', width: '25em'}}>
                        <UserBar
                            username={authUsername}
                            authUsername={authUsername}
                            isPrivate={'?'}
                            numFollowers={'?'}
                            numFollowing={'?'} 
                            numPosts={'?'}
                            fullName={
                                (authUsername in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUsername].fullName : '?'
                            }
                            profilePhoto={
                                (authUsername in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUsername].profilePhoto : defaultPfp
                            }
                            isVerified={
                                (authUsername in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUsername].isVerified : false
                            }
                            notifyParentToShowErrorPopup={showErrorPopup}
                        />
                    

                        <b style={{color:'gray', fontSize:'0.9em', marginBottom: '-1.5em'}}>
                            Suggested for you
                        </b>
                        
                        <br/>
                        <br/>
                        <br/>

                        {(fetchingSuggestedAccountsIsComplete && suggestedAccountsSectionErrorMessage.length==0) &&
                            (
                                orderedListOfUsernamesOfSuggestedAccounts
                                .map((username) => (
                                    <UserBar
                                        key={username}
                                        username={username}
                                        authUsername={authUsername}
                                        isPrivate={
                                            (username in usersAndTheirRelevantInfo &&
                                            'isPrivate' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].isPrivate : '?'
                                        }
                                        numFollowers={
                                            (username in usersAndTheirRelevantInfo &&
                                            'numFollowers' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].numFollowers : '?'
                                        }
                                        numFollowing={
                                            (username in usersAndTheirRelevantInfo &&
                                            'numFollowing' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].numFollowing : '?'
                                        }
                                        numPosts={
                                            (username in usersAndTheirRelevantInfo &&
                                            'numPosts' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].numPosts : '?'
                                        }
                                        fullName={
                                            (username in usersAndTheirRelevantInfo &&
                                            'fullName' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].fullName : '?'
                                        }
                                        profilePhoto={
                                            (username in usersAndTheirRelevantInfo &&
                                            'profilePhoto' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].profilePhoto : defaultPfp
                                        }
                                        isVerified={
                                            (username in usersAndTheirRelevantInfo &&
                                            'isVerified' in usersAndTheirRelevantInfo[username]) ?
                                            usersAndTheirRelevantInfo[username].isVerified : false
                                        }
                                        notifyParentToShowErrorPopup={showErrorPopup}
                                    />
                                ))
                            )
                        }

                        {(fetchingSuggestedAccountsIsComplete && suggestedAccountsSectionErrorMessage.length>0) &&
                            (
                                <p style={{width: '85%', color: 'gray', fontSize: '0.88em'}}>
                                    {suggestedAccountsSectionErrorMessage}
                                </p>
                            )
                        }

                        {!fetchingSuggestedAccountsIsComplete &&
                            (
                                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center',
                                width: '75%'}}>
                                    <img src={loadingAnimation} style={{height: '2em', width: '2em',
                                    objectFit: 'contain', pointerEvents: 'none'}}/>
                                </div>
                            )
                        }

                        <br/>

                        <Footer/>
                    </div>

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
                                usernamesWhoseStoriesYouHaveFinished={usernamesWhoseStoriesYouHaveFinished}
                                updateUsersAndTheirStories={updateUsersAndTheirStories}
                                updateUsersAndTheirStoryPreviews={updateUsersAndTheirStoryPreviews}
                                updateUsersAndYourCurrSlideInTheirStories={updateUsersAndYourCurrSlideInTheirStories}
                                updateVidStoriesAndTheirPreviewImages={updateVidStoriesAndTheirPreviewImages}
                                addUsernameToSetOfUsersWhoseStoriesYouHaveFinished={
                                    addUsernameToSetOfUsersWhoseStoriesYouHaveFinished
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
            }
        </>
    );
}

export default HomePage;