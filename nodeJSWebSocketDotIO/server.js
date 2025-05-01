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

const userIdsAndTheirUsernames = {};


io.on('connection', async (socket) => {
    const cookies = socket.handshake.headers.cookie;

    const userIdIsProvided = 'userId' in socket.handshake.query;
    const backendIdIsProvided = 'backendId' in socket.handshake.query;

    if (socket.handshake.query == null || (!userIdIsProvided && !backendIdIsProvided) || (userIdIsProvided &&
    backendIdIsProvided)) {
        socket.emit('BadRequestError', `You are being disconnected either because you didn\'t provide any userId or backendId,
        or because you provided both instead of just one`);

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

    if (userIdIsProvided && !updatesToSubscribeToHaveBeenProvided) {
        socket.emit('BadRequestError', `You are being disconnected because you didn\'t provide any valid updates to subscribe
        to`);
        
        setTimeout(() => {
            socket.disconnect();
        }, 2000);
    }

    let userId = null;

    if (userIdIsProvided) {
        userId = socket.handshake.query.userId;

        if (!Number.isInteger(userId) || userId < 1) {
            socket.emit('BadRequestError', 'You are being disconnected because the userId you provided is invalid.');
            
            setTimeout(() => {
                socket.disconnect();
            }, 2000);
        }
    
        const userAuthenticationResult = await authenticateUser(cookies, userId);
        if (typeof userAuthenticationResult === 'boolean') {
            if(!userAuthenticationResult) {
                socket.emit('UserAuthenticationError', `You are being disconnected because the expressJSBackend1 server could
                not verify you as having the proper credentials to be logged in as ${userId}`);
    
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

        if (updatesToSubscribeTo.includes("post-likes")) {
            socket.join(`subscribersToLikeUpdatesOfPostsOfUser${userId}`);
        }

        if (updatesToSubscribeTo.includes("post-comments")) {
            socket.join(`subscribersToCommentUpdatesOfPostsOfUser${userId}`);
        }
    }

    let backendId = null;

    if (backendIdIsProvided) {
        backendId = socket.handshake.query.backendId;

        if(!(['aspNetCoreBackend1'].includes(backendId))) {
            socket.emit(
                'BadRequestError',
                'You are being disconnected because you provided an invalid backendId'
            );

            setTimeout(() => {
                socket.disconnect();
            }, 2000);
        }

        socket.on('PostLike', async (data) => {
            const { likeId, overallPostId, authors, likerId } = data;

            const likerName = userIdsAndTheirUsernames[likerId] ?? await getUsernameOfUserId(likerId);
    
            for(let authorId of authors) {
                const nameOfRoomToBroadcastUpdateTo = `subscribersToLikeUpdatesOfPostsOfUser${authorId}`;
                const roomToBroadcastUpdateTo = io.sockets.adapter.rooms.get(nameOfRoomToBroadcastUpdateTo);
    
                if (typeof roomToBroadcastUpdateTo !== 'undefined') {
                    io.to(nameOfRoomToBroadcastUpdateTo).emit(
                        'PostLike',
                        {
                            likeId: likeId,
                            overallPostId: overallPostId,
                            likerId: likerId,
                            likerName: likerName
                        }
                    );
                }
            }
        });
    
    
        socket.on('PostUnlike', async (data) => {
            const { likeId, overallPostId, authors, likerId } = data;

            const likerName = userIdsAndTheirUsernames[likerId] ?? await getUsernameOfUserId(likerId);
    
            for(let authorId of authors) {
                const nameOfRoomToBroadcastUpdateTo = `subscribersToLikeUpdatesOfPostsOfUser${authorId}`;
                const roomToBroadcastUpdateTo = io.sockets.adapter.rooms.get(nameOfRoomToBroadcastUpdateTo);
    
                if (typeof roomToBroadcastUpdateTo !== 'undefined') {    
                    io.to(nameOfRoomToBroadcastUpdateTo).emit(
                        'PostUnlike',
                        {
                            likeId: likeId,
                            overallPostId: overallPostId,
                            likerId: likerId,
                            likerName: likerName
                        }
                    );
                }
            }
        });
    
    
        socket.on('PostComment', async (data) => {
            const { commentId, overallPostId, authors, commenterId, comment } = data;

            const commenterName = userIdsAndTheirUsernames[commenterId] ?? await getUsernameOfUserId(commenterId);
    
            for(let authorId of authors) {
                const nameOfRoomToBroadcastUpdateTo = `subscribersToCommentUpdatesOfPostsOfUser${authorId}`;
                const roomToBroadcastUpdateTo = io.sockets.adapter.rooms.get(nameOfRoomToBroadcastUpdateTo);
    
                if (typeof roomToBroadcastUpdateTo !== 'undefined') {
                    io.to(nameOfRoomToBroadcastUpdateTo).emit(
                        'PostComment',
                        {
                            commentId: commentId, 
                            overallPostId: overallPostId, 
                            commenterId: commenterId,
                            comment: comment,
                            commenterName: commenterName
                        }
                    );
                }
            }
        });
    
    
        socket.on('EditedPostComment', async (data) => {
            const { commentId, overallPostId, authors, commenterId, comment } = data;

            const commenterName = userIdsAndTheirUsernames[commenterId] ?? await getUsernameOfUserId(commenterId);
    
            for(let authorId of authors) {
                const nameOfRoomToBroadcastUpdateTo = `subscribersToCommentUpdatesOfPostsOfUser${authorId}`;
                const roomToBroadcastUpdateTo = io.sockets.adapter.rooms.get(nameOfRoomToBroadcastUpdateTo);
    
                if (typeof roomToBroadcastUpdateTo !== 'undefined') {
                    io.to(nameOfRoomToBroadcastUpdateTo).emit(
                        'EditedPostComment',
                        {
                            commentId: commentId, 
                            overallPostId: overallPostId, 
                            commenterId: commenterId,
                            comment: comment,
                            commenterName: commenterName
                        }
                    );
                }
            }
        });
    
    
        socket.on('DeletedPostComment', async (data) => {
            const { commentId, overallPostId, authors, commenterId, comment } = data;
            const commenterName = userIdsAndTheirUsernames[commenterId] ?? await getUsernameOfUserId(commenterId);
    
            for(let authorId of authors) {
                const nameOfRoomToBroadcastUpdateTo = `subscribersToCommentUpdatesOfPostsOfUser${authorId}`;
                const roomToBroadcastUpdateTo = io.sockets.adapter.rooms.get(nameOfRoomToBroadcastUpdateTo);
    
                if (typeof roomToBroadcastUpdateTo !== 'undefined') {
                    io.to(nameOfRoomToBroadcastUpdateTo).emit(
                        'DeletedPostComment',
                        {
                            commentId: commentId, 
                            overallPostId: overallPostId, 
                            commenterId: commenterId,
                            comment: comment,
                            commenterName: commenterName
                        }
                    );
                }
            }
        });
    }
});


async function getUsernameOfUserId(userId) {
    try {
        const response = await fetch('http://34.111.89.101/laravelBackend1/graphql', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                query: `query ($userId: Int!) {
                    getUsernameOfUserIdFromWebSocket(userId: $userId)
                }`,
                variables: {
                    userId: userId
                }
            })
        });
        if (!response.ok) {
            return `user ${userId}`;
        }

        let usernameOfUserId = await response.json();
        usernameOfUserId = listOfUsernames.data.getUsernameOfUserIdFromWebSocket;

        userIdsAndTheirUsernames[userId] = usernameOfUserId;

        return usernameOfUserId;
    }
    catch {
       return `user ${userId}`;
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
    catch {
        return 'There was trouble connecting to the ExpressJS backend for user authentication';
    }
}


server.listen(8009, () => {
    console.log('This Websocket-Server, used for delivering updates on likes and comments of posts, is listening at port 8009')
});