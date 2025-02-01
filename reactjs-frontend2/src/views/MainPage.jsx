import { useEffect, useState } from 'react';

import AboutAccountPopup from '../components/aboutAccountPopup';
import CommentsPopup from '../components/commentsPopup';
import ErrorPopup from '../components/errorPopup';
import Footer from "../components/footer";
import LeftSidebar from "../components/leftSidebar";
import LeftSidebarPopup from '../components/leftSidebarPopup';
import MediaPost from "../components/mediaPost";
import PostLikersPopup from '../components/postLikersPopup';
import SendPostPopup from '../components/sendPostPopup';
import ThreeDotsPopup from '../components/threeDotsPopup';
import UserBar from "../components/userBar";
import UserIcon from "../components/userIcon";

import backArrow from "../assets/images/backArrow.png";
import blackScreen from "../assets/images/blackScreen.png";
import defaultPfp from '../assets/images/defaultPfp.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import rightArrow from "../assets/images/nextArrow.png";

import '../styles.css';

function MainPage({urlParams}) {
    const [username, setUsername] = useState('rishavry');
    const [displayThreeDotsPopup, setDisplayThreeDotsPopup] = useState(false);
    const [threeDotsPopupPostDetails, setThreeDotsPopupPostDetails] = useState(null);
    const [displayCommentsPopup, setDisplayCommentsPopup] = useState(false);
    const [commentsPopupPostDetails, setCommentsPopupPostDetails] = useState(null);
    const [commentsPopupNumLikes, setCommentsPopupNumLikes] = useState('');
    const [commentsPopupNumComments, setCommentsPopupNumComments] = useState('');
    const [commentsPopupCurrSlide, setCommentsPopupCurrSlide] = useState(0);
    const [commentsPopupIsLiked, setCommentsPopupIsLiked] = useState('');
    const [commentsPopupIsAd, setCommentsPopupIsAd] = useState('');
    const [commentsPopupIsSaved, setCommentsPopupIsSaved] = useState('');
    const [displaySendPostPopup, setDisplaySendPostPopup] = useState(true);
    const [focusedComponent, setFocusedComponent] = useState(null);
    const [displayPostLikersPopup, setDisplayPostLikersPopup] = useState(false);
    const [postLikersPopupOverallPostId, setPostLikersPopupOverallPostId] = useState('');
    const [currStoryLevel, setCurrStoryLevel] = useState(0);
    const [displayAboutAccountPopup, setDisplayAboutAccountPopup] = useState(false);
    const [aboutAccountUsername, setAboutAccountUsername] = useState('');
    const [aboutAccountUserIsVerified, setAboutAccountUserIsVerified] = useState(false);
    const [aboutAccountUserHasStories, setAboutAccountUserHasStories] = useState(false);
    const [aboutAccountUserHasUnseenStory, setAboutAccountUserHasUnseenStory] = useState(false);
    const [hiddenPosts, setHiddenPosts] = useState([]);
    const [commentsPopupPostIdInReact, setCommentsPopupPostIdInReact] = useState('');
    const [displayLeftSidebarPopup, setDisplayLeftSidebarPopup] = useState(false);
    const [displayErrorPopup, setDisplayErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');
    const [usersAndTheirStories, setUsersAndTheirStories] = useState({});
    const [usersAndYourCurrSlideInTheirStories, setUsersAndYourCurrSlideInTheirStories] = useState({});
    const [orderedListOfUsernamesInStoriesSection, setOrderedListOfUsernamesInStoriesSection] = useState([]);
    const [fetchingStoriesIsComplete, setFetchingStoriesIsComplete] = useState(false);
    const [fetchingSuggestedAccountsIsComplete, setFetchingSuggestedAccountsIsComplete] = useState(false);
    const [fetchingPostsIsComplete, setFetchingPostsIsComplete] = useState(false);
    const [usersAndTheirRelevantInfo, setUsersAndTheirRelevantInfo] = useState({});
    const [storiesSectionErrorMessage, setStoriesSectionErrorMessage] = useState('');
    const [orderedListOfUsernamesOfSuggestedAccounts, setOrderedListOfUsernamesOfSuggestedAccounts] = useState([]);
    const [suggestedAccountsSectionErrorMessage, setSuggestedAccountsSectionErrorMessage] = useState('');
    const [orderedListOfPosts, setOrderedListOfPosts] = useState([]);
    const [postsSectionErrorMessage, setPostsSectionErrorMessage] = useState('');
    const [sendPostPopupOverallPostId, setSendPostPopupOverallPostId] = useState(null);

    useEffect(() => {
        document.title = "Megagram";
        return;
        
        if(urlParams) {
            authenticateUser(urlParams.username);
        }
        else {
            if(localStorage.getItem("defaultUser")!==null) {
                authenticateUser(localStorage.getItem("defaultUser"));
            }
            else {
                window.location.href = "http://34.111.89.101/login"
            }
        }
    }, []);

    useEffect(() => {
        if (username.length > 0) { //this condition is met after user-authentication
            fetchStories();
            fetchSuggestedAccounts();
            fetchPosts();
        }
    }, [username]);

    useEffect(() => {
        if (fetchingStoriesIsComplete && fetchingSuggestedAccountsIsComplete && fetchingPostsIsComplete) {
            return;
            fetchAllTheNecessaryUserInfo();
        }
    }, [fetchingStoriesIsComplete, fetchingSuggestedAccountsIsComplete, fetchingPostsIsComplete]);
       

    function showThreeDotsPopupForPost(newThreeDotsPopupPostDetails) {
        setThreeDotsPopupPostDetails(newThreeDotsPopupPostDetails);
        setDisplayThreeDotsPopup(true);
    }

    function showCommentsPopup(postDetails, numLikes, numComments, currSlide, isLiked, isAd,
    isSaved, idInReact) {
        setCommentsPopupPostDetails(postDetails);
        setCommentsPopupNumLikes(numLikes);
        setCommentsPopupNumComments(numComments);
        setCommentsPopupCurrSlide(currSlide);
        setCommentsPopupIsLiked(isLiked);
        setCommentsPopupIsAd(isAd);
        setCommentsPopupIsSaved(isSaved);
        setCommentsPopupPostIdInReact(idInReact);

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
        setHiddenPosts([...hiddenPosts, overallPostId]);
        setDisplayThreeDotsPopup(false);
    }

    
    async function authenticateUser(username) {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/checkIfUserIsLoggedIn/${username}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            if(!response.ok) {
                showErrorPopup('The server had trouble checking if you are logged in.');
                setTimeout(() => {
                    window.location.href = 'http://34.111.89.101/login';
                }, 3000);
                return;
            }
            const isAuth = await response.json();
            if(isAuth) {
                localStorage.setItem('defaultUser', username);
                setUsername(username);
            }
            else {
                try {
                    const response1 = await fetch(
                    `http://34.111.89.101/api/Home-Page/expressJSBackend1/refreshAuthToken/${username}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                    });
                    if(!response1.ok) {
                        showErrorPopup('The server had trouble refreshing your auth-token.');
                        setTimeout(() => {
                            window.location.href = 'http://34.111.89.101/login';
                        }, 3000);
                        return;
                    }
                    localStorage.setItem('defaultUser', username);
                    setUsername(username);
                }
                catch (error) {
                    showErrorPopup('There was trouble connecting to the server to refresh your auth-token.');
                }
            }
        }
        catch (error) {
            showErrorPopup('There was trouble connecting to the server to check if you are logged in.');
        }
    }

    async function fetchStories() {
        /*
            (disclaimers -> 
                stories expire after 1 yr instead of 24h;
                Users can post a max of 10 unexpired stories at a time.
            )
        */

        const newUsersAndTheirStories = {};
        const newUsersAndYourCurrSlideInTheirStory = {};
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOwnUnexpiredStories/${username}}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                console.error('The server could not find an unexpired story of yours.');
            }
            else {
                const ownUnexpiredStoryData = await response.json();
                newUsersAndTheirStories[username] = ownUnexpiredStoryData.stories;
                newUsersAndYourCurrSlideInTheirStory[username] = ownUnexpiredStoryData.currSlide;
            }
        }
        catch (error) {
            console.error('There was trouble connecting to the server to find an unexpired story of yours');
        }

        let newOrderedListOfUsernamesInStoriesSection = [];
        try {
            const response1 = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getOrderedListOfUsernamesInStoriesSection/
            ${username}`, {
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
            setUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStory);
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
        try {
            const response = await fetch(
                `http://34.111.89.101/api/Home-Page/djangoBackend2/getSuggestedAccountsForUser/${username}`, {
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
    
    async function fetchPosts() {
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
            `http://34.111.89.101/api/Home-Page/djangoBackend2/getBatchOfPostsForUserFeed/${username}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                setPostsSectionErrorMessage(
                    'The server could not retrieve the posts for this section.'
                );
            }
            else {
                const listOfNewPostsForFeed = await response.json();
                const newOrderedListOfPosts = [...orderedListOfPosts, ...listOfNewPostsForFeed];
                setOrderedListOfPosts(newOrderedListOfPosts);
            }
        }
        catch (error) {
            setPostsSectionErrorMessage(
                'There was trouble connecting to the server to retrieve the posts for this section.'
            );
        }
        finally {
            setFetchingPostsIsComplete(true);
        }
    }

    async function fetchAllTheNecessaryUserInfo() {
        const usernamesOfAllPostAuthors = orderedListOfPosts.flatMap(x => x.usernames);
        const usernamesOfAllMainPostAuthors = orderedListOfPosts.map(x => x.usernames[0]);

        let usersAndTheirProfilePhotos = {};
        const uniqueListOfUsernamesNeededForProfilePhotos =
        [
            ...new Set([
                    username,
                    ...orderedListOfUsernamesInStoriesSection,
                    ...orderedListOfUsernamesOfSuggestedAccounts,
                    ...usernamesOfAllMainPostAuthors
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
                for(let user_name in uniqueListOfUsernamesNeededForProfilePhotos) {
                    usersAndTheirProfilePhotos[user_name] = defaultPfp;
                }
            }
            else {
                usersAndTheirProfilePhotos = await response.json();
            }
        }
        catch (error) {
            console.error("There was trouble connecting to the server to fetch all the necessary profile-photos");
            for(let user_name in uniqueListOfUsernamesNeededForProfilePhotos) {
                usersAndTheirProfilePhotos[user_name] = defaultPfp;
            }
        }
        
        let usersAndTheirIsVerifiedStatuses = {};
        const uniqueListOfAllUsernames =
        [
            ...new Set([
                    username,
                    ...orderedListOfUsernamesInStoriesSection,
                    ...orderedListOfUsernamesOfSuggestedAccounts,
                    ...usernamesOfAllPostAuthors
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
                for(let user_name in uniqueListOfAllUsernames) {
                    usersAndTheirIsVerifiedStatuses[user_name] = false;
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
            for(let user_name in uniqueListOfAllUsernames) {
                usersAndTheirIsVerifiedStatuses[user_name] = false;
            }
        }

        let usersAndTheirFullNames = {};
        const uniqueListOfUsernamesNeededForFullNames = [
            ...new Set(
                [
                    username,
                    ...orderedListOfUsernamesOfSuggestedAccounts
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
                for(let user_name in uniqueListOfUsernamesNeededForFullNames) {
                    usersAndTheirFullNames[user_name] = '?';
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
            for(let user_name in uniqueListOfUsernamesNeededForFullNames) {
                usersAndTheirFullNames[user_name] = '?';
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
                for(let user_name in orderedListOfUsernamesOfSuggestedAccounts) {
                    usersAndTheirIsPrivateStatuses[user_name] = '?';
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
            for(let user_name in orderedListOfUsernamesOfSuggestedAccounts) {
                usersAndTheirIsPrivateStatuses[user_name] = '?';
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
                for(let user_name in orderedListOfUsernamesOfSuggestedAccounts) {
                    usersAndTheirNumPostsFollowersAndFollowings[user_name] = {
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
            for(let user_name in orderedListOfUsernamesOfSuggestedAccounts) {
                usersAndTheirNumPostsFollowersAndFollowings[user_name] = {
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
                for(let user_name in uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses) {
                    usersAndTheirHasStoriesAndUnseenStoryStatuses[user_name] = {
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
            for(let user_name in uniqueListOfUsernamesNeededForHasStoriesAndUnseenStoryStatuses) {
                usersAndTheirHasStoriesAndUnseenStoryStatuses[user_name] = {
                    hasStories: false,
                    hasUnseenStory: false
                };
            }
        }

        const newUsersAndTheirRelevantInfo = {};
        for(let user_name of uniqueListOfAllUsernames) {
            newUsersAndTheirRelevantInfo[user_name] = {};
            if (user_name in usersAndTheirProfilePhotos) {
                newUsersAndTheirRelevantInfo[user_name].profilePhoto = usersAndTheirProfilePhotos[user_name];
            }
            if (user_name in usersAndTheirIsVerifiedStatuses) {
                newUsersAndTheirRelevantInfo[user_name].isVerified = usersAndTheirIsVerifiedStatuses[user_name];
            }
            if (user_name in usersAndTheirFullNames) {
                newUsersAndTheirRelevantInfo[user_name].fullName = usersAndTheirFullNames[user_name];
            }
            if (user_name in usersAndTheirIsPrivateStatuses) {
                newUsersAndTheirRelevantInfo[user_name].isPrivate = usersAndTheirIsPrivateStatuses[user_name];
            }
            if (user_name in usersAndTheirNumPostsFollowersAndFollowings) {
                newUsersAndTheirRelevantInfo[user_name].numPosts =
                usersAndTheirNumPostsFollowersAndFollowings[user_name].numPosts;

                newUsersAndTheirRelevantInfo[user_name].numFollowers =
                usersAndTheirNumPostsFollowersAndFollowings[user_name].numFollowers;

                newUsersAndTheirRelevantInfo[user_name].numFollowings =
                usersAndTheirNumPostsFollowersAndFollowings[user_name].numFollowings;
            }
            if (user_name in usersAndTheirHasStoriesAndUnseenStoryStatuses) {
                newUsersAndTheirRelevantInfo[user_name].hasStories =
                usersAndTheirHasStoriesAndUnseenStoryStatuses[user_name].hasStories;

                newUsersAndTheirRelevantInfo[user_name].hasUnseenStory =
                usersAndTheirHasStoriesAndUnseenStoryStatuses[user_name].hasUnseenStory;
            }
        }
        setUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);
    }

    function handleFocus(id) {
        setFocusedComponent(id);
    };

    function closePostLikersPopup () {
        setDisplayPostLikersPopup(false);
    }

    function showPostLikersPopup(overallPostId) {
        setPostLikersPopupOverallPostId(overallPostId);
        setDisplayPostLikersPopup(true);
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
                setAboutAccountUsername(postDetails.usernames[0]);
                setAboutAccountUserIsVerified(usersAndTheirRelevantInfo[postDetails.usernames[0]].isVerified);
                setAboutAccountUserHasStories(usersAndTheirRelevantInfo[postDetails.usernames[0]].hasStories);
                setAboutAccountUserHasUnseenStory(usersAndTheirRelevantInfo[postDetails.usernames[0]].hasUnseenStory);
                return;
            }
        }
    }

    function closeAboutAccountPopup() {
        setDisplayAboutAccountPopup(false);
        closeThreeDotsPopup();
    }

    function closeAllPopups() {
        setDisplayThreeDotsPopup(false);
        setDisplayCommentsPopup(false);
        setDisplaySendPostPopup(false);
        setDisplayPostLikersPopup(false);
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

    return (
        <>
            {4==4 &&
                <>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                        <LeftSidebar
                            profilePhoto={
                                (username in usersAndTheirRelevantInfo) ?
                                usersAndTheirRelevantInfo[username].profilePhoto : defaultPfp
                            }
                            displayPopup={displayLeftSidebarPopup}
                            toggleDisplayPopup={toggleDisplayLeftSidebarPopup}
                        />

                        <div style={{position: 'absolute', left:'28.5%', marginTop:'2.3em', width:'45em',
                        height:'50em'}}>
                            <div style={{display:'flex', justifyContent:'start', alignItems:'start', gap:'1em',
                            position: 'relative'}}>
                                {(fetchingStoriesIsComplete && currStoryLevel == 0) &&
                                    (
                                        <UserIcon
                                            username={username}
                                            ownAccount={true}
                                            inStoriesSection={true}
                                            hasStories={
                                                (username in usersAndTheirStories)
                                            }
                                            hasUnseenStory={
                                                !(username in usersAndYourCurrSlideInTheirStories &&
                                                usersAndYourCurrSlideInTheirStories[username] === 'finished')
                                            } 
                                            profilePhoto={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].profilePhoto : defaultPfp
                                            }
                                            isVerified={
                                                (username in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[username].isVerified : false
                                            }
                                        />
                                    )
                                }

                                {(fetchingStoriesIsComplete && storiesSectionErrorMessage.length==0) &&
                                    (
                                    orderedListOfUsernamesInStoriesSection
                                        .slice(
                                            currStoryLevel * 6,
                                            currStoryLevel * 6 + 6
                                        )
                                        .map((user_name) => (
                                            <UserIcon
                                                key={user_name}
                                                username={user_name} 
                                                ownAccount={false}
                                                inStoriesSection={true}
                                                hasStories={true}
                                                hasUnseenStory={true} 
                                                profilePhoto={
                                                    (user_name in usersAndTheirRelevantInfo) ?
                                                    usersAndTheirRelevantInfo[user_name].profilePhoto : defaultPfp
                                                }
                                                isVerified={
                                                    (user_name in usersAndTheirRelevantInfo) ?
                                                    usersAndTheirRelevantInfo[user_name].isVerified : false
                                                }
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
                            </div>
                        
                            
                            {(currStoryLevel*6 + 5 < orderedListOfUsernamesInStoriesSection.length) &&
                                (
                                    <img className="rightArrow" onClick={incrementStoryLevel} src={rightArrow}
                                    style={{height:'1.5em', width:'1.5em', objectFit:'contain', position:'absolute',
                                    left:'88%', top:'3%', cursor:'pointer'}}/>
                                )
                            }

                            {currStoryLevel > 0 &&
                                (
                                    <img className="leftArrow" onClick={decrementStoryLevel} src={backArrow}
                                    style={{height:'1em', width:'1em', objectFit:'contain', position:'absolute',
                                    left:'-7.5%', top:'3%', cursor:'pointer'}}/>
                                )
                            }

                            <div style={{display:'flex', flexDirection:'column', justifyContent:'center',
                            alignItems:'center', marginLeft:'-5em', marginTop: '2em', gap:'1em',
                            position: 'relative'}}>
                                {(fetchingPostsIsComplete && postsSectionErrorMessage.length==0) &&
                                    (
                                        orderedListOfPosts
                                        .filter(postDetails =>!hiddenPosts.includes(postDetails.overallPostId))
                                        .map((postDetails) => (
                                            <MediaPost
                                                key={postDetails.overallPostId}
                                                id={postDetails.overallPostId}
                                                username={username}
                                                postDetails={postDetails}
                                                isAd={postDetails.adLink!==null}
                                                displayThreeDotsPopup={
                                                    () => { showThreeDotsPopupForPost(postDetails) }
                                                }
                                                showCommentsPopup={showCommentsPopup}
                                                displaySendPostPopup={showSendPostPopup}
                                                onFocus={handleFocus}
                                                isFocused={focusedComponent === postDetails.overallPostId}
                                                displayPostLikersPopup={showPostLikersPopup}
                                            />
                                        ))
                                    )
                                }

                                {(fetchingPostsIsComplete && postsSectionErrorMessage.length>0) &&
                                    (
                                        <p style={{width: '85%', color: 'gray', fontSize: '0.88em',
                                        marginTop: '7em'}}>
                                            {postsSectionErrorMessage}
                                        </p>
                                    )
                                }
                            </div>

                            {!fetchingPostsIsComplete &&
                                (
                                    <img src={loadingAnimation} style={{position: 'absolute', top: '50%',
                                    left: '50%', transform: 'translate(-50%, -50%)', height: '2em', width: '2em',
                                    objectFit: 'contain', pointerEvents: 'none'}}/>
                                )
                            }
                        </div>
                        
                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'center',
                        alignItems: 'start', position: 'absolute', left:'76%', marginTop:'4em'}}>
                            <UserBar
                                username={username}
                                ownAccount={true}
                                authUser={username}
                                isPrivate={'?'}
                                numFollowers={'?'}
                                numFollowing={'?'} 
                                numPosts={'?'}
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
                        

                            <b style={{color:'gray', fontSize:'0.9em', marginBottom: '-1.5em'}}>
                                Suggested for you
                            </b>
                            
                            <br/>
                            <br/>
                            <br/>

                            {(fetchingSuggestedAccountsIsComplete && suggestedAccountsSectionErrorMessage.length==0) &&
                                (
                                    orderedListOfUsernamesOfSuggestedAccounts
                                    .map((user_name) => (
                                        <UserBar
                                            key={user_name}
                                            username={user_name}
                                            ownAccount={false}
                                            authUser={username}
                                            isPrivate={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].isPrivate : '?'
                                            }
                                            numFollowers={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].numFollowers : '?'
                                            }
                                            numFollowing={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].numFollowing : '?'
                                            }
                                            numPosts={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].numPosts : '?'
                                            }
                                            fullName={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].fullName : '?'
                                            }
                                            profilePhoto={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].profilePhoto : defaultPfp
                                            }
                                            isVerified={
                                                (user_name in usersAndTheirRelevantInfo) ?
                                                usersAndTheirRelevantInfo[user_name].isVerified : false
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
                    </div>

                    {(displayThreeDotsPopup || displayCommentsPopup ||  displaySendPostPopup || 
                    displayPostLikersPopup || displayAboutAccountPopup || displayLeftSidebarPopup ||
                    displayErrorPopup)
                    && (
                            <img onClick={closeAllPopups} src={blackScreen} style={{position: 'absolute', 
                            top: '0%', left: '0%', width: '100%', height: '100%', opacity: '0.7'}}/>
                        )
                    }

                    {displayLeftSidebarPopup &&
                        (
                            <div style={{display: displayErrorPopup ? 'none' : 'inline-block', position: 'fixed', bottom: '10%',
                            left: '1%'}}>
                                <LeftSidebarPopup
                                    username={username}
                                    notifyParentToShowErrorPopup={showErrorPopup}
                                />
                            </div>
                        )
                    }

                    {displayThreeDotsPopup &&
                        (
                            <div style={{display: displayErrorPopup ? 'none' : 'inline-block', position: 'fixed', top: '50%', 
                            left: '50%', transform: 'translate(-50%, -50%)'}}>
                                <ThreeDotsPopup
                                    authUser={username}
                                    notifyParentToClosePopup={closeThreeDotsPopup}
                                    postDetails={threeDotsPopupPostDetails} 
                                    notifyParentToShowAboutAccountPopup={showAboutAccountPopup}
                                    hidePost={hidePost}
                                    notifyParentToShowErrorPopup={showErrorPopup}
                                />
                            </div>
                        )
                    }

                    {displayCommentsPopup &&
                         <div style={{display: displayErrorPopup ? 'none' : 'inline-block', position: 'fixed', top: '50%',
                         left: '50%', transform: 'translate(-50%, -50%)'}}>
                            <CommentsPopup
                                id={6}
                                username={username} 
                                postDetails={commentsPopupPostDetails}
                                numLikes={commentsPopupNumLikes} numComments={commentsPopupNumComments}
                                currSlide={commentsPopupCurrSlide}
                                isLiked={commentsPopupIsLiked} 
                                displayThreeDotsPopup={() => { showThreeDotsPopupForPost(commentsPopupPostDetails) }}
                                isSaved={commentsPopupIsSaved} hideCommentsPopup={hideCommentsPopup}
                                displaySendPostPopup={showSendPostPopup}
                                onFocus={handleFocus} isFocused={focusedComponent==6} 
                                displayPostLikersPopup={showPostLikersPopup}
                                postIdInReact={commentsPopupPostIdInReact}
                            />
                        </div>
                    }

                    {displaySendPostPopup &&
                        (
                            <div style={{display: displayErrorPopup ? 'none' : 'inline-block', position: 'fixed',
                            top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                                <SendPostPopup
                                    authUser={username}
                                    overallPostId={sendPostPopupOverallPostId}
                                    usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                    notifyParentToUpdateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                                    notifyParentToShowErrorPopup={showErrorPopup}
                                    notifyParentToClosePopup={closeSendPostPopup}
                                />
                            </div>
                        )
                    }

                    {displayPostLikersPopup &&
                        (
                            <div style={{display: displayErrorPopup ? 'none' : 'inline-block', position: 'fixed', top: '50%',
                            left: '50%', transform: 'translate(-50%, -50%)'}}>
                                <PostLikersPopup
                                    username={username}
                                    overallPostId={postLikersPopupOverallPostId}
                                    usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                    notifyParentToUpdateUsersAndTheirRelevantInfo={updateUsersAndTheirRelevantInfo}
                                    notifyParentToClosePopup={closePostLikersPopup}
                                    notifyParentToShowErrorPopup={showErrorPopup}
                                />
                            </div>
                        )
                    }

                    {displayAboutAccountPopup &&
                        (
                            <div style={{display: displayErrorPopup ? 'none' : 'inline-block', position: 'fixed', top: '50%',
                            left: '50%', transform: 'translate(-50%, -50%)'}}>
                                <AboutAccountPopup
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
                            transform: 'translate(-50%, -50%)'}}>
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