<template>
    <div :style="{position: 'fixed', height: '100%', width: '100%', top: '0%', left: '0%', backgroundColor: '#1c1c1c',
    color: 'white', zIndex: zIndex}">
        <p @click="closeStoryViewer" class="loseOpacityWhenActive" style="position: absolute; top: 2%; left: 1%; font-family:
        Billabong; font-size: 2.3em; cursor: pointer; margin-top: 0em;">
            Megagram
        </p>
  
        <img @click="closeStoryViewer" class="loseOpacityWhenActive" :src="thinWhiteXIcon" style="position: absolute; top: 1%;
        right: 0%; cursor: pointer; height: 3.5em; width: 3.5em; object-fit: contain;"/>

        <div style="position: absolute; top: 2%; left: 35%; height: 95%; width: 30%; border-radius: 1%; background-color: black;">
            <template v-if="numSlides > 0 && currSlide < numSlides && currSlide > -1">
                <img v-if="currStories[currSlide].vidDurationInSeconds == null" :src="currStories[currSlide].src" style="position:
                absolute; left: 0%; top: 0%; height: 100%; width: 100%; border-radius: 1%; z-index: 1;"/>

                <video v-if="currStories[currSlide].vidDurationInSeconds !== null" ref="videoSlideRef"
                :src="currStories[currSlide].src" autoPlay :muted="isMuted" style="position: absolute; left: 0%; top: 0%; height:
                100%; width: 100%; border-radius: 1%; z-index: 1;"/>
            </template>

            <div v-if="numSlides == 0" style="position: absolute; left: 0%; top: 0%; height: 100%; width: 100%; background-color:
            black; color: white; z-index: 1;">
                <p v-if="storyFetchingErrorMessage.length > 0" style="position: absolute; top: 50%; left: 50%; transform:
                translate(-50%,-50%); max-width: 75%;">
                    {{ storyFetchingErrorMessage }}
                </p>

                <img v-if="isCurrentlyFetchingStory" :src="loadingAnimation" style="pointer-events: none; height: 2em; width: 2em; 
                object-fit: contain; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);"/>
            </div>

            <img v-if="currSlide > 0 || (isFromStoriesSection && currIndexInStoriesSection > 0)" :src="nextSlideArrow"
            class="storyViewerSlideArrows" @click="() => incrementOrDecrementSlideByOne('decrement')" style="cursor: pointer;
            height: 2.4em; width: 2.4em; object-fit: contain; position: absolute; left: -5%; top: 50%; transform:
            translate(-50%, -50%) rotate(180deg); filter: brightness(5) contrast(0); z-index: 1;"/>

            <img v-if="currSlide + 1 < numSlides || (isFromStoriesSection && currIndexInStoriesSection + 1 <
            orderedListOfUsernamesInStoriesSection.length)" :src="nextSlideArrow" class="storyViewerSlideArrows"
            @click="() => incrementOrDecrementSlideByOne('increment')" style="cursor: pointer; height: 2.4em; width: 2.4em;
            object-fit: contain; position: absolute; right: -12%; top: 50%; transform: translate(-50%, -50%); filter: brightness(5)
            contrast(0); z-index: 1;"/>

            <img v-if="replyToStoryTextareaIsActive" :src="blackScreen" style="position: absolute; left: 0%; top: 0%; height:
            100%; width: 100%; border-radius: 1%; z-index: 2; pointer-events: none; opacity: 0.7;"/>

            <p v-if="displaySentText" style="background-color: #1c1c1c; color: white; padding: 0.8em 1.5em; position:
            absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); z-index: 2; border-radius: 0.5em; font-size:
            1.1em; pointer-events: none;">
                Sent
            </p>

            <div style="display: flex; flex-direction: column; margin-top: 1em; gap: 1em;">
                <div v-if="numSlides > 0" :style="{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center',
                gap: `${2 / (numSlides - 1)}%`, zIndex: '2'}">
                    <div v-for="(_, index) in numSlides" :key="index" :style="{width: `${90 / numSlides}%`, height: '3px',
                    backgroundColor: '#918f8e'}">
                        <div :style="{width: `${currSlide > index ? 100 : currSlide == index ? currSlideProgressPercent : 0}%`,
                        height: '100%', backgroundColor: 'white'}"></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; width: 95%; align-items: start; margin-left:
                2.5%; margin=right: 2.5%; z-index: 2;">
                    <div style="display: flex; align-items: center; gap: 0.85em;">
                        <a :href="`http://34.111.89.101/profile/${currStoryAuthorUsername}`" target="_blank"
                        rel="noopener noreferrer">
                            <img :src="
                                (currStoryAuthorId in usersAndTheirRelevantInfo &&
                                'profilePhoto' in usersAndTheirRelevantInfo[currStoryAuthorId]) ?
                                usersAndTheirRelevantInfo[currStoryAuthorId].profilePhoto :
                                defaultPfp
                            "
                            style="height: 3em; width: 3em; pointer-events: none; object-fit: contain; margin-left: 0.5em;"/>
                        </a>

                        <a :href="`http://34.111.89.101/profile/${currStoryAuthorUsername}`" style="color: white; text-align:
                        start; max-width: 9em; overflow-wrap: break-word" target="_blank" rel="noopener noreferrer">
                            {{ currStoryAuthorUsername }}
                        </a>
            
                        <img v-if="currStoryAuthorId in usersAndTheirRelevantInfo && 'isVerified' in
                        usersAndTheirRelevantInfo[currStoryAuthorId] && usersAndTheirRelevantInfo[currStoryAuthorId]
                        .isVerified" :src="verifiedBlueCheck" style="height: 1.58em; width: 1.58em; margin-left: -0.6em;
                        pointer-events: none; object-fit: contain;"/>

                        <template v-if="numSlides > 0 && currSlide < numSlides && currSlide > -1">
                            <span style="color: lightgray; margin-right: -0.3em; margin-left: -0.3em;">
                                •
                            </span>

                            <span style="color: lightgray;">
                                {{  currStories[currSlide].datetime }}
                            </span>
                        </template>
                    </div>

                    <div v-if="numSlides > 0 && currSlide < numSlides && currSlide > -1" style="display: flex; align-items:
                    center; gap: 0.7em;">
                        <img class="loseOpacityWhenActive" v-if="isMuted && currStories[currSlide].vidDurationInSeconds !== null"
                        @click="toggleIsMuted" :src="mutedIcon" style="height: 1.85em; width: 1.85em; cursor: pointer;
                        object-fit: contain;"/>

                        <img class="loseOpacityWhenActive" v-if="!isMuted && currStories[currSlide].vidDurationInSeconds !== null"
                        @click="toggleIsMuted" :src="notMutedIcon" style="height: 1.85em; width: 1.85em; cursor: pointer;
                        object-fit: contain;"/>

                        <img class="loseOpacityWhenActive" v-if="rateOfStoryProgression > 0" @click="togglePause" :src="pauseIcon2"
                        style="cursor: pointer; height: 1.5em; width: 1.5em; object-fit: contain;"/>

                        <img class="loseOpacityWhenActive" v-if="rateOfStoryProgression == 0" @click="togglePause"
                        :src="whitePlayIcon" style="cursor: pointer; height: 2em; width: 2em; object-fit: contain;"/>

                        <img class="loseOpacityWhenActive" v-if="authUserId == currStoryAuthorId" @click="deleteStory"
                        :src="whiteTrashIcon" style="cursor: pointer; height: 1.3em; width: 1.3em; object-fit: contain;"/>
                    </div>
                </div>

                <a v-if="numSlides > 0 && currSlide > -1 && currSlide < currStories.length && currStories[currSlide].adInfo !==
                null" :href="currStories[currSlide].adInfo.link" target="_blank" rel="noopener noreferrer" style="color: white;
                margin-top: 0em; z-index: 2; max-width: 65%; text-align: start; margin-left: 1.5em; overflow-wrap: break-word;
                font-size: 0.93em;">
                    <b>Sponsored: </b> {{ currStories[currSlide].adInfo.callToAction }}
                </a>
            </div>

            <div v-if="replyToStoryTextareaIsActive && replyToStoryInput.length == 0" style="position: absolute; bottom: 10%; left:
            0%; width: 100%; height: 20%; z-index: 2; display: flex; flex-direction: column; justify-content: center; align-items:
            center; color: white;">
                <h2>Quick Reactions</h2>

                <div style="display: flex; align-items: center; gap: 1em; width: 100%; margin-top: -1em; justify-content: center;">
                    <p @click="() => sendReplyToStory('😂')" style="font-size: 2em; cursor: pointer;">
                        😂
                    </p>

                    <p @click="() => sendReplyToStory('😍')" style="font-size: 2em; cursor: pointer;">
                        😍
                    </p>

                    <p @click="() => sendReplyToStory('🥳')" style="font-size: 2em; cursor: pointer;">
                        🥳
                    </p>

                    <p @click="() => sendReplyToStory('😎')" style="font-size: 2em; cursor: pointer;">
                        😎
                    </p>

                    <p @click="() => sendReplyToStory('😡')" style="font-size: 2em; cursor: pointer;">
                        😡
                    </p>

                    <p @click="() => sendReplyToStory('🥺')" style="font-size: 2em; cursor: pointer;">
                        🥺
                    </p>

                    <p @click="() => sendReplyToStory('😢')" style="font-size: 2em; cursor: pointer;">
                        😢
                    </p>

                    <p @click="() => sendReplyToStory('😮')" style="font-size: 2em; cursor: pointer;">
                        😮
                    </p>

                    <p @click="() => sendReplyToStory('💯')" style="font-size: 2em; cursor: pointer;">
                        💯
                    </p>
                </div>
            </div>

            <div v-if="numSlides > 0 && authUserId !== currStoryAuthorId" style="position: absolute; bottom: 0.5%; left: 0%;
            width: 100%; height: 10%; z-index: 2; display: flex; gap: 2em; justify-content: center; align-items: center;">
                <input :value="replyToStoryInput" @input="updateReplyToStoryInput"
                @focus="() => {
                    pauseStoryProgression();
                    replyToStoryTextareaIsActive = true;
                }"
                @blur="handleOnBlurOfReplyToStoryTextInput"
                :placeholder="`Reply to @${currStoryAuthorUsername}...`" style="width: 66%; border-radius: 2em;
                font-family: Arial; outline: none; resize: none; background-color: black; border-color: white;
                color: white; height: 3.5em; padding-left: 1em; font-size: 0.95em;"/>

                <button @click="sendReplyToStory(replyToStoryInput)" :style="{padding: '0.8em 0.5em', width: '6em', backgroundColor:
                '#4aa4ff', color: 'white', cursor: replyToStoryInput.length > 0 ? 'pointer' : '', borderRadius: '0.5em', border:
                'none', fontWeight: 'bold', opacity: replyToStoryInput.length > 0 ? '1' : '0.5'}">
                    Send
                </button>
            </div>
        </div>

        <div v-if="isFromStoriesSection" style="position: absolute; top: 50%; left: 6%; height: 40%; width: 25%; transform:
        translateY(-50%); display: flex; align-items: center; gap: 3em; justify-content: end; color: white;">
            <div v-for="absoluteDiff in [2, 1].filter(value => currIndexInStoriesSection - value > -1)" :key="absoluteDiff"
            @click="() => takeAuthUserToTheSelectedUsersStoryInStorySection(currIndexInStoriesSection - absoluteDiff)"
            style="border-radius: 5%; height: 90%; width: 45%; cursor: pointer; position: relative; display: flex;
            justify-content: center; align-items: center;">
                <img :src="orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff] in
                usersAndTheirStoryPreviews ? usersAndTheirStoryPreviews[orderedListOfUserIdsInStoriesSection[
                    currIndexInStoriesSection - absoluteDiff
                ]] : defaultVideoFrame" style="position: absolute; top: 0%; left: 0%; height: 100%; width: 100%; border-radius: 5%;
                z-index: 1; object-fit: cover;"/>

                <img :src="blackScreen" style="position: absolute; top: 0%; left: 0%; height: 100%; width: 100%; opacity: 
                0.7; border-radius: 5%; z-index: 2;"/>

                <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; gap: 0.3em;">
                    <img :src=" orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff] in
                    usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[
                        orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]
                    ]
                    ? usersAndTheirRelevantInfo[orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]]
                    .profilePhoto : defaultPfp" :style="{height: '3.8em', width: '3.8em', objectFit: 'contain'}" />

                    <b :style="{marginTop: '0.5em', marginBottom: '-1em', overflowWrap: 'break-word', maxWidth: '7em'}">
                        {{ orderedListOfUsernamesInStoriesSection[currIndexInStoriesSection - absoluteDiff] }}
                    </b>

                    <p v-if="orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff] in usersAndTheirStories" 
                    :style="{fontSize: '0.90em', overflowWrap: 'break-word', maxWidth: '4em'}">
                        {{
                            usersAndTheirStories[orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]][
                                usersAndYourCurrSlideInTheirStories[
                                    orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection - absoluteDiff]
                                ]
                            ].datetime
                        }}
                    </p>

                    <b v-if="orderedListOfSponsorshipStatusesInStoriesSection[currIndexInStoriesSection - absoluteDiff] == true"
                    style="margin-top: 1.5em;">
                        Sponsored
                    </b>
                </div>
            </div>
        </div>

        <div v-if="isFromStoriesSection" style="position: absolute; top: 50%; right: 6%; height: 40%; width: 25%; transform:
        translateY(-50%); display: flex; align-items: center; gap: 3em; justify-content: start; color: white;">
            <div v-for="absoluteDiff in [1, 2].filter(value => currIndexInStoriesSection + value <
            orderedListOfUserIdsInStoriesSection.length)" :key="absoluteDiff"
            @click="() => takeAuthUserToTheSelectedUsersStoryInStorySection(currIndexInStoriesSection + absoluteDiff)"
            style="border-radius: 5%; height: 90%; width: 45%; cursor: pointer; position: relative; display: flex;
            justify-content: center; align-items: center;">
                <img :src="orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff] in
                usersAndTheirStoryPreviews ? usersAndTheirStoryPreviews[orderedListOfUserIdsInStoriesSection[
                    currIndexInStoriesSection + absoluteDiff
                ]] : defaultVideoFrame" style="position: absolute; top: 0%; left: 0%; height: 100%; width: 100%; border-radius: 5%;
                z-index: 1; object-fit: cover;"/>

                <img :src="blackScreen" style="position: absolute; top: 0%; left: 0%; height: 100%; width: 100%; opacity: 
                0.7; border-radius: 5%; z-index: 2;"/>

                <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; gap: 0.3em;">
                    <img :src=" orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff] in
                    usersAndTheirRelevantInfo && 'profilePhoto' in usersAndTheirRelevantInfo[
                        orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]
                    ]
                    ? usersAndTheirRelevantInfo[orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]]
                    .profilePhoto : defaultPfp" :style="{height: '3.8em', width: '3.8em', objectFit: 'contain'}" />

                    <b :style="{marginTop: '0.5em', marginBottom: '-1em', overflowWrap: 'break-word', maxWidth: '7em'}">
                        {{ orderedListOfUsernamesInStoriesSection[currIndexInStoriesSection + absoluteDiff] }}
                    </b>

                    <p v-if="orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff] in usersAndTheirStories" 
                    :style="{fontSize: '0.90em', overflowWrap: 'break-word', maxWidth: '4em'}">
                        {{
                            usersAndTheirStories[orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]][
                                usersAndYourCurrSlideInTheirStories[
                                    orderedListOfUserIdsInStoriesSection[currIndexInStoriesSection + absoluteDiff]
                                ]
                            ].datetime
                        }}
                    </p>

                    <b v-if="orderedListOfSponsorshipStatusesInStoriesSection[currIndexInStoriesSection + absoluteDiff] == true"
                    style="margin-top: 1.5em;">
                        Sponsored
                    </b>
                </div>
            </div>
        </div>
    </div>
</template>
  

<script setup>
    import blackScreen from '../assets/images/blackScreen.png';
import defaultPfp from '../assets/images/defaultPfp.png';
import defaultVideoFrame from '../assets/images/defaultVideoFrame.jpg';
import loadingAnimation from '../assets/images/loadingAnimation.gif';
import mutedIcon from '../assets/images/mutedIcon.png';
import nextSlideArrow from '../assets/images/nextSlideArrow.png';
import notMutedIcon from '../assets/images/notMutedIcon.png';
import pauseIcon2 from '../assets/images/pauseIcon2.png';
import thinWhiteXIcon from '../assets/images/thinWhiteXIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';
import whitePlayIcon from '../assets/images/whitePlayIcon.png';
import whiteTrashIcon from '../assets/images/whiteTrashIcon.png';

    import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue';

    
    const props = defineProps({
        authUserId: Number,
        authUsername: String,
        authUsernameWasProvidedInRoute: Boolean,
        storyAuthorUsername: String,
        storyAuthorId: Number,

        zIndex: String,

        orderedListOfUserIdsInStoriesSection: Array,
        orderedListOfUsernamesInStoriesSection: Array,
        orderedListOfSponsorshipStatusesInStoriesSection: Array,
        isFromStoriesSection: Boolean,

        usersAndTheirStories: Object,
        usersAndTheirStoryPreviews: Object,
        usersAndYourCurrSlideInTheirStories: Object,
        vidStoriesAndTheirPreviewImages: Object,
        usersAndTheirRelevantInfo: Object,

        userIdsWhoseStoriesYouHaveFinished: Object,

        updateUsersAndTheirStories: Function,
        updateUsersAndTheirStoryPreviews: Function,
        updateUsersAndYourCurrSlideInTheirStories: Function,
        updateVidStoriesAndTheirPreviewImages: Function,
        addUserIdToSetOfUsersWhoseStoriesYouHaveFinished: Function,
        closeStoryViewer: Function,
        showErrorPopup: Function
    });      
    
    const currStoryAuthorUsername = ref('');
    const currStoryAuthorId = ref(-1);

    const currStories = ref([]);
    const currSlide = ref(-1);
    const numSlides = ref(-1);
    const currIndexInStoriesSection = ref(-1);

    const currSlideProgressPercent = ref(-1);
    const rateOfStoryProgression = ref(-1);
    const intervalIdForStoryProgression = ref(null);

    const displaySentText = ref(false);

    const replyToStoryTextareaIsActive = ref(false);
    const replyToStoryInput = ref('');

    const isMuted = ref(true);
    const isCurrentlyFetchingStory = ref(false);
    
    const storyFetchingErrorMessage = ref('');

    const videoSlideRef = ref(null);

    
    onMounted(() => {
        currStoryAuthorUsername.value = props.storyAuthorUsername;
        currStoryAuthorId.value = props.storyAuthorId;

        window.addEventListener('keydown', handleKeyDownEvents);
    });


    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeyDownEvents);
    });


    watch(currStoryAuthorUsername, (newCurrStoryAuthorUsername) => {
        if (newCurrStoryAuthorUsername.length>0) {
            numSlides.value = 0;

            if(props.isFromStoriesSection) {
                const newCurrIndexInStoriesSection = props.orderedListOfUsernamesInStoriesSection.indexOf(
                    newCurrStoryAuthorUsername
                );
                currIndexInStoriesSection.value = newCurrIndexInStoriesSection;
                currStoryAuthorId.value = props.orderedListOfUserIdsInStoriesSection[newCurrIndexInStoriesSection];
            }
            else {
                for(let userId of Object.keys(props.usersAndTheirRelevantInfo)) {
                    if('username' in props.usersAndTheirRelevantInfo[userId] &&
                    props.usersAndTheirRelevantInfo[userId].username === newCurrStoryAuthorUsername) {
                        currStoryAuthorId.value = userId;
                        break;
                    }
                }
            }

            fetchTheNecessaryStories();
        }
    });


    watch(currStories, (newCurrStories) => {
        numSlides.value = newCurrStories.length;
    });


    watch(rateOfStoryProgression, (newRateOfStoryProgression) => {
        clearInterval(intervalIdForStoryProgression.value);

        if(newRateOfStoryProgression > 0) {
            intervalIdForStoryProgression.value = setInterval(updateStoryProgression, 25);
        }
        else {
            intervalIdForStoryProgression.value = null;
        }
   });


    watch(currSlideProgressPercent, (newCurrSlideProgressPercent) => {
        if (newCurrSlideProgressPercent >= 100) {
            currSlide.value++;
            handleChangeInStory();
        }
   });


    //the method below is called right after the value of currSlide/currStories changes.
    async function handleChangeInStory() {
        rateOfStoryProgression.value = 0;
        currSlideProgressPercent.value = 0;

        let currSlideValue = currSlide.value;
        let currStoriesValue = currStories.value;
        let currStoryAuthorUsernameValue = currStoryAuthorUsername.value;
        let currStoryAuthorIdValue = currStoryAuthorId.value;
        let currIndexInStoriesSectionValue = currIndexInStoriesSection.value;

        let newUsersAndYourCurrSlideInTheirStories = {...props.usersAndYourCurrSlideInTheirStories};

        if(currSlideValue >= currStoriesValue.length) {
            newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = 0;
            props.updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

            if (!(props.userIdsWhoseStoriesYouHaveFinished.has(currStoryAuthorIdValue))) {
                props.addUserIdToSetOfUsersWhoseStoriesYouHaveFinished(currStoryAuthorIdValue);
            }

            if (props.isFromStoriesSection && currIndexInStoriesSectionValue + 1 < props.orderedListOfUsernamesInStoriesSection.length) {
                currStoryAuthorUsernameValue = props.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 1];
                currStoryAuthorUsername.value = currStoryAuthorUsernameValue;
            }
            else {
                props.closeStoryViewer();
            }
        }
        else if (currSlideValue > -1) {
            const currStoryId = currStoriesValue[currSlideValue].id;

            if(props.authUsernameWasProvidedInRoute) {
                window.history.pushState(
                    { page: 'stories' },
                    'Stories',
                    `/stories/${props.authUsername}/${currStoryId}`
                );
            }
            else {
                window.history.pushState(
                    { page: 'stories' },
                    'Stories',
                    `/stories/${currStoryId}`
                );
            }

            addViewToStory(currStoryId);
    
            if(currStoriesValue[currSlideValue].vidDurationInSeconds==null) {
                rateOfStoryProgression.value = 0.5;
            } 
            else {
                rateOfStoryProgression.value = 2.5/currStoriesValue[currSlideValue].vidDurationInSeconds;
            }

            const yourNextSlideOfCurrStoryAuthor = currSlideValue + 1 < currStoriesValue.length ? currSlideValue + 1 : 0;

            newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = yourNextSlideOfCurrStoryAuthor;     
            props.updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

            const yourNextStoryOfCurrStoryAuthor = currStoriesValue[yourNextSlideOfCurrStoryAuthor];
            const newUsersAndTheirStoryPreviews = {...props.usersAndTheirStoryPreviews};

            if (yourNextStoryOfCurrStoryAuthor.vidDurationInSeconds == null) {
                newUsersAndTheirStoryPreviews[currStoryAuthorIdValue] = yourNextStoryOfCurrStoryAuthor.src;
            }
            else {
                if (!(yourNextStoryOfCurrStoryAuthor.id in props.vidStoriesAndTheirPreviewImages)) {
                    const newVidStoriesAndTheirFirstFrames = {...props.vidStoriesAndTheirPreviewImages};
                    newVidStoriesAndTheirFirstFrames[yourNextStoryOfCurrStoryAuthor.id] = await getFirstFrameForPreviewImgOfVid(
                        yourNextStoryOfCurrStoryAuthor.src
                    );
                    props.updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirFirstFrames);
                }

                newUsersAndTheirStoryPreviews[currStoryAuthorIdValue] = props.vidStoriesAndTheirPreviewImages[
                    yourNextStoryOfCurrStoryAuthor.id
                ];
            }

            props.updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews);
        }
        else if (props.isFromStoriesSection && currIndexInStoriesSectionValue - 1 > -1) {
            currStoryAuthorUsernameValue = props.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 1];
            currStoryAuthorUsername.value = currStoryAuthorUsernameValue;
        }
        else {
            props.closeStoryViewer();
        }
    }


    function updateStoryProgression() {
        if (currSlideProgressPercent.value + rateOfStoryProgression.value > 100) {
            currSlideProgressPercent.value = 100;
        }
        else {
            currSlideProgressPercent.value += rateOfStoryProgression.value;
        }
    }


    function incrementOrDecrementSlideByOne(incrementOrDecrementText) {
        if (incrementOrDecrementText === 'increment') {
            currSlide.value++;
            handleChangeInStory();
        }
        else {
            currSlide.value--;
            handleChangeInStory();
        }
    }


    function takeAuthUserToTheSelectedUsersStoryInStorySection(newCurrIndexInStoriesSection) {
        currStoryAuthorUsername.value = props.orderedListOfUsernamesInStoriesSection[newCurrIndexInStoriesSection];
    }


    function togglePause() {
        if(rateOfStoryProgression.value == 0) {
            resumeStoryProgression();
        }
        else {
            pauseStoryProgression();
        }
    }


    function pauseStoryProgression() {
        rateOfStoryProgression.value = 0;

        if(videoSlideRef.value) {
            videoSlideRef.value.pause();
        }
    }


    function resumeStoryProgression() {
        if(currStories.value[currSlide.value].vidDurationInSeconds==null) {
            rateOfStoryProgression.value = 0.5;
        }
        else {
            rateOfStoryProgression.value = 2.5/currStories.value[currSlide.value].vidDurationInSeconds;
            
            if(videoSlideRef.value) {
                videoSlideRef.value.play();
            }
        }
    }


    function updateReplyToStoryInput(event) {
        replyToStoryInput.value = event.target.value;
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


    function toggleIsMuted() {
        if (videoSlideRef.value) {
            videoSlideRef.value.muted = !isMuted.value;
            isMuted.value = !isMuted.value;
        }
    }


    function convertByteArrayToBase64String(byteArray) {
        const binaryString = String.fromCharCode(...byteArray);
        return btoa(binaryString);
    }


    async function getFirstFrameForPreviewImgOfVid(videoBase64String) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.src = videoBase64String;


            video.addEventListener('loadeddata', () => {
                video.currentTime = 0;
            });


            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageDataURL = canvas.toDataURL('image/png');
                resolve(imageDataURL);
            });


            video.onerror = (e) => {
                e;
                reject(new Error('Error loading video'));
            };
        });
    }


    function handleOnBlurOfReplyToStoryTextInput() {
        setTimeout(() => replyToStoryTextareaIsActive.value = false, 300);
        resumeStoryProgression();
    }


    function handleKeyDownEvents(event) {
        switch (event.key) {
            case 'Escape':
                props.closeStoryViewer();
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                if (!replyToStoryTextareaIsActive.value) {
                    incrementOrDecrementSlideByOne('decrement');
                }
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                if (!replyToStoryTextareaIsActive.value) {
                    incrementOrDecrementSlideByOne('increment');
                }
                break;
            case 'm':
            case 'M':
                if (!replyToStoryTextareaIsActive.value) {
                    toggleIsMuted();
                }
                break;
            case 'k':
            case 'K':
            case ' ':
                if (!replyToStoryTextareaIsActive.value) {
                    togglePause();
                }
                break;
        }
    }


    async function addViewToStory(storyId) {
        if (props.authUserId == -1) {
            return;
        } 

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/addViewToStory/${props.authUserId}/${storyId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                console.error(`The springBootBackend2 server had trouble mark story ${storyId} as viewed`);
            }
        }
        catch (error) {
            console.error(`There was trouble connecting to the springBootBackend2 server to mark story ${storyId} as viewed`);
        }
    }


    async function sendReplyToStory(replyToSend) {
        if (replyToSend.length == 0) {
            return;
        }

        if (props.authUserId == -1) {
            props.showErrorPopup('Dear Anonymous Guest, you must be logged into an account to send replies to stories');
            return;
        } 

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/springBootBackend2/sendMessageToOneOrMoreUsersAndGroups/${props.authUserId}
            /individually`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    messageToSend: `Replied to story ${currStories.value[currSlide.value].id}: ${replyToSend}`,
                    usersAndGroupsToSendTo: [`user/${currStoryAuthorId.value}`]
                }),
                credentials: 'include'
            });
            if (!response.ok) {
                props.showErrorPopup(
                    'The server had trouble sending your reply to this story'
                );
            }
            else {
                replyToStoryInput.value = '';
                displaySentText.value = true;
                setTimeout(() => displaySentText.value = false, 850);

                replyToStoryTextareaIsActive.value = false;
                resumeStoryProgression();
            }
        }
        catch (error) {
            props.showErrorPopup(
                'There was trouble connecting to the server to send your reply to this story'
            );
        }
    }


    async function deleteStory() {
        let idOfStoryToDelete = currStories.value[currSlide.value].id;

        try {  
            const response = await fetch(
            `http:/34.111.89.101/api/Home-Page/springBootBackend2/deleteStory/${props.authUserId}/${idOfStoryToDelete}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                props.showErrorPopup('The server had trouble deleting this story of yours');
            }
            else {
                const newCurrStories = currStories.value.filter(story => story.id !== idOfStoryToDelete);

                currStories.value = newCurrStories;

                const newUsersAndTheirStories = {...props.usersAndTheirStories};

                newUsersAndTheirStories[props.authUserId] = newCurrStories;
                props.updateUsersAndTheirStories(newUsersAndTheirStories);

                handleChangeInStory();
            }
        }
        catch (error) {
            props.showErrorPopup('There was trouble connecting to the server to delete this story of yours');
        }
    }


    async function fetchTheNecessaryStories() {
        isCurrentlyFetchingStory.value = true;
        
        const newUsersAndYourCurrSlideInTheirStories = {...props.usersAndYourCurrSlideInTheirStories};

        if (props.isFromStoriesSection) {
            const userIdsNeededForStoryPreviewFetching = [];
            const currIndexInStoriesSectionValue = currIndexInStoriesSection.value;
            const userIdsAndTheirUsernames = {};
            const storySponsorshipStatusesForUsers = [];

            if (currIndexInStoriesSectionValue + 1 < props.orderedListOfUserIdsInStoriesSection.length &&
            !(props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 1] in props.usersAndTheirStoryPreviews)) {
                const userId = props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 1];
                const storySponsorshipStatus = props.orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue + 1
                ];
                const username =  props.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 1];

                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
                
            }

            if (currIndexInStoriesSectionValue + 2 < props.orderedListOfUserIdsInStoriesSection.length &&
            !(props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 2] in props.usersAndTheirStoryPreviews)) {
                const userId = props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 2];
                const storySponsorshipStatus = props.orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue + 2
                ];
                const username =  props.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 2];

                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }

            if (currIndexInStoriesSectionValue - 1 > -1 &&
            !(props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 1] in props.usersAndTheirStoryPreviews)) {
                const userId = props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 1];
                const storySponsorshipStatus = props.orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue - 1
                ];
                const username =  props.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 1];

                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }

            if (currIndexInStoriesSectionValue - 2 > -1 &&
            !(props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 2] in props.usersAndTheirStoryPreviews)) {
                const userId = props.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 2];
                const storySponsorshipStatus = props.orderedListOfSponsorshipStatusesInStoriesSection[
                    currIndexInStoriesSectionValue - 2
                ];
                const username =  props.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 2];
                
                userIdsNeededForStoryPreviewFetching.push(userId);
                storySponsorshipStatusesForUsers.push(storySponsorshipStatus);
                userIdsAndTheirUsernames[userId] = username;
            }
            
            if (userIdsNeededForStoryPreviewFetching.length>0) {
                try {
                    const response = await fetch(
                    `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoryPreviewsOfAtMost4Users/${props.authUserId}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userIds: userIdsNeededForStoryPreviewFetching,
                            storySponsorshipStatusesForUsers: storySponsorshipStatusesForUsers
                        }),
                        credentials: 'include'
                    });

                    if (!response.ok) {
                        console.error('The server had trouble providing some of the required story-previews');
                    }
                    else {
                        let responseData = await response.json();
                        let usersAndTheirStoryPreviewInfo = responseData.usersAndTheirStoryPreviewInfo;

                        const newUsersAndTheirStoryPreviews = {...props.usersAndTheirStoryPreviews};

                        for(let userId of Object.keys(usersAndTheirStoryPreviewInfo)) {
                            const userStoryPreviewInfo = usersAndTheirStoryPreviewInfo[userId];
                            const storyId = userStoryPreviewInfo.storyId;
                            const storyFileType = userStoryPreviewInfo.storyFileType;
                            const storyFileBuffer = userStoryPreviewInfo.storyFileBuffer;

                            if (storyFileType === 'image') {
                                newUsersAndTheirStoryPreviews[userId] = storyFileBuffer;
                            }
                            else {
                                const newVidStoriesAndTheirFirstFrames = {...props.vidStoriesAndTheirPreviewImages};
                                newVidStoriesAndTheirFirstFrames[storyId] = await getFirstFrameForPreviewImgOfVid(
                                    convertByteArrayToBase64String(storyFileBuffer)
                                );
                                props.updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirFirstFrames);

                                newUsersAndTheirStoryPreviews[userId] = newVidStoriesAndTheirFirstFrames[storyId];
                            }
                        }

                        props.updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews);
                    }
                }
                catch (error) {
                    console.error('There was trouble connecting to the server to provide some of the required story-previews');
                }
            }
        }

        const currStoryAuthorIdValue = currStoryAuthorId.value;
        const currStoryAuthorUsernameValue = currStoryAuthorUsername.value;
        const authUserIdValue = props.authUserId;

        if(!(currStoryAuthorIdValue in props.usersAndTheirStories)) {
            let onlyShowSponsoredStories = false;
            if (props.isFromStoriesSection &&
            props.orderedListOfSponsorshipStatusesInStoriesSection[currIndexInStoriesSection.value] == true) {
                onlyShowSponsoredStories = true;
            }

            try {
                const response1 = await fetch(
                `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoriesOfUser/${authUserIdValue}
                /${currStoryAuthorIdValue}/true/${onlyShowSponsoredStories}`, {
                    credentials: 'include'
                });

                if (!response1.ok) {
                    storyFetchingErrorMessage.value =
                    `The server had trouble getting the stories of ${currStoryAuthorUsernameValue}`;
                }
                else {
                    const userStoryData = await response1.json();

                    userStoryData.stories = userStoryData.stories.map(userStory => {
                        userStory.datetime = formatDatetimeString(userStory.datetime);
                        return userStory
                    });

                    const newUsersAndTheirStories = {...props.usersAndTheirStories};
                    newUsersAndTheirStories[currStoryAuthorIdValue] = userStoryData.stories;
                    props.updateUsersAndTheirStories(newUsersAndTheirStories);

                    currStories.value = userStoryData.stories;

                    if (userStoryData.currSlide === 'finished') {
                        currSlide.value = 0;

                        newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = 0;

                        props.addUserIdToSetOfUsersWhoseStoriesYouHaveFinished(currStoryAuthorIdValue);

                        handleChangeInStory();
                    }
                    else if (userStoryData.currSlide == -1) {
                        storyFetchingErrorMessage.value =
                        `User ${currStoryAuthorUsernameValue} does not currently have any unexpired stories`;
                    }
                    else {
                        currSlide.value = userStoryData.currSlide;

                        newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = userStoryData.currSlide;
                        
                        handleChangeInStory();
                    }
                }
            }
            catch (error) {
                storyFetchingErrorMessage.value =
                `There was trouble connecting to the server to get the stories of ${currStoryAuthorUsernameValue}`;
            }
        }
        else {
            currStories.value = props.usersAndTheirStories[currStoryAuthorIdValue];
            currSlide.value = props.usersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue];

            handleChangeInStory();
        }

        props.updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories);

        isCurrentlyFetchingStory.value = false;
    }
</script>