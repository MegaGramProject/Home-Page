const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const base64 = require('base-64');

const app = express();
app.use(cookieParser());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true 
    }
});

const usersAndTheirOverallPostIds = {};
const userIdsAndTheirUsernames = {};

const overallPostIdsWhoseLikesAreMonitored = [];
let datetimeForCheckingUpdatesOfPostLikes = null;
let intervalIdForFetchingPostLikeUpdates = null;
let isCurrentlyFetchingPostLikeUpdates = false;

const overallPostIdsWhoseCommentsAreMonitored = [];
let datetimeForCheckingUpdatesOfPostComments = null;
let intervalIdForFetchingNewPostComments = null;
let isCurrentlyFetchingNewPostComments = false;


io.on('connection', async (socket) => {
    const cookies = socket.handshake.headers.cookie;

    if (socket.handshake.query == null || !('userId' in socket.handshake.query)) {
        socket.emit('BadRequestError', 'You are being disconnected because you didn\'t provide any userId');

        setTimeout(() => {
            socket.disconnect();
        }, 2000);
    }

    const updatesToSubscribeTo = [];
    let updatesToSubscribeToHaveBeenProvided = false;

    if (('updatesToSubscribeTo' in socket.handshake.query)) {
        if (Array.isArray(socket.handshake.query.updatesToSubscribeTo)) {

            if (socket.handshake.query.updatesToSubscribeTo.includes('post-likes')) {
                updatesToSubscribeTo.push('post-likes');
                updatesToSubscribeToHaveBeenProvided = true;
            }

            if (socket.handshake.query.updatesToSubscribeTo.includes('post-comments')) {
                updatesToSubscribeTo.push('post-comments');
                updatesToSubscribeToHaveBeenProvided = true;
            }
        }
    }

    if (!updatesToSubscribeToHaveBeenProvided) {
        socket.emit('BadRequestError', `You are being disconnected because you didn\'t provide any valid updates to subscribe
        to`);
        
        setTimeout(() => {
            socket.disconnect();
        }, 2000);
    }

    const userId = socket.handshake.query.userId;

    if (!Number.isInteger(userId) || userId < 1) {
        socket.emit('BadRequestError', 'You are being disconnected because the userId you provided is invalid.');
        
        setTimeout(() => {
            socket.disconnect();
        }, 2000);
    }

    const userAuthenticationResult = await authenticateUser(cookies, userId);
    if (typeof userAuthenticationResult === 'boolean') {
        if(!userAuthenticationResult) {
            socket.emit('UserAuthenticationError', `You are being disconnected because the expressJSBackend1 server could not
            verify you as having the proper credentials to be logged in as ${userId}`);

            setTimeout(() => {
                socket.disconnect();
            }, 2000);
        }
    }
    else if (typeof userAuthenticationResult === 'string') {
        socket.emit('UserAuthenticationError', userAuthenticationResult);
        
        setTimeout(() => {
            socket.disconnect();
        }, 2000);
    }


    let overallPostIdsOfUser = [];
    if (userId in usersAndTheirOverallPostIds) {
        overallPostIdsOfUser = usersAndTheirOverallPostIds[userId];
    }
    else {
        overallPostIdsOfUser = await fetchListOfOverallPostIdsOfUser(userId);
        if (overallPostIdsOfUser[1] === 'BAD_GATEWAY') {
            socket.emit('BadGatewayError', overallPostIdsOfUser[0]);
            
            setTimeout(() => {
                socket.disconnect();
            }, 2000);
        }
        else if (overallPostIdsOfUser.length == 0) {
            socket.emit(
                'PostsDoNotExistError',
                'You have no posts, and hence cannot receive updates to the likes/comments of posts that do not exist'
            );

            setTimeout(() => {
                socket.disconnect();
            }, 2000);
        }

        usersAndTheirOverallPostIds[overallPostId] = overallPostIdsOfUser;
    }


    const setOfOverallPostIdsWhoseLikesAreMonitored = new Set(overallPostIdsWhoseLikesAreMonitored);
    const setOfOverallPostIdsWhoseCommentsAreMonitored = new Set(overallPostIdsWhoseCommentsAreMonitored);

    for (let overallPostId of overallPostIdsOfUser) {
        if (updatesToSubscribeTo.includes('post-likes')) {
            setOfOverallPostIdsWhoseLikesAreMonitored.add(overallPostId);
            socket.join('subscribersToLikeUpdatesOfPost' + overallPostId);
        }

        if (updatesToSubscribeTo.includes('post-comments')) {
            setOfOverallPostIdsWhoseCommentsAreMonitored.add(overallPostId);
            socket.join('subscribersToCommentUpdatesOfPost' + overallPostId);
        }
    }

    overallPostIdsWhoseLikesAreMonitored = [...setOfOverallPostIdsWhoseLikesAreMonitored];
    overallPostIdsWhoseCommentsAreMonitored = [...setOfOverallPostIdsWhoseCommentsAreMonitored];

    if (updatesToSubscribeTo.includes('post-likes')) {
        socket.join('subscribersToLikeUpdatesOfAPost');

        if (intervalIdForFetchingPostLikeUpdates == null) {
            datetimeForCheckingUpdatesOfPostLikes = new Date();
            intervalIdForFetchingPostLikeUpdates = setInterval(fetchNewPostLikes, 5000);
        }
    }

    if (updatesToSubscribeTo.includes('post-comments')) {
        socket.join('subscribersToCommentUpdatesOfAPost');

        if (intervalIdForFetchingNewPostComments == null) {
            datetimeForCheckingUpdatesOfPostComments = new Date();
            intervalIdForFetchingNewPostComments = setInterval(fetchNewPostComments, 5000);
        }
    }

    socket.on('disconnect', () => {
        for (let overallPostId of overallPostIdsOfUser) {
            let numSubscribersToPostLikeUpdatesOfThisPost = io.sockets.adapter.rooms.get(
                'subscribersToLikeUpdatesOfPost'+overallPostId
            ).size;
            let numSubscribersToNewPostCommentsOfThisPost = io.sockets.adapter.rooms.get(
                'subscribersToCommentUpdatesOfPost'+overallPostId
            ).size;

            if (updatesToSubscribeTo.includes('post-likes')) {
                numSubscribersToPostLikeUpdatesOfThisPost--;

                if (numSubscribersToPostLikeUpdatesOfThisPost==0) {
                    overallPostIdsWhoseLikesAreMonitored = overallPostIdsWhoseLikesAreMonitored.filter(
                        elem => elem !== overallPostId
                    );

                    if (overallPostIdsWhoseLikesAreMonitored.length == 0) {
                        clearInterval(intervalIdForFetchingPostLikeUpdates);
                        intervalIdForFetchingPostLikeUpdates = null;
                        datetimeForCheckingUpdatesOfPostLikes = null;
                    }
                }
            }

            if (updatesToSubscribeTo.includes('post-comments')) {
                numSubscribersToNewPostCommentsOfThisPost--;

                if (numSubscribersToNewPostCommentsOfThisPost==0) {
                    overallPostIdsWhoseCommentsAreMonitored = overallPostIdsWhoseCommentsAreMonitored.filter(
                        elem => elem !== overallPostId
                    );

                    if (overallPostIdsWhoseCommentsAreMonitored.length == 0) {
                        clearInterval(intervalIdForFetchingNewPostComments);
                        intervalIdForFetchingNewPostComments = null;
                        datetimeForCheckingUpdatesOfPostComments = null;
                    }
                }
            }
        }
    });
});


async function fetchListOfOverallPostIdsOfUser(userId) {
    try {
        let overallPostIds = [];
        const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/getOverallPostIdsOfUser/${userId}`);
        if (!response.ok) {
            return [
                `The expressJSBackend1 server had trouble fetching the list of overallPostIds of user ${userId}`,
                'BAD_GATEWAY'
            ];
        }

        overallPostIds = await response.json();
        overallPostIds = overallPostIds['overallPostIds'];
        return overallPostIds;
    }
    catch (error) {
        return [
            `There was trouble connecting to the expressJSBackend1 server to fetch the list of
            overallPostIds of user ${userId}`,
            'BAD_GATEWAY'
        ];
    }
}


async function fetchNewPostLikes() {
    if (isCurrentlyFetchingPostLikeUpdates) {
        return;
    }
    isCurrentlyFetchingPostLikeUpdates = true;

    try {
        let postLikeUpdates = [];
        const response = await fetch('http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/fetchUpdatesToLikesOfMultiplePosts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                datetimeForCheckingUpdatesOfPostLikes: datetimeForCheckingUpdatesOfPostLikes,
                overallPostIds: overallPostIdsWhoseLikesAreMonitored
            })
        });

        const newDatetimeForCheckingUpdatesOfPostLikes = new Date();

        if (!response.ok) {
            io.to('subscribersToLikeUpdatesOfAPost').emit(
                'PostLikeFetchingError',
                `The aspNetCoreBackend1 server had trouble getting the updates to likes of all the posts whose like-updates you
                are subscribed to`
            );

            datetimeForCheckingUpdatesOfPostLikes = newDatetimeForCheckingUpdatesOfPostLikes;
            isCurrentlyFetchingPostLikeUpdates = false;
            return;
        }

        postLikeUpdates = await response.json();
        postLikeUpdates = postLikeUpdates['postLikeUpdates'];
        const userIdsToGetUsernamesOf = new Set();
        const overallPostIdsThatHaveLikersWithUnknownUsernames = new Set();
        const overallPostIdsAndTheirPostLikeUpdates = {};

        for(let postLikeUpdate of postLikeUpdates) {
            const overallPostId = postLikeUpdate.overallPostId;
            const likerId = postLikeUpdate.likerId;

            if (!(likerId in userIdsAndTheirUsernames)) {
                userIdsToGetUsernamesOf.add(likerId);
                overallPostIdsThatHaveLikersWithUnknownUsernames.add(overallPostId);
            }
            else {
                if (!(overallPostId in overallPostIdsAndTheirPostLikeUpdates)) {
                    overallPostIdsAndTheirPostLikeUpdates[overallPostId] = [];
                }

                overallPostIdsAndTheirPostLikeUpdates[overallPostId].push(likerId);
            }
        }

        if (userIdsToGetUsernamesOf.size > 0) {
            const userIdsAndTheirUsernames = await getUsernamesForListOfUserIds([...userIdsToGetUsernamesOf]);
            const usernamesHaveBeenFoundForTheUserIds = !Array.isArray(userIdsAndTheirUsernames);

            for(let postLikeUpdate of postLikeUpdates) {
                const overallPostId = postLikeUpdate.overallPostId;
                const likerId = postLikeUpdate.likerId;

                if (likerId in userIdsToGetUsernamesOf) {
                    if (!(overallPostId in overallPostIdsAndTheirPostLikeUpdates)) {
                        overallPostIdsAndTheirPostLikeUpdates[overallPostId] = [];
                    }
    
                    overallPostIdsAndTheirPostLikeUpdates[overallPostId].push(likerId);
                }
            }

            if (usernamesHaveBeenFoundForTheUserIds) {
                for(let userId of Object.keys(userIdsAndTheirUsernames)) {
                    userIdsAndTheirUsernames[userId] = userIdsAndTheirUsernames[userId];
                }
            }
        }

        for(let overallPostId of Object.keys(overallPostIdsAndTheirPostLikeUpdates)) {
            const newPostLikersForPost = overallPostIdsAndTheirPostLikeUpdates[overallPostId];
            const usernamesOfNewPostLikersForPost = newPostLikersForPost.map(
                likerId => userIdsAndTheirUsernames[likerId] ?? `user ${likerId}`
            );

            io.to('subscribersToLikeUpdatesOfPost'+overallPostId).emit(
                'NewLikesOfPost',
                {
                    overallPostId: overallPostId,
                    likerIds:  newPostLikersForPost,
                    likerNames: usernamesOfNewPostLikersForPost
                }
            );
        }
    }
    catch (error) {
        io.to('subscribersToLikeUpdatesOfAPost').emit(
            'PostLikeFetchingError',
            `There was trouble connecting to the aspNetCoreBackend1 server to get the updates to likes of all the posts whose
            like-updates you are subscribed to`
        );
    }

    datetimeForCheckingUpdatesOfPostLikes = newDatetimeForCheckingUpdatesOfPostLikes;
    isCurrentlyFetchingPostLikeUpdates = false;
}


async function fetchNewPostComments() {
    if (isCurrentlyFetchingNewPostComments) {
        return;
    }
    isCurrentlyFetchingNewPostComments = true;

    try {
        let postCommentUpdates = [];
        const response = await fetch(`http://34.111.89.101/api/Home-Page/aspNetCoreBackend1
        /fetchUpdatesToCommentsOfMultiplePosts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                datetimeForCheckingUpdatesOfPostComments: datetimeForCheckingUpdatesOfPostComments,
                overallPostIds: overallPostIdsWhoseCommentsAreMonitored
            })
        });

        const newDatetimeForCheckingUpdatesOfPostComments = new Date();

        if (!response.ok) {
            io.to('subscribersToCommentUpdatesOfAPost').emit(
                'PostCommentFetchingError',
                `The aspNetCoreBackend1 server had trouble getting the updates to comments of all the posts whose comment-updates 
                you are subscribed to`
            );

            datetimeForCheckingUpdatesOfPostComments = newDatetimeForCheckingUpdatesOfPostComments;
            isCurrentlyFetchingNewPostComments = false;
            return;
        }

        postCommentUpdates = await response.json();
        postCommentUpdates = postCommentUpdates['postCommentUpdates'];
        const userIdsToGetUsernamesOf = new Set();
        const overallPostIdsThatHaveCommentersWithUnknownUsernames = new Set();
        const overallPostIdsAndTheirNewPostComments = {};

        for(let postCommentUpdate of postCommentUpdates) {
            const overallPostId = postCommentUpdate.overallPostId;
            const authorId = postCommentUpdate.authorId;
            const commentId = postCommentUpdate.id;

            if (!(authorId in userIdsAndTheirUsernames)) {
                userIdsToGetUsernamesOf.add(authorId);
                overallPostIdsThatHaveCommentersWithUnknownUsernames.add(overallPostId);
            }
            else {
                if (!(overallPostId in overallPostIdsAndTheirNewPostComments)) {
                    overallPostIdsAndTheirNewPostComments[overallPostId] = [];
                }

                const comment = postCommentUpdate.content;

                overallPostIdsAndTheirNewPostComments[overallPostId].push({
                    commentId: commentId,
                    commenterId: authorId,
                    comment: comment
                });
            }
        }

        if (userIdsToGetUsernamesOf.size > 0) {
            const userIdsAndTheirUsernames = await getUsernamesForListOfUserIds([...userIdsToGetUsernamesOf]);
            const usernamesHaveBeenFoundForTheUserIds = !Array.isArray(userIdsAndTheirUsernames);

            for(let postCommentUpdate of postCommentUpdates) {
                const overallPostId = postCommentUpdate.overallPostId;
                const authorId = postCommentUpdate.authorId;
                const commentId = postCommentUpdate.id;

                if (authorId in userIdsToGetUsernamesOf) {
                    if (!(overallPostId in overallPostIdsAndTheirNewPostComments)) {
                        overallPostIdsAndTheirNewPostComments[overallPostId] = [];
                    }

                    const comment = postCommentUpdate.content;
    
                    overallPostIdsAndTheirNewPostComments[overallPostId].push({
                        commentId: commentId,
                        commenterId: authorId,
                        comment: comment
                    });
                }
            }
            
            if (usernamesHaveBeenFoundForTheUserIds) {
                for(let userId of Object.keys(userIdsAndTheirUsernames)) {
                    userIdsAndTheirUsernames[userId] = userIdsAndTheirUsernames[userId];
                }
            }
        }

        for(let overallPostId of Object.keys(overallPostIdsAndTheirNewPostComments)) {
            const newCommentsForPost = overallPostIdsAndTheirNewPostComments[overallPostId];
            for(let i=0; i<newCommentsForPost.length; i++) {
                newCommentsForPost[i].commenterName = userIdsAndTheirUsernames[newCommentsForPost[i].commenterId] ??
                `user ${newCommentsForPost[i].commenterId}`;
            }

            io.to('subscribersToCommentUpdatesOfPost'+overallPostId).emit(
                'NewCommentsOfPost',
                {
                    overallPostId: overallPostId,
                    comments: newCommentsForPost
                }
            );
        }
    }
    catch (error) {
        io.to('subscribersToCommentUpdatesOfAPost').emit(
            'PostCommentFetchingError',
            `There was trouble connecting to the aspNetCoreBackend1 server to get the updates to comments of all the posts whose
            comment-updates you are subscribed to`
        );
    }

    datetimeForCheckingUpdatesOfPostComments = newDatetimeForCheckingUpdatesOfPostComments;
    isCurrentlyFetchingNewPostComments = false;
}


async function getUsernamesForListOfUserIds(userIds) {
    try {
        const response = await fetch('http://34.111.89.101/laravelBackend1/graphql', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                query: `query ($userIds: [Int!]!) {
                    getUsernamesForListOfUserIds(userIds: $userIds)
                }`,
                variables: {
                    userIds: userIds
                }
            })
        });
        if (!response.ok) {
            return [
                'The laravelBackend1 server had trouble getting the usernames for each of the userIds',
                'BAD_GATEWAY'
            ];
        }

        let listOfUsernames = await response.json();
        listOfUsernames = listOfUsernames.data.getUsernamesForListOfUserIds;

        const usernameForEachUserId = {};
        for(let i=0; i<listOfUsernames.length; i++) {
            const username = listOfUsernames[i];
            if (username !== null) {
                const userId = userIds[i];
                usernameForEachUserId[userId] = username;
            }
        }
        return usernameForEachUserId;
    }
    catch (error) {
        return [
            'There was trouble connecting to the laravelBackend1 server to get the usernames for each of the userIds',
            'BAD_GATEWAY'
        ];
    }
}


async function authenticateUser(cookies, userId) {
    try {
        const authTokenVal = cookies[`authToken${userId}`];
        let refreshTokenVal = cookies[`refreshToken${userId}`];

        let authTokenIsValidlyStructured = true;
        try {
            const decodedTokenBytes = base64.decode(authTokenVal);
            if (!decodedTokenBytes || decodedTokenBytes.length !== 100) {
                authTokenIsValidlyStructured = false;
            }
        } catch (err) {
            authTokenIsValidlyStructured = false;
        }

        if (!authTokenIsValidlyStructured) {
            return 'The provided authUser token, if any, in your cookies has an invalid structure.';
        }

        try {
            const decodedTokenBytes = base64.decode(refreshTokenVal);
            if (!decodedTokenBytes || decodedTokenBytes.length !== 100) {
                refreshTokenVal = '';
            }
        } catch (err) {
            refreshTokenVal = '';
        }

        let cookiesText = `authToken${userId}=${authTokenVal};`;
        if (refreshTokenVal) {
            cookiesText += ` refreshToken${userId}=${refreshTokenVal};`;
        }

        const response = await axios.get(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/${userId}`,
            {
                headers: {
                    'Cookie': cookiesText
                }
            }
        );

        if (!response.ok) {
            return false;
        }

        return true;

    }
    catch (error) {
        return 'There was trouble connecting to the ExpressJS backend for user authentication';
    }
}


function deleteWebSocketRoom(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName);
    
    if (room) {
        for (let socketId of room) {
            io.sockets.sockets.get(socketId).leave(roomName);
        }
        return true;
    }
    return false;
}


server.listen(8009, () => {
    console.log('Websocket server for post-likes and post-comments listening at port 8009')
});