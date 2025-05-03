<template>
    <div id="leftSidebar" style="position: fixed; height: 100%; top: 0%; left: 0%; width: 14%;">
        <div style="width: 100%; height: 100%; border-style: solid; border-color: lightgray; border-width: 0em 0.01em 0em 0em;
        position: relative;">
            <div style="display: flex; width: 90%; margin-left: 1em;">
                <p class="loseOpacityWhenActive" style="font-family: Billabong; font-size: 1.9em; font-weight: 100; cursor:
                pointer; margin-left: 0.2em;">
                    Megagram
                </p>
            </div>
    
            <div class="sidebarElement">
                <img :src="homeIcon" class="iconToBeAdjustedForDarkMode" style="height: 2.3em; width: 2.3em; pointer-events: none;
                object-fit: contain;"/>
                <b style="font-size: 1em; margin-left: 0.4em;">Home</b>
            </div>
    
            <a href="http://34.111.89.101/search" class="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img :src="searchIcon" class="iconToBeAdjustedForDarkMode" style="height: 1.8em; width: 2.3em; pointer-events: none;
                object-fit: contain;"/>
                <p style="font-size: 1em; margin-left: 0.4em;">Search</p>
            </a>
    
            <a href="http://34.111.89.101/messages" class="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img :src="messagesIcon" class="iconToBeAdjustedForDarkMode" style="height: 2.5em; width: 2.5em; pointer-events:
                none; object-fit: contain;"/>
                <p style="font-size: 1em; margin-left: 0.4em;">Messages</p>
            </a>
    
            <a href="http://34.111.89.101/notifications" class="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img :src="notificationsIcon" class="iconToBeAdjustedForDarkMode" style="height: 2.5em; width: 2.5em; pointer-events:
                none; object-fit: contain;"/>
                <p style="font-size: 1em; margin-left: 0.4em;">Notifications</p>
            </a>
    
            <a href="http://34.111.89.101/ai-chat" class="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img :src="aiIcon" class="iconToBeAdjustedForDarkMode" style="height: 1.9em; width: 1.9em; pointer-events: none;
                object-fit: contain; margin-left: 0.2em;"/>
                <p style="font-size: 1em; margin-left: 0.7em;">AI Chat</p>
            </a>
    
            <a href="http://34.111.89.101/profile" v-if="!authUserIsAnonymousGuest" class="sidebarElement" target="_blank"
            rel="noopener noreferrer">
                <img :src="profilePhoto" style="height: 2.2em; width: 2.2em; pointer-events: none; object-fit: contain;"/>
                <p style="font-size: 1em; margin-left: 0.8em;">Profile</p>
            </a>
    
            <a href="http://34.111.89.101/shop" class="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img :src="shopIcon" style="height: 2.5em; width: 2.5em; pointer-events: none; object-fit: contain;"/>
                <p style="font-size: 1em; margin-left: 0.4em;">Shop</p>
            </a>
    
            <div @click="toggleDisplayPopup" class="sidebarElement" style="position: absolute; bottom: 4%; left: 0%;">
                <img :src="moreIcon" class="iconToBeAdjustedForDarkMode" style="height: 1.8em; width: 1.8em; pointer-events: none;
                object-fit: contain;"/>
                <p :style="{ fontSize: '1em', marginLeft: '0.4em', fontWeight: displayPopup ? 'bold' : 'normal' }">
                    More
                </p>
            </div>
        </div>
    </div>
</template>
  

<script setup>
    import aiIcon from '../assets/images/aiIcon.png';
import homeIcon from '../assets/images/homeIcon.png';
import messagesIcon from '../assets/images/messagesIcon.png';
import moreIcon from '../assets/images/moreIcon.png';
import notificationsIcon from '../assets/images/notificationsIcon.png';
import searchIcon from '../assets/images/searchIcon.png';
import shopIcon from '../assets/images/shopIcon.png';

    import { defineProps } from 'vue';


    const props = defineProps({
        profilePhoto: String,

        displayPopup: Boolean,
        authUserIsAnonymousGuest: Boolean,

        toggleDisplayPopup: Function
    });

    props;
</script>
