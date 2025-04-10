<template>
    <div :style="{display: 'flex', width: '100%', position: 'absolute', top: currSlideIsImage ? '95%' : '90%', left: '0%',
    justifyContent: 'center', alignItems: 'center', gap: '0.2em', zIndex: '10'}">
        <img v-for="(_, index) in numSlides"
            :key="index"
            :src="index == currSlide ? solidWhiteDot : grayDot"
            :style="{height: index == currSlide ? '0.9em' : '0.6em', width: index == currSlide ?
            '0.9em' : '0.6em', marginBottom: index == currSlide ? '-0.1em' : '', pointerEvents: 'none'}"
        />
    </div>
</template>
  
<script>
    import grayDot from '../assets/images/grayDot.png';
    import solidWhiteDot from '../assets/images/solidWhiteDot.png';


    export default {
        props: {
            currSlide: Number,
            numSlides: Number
        },


        data() {
            return {
                grayDot,
                solidWhiteDot
            }
        }
    };
</script>
  