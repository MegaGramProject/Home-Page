import AboutAccountPopup from '../components/Popups/AboutAccountPopup';
import CommentsPopup from '../components/Popups/commentsPopup';
import ErrorPopup from '../components/Popups/ErrorPopup';
import LeftSidebarPopup from '../components/Popups/LeftSidebarPopup';
import LikersPopup from '../components/Popups/likersPopup';
import SendPostPopup from '../components/Popups/sendPostPopup';
import ThreeDotsPopup from '../components/Popups/ThreeDotsPopup';

import Footer from '../components/Footer';
import LeftSidebar from '../components/LeftSidebar';
import MediaPost from '../components/mediaPost';
import StoryViewer from '../components/storyViewer';
import UserBar from '../components/userBar';
import UserIcon from '../components/UserIcon';

import backArrow from "../assets/images/backArrow.png";
import blackScreen from "../assets/images/blackScreen.png";
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import rightArrow from "../assets/images/nextArrow.png";

import '../HomePageStyles.css';

import { useEffect, useState } from 'react';


function HomePage({urlParams}) {
    const [authUser, setAuthUser] = useState('');
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
    const [storyViewerIsFromStoriesSection, setStoryViewerIsFromStoriesSection] = useState(false);
    const [storyViewerUsername, setStoryViewerUsername] = useState('');

    const [displayCommentsPopup, setDisplayCommentsPopup] = useState(false);
    const [commentsPopupPostDetails, setCommentsPopupPostDetails] = useState({});
    const [commentsPopupCurrSlide, setCommentsPopupCurrSlide] = useState(0);
    const [commentsPopupMainPostAuthorInfo, setCommentsPopupMainPostAuthorInfo] = useState();

    const [orderedListOfPosts, setOrderedListOfPosts] = useState([]);

    const [usersAndTheirRelevantInfo, setUsersAndTheirRelevantInfo] = useState({});
    const [usersAndTheirStories, setUsersAndTheirStories] = useState({});

    const [displaySendPostPopup, setDisplaySendPostPopup] = useState(false);
    const [sendPostPopupOverallPostId, setSendPostPopupOverallPostId] = useState('');
    const [displayLikersPopup, setDisplayLikersPopup] = useState(false);
    const [likersPopupIdOfPostOrComment, setLikersPopupIdOfPostOrComment] = useState('');
    const [likersPopupPostOrCommentText, setLikersPopupPostOrCommentText] = useState('');
    const [currStoryLevel, setCurrStoryLevel] = useState(0);
    const [displayLeftSidebarPopup, setDisplayLeftSidebarPopup] = useState(false);
    const [usersAndYourCurrSlideInTheirStories, setUsersAndYourCurrSlideInTheirStories] = useState({});
    const [orderedListOfUsernamesInStoriesSection, setOrderedListOfUsernamesInStoriesSection] = useState([]);
    const [fetchingStoriesIsComplete, setFetchingStoriesIsComplete] = useState(false);
    const [fetchingSuggestedAccountsIsComplete, setFetchingSuggestedAccountsIsComplete] = useState(false);
    const [fetchingInitialPostsIsComplete, setFetchingInitialPostsIsComplete] = useState(false);
    const [storiesSectionErrorMessage, setStoriesSectionErrorMessage] = useState('');
    const [orderedListOfUsernamesOfSuggestedAccounts, setOrderedListOfUsernamesOfSuggestedAccounts] = useState([]);
    const [suggestedAccountsSectionErrorMessage, setSuggestedAccountsSectionErrorMessage] = useState('');
    const [initialPostsFetchingErrorMessage, setInitialPostsFetchingErrorMessage] = useState('');
    const [isCurrentlyFetchingAdditionalPosts, setIsCurrentlyFetchingAdditionalPosts] = useState(false);
    const [additionalPostsFetchingErrorMessage, setAdditionalPostsFetchingErrorMessage] = useState('');
    const [usernamesWhoseStoriesYouHaveFinished, setUsernamesWhoseStoriesYouHaveFinished] = useState(new Set());
    const [idsOfStoriesMarkedAsViewed, setIdsOfStoriesMarkedAsViewed] = useState(new Set());


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
            setAuthUser('Anonymous Guest');
        }

        if(urlParams && localStorage.getItem('defaultUsername') !== urlParams.username) {
            authenticateUser(urlParams.username, null);
        }
        else if(localStorage.getItem('defaultUsername')) {
            if (localStorage.getItem('defaultUsername') === 'Anonymous Guest') {
                setAuthUser('Anonymous Guest');
            }
            else {
                authenticateUser(
                    localStorage.getItem('defaultUsername'),
                    localStorage.getItem('defaultUserId')
                );
            }
        }
        else {
            setAuthUser('Anonymous Guest');
        }
    }, []);


    useEffect(() => {
        if (authUser.length > 0) {
            localStorage.setItem('defaultUsername', authUser);
            fetchStories();
            fetchSuggestedAccounts();
            fetchPosts('initial');
        }
    }, [authUser]);


    useEffect(() => {
        localStorage.setItem('defaultUserId', authUserId);
    }, [authUserId]);


    useEffect(() => {
        if (fetchingStoriesIsComplete && fetchingSuggestedAccountsIsComplete && fetchingInitialPostsIsComplete) {
            fetchAllTheNecessaryUserInfo();
        }
    }, [fetchingStoriesIsComplete, fetchingSuggestedAccountsIsComplete, fetchingInitialPostsIsComplete]);
       

    function showThreeDotsPopupForPost(newThreeDotsPopupPostDetails) {
        setThreeDotsPopupPostDetails(newThreeDotsPopupPostDetails);
        setDisplayThreeDotsPopup(true);
    }


    function showCommentsPopup(postDetails, currSlide, mainPostAuthorInfo) {
        setCommentsPopupPostDetails(postDetails);
        setCommentsPopupCurrSlide(currSlide);
        setCommentsPopupMainPostAuthorInfo(mainPostAuthorInfo);
        setDisplayCommentsPopup(true);
    }


    function hideCommentsPopup() {
        setDisplayCommentsPopup(false);
    }


    function showSendPostPopup(newSendPostPopupOverallPostId) {
        setSendPostPopupOverallPostId(newSendPostPopupOverallPostId);
        setDisplaySendPostPopup(true);
    };


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
                    })
                });
                if (!response.ok) {
                    setAuthUser('Anonymous Guest');

                    throw new (
                        `The laravelBackend1 server had trouble getting the user-id of username ${username}`
                    );
                }
                userId = await response.json();
                setAuthUserId(userId);
            }
            catch {
                setAuthUser('Anonymous Guest');

                throw new Error(
                    `There was trouble connecting to the laravelBackend1 server to get the user-id of username
                    ${username}`
                );
            }
        }

        try {
            const response1 = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser
            /${userId}`, {
                credentials: 'include'
            });
            if (!response1.ok) {
                setAuthUser('Anonymous Guest');

                throw new Error(
                    `The expressJSBackend1 server had trouble verifying you as having the proper credentials to be 
                    logged in as user ${userId}`
                );
            }

            setAuthUser(username);
            setAuthUserId(userId);
        }
        catch {
            setAuthUser('Anonymous Guest');

            throw new Error(
                `There was trouble connecting to the expressJSBackend1 server to verify you as having the proper
                credentials to be logged in as user ${userId}`
            );
        }
    }


    async function fetchStories() {
        if (authUser !== 'Anonymous Guest') {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOwnUnexpiredStories/${authUser}`, {
                    credentials: 'include'
                });
                if(!response.ok) {
                    console.error('The server could not find an unexpired story of yours.');
                }
                else {
                    const ownUnexpiredStoryData = await response.json();
                    const newUsersAndTheirStories = {};
                    const newUsersAndYourCurrSlideInTheirStories = {};
                    
                    newUsersAndTheirStories[authUser] = ownUnexpiredStoryData.stories;
                    
                    if (ownUnexpiredStoryData.currSlide==='finished') {
                        newUsersAndYourCurrSlideInTheirStories[authUser] = 0;
                        setUsernamesWhoseStoriesYouHaveFinished(new Set([authUser]));
                    }
                    else {
                        newUsersAndYourCurrSlideInTheirStories[authUser] = ownUnexpiredStoryData.currSlide;
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
            ${authUser}`, {
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
                `http://34.111.89.101/api/Home-Page/djangoBackend2/getSuggestedAccountsForUser/${authUser}`, {
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
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getBatchOfPostsForUserFeed/${authUser}`, {
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
        if (authUser !== 'Anonymous Guest') {
            usernamesNeededForProfilePhotos.push(authUser);
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
        if (authUser !== 'Anonymous Guest') {
            usernamesNeededForIsVerifiedStatuses.push(authUser);
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
        if (authUser !== 'Anonymous Guest') {
            usernamesNeededForFullNames.push(authUser);
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
        if (authUser !== 'Anonymous Guest') {
            uniqueSetOfAllUsernames.add(authUser);
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


    function showLikersPopup(postOrCommentText, likersPopupIdOfPostOrComment) {
        setLikersPopupPostOrCommentText(postOrCommentText);
        setLikersPopupIdOfPostOrComment(likersPopupIdOfPostOrComment);
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


    function showStoryViewer(newStoryViewerUsername, newStoryViewerIsFromStoriesSection) {
        setStoryViewerUsername(newStoryViewerUsername);
        setStoryViewerIsFromStoriesSection(newStoryViewerIsFromStoriesSection);
        setDisplayStoryViewer(true);
    }


    function closeStoryViewer() {
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


    function updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories) {
        setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
    }


    function addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newUsername) {
        setUsernamesWhoseStoriesYouHaveFinished(new Set(
            [
                ...usernamesWhoseStoriesYouHaveFinished,
                newUsername
            ]
        ));
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
            {authUser.length>0 &&
                <>
                    <LeftSidebar 
                        profilePhoto={
                            (authUser in usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[authUser]) ?
                            usersAndTheirRelevantInfo[authUser].profilePhoto : defaultPfp
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
                                        username={authUser}
                                        authUser={authUser}
                                        inStoriesSection={true}
                                        userHasStories={
                                            (authUser in usersAndTheirStories)
                                        }
                                        userHasUnseenStory={
                                            !(usernamesWhoseStoriesYouHaveFinished.has(authUser))
                                        } 
                                        userPfp={
                                            (authUser in usersAndTheirRelevantInfo) ?
                                            usersAndTheirRelevantInfo[authUser].profilePhoto : defaultPfp
                                        }
                                        userIsVerified={
                                            (authUser in usersAndTheirRelevantInfo) ?
                                            usersAndTheirRelevantInfo[authUser].isVerified : false
                                        }
                                        showStoryViewer={showStoryViewer}
                                    />
                                )
                            }

                            {(fetchingStoriesIsComplete && storiesSectionErrorMessage.length==0) &&
                                (
                                orderedListOfUsernamesInStoriesSection
                                    .filter(username => username!==authUser)
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
                                            authUser={authUser}
                                            mainPostAuthorInfo={
                                                (postDetails.authors[0] in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[postDetails.authors[0]] :
                                                {}
                                            }
                                            usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                            notifyParentToShowThreeDotsPopup={showThreeDotsPopupForPost}
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
                            username={authUser}
                            authUser={authUser}
                            isPrivate={'?'}
                            numFollowers={'?'}
                            numFollowing={'?'} 
                            numPosts={'?'}
                            fullName={
                                (authUser in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUser].fullName : '?'
                            }
                            profilePhoto={
                                (authUser in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUser].profilePhoto : defaultPfp
                            }
                            isVerified={
                                (authUser in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUser].isVerified : false
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
                                        authUser={authUser}
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

                    {(displayThreeDotsPopup || displayCommentsPopup ||  displaySendPostPopup || 
                    displayLikersPopup || displayAboutAccountPopup || displayLeftSidebarPopup ||
                    displayErrorPopup)
                    && (
                            <img onClick={closeAllPopups} src={blackScreen} style={{position: 'fixed', 
                            top: '0%', left: '0%', width: '100%', height: '100%', opacity: '0.7', 
                            zIndex: '2'}}/>
                        )
                    }

                    {displayStoryViewer &&
                        (
                            <StoryViewer
                                username={storyViewerUsername}
                                authUser={authUser}
                                notifyParentToCloseStoryViewer={closeStoryViewer}
                                usersAndTheirStories={usersAndTheirStories}
                                usersAndYourCurrSlideInTheirStories={usersAndYourCurrSlideInTheirStories}
                                orderedListOfUsernamesInStoriesSection={orderedListOfUsernamesInStoriesSection}
                                isFromStoriesSection={storyViewerIsFromStoriesSection}
                                usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                notifyParentToShowErrorPopup={showErrorPopup}
                                notifyParentToUpdateUsersAndTheirStories={updateUsersAndTheirStories}
                                notifyParentToUpdateUsersAndYourCurrSlideInTheirStories={
                                    updateUsersAndYourCurrSlideInTheirStories
                                }
                                usernamesWhoseStoriesYouHaveFinished={usernamesWhoseStoriesYouHaveFinished}
                                notifyParentToAddUsernameToSetOfUsersWhoseStoriesYouHaveFinished={
                                    addUsernameToSetOfUsersWhoseStoriesYouHaveFinished
                                }
                                idsOfStoriesMarkedAsViewed={idsOfStoriesMarkedAsViewed}
                                notifyParentToAddStoryIdToSetOfViewedStoryIds={
                                    addStoryIdToSetOfViewedStoryIds
                                }
                                zIndex={
                                    displayErrorPopup ? '1' : '3'
                                }
                            />
                        )
                    }

                    {displayCommentsPopup &&
                        (
                            <CommentsPopup
                                authUser={authUser} 
                                postDetails={commentsPopupPostDetails}
                                currSlide={commentsPopupCurrSlide}
                                notifyParentToClosePopup={hideCommentsPopup}
                                usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                mainPostAuthorInfo={commentsPopupMainPostAuthorInfo}
                                notifyParentToShowSendPostPopup={showSendPostPopup}
                                notifyParentToUpdatePostDetails={updatePostDetails}
                                notifyParentToShowErrorPopup={showErrorPopup}
                                notifyParentToShowThreeDotsPopup={showThreeDotsPopupForPost}
                                notifyParentToShowLikersPopup={showLikersPopup}
                                notifyParentToUpdateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                                zIndex={
                                    (displayThreeDotsPopup ||  displaySendPostPopup || displayLikersPopup ||
                                    displayAboutAccountPopup || displayErrorPopup) ? 
                                    '1' : '3'
                                }
                            />
                        )
                    }

                    {displayLeftSidebarPopup &&
                        (
                            <div style={{position: 'fixed', bottom: '10%', left: '1%', zIndex: displayErrorPopup ? '1'
                            : '3'}}>
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
                            zIndex: displayErrorPopup ? '1': '3'}}>
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
                            zIndex: displayErrorPopup ? '1': '3'}}>
                                <SendPostPopup
                                    authUser={authUser}
                                    overallPostId={sendPostPopupOverallPostId}
                                    usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                    notifyParentToUpdateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                                    notifyParentToShowErrorPopup={showErrorPopup}
                                    notifyParentToClosePopup={closeSendPostPopup}
                                />
                            </div>
                        )
                    }

                    {displayLikersPopup &&
                        (
                            <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: displayErrorPopup ? '1': '3'}}>
                                <LikersPopup
                                    authUser={authUser}
                                    idOfPostOrComment={likersPopupIdOfPostOrComment}
                                    usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                    postOrCommentText={likersPopupPostOrCommentText}
                                    notifyParentToUpdateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                                    notifyParentToClosePopup={closeLikersPopup}
                                    notifyParentToShowErrorPopup={showErrorPopup}
                                />
                            </div>
                        )
                    }

                    {displayAboutAccountPopup &&
                        (
                            <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: displayStoryViewer ? '1' : '3'}}>
                                <AboutAccountPopup
                                    authUserId={authUserId}
                                    userId={aboutAccountUserId}
                                    username={aboutAccountUsername}
                                    authUser={authUser}
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

                    {displayErrorPopup &&
                        (
                            <div style={{position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)', zIndex: '3'}}>
                                <ErrorPopup
                                    errorMessage={errorPopupMessage}
                                    closePopup={closeErrorPopup}
                                />
                            </div>
                        )
                    }
                </>
            }
        </>
    );
}

export default HomePage;