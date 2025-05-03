<template>
    <div style="display: flex; flex-direction: column; width: 61%; align-items: start; padding: 1em 1em; margin-bottom: 2em;">
        <div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 1em;">
                <UserIcon
                    :authUserId="authUserId"
                    :userId="mainPostAuthorId"
                    :username="postDetails.authorUsernames[0]"
                    :userPfp="mainPostAuthorInfo.profilePhoto ?? defaultPfp"
                    :inStoriesSection="false"
                    :isSponsored="false"
                    :userHasStories="mainPostAuthorInfo.hasStories ?? false"
                    :userHasUnseenStory="mainPostAuthorInfo.hasUnseenStory ?? false"
                    :userIsVerified="mainPostAuthorInfo.isVerified ?? false"
                    :showStoryViewer="showStoryViewer"
                />

                <div style="display: flex; flex-direction: column; align-items: start; gap: 0.5em;">
                    <p style="margin-bottom: 0em; max-width: 20em; text-align: start; overflow-wrap: break-word;">
                        <template v-for="(authorUsername, index) in postDetails.authorUsernames" :key="index">
                            <a
                                :href="`http://34.111.89.101/profile/${authorUsername}`"
                                target="_blank" 
                                rel="noopener noreferrer"
                                style="font-weight: bold; display: inline-flex; align-items: center; word-break: break-word;
                                margin-right: 0.2em;"
                            >
                                {{ authorUsername }}
    
                                <img v-if="(usersAndTheirRelevantInfo[postDetails.authorIds[index]]?.isVerified ?? false)"
                                :src="verifiedBlueCheck" style="height: 1.4em; width: 1.4em; pointer-events: none; object-fit:
                                contain; margin-left: -0.1em; margin-right: -0.2em;"/>
                            </a>
                
                            <span v-if="index < postDetails.authorUsernames.length - 2" style="font-weight: bold; margin-right:
                            0.2em;">, </span>
                
                            <span v-if="index === postDetails.authorUsernames.length - 2 && index == 0"
                            style="font-weight: bold; margin-right: 0.2em;"> and </span>
                
                            <span v-if="index === postDetails.authorUsernames.length - 2 && index > 0"
                            style="font-weight: bold; margin-right: 0.2em;">, and </span>
                        </template>
                
                        <span style="color: gray;">
                            {{ ' • ' + postDetails.datetime }}
                        </span> 
                    </p>

                    <a v-if="postDetails.locationOfPost !== null"
                    :href="`http://34.111.89.101/search/locations/${postDetails.locationOfPost}`"
                    target="_blank" 
                    rel="noopener noreferrer"
                    style="font-size: 0.9em; margin-bottom: 0em; max-width: 20em; text-align: start; overflow-wrap: break-word;">
                        {{ postDetails.locationOfPost }} 
                    </a>

                    <div v-if="bgMusicObject !== null" style="display: flex; align-items: center; gap: 0.8em; font-size: 0.9em;
                    margin-bottom: -0.5em; margin-top: -0.5em;">
                        <img :src="musicSymbol" class="iconToBeAdjustedForDarkMode" style="pointerEvents: none; height: 1.1em;
                        width: 1.1em; object-fit: contain;"
                        />
                        
                        <p style="max-width: 17em; text-align: start; overflow-wrap: break-word;">
                            <b>{{ postDetails.bgMusic.title }}</b> • <b>{{ postDetails.bgMusic.artist }}</b>
                        </p>

                        <img v-if="!bgMusicIsPlaying" :src="playIcon" class="iconToBeAdjustedForDarkMode"
                        @click="togglePauseBackgroundMusic" style="cursor: pointer; height: 1.3em; width: 1.3em; object-fit:
                        contain;"/>

                        <img v-else :src="pauseIcon" class="iconToBeAdjustedForDarkMode" @click="togglePauseBackgroundMusic"
                        style="cursor: pointer; height: 1.5em; width: 1.5em; object-fit: contain;"/>
                    </div>

                    <a v-if="postDetails.adInfo !== null" :href="postDetails.adInfo.link"  target="_blank" rel="noopener noreferrer"
                    style="font-size: 0.9em;">
                        Sponsored
                    </a>
                </div>
            </div>
            
            <img :src="threeHorizontalDots" class="iconToBeAdjustedForDarkMode" style="cursor: pointer; height: 2em; width: 2em;
            object-fit: contain;" @click="notifyParentToShowThreeDotsPopup"/>
        </div>

        <div v-if="postDetails.slides[currSlide].type === 'image'" ref="currSlideRef" style="width: 100%; height: 42em; position:
        relative; margin-top: 1em;">
            <img :src="postDetails.slides[currSlide].src" @click="notifyParentToFocusOnThisMediaPost" @dblclick="likePost"
            style="position: absolute; object-fit: cover; top: 0%; left: 0%; height: 100%; width: 100%;"/>

            <img v-if="currSlide > 0" :src="nextSlideArrow" @click="changeSlide('decrement')"
            style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; left: 1%; top:
            50%; transform: translateY(-50%) rotate(180deg);"/>

            <img v-if="currSlide < postDetails.slides.length-1" :src="nextSlideArrow" @click="changeSlide('increment')"
            style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; right: 1%; top:
            50%; transform: translateY(-50%);"/>

            <PostDots v-if="postDetails.slides.length > 1"
                :numSlides="postDetails.slides.length"
                :currSlide="currSlide"
                :currSlideIsImage="true"
            />

            <img v-if="postDetails.slides[currSlide].taggedAccounts.length > 0" :src="taggedAccountsIcon"
            @click="toggleShowTaggedAccountsOfSlide" style="height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; 
            bottom: 2%; left: 3%; cursor: pointer;"/>

            <template v-if="displayTaggedAccountsOfSlide">
                <a v-for="taggedAccountInfo in postDetails.slides[currSlide].taggedAccounts"
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

            <img v-if="intervalIdForHeartAnimation !== null" :src="heartAnimationIcon" :style="{height: '6.6em', width: '6.6em',
            pointerEvents: 'none', objectFit: 'contain', position: 'absolute', top: `${heartAnimationCoordinates[1]}%`, left:
            `${heartAnimationCoordinates[0]}%`, transform: 'translate(-50%, -50%)'}"/>
        </div>

        <div v-else ref="currSlideRef" style="width: 100%; height: 42em; position: relative; margin-top: 1em; background-color:
        black;">
            <video ref="vidSlideRef" :src="postDetails.slides[currSlide].src" muted controls
            @click="notifyParentToFocusOnThisMediaPost" @dblclick="likePost" style="width: 100%; height: 100%; position: absolute;
            top: 0%; left: 0%;">
                <track v-for="subtitlesInfo in postDetails.slides[currSlide].subtitles"
                    :key="subtitlesInfo.langCode"
                    kind="subtitles"
                    :src="subtitlesInfo.src"
                    :srcLang="subtitlesInfo.langCode"
                    :label="languageCodeToLabelMappings[subtitlesInfo.langCode]"
                    :default="subtitlesInfo.default ?? false"
                />
            </video>

            <img v-if="currSlide > 0" :src="nextSlideArrow" @click="changeSlide('decrement')"
            style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; left: 1%; top:
            50%; transform: translateY(-50%) rotate(180deg);"/>

            <img v-if="currSlide < postDetails.slides.length-1" :src="nextSlideArrow" @click="changeSlide('increment')"
            style="cursor: pointer; height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; right: 1%; top:
            50%; transform: translateY(-50%);"/>

            <PostDots v-if="postDetails.slides.length > 1"
                :numSlides="postDetails.slides.length"
                :currSlide="currSlide"
                :currSlideIsImage="false"
            />

            <img v-if="postDetails.slides[currSlide].taggedAccounts.length > 0" :src="taggedAccountsIcon"
            @click="toggleShowTaggedAccountsOfSlide" style="height: 2.4em; width: 2.4em; object-fit: contain; position: absolute;
            bottom: 16%; left: 3%; cursor: pointer;"/>

            <div v-if="!displaySectionsOfVidSlide && !displayTaggedAccountsOfSlide &&
            postDetails.slides[currSlide].sections.length > 0" class="videoSlideChaptersOrTaggedAccountsDiv"
            @click="toggleShowSectionsOfVidSlide" style="position: absolute; bottom: 0%; right: -55%; overflow-y: scroll;
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; padding: 0.5em 1em; cursor: pointer; border-radius: 2em;">
                <small style="font-weight: bold;">
                    Show Sections of this Video-Slide
                </small>
            </div>

            <div v-if="displaySectionsOfVidSlide" class="videoSlideChaptersOrTaggedAccountsDiv" style="position: absolute; width:
            100%; top: 0%; right: -105%; height: 100%; overflow-y: scroll; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
            z-index: 2;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4em 1.5em; border-style:
                solid; border-color: lightgray; border-width: 0.08em; border-top: none; border-left: none; border-right: none;">
                    <h4>Sections of this Video-Slide</h4>
                    
                    <img :src="thinGrayXIcon" @click="toggleShowSectionsOfVidSlide" style="cursor: pointer; height: 1.6em; width:
                    1.6em; object-fit: contain;"/>
                </div>

                <br/>

                <div v-for="sectionInfo in postDetails.slides[currSlide].sections" :key="sectionInfo[0]" class="videoSlideSection"
                @click="takeUserToSectionInVideo(sectionInfo[0])" style="display: flex; width: 100%; align-items: center;
                cursor: pointer; padding: 0.4em 1.5em; gap: 1.5em;">
                    <img :src="slideToVidTimeToFrameMappings[currSlide]?.[sectionInfo[0]] ?? defaultVideoFrame"
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

            <div v-if="displayTaggedAccountsOfSlide" class="videoSlideChaptersOrTaggedAccountsDiv" style="position: absolute; width:
            100%; top: 0%; right: -105%; height: 100%; overflow-y: scroll; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
            z-index: 2;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4em 1.5em; border-style:
                solid; border-color: lightgray; border-width: 0.08em; border-top: none; border-left: none; border-right: none;">
                    <h4>Tagged Accounts of this Video-Slide</h4>
                    
                    <img :src="thinGrayXIcon" @click="toggleShowTaggedAccountsOfSlide" style="cursor: pointer; height: 1.6em;
                    width: 1.6em; object-fit: contain;"/>
                </div>

                <br/>

                <FollowUser v-for="taggedAccountInfo in postDetails.slides[currSlide].taggedAccounts"
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

            <img v-if="intervalIdForHeartAnimation !== null" :src="heartAnimationIcon" :style="{height: '6.6em', width: '6.6em',
            pointerEvents: 'none', objectFit: 'contain', position: 'absolute', top: `${heartAnimationCoordinates[1]}%`, left:
            `${heartAnimationCoordinates[0]}%`, transform: 'translate(-50%, -50%)'}"/>
        </div>

        <a v-if="postDetails.adInfo !== null" :href="postDetails.adInfo.link" style="font-weight: bold; font-size: 1.1em; width:
        92%;">
            <div style="width: 100%; display: flex; align-items: center; gap: 1em; justify-content: start; border-style: solid;
            border-top: none; border-color: lightgray; border-width: 0.065em; padding: 1em 1em;">
                <img :src="megaphone" style="height: 1.8em; width: 1.8em; object-fit: contain; pointer-events: none;"/>

                <p style="max-width: 77%; overflow-wrap: break-word; text-align: start;">
                    {{ postDetails.adInfo.callToAction }}
                </p>
            </div>
        </a>

        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 1em;">
            <div style="display: flex; align-items: center;">
                <img v-if="!postDetails.isLiked" :src="blankHeartIcon" @click="toggleLikePost"
                class="mediaPostButton iconToBeAdjustedForDarkMode"/>

                <img v-else :src="redHeartIcon" @click="toggleLikePost" class="mediaPostButton"/>

                <img :src="commentIcon" class="mediaPostButton iconToBeAdjustedForDarkMode"
                @click="notifyParentToShowCommentsPopup"/>
            
                <img :src="sendPostIcon" class="mediaPostButton iconToBeAdjustedForDarkMode"
                @click="notifyParentToShowSendPostPopup"/>
            </div>

            <img v-if="!postDetails.isSaved" :src="blankSavedIcon" @click="toggleSavePost"
            class="mediaPostButton iconToBeAdjustedForDarkMode"/>

            <img v-else :src="blackSavedIcon" @click="toggleSavePost" class="mediaPostButton iconToBeAdjustedForDarkMode"/>
        </div>

        <p v-if="postDetails.likersFollowedByAuthUser.length == 0" @click="notifyParentToShowLikersPopup" style="margin-bottom: 0em;
        max-width: 60%; overflow-wrap: break-word; text-align: start; margin-top: 1em; margin-left: 0.4em; cursor: pointer;
        font-weight: bold;">
            {{ postDetails.numLikes.toLocaleString() + (postDetails.numLikes == 1 ? ' like' : ' likes') }}
        </p>

        <p v-else style="margin-bottom: 0em; max-width: 74%; overflow-wrap: break-word; text-align: start;">
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

                    <img v-if="usersAndTheirRelevantInfo[likerId]?.isVerified ?? false" :src="verifiedBlueCheck"
                    style="height: 1.4em; width: 1.4em; pointer-events: none; object-fit: contain; margin-left: -0.1em;
                    margin-right: -0.2em;"/>
                </a>

                <span style="margin-right: 0.15em;">, </span>

                <template v-if="index == postDetails.likersFollowedByAuthUser.length - 1">
                    <span>and </span>

                    <b @click="notifyParentToShowLikersPopup" style="cursor: pointer;">
                        {{ (postDetails.numLikes - postDetails.likersFollowedByAuthUser.length).toLocaleString() }}
                    </b>

                    <b v-if="postDetails.numLikes - postDetails.likersFollowedByAuthUser.length == 1"
                    @click="notifyParentToShowLikersPopup" style="cursor: pointer;">
                        other
                    </b>

                    <b v-else @click="notifyParentToShowLikersPopup" style="cursor: pointer;">
                        others
                    </b>
                </template>
            </template>
        </p>

        <p v-if="postDetails.caption !== null" style="max-width: 100%; overflow-wrap: break-word; text-align: start; margin-bottom:
        0em;">
            <a 
                :href="`http://34.111.89.101/profile/${usersAndTheirRelevantInfo[postDetails.caption.authorId]?.username ??
                `user ${postDetails.caption.authorId}`}`"
                target="_blank" 
                rel="noopener noreferrer"
                style="font-weight: bold; display: inline-flex; align-items: center; word-break: break-word; margin-right: 0.2em;"
            >
                {{ usersAndTheirRelevantInfo[postDetails.caption.authorId]?.username ?? `user ${postDetails.caption.authorId}` }}

                <img v-if="usersAndTheirRelevantInfo[postDetails.caption.authorId]?.isVerified ?? false" :src="verifiedBlueCheck"
                style="height: 1.4em; width: 1.4em; pointer-events: none; object-fit: contain; margin-left: -0.1em; margin-right:
                -0.2em;"/>
            </a>

            <component v-for="(el, index) in elementsForCaption"
                :key="index"
                :is="el"
            />
        </p>

        <p @click="notifyParentToShowCommentsPopup" class="loseOpacityWhenActive" style="color: gray; cursor: pointer;
        margin-bottom: 1em;">
            {{
                postDetails.numComments == 0 ? 'No comments yet' :
                postDetails.numComments == 1 ? 'View 1 comment' :
                `View all ${postDetails.numComments.toLocaleString()} comments`
            }}
        </p>

        <div style="width: 100%; height: 3em; position: relative;">
            <input :value="commentInput" @input="updateCommentInput" @focus="commentInputTextareaIsActive = true"
            @blur="commentInputTextareaIsActive = false" placeholder="Add a comment..." style="fontfamily: Arial; width: 100%;
            outline: none; border-top: none; border-left: none; border-right: none; border-color: lightgray; font-size: 1em;
            padding-bottom: 1em;"/>

            <b v-if="commentInput.length > 0" @click="postComment" style="cursor: pointer; color: #28a2fa; position: absolute;
            right: 0%; top: 0%;">
                Post
            </b>
        </div>
    </div>
</template>


<script setup>
    import FollowUser from './FollowUser.vue';
import PostDots from './PostDots.vue';
import UserIcon from './UserIcon.vue';

    import blackSavedIcon from '../assets/images/blackSavedIcon.png';
import blankHeartIcon from '../assets/images/blankHeartIcon.png';
import blankSavedIcon from '../assets/images/blankSavedIcon.png';
import commentIcon from '../assets/images/commentIcon.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import defaultVideoFrame from '../assets/images/defaultVideoFrame.jpg';
import heartAnimationIcon from '../assets/images/heartAnimationIcon.webp';
import megaphone from '../assets/images/megaphone.png';
import musicSymbol from '../assets/images/musicSymbol.png';
import nextSlideArrow from '../assets/images/nextSlideArrow.png';
import pauseIcon from '../assets/images/pauseIcon.png';
import playIcon from '../assets/images/playIcon.webp';
import redHeartIcon from '../assets/images/redHeartIcon.png';
import sendPostIcon from '../assets/images/sendPostIcon.png';
import taggedAccountsIcon from '../assets/images/taggedAccountsIcon.png';
import thinGrayXIcon from '../assets/images/thinGrayXIcon.png';
import threeHorizontalDots from '../assets/images/threeHorizontalDots.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

    import { defineProps, h, onBeforeMount, onMounted, ref, watch } from 'vue';


    const props = defineProps({
        authUserId: Number,
        
        postDetails: Object,
        mainPostAuthorInfo: Object,

        isFocused: Boolean,

        usersAndTheirRelevantInfo: Object,

        updatePostDetails: Function,
        showThreeDotsPopup: Function,
        showCommentsPopup: Function,
        showSendPostPopup: Function,
        showLikersPopup: Function,
        showErrorPopup: Function,
        showStoryViewer: Function,
        focusOnThisMediaPost: Function
    });

    const overallPostId = ref('');

    const mainPostAuthorId = ref(-1);

    const bgMusicIsPlaying = ref(false);
    const bgMusicObject = ref(null);

    const currSlide = ref(0);
    const displayTaggedAccountsOfSlide = ref(false);
    const displaySectionsOfVidSlide = ref(false);

    const elementsForCaption = ref([]);

    const commentInput = ref('');
    const commentInputTextareaIsActive = ref(false);

    const slideToVidTimeToFrameMappings = ref({});

    const heartAnimationCoordinates = ref([-1, -1]);
    const intervalIdForHeartAnimation = ref(null);

    const yourPostViewHasBeenAdded = ref(false);

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

        if(props.postDetails.bgMusic !== null) {
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

        finishSettingElementsForCaption();

        window.addEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
        checkIfPostIsViewedAsUserScrolls();
    });


    onBeforeMount(() => {
        window.removeEventListener('scroll', checkIfPostIsViewedAsUserScrolls);

        if (props.isFocused) {
            window.removeEventListener('keydown', handleKeyDownEventsWhenFocused);
        }
    });


    watch(() => props.isFocused, (newIsFocused) => {
        if (newIsFocused) {
            window.addEventListener('keydown', handleKeyDownEventsWhenFocused);
        }
        else {
            window.removeEventListener('keydown', handleKeyDownEventsWhenFocused);
        }
    });


    function handleKeyDownEventsWhenFocused(event) {
        const currSlideIsVid = props.postDetails.slides[currSlide.value].type === 'video';

        switch (event.key) {
            case 'Escape':
                if (!currSlideIsVid) {
                    props.focusOnThisMediaPost('');
                }
                break;
            case 'Enter':
                if (commentInputTextareaIsActive.value && commentInput.value.length > 0) {
                    postComment();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                if (!commentInputTextareaIsActive.value && !currSlideIsVid && currSlide.value > 0) {
                    changeSlide('decrement');
                }
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                if (!commentInputTextareaIsActive.value && !currSlideIsVid && currSlide.value + 1 <
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


    function checkIfPostIsViewedAsUserScrolls() {
        if (currSlideRef.value) {
            const rect = currSlideRef.value.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (rect.bottom <= viewportHeight && !yourPostViewHasBeenAdded.value) {
                yourPostViewHasBeenAdded.value = true;
                addViewToPost();
                window.removeEventListener('scroll', checkIfPostIsViewedAsUserScrolls);
            }
        }
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


    function toggleShowTaggedAccountsOfSlide() {        
        if(!displayTaggedAccountsOfSlide.value) {
            displaySectionsOfVidSlide.value = false;
            displayTaggedAccountsOfSlide.value = true;
        }
        else {
            displayTaggedAccountsOfSlide.value = false;
        }
    }


    function changeSlide(incrementOrDecrementText) {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = false;

        if(incrementOrDecrementText === 'increment') {
            currSlide.value++;
        }
        else {
            currSlide.value--;
        }
    }


    function finishSettingElementsForCaption() {
        const newElementsForCaption = [h('span', null, ' ')];
      
        let caption = props.postDetails.caption.content;
      
        while (caption.length > 0) {
          const indexOfNextAtSymbol = caption.indexOf('@');
          const indexOfNextHashtag = caption.indexOf('#');
      
          if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
            newElementsForCaption.push(h('span', null, caption));
            break;
          }
          else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 && indexOfNextHashtag < indexOfNextAtSymbol)) {
            newElementsForCaption.push(
              h('span', null, caption.substring(0, indexOfNextHashtag))
            );
      
            caption = caption.substring(indexOfNextHashtag);
            let indexOfSpaceAfterHashtagUsed = caption.indexOf(' ');
      
            if (indexOfSpaceAfterHashtagUsed === -1)
              indexOfSpaceAfterHashtagUsed = caption.length;
      
            const hashtagUsed = caption.substring(0, indexOfSpaceAfterHashtagUsed);
            newElementsForCaption.push(
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
      
            caption = caption.substring(indexOfSpaceAfterHashtagUsed);
          }
          else {
            newElementsForCaption.push(
              h('span', null, caption.substring(0, indexOfNextAtSymbol))
            );
      
            caption = caption.substring(indexOfNextAtSymbol);
            let indexOfSpaceAfterMentionedUsername = caption.indexOf(' ');
      
            if (indexOfSpaceAfterMentionedUsername === -1)
              indexOfSpaceAfterMentionedUsername = caption.length;
      
            const mentionedUsername = caption.substring(0, indexOfSpaceAfterMentionedUsername);
            newElementsForCaption.push(
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
      
            caption = caption.substring(indexOfSpaceAfterMentionedUsername);
          }
        }
      
        elementsForCaption.value = newElementsForCaption;
    }


    function updateCommentInput(event) {
        commentInput.value = event.target.value;
    }


    async function toggleShowSectionsOfVidSlide() {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = !displaySectionsOfVidSlide.value;

        if (displaySectionsOfVidSlide.value && props.postDetails.slides[currSlide.value].sections.length > 0 &&
        !(currSlide.value in slideToVidTimeToFrameMappings.value)) {
            for(let sectionInfo of props.postDetails.slides[currSlide.value].sections) {
                await getVideoFrameAtSpecifiedSlideAndTime(currSlide.value, sectionInfo[0]);
            }
        }
    }


    function takeUserToSectionInVideo(timeInSeconds) {
        if (vidSlideRef.value) {
            vidSlideRef.value.currentTime = timeInSeconds;
            vidSlideRef.value.play();
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
            video.src = props.postDetails.slides[currSlide.value].src;


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


    function notifyParentToShowThreeDotsPopup() {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = false;

        props.showThreeDotsPopup(props.postDetails);
    }


    function notifyParentToShowCommentsPopup() {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = false;

        props.showCommentsPopup(props.postDetails, currSlide.value);
    }


    function notifyParentToShowSendPostPopup() {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = false;
       
        props.showSendPostPopup(overallPostId.value);
    }


    function notifyParentToShowLikersPopup() {
        displayTaggedAccountsOfSlide.value = false;
        displaySectionsOfVidSlide.value = false;

        props.showLikersPopup(overallPostId.value);
    }


    function notifyParentToFocusOnThisMediaPost() {
        if (props.isFocused) {
            return;
        }

        props.focusOnThisMediaPost(overallPostId.value);
    }


    async function addViewToPost() {
        try {
            const response = await fetch(
            'http://34.111.89.101/api/Home-Page/springBootBackend2/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `mutation ($authUserId: Int!, $overallPostId: String!) {
                        addViewToPost(authUserId: $authUserId, overallPostId: $overallPostId)
                    }`,
                    variables: {
                        authUserId: props.authUserId,
                        overallPostId: overallPostId.value
                    }
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                console.error(`The server had trouble adding your view to post ${overallPostId.value}`);
            }
        }
        catch (error) {
            console.error(`There was trouble connecting to the server to add your view to post ${overallPostId.value}`);
        }
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
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to add comments to posts');
            return;
        }

        try {
            const response = await fetch(
            'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `mutation ($authUserId: Int!, $overallPostId: String!, $commentContent: String!) {
                        addCommentToPost(authUserId: $authUserId, overallPostId: $overallPostId, commentContent: $commentContent)
                    }`,
                    variables: {
                        authUserId: props.authUserId,
                        overallPostId: overallPostId.value,
                        commentContent: commentInput.value
                    }
                }),
                credentials: 'include'
            });

            if(!response.ok) {
                props.showErrorPopup('The server had trouble adding your comment.');
            }
            else {
                props.updatePostDetails(
                    overallPostId.value,
                    {
                        numComments: props.postDetails.numComments + 1
                    }
                );
                commentInput.value = '';
            }
        }
        catch (error) {
            props.showErrorPopup('There was trouble connecting to the server to add your comment.');
        }
    }
</script>