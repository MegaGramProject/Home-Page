<template>
  <a :href="entireNotificationLink" target="blank" rel="noopener noreferrer">
    <div class="popup"  @mouseenter="userIsHoveringOnThisNotification=true" @mouseleave="handleMouseLeave" style="position:
    fixed; top: 2%; left: 25%; width: 50%; height: 6em; border-radius: 0.7em; box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px
    rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
    z-index: 2; padding-left: 3em; padding-top: 1.5em; padding-bottom: 1em;">
      <img v-if="userIsHoveringOnThisNotification" :src="frisbeeXIcon" @click="deleteThis" style="height: 2em; width:
      2em; object-fit: contain; cursor: pointer; position: absolute; top: 1%; right: -3.5%; transform:
      translate(-50%, -50%);"/>

      <div style="display: flex; gap: 3em; align-items: start;">
        <a :href="leftImageLink" target="blank" rel="noopener noreferrer">
          <img :src="leftImage" style="height: 4em; width: 4em; object-fit: contain;"/>
        </a>

        <p style="text-align: start; width: 70%; max-height: 5em; overflow-wrap: break-word; overflow-y: scroll;
        margin-top: 0.5em;">
          <component v-for="(el, index) in elementsForDescription"
            :key="index"
            :is="el"
          />
        </p>

        <img v-if="rightImage !== null" :src="rightImage" style="height: 5em; width: 4.8em;"/>
      </div>
    </div>
  </a>
</template>


<script setup>
    /* eslint-disable no-unused-vars */
  import frisbeeXIcon from '../assets/images/frisbeeXIcon.png';

  import { defineProps, h, onBeforeUnmount, onMounted, ref } from 'vue';

  const props = defineProps({
    leftImage: null,
    rightImage: null,

    description: String,

    leftImageLink: String,
    entireNotificationLink: String,

    deleteThis: Function
  });

  const userIsHoveringOnThisNotification = ref(false);

  const elementsForDescription = ref([]);

  const timeoutIdForDeletingThis = ref(null);


  onMounted(() => {
    finishSettingElementsForDescription();

    timeoutIdForDeletingThis.value = setTimeout(() => { props.deleteThis(null); }, 4500);
  });


  onBeforeUnmount(() => {
    clearTimeout(timeoutIdForDeletingThis.value);
    timeoutIdForDeletingThis.value = null;
  });


  function finishSettingElementsForDescription() {
    const newElementsForDescription = [];
    
    let descriptionValue = props.description;
  
    while (descriptionValue.length > 0) {
      const indexOfNextAtSymbol = descriptionValue.indexOf('@');
      const indexOfNextHashtag = descriptionValue.indexOf('#');
  
      if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
        newElementsForDescription.push(h('span', null, descriptionValue));
        break;
      }
      else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 && indexOfNextHashtag < indexOfNextAtSymbol)) {
        newElementsForDescription.push(
          h('span', null, descriptionValue.substring(0, indexOfNextHashtag))
        );
  
        descriptionValue = descriptionValue.substring(indexOfNextHashtag);
        let indexOfSpaceAfterHashtagUsed = descriptionValue.indexOf(' ');
  
        if (indexOfSpaceAfterHashtagUsed === -1)
        indexOfSpaceAfterHashtagUsed = descriptionValue.length;
  
        const hashtagUsed = descriptionValue.substring(0, indexOfSpaceAfterHashtagUsed);
        newElementsForDescription.push(
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
  
        descriptionValue = descriptionValue.substring(indexOfSpaceAfterHashtagUsed);
      }
      else {
        newElementsForDescription.push(
          h('span', null, descriptionValue.substring(0, indexOfNextAtSymbol))
        );
  
        descriptionValue = descriptionValue.substring(indexOfNextAtSymbol);
        let indexOfSpaceAfterMentionedUsername = descriptionValue.indexOf(' ');
  
        if (indexOfSpaceAfterMentionedUsername === -1)
          indexOfSpaceAfterMentionedUsername = descriptionValue.length;
  
        const mentionedUsername = descriptionValue.substring(0, indexOfSpaceAfterMentionedUsername);
        newElementsForDescription.push(
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
  
        descriptionValue = descriptionValue.substring(indexOfSpaceAfterMentionedUsername);
      }
    }
  
    elementsForDescription.value = newElementsForDescription;
  }


  function handleMouseLeave() {
    setTimeout(() => userIsHoveringOnThisNotification.value = false, 600)
  }
</script>