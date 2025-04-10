<template>
    <div class="popup" style="backgroundColor: white; width: 30em; height: 30em; display: flex; flexDirection: column;
    alignItems: center; borderRadius: 1.5%; position: relative; overflowY: scroll;">
        
        <div class="popup" style="display:flex; justifyContent: center; position: relative; width: 100%; borderStyle: solid;
        borderColor: lightgray; borderTop: none; borderLeft: none; borderRight: none; borderWidth: 0.08em; paddingTop: 1.5em;
        paddingBottom: 1em; boxShadow: none;">
            <b style="fontSize: 1.25em; color: #ed6258">Error</b>
            <img :src="thinGrayXIcon" @click="closePopup" style="height:1.3em; width:1.3em; cursor: pointer; position: absolute;
            right: 5%; top: 30%"/>
        </div>
    
        <p style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); maxWidth: 80%; maxHeight: 65%;
        overflowWrap: break-word; fontSize: 1em; color: gray;">
            {{ errorMessage }}
        </p>

    </div>
</template>


<script>
    import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';

    
    export default {
        props: {
            errorMessage: String,
            closePopup: Function
        },

        data() {
            return {
                thinGrayXIcon,
            }
        }
    };
</script>