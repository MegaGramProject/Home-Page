<template>
    <div class="popup" :style="{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type === 'video') ||
    displaySectionsOfVidSlide) ? '90%' : '70%', height: '90%', display: 'flex', zIndex: zIndex}">
        <div ref="currSlideRef" :style="{height: '100%', width: ((displayTaggedAccountsOfSlide &&
        postDetails.slides[currSlideState].type === 'video') || displaySectionsOfVidSlide) ? '50%' : '58%',
        position: 'relative', backgroundColor: 'black'}">
            <template v-if="postDetails.slides[currSlideState].type === 'image'">
                <img :src="postDetails.slides[currSlideState].src" @dblclick="likePost" style="position: absolute;
                object-fit: cover; top: 0%; left: 0%; height: 100%; width: 100%;"/>

                <img v-if="currSlideState > 0" :src="nextSlideArrow" @click="changeSlide('decrement');"
                style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; left: 1%;
                top: 50%; transform: translateY(-50%) rotate(180deg);"/>

                <img v-if="currSlideState < postDetails.slides.length-1" :src="nextSlideArrow"
                @click="changeSlide('increment');" style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain;
                position: absolute; right: 1%; top: 50%; transform: translateY(-50%);"/>

                <PostDots
                    :numSlides="postDetails.slides.length"
                    :currSlide="currSlideState"
                    :currSlideIsImage="true"
                />

                <img v-if="postDetails.slides[currSlideState].taggedAccounts.length > 0" :src="taggedAccountsIcon"
                @click="toggleShowTaggedAccountsOfSlide" style="height: 2.4em; width: 2.4em; object-fit: contain; position:
                absolute; bottom: 2%; left: 3%; cursor: pointer;"/>

                <template v-if="displayTaggedAccountsOfSlide">
                    <a v-for="taggedAccountInfo in postDetails.slides[currSlideState].taggedAccounts"
                    :key="taggedAccountInfo[0]"
                    :href="`http://34.111.89.101/profile/${taggedAccountInfo[0]}`"
                    target="_blank" 
                    rel="noopener noreferrer"
                    :style="{color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '0.3em', padding: '0.3em 0.7em',
                    position: 'absolute', top: `${taggedAccountInfo[1]}%`, left: `${taggedAccountInfo[2]}%`, maxWidth: '10em',
                    textAlign: 'start', overflowWrap: 'break'}">
                        {{ taggedAccountInfo[0] }}
                    </a>
                </template>

                <img v-if="intervalIdForHeartAnimation !== null" :src="heartAnimationIcon" :style="{height: '6.6em', width:
                '6.6em', pointerEvents: 'none', objectFit: 'contain', position: 'absolute', top:
                `${heartAnimationCoordinates[1]}%`, left: `${heartAnimationCoordinates[0]}%`, transform:
                'translate(-50%, -50%)'}"/>
            </template>

            <template v-else>
                <video ref="vidSlideRef" controls :src="postDetails.slides[currSlideState].src" @dblclick="likePost"
                style="width: 100%; height: 100%; position: absolute; top: 0%; left: 0%;">
                    <track v-for="subtitlesInfo in postDetails.slides[currSlideState].subtitles"
                        :key="subtitlesInfo.langCode"
                        kind="subtitles"
                        :src="subtitlesInfo.src"
                        :srcLang="subtitlesInfo.langCode"
                        :label="languageCodeToLabelMappings[subtitlesInfo.langCode]"
                        :default="subtitlesInfo.default ?? false"
                    />
                </video>

                <img v-if="currSlideState > 0" :src="nextSlideArrow" @click="changeSlide('decrement');"
                style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; left: 1%;
                top: 50%; transform: translateY(-50%) rotate(180deg);"/>

                <img v-if="currSlideState < postDetails.slides.length-1" :src="nextSlideArrow"
                @click="changeSlide('increment');" style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain;
                position: absolute; right: 1%; top: 50%; transform: translateY(-50%);"/>

                <PostDots
                    :numSlides="postDetails.slides.length"
                    :currSlide="currSlideState"
                    :currSlideIsImage="false"
                />

                <img v-if="postDetails.slides[currSlideState].taggedAccounts.length > 0" :src="taggedAccountsIcon"
                @click="toggleShowTaggedAccountsOfSlide" style="height: 2.4em; width: 2.4em; object-fit: contain; position:
                absolute; bottom: 16%; left: 3%; cursor: pointer;"/>

                <img v-if="intervalIdForHeartAnimation !== null" :src="heartAnimationIcon" :style="{height: '6.6em', width:
                '6.6em', pointerEvents: 'none', objectFit: 'contain', position: 'absolute', top:
                `${heartAnimationCoordinates[1]}%`, left: `${heartAnimationCoordinates[0]}%`, transform:
                'translate(-50%, -50%)'}"/>
            </template>
        </div>

        <div v-if="displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type === 'video'" style="height: 100%;
        width: 27%; border-style: solid; border-color: lightgray; border-bottom: none; border-left: none; border-top: none;
        border-width: 0.06em; overflow-y: scroll;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4em 1.5em; border-style:
            solid; border-color: lightgray; border-width: 0.08em; border-top: none; border-left: none; border-right: none;">
                <h4>Tagged Accounts of this Video-Slide</h4>
                
                <img :src="thinGrayXIcon" @click="toggleShowTaggedAccountsOfSlide" style="cursor: pointer; height: 1.6em;
                width: 1.6em; object-fit: contain;"/>
            </div>

            <br/>

            <FollowUser v-for="taggedAccountInfo in postDetails.slides[currSlideState].taggedAccounts"
                :key="taggedAccountInfo[0]"
                :authUserId="authUserId"
                :userId="taggedAccountInfo[0]"
                :username="usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.username ?? `user ${taggedAccountInfo[0]}`"
                :userFullName="usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.fullName ?? 'Could not find full name'"
                :userPfp="usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.profilePhoto ?? defaultPfp"
                :originalFollowText="taggedAccountInfo[1]"
                :userIsVerified="usersAndTheirRelevantInfo[taggedAccountInfo[0]]?.isVerified ?? false"
                :showErrorPopup="showErrorPopup"
            />
        </div>

        <div v-else-if="displaySectionsOfVidSlide" style="height: 100%; width: 27%; border-style: solid; border-color
        lightgray; border-bottom: none; border-left: none; border-top: none; border-width: 0.06em; overflow-y: scroll;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4em 1.5em; border-style:
            solid; border-color: lightgray; border-width: 0.08em; border-top: none; border-left: none; border-right: none;">
                <h4>Sections of this Video-Slide</h4>
                
                <img :src="thinGrayXIcon" @click="toggleShowSectionsOfVidSlide" style="cursor: pointer; height: 1.6em;
                width: 1.6em; object-fit: contain;"/>
            </div>

            <br/>

            <div v-for="sectionInfo in postDetails.slides[currSlideState].sections" :key="sectionInfo[0]"
            class="videoSlideSection" @click="takeUserToSectionInVideo(sectionInfo[0])" style="display: flex; width: 100%;
            align-items: center; cursor: pointer; padding: 0.4em 1.5em; gap: 1.5em;">
                <img :src="slideToVidTimeToFrameMappings[currSlideState]?.[sectionInfo[0]] ?? defaultVideoFrame"
                style="pointer-events: none; height: 8em; width: 8em; object-fit: contain;"/>

                <div style="display: flex; flex-direction: column; align-items: start;">
                    <b>
                        {{ sectionInfo[2] }}
                    </b>
                    <p>
                        {{ sectionInfo[1] }}
                    </p>
                </div>
            </div>
        </div>

        <div :style="{height: '100%', width: ((displayTaggedAccountsOfSlide && postDetails.slides[currSlideState].type ===
        'video') || displaySectionsOfVidSlide) ? '23%' : '42%', overflowX: 'scroll', overflowY: 'scroll'}">
            <div style="width: 90%; display: flex; align-items: center; justify-content: space-between; padding: 0.5em 1em;">
                <div style="display: flex; align-items: center; gap: 1em;">
                    <UserIcon
                        :authUserId="authUserId"
                        :userId="mainPostAuthorId"
                        :username="postDetails.authorUsernames[0]"
                        :userPfp="mainPostAuthorInfo.profilePhoto ?? defaultPfp"
                        :inStoriesSection="false"
                        :userHasStories="mainPostAuthorInfo.hasStories ?? false"
                        :userHasUnseenStory="mainPostAuthorInfo.hasUnseenStory ?? false"
                        :userIsVerified="mainPostAuthorInfo.isVerified ?? false"
                        :showStoryViewer="showStoryViewer"
                    />

                    <div style="display: flex; flex-direction: column; align-items: start; gap: 0.5em;">
                        <p style="margin-bottom: 0em; max-width: 80%; text-align: start; overflow-wrap: break-word;">
                            <template v-for="(authorUsername, index) in postDetails.authorUsernames" :key="index">
                                <a
                                    :href="`http://34.111.89.101/profile/${authorUsername}`"
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style="font-weight: bold; display: inline-flex; align-items: center; word-break:
                                    break-word; margin-right: 0.2em;"
                                >
                                    {{ authorUsername }}
        
                                    <img v-if="(usersAndTheirRelevantInfo[postDetails.authorIds[index]]?.isVerified ?? false)"
                                    :src="verifiedBlueCheck" style="height: 1.4em; width: 1.4em; pointer-events: none;
                                    object-fit: contain; margin-left: -0.1em; margin-right: -0.2em;"/>
                                </a>
                    
                                <span v-if="index < postDetails.authorUsernames.length - 2" style="font-weight: bold;
                                margin-right: 0.2em;">, </span>
                    
                                <span v-if="index === postDetails.authorUsernames.length - 2 && index == 0"
                                style="font-weight: bold; margin-right: 0.2em;"> and </span>
                    
                                <span v-if="index === postDetails.authorUsernames.length - 2 && index > 0"
                                style="font-weight: bold; margin-right: 0.2em;">, and </span>
                            </template>
                        </p>

                        <a v-if="postDetails.locationOfPost !== null"
                        :href="`http://34.111.89.101/search/locations/${postDetails.locationOfPost}`"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style="font-size: 0.9em; margin-bottom: 0em; max-width: 80%; text-align: start; overflow-wrap:
                        break-word;">
                            {{ postDetails.locationOfPost }} 
                        </a>

                        <div v-if="bgMusicObject !== null" style="display: flex; align-items: center; gap: 0.8em; font-size: 0.9em;
                        margin-bottom: -0.5em; margin-top: -0.5em;">
                            <img :src="musicSymbol" class="iconToBeAdjustedForDarkMode" style="pointerEvents: none; height:
                            1.1em; width: 1.1em; object-fit: contain;"/>
                            
                            <p style="max-width: 14em; text-align: start; overflow-wrap: break-word;">
                                <b>{{ postDetails.bgMusic.title }}</b> • <b>{{ postDetails.bgMusic.artist }}</b>
                            </p>

                            <img v-if="!bgMusicIsPlaying" :src="playIcon" class="iconToBeAdjustedForDarkMode"
                            @click="togglePauseBackgroundMusic" style="cursor: pointer; height: 1.3em; width: 1.3em; object-fit:
                            contain;"/>

                            <img v-else :src="pauseIcon" class="iconToBeAdjustedForDarkMode" @click="togglePauseBackgroundMusic"
                            style="cursor: pointer; height: 1.5em; width: 1.5em; object-fit: contain;"/>
                        </div>

                        <a v-if="postDetails.adInfo !== null" :href="postDetails.adInfo.link"  target="_blank"
                        rel="noopener noreferrer" style="font-size: 0.9em;">
                            Sponsored
                        </a>
                    </div>
                </div>

                <img :src="threeHorizontalDots" class="iconToBeAdjustedForDarkMode" @click="showThreeDotsPopup(postDetails);"
                style="cursor: pointer; height: 2em; width: 2em; object-fit: contain;"
                />
            </div>


            <p v-if="!displaySectionsOfVidSlide && postDetails.slides[currSlideState].type === 'video' &&
            postDetails.slides[currSlideState].sections.length > 0" @click="toggleShowSectionsOfVidSlide" style="box-shadow:
            rgba(0, 0, 0, 0.24) 0px 3px 8px; padding: 0.5em 1em; cursor: pointer; border-radius: 2em; width: 15em;
            margin-left: 1em;">
                <small style="font-weight: bold;">
                    Show Sections of this Video-Slide
                </small>
            </p>

            <a v-if="postDetails.adInfo !== null" :href="postDetails.adInfo.link" style="font-weight: bold; font-size: 1.1em;
            width: 100%;">
                <div style="width: 100%; display: flex; align-items: center; gap: 1em;
                justify-content: start; border-style: solid; border-bottom: none;
                border-color: lightgray; border-width: 0.065em; padding: 1em 1em;
                border-left: none; border-right: none;">
                    <img :src="megaphone" style="height: 1.8em; width: 1.8em; object-fit: contain; pointer-events: none;"/>
                    
                    <p style="max-width: 77%; overflow-wrap: break-word; text-align: start;">
                        {{ postDetails.adInfo.callToAction }}
                    </p>
                </div>
            </a>

            <div style="display: flex; flex-direction: column; width: 100%; height: 61%; overflow-x: scroll; overflow-y:
            scroll; border-style: solid; border-left: none; border-right: none; border-color: lightgray; border-width:
            0.065em; padding: 2em 1em; position: relative; gap: 1.5em;">
                <CommentOfPost
                    :id="postDetails.caption.id"
                    :authUserId="authUserId"
                    :isLikedByAuthUser="false"
                    :newlyPostedRepliesByAuthUser="newlyPostedRepliesByAuthUser"
                    :authorId="postDetails.caption.authorId"
                    :authorUsername="postDetails.authorUsernames[postDetails.authorIds.indexOf(postDetails.caption.authorId)]"
                    :authorIsVerified="usersAndTheirRelevantInfo[postDetails.caption.authorId]?.isVerified ?? false"
                    :authorPfp="usersAndTheirRelevantInfo[postDetails.caption.authorId]?.profilePhoto ?? defaultPfp"
                    :authorStatusToAuthUser="'Caption'"
                    :isEdited="postDetails.caption.isEdited"
                    :datetime="postDetails.caption.datetime"
                    :content="postDetails.caption.content"
                    :isLikedByPostAuthor="false"
                    :numLikes="0"
                    :numReplies="0"
                    :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
                    :showErrorPopup="showErrorPopup"
                    :updateCommentDetails="updateCommentDetails"
                    :replyToComment="updateReplyingToCommentInfo"
                    :showLikersPopup="showLikersPopup"
                    :fetchAllTheNecessaryInfo="fetchAllTheNecessaryInfo"
                    :notifyParentToEditComment="editComment"
                    :notifyParentToDeleteComment="deleteComment"
                />

                <CommentOfPost v-for="comment in newlyPostedCommentsByAuthUser" :key="comment.id"
                    :id="comment.id"
                    :authUserId="authUserId"
                    :isLikedByAuthUser="comment.isLikedByAuthUser"
                    :newlyPostedRepliesByAuthUser="newlyPostedRepliesByAuthUser"
                    :authorId="authUserId"
                    :authorUsername="authUsername"
                    :authorIsVerified="usersAndTheirRelevantInfo[authUserId]?.isVerified ?? false"
                    :authorPfp="usersAndTheirRelevantInfo[authUserId]?.profilePhoto ?? defaultPfp"
                    :authorStatusToAuthUser="'You'"
                    :isEdited="comment.isEdited"
                    :datetime="comment.datetime"
                    :content="comment.content"
                    :isLikedByPostAuthor="false"
                    :numLikes="comment.numLikes"
                    :numReplies="comment.numReplies"
                    :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
                    :showErrorPopup="showErrorPopup"
                    :updateCommentDetails="updateCommentDetails"
                    :replyToComment="updateReplyingToCommentInfo"
                    :showLikersPopup="showLikersPopup"
                    :fetchAllTheNecessaryInfo="fetchAllTheNecessaryInfo"
                    :notifyParentToEditComment="editComment"
                    :notifyParentToDeleteComment="deleteComment"
                />

                <template v-if="initialCommentsFetchingIsComplete && initialCommentsFetchingErrorMessage.length == 0">
                    <CommentOfPost v-for="comment in orderedListOfComments" :key="comment.id"
                        :id="comment.id"
                        :authUserId="authUserId"
                        :isLikedByAuthUser="comment.isLikedByAuthUser"
                        :newlyPostedRepliesByAuthUser="newlyPostedRepliesByAuthUser"
                        :authorId="comment.authorId"
                        :authorUsername="comment.authorUsername"
                        :authorIsVerified="usersAndTheirRelevantInfo[comment.authorId]?.isVerified ?? false"
                        :authorPfp="usersAndTheirRelevantInfo[comment.authorId]?.profilePhoto ?? defaultPfp"
                        :authorStatusToAuthUser="comment.authorStatusToAuthUser"
                        :isEdited="comment.isEdited"
                        :datetime="comment.datetime"
                        :content="comment.content"
                        :isLikedByPostAuthor="comment.isLikedByPostAuthor"
                        :numLikes="comment.numLikes"
                        :numReplies="comment.numReplies"
                        :usersAndTheirRelevantInfo="usersAndTheirRelevantInfo"
                        :showErrorPopup="showErrorPopup"
                        :updateCommentDetails="updateCommentDetails"
                        :replyToComment="updateReplyingToCommentInfo"
                        :showLikersPopup="showLikersPopup"
                        :fetchAllTheNecessaryInfo="fetchAllTheNecessaryInfo"
                        :notifyParentToEditComment="editComment"
                        :notifyParentToDeleteComment="deleteComment"
                    />

                    <div v-if="!isCurrentlyFetchingAdditionalComments && additionalCommentsFetchingErrorMessage.length == 0"
                    style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: 2.5em">
                        <img :src="plusIconInCircle" @click="fetchComments('additional')" class="iconToBeAdjustedForDarkMode"
                        style="cursor: pointer; height: 2em; width: 2em; object-fit: contain;" />
                    </div>

                    <div v-if="!isCurrentlyFetchingAdditionalComments && additionalCommentsFetchingErrorMessage.length > 0"
                    style="width: 100%; display: flex; justify-content: center; margin-top: 2.5em">
                        <p style="font-size: 0.88em; width: 85%; color: gray;">
                            {{ additionalCommentsFetchingErrorMessage }}
                        </p>
                    </div>

                    <div v-if="isCurrentlyFetchingAdditionalComments"
                    style="width: 100%; display: flex; justify-content: center; margin-top: 2.5em">
                        <img :src="loadingAnimation" style="height: 2em; width: 2em; object-fit: contain; pointer-events:
                        none;" />
                    </div>
                </template>

                <div v-else-if="initialCommentsFetchingIsComplete && initialCommentsFetchingErrorMessage.length > 0"
                style="width: 100%; display: flex; justify-content: center; margin-top: 2.5em;">
                    <p style="font-size: 0.88em; width: 65%; color: gray;">
                        {{ initialCommentsFetchingErrorMessage }}
                    </p>
                </div>
            
                <div v-else style="width: 100%; display: flex; justify-content: center; margin-top: 2.5em;">
                    <img :src="loadingAnimation" style="height: 2em; width: 2em; object-fit: contain; pointer-events: none;"/>
                </div>
            </div>

            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding-left: 0.5em;
            margin-top: 1em;">
                <div style="display: flex; align-items: center;">
                    <img v-if="!postDetails.isLiked" :src="blankHeartIcon" @click="toggleLikePost"
                    class="mediaPostButton iconToBeAdjustedForDarkMode"/>
    
                    <img v-else :src="redHeartIcon" @click="toggleLikePost" class="mediaPostButton"/>
    
                    <img :src="commentIcon" class="mediaPostButton iconToBeAdjustedForDarkMode"/>
                
                    <img :src="sendPostIcon" class="mediaPostButton iconToBeAdjustedForDarkMode"
                    @click="showSendPostPopup(overallPostId)"/>
                </div>

                <img v-if="!postDetails.isSaved" :src="blankSavedIcon" @click="toggleSavePost"
                class="mediaPostButton iconToBeAdjustedForDarkMode"/>
    
                <img v-else :src="blackSavedIcon" @click="toggleSavePost" class="mediaPostButton iconToBeAdjustedForDarkMode"/>
            </div>

            <p v-if="postDetails.likersFollowedByAuthUser.length == 0" @click="showLikersPopup(overallPostId)"
            style="margin-bottom: 0em; max-width: 74%; overflow-wrap: break-word; text-align: start; margin-top: 1em; cursor:
            pointer; font-weight: bold; margin-left: 1em;">
                {{ postDetails.numLikes.toLocaleString() + (postDetails.numLikes == 1 ? ' like' : ' likes') }}
            </p>
    
            <p v-else style="margin-bottom: 0em; max-width: 74%; overflow-wrap: break-word; text-align: start;
            margin-left: 1em;">
                <span>Liked by </span>
                
                <template v-for="(likerId, index) in postDetails.likersFollowedByAuthUser" :key="index">
                    <a 
                        :href="`http://34.111.89.101/profile/${usersAndTheirRelevantInfo[likerId]?.username ?? `user ${likerId}`}`"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style="font-weight: bold; display: inline-flex; align-items: center; word-break: break-word; margin-right:
                        0.2em;"
                    >
                        {{ usersAndTheirRelevantInfo[likerId]?.username ?? `user ${likerId}` }}
    
                        <img v-if="usersAndTheirRelevantInfo[likerId]?.isVerified ?? true" :src="verifiedBlueCheck"
                        style="height: 1.4em; width: 1.4em; pointer-events: none; object-fit: contain; margin-left: -0.1em;
                        margin-right: -0.2em;"/>
                    </a>

                    <span style="margin-right: 0.15em;">, </span>
    
                    <template v-if="index == postDetails.likersFollowedByAuthUser.length - 1">
                        <span>and </span>
    
                        <b @click="showLikersPopup(overallPostId)" style="cursor: pointer;">
                            {{ (postDetails.numLikes - postDetails.likersFollowedByAuthUser.length).toLocaleString() }}
                        </b>
    
                        <b v-if="postDetails.numLikes - postDetails.likersFollowedByAuthUser.length == 1"
                        @click="showLikersPopup(overallPostId)" style="cursor: pointer;">
                            other
                        </b>
    
                        <b v-else @click="showLikersPopup(overallPostId)" style="cursor: pointer;">
                            others
                        </b>
                    </template>
                </template>
            </p>

            <div :style="{width: '100%', height: '2em', position: 'relative', marginTop: '2em', padding: '1em 1em',
            borderStyle: 'solid', borderColor: 'lightgray', borderLeft: 'none', borderRight: 'none', borderBottom: 'none'}">
                <input :value="commentInput" @input="updateCommentInput" @focus="commentInputTextareaIsActive = true"
                @blur="commentInputTextareaIsActive = false" :placeholder="replyingToCommentInfo !== null ? 
                `Replying to @${replyingToCommentInfo.authorUsername}: ${replyingToCommentInfo.content}` : 
                'Add a comment...'" :style="{fontFamily: 'Arial', width: '85%', outline: 'none', border: 'none', fontSize: '1em',
                paddingLeft: '1em', marginLeft: '-5em'}" />

                <b v-if="commentInput.length > 0" @click="postComment" :style="{cursor: 'pointer', color: '#28a2fa', position:
                'absolute', right: '10%', top: '30%', backgroundColor: 'white', padding: '0.3em 0.3em'}">
                    Post
                </b>
            </div>
        </div>
    </div>

    <img :src="thinWhiteXIcon" @click="closePopup" :style="{height: '3em', width: '3em', objectFit: 'contain', cursor:
    'pointer', position: 'fixed', top: '1.5%', right: '1.5%', zIndex: zIndex}"/>
</template>


<script setup>
    /* eslint-disable no-unused-vars */
    import CommentOfPost from '../CommentOfPost.vue';
import FollowUser from '../FollowUser.vue';
import PostDots from '../PostDots.vue';
import UserIcon from '../UserIcon.vue';

    import blackSavedIcon from '../../assets/images/blackSavedIcon.png';
import blankHeartIcon from '../../assets/images/blankHeartIcon.png';
import blankSavedIcon from '../../assets/images/blankSavedIcon.png';
import commentIcon from '../../assets/images/commentIcon.png';
import defaultPfp from '../../assets/images/defaultPfp.png';
import defaultVideoFrame from '../../assets/images/defaultVideoFrame.jpg';
import heartAnimationIcon from '../../assets/images/heartAnimationIcon.webp';
import loadingAnimation from '../../assets/images/loadingAnimation.gif';
import megaphone from '../../assets/images/megaphone.png';
import musicSymbol from '../../assets/images/musicSymbol.png';
import nextSlideArrow from '../../assets/images/nextSlideArrow.png';
import pauseIcon from '../../assets/images/pauseIcon.png';
import playIcon from '../../assets/images/playIcon.webp';
import plusIconInCircle from '../../assets/images/plusIconInCircle.png';
import redHeartIcon from '../../assets/images/redHeartIcon.png';
import sendPostIcon from '../../assets/images/sendPostIcon.png';
import taggedAccountsIcon from '../../assets/images/taggedAccountsIcon.png';
import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';
import thinWhiteXIcon from '../../assets/images/thinWhiteXIcon.png';
import threeHorizontalDots from '../../assets/images/threeHorizontalDots.png';
import verifiedBlueCheck from '../../assets/images/verifiedBlueCheck.png';

    import { defineProps, onBeforeMount, onMounted, ref } from 'vue';

    
    const props = defineProps({
        authUserId: Number,
        authUsername: String,

        postDetails: Object,

        usersAndTheirRelevantInfo: Object,
        updateUsersAndTheirRelevantInfo: Function,
        mainPostAuthorInfo: Object,

        currSlide: Number,

        zIndex: String,

        closePopup: Function,
        showErrorPopup: Function,
        showThreeDotsPopup: Function,
        showSendPostPopup: Function,
        showLikersPopup: Function,
        showStoryViewer: Function,
        updatePostDetails: Function
    });

    const overallPostId = ref('');

    const mainPostAuthorId = ref(-1);

    const bgMusicIsPlaying = ref(false);
    const bgMusicObject = ref(null);

    const currSlideState = ref(0);
    const displayTaggedAccountsOfSlide = ref(false);
    const displaySectionsOfVidSlide = ref(false);

    const commentInput = ref('');
    const commentInputTextareaIsActive = ref(false);

    const slideToVidTimeToFrameMappings = ref({});

    const heartAnimationCoordinates = ref([-1, -1]);
    const intervalIdForHeartAnimation = ref(null);

    const orderedListOfComments = ref([]);
    const commentIdsToExclude = ref([]);

    const newlyPostedCommentsByAuthUser = ref([]);
    const newlyPostedRepliesByAuthUser = ref([]);

    const initialCommentsFetchingIsComplete = ref(false);
    const isCurrentlyFetchingAdditionalComments = ref(false);
    const initialCommentsFetchingErrorMessage = ref('');
    const additionalCommentsFetchingErrorMessage = ref('');

    const replyingToCommentInfo = ref(null);

    const vidSlideRef = ref(null);
    const currSlideRef = ref(null);

    const languageCodeToLabelMappings = {
        "af": "Afrikaans",
        "sq": "Albanian",
        "am": "Amharic",
        "ar": "Arabic",
        "hy": "Armenian",
        "az": "Azerbaijani",
        "eu": "Basque",
        "be": "Belarusian",
        "bn": "Bengali",
        "bs": "Bosnian",
        "bg": "Bulgarian",
        "ca": "Catalan",
        "zh-CN": "Chinese (Simplified)",
        "zh-TW": "Chinese (Traditional)",
        "hr": "Croatian",
        "cs": "Czech",
        "da": "Danish",
        "nl": "Dutch",
        "en": "English",
        "et": "Estonian",
        "fi": "Finnish",
        "fr": "French",
        "gl": "Galician",
        "ka": "Georgian",
        "de": "German",
        "el": "Greek",
        "gu": "Gujarati",
        "ht": "Haitian Creole",
        "ha": "Hausa",
        "he": "Hebrew",
        "hi": "Hindi",
        "hu": "Hungarian",
        "is": "Icelandic",
        "id": "Indonesian",
        "ga": "Irish",
        "it": "Italian",
        "ja": "Japanese",
        "kn": "Kannada",
        "kk": "Kazakh",
        "km": "Khmer",
        "ko": "Korean",
        "ku": "Kurdish",
        "ky": "Kyrgyz",
        "lo": "Lao",
        "lv": "Latvian",
        "lt": "Lithuanian",
        "mk": "Macedonian",
        "ms": "Malay",
        "ml": "Malayalam",
        "mt": "Maltese",
        "mi": "Maori",
        "mr": "Marathi",
        "mn": "Mongolian",
        "ne": "Nepali",
        "no": "Norwegian",
        "fa": "Persian",
        "pl": "Polish",
        "pt-BR": "Portuguese (Brazil)",
        "pt-PT": "Portuguese (Portugal)",
        "pa": "Punjabi",
        "ro": "Romanian",
        "ru": "Russian",
        "sr": "Serbian",
        "si": "Sinhala",
        "sk": "Slovak",
        "sl": "Slovenian",
        "so": "Somali",
        "es": "Spanish",
        "sw": "Swahili",
        "sv": "Swedish",
        "tl": "Tagalog",
        "ta": "Tamil",
        "te": "Telugu",
        "th": "Thai",
        "tr": "Turkish",
        "uk": "Ukrainian",
        "ur": "Urdu",
        "uz": "Uzbek",
        "vi": "Vietnamese",
        "cy": "Welsh",
        "xh": "Xhosa",
        "yi": "Yiddish",
        "zu": "Zulu"
    };


    onMounted(() => {
        overallPostId.value = props.postDetails.overallPostId;
        mainPostAuthorId.value = props.postDetails.authorIds[0];
        currSlideState.value = props.currSlide;

        if(props.postDetails.backgroundMusic !== null) {
            bgMusicObject.value = new Audio(props.postDetails.bgMusic.src);

            bgMusicObject.value.addEventListener('loadedmetadata', () => {
                if (props.postDetails.bgMusic.startTime > 0) {
                    bgMusicObject.value.currentTime = props.postDetails.bgMusic.startTime;
                }
            });

            bgMusicObject.value.addEventListener('timeupdate', () => {
                let bgMusicEndTime = -1;

                if (props.postDetails.bgMusic.endTime == -1) {
                    bgMusicEndTime = bgMusicObject.value.duration;
                }
                else {
                    bgMusicEndTime = props.postDetails.bgMusic.endTime;
                }

                if (bgMusicObject.value.currentTime >= bgMusicEndTime) {
                    if (props.postDetails.bgMusic.startTime > 0) {
                        bgMusicObject.value.currentTime = props.postDetails.bgMusic.startTime;
                    }
                    else {
                        bgMusicObject.value.currentTime = 0;
                    }
                }
            });
        }

        window.addEventListener('keydown', handleKeyDownEvents);
        fetchComments('initial');
    });


    onBeforeMount(() => {
        window.removeEventListener('keydown', handleKeyDownEvents);
    });


    function handleKeyDownEvents(event) {
        const currSlideIsVid = props.postDetails.slides[currSlideState.value].type === 'video';

        switch (event.key) {
            case 'Escape':
                if (!currSlideIsVid) {
                    props.closePopup();
                }
                break;
            case 'Enter':
                if (commentInputTextareaIsActive.value && commentInput.value.length > 0) {
                    postComment();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                if (!commentInputTextareaIsActive.value && !currSlideIsVid && currSlideState.value > 0) {
                    changeSlide('decrement');
                }
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                if (!commentInputTextareaIsActive.value && !currSlideIsVid && currSlideState.value + 1 <
                props.postDetails.slides.length) {
                    changeSlide('increment');
                }
                break;
            case 'm':
            case 'M':
                if (!commentInputTextareaIsActive.value && !currSlideIsVid && bgMusicIsPlaying.value) {
                    togglePauseBackgroundMusic();
                }
                break;
            case 'k':
            case 'K':
            case ' ':
                if (!commentInputTextareaIsActive.value && !currSlideIsVid && bgMusicObject.value !== null) {
                    togglePauseBackgroundMusic();
                }
        }
    }


    function changeSlide(incrementOrDecrementText) {
        displaySectionsOfVidSlide.value = false;
        displayTaggedAccountsOfSlide.value = false;

        if(incrementOrDecrementText === 'increment') {
            currSlideState.value++;
        }
        else {
            currSlideState.value--;
        }
    }


    function toggleShowTaggedAccountsOfSlide() {
        if(!displayTaggedAccountsOfSlide.value) {
            displaySectionsOfVidSlide.value = false;
            displayTaggedAccountsOfSlide.value = true;
        }
        else {
            displayTaggedAccountsOfSlide.value = false;
        }
    }


    function startHeartAnimation(startX, startY) {
        if (intervalIdForHeartAnimation.value !== null) {
            return;
        }
    
        heartAnimationCoordinates.value = [startX, startY];
        
        intervalIdForHeartAnimation.value = 'on the way...';

        setTimeout(() => {
            const newIntervalIdForLikePostHeartAnimation = setInterval(() => {
                const currentX = heartAnimationCoordinates.value[0];
                const currentY = heartAnimationCoordinates.value[1];

                if (currentY < -7) {
                    clearInterval(newIntervalIdForLikePostHeartAnimation);
                    intervalIdForHeartAnimation.value = null;
                }
                else {
                    heartAnimationCoordinates.value = [currentX, currentY - 1];
                }
            }, 10);

            intervalIdForHeartAnimation.value = newIntervalIdForLikePostHeartAnimation;
        }, 400);
    }


    function takeUserToSectionInVideo(timeInSeconds) {
        if (vidSlideRef.value) {
            vidSlideRef.value.currentTime = timeInSeconds;
            vidSlideRef.value.play();
        }
    }


    async function toggleShowSectionsOfVidSlide() {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = !displaySectionsOfVidSlide.value;

        if (displaySectionsOfVidSlide.value && props.postDetails.slides[currSlideState.value].sections.length > 0 &&
        !(currSlideState.value in slideToVidTimeToFrameMappings.value)) {
            for(let sectionInfo of props.postDetails.slides[currSlideState.value].sections) {
                await getVideoFrameAtSpecifiedSlideAndTime(currSlideState.value, sectionInfo[0]);
            }
        }
    }


    async function getVideoFrameAtSpecifiedSlideAndTime(slide, timeInSeconds) {
        return new Promise((resolve, reject) => {
            const slideToVidTimeToFrameMappingsValue = slideToVidTimeToFrameMappings.value;

            if (slide in slideToVidTimeToFrameMappingsValue && timeInSeconds in slideToVidTimeToFrameMappingsValue[slide]) {
                resolve(slideToVidTimeToFrameMappingsValue[slide][timeInSeconds]);
            }

            const newSlideToVidTimeToFrameMappings = { ...slideToVidTimeToFrameMappingsValue };
        
            if (!(slide in slideToVidTimeToFrameMappingsValue)) {
                newSlideToVidTimeToFrameMappings[slide] = {};
            }

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.src = props.postDetails.slides[slide].src;


            video.addEventListener('loadeddata', () => {
                video.currentTime = timeInSeconds;
            });


            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const frameImage = canvas.toDataURL('image/png');

                newSlideToVidTimeToFrameMappings[slide][timeInSeconds] = frameImage;
                slideToVidTimeToFrameMappings.value = newSlideToVidTimeToFrameMappings;

                resolve(frameImage);
            });


            video.onerror = (e) => {
                e;
                reject(new Error('Error loading video'));
            };
        });
    }


    function togglePauseBackgroundMusic() {
        if(!bgMusicIsPlaying.value) {
            bgMusicObject.value.play();
        }
        else {
            bgMusicObject.value.pause();
        }

        bgMusicIsPlaying.value = !bgMusicIsPlaying.value;
    }


    function updateCommentInput(event) {
        commentInput.value = event.target.value;
    }


    function updateCommentDetails(id, updatedDetails) {
        let commentFound = false;

        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.value.filter(commentDetails => {
            if(commentDetails.id == id) {
                commentFound = true;

                const newCommentDetails = {...commentDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newCommentDetails[key] = updatedDetails[key];
                }

                return newCommentDetails;
            }
        });
        if (commentFound) {
            newlyPostedCommentsByAuthUser.value = newNewlyPostedCommentsByAuthUser;
            return;
        }

        const newNewlyPostedRepliesByAuthUser = newlyPostedCommentsByAuthUser.value.filter(replyDetails => {
            if(replyDetails.id == id) {
                commentFound = true;

                const newCommentDetails = {...replyDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newCommentDetails[key] = updatedDetails[key];
                }
                
                return newCommentDetails;
            }
        });
        if (commentFound) {
            newlyPostedCommentsByAuthUser.value = newNewlyPostedRepliesByAuthUser;
            return;
        }


        const newOrderedListOfComments = orderedListOfComments.value.map(commentDetails => {
            if(commentDetails.id == id) {
                commentFound = true;

                const newCommentDetails = {...commentDetails};
                for(let key of Object.keys(updatedDetails)) {
                    newCommentDetails[key] = updatedDetails[key];
                }
                
                return newCommentDetails;
            }
        });
        
        orderedListOfComments.value = newOrderedListOfComments;
    }


    function updateReplyingToCommentInfo(newReplyingToCommentInfo) {
        if(replyingToCommentInfo.value !== null && replyingToCommentInfo.value.id == newReplyingToCommentInfo.id) {
            replyingToCommentInfo.value = null;
        }
        else {
            replyingToCommentInfo.value = newReplyingToCommentInfo;
        }
    }


    function editComment(id, newContent) {
        let commentFound = false;
        
        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.value.map(commentDetails => {
            if(commentDetails.id == id) {
                commentFound = true;
                const newCommentDetails = {...commentDetails};
                newCommentDetails.content = newContent;
                newCommentDetails.datetime = (new Date()).toISOString();
                newCommentDetails.isEdited = true;
                return newCommentDetails;
            }
            return commentDetails;
        });

        if (commentFound) {
            newlyPostedCommentsByAuthUser.value = newNewlyPostedCommentsByAuthUser;
            return;
        }

        const newNewlyPostedRepliesByAuthUser = newlyPostedRepliesByAuthUser.value.map(replyDetails => {
            if(replyDetails.id == id) {
                commentFound = true;
                const newReplyDetails = {...replyDetails};
                newReplyDetails.content = newContent;
                newReplyDetails.datetime = (new Date()).toISOString();
                newReplyDetails.isEdited = true;
                return newReplyDetails;
            }
            return replyDetails;
        });

        if (commentFound) {
            newlyPostedRepliesByAuthUser.value = newNewlyPostedRepliesByAuthUser;
            return;
        }
        
        const newOrderedListOfComments = orderedListOfComments.value.map(commentDetails => {
            if(commentDetails.id == id) {
                const newCommentDetails = {...commentDetails};
                newCommentDetails.content = newContent;
                newCommentDetails.datetime = (new Date()).toISOString();
                newCommentDetails.isEdited = true;
                return newCommentDetails;  
            }
            return commentDetails;
        });
        
        orderedListOfComments.value = newOrderedListOfComments;
    }


    function deleteComment(id) {
        let commentFound = false;

        const newNewlyPostedCommentsByAuthUser = newlyPostedCommentsByAuthUser.value.filter(commentDetails => {
            if(commentDetails.id == id) {
                commentFound = true;
                return false;
            }
            return true;
        });

        if (commentFound) {
            newlyPostedCommentsByAuthUser.value = newNewlyPostedCommentsByAuthUser;
            return;
        }

        const newNewlyPostedRepliesByAuthUser = newlyPostedRepliesByAuthUser.value.filter(replyDetails => {
            if(replyDetails.id == id) {
                commentFound = true;
                return false;
            }
            return true;
        });

        if (commentFound) {
            newlyPostedRepliesByAuthUser.value = newNewlyPostedRepliesByAuthUser;
            return;
        }

        const newOrderedListOfComments = orderedListOfComments.value.filter(commentDetails => {
            if(commentDetails.id == id) {
                return false;
            }
            return true;
        });
        
        orderedListOfComments.value = newOrderedListOfComments;
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


    async function fetchComments(initialOrAdditionalText) {
        if(initialOrAdditionalText === 'additional') {
            isCurrentlyFetchingAdditionalComments.value = true;
        }

        try {
            const response = await fetch(
            'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `query ($authUserId: Int!, $overallPostId: String!, $commentIdsToExclude: [Int!]!) {
                        getBatchOfCommentsOfPost(
                            authUserId: $authUserId, overallPostId: $overallPostId, commentIdsToExclude: $commentIdsToExclude
                        )
                    }`,
                    variables: {
                        authUserId: props.authUserId,
                        overallPostId: overallPostId.value,
                        commentIdsToExclude: commentIdsToExclude.value,
                    }
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                if(initialOrAdditionalText === 'initial') {
                    initialCommentsFetchingErrorMessage.value = `The server had trouble getting the initial batch of comments of
                    this post`;
                }
                else {
                    additionalCommentsFetchingErrorMessage.value = `The server had trouble getting the additional batch of
                    comments of this post`;
                }
            }
            else {
                let newlyFetchedOrderedComments = await response.json();
                newlyFetchedOrderedComments = newlyFetchedOrderedComments.map(comment => {
                    comment.datetime = formatDatetimeString(comment.datetime);
                    return comment;
                });

                let newOrderedListOfComments = [...orderedListOfComments.value, ...newlyFetchedOrderedComments];
                
                const newCommentIdsToExclude = [...commentIdsToExclude.value];
                for(let newlyFetchedComment of newlyFetchedOrderedComments) {
                    newCommentIdsToExclude.push(newlyFetchedComment.id);
                }

                commentIdsToExclude.value = newCommentIdsToExclude;
                orderedListOfComments.value = newOrderedListOfComments;
            
                fetchAllTheNecessaryInfo(newlyFetchedOrderedComments.map(comment => comment.authorId));
            }
        }
        catch (error) {
            if(initialOrAdditionalText === 'initial') {
                initialCommentsFetchingErrorMessage.value = `There was trouble connecting to the server to get the initial
                batch of comments of this post`;
            }
            else {
                additionalCommentsFetchingErrorMessage.value = `There was trouble connecting to the server to get the additional
                batch of comments of this post`;
            }
        }
        finally {
            if(initialOrAdditionalText === 'initial') {
                initialCommentsFetchingIsComplete.value = true;
            }
            else {
                isCurrentlyFetchingAdditionalComments.value = false;
            }
        }
    }


    async function fetchAllTheNecessaryInfo(newCommenterIds) {
        let graphqlUserQueryStringHeaderInfo = {};
        let graphqlUserQueryString = '';
        let graphqlUserVariables = {};

        let usersAndTheirUsernames = {};
        const newCommenterIdsNeededForUsernames = newCommenterIds.filter(newCommenterId => {
            if (!(newCommenterId in props.usersAndTheirRelevantInfo) || 
            !('username' in props.usersAndTheirRelevantInfo[newCommenterId])) {
                return true;
            }
            return false;
        });

        if (newCommenterIdsNeededForUsernames.length > 0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newCommenterIdsNeededForUsernames'] = '[Int!]!';

            graphqlUserQueryString +=
            `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newCommenterIdsNeededForUsernames) `;
            graphqlUserVariables.authUserId = props.authUserId;
            graphqlUserVariables.newCommenterIdsNeededForUsernames = newCommenterIdsNeededForUsernames;
        }

        let usersAndTheirVerificationStatuses = {};
        const newCommenterIdsNeededForVerificationStatuses = newCommenterIds.filter(newCommenterId => {
            if (!(newCommenterId in props.usersAndTheirRelevantInfo) ||
            !('isVerified' in props.usersAndTheirRelevantInfo[newCommenterId])) {
                return true;
            }
            return false;
        });
        if (newCommenterIdsNeededForVerificationStatuses.length>0) {
            graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
            graphqlUserQueryStringHeaderInfo['$newCommenterIdsNeededForVerificationStatuses'] = '[Int!]!';

            graphqlUserQueryString +=
            `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
            $newCommenterIdsNeededForVerificationStatuses) `;
            graphqlUserVariables.authUserId = props.authUserId;
            graphqlUserVariables.newCommenterIdsNeededForVerificationStatuses = newCommenterIdsNeededForVerificationStatuses;
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
                    if (newCommenterIdsNeededForUsernames.length > 0) {
                        console.error(
                            'The server had trouble fetching the usernames of all the newly fetched comment-authors'
                        );
                    }

                    if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
                        console.error(
                            `The server had trouble fetching the verification-statuses of all the new fetched
                            comment-authors`
                        );
                    }
                }
                else {
                    const responseData = await response.json();

                    if (newCommenterIdsNeededForUsernames.length > 0) {
                        const listOfUsernamesForNewCommenterIds = responseData.data.getListOfUsernamesForUserIds;

                        for(let i=0; i<newCommenterIdsNeededForUsernames.length; i++) {
                            const newCommenterId = newCommenterIdsNeededForUsernames[i];
                            const newCommenterUsername = listOfUsernamesForNewCommenterIds[i];

                            if (newCommenterUsername !== null) {
                                usersAndTheirUsernames[newCommenterId] = newCommenterUsername;
                            }
                        }
                    }

                    if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
                        const listOfVerificationStatusesForNewCommenterIds = responseData.data
                        .getListOfUserVerificationStatusesForUserIds;

                        for(let i=0; i<newCommenterIdsNeededForVerificationStatuses.length; i++) {
                            const newCommenterId = newCommenterIdsNeededForVerificationStatuses[i];
                            const newCommenterVerificationStatus = listOfVerificationStatusesForNewCommenterIds[i];

                            if (newCommenterVerificationStatus !== null) {
                                usersAndTheirVerificationStatuses[newCommenterId] = newCommenterVerificationStatus;
                            }
                        }
                    }
                }
            }
            catch {
                if (newCommenterIdsNeededForUsernames.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the usernames of all the newly fetched
                        comment-authors`
                    );
                }

                if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
                    console.error(
                        `There was trouble connecting to the server to fetch the verification-statuses of all the newly
                        fetched comment-authors`
                    );
                }
            }
        }

        let usersAndTheirPfps = {};
        const newCommenterIdsNeededForPfps = newCommenterIds.filter(newCommenterId => {
            if (!(newCommenterId in props.usersAndTheirRelevantInfo) ||
            !('profilePhoto' in props.usersAndTheirRelevantInfo[newCommenterId])) {
                return true;
            }
            return false;
        });
        if (newCommenterIdsNeededForPfps.length>0) {
            try {
                const response2 = await fetch(
                    'http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userIds: newCommenterIdsNeededForPfps
                        })
                    });
                    
                if(!response2.ok) {
                    console.error(
                        'The server had trouble fetching the profile-photos of all the newly fetched comment-authors'
                    );
                }
                else {
                    usersAndTheirPfps = await response2.json();
                }
            }
            catch {
                console.error(
                    `There was trouble connecting to the server to fetch the profile-photos of all the newly fetched
                    comment-authors`
                );
            }
        }

        const newUsersAndTheirRelevantInfo = {...props.usersAndTheirRelevantInfo};

        for(let newCommenterId of newCommenterIds) {
            if (!(newCommenterId in usersAndTheirUsernames) && !(newCommenterId in usersAndTheirVerificationStatuses) &&
            !(newCommenterId in usersAndTheirPfps)) {
                continue;
            }

            if(!(newCommenterId in newUsersAndTheirRelevantInfo)) {
                newUsersAndTheirRelevantInfo[newCommenterId] = {};
            }
            
            if (newCommenterId in usersAndTheirUsernames) {
                newUsersAndTheirRelevantInfo[newCommenterId].username = usersAndTheirUsernames[newCommenterId];
            }
            if (newCommenterId in usersAndTheirVerificationStatuses) {
                newUsersAndTheirRelevantInfo[newCommenterId].isVerified = usersAndTheirVerificationStatuses[newCommenterId];
            }
            if (newCommenterId in usersAndTheirPfps) {
                newUsersAndTheirRelevantInfo[newCommenterId].profilePhoto = usersAndTheirPfps[newCommenterId];
            }
        }

        props.updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo);

        return newUsersAndTheirRelevantInfo;
    }


    async function likePost(event) {
        if (props.postDetails.isLiked) {
            return;
        }

        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like posts');
            return;
        }

        let likeWasSuccessful = true;
        
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addLikeToPostOrComment/${props.authUserId}
            /${overallPostId.value}`, {
                method: 'POST',
                credentials: 'include'
            });
            if(!response.ok) {
                props.showErrorPopup('The server had trouble adding your like to this post');
                likeWasSuccessful = false;
            }
            else {
                props.updatePostDetails(
                    overallPostId.value,
                    {
                        isLiked: true,
                        numLikes: props.postDetails.numLikes + 1
                    }
                );
            }
        }
        catch (error) {
            props.showErrorPopup(
                'There was trouble connecting to the server to add your like to this post'
            );
            likeWasSuccessful = false;
        }
        
        if (likeWasSuccessful) {
            if(event == null) {
                startHeartAnimation(50, 50);
            }
            else if (currSlideRef.value) {
                const rect = currSlideRef.value.getBoundingClientRect();
                const x = event.clientX;
                const y = event.clientY;
                const xPercent = ((x - rect.left) / rect.width) * 100;
                const yPercent = ((y - rect.top) / rect.height) * 100;

                startHeartAnimation(xPercent, yPercent);
            }
        }
    }


    async function toggleLikePost() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to like posts');
            return;
        }

        if(!props.postDetails.isLiked) {
            likePost(null);
        }
        else {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeLikeFromPostOrComment/${props.authUserId}
                /${overallPostId.value}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    props.showErrorPopup('The server had trouble removing your like of this post');
                }
                else {
                    intervalIdForHeartAnimation.value = null;
                    props.updatePostDetails(
                        overallPostId.value,
                        {
                            isLiked: false,
                            numLikes: props.postDetails.numLikes - 1
                        }
                    );
                }
            }
            catch (error) {
                props.showErrorPopup(
                    'There was trouble connecting to the server to remove your like of this post'
                );
            }
        }
    }


    async function toggleSavePost() {
        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to save posts');
            return;
        }

        let toggleSaveWasSuccessful = true;

        if(props.postDetails.isSaved) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/djangoBackend2/unsavePost/${props.authUserId}/${overallPostId.value}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if(!response.ok) {
                    props.showErrorPopup(
                        'The server had trouble removing your save of this post'
                    );
                    toggleSaveWasSuccessful = false;
                }
            }
            catch (error) {
                props.showErrorPopup(
                    'There was trouble connecting to the server to remove your save of this post'
                );
                toggleSaveWasSuccessful = false;
            }
        }
        else {
           try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/djangoBackend2/savePost/${props.authUserId}/${overallPostId.value}`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if(!response.ok) {
                    props.showErrorPopup(
                        'The server had trouble adding your save to this post'
                    );
                    toggleSaveWasSuccessful = false;
                }
           }
           catch (error) {
                props.showErrorPopup(
                    'There was trouble connecting to the server to add your save to this post'
                );
                toggleSaveWasSuccessful = false;
           }
        }

        if(toggleSaveWasSuccessful) {
            props.updatePostDetails(
                overallPostId.value,
                {
                    isSaved: !props.postDetails.isSaved
                }
            );
        }
    }


    async function postComment() {
        if (props.authUserId == -1) {
            props.showErrorPopup('You cannot post comments/replies without logging into an account');
            return;
        }

        let commentOrReplyText = '';
        
        try {
            let response;

            if(replyingToCommentInfo.value == null) {
                commentOrReplyText = 'comment';

                response = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `mutation ($authUserId: Int!, $overallPostId: String!, $commentContent: String!) {
                            addCommentToPost(
                                authUserId: $authUserId, overallPostId: $overallPostId, commentContent: $commentContent
                            )
                        }`,
                        variables: {
                            authUserId: props.authUserId,
                            overallPostId: overallPostId.value,
                            commentContent: commentInput.value
                        }
                    }),
                    credentials: 'include'
                });
            }
            else {
                commentOrReplyText = 'reply';

                response = await fetch(
                'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query: `mutation ($authUserId: Int!, $commentId: Int!, $replyContent: String!) {
                            addReplyToComment(authUserId: $authUserId, commentId: $commentId, replyContent: $replyContent)
                        }`,
                        variables: {
                            authUserId: props.authUserId,
                            commentId: replyingToCommentInfo.value.id,
                            replyContent: commentInput.value
                        }
                    }),
                    credentials: 'include'
                });
            }

            if(!response.ok) {
                props.showErrorPopup(`The server had trouble adding your ${commentOrReplyText}.`);
            }
            else {
                let newCommentOrReplyId = await response.json();
                
                if (commentOrReplyText === 'comment') {
                    newCommentOrReplyId = newCommentOrReplyId.data.addCommentToPost;

                    props.updatePostDetails(
                        overallPostId.value,
                        {
                            numComments: props.postDetails.numComments + 1
                        }
                    );
                    newlyPostedCommentsByAuthUser.value = [
                        {
                            id: newCommentOrReplyId,
                            content: commentInput.value,
                            datetime: (new Date()).toISOString(),
                            isEdited: false,
                            numLikes: 0,
                            numReplies: 0,
                            isLikedByAuthUser: false
                        },
                        ...newlyPostedCommentsByAuthUser.value
                    ];
                    commentIdsToExclude.value = [...commentIdsToExclude.value, newCommentOrReplyId];
                }
                else {
                    newCommentOrReplyId = newCommentOrReplyId.data.addReplyToComment;

                    updateCommentDetails(
                        replyingToCommentInfo.value.id,
                        { numReplies: replyingToCommentInfo.value.numReplies + 1 }
                    );
                    newlyPostedRepliesByAuthUser.value = [
                        {
                            id: newCommentOrReplyId,
                            content: commentInput.value,
                            datetime: (new Date()).toISOString(),
                            isEdited: false,
                            numLikes: 0,
                            numReplies: 0,
                            isLikedByAuthUser: false,
                            parentCommentId: replyingToCommentInfo.value.id
                        },
                        ...newlyPostedRepliesByAuthUser.value
                    ];

                    replyingToCommentInfo.value = null;
                }

                commentInput.value = '';
            }
        }
        catch (error) {
            props.showErrorPopup(
                `There was trouble connecting to the server to add your ${commentOrReplyText}.`
            );
        }
    }
</script>