<template>
  <div class="popup" :style="[{ width: '15em', borderRadius: '0.4em', paddingTop: '1em' }, { height: authUserId == -1 ?
  '16.5em' : '20em' }]">
    <a href="http://34.111.89.101/settings" class="sidebarElement" target="_blank" rel="noopener noreferrer">
        <img :src="settingsIcon" class="iconToBeAdjustedForDarkMode" style="height: 2em; width: 2em; pointerEvents: none;
        objectFit: contain;"/>
        <p style="fontSize: 0.89em; marginLeft: 0.4em;">Settings</p>
    </a>

    <a href="http://34.111.89.101/your-activity" class="sidebarElement" target="_blank" rel="noopener noreferrer">
        <img :src="yourActivityIcon" class="iconToBeAdjustedForDarkMode" style="height: 2em; width: 2em; objectFit: contain;
        pointerEvents: none;"/>
        <p style="fontSize: 0.89em; marginLeft: 0.4em;">Your activity</p>
    </a>

    <a href="http://34.111.89.101/saved" class="sidebarElement" target="_blank" rel="noopener noreferrer">
        <img :src="blankSavedIcon" class="iconToBeAdjustedForDarkMode" style="height: 2em; width: 2em; pointerEvents: none;
        objectFit: contain;"/>
        <p style="fontSize: 0.89em, marginLeft: 0.4em;">Saved</p>
    </a>

    <a href="http://34.111.89.101/report-a-problem" class="sidebarElement" target="_blank" rel="noopener noreferrer">
        <img :src="reportAProblemIcon" class="iconToBeAdjustedForDarkMode" style="height: 2em; width: 2em;
        objectFit: contain; pointerEvents: none;"/>
        <p style="fontSize: 0.89em; marginLeft: 0.4em;">Report a problem</p>
    </a>

    <div id="leftSideBarPopupGap" style="width: 100%; height: 0.9em; backgroundColor: #f7f7f7;"></div>

    <a href="http://34.111.89.101/login" class="sidebarElement" target="_blank" rel="noopener noreferrer">
        <p style="fontSize: 0.89em; marginLeft: 0.4em;">Switch accounts</p>
    </a>

    <div v-if="authUserId !== -1" @click="logout" class="sidebarElement">
        <p style="fontSize: 0.89em; marginLeft: 0.4em;">Log out</p>
    </div>
  </div>
</template>
  

<script setup>
    import blankSavedIcon from '../../assets/images/blankSavedIcon.png';
import reportAProblemIcon from '../../assets/images/reportAProblemIcon.png';
import settingsIcon from '../../assets/images/settingsIcon.png';
import yourActivityIcon from '../../assets/images/yourActivityIcon.png';

    import { defineProps } from 'vue';


    const props = defineProps({
        authUserId: Number,

        originalURL: String,
        
        showErrorPopup: Function,
    });


    async function logout() {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/logout/${props.authUserId}`, {
                method: 'PATCH',
                headers: {
                'Content-Type': 'application/json',
                },
                credentials: 'include',
            }
            );

            if (!response.ok) {
                props.showErrorPopup('The expressJSBackend1 server had trouble logging you out');
            }
            else {
                window.location.href = props.originalURL;
            }
        }
        catch (error) {
            props.showErrorPopup('There was trouble connecting to the expressJSBackend1 server to log you out.');
        }
    }
</script>
