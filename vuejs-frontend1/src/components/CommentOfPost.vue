<template>
    <div style="display: flex; gap: 1em; width: 33em; position: relative; padding-left: 0.5em;">
        <a :href="`http://34.111.89.101/profile/${authorUsername}`" target="_blank" rel="noopener noreferrer">
            <img :src="authorPfp" style="height: 3em; width: 3em; object-fit: contain;"/>
        </a>

        <div style="display: flex; flex-direction: column; margin-top: -1em; align-items: start;">
            <p v-if="!editMode" @dblclick="() => { if (!isCaption) likeComment(); }" style="margin-bottom: 0em; font-size: 0.95em;
            text-align: start; max-width: 22em; overflow-wrap: break-word;">
                <span style="display: inline-flex; align-items: center;">
                    <a :href="`http://34.111.89.101/profile/${authorUsername}`"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style="font-weight: bold;"
                    >
                        {{ authorUsername }}
                    </a>

                    <img v-if="authorIsVerified" :src="verifiedBlueCheck" style="height: 1.4em; width: 1.4em; margin-left: -0.1em;
                    pointer-events: none; object-fit: contain;"/>
                </span>

                <component v-for="(el, index) in elementsForCommentContent"
                    :key="index"
                    :is="el"
                />
            </p>

            <input v-if="editMode" :value="editCommentInput" @change="updateEditCommentInput"
            :placeholder="content" style="border: none; font-family: Arial; font-size: 1em; width: 20em; outline: none; padding:
            1em 1em; margin-left: -1em; margin-top: 0.8em;"/>

            <div style="display: flex; gap: 1em; align-items: center; font-size: 0.91em; color: gray;">
                <p style="max-width: 6em; text-align: start; overflow-wrap: break-word;">
                    {{ datetime }}
                </p>

                <b v-if="!isCaption" @click="() => showLikersPopup(id)" style="cursor: pointer; max-width: 8em; text-align: start;
                overflow-wrap: break-word;">
                    {{ numLikes.toLocaleString() }} {{ numLikes !== 1 ? 'likes' : 'like' }}
                </b>

                <b v-if="!isCaption" @click="() => replyToComment({id: id, authorUsername: authorUsername, content: content})"
                style="cursor: pointer;">
                    Reply
                </b>

                <p v-if="authorStatusToAuthUser === 'Stranger' && isEdited">• Edited</p>

                <p v-if="authorStatusToAuthUser !== 'Stranger'">• {{ authorStatusToAuthUser }} {{ isEdited ? '(Edited)' : '' }}</p>
            </div>

            <div v-if="authUserId == authorId" style="display: flex; gap: 1em; align-items: center;">
                <img v-if="!editMode" @click="toggleEditMode" :src="pencilIcon" className="iconToBeAdjustedForDarkMode"
                style="height: 1.2em; width: 1.2em; object-fit: contain; cursor: pointer;"/>

                <template v-if="editMode">
                    <button @click="toggleEditMode" style="cursor: pointer; padding: 0.6em 0.85em; color: white; background-color:
                    black; border: none; border-radius: 1em;">
                        Cancel Edit
                    </button>

                    <button v-if="editCommentInput !== content" @click="editComment" style="cursor: pointer; padding: 0.6em 0.85em;
                    color: white; background-color: #4791ff; border: none; border-radius: 1em;">
                        Save Edit
                    </button>
                </template>

                <img @click="deleteComment" :src="trashIcon" className="iconToBeAdjustedForDarkMode"
                style="height: 0.9em; width: 0.9em; object-fit: contain; cursor: pointer; filter: brightness(5) contrast(0);"/>
            </div>

            <p v-if="isLikedByPostAuthor" style="font-size: 0.88em; color: gray; display: flex; align-items: center; gap: 0.5em;
            margin-bottom: 0em;">
                <img :src="uniqueRedHeart" style="pointer-events: none; height: 1em; width: 1em; object-fit: 'contain'"/>
                <span>author likes this comment</span>
            </p>

            <template v-if="numReplies > 0">
                <p v-if="!displayReplies" @click="toggleDisplayReplies" style="color: gray; font-size: 0.92em; cursor: pointer;">
                    ───
                    <b style="margin-left: 1em;">
                        View replies ({{ numReplies.toLocaleString() }})
                    </b>
                </p>

                <p v-if="displayReplies && numReplies > fetchedListOfReplies.length + newRepliesToThisCommentByAuthUser.length"
                @click="fetchBatchOfAdditionalReplies" style="color: gray; font-size: 0.92em; cursor: pointer;">
                    ───
                    <b style="margin-left: 1em;">
                        View replies ({{ (
                            numReplies - fetchedListOfReplies.length - newRepliesToThisCommentByAuthUser.length
                        ).toLocaleString() }})
                    </b>
                </p>

                <p v-if="displayReplies && !isCurrentlyFetchingReplies" @click="toggleDisplayReplies" style="color:
                gray; font-size: 0.92em; cursor: pointer;">
                    ───
                    <b style="margin-left: 1em;">
                        Hide replies
                    </b>
                </p>
            </template>
        </div>

        <img v-if="!isLikedByAuthUser && !isCaption" :src="blankHeartIcon" @click="likeComment" 
        class="iconToBeAdjustedForDarkMode" style="height: 1.2em; width: 1.2em; object-fit: contain; cursor: pointer; position:
        absolute; right: 12%; top: 8%;"/>

        <img v-if="isLikedByAuthUser" :src="redHeartIcon" @click="toggleLikeComment" style="height: 1.2em; width: 1.2em;
        object-fit: contain; cursor: pointer; position: absolute; right: 12%; top: 8%;"/>
    </div>

    <img v-if="isCurrentlyFetchingReplies" :src="loadingAnimation" style="height: 2em; width: 2em; margin-left: 2em; margin-top:
    1em; object-fit: contain; pointer-events: none;"/>

    <div v-if="displayReplies" style="border-style: solid; margin-left: 1.5em; padding-left: 5em; border-color: lightgray;
    border-top: none; border-bottom: none; border-right: none; display: flex; flex-direction: column; align-items:
    start; justify-content: start; gap: 1.5em; margin-top: 2em; border-width: 0.07em;">
        <CommentOfPost v-for="newAuthUserReply in newRepliesToThisCommentByAuthUser"
            :key="newAuthUserReply.id"
            :id="newAuthUserReply.id"
            :authUserId="authUserId"
            :isLikedByAuthUser="newAuthUserReply.isLikedByAuthUser"
            :newlyPostedRepliesByAuthUser="newlyPostedRepliesByAuthUser"
            :authorId="authUserId"
            :authorUsername="newAuthUserReply.authorUsername"
            :authorIsVerified="usersAndTheirRelevantInfo[authUserId]?.authorIsVerified ?? false"
            :authorPfp="usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp"
            :authorStatusToAuthUser="'You'"
            :isEdited="newAuthUserReply.isEdited"
            :datetime="newAuthUserReply.datetime"
            :content="newAuthUserReply.content"
            :isLikedByPostAuthor="false"
            :numLikes="newAuthUserReply.numLikes"
            :numReplies="newAuthUserReply.numReplies"
            :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
            :showErrorPopup="showErrorPopup"
            :updateCommentDetails="updateCommentDetails"
            :replyToComment="replyToComment"
            :showLikersPopup="showLikersPopup"
            :fetchAllTheNecessaryInfo="fetchAllTheNecessaryInfo"
            :notifyParentToEditComment="notifyParentToEditComment"
            :notifyParentToDeleteComment="notifyParentToDeleteComment"
        />

        <CommentOfPost v-for="fetchedReply in fetchedListOfReplies"
            :key="fetchedReply.id"
            :id="fetchedReply.id"
            :authUserId="authUserId"
            :isLikedByAuthUser="fetchedReply.isLikedByAuthUser"
            :newlyPostedRepliesByAuthUser="newlyPostedRepliesByAuthUser"
            :authorId="fetchedReply.authorId"
            :authorUsername="fetchedReply.authorUsername"
            :authorIsVerified="usersAndTheirRelevantInfo[fetchedReply.authorId]?.authorIsVerified ?? false"
            :authorPfp="usersAndTheirRelevantInfo[fetchedReply.authorId]?.profilePhoto ?? defaultPfp"
            :authorStatusToAuthUser="fetchedReply.authorStatusToAuthUser"
            :isEdited="fetchedReply.isEdited"
            :datetime="fetchedReply.datetime"
            :content="fetchedReply.content"
            :isLikedByPostAuthor="fetchedReply.isLikedByPostAuthor"
            :numLikes="fetchedReply.numLikes"
            :numReplies="fetchedReply.numReplies"
            :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
            :showErrorPopup="showErrorPopup"
            :updateCommentDetails="updateCommentDetails"
            :replyToComment="replyToComment"
            :showLikersPopup="showLikersPopup"
            :fetchAllTheNecessaryInfo="fetchAllTheNecessaryInfo"
            :notifyParentToEditComment="notifyParentToEditComment"
            :notifyParentToDeleteComment="notifyParentToDeleteComment"
        />
    </div>
</template>


<script setup>
    import blankHeartIcon from '../assets/images/blankHeartIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import uniqueRedHeart from '../assets/images/likePostAnimationHeartIcon.webp';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import pencilIcon from '../assets/images/pencilIcon.png';
import redHeartIcon from '../assets/images/redHeartIcon.png';
import trashIcon from '../assets/images/trashIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

    import { defineProps, h, onMounted, ref, watch } from 'vue';


    const props = defineProps({
        id: Number,

        authUserId: Number,
        isLikedByAuthUser: Boolean,
        newlyPostedRepliesByAuthUser: Array,

        authorId: Number,
        authorUsername: String,
        authorIsVerified: Boolean,
        authorPfp: String,
        authorStatusToAuthUser: String,

        isEdited: Boolean,
        datetime: String,
        content: String,
        isLikedByPostAuthor: Boolean,

        numLikes: Number,
        numReplies: Number,

        usersAndTheirRelevantInfo: Object,

        showErrorPopup: Function,
        updateCommentDetails: Function,
        replyToComment: Function,
        showLikersPopup: Function,
        fetchAllTheNecessaryInfo: Function,
        notifyParentToEditComment: Function,
        notifyParentToDeleteComment: Function,
    });
    
    const isCaption = ref(false);
    const displayReplies = ref(false);

    const editMode = ref(false);
    const editCommentInput = ref('');

    const newRepliesToThisCommentByAuthUser = ref([]);
    const fetchedListOfReplies = ref([]);
    const replyIdsToExclude = ref([]);

    const elementsForCommentContent = ref([]);

    const isCurrentlyFetchingReplies = ref(false);


    onMounted(() => {
        isCaption.value = props.authorStatusToAuthUser === 'Caption';

        finishSettingElementsForCommentContent();

        let newNewRepliesToThisCommentByAuthUser = props.newlyPostedRepliesByAuthUser
        .filter(newlyPostedAuthUserReply => props.id === newlyPostedAuthUserReply.parentCommentId);

        newRepliesToThisCommentByAuthUser.value = newNewRepliesToThisCommentByAuthUser;
    });

    
    watch(() => props.content, () => {
        finishSettingElementsForCommentContent();
    });


    watch(() => props.newlyPostedRepliesByAuthUser, () => {
        let newNewRepliesToThisCommentByAuthUser = props.newlyPostedRepliesByAuthUser
        .filter(newlyPostedAuthUserReply => props.id === newlyPostedAuthUserReply.parentCommentId);

        if (newNewRepliesToThisCommentByAuthUser.length > newRepliesToThisCommentByAuthUser.value.length) {
            displayReplies.value = true;
        } 

        newRepliesToThisCommentByAuthUser.value = newNewRepliesToThisCommentByAuthUser;
    });


    function finishSettingElementsForCommentContent() {
        const newElementsForCommentContent = [h('span', null, ' ')];
      
        let contentValue = props.content;
      
        while (contentValue.length > 0) {
          const indexOfNextAtSymbol = contentValue.indexOf('@');
          const indexOfNextHashtag = contentValue.indexOf('#');
      
          if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
            newElementsForCommentContent.push(h('span', null, contentValue));
            break;
          }
          else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 && indexOfNextHashtag < indexOfNextAtSymbol)) {
            newElementsForCommentContent.push(
              h('span', null, contentValue.substring(0, indexOfNextHashtag))
            );
      
            contentValue = contentValue.substring(indexOfNextHashtag);
            let indexOfSpaceAfterHashtagUsed = contentValue.indexOf(' ');
      
            if (indexOfSpaceAfterHashtagUsed === -1)
              indexOfSpaceAfterHashtagUsed = contentValue.length;
      
            const hashtagUsed = contentValue.substring(0, indexOfSpaceAfterHashtagUsed);
            newElementsForCommentContent.push(
              h(
                'a',
                {
                  href: `http://34.111.89.101/search/tags/${hashtagUsed.substring(1)}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  class: 'hashtagOrMention',
                  style: { color: '#71a3f5' }
                },
                hashtagUsed
              )
            );
      
            contentValue = contentValue.substring(indexOfSpaceAfterHashtagUsed);
          }
          else {
            newElementsForCommentContent.push(
              h('span', null, contentValue.substring(0, indexOfNextAtSymbol))
            );
      
            contentValue = contentValue.substring(indexOfNextAtSymbol);
            let indexOfSpaceAfterMentionedUsername = contentValue.indexOf(' ');
      
            if (indexOfSpaceAfterMentionedUsername === -1)
              indexOfSpaceAfterMentionedUsername = contentValue.length;
      
            const mentionedUsername = contentValue.substring(0, indexOfSpaceAfterMentionedUsername);
            newElementsForCommentContent.push(
              h(
                'a',
                {
                  href: `http://34.111.89.101/profile/${mentionedUsername.substring(1)}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  class: 'hashtagOrMention',
                  style: { color: '#71a3f5' }
                },
                mentionedUsername
              )
            );
      
            contentValue = contentValue.substring(indexOfSpaceAfterMentionedUsername);
          }
        }
      
        elementsForCommentContent.value = newElementsForCommentContent;
    }


    function toggleDisplayReplies() {
        if(!displayReplies.value && fetchedListOfReplies.value.length == 0) {
            fetchBatchOfAdditionalReplies();
        }

        displayReplies.value = !displayReplies.value;
    }

    
    function toggleEditMode() {
        editCommentInput.value = '';
        editMode.value = !editMode.value;
    }


    function updateEditCommentInput(event) {
        editCommentInput.value = event.target.value;
    }


    async function toggleLikeComment() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like comments');
            return;
        }

        if(!props.isLikedByAuthUser) {
            likeComment();
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeLikeFromPostOrComment/${props.authUserId}
                /${props.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    props.showErrorPopup('The server had trouble removing your like of this comment');
                }
                else {
                    props.updateCommentDetails(
                        props.id,
                        {
                            isLikedByAuthUser: false,
                            numLikes: props.numLikes - 1
                        }
                    );
                }
            }
            catch (error) {
                props.showErrorPopup(
                    'There was trouble connecting to the server to remove your like of this comment'
                );
            }
        }
    }


    async function likeComment() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like comments');
            return;
        }

        if(!props.isLikedByAuthUser) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addLikeToPostOrComment/${props.authUserId}/${props.id}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    props.showErrorPopup('The server had trouble adding your like to this comment');
                }
                else {
                    props.updateCommentDetails(
                        props.id,
                        {
                            isLikedByAuthUser: true,
                            numLikes: props.numLikes + 1
                        }
                    );
                }
            }
            catch (error) {
                props.showErrorPopup(
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
                        authUserId: props.authUserId,
                        commentId: props.id,
                        newCommentContent: editCommentInput.value
                    }
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                props.showErrorPopup(
                    'The server had trouble updating your comment'
                );
            }
            else {
                props.notifyParentToEditComment(props.id, editCommentInput.value);
                toggleEditMode();
            }
        }
        catch (error) {
            props.showErrorPopup(
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
                        authUserId: props.authUserId,
                        commentId: props.id
                    }
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                props.showErrorPopup(
                    'The server had trouble deleting your comment'
                );
            }
            else {
                props.notifyParentToDeleteComment(props.id);
            }
        }
        catch (error) {
            props.showErrorPopup(
                'There was trouble connecting to the server to delete your comment'
            );
        }
    }


    async function fetchBatchOfAdditionalReplies() {
        if (isCurrentlyFetchingReplies.value) {
            return;
        }

        isCurrentlyFetchingReplies.value = true;

        try {
            const response = await fetch(
            "http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `query ($authUserId: Int!, $commentId: Int!, replyIdsToExclude: [Int!]!, maxBatchSize: Int!) {
                        getBatchOfRepliesOfComment(
                            authUserId: $authUserId, commentId: $commentId, replyIdsToExclude: $replyIdsToExclude, maxBatchSize:
                            $maxBatchSize
                        )
                    }`,
                    variables: {
                        authUserId: props.authUserId,
                        commentId: props.id,
                        replyIdsToExclude: replyIdsToExclude.value,
                        maxBatchSize: props.numReplies - fetchedListOfReplies.value.length - newRepliesToThisCommentByAuthUser.value.length
                    }
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                props.showErrorPopup('The server had trouble getting additional replies of this comment.');
            }
            else {
                let repliesOfComment = await response.json();
                repliesOfComment = repliesOfComment.data.getBatchOfRepliesOfComment;
                
                props.fetchAllTheNecessaryInfo(repliesOfComment);
                let newFetchedListOfReplies = [...repliesOfComment, ...fetchedListOfReplies.value];
                fetchedListOfReplies.value = newFetchedListOfReplies;

                let newReplyIdsToExclude = [...replyIdsToExclude.value];
                for(let replyOfComment of repliesOfComment) {
                    newReplyIdsToExclude.push(replyOfComment.id);
                }
                replyIdsToExclude.value = newReplyIdsToExclude;
            }
        }
        catch (error) {
            props.showErrorPopup(
                'There was trouble connecting to the server to get additional replies of this comment.'
            );
        }

        isCurrentlyFetchingReplies.value = false;
    }
</script>