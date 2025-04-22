<template>
    <template v-if="username === 'Anonymous Guest'">
        <div style="width: 8em; height: 10em">
            <p style="font-size: 0.7em; text-align: start">
                You are currently logged in as a guest. This means that you can only view posts/stories
                of public accounts. You cannot interact with other users in any way without logging in to
                an account of your own.
            </p>
        </div>
    </template>
  
    <template v-else>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center">
            <template v-if="userHasStories">
                <div :style="{background: userHasUnseenStory ? 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' : 'lightgray',
                borderRadius:'100%', height:'4.6em', width:'4.6em', position:'relative'}">
                    <div style="background: white; border-radius: 100%; height: 4.45em; width: 4.45em; position: absolute; left:
                    50%; top: 50%; transform: translate(-50%, -50%)">
                        <img @click="onClickingProfilePhoto" :src="userPfp" style="height: 4.25em; width: 4.25em; object-fit: 
                        contain; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); cursor: pointer" />
                        
                        <a v-if="inStoriesSection && username === authUsername" href="http://34.111.89.101/postStory" target="_blank"
                        rel="noopener noreferrer">
                            <img :src="bluePlusIcon" style="height: 1.75em; width: 1.75em; object-fit: contain; position: absolute;
                            left: 65%; top: 65%; cursor: pointer" />
                        </a>
                    </div>
                </div>
            </template>

            <template v-else>
                <div style="background: white; border-radius: 100%; height: 4.2em; width: 4.2em; position: relative">
                    <img @click="onClickingProfilePhoto" :src="userPfp" style="height: 95%; width: 95%; object-fit: contain;
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); cursor: pointer" />

                    <a v-if="inStoriesSection && username === authUsername" href="http://34.111.89.101/postStory" target="_blank"
                    rel="noopener noreferrer">
                        <img :src="bluePlusIcon" style="height: 1.75em; width: 1.75em; object-fit: contain; position:
                        absolute; left: 65%; top: 65%; cursor: pointer" />
                    </a>
                </div>
            </template>

            <template v-if="inStoriesSection">
                <div style="display: flex; justify-content: center; width: 100%; align-items: center;">
                    <p style="text-align: center; font-size: 0.8em; max-width: 7.5em; overflow-wrap: break-word">
                        {{ username === authUsername ? 'You' : username }}
                    </p>

                    <img v-if="userIsVerified" :src="verifiedBlueCheck" style="pointer-events: none; height: 1.5em; width: 1.5em;
                    object-fit: contain" />
                </div>
            </template>
        </div>  
    </template>
</template>


<script setup>
    import bluePlusIcon from '../assets/images/bluePlusIcon.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

    import { defineProps } from 'vue';

    
    const props = defineProps({
        authUsername: String,

        userId: Number,
        username: String,
        userPfp: String,

        inStoriesSection: Boolean,
        userHasStories: Boolean,
        userHasUnseenStory: Boolean,
        userIsVerified: Boolean,

        showStoryViewer: Function
    });


    function onClickingProfilePhoto() {
        if (props.userHasStories) {
            props.showStoryViewer(props.userId, props.username, props.inStoriesSection);
        }
        else {
            window.open(`http://34.111.89.101/profile/${props.username}`, '_blank');
        } 
    }
</script>