import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import AboutAccountPopup from '../components/aboutAccountPopup';
import CommentsPopup from '../components/commentsPopup';
import ErrorPopup from '../components/errorPopup';
import Footer from "../components/footer";
import LeftSidebar from "../components/leftSidebar";
import LeftSidebarPopup from '../components/leftSidebarPopup';
import LikersPopup from '../components/likersPopup';
import MediaPost from "../components/mediaPost";
import SendPostPopup from '../components/sendPostPopup';
import StoryViewer from '../components/storyViewer';
import ThreeDotsPopup from '../components/threeDotsPopup';
import UserBar from "../components/userBar";
import UserIcon from "../components/userIcon";

import backArrow from "../assets/images/backArrow.png";
import blackScreen from "../assets/images/blackScreen.png";
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import rightArrow from "../assets/images/nextArrow.png";
//import videoPost from '../assets/misc/videoPost.mp4';
import dogVid from '../assets/misc/dogVid.mp4';
import scenicRoad from '../assets/images/scenicRoad.jpg';

import '../styles.css';

function MainPage({urlParams}) {
    const [authUser, setAuthUser] = useState('rishavry');
    const [displayThreeDotsPopup, setDisplayThreeDotsPopup] = useState(false);
    const [threeDotsPopupPostDetails, setThreeDotsPopupPostDetails] = useState(null);
    const [displayCommentsPopup, setDisplayCommentsPopup] = useState(false);
    const [commentsPopupPostDetails, setCommentsPopupPostDetails] = useState(null);
    const [commentsPopupCurrSlide, setCommentsPopupCurrSlide] = useState(0);
    const [displaySendPostPopup, setDisplaySendPostPopup] = useState(false);
    const [displayLikersPopup, setDisplayLikersPopup] = useState(false);
    const [likersPopupIdOfPostOrComment, setLikersPopupIdOfPostOrComment] = useState('');
    const [currStoryLevel, setCurrStoryLevel] = useState(0);
    const [displayAboutAccountPopup, setDisplayAboutAccountPopup] = useState(false);
    const [aboutAccountUsername, setAboutAccountUsername] = useState('');
    const [aboutAccountUserIsVerified, setAboutAccountUserIsVerified] = useState(false);
    const [aboutAccountUserHasStories, setAboutAccountUserHasStories] = useState(false);
    const [aboutAccountUserHasUnseenStory, setAboutAccountUserHasUnseenStory] = useState(false);
    const [displayLeftSidebarPopup, setDisplayLeftSidebarPopup] = useState(false);
    const [displayErrorPopup, setDisplayErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');
    const [usersAndTheirStories, setUsersAndTheirStories] = useState({});
    const [usersAndYourCurrSlideInTheirStories, setUsersAndYourCurrSlideInTheirStories] = useState({
        'rishavry': 0
    });
    const [orderedListOfUsernamesInStoriesSection, setOrderedListOfUsernamesInStoriesSection] = useState([
        'rishavry',
        'rishavry2',
        'rishavry3',
        'rishavry4',
        'rishavry5',
        'rishavry6',
        'rishavry7',
        'rishavry8'
    ]);
    const [fetchingStoriesIsComplete, setFetchingStoriesIsComplete] = useState(false);
    const [fetchingSuggestedAccountsIsComplete, setFetchingSuggestedAccountsIsComplete] = useState(false);
    const [fetchingInitialPostsIsComplete, setFetchingInitialPostsIsComplete] = useState(false);
    const [usersAndTheirRelevantInfo, setUsersAndTheirRelevantInfo] = useState({});
    const [storiesSectionErrorMessage, setStoriesSectionErrorMessage] = useState('');
    const [orderedListOfUsernamesOfSuggestedAccounts, setOrderedListOfUsernamesOfSuggestedAccounts] = useState([]);
    const [suggestedAccountsSectionErrorMessage, setSuggestedAccountsSectionErrorMessage] = useState('');
    const [orderedListOfPosts, setOrderedListOfPosts] = useState([
        /*
        {
            overallPostId: '593e4353-22d5-47fd-a9e2-510a46c655b0',
            authors: ['rishavry2', 'rishavry4', 'rishavry5'],
            datetimeOfPost: "2025-01-24T13:49:00",
            locationOfPost: "Virginia Beach, Virginia USA",
            backgroundMusic: {
                songTitle: "Torn",
                songArtist: "Natalie Imbruglia",
                src: torn
            },
            slides: [
                {
                    type: 'Image',
                    src: scenicRoad,
                    taggedAccounts: [
                        ['saquon', 50, 20],
                        ['jb', 66, 69]
                    ]
                },
                {
                    type: 'Image',
                    src: scenicNature,
                    taggedAccounts: []
                },
                {
                    type: 'Video',
                    src: vidPost,
                    subtitles: [
                        {
                            langCode: 'en',
                            src: subtitles1,
                            default: true
                        },

                        {
                            langCode: 'es',
                            src: subtitles2
                        },

                        {
                            langCode: 'de',
                            src: subtitles3
                        }
                    ],
                    sections: [
                        [0, 'intro'],
                        [1000, 'middle'],
                        [2000, 'ending']
                    ],
                    taggedAccounts: [
                        ['rishavry6', 'Following'],
                        ['rishavry7', 'Follow']
                    ]
                },
            ],
            isLiked: false,
            isSaved: false,
            numLikes: 15565,
            likersFollowedByAuthUser: ['rishavry5', 'rishavry6'],
            numComments: 57,
            caption: {
                content: `Life\'s good when you bounce back from adversity and actively seek out whatever enriches
                your soul! Me and @rishavry3 can testify to that! #fyp #blessed`,
                datetime: "2025-01-24T13:49:00",
                isEdited: false
            },
            adInfo: {
                callToAction: 'fly here in 2 days!',
                link: 'https://google.com'
            },   
        }
        */
    ]);
    const [initialPostsFetchingErrorMessage, setInitialPostsFetchingErrorMessage] = useState('');
    const [sendPostPopupOverallPostId, setSendPostPopupOverallPostId] = useState(null);
    const [isCurrentlyFetchingAdditionalPosts, setIsCurrentlyFetchingAdditionalPosts] = useState(false);
    const [additionalPostsFetchingErrorMessage, setAdditionalPostsFetchingErrorMessage] = useState('');
    const [commentsPopupMainPostAuthorInfo, setCommentsPopupMainPostAuthorInfo] = useState({});
    const [likersPopupPostOrCommentText, setLikersPopupPostOrCommentText] = useState('');
    const [displayStoryViewer, setDisplayStoryViewer] = useState(false);
    const [storyViewerIsFromStoriesSection, setStoryViewerIsFromStoriesSection] = useState(false);
    const [storyViewerUsername, setStoryViewerUsername] = useState('');
    const [usernamesWhoseStoriesYouHaveFinished, setUsernamesWhoseStoriesYouHaveFinished] = useState(new Set());
    const [idsOfStoriesMarkedAsViewed, setIdsOfStoriesMarkedAsViewed] = useState(new Set());
    const [originalURL, setOriginalURL] = useState('');

    useEffect(() => {
        document.title = "Megagram";
        setOriginalURL(window.location.href);
        return;
        
        if(urlParams) {
            authenticateUser(urlParams.username);
        }
        else {
            if(localStorage.getItem("defaultAuthUser")!==null) {
                authenticateUser(localStorage.getItem("defaultAuthUser"));
            }
            else {
                window.location.href = "http://34.111.89.101/login"
            }
        }
    }, []);

    useEffect(() => {
        if (authUser.length > 0) { //this condition is met after user-authentication
            fetchStories();
            fetchSuggestedAccounts();
            fetchPosts('initial');
        }
    }, [authUser]);

    useEffect(() => {
        if (fetchingStoriesIsComplete && fetchingSuggestedAccountsIsComplete && fetchingInitialPostsIsComplete) {
            return;
            fetchAllTheNecessaryUserInfo();
        }
    }, [fetchingStoriesIsComplete, fetchingSuggestedAccountsIsComplete, fetchingInitialPostsIsComplete]);
       

    function showThreeDotsPopupForPost(newThreeDotsPopupPostDetails) {
        setThreeDotsPopupPostDetails(newThreeDotsPopupPostDetails);
        setDisplayThreeDotsPopup(true);
    }

    function showCommentsPopup(postDetails, currSlide, mainPostAuthorInfo) {
        setCommentsPopupPostDetails(postDetails);
        setCommentsPopupMainPostAuthorInfo(mainPostAuthorInfo);
        setCommentsPopupCurrSlide(currSlide);
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

    function hidePost(overallPostId) {
        const newOrderedListOfPosts = orderedListOfPosts.filter(
            postDetails => (postDetails.overallPostId !== overallPostId)
        );
        setOrderedListOfPosts(newOrderedListOfPosts);

        setDisplayThreeDotsPopup(false);
        setDisplayCommentsPopup(false);
    }

    
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

    async function fetchStories() {
        /*
            (disclaimers -> 
                stories expire after 1 yr instead of 24h;
                Users can post a max of 10 unexpired stories at a time.
            )
        */
        setUsersAndTheirStories({
            'rishavry': [
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
                },
            ]
        });
        setUsersAndYourCurrSlideInTheirStories({
            'rishavry': 0
        });
        setOrderedListOfUsernamesInStoriesSection([
            authUser,
            'rishavry2',
            'rishavry3',
            'rishavry4',
            'rishavry5',
            'rishavry6',
            'rishavry7',
            'rishavry8'
        ]);
        setFetchingStoriesIsComplete(true);
        return;

        const newUsersAndTheirStories = {};
        const newUsersAndYourCurrSlideInTheirStories = {};
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOwnUnexpiredStories/${authUser}}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                console.error('The server could not find an unexpired story of yours.');
            }
            else {
                const ownUnexpiredStoryData = await response.json();
                newUsersAndTheirStories[authUser] = ownUnexpiredStoryData.stories;
                
                if (ownUnexpiredStoryData.currSlide==='finished') {
                    newUsersAndYourCurrSlideInTheirStories[authUser] = 0;
                    setUsernamesWhoseStoriesYouHaveFinished(new Set(
                        [
                            authUser
                        ]
                    ));

                }
                else {
                    newUsersAndYourCurrSlideInTheirStories[authUser] = ownUnexpiredStoryData.currSlide;
                }
            }
        }
        catch (error) {
            console.error('There was trouble connecting to the server to find an unexpired story of yours');
        }

        let newOrderedListOfUsernamesInStoriesSection = [];
        try {
            const response1 = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOrderedListOfUsernamesInStoriesSection/
            ${authUser}`, {
                credentials: 'include'
            });
            if(!response1.ok) {
                setStoriesSectionErrorMessage('The server could not retrieve the stories for this section.');
            }
            newOrderedListOfUsernamesInStoriesSection = await response1.json();
        }
        catch (error) {
            setStoriesSectionErrorMessage(
                'There was trouble connecting to the server to retrieve the stories for this section.'
            );
        }
        finally {
            setUsersAndTheirStories(newUsersAndTheirStories);
            setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);
            setOrderedListOfUsernamesInStoriesSection(newOrderedListOfUsernamesInStoriesSection);
            setFetchingStoriesIsComplete(true);
        }
    }

    async function fetchSuggestedAccounts() {
        /*
            Out of all the accounts that the user doesn't follow and doesn't block and isn't blocked by,
            add the ones that the user has a lot of its following follow. Order each of the accounts in
            descending order of that. Limit: 5. This ordered list will be orderedListOfUsernamesOfSuggestedAccounts.
        */
        return;
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
        setFetchingInitialPostsIsComplete(true);
        setIsCurrentlyFetchingAdditionalPosts(false);
        return;

        const isInitialFetch = initialOrAdditionalText==='initial';
        let fetchError = false;
        let listOfNewPostsForFeed = [];
        /*
            Out of all the posts that the user hasn't viewed yet that are made by people that the user follows,
            find the ones that the user has the most engagement(likes, comments, shares, etc) with on average per post.
            Order all the posts in the feed in descending order based on that(i.e topmost posts are made by users
            whose posts have garnered the most engagement/views/likes/comments, etc.). Fetch in batches of 4.
            This ordered list will be orderedListOfPosts(i.e each batch of 4 will be appended to this orderedList).
            In the middle of each batch of 4 will be an advertisement-post if applicable.
        */
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
        const usernamesOfAllPostAuthors = [];
        const usernamesOfAllMainPostAuthors = [];
        const usernamesOfLikersFollowedByAuthUser = [];
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
        const uniqueListOfUsernamesNeededForProfilePhotos =
        [
            ...new Set([
                    authUser,
                    ...orderedListOfUsernamesInStoriesSection,
                    ...orderedListOfUsernamesOfSuggestedAccounts,
                    ...usernamesOfAllMainPostAuthors,
                    ...usernamesTaggedInVidSlides
                ]
            )
        ];
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
        
        let usersAndTheirIsVerifiedStatuses = {};
        const uniqueListOfAllUsernames =
        [
            ...new Set([
                    authUser,
                    ...orderedListOfUsernamesInStoriesSection,
                    ...orderedListOfUsernamesOfSuggestedAccounts,
                    ...usernamesOfAllPostAuthors,
                    ...usernamesTaggedInVidSlides,
                    ...usernamesOfLikersFollowedByAuthUser
                ]
            )
        ];
        try {
            const response1 = await fetch(
            'http://34.111.89.101/api/Home-Page/expressJSBackend1/getIsVerifiedStatusesOfMultipleUsers', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    usernames: uniqueListOfAllUsernames
                })
            });
            if(!response1.ok) {
                console.error("The server had trouble fetching all the necessary isVerified statuses");
                for(let username in uniqueListOfAllUsernames) {
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
            for(let username in uniqueListOfAllUsernames) {
                usersAndTheirIsVerifiedStatuses[username] = false;
            }
        }

        let usersAndTheirFullNames = {};
        const uniqueListOfUsernamesNeededForFullNames = [
            ...new Set(
                [
                    authUser,
                    ...orderedListOfUsernamesOfSuggestedAccounts,
                    ...usernamesTaggedInVidSlides
                ]
            )
        ];
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

        let usersAndTheirIsPrivateStatuses = {};
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

        let usersAndTheirNumPostsFollowersAndFollowings = {};
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

        let usersAndTheirHasStoriesAndUnseenStoryStatuses = {};
        const uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses = [
            ...new Set(
                [
                    ...usernamesOfAllMainPostAuthors
                ]
            )
        ]; 
        try {
            const response5 = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/
            getHasStoriesAndUnseenStoryStatusesOfMultipleUsers`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    usernames: uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses
                })
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

        const newUsersAndTheirRelevantInfo = {};
        for(let username of uniqueListOfAllUsernames) {
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

    function closeLikersPopup () {
        setDisplayLikersPopup(false);
    }

    function showLikersPopup(postOrCommentText, likersPopupIdOfPostOrComment) {
        setLikersPopupPostOrCommentText(postOrCommentText);
        setLikersPopupIdOfPostOrComment(likersPopupIdOfPostOrComment);
        setDisplayLikersPopup(true);
    }

    function incrementStoryLevel() {
        setCurrStoryLevel(currStoryLevel+1);
    }

    function decrementStoryLevel() {
        setCurrStoryLevel(currStoryLevel-1);
    }

    function showAboutAccountPopup(overallPostId) {
        setDisplayAboutAccountPopup(true);

        for(let postDetails of orderedListOfPosts) {
            if (postDetails.overallPostId===overallPostId) {
                setAboutAccountUsername(postDetails.authors[0]);
                setAboutAccountUserIsVerified(
                    usersAndTheirRelevantInfo[postDetails.authors[0]].isVerified
                );
                setAboutAccountUserHasStories(
                    usersAndTheirRelevantInfo[postDetails.authors[0]].hasStories
                );
                setAboutAccountUserHasUnseenStory(
                    usersAndTheirRelevantInfo[postDetails.authors[0]].hasUnseenStory
                );
                return;
            }
        }
    }

    function closeAboutAccountPopup() {
        setDisplayAboutAccountPopup(false);
        closeThreeDotsPopup();
    }

    function closeAllPopups() {
        if(! (displayCommentsPopup && (displayThreeDotsPopup || displayAboutAccountPopup ||
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
        window.history.pushState(
            {
                page: 'Home',
            },
            'Home',
            originalURL
        );
        setDisplayStoryViewer(false);
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
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                        <LeftSidebar
                            profilePhoto={
                                (authUser in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[authUser].profilePhoto : defaultPfp
                            }
                            displayPopup={displayLeftSidebarPopup}
                            toggleDisplayPopup={toggleDisplayLeftSidebarPopup}
                        />

                        <div style={{marginTop:'2.3em', width:'50em', position: 'absolute', left: '24%'}}>
                            <div style={{display:'flex', justifyContent:'start', alignItems:'start', gap:'1em',
                            position: 'relative'}}>
                                {(fetchingStoriesIsComplete && currStoryLevel == 0) &&
                                    (
                                        <UserIcon
                                            username={authUser}
                                            authUser={authUser}
                                            inStoriesSection={true}
                                            hasStories={
                                                (authUser in usersAndTheirStories)
                                            }
                                            hasUnseenStory={
                                                !(usernamesWhoseStoriesYouHaveFinished.has(authUser))
                                            } 
                                            profilePhoto={
                                                (authUser in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[authUser].profilePhoto : defaultPfp
                                            }
                                            isVerified={
                                                (authUser in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[authUser].isVerified : false
                                            }
                                            notifyParentToShowStoryViewer={showStoryViewer}
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
                                                ownAccount={false}
                                                inStoriesSection={true}
                                                hasStories={true}
                                                hasUnseenStory={
                                                    !(usernamesWhoseStoriesYouHaveFinished.has(username))
                                                } 
                                                profilePhoto={
                                                    (username in usersAndTheirRelevantInfo) ?
                                                    usersAndTheirRelevantInfo[username].profilePhoto : defaultPfp
                                                }
                                                isVerified={
                                                    (username in usersAndTheirRelevantInfo) ?
                                                    usersAndTheirRelevantInfo[username].isVerified : false
                                                }
                                                notifyParentToShowStoryViewer={showStoryViewer}
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
                                        objectFit: 'contain', pointerEvents: 'none', display: 'none'}}/>
                                    )
                                }
                            </div>
                        
                            
                            {(currStoryLevel*6 + 5 < orderedListOfUsernamesInStoriesSection.length) &&
                                (
                                    <img className="rightArrow" onClick={incrementStoryLevel} src={rightArrow}
                                    style={{height:'1.5em', width:'1.5em', objectFit:'contain', position:'absolute',
                                    left:'80%', top:'20%', cursor:'pointer'}}/>
                                )
                            }

                            {currStoryLevel > 0 &&
                                (
                                    <img className="leftArrow" onClick={decrementStoryLevel} src={backArrow}
                                    style={{height:'1em', width:'1em', objectFit:'contain', position:'absolute',
                                    left:'-6%', top:'20%', cursor:'pointer'}}/>
                                )
                            }

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
                                        objectFit: 'contain', pointerEvents: 'none', marginTop: '3.75em',
                                        display: 'none'}}/>
                                    )
                                }
                            </div>
                            
                            {!fetchingInitialPostsIsComplete &&
                                (
                                    <img src={loadingAnimation} style={{position: 'absolute', top: '50%',
                                    left: '50%', transform: 'translate(-50%, -50%)', height: '2em', width: '2em',
                                    objectFit: 'contain', pointerEvents: 'none', display: 'none'}}/>
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
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].isPrivate : '?'
                                            }
                                            numFollowers={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].numFollowers : '?'
                                            }
                                            numFollowing={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].numFollowing : '?'
                                            }
                                            numPosts={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].numPosts : '?'
                                            }
                                            fullName={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].fullName : '?'
                                            }
                                            profilePhoto={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].profilePhoto : defaultPfp
                                            }
                                            isVerified={
                                                (username in usersAndTheirRelevantInfo) ?
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
                                        objectFit: 'contain', pointerEvents: 'none', display: 'none'}}/>
                                    </div>
                                )
                            }

                            <br/>

                            <Footer/>
                        </div>
                    </div>

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
                            />
                        )
                    }

                    {(displayThreeDotsPopup || displayCommentsPopup ||  displaySendPostPopup || 
                    displayLikersPopup || displayAboutAccountPopup || displayLeftSidebarPopup ||
                    displayErrorPopup)
                    && (
                            <img onClick={closeAllPopups} src={blackScreen} style={{position: 'fixed', 
                            top: '0%', left: '0%', width: '100%', height: '100%', opacity: '0.7', 
                            zIndex: '2'}}/>
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
                                    authUser={authUser}
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
                                    authUser={authUser}
                                    notifyParentToClosePopup={closeThreeDotsPopup}
                                    postDetails={threeDotsPopupPostDetails} 
                                    notifyParentToShowAboutAccountPopup={showAboutAccountPopup}
                                    hidePost={hidePost}
                                    notifyParentToShowErrorPopup={showErrorPopup}
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
                            zIndex: '3'}}>
                                <AboutAccountPopup
                                    authUser={authUser}
                                    usernameOfMainPostAuthor={aboutAccountUsername}
                                    mainPostAuthorIsVerified={aboutAccountUserIsVerified}
                                    mainPostAuthorHasStories={aboutAccountUserHasStories}
                                    mainPostAuthorHasUnseenStory={aboutAccountUserHasUnseenStory}
                                    notifyParentToClosePopup={closeAboutAccountPopup}
                                />
                            </div>
                        )
                    }

                    {displayErrorPopup &&
                        (
                            <div style={{position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)', zIndex: '3'}}>
                                <ErrorPopup
                                    errorMessage={errorPopupMessage} notifyParentToClosePopup={closeErrorPopup}
                                />
                            </div>
                        )
                    }
                </>
            }
        </>
    );
}

export default MainPage;