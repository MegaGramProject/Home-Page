<template>
    <div class="selectUserOrGroupChat" @click="toggleSelectThisUserOrGroupChat" :style="{cursor: 'pointer', width: '93%',
    display: 'flex', alignItems: 'center', paddingLeft: '2em', position: 'relative', paddingTop: '0.5em', paddingBottom:
    '0.5em', paddingRight: '0.5em'}">
        <img :src="profilePhoto" :style="{height: '3.75em', width: '3.75em', objectFit: 'contain'}"/>

        <div :style="{display: 'flex', flexDirection: 'column', alignItems: 'start', marginLeft: '1em', gap: '0.7em'}">
            <div :style="{ display: 'flex', alignItems: 'center' }">
                <b :style="{maxWidth: '10em', overflowWrap: 'break-word', textAlign: 'start'}">
                    {{ usernameOrGroupChatName }}
                </b>

                <img v-if="isVerified" :src="verifiedBlueCheck" :style="{height: '1.5em', width: '1.5em', objectFit:
                'contain', pointerEvents: 'none'}"/>
            </div>
            <p :style="{marginTop: '-0.3em', color: 'gray', maxWidth: '10em', overflowWrap: 'break-word', textAlign:
            'start'}">
                {{ fullName === '?' ? 'Could not fetch full-name' : fullName }}
            </p>
        </div>

        <img v-if="isSelected" :src="checkedIcon" :style="{objectFit: 'contain', height: '2em', width: '2em', position:
        'absolute', right: '2%', top: '30%'}"/>

        <img v-else :src="solidGrayDot" :style="{objectFit: 'contain', height: '2em', width: '2em', position: 'absolute',
        right: '2%', top: '30%'}"/>
    </div>
</template>
  

<script setup>
    import checkedIcon from '../assets/images/checkedIcon.png';
import solidGrayDot from '../assets/images/solidGrayDot.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

    import { defineProps } from 'vue';


    const props = defineProps({
        groupChatId: Number,
        userId: Number,

        userOrGroupChatName: String,
        fullName: String, 
        profilePhoto: String,

        isSelected: Boolean,
        isVerified: Boolean,

        selectThisUserOrGroupChat: Function,
        unselectThisUserOrGroupChat: Function
    });

    
    function toggleSelectThisUserOrGroupChat() {
        if(!props.isSelected) {
            if(props.groupChatId==null) {
                props.selectThisUserOrGroupChat(`user/${props.userId}/${props.userOrGroupChatName}`);
            }
            else {
                props.selectThisUserOrGroupChat(`group-chat/${props.groupChatId}/${props.userOrGroupChatName}`);
            }
        }
        else {
            if(props.groupChatId==null) {
                props.unselectThisUserOrGroupChat(`user/${props.userId}/${props.userOrGroupChatName}`);
            }
            else {
                props.unselectThisUserOrGroupChat(`group-chat/${props.groupChatId}/${props.userOrGroupChatName}`);
            }
        }
    }
</script>