import { useEffect, useState } from 'react';

import blankHeartIcon from '../assets/images/blankHeartIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import uniqueRedHeart from '../assets/images/likePostAnimationHeartIcon.webp';
import pencilIcon from '../assets/images/pencilIcon.png';
import pinIcon from '../assets/images/pinIcon.png';
import redHeartIcon from '../assets/images/redHeartIcon.png';
import trashIcon from '../assets/images/trashIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

function Comment({id, username, isVerified, profilePhoto, isEdited, datetime, commentContent, numLikes, numReplies,
commenterStatus, isLikedByAuthUser, authUser, notifyParentToShowErrorPopup, isLikedByAuthor,
notifyParentToUpdateCommentDetails, isPinned, notifyParentToReplyToComment, notifyParentToShowLikersPopup,
notifyParentToFetchAllTheNecessaryInfo, usersAndTheirRelevantInfo, notifyParentToDeleteComment,
notifyParentToEditComment, newlyPostedRepliesByAuthUser}) {
    const [isCaption, setIsCaption] = useState(false);
    const [displayReplies, setDisplayReplies] = useState(false);
    const [fetchedListOfReplies, setFetchedListOfReplies] = useState([]);
    const [elementsForCommentContent, setElementsForCommentContent] = useState([]);
    const [replyIdsToExclude, setReplyIdsToExclude] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editCommentInput, setEditCommentInput] = useState('');
    const [newRepliesToThisCommentByAuthUser, setNewRepliesToThisCommentByAuthUser] = useState([]);

    useEffect(() => {
        setIsCaption(commenterStatus==='Caption');
    }, []);

    useEffect(() => {
        finishSettingElementsForCommentContent();
    }, [commentContent]);

    useEffect(() => {
        let newNewRepliesToThisCommentByAuthUser = newlyPostedRepliesByAuthUser
        .filter(newlyPostedReply => id === newlyPostedReply.idOfParentComment);

        if (newNewRepliesToThisCommentByAuthUser.length > newRepliesToThisCommentByAuthUser.length) {
            setDisplayReplies(true);
        } 
        setNewRepliesToThisCommentByAuthUser(newNewRepliesToThisCommentByAuthUser);
        
    }, [newlyPostedRepliesByAuthUser]);


    function finishSettingElementsForCommentContent() {
        const newElementsForCommentContent = [' '];

        let content = commentContent;
        while (content.length > 0) {
            const indexOfNextAtSymbol = content.indexOf('@');
            const indexOfNextHashtag = content.indexOf('#');
        
            if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
                newElementsForCommentContent.push(<span>{content}</span>);
                break;
            } 
            else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 &&
            indexOfNextHashtag < indexOfNextAtSymbol)) {
                newElementsForCommentContent.push(<span>{content.substring(0, indexOfNextHashtag)}</span>);
        
                content = content.substring(indexOfNextHashtag);
                let indexOfSpaceAfterHashtagUsed = content.indexOf(" ");
                
                if (indexOfSpaceAfterHashtagUsed === -1) indexOfSpaceAfterHashtagUsed = content.length;
        
                const hashtagUsed = content.substring(0, indexOfSpaceAfterHashtagUsed);
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
        
                content = content.substring(indexOfSpaceAfterHashtagUsed);
            } 
            else {
                newElementsForCommentContent.push(<span>{content.substring(0, indexOfNextAtSymbol)}</span>);
        
                content = content.substring(indexOfNextAtSymbol);
                let indexOfSpaceAfterMentionedUsername = content.indexOf(" ");
        
                if (indexOfSpaceAfterMentionedUsername === -1) indexOfSpaceAfterMentionedUsername = content.length;
        
                const mentionedUsername = content.substring(0, indexOfSpaceAfterMentionedUsername);
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
        
                content = content.substring(indexOfSpaceAfterMentionedUsername);
            }
        }

        setElementsForCommentContent(newElementsForCommentContent);
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

    async function toggleLikeComment() {
        if(!isLikedByAuthUser) {
            likeComment();
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeCommentLike/${authUser}/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    notifyParentToShowErrorPopup('The server had trouble removing your like of this comment');
                }
                else {
                    notifyParentToUpdateCommentDetails(
                        id,
                        {
                            isLikedByAuthUser: false,
                            numLikes: numLikes-1
                        }
                    );
                }
            }
            catch (error) {
                notifyParentToShowErrorPopup(
                    'There was trouble connecting to the server to remove your like of this comment'
                );
            }
        }
    }

    async function likeComment() {
        if(!isLikedByAuthUser) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addCommentLike/${authUser}/${id}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    notifyParentToShowErrorPopup('The server had trouble adding your like to this comment');
                }
                else {
                    notifyParentToUpdateCommentDetails(
                        id,
                        {
                            isLikedByAuthUser: true,
                            numLikes: numLikes+1
                        }
                    );
                }
            }
            catch (error) {
                notifyParentToShowErrorPopup(
                    'There was trouble connecting to the server to add your like to this comment'
                );
            }
        }
    }

    function toggleDisplayReplies() {
        if(!displayReplies && fetchedListOfReplies.length==0) {
            fetchAdditionalReplies();
        }
        setDisplayReplies(!displayReplies);
    }

    async function fetchAdditionalReplies() { 
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getRepliesOfComment/${authUser}/${id}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    replyIdsToExclude: replyIdsToExclude,
                    limit: numReplies - fetchedListOfReplies.length
                }),
                credentials: 'include'
            });
            if (!response.ok) {
                notifyParentToShowErrorPopup('The server had trouble getting the replies of this comment.');
            }
            else {
                const repliesOfComment = await response.json();
                notifyParentToFetchAllTheNecessaryInfo(repliesOfComment);
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
            notifyParentToShowErrorPopup(
                'There was trouble connecting to the server to get the replies of this comment.'
            );
        }
    }

    async function editComment() {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/editComment/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    content: editCommentInput,
                    datetime: new Date()
                }),
                credentials: 'include'
            });
            if (!response.ok) {
                notifyParentToShowErrorPopup(
                    'The server had trouble updating your comment'
                );
            }
            else {
                notifyParentToEditComment(id, editCommentInput);
                toggleEditMode();
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(
                'There was trouble connecting to the server to update your comment'
            );
        }
    }

    async function deleteComment() {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/deleteComment/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                notifyParentToShowErrorPopup(
                    'The server had trouble deleting your comment'
                );
            }
            else {
                notifyParentToDeleteComment(id);
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(
                'There was trouble connecting to the server to delete your comment'
            );
        }
    }
    
    function toggleEditMode() {
        setEditCommentInput('');
        setEditMode(!editMode);
    }

    function updateEditCommentInput(event) {
        setEditCommentInput(event.target.value);
    }

    return (
        <>
            <div style={{display: 'flex', alignItems: 'start', justifyContent: 'start', gap: '1em', width: '33em',
            position: 'relative', paddingLeft: '0.5em'}}>
                <a  href={`http://34.111.89.101/profile/${username}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    <img src={profilePhoto} style={{height: '3em', width: '3em', objectFit: 'contain'}}/>
                </a>
                

                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', marginTop: '-1em'}}>
                    {!editMode &&
                        (
                            <p onDoubleClick={!isCaption ? likeComment : null} style={{maxWidth: '68%', overflowWrap: 'break-word', 
                            textAlign: 'start', marginBottom: '0em', fontSize: '0.95em'}}>
                                <span style={{ display: 'inline-flex', alignItems: 'center'}}>
                                    <a
                                        href={`http://34.111.89.101/profile/${username}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        {username}
                                    </a>

                                    {isVerified &&
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
                            placeholder={commentContent} style={{border: 'none', fontFamily: 'Arial', fontSize: '1em',
                            width: '130%', outline: 'none', padding: '1em 1em', marginLeft: '-1em'}}/>
                        )
                    }

                    <div style={{display: 'flex', gap :'1em', alignItems: 'center', fontSize: '0.91em', color: 'gray'}}>
                        {isPinned &&
                            (
                                <img src={pinIcon} style={{pointerEvents: 'none', height: '0.8em', width: '0.8em',
                                objectFit: 'contain',  filter: 'brightness(5) contrast(0)'}}/>
                            )
                        }

                        <p>{formatDatetimeString(datetime)}</p>

                        {!isCaption &&
                            (
                                <b onClick={() => notifyParentToShowLikersPopup('comment', id)}
                                style={{cursor: 'pointer'}}>
                                    {numLikes.toLocaleString()} {numLikes!==1 ? 'likes' : 'like'}
                                </b>
                            )
                        }

                        {!isCaption &&
                            (
                                <b onClick={() => notifyParentToReplyToComment({
                                    id: id,
                                    username: username,
                                    content: commentContent
                                })}
                                style={{cursor: 'pointer'}}>
                                    Reply
                                </b>
                            )
                        }

                        {(commenterStatus==='Stranger' && isEdited) &&
                            (
                                <p>• Edited</p>
                            )
                        }

                        {commenterStatus!=='Stranger' &&
                            (
                                <p>• {commenterStatus} {isEdited ? '(Edited)' : ''}</p>
                            )
                        }
                    </div>

                    {username === authUser &&
                        (
                            <div style={{display: 'flex', gap :'1em', alignItems: 'center'}}>
                                {!editMode &&
                                    (
                                        <img onClick={toggleEditMode} src={pencilIcon}
                                        className="iconToBeAdjustedForDarkMode"
                                        style={{height: '1.2em', width: '1.2em', objectFit: 'contain',
                                        cursor: 'pointer'}}/>
                                    )
                                }

                                {editMode &&
                                    (
                                        <>
                                            <button onClick={toggleEditMode} style={{cursor: 'pointer', padding:
                                            '0.6em 0.85em', color: 'white', backgroundColor: 'black', border: 'none',
                                            borderRadius: '1em'}}>
                                                Cancel Edit
                                            </button>

                                            {editCommentInput !== commentContent &&
                                                (
                                                    <button onClick={editComment} style={{cursor: 'pointer',
                                                    padding: '0.6em 0.85em', color: 'white', backgroundColor: '#4791ff',
                                                    border: 'none', borderRadius: '1em'}}>
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

                    {isLikedByAuthor &&
                        (
                            <p style={{fontSize: '0.88em', color: 'gray', display: 'flex', alignItems: 'center',
                            gap: '0.5em', marginTop: '0em', marginBottom: '0em'}}>
                                <img src={uniqueRedHeart} style={{pointerEvents: 'none', height: '1em', width: '1em',
                                objectFit: 'contain'}}/>
                                <span>author likes this comment</span>
                            </p>
                        )
                    }

                    {(!isCaption && numReplies>0) &&
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

                                {(displayReplies && numReplies > fetchedListOfReplies.length) &&
                                    (
                                        <p onClick={fetchAdditionalReplies} style={{color: 'gray', fontSize: '0.92em', cursor: 'pointer'}}>
                                            ───
                                            <b style={{marginLeft: '1em'}}>
                                                View replies ({(numReplies - fetchedListOfReplies.length).toLocaleString()})
                                            </b>
                                        </p>
                                    )
                                }

                                {displayReplies &&
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
                        <img src={blankHeartIcon} onClick={toggleLikeComment}
                        className="iconToBeAdjustedForDarkMode"
                        style={{height: '1.2em', width: '1.2em', objectFit: 'contain',
                        cursor: 'pointer', position: 'absolute', right: '12%', top: '20%'}}/>
                    )
                }

                {isLikedByAuthUser &&
                    (
                    <img src={redHeartIcon} onClick={toggleLikeComment}
                        style={{height: '1.2em', width: '1.2em', objectFit: 'contain',
                        cursor: 'pointer', position: 'absolute', right: '12%', top: '20%'}}/>
                    )
                }
            </div>

            {displayReplies &&
                (
                    <div style={{marginLeft: '3em', borderStyle: 'solid', paddingLeft: '2em',
                    borderColor: 'lightgray', borderTop: 'none', borderBottom: 'none', borderRight: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start',
                    gap: '1.5em'}}>
                        {
                            newRepliesToThisCommentByAuthUser.map(newReplyDetails =>
                                (
                                    <Comment
                                        key={newReplyDetails.id}
                                        id={newReplyDetails.id}
                                        username={authUser}
                                        profilePhoto={
                                            (
                                                usersAndTheirRelevantInfo &&
                                                authUser in usersAndTheirRelevantInfo &&
                                                'profilePhoto' in usersAndTheirRelevantInfo[authUser]
                                            ) ?
                                                usersAndTheirRelevantInfo[authUser].profilePhoto :
                                                defaultPfp
                                        }
                                        isVerified={
                                            (
                                                usersAndTheirRelevantInfo &&
                                                authUser in usersAndTheirRelevantInfo &&
                                                'isVerified' in usersAndTheirRelevantInfo[authUser]
                                            ) ?
                                                usersAndTheirRelevantInfo[authUser].isVerified :
                                                false
                                        }
                                        isEdited={newReplyDetails.isEdited}
                                        datetime={newReplyDetails.datetime}
                                        commentContent={newReplyDetails.content}
                                        numLikes={newReplyDetails.numLikes}
                                        numReplies={newReplyDetails.numReplies}
                                        commenterStatus={'You'}
                                        authUser={authUser}
                                        isLikedByAuthUser={newReplyDetails.isLikedByAuthUser}
                                        isLikedByAuthor={false}
                                        notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                                        notifyParentToUpdateCommentDetails={notifyParentToUpdateCommentDetails}
                                        notifyParentToReplyToComment={notifyParentToReplyToComment}
                                        notifyParentToShowLikersPopup={notifyParentToShowLikersPopup}
                                        isPinned={false}
                                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                        newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                        notifyParentToFetchAllTheNecessaryInfo={notifyParentToFetchAllTheNecessaryInfo}
                                        notifyParentToDeleteComment={notifyParentToDeleteComment}
                                        notifyParentToEditComment={notifyParentToEditComment}
                                    />
                                )
                            )
                        }

                        {
                            fetchedListOfReplies.map(replyDetails =>
                                (
                                    <Comment
                                        key={replyDetails.id}
                                        id={replyDetails.id}
                                        username={replyDetails.username}
                                        profilePhoto={
                                            (
                                                usersAndTheirRelevantInfo &&
                                                replyDetails.username in usersAndTheirRelevantInfo &&
                                                'profilePhoto' in usersAndTheirRelevantInfo[
                                                    replyDetails.username
                                                ]
                                            ) ?
                                                usersAndTheirRelevantInfo[replyDetails.username].profilePhoto :
                                                defaultPfp
                                        }
                                        isVerified={
                                            (
                                                usersAndTheirRelevantInfo &&
                                                replyDetails.username in usersAndTheirRelevantInfo &&
                                                'isVerified' in usersAndTheirRelevantInfo[
                                                    replyDetails.username
                                                ]
                                            ) ?
                                                usersAndTheirRelevantInfo[replyDetails.username].isVerified :
                                                false
                                        }
                                        isEdited={replyDetails.isEdited}
                                        datetime={replyDetails.datetime}
                                        commentContent={replyDetails.content}
                                        numLikes={replyDetails.numLikes}
                                        numReplies={replyDetails.numReplies}
                                        commenterStatus={replyDetails.commenterStatus}
                                        authUser={authUser}
                                        isLikedByAuthUser={replyDetails.isLikedByAuthUser}
                                        isLikedByAuthor={replyDetails.isLikedByAuthor}
                                        notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                                        notifyParentToUpdateCommentDetails={notifyParentToUpdateCommentDetails}
                                        notifyParentToReplyToComment={notifyParentToReplyToComment}
                                        notifyParentToShowLikersPopup={notifyParentToShowLikersPopup}
                                        isPinned={false}
                                        usersAndTheirRelevantInfo={usersAndTheirRelevantInfo}
                                        newlyPostedRepliesByAuthUser={newlyPostedRepliesByAuthUser}
                                        notifyParentToFetchAllTheNecessaryInfo={notifyParentToFetchAllTheNecessaryInfo}
                                        notifyParentToDeleteComment={notifyParentToDeleteComment}
                                        notifyParentToEditComment={notifyParentToEditComment}
                                    />
                                )
                            )
                        }
                    </div>
                )
            }
        </>     
    )
}

export default Comment;