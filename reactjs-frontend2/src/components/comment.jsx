import { useEffect, useState } from 'react';

import blankHeartIcon from '../assets/images/blankHeartIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import uniqueRedHeart from '../assets/images/heartAnimationIcon.webp';
import pencilIcon from '../assets/images/pencilIcon.png';
import redHeartIcon from '../assets/images/redHeartIcon.png';
import trashIcon from '../assets/images/trashIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';
import loadingAnimation from '../assets/images/loadingAnimation.gif';


function Comment({id, authUserId, isLikedByAuthUser, newlyPostedRepliesByAuthUser, authorId, authorUsername, authorIsVerified,
authorPfp, authorStatusToAuthUser, isEdited, datetime, content, isLikedByPostAuthor, numLikes, numReplies, usersAndTheirRelevantInfo,
showErrorPopup, updateCommentDetails, replyToComment, showLikersPopup, fetchAllTheNecessaryInfo, notifyParentToEditComment,
notifyParentToDeleteComment}) {
    const [isCaption, setIsCaption] = useState(false);
    const [displayReplies, setDisplayReplies] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [editCommentInput, setEditCommentInput] = useState('');

    const [newRepliesToThisCommentByAuthUser, setNewRepliesToThisCommentByAuthUser] = useState([]);
    const [fetchedListOfReplies, setFetchedListOfReplies] = useState([]);
    const [replyIdsToExclude, setReplyIdsToExclude] = useState([]);

    const [elementsForCommentContent, setElementsForCommentContent] = useState([]);

    const [isCurrentlyFetchingReplies, setIsCurrentlyFetchingReplies] = useState(false);


    useEffect(() => {
        setIsCaption(authorStatusToAuthUser === 'Caption');

        finishSettingElementsForCommentContent();

        let newNewRepliesToThisCommentByAuthUser = newlyPostedRepliesByAuthUser
        .filter(newlyPostedAuthUserReply => id === newlyPostedAuthUserReply.parentCommentId);

        setNewRepliesToThisCommentByAuthUser(newNewRepliesToThisCommentByAuthUser);
    }, []);


    useEffect(() => {
        finishSettingElementsForCommentContent();
    }, [content]);


    useEffect(() => {
        let newNewRepliesToThisCommentByAuthUser = newlyPostedRepliesByAuthUser
        .filter(newlyPostedAuthUserReply => id === newlyPostedAuthUserReply.parentCommentId);

        if (newNewRepliesToThisCommentByAuthUser.length > newRepliesToThisCommentByAuthUser.length) {
            setDisplayReplies(true);
        } 
        setNewRepliesToThisCommentByAuthUser(newNewRepliesToThisCommentByAuthUser);
        
    }, [newlyPostedRepliesByAuthUser]);


    function finishSettingElementsForCommentContent() {
        const newElementsForCommentContent = [' '];

        let contentValue = content;
        
        while (contentValue.length > 0) {
            const indexOfNextAtSymbol = contentValue.indexOf('@');
            const indexOfNextHashtag = contentValue.indexOf('#');
        
            if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
                newElementsForCommentContent.push(<span>{contentValue}</span>);
                break;
            } 
            else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 &&
            indexOfNextHashtag < indexOfNextAtSymbol)) {
                newElementsForCommentContent.push(<span>{contentValue.substring(0, indexOfNextHashtag)}</span>);
        
                contentValue = contentValue.substring(indexOfNextHashtag);
                let indexOfSpaceAfterHashtagUsed = contentValue.indexOf(" ");
                
                if (indexOfSpaceAfterHashtagUsed === -1) indexOfSpaceAfterHashtagUsed = contentValue.length;
        
                const hashtagUsed = contentValue.substring(0, indexOfSpaceAfterHashtagUsed);
                newElementsForCommentContent.push(
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
        
                contentValue = contentValue.substring(indexOfSpaceAfterHashtagUsed);
            } 
            else {
                newElementsForCommentContent.push(<span>{contentValue.substring(0, indexOfNextAtSymbol)}</span>);
        
                contentValue = contentValue.substring(indexOfNextAtSymbol);
                let indexOfSpaceAfterMentionedUsername = contentValue.indexOf(" ");
        
                if (indexOfSpaceAfterMentionedUsername === -1) indexOfSpaceAfterMentionedUsername = contentValue.length;
        
                const mentionedUsername = contentValue.substring(0, indexOfSpaceAfterMentionedUsername);
                newElementsForCommentContent.push(
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
        
                contentValue = contentValue.substring(indexOfSpaceAfterMentionedUsername);
            }
        }

        setElementsForCommentContent(newElementsForCommentContent);
    }


    function toggleDisplayReplies() {
        if(!displayReplies && fetchedListOfReplies.length == 0) {
            fetchBatchOfAdditionalReplies();
        }

        setDisplayReplies(!displayReplies);
    }


    function toggleEditMode() {
        setEditCommentInput('');
        setEditMode(!editMode);
    }


    function updateEditCommentInput(event) {
        setEditCommentInput(event.target.value);
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


    async function toggleLikeComment() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like comments');
            return;
        }

        if(!isLikedByAuthUser) {
            likeComment();
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeLikeFromPostOrComment/${authUserId}/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    showErrorPopup('The server had trouble removing your like of this comment');
                }
                else {
                    updateCommentDetails(
                        id,
                        {
                            isLikedByAuthUser: false,
                            numLikes: numLikes - 1
                        }
                    );
                }
            }
            catch (error) {
                showErrorPopup(
                    'There was trouble connecting to the server to remove your like of this comment'
                );
            }
        }
    }


    async function likeComment() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like comments');
            return;
        }

        if(!isLikedByAuthUser) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addLikeToPostOrComment/${authUserId}/${id}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    showErrorPopup('The server had trouble adding your like to this comment');
                }
                else {
                    updateCommentDetails(
                        id,
                        {
                            isLikedByAuthUser: true,
                            numLikes: numLikes + 1
                        }
                    );
                }
            }
            catch (error) {
                showErrorPopup(
                    'There was trouble connecting to the server to add your like to this comment'
                );
            }
        }
    }


    async function editComment() {
        try {
            const response = await fetch(
            "http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `mutation ($authUserId: Int!, $commentId: Int!, $newCommentContent: String!) {
                        editComment(authUserId: $authUserId, commentId: $commentId, newCommentContent: $newCommentContent)
                    }`,
                    variables: {
                        authUserId: authUserId,
                        commentId: id,
                        newCommentContent: editCommentInput
                    }
                }),
                credentials: 'include'
            });
    
            if (!response.ok) {
                showErrorPopup(
                    'The server had trouble updating your comment'
                );
            }
            else {
                notifyParentToEditComment(id, editCommentInput);
                toggleEditMode();
            }
        }
        catch (error) {
            showErrorPopup(
                'There was trouble connecting to the server to update your comment'
            );
        }
    }


    async function deleteComment() {
        try {
            const response = await fetch(
            "http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `mutation ($authUserId: Int!, $commentId: Int!) {
                        deleteComment(authUserId: $authUserId, commentId: $commentId)
                    }`,
                    variables: {
                        authUserId: authUserId,
                        commentId: id
                    }
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                showErrorPopup(
                    'The server had trouble deleting your comment'
                );
            }
            else {
                notifyParentToDeleteComment(id);
            }
        }
        catch (error) {
            showErrorPopup(
                'There was trouble connecting to the server to delete your comment'
            );
        }
    }


    async function fetchBatchOfAdditionalReplies() {
        if (isCurrentlyFetchingReplies) {
            return;
        }

        setIsCurrentlyFetchingReplies(true);
        
        try {
            const response = await fetch(
            'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `query ($authUserId: Int!, $commentId: Int!, $replyIdsToExclude: [Int!]!, $maxBatchSize: Int!) {
                        getBatchOfRepliesOfComment(
                            authUserId: $authUserId, commentId: $commentId, replyIdsToExclude: $replyIdsToExclude,
                            maxBatchSize: $maxBatchSize
                        )
                    }`,
                    variables: {
                        authUserId: authUserId,
                        commentId: id,
                        replyIdsToExclude: replyIdsToExclude,
                        maxBatchSize: numReplies - fetchedListOfReplies.length - newRepliesToThisCommentByAuthUser.length
                    }
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                showErrorPopup('The server had trouble getting the replies of this comment.');
            }
            else {
                let repliesOfComment = await response.json();
                repliesOfComment = repliesOfComment.data.getBatchOfRepliesOfComment;
                repliesOfComment = repliesOfComment.map(reply => {
                    reply.datetime = formatDatetimeString(reply.datetime);
                    return reply;
                });
                
                fetchAllTheNecessaryInfo(repliesOfComment.map(reply => reply.authorId));
                let newFetchedListOfReplies = [...repliesOfComment, ...fetchedListOfReplies];
                setFetchedListOfReplies(newFetchedListOfReplies);

                let newReplyIdsToExclude = [...replyIdsToExclude];
                for(let replyOfComment of repliesOfComment) {
                    newReplyIdsToExclude.push(replyOfComment.id);
                }
                setReplyIdsToExclude(newReplyIdsToExclude);
            }
        }
        catch (error) {
            showErrorPopup(
                'There was trouble connecting to the server to get the replies of this comment.'
            );
        }

        setIsCurrentlyFetchingReplies(false);
    }


    return (
        <>
            <div style={{display: 'flex', gap: '1em', width: '33em', position: 'relative', paddingLeft: '0.5em'}}>
                <a  href={`http://34.111.89.101/profile/${authorUsername}`} target="_blank" rel="noopener noreferrer">
                    <img src={authorPfp} style={{height: '3em', width: '3em', objectFit: 'contain'}}/>
                </a>
                

                <div style={{display: 'flex', flexDirection: 'column', marginTop: '-1em', alignItems: 'start'}}>
                    {!editMode &&
                        (
                            <p onDoubleClick={!isCaption ? likeComment : null} style={{marginBottom: '0em', fontSize: '0.95em',
                            textAlign: 'start', maxWidth: '22em', overflowWrap: 'break-word'}}>
                                <span style={{ display: 'inline-flex', alignItems: 'center'}}>
                                    <a
                                        href={`http://34.111.89.101/profile/${authorUsername}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ fontWeight: 'bold'}}
                                    >
                                        { authorUsername }
                                    </a>

                                    {authorIsVerified &&
                                        (
                                            <img src={verifiedBlueCheck} style={{height: '1.4em',
                                            width: '1.4em', marginLeft: '-0.1em', pointerEvents: 'none', objectFit: 'contain'}}/>
                                        )
                                    }
                                </span>

                                {elementsForCommentContent}
                            </p>
                        )
                    }

                    {editMode &&
                        (
                            <input value={editCommentInput} onChange={updateEditCommentInput}
                            placeholder={content} style={{border: 'none', fontFamily: 'Arial', fontSize: '1em',
                            width: '130%', outline: 'none', padding: '1em 1em', marginLeft: '-1em', marginTop:
                            '0.8em'}}/>
                        )
                    }

                    <div style={{display: 'flex', gap :'1em', alignItems: 'center', fontSize: '0.91em', color: 'gray'}}>
                        <p style={{maxWidth: '6em', textAlign: 'start', overflowWrap: 'break-word'}}>
                            { datetime }
                        </p>

                        {!isCaption &&
                            (
                                <b onClick={() => showLikersPopup(id)}
                                style={{cursor: 'pointer', maxWidth: '8em', textAlign: 'start', overflowWrap: 'break-word'}}>
                                    { numLikes.toLocaleString() } { numLikes !== 1 ? 'likes' : 'like' }
                                </b>
                            )
                        }

                        {!isCaption &&
                            (
                                <b onClick={() => replyToComment({id: id, authorUsername: authorUsername, content: content,
                                numReplies: numReplies})}
                                style={{cursor: 'pointer'}}>
                                    Reply
                                </b>
                            )
                        }

                        {(authorStatusToAuthUser === 'Stranger' && isEdited) &&
                            (
                                <p>• Edited</p>
                            )
                        }

                        {authorStatusToAuthUser !== 'Stranger' &&
                            (
                                <p>• {authorStatusToAuthUser} {isEdited ? '(Edited)' : ''}</p>
                            )
                        }
                    </div>

                    {authUserId == authorId &&
                        (
                            <div style={{display: 'flex', gap :'1em', alignItems: 'center'}}>
                                {!editMode &&
                                    (
                                        <img onClick={toggleEditMode} src={pencilIcon} className="iconToBeAdjustedForDarkMode"
                                        style={{height: '1.2em', width: '1.2em', objectFit: 'contain', cursor: 'pointer'}}/>
                                    )
                                }

                                {editMode &&
                                    (
                                        <>
                                            <button onClick={toggleEditMode} style={{cursor: 'pointer', padding: '0.6em 0.85em',
                                            color: 'white', backgroundColor: 'black', border: 'none',
                                            borderRadius: '1em'}}>
                                                Cancel Edit
                                            </button>

                                            {editCommentInput !== content &&
                                                (
                                                    <button onClick={editComment} style={{cursor: 'pointer', padding: '0.6em 0.85em',
                                                    color: 'white', backgroundColor: '#4791ff', border: 'none',
                                                    borderRadius: '1em'}}>
                                                        Save Edit
                                                    </button>
                                                )
                                            }
                                        </>
                                    )
                                }

                                <img onClick={deleteComment} src={trashIcon} style={{height: '0.9em', width: '0.9em',
                                objectFit: 'contain', cursor: 'pointer', filter: 'brightness(5) contrast(0)'}}/>
                            </div>
                        )
                    }

                    {isLikedByPostAuthor &&
                        (
                            <p style={{fontSize: '0.88em', color: 'gray', display: 'flex', alignItems: 'center',
                            gap: '0.5em', marginBottom: '0em'}}>
                                <img src={uniqueRedHeart} style={{pointerEvents: 'none', height: '1em', width: '1em', objectFit:
                                'contain'}}/>
                                <span>author likes this comment</span>
                            </p>
                        )
                    }

                    {(numReplies > 0) &&
                        (
                            <>
                                {!displayReplies &&
                                    (
                                        <p onClick={toggleDisplayReplies} style={{color: 'gray', fontSize: '0.92em',
                                        cursor: 'pointer'}}>
                                            ───
                                            <b style={{marginLeft: '1em'}}>
                                                View replies ({numReplies.toLocaleString()})
                                            </b>
                                        </p>
                                    )
                                }

                                {(displayReplies && numReplies > fetchedListOfReplies.length +
                                newRepliesToThisCommentByAuthUser.length) &&
                                    (
                                        <p onClick={fetchBatchOfAdditionalReplies} style={{color: 'gray', fontSize: '0.92em', cursor:
                                        'pointer'}}>
                                            ───
                                            <b style={{marginLeft: '1em'}}>
                                            View replies ({ (
                                                numReplies - fetchedListOfReplies.length - newRepliesToThisCommentByAuthUser.length
                                            ).toLocaleString() })
                                            </b>
                                        </p>
                                    )
                                }

                                {(displayReplies && !isCurrentlyFetchingReplies) &&
                                    (
                                        <p onClick={toggleDisplayReplies} style={{color: 'gray', fontSize: '0.92em',
                                        cursor: 'pointer'}}>
                                            ───
                                            <b style={{marginLeft: '1em'}}>
                                                Hide replies
                                            </b>
                                        </p>
                                    )
                                }
                            </>
                        )
                    }
                </div>

                {(!isLikedByAuthUser && !isCaption) &&
                    (
                        <img src={blankHeartIcon} onClick={likeComment} className="iconToBeAdjustedForDarkMode" style={{height:
                        '1.2em', width: '1.2em', objectFit: 'contain', cursor: 'pointer', position: 'absolute', right: '12%', top:
                        '8%'}}/>
                    )
                }

                {isLikedByAuthUser &&
                    (
                        <img src={redHeartIcon} onClick={toggleLikeComment} style={{height: '1.2em', width: '1.2em', objectFit:
                        'contain', cursor: 'pointer', position: 'absolute', right: '12%', top: '8%'}}/>
                    )
                }
            </div>

            {isCurrentlyFetchingReplies &&
                (
                    <img src={loadingAnimation} style={{height: '2em', width: '2em', marginLeft: '2em', marginTop: '1em',
                    objectFit: 'contain', pointerEvents: 'none'}}/>
                )
            }

            {displayReplies &&
                (
                    <div style={{borderStyle: 'solid', marginLeft: '1.5em', paddingLeft: '5em', borderColor: 'lightgray', borderTop:
                    'none', borderBottom: 'none', borderRight: 'none', display: 'flex', flexDirection: 'column', alignItems:
                    'start', justifyContent: 'start', gap: '1.5em', borderWidth: '0.07em'}}>
                        {
                            newRepliesToThisCommentByAuthUser.map(newAuthUserReply =>
                                (
                                    <Comment
                                        key={newAuthUserReply.id}
                                        id={newAuthUserReply.id}
                                        authUserId={authUserId}
                                        isLikedByAuthUser={newAuthUserReply.isLikedByAuthUser}
                                        newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                        authorId={authUserId}
                                        authorUsername={newAuthUserReply.authorUsername}
                                        authorIsVerified={usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false}
                                        authorPfp={usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp}
                                        authorStatusToAuthUser={'You'}
                                        isEdited={newAuthUserReply.isEdited}
                                        datetime={newAuthUserReply.datetime}
                                        content={newAuthUserReply.content}
                                        isLikedByPostAuthor={false}
                                        numLikes={newAuthUserReply.numLikes}
                                        numReplies={newAuthUserReply.numReplies}
                                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                        showErrorPopup={showErrorPopup}
                                        updateCommentDetails={updateCommentDetails}
                                        replyToComment={replyToComment}
                                        showLikersPopup={showLikersPopup}
                                        fetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                        notifyParentToEditComment={notifyParentToEditComment}
                                        notifyParentToDeleteComment={notifyParentToDeleteComment}
                                    />
                                )
                            )
                        }

                        {
                            fetchedListOfReplies.map(fetchedReply =>
                                (
                                    <Comment
                                        key={fetchedReply.id}
                                        id={fetchedReply.id}
                                        authUserId={authUserId}
                                        isLikedByAuthUser={fetchedReply.isLikedByAuthUser}
                                        newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                        authorId={fetchedReply.authorId}
                                        authorUsername={fetchedReply.authorUsername}
                                        authorIsVerified={
                                            usersAndTheirRelevantInfo[fetchedReply.authorId]?.isVerified ?? false
                                        }
                                        authorPfp={usersAndTheirRelevantInfo[fetchedReply.authorId]?.profilePhoto ?? defaultPfp}
                                        authorStatusToAuthUser={fetchedReply.authorStatusToAuthUser}
                                        isEdited={fetchedReply.isEdited}
                                        datetime={fetchedReply.datetime}
                                        content={fetchedReply.content}
                                        isLikedByPostAuthor={fetchedReply.isLikedByPostAuthor}
                                        numLikes={fetchedReply.numLikes}
                                        numReplies={fetchedReply.numReplies}
                                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                        showErrorPopup={showErrorPopup}
                                        updateCommentDetails={updateCommentDetails}
                                        replyToComment={replyToComment}
                                        showLikersPopup={showLikersPopup}
                                        fetchAllTheNecessaryInfo={fetchAllTheNecessaryInfo}
                                        notifyParentToEditComment={notifyParentToEditComment}
                                        notifyParentToDeleteComment={notifyParentToDeleteComment}
                                    />
                                )
                            )
                        }
                    </div>
                )
            }
        </>     
    );
}

export default Comment;