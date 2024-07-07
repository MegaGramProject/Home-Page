import getBlobDuration from 'get-blob-duration';
import React, { Component } from 'react';
import { v4 as uuidv4 } from 'uuid';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Comment from './comment';
import backArrow from './images/backArrow.png';
import blackSaveIcon from './images/blackSaveIcon.png';
import blankHeart from './images/blankHeartIcon.png';
import closePopupIcon from './images/closePopupIcon.png';
import commentIcon from './images/commentIcon.png';
import fastForward5Seconds from './images/fastForward5Seconds.png';
import nextArrow from './images/nextArrow.png';
import pauseIcon from './images/pauseIcon.png';
import redHeart from './images/redHeartIcon.png';
import rewind5Seconds from './images/rewind5Seconds.png';
import saveIcon from './images/saveIcon.png';
import sendIcon from './images/sendIcon.png';
import taggedAccountsIcon from './images/taggedAccountsIcon.png';
import threeHorizontalDots from './images/threeHorizontalDots.png';
import videoSettingsIcon from './images/videoSettingsIcon.png';
import PostDots from './postDots';
import StoryIcon from './storyIcon';
import './styles.css';
import frenchSubtitles from './subtitles_fr.vtt';

class CommentsPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            comment: "",
            sendComment: false,
            isLiked: false,
            numLikes: 0,
            currSlide: 0,
            isSaved: false,
            commentsSent: [],
            repliesSent: [],
            likesText: "",
            timeText: "",
            addCommentText: "Add a comment...",
            postText: "Post",
            locationText: "",
            showTags: false,
            currSlideIsVid: null,
            videoUrl: "",
            numPosts: 0,
            showQualityOptions: false,
            showSettingsPopup: false,
            showRightBanner: false,
            showLeftBanner: false,
            postDetails: null,
            playerInitialized: false,
            postId: "",
            replyToUsername: "",
            replyToCommentId: "",
            replyToComment: "",
            focusedOnComment: false,
            comments: [],
            replies: [],
            commentLikes: [],
            hearts:  [],
            showPreview: false,
            previewLeft: 30,
            previewImage: "",
            previewTime: "",
            currSection: "",
            sections: [],
            showSection: false
        };
        this.textInput = React.createRef();
        this.videoNode = React.createRef();
        this.spaceKeyTimer = null;
        this.spaceKeyPressed = false;
        this.slideToVideoUrlMapping = {};
        this.slideToVideoBlobMapping = {};
        this.timeToVideoFrameMapping = {};
    };

    translateTextPromise = async function(text, language1, language2){
        let language1Code;
        let language2Code;
        if(language1===language2) {
            return text;
        }
        if (language1==="English"){
            language1Code = "en";
        }
        else if(language1==="Español") {
            language1Code = "es";
        }
        else if(language1==="Français") {
            language1Code = "fr";
        }
        else if(language1==="हिंदी") {
            language1Code = "hi";
        }
        else if(language1==="中国人") {
            language1Code = "zh-CN";
        }
        else if(language1==="বাংলা"){
            language1Code = "bn";
        }
        else if(language1==="العربية") {
            language1Code = "ar";
        }
        else if(language1==="Deutsch") {
            language1Code = "de";
        }
        else if(language1==="Bahasa Indonesia") {
            language1Code = "id";
        }
        else if(language1==="Italiano"){
            language1Code = "it";
        }
        else if(language1==="日本語") {
            language1Code = "ja";
        }
        else if(language1==="Русский") {
            language1Code = "ru";
        }
        if (language2==="English"){
            language2Code = "en";
        }
        else if(language2==="Español") {
            language2Code = "es";
        }
        else if(language2==="Français") {
            language2Code = "fr";
        }
        else if(language2==="हिंदी") {
            language2Code = "hi";
        }
        else if(language2==="中国人") {
            language2Code = "zh-CN";
        }
        else if(language2==="বাংলা"){
            language2Code = "bn";
        }
        else if(language2==="العربية") {
            language2Code = "ar";
        }
        else if(language2==="Deutsch") {
            language2Code = "de";
        }
        else if(language2==="Bahasa Indonesia") {
            language2Code = "id";
        }
        else if(language2==="Italiano"){
            language2Code = "it";
        }
        else if(language2==="日本語") {
            language2Code = "ja";
        }
        else if(language2==="Русский") {
            language2Code = "ru";
        }
        const apiUrl = "https://deep-translate1.p.rapidapi.com/language/translate/v2";
        const data = {"q":text,"source":language1Code,"target":language2Code};
        const options = {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'deep-translate1.p.rapidapi.com',
            'x-rapidapi-key': '14da2e3b7emsh5cd3496c28a4400p16208cjsn947339fe37a4'
            },
            body: JSON.stringify(data)
        };
        try {
            const response = await fetch(apiUrl, options);
            if (!response.ok) {
                throw new Error("Network response not ok");
            }
            return response.json()['data']['translations']['translatedText'];
        }

        catch (error) {
            console.error('Error:', error);
            return "T";
        }
    }

    async updateLikesText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.likesText,
                currLang,
                this.props.language
            );
            this.setState({likesText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateTimeText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.timeText,
                currLang,
                this.props.language
            );
            this.setState({timeText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateAddCommentText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.addCommentText,
                currLang,
                this.props.language
            );
            this.setState({addCommentText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updatePostText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.postText,
                currLang,
                this.props.language
            );
            this.setState({postText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateLocationText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.locationText,
                currLang,
                this.props.language
            );
            this.setState({locationText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }


    async componentDidMount() {
        await this.updateAddCommentText("English");
        await this.updateTimeText("English");
        await this.updateLikesText("English");
        await this.updateLocationText("English");
        await this.updatePostText("English");
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    async componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    handleKeyUp = (event) => {
        if (this.props.isFocused  && event.key === ' ') {
            event.preventDefault();
            clearTimeout(this.spaceKeyTimer);
            this.spaceKeyPressed = false;
            if (this.player.playbackRate() === 2) {
                this.player.playbackRate(1);
            } else {
                if (this.player.paused()) {
                    this.player.play();
                    this.setState({showPauseSymbol: false});
                } else {
                    this.player.pause();
                    this.setState({showPauseSymbol: true});
                }
            }
        }
    }


    async componentDidUpdate(prevProps, prevState) {
        if(prevProps.isSaved !== this.props.isSaved) {
            this.setState({isSaved: this.props.isSaved});
        }
        if(prevProps.isLiked !== this.props.isLiked) {
            this.setState({isLiked: this.props.isLiked});
        }
        if (prevProps.postDetails != this.props.postDetails || (prevState.postDetails==null && this.props.postDetails!==null)) {
            if(this.props.postDetails[1].length>0) {
                    await this.fetchVideos();
            }
            let currSlideIsVid = !(this.props.postDetails[0].length > 0 && this.props.postDetails[0][0].slides.includes(this.props.currSlide));
            if(currSlideIsVid) {
                await this.fetchComments(this.props.postDetails[1][0].overallPostId);
                await this.fetchReplies(this.props.postDetails[1][0].overallPostId);
                await this.fetchCommentLikes(this.props.postDetails[1][0].overallPostId);

                this.setState({
                    currSlideIsVid: currSlideIsVid,
                    locationText: currSlideIsVid ? this.props.postDetails[1][0].locationOfPost : this.props.postDetails[0][0].locationOfPost,
                    timeText: currSlideIsVid ? this.formatDate(this.props.postDetails[1][0].dateTimeOfPost) : this.formatDate(this.props.postDetails[0][0].dateTimeOfPost),
                    numPosts: this.props.postDetails[0].length == 0 ? this.props.postDetails[1].length : this.props.postDetails[0][0].posts.length + this.props.postDetails[1].length,
                    likesText: this.props.numLikes + ' likes',
                    numLikes: this.props.numLikes,
                    currSlide: this.props.currSlide,
                    postDetails: this.props.postDetails,
                    videoUrl: this.slideToVideoUrlMapping[this.props.currSlide],
                    postId: this.props.postDetails[1][0].overallPostId,
                    commentsSent: [],
                    repliesSent: [],
                });
            }
            else {
                const x = this.props.postDetails[0][0].slides.indexOf(this.props.currSlide);
                const currPost = 'data:image/jpeg;base64,' + this.props.postDetails[0][0].posts[x];
                await this.fetchComments(this.props.postDetails[0][0].id);
                await this.fetchReplies(this.props.postDetails[0][0].id);
                await this.fetchCommentLikes(this.props.postDetails[0][0].id);
                this.setState({
                    currSlideIsVid: currSlideIsVid,
                    locationText: currSlideIsVid ? this.props.postDetails[1][0].locationOfPost : this.props.postDetails[0][0].locationOfPost,
                    timeText: currSlideIsVid ? this.formatDate(this.props.postDetails[1][0].dateTimeOfPost) : this.formatDate(this.props.postDetails[0][0].dateTimeOfPost),
                    numPosts: this.props.postDetails[0].length == 0 ? this.props.postDetails[1].length : this.props.postDetails[0][0].posts.length + this.props.postDetails[1].length,
                    likesText: this.props.numLikes + ' likes',
                    numLikes: this.props.numLikes,
                    currSlide: this.props.currSlide,
                    postDetails: this.props.postDetails,
                    currPost: currPost,
                    postId: this.props.postDetails[0][0].id,
                    commentsSent: [],
                    repliesSent: [],
                });

            }
        }
        if(prevProps.currSlide !== this.props.currSlide) {
            let currSlideIsVid = !(this.props.postDetails[0].length > 0 && this.props.postDetails[0][0].slides.includes(this.props.currSlide));
            if(currSlideIsVid) {
                this.setState({
                    currSlide: this.props.currSlide,
                    videoUrl: this.slideToVideoUrlMapping[this.props.currSlide],
                });
            }
            else {
                const x = this.props.postDetails[0][0].slides.indexOf(this.props.currSlide);
                const currPost = 'data:image/jpeg;base64,' + this.props.postDetails[0][0].posts[x];
                this.setState({
                    currSlide: this.props.currSlide,
                    currPost: currPost
                })
            }
        }
        if(prevProps.language != this.props.language) {
            await this.updateAddCommentText(prevProps.language);
            await this.updateTimeText(prevProps.language);
            await this.updateLikesText(prevProps.language);
            await this.updateLocationText(prevProps.language);
            await this.updatePostText(prevProps.language);
        }
        else {
            if(prevState.likesText !== this.state.likesText) {
                await this.updateLikesText("English");
            }
        }
        if(!prevState.currSlideIsVid && this.state.currSlideIsVid && !this.state.playerInitialized) {
            const Button = videojs.getComponent('Button');
                    class SettingsButton extends Button {
                    constructor(player, options) {
                        super(player, options);
                        this.controlText('Settings (s)');
                    }
                    handleClick = () => {
                        if (this.options_.toggleSettings) {
                            this.options_.toggleSettings();
                        }
                    }
                    createEl() {
                        let el = super.createEl('button', {
                            className: 'vjs-settings-button vjs-control vjs-button'
                        });
                
                        let icon = videojs.dom.createEl('img', {
                            src: videoSettingsIcon,
                            alt: 'Settings Icon',
                            className: 'custom-settings-icon'
                        });
                
                        el.appendChild(icon);
                
                        return el;
                    }
                    }
                    videojs.registerComponent('SettingsButton', SettingsButton);

                    this.player = videojs(this.videoNode.current , {
                        controls: true,
                        autoplay: false,
                        preload: 'auto',
                        fluid: true,
                        playbackRates: [0.125, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.25, 2.5, 3, 4, 6, 8],
                        controlBar: {
                        children: [
                            'playToggle',
                            'volumePanel',
                            'CurrentTimeDisplay',
                            'TimeDivider',
                            'DurationDisplay',
                            'progressControl',
                        ]
                        }
                    });
                
                    const progressControl = this.player.getChild('controlBar').getChild('progressControl');
                    this.player.getChild('controlBar').addChild('SubtitlesButton');
                    this.player.getChild('controlBar').addChild('SettingsButton', {
                        toggleSettings: this.toggleSettings,
                    });
                    this.player.getChild('controlBar').addChild('playbackRateMenuButton');
                    this.player.getChild('controlBar').addChild('fullscreenToggle');
                    progressControl.on('mousemove', this.handleMouseMove);
                    progressControl.on('mouseout', this.handleMouseLeave);
                    this.player.on('timeupdate', this.setSection);
                    this.player.on('useractive', this.showSection);
                    this.player.on('userinactive', this.hideSection);
                    this.setState({playerInitialized: true});
        }
    }


    currentlyInSection(currentTimeString, sectionInterval) {
        let section = sectionInterval.split("-");
        let startingTimeInSeconds = this.timeStringToSeconds(section[0]);
        let endingTimeInSeconds = this.timeStringToSeconds(section[1]);
        let currentTimeInSeconds = this.timeStringToSeconds(currentTimeString);
        if (startingTimeInSeconds <= currentTimeInSeconds && currentTimeInSeconds <= endingTimeInSeconds) {
            return true;
        }
        return false;
    }


    setSection = (event) => {
        const currentTime = this.player.el().querySelector('.vjs-current-time-display');
        const currentTimeString = currentTime.innerText.trim()
        let sectionInterval = "";
        let sectionFound = false;
        if(currentTimeString!==this.latestTimeString) {
            this.latestTimeString = currentTimeString;
            for(let section of this.state.sections) {
                sectionInterval = Object.keys(section)[0];
                if(this.currentlyInSection(currentTimeString, sectionInterval)) {
                    this.setState({
                        currSection: section[sectionInterval]
                    });
                    sectionFound = true;
                    break;
                }
            }
            if(!sectionFound) {
                this.setState({
                    currSection: ""
                });
            }
        }
    }

    showSection = () => {
        this.setState({showSection:true});
    }

    hideSection = () => {
        this.setState({showSection:false});
    }


    formatDate(dateString) {
        const date = new Date(dateString);
        const currentDate = new Date();
        const secondsDiff = Math.floor((currentDate - date) / 1000);
    
        if (secondsDiff < 60) {
            return `${secondsDiff}s`;
        } else {
            const minutesDiff = Math.floor(secondsDiff / 60);
            if (minutesDiff < 60) {
                return `${minutesDiff}m`;
            } else {
                const hoursDiff = Math.floor(minutesDiff / 60);
                if (hoursDiff < 24) {
                    return `${hoursDiff}h`;
                } else {
                    const daysDiff = Math.floor(hoursDiff/24);
                    if (daysDiff < 7) {
                        return `${daysDiff}d`;
                    }
                    else {
                        const weeksDiff = Math.floor(hoursDiff / 24 / 7);
                        if (weeksDiff < 4) {
                            return `${weeksDiff}w`;
                        } else {
                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            const month = months[date.getUTCMonth()];
                            const day = date.getUTCDate();
                            const year = date.getUTCFullYear();
                            return `${month} ${day}, ${year}`;
                        }
                    }
                }
            }
        }
    }

    handleCommentChange = (event) => {
        if (event.target.value.length > 0) {
            this.setState({comment: event.target.value,
            sendComment:true});
        }
        else {
            this.setState({comment: event.target.value,
            sendComment:false});
        }
    };

    removeHeart = (heartCoordinates) => {
        const { hearts } = this.state;
        const index = hearts.findIndex(heart =>
        heart[0] == heartCoordinates[0] && heart[1] == heartCoordinates[1]
        );
    
        if (index !== -1) {
            const newHearts = [...hearts];
            newHearts.splice(index, 1);
            this.setState({ hearts: newHearts });
        }
    }

    likePost = async (event) => {
        if(!this.state.isLiked) {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/addLike/'+this.props.postDetails[0][0].id, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                
                }
                else {
                    const response = await fetch('http://localhost:8004/addLike/'+this.props.postDetails[1][0].overallPostId, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                this.setState(
                    {isLiked: true,
                    likesText: this.state.numLikes==0 ? '1 like' : (this.state.numLikes+1) + ' likes',
                    numLikes: this.state.numLikes+1});
            }
            catch (error) {
                console.error('Error:', error);
            }
        }

        if(event) {
            const rect = event.target.getBoundingClientRect();
            const xRelativeToDiv = (event.clientX - rect.left)/rect.width * 100 - 12;
            const yRelativeToDiv = (event.clientY - rect.top)/rect.height * 100 - 11;
            const rotation = Math.random() * 20 - 10;
            const height = Math.random()*5 + 7;
            const width = Math.random()*5 + 7;
            const heartCoordinates = [xRelativeToDiv, yRelativeToDiv, rotation, height, width];
            this.setState({
                hearts: [...this.state.hearts, heartCoordinates]
            }, () => {
                setTimeout(() => {
                this.removeHeart(heartCoordinates);
                }, 900);
            });
        }
    }

    
    toggleLike = async () => {
        if (this.state.isLiked) {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/removeLike/'+this.props.postDetails[0][0].id, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                else {
                    const response = await fetch('http://localhost:8004/removeLike/'+this.props.postDetails[1][0].overallPostId, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                
                this.setState(
                    {isLiked: false,
                    likesText: this.state.numLikes==2 ? '1 like' : (this.state.numLikes-1) + ' likes',
                    numLikes: this.state.numLikes-1,
                });
            }
            catch (error) {
                console.error('Error:', error);
            }
        }
        else {
            this.likePost(null);
        }
    }

    getFramesAtEach5SecondInterval = async (currSlide) => {
        try {
            this.timeToVideoFrameMapping = {};
            const videoBlob = this.slideToVideoBlobMapping[currSlide];
            const duration = await getBlobDuration(videoBlob);
            const formData = new FormData();
            formData.append('video', videoBlob);
            formData.append('duration', String(duration));
            const framesResponse = await fetch('http://localhost:8006/getVideoFramesAtIntervals', {
                method: "POST",
                body: formData
            });
            if (!framesResponse.ok) {
                throw new Error('Failed to fetch frames');
            }
            const framesData = await framesResponse.json();
            const frames = framesData.frames;
            for(let i=0; i<=frames.length; i++) {
                const currFrame = frames[i];
                this.timeToVideoFrameMapping[i*5] = currFrame;
            }
    
        } catch (error) {
            console.error('Error fetching or processing video frames:', error);
        }
    }


    timeStringToSeconds(timeString) {
        const timeParts = timeString.split(':');
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        if(timeParts.length==1) {
            seconds = parseInt(timeParts[0]);
        }
        else if(timeParts.length==2) {
            minutes = parseInt(timeParts[0]);
            seconds = parseInt(timeParts[1]);
        }
        else if(timeParts.length==3) {
            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1])
            seconds = parseInt(timeParts[2]);
        }
        
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
        return totalSeconds;
    }


    findTime = (timeInSeconds) => {
        let val = timeInSeconds;
        while (val%5!==0 && val > -1) {
            val-=1
        }
        if(val>-1) {
            return val;
        }
        return -1
    }

    handleMouseMove = (event) => {
        if (this.player) {
            const progressControl = this.player.getChild('controlBar').getChild('progressControl');
            const rect = progressControl.el().getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const timeTooltipElement = this.player.el().querySelector('.vjs-time-tooltip');
            const timeTooltipElementTimeStr = timeTooltipElement.innerText.trim();
            const timeInSeconds = this.timeStringToSeconds(timeTooltipElementTimeStr);
            try {
            this.setState({
                showPreview: true,
                previewImage: this.timeToVideoFrameMapping[this.findTime(timeInSeconds)],
                previewLeft: (mouseX/rect.width)*45+20,
                previewTime: timeTooltipElementTimeStr
            });
            }
            catch (error) {
            console.error(error)
            }
        }
    }

    handleMouseLeave = (event) => {
        this.setState({
            showPreview: false,
            previewLeft: 500,
            previewImage: ""
        })
    }

    showNextSlide = () => {
        let nextSlideIsVid = !(this.state.postDetails[0].length > 0 && this.state.postDetails[0][0].slides.includes(this.state.currSlide+1));
        if (nextSlideIsVid) {
            let x = this.props.postDetails[1].filter(x=>x['slideNumber']==this.state.currSlide+1);
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.state.currSlide+1],
                currPost: "",
                currSlide: this.state.currSlide+1,
                currSlideIsVid: nextSlideIsVid,
                showTags: false,
                sections: x[0]['sections'],
                currSection: "",
                playerInitialized: false
                }, () => {this.getFramesAtEach5SecondInterval(this.state.currSlide);});
        }
        else {
            const x = this.state.postDetails[0][0].slides.indexOf(this.state.currSlide+1);
            const currPost = 'data:image/jpeg;base64,' + this.state.postDetails[0][0].posts[x];
            this.setState({
                videoUrl: "",
                currPost: currPost,
                currSlide: this.state.currSlide+1,
                currSlideIsVid: nextSlideIsVid,
                showTags: false,
                sections: [],
                currSection: "",
                playerInitialized: false
                });
        }
    }

    showPreviousSlide = () => {
        let prevSlideIsVid = !(this.state.postDetails[0].length > 0 && this.state.postDetails[0][0].slides.includes(this.state.currSlide-1));
        if (prevSlideIsVid) {
            let x = this.props.postDetails[1].filter(x=>x['slideNumber']==this.state.currSlide-1);
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.state.currSlide-1],
                currPost: "",
                currSlide: this.state.currSlide-1,
                currSlideIsVid: prevSlideIsVid,
                showTags: false,
                sections: x[0]['sections'],
                currSection: "",
                playerInitialized: false
                }, () => {this.getFramesAtEach5SecondInterval(this.state.currSlide);});
        }
        else {
            const x = this.state.postDetails[0][0].slides.indexOf(this.state.currSlide-1);
            const currPost = 'data:image/jpeg;base64,' + this.state.postDetails[0][0].posts[x];
            this.setState({
                videoUrl: "",
                currPost: currPost,
                currSlide: this.state.currSlide-1,
                currSlideIsVid: prevSlideIsVid,
                showTags: false,
                sections: [],
                currSection: "",
                playerInitialized: false
                });
        }
    };

    toggleSave = async () => {
        if(!this.state.isSaved) {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/addSave/'+this.props.postDetails[0][0].id, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                
                }
                else {
                    const response = await fetch('http://localhost:8004/addSave/'+this.props.postDetails[1][0].overallPostId, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                this.setState({
                    isSaved: true
                });
            }
            catch (error) {
                console.error('Error:', error);
            }
        }
        else {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/removeSave/'+this.props.postDetails[0][0].id, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                else {
                    const response = await fetch('http://localhost:8004/removeSave/'+this.props.postDetails[1][0].overallPostId, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: this.props.username }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                this.setState({isSaved: false});
            }
            catch (error) {
                console.error('Error:', error);
            }
        }
    }

    focusTextInput = () => {
        this.textInput.current.focus();
    };

    postComment = async () => {
        if(this.state.replyToCommentId.length==0) {
                try {
                    let currentDate = new Date();
                    const data = `
                    mutation {
                        addComment(
                        commentid: "${uuidv4()}"
                        comment: "${this.state.comment}"
                        datetime: "${currentDate.toISOString()}"
                        isedited: false
                        postid: "${this.state.postId}"
                        username: "${this.props.username}"
                        ) {
                        commentid
                        }
                    }`;
        
                    const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: data })
                    };
                    const response = await fetch('http://localhost:5022/graphql', options);
                    if (!response.ok) {
                        throw new Error("Error sending comment");
                    }
                    const responseData = await response.json();
                    this.setState({
                        commentsSent: [...this.state.commentsSent, [responseData['data']['addComment']['commentid'], this.state.comment]],
                        comment: "",
                        sendComment: false,
                        });
                }
                catch (error) {
                    console.error(error);
                }

        }
        else {
            try {
                let currentDate = new Date();
                let replyId = uuidv4();
                const data = `
                mutation {
                    addReply(
                    commentid: "${this.state.replyToCommentId}"
                    replyid: "${replyId}"
                    postid: "${this.state.postId}"
                    comment: "${this.state.comment}"
                    datetime: "${currentDate.toISOString()}"
                    isedited: false
                    username: "${this.props.username}"
                    ) {
                    commentid
                    }
                }`;
    
                const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: data })
                };
                const response = await fetch('http://localhost:5022/graphql', options);
                if (!response.ok) {
                    throw new Error("Error sending reply");
                }
                const responseData = await response.json();
                this.setState({
                    repliesSent: [...this.state.repliesSent, [replyId, this.state.comment, this.state.replyToUsername, this.state.replyToComment]],
                    comment: "",
                    sendComment: false,
                    addCommentText: "Add a comment...",
                    replyToCommentId: "",
                    replyToComment: "",
                    replyToUsername: "",
                });
            }
            catch (error) {
                console.error(error);
            }
            
        }
    }


    handleKeyDown = (event) => {
        if(!this.state.currSlideIsVid) {
            if (this.props.isFocused && event.key === 'ArrowRight') {
                if(this.state.currSlide < this.state.numPosts-1) {
                    this.showNextSlide();
                }
            }
            else if(this.props.isFocused && event.key=== 'ArrowLeft') {
                if(this.state.currSlide>0) {
                    this.showPreviousSlide();
                }
            }
        }
        else {
            if (this.props.isFocused && !this.state.focusedOnComment) {
                const player = this.player;
                if (!player) return;
                switch(event.key) {
                    case 'ArrowRight':
                        player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
                        this.setState({showRightBanner: true });
                        setTimeout(() => {
                        this.setState({showRightBanner: false });
                        }, 250);
                        break;
                    case 'ArrowLeft':
                        player.currentTime(Math.max(0, player.currentTime() - 5));
                        this.setState({showLeftBanner: true});
                        this.timer = setTimeout(() => {
                            this.setState({showLeftBanner: false});
                        }, 250);
                        break;
                    case ' ':
                        event.preventDefault();
                        if (!this.Pressed) {
                            this.spaceKeyPressed = true;
                            this.spaceKeyTimer = setTimeout(() => {
                                player.playbackRate(2);
                            }, 500);
                        }
                        break;
                    case 'k':
                    case 'K':
                        event.preventDefault();
                        if (player.paused()) {
                            this.setState({showPauseSymbol: false});
                            player.play();
                        } else {
                            player.pause();
                            this.setState({showPauseSymbol: true});
                        }
                        break;
                    case 'F':
                    case 'f':
                        if (document.fullscreenElement) {
                            document.exitFullscreen();
                        } else {
                            if (this.videoNode.current.requestFullscreen) {
                                this.videoNode.current.requestFullscreen();
                            } else if (this.videoNode.current.mozRequestFullScreen) {
                                this.videoNode.current.mozRequestFullScreen();
                            } else if (this.videoNode.current.webkitRequestFullscreen) {
                                this.videoNode.current.webkitRequestFullscreen();
                            } else if (this.videoNode.current.msRequestFullscreen) {
                                this.videoNode.current.msRequestFullscreen();
                            }
                        }
                        break;
                    case 'm':
                    case 'M':
                        player.muted(!player.muted());
                        break;
                    default:
                        break;
                    }
                }
        }

        }


    handleClick = () => {
        this.setState({focusedOnComment: false});
        this.props.onFocus(this.props.id);
    }
    
    toggleTags = () => {
        this.setState({showTags: !this.state.showTags});
    }

    hideCommentsPopup = () => {
        this.slideToVideoUrlMapping = {};
        this.setState({postDetails: null, videoUrl: "", currPost: "", postId: "", comments: [], replies: [], commentLikes: [],
        commentsSent:[], repliesSent:[]});
        this.props.hideCommentsPopup();
    }



    async fetchVideos() {
        for(let i of this.props.postDetails[1]) {
            try {
                let videoId = i['videoId'];
                let slideNumber = i['slideNumber'];
                const response = await fetch(`http://localhost:8004/getVideo/${videoId}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const videoBlob = await response.blob();
                this.slideToVideoBlobMapping[slideNumber] = videoBlob;
                const videoUrl = URL.createObjectURL(videoBlob);
                this.slideToVideoUrlMapping[slideNumber] = videoUrl;
            } catch (error) {
                console.error('Trouble connecting to server:', error);
            }
        }
        if(this.slideToVideoUrlMapping[this.props.currSlide]) {
            let x = this.props.postDetails[1].filter(x=>x['slideNumber']==0);
            console.log(x[0]['sections']);
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.props.currSlide],
                sections: x[0]['sections']
            },
            () => {this.getFramesAtEach5SecondInterval(0);});
        }
    
    }

    async fetchComments(overallPostId) {
        const data = `
        query {
            comments(where: { postid: { eq: "${overallPostId}" } }) {
            comment
            commentid
            datetime
            isedited
            username
            iscaption
            }
        }
        `;

        const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: data })
        };

        try {
        const response = await fetch('http://localhost:5022/graphql', options);
        if (!response.ok) {
            throw new Error("Error fetching comments");
        }
        const responseData = await response.json();
        this.setState({comments: responseData['data']['comments']});
        }
        catch (error) {
        console.error(error);
        }
    }

    async fetchReplies(overallPostId) {
        const data = `
        query {
            replies(where: { postid: { eq: "${overallPostId}" } }) {
            replyid
            comment
            commentid
            datetime
            isedited
            username
            }
        }
        `;

        const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: data })
        };

        try {
        const response = await fetch('http://localhost:5022/graphql', options);
        if (!response.ok) {
            throw new Error("Error fetching replies");
        }
        const responseData = await response.json();
        this.setState({replies: responseData['data']['replies']});
        }
        catch (error) {
        console.error(error);
        }
    }

    async fetchCommentLikes(overallPostId) {
        const data = `
        query {
            commentLikes(where: { postid: { eq: "${overallPostId}" } }) {
            username
            commentid
            }
        }
        `;

        const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: data })
        };

        try {
        const response = await fetch('http://localhost:5022/graphql', options);
        if (!response.ok) {
            throw new Error("Error fetching commentLikes");
        }
        const responseData = await response.json();
        this.setState({commentLikes: responseData['data']['commentLikes']});
        }
        catch (error) {
        console.error(error);
        }
    }


    toggleReply = (commentId, comment, username) => {
        if(this.state.replyToCommentId.length==0) {
            this.setState({
                replyToCommentId: commentId,
                replyToComment: comment,
                replyToUsername: username,
                addCommentText: "Replying to " + username + "..."
            });
        }
        else{
            if(commentId!==this.state.replyToCommentId) {
                this.setState({
                    replyToCommentId: commentId,
                    replyToComment: comment,
                    replyToUsername: username,
                    addCommentText: "Replying to " + username + "..."
                });
            }
            else {
                this.setState({
                    replyToCommentId: "",
                    replyToComment: "",
                    replyToUsername: "",
                    addCommentText: "Add a comment..."
                });
            }
        }
    }

    setCommentFocus = () => {
        this.setState({
            focusedOnComment: true
        });
    }

    deleteComment = async (commentId) => {
        try {
            const data = `
            mutation {
                removeComment (
                commentid: "${commentId}"
                ) {
                }
            }`;
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: data })
            };
            const response = await fetch('http://localhost:5022/graphql', options);
            if (!response.ok) {
                throw new Error("Error deleting comment");
            }
            const responseData = await response.json();
            this.setState({
                comments: this.state.comments.filter(x=>x['commentid']!==commentId),
                commentsSent: this.state.commentsSent.filter(x=>x[0]!==commentId)
            });
        }
        catch (error) {
            console.error(error);
        }
    };

    deleteReply = async (replyId) => {
        try {
            const data = `
            mutation {
                removeReply (
                replyid: "${replyId}"
                ) {
                }
            }`;
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: data })
            };
            const response = await fetch('http://localhost:5022/graphql', options);
            if (!response.ok) {
                throw new Error("Error deleting reply");
            }
            const responseData = await response.json();
            this.setState({
                repliesSent: this.state.repliesSent.filter(x=> x[0]!==replyId),
                replies: this.state.replies.filter(x=>x['replyid']!==replyId)
        });
        }
        catch (error) {
            console.error(error);
        }
    }

    formatWithOxfordComma = (arr) => {
        if (arr.length === 0) {
            return '';
        } else if (arr.length === 1) {
            return arr[0];
        } else if (arr.length === 2) {
            return `${arr[0]}, ${arr[1]}`;
        } else {
            const lastItem = arr.pop();
            return `${arr.join(', ')}, ${lastItem}`;
        }
    }




    render() {
        let commentsByUser = [];
        for (let i = 0; i < this.state.commentsSent.length; i++) {
                commentsByUser.push(<Comment key={this.state.commentsSent[i][0]} username={this.props.username} id={this.state.commentsSent[i][0]} time={'1s'} comment={this.state.commentsSent[i][1]}
                numLikes={0} replies={[]} isCaption={false} language={this.props.language} isOwn={true} toggleReply={this.toggleReply} deleteComment={this.deleteComment}
                isReply={false} isEdited={false} allPostReplies={this.state.replies} allPostCommentLikes={this.state.commentLikes}/>);
                commentsByUser.push(<br/>);
        }

        const repliesByUser = [];
        for (let j = 0; j < this.state.repliesSent.length; j++) {
            repliesByUser.push(<Comment key={this.state.repliesSent[j][0]} username={this.props.username} id={this.state.repliesSent[j][0]} postid={this.state.postId} time={'1s'}
            comment={"(Your reply to @" + this.state.repliesSent[j][2] + ", who commented: '" + this.state.repliesSent[j][3] + "')\n" +
            this.state.repliesSent[j][1]} replies={[]}
            numLikes={0} isCaption={false} language={this.props.language} isOwn={true} toggleReply={this.toggleReply} deleteComment={this.deleteReply}
            isReply={false} isEdited={false} allPostReplies={this.state.replies} allPostCommentLikes={this.state.commentLikes}/>);
            repliesByUser.push(<br/>);
        }

        const caption = [];
        const commentsInGeneral = [];
        const commentsInGeneralByUser = [];
        const commentsInGeneralRepliesByUser = [];
        let currComment;
        let currCommentId;
        let currCommentLikes;
        let currCommentReplies;
        let currCommentRepliesByUser;
        let currCommentIsEdited;
        for (let i = 0; i < this.state.comments.length; i++) {
            currComment = this.state.comments[i];
            currCommentId = currComment['commentid'];
            currCommentIsEdited = currComment['isedited'];
            if(currComment['iscaption']) {
                caption.push(<Comment key={currCommentId} username={currComment['username']} id={currCommentId} postid={this.state.postId} time={this.formatDate(currComment['datetime'])} comment={currComment['comment']}
                numLikes={0} replies={[]} isCaption={true} language={this.props.language} isOwn={currComment['username']===this.props.username} toggleReply={this.toggleReply} deleteComment={this.deleteComment}
                isReply={false} isEdited={currCommentIsEdited} allPostReplies={this.state.replies} allPostCommentLikes={this.state.commentLikes}/>);
                caption.push(<br/>);
            }
            else {
                currCommentLikes = this.state.commentLikes.filter(x => x['commentid']===currCommentId)
                currCommentReplies = this.state.replies.filter(x=>x['commentid']===currCommentId);
                currCommentRepliesByUser = currCommentReplies.filter(x=>x['username']===this.props.username);
                for(let i of currCommentRepliesByUser) {
                    let thisReplyLikes = this.state.commentLikes.filter(x=>x['commentid']===i['replyid']);
                    let thisReplyReplies = this.state.replies.filter(x=>x['commentid']===i['replyid']);
                    commentsInGeneralRepliesByUser.push(<Comment key={i['replyid']} username={this.props.username} id={i['replyid']} postid={this.state.postId} time={this.formatDate(i['datetime'])}
                    comment={"(Your reply to @" + currComment['username'] + ", who commented: '" + currComment['comment'] + "')\n" +
                    i['comment']} replies={thisReplyReplies}
                    numLikes={thisReplyLikes.length} isCaption={false} language={this.props.language} isOwn={true} toggleReply={this.toggleReply} deleteComment={this.deleteReply}
                    isReply={false} isEdited={i['isedited']} allPostReplies={this.state.replies} allPostCommentLikes={this.state.commentLikes}/>);
                    commentsInGeneralRepliesByUser.push(<br/>);
                }
                if(currComment['username']===this.props.username) {
                    commentsInGeneralByUser.push(<Comment key={currCommentId} username={currComment['username']} id={currCommentId} postid={this.state.postId} time={this.formatDate(currComment['datetime'])} comment={currComment['comment']}
                    numLikes={currCommentLikes.length} replies={currCommentReplies} isCaption={false} language={this.props.language} isOwn={true} toggleReply={this.toggleReply} deleteComment={this.deleteComment}
                    isReply={false} isEdited={currCommentIsEdited} allPostReplies={this.state.replies} allPostCommentLikes={this.state.commentLikes}/>);
                    commentsInGeneralByUser.push(<br/>);
                }
                else {
                    commentsInGeneral.push(<Comment key={currCommentId} username={currComment['username']} id={currCommentId} postid={this.state.postId} time={this.formatDate(currComment['datetime'])} comment={currComment['comment']}
                    numLikes={currCommentLikes.length} replies={currCommentReplies} isCaption={false} language={this.props.language} isOwn={false} deleteComment={this.deleteComment} toggleReply={this.toggleReply}
                    isReply={false} isEdited={currCommentIsEdited} allPostReplies={this.state.replies} allPostCommentLikes={this.state.commentLikes}/>);
                    commentsInGeneral.push(<br/>);
                }
            }
        }

        let shownTags = [];
        if (this.state.postDetails!==null && this.state.showTags) {
            if(!this.state.currSlideIsVid) {
                let x = this.state.postDetails[0][0].slides.indexOf(this.state.currSlide);
                for (let i of this.state.postDetails[0][0].taggedAccounts[x]) {
                    shownTags.push(
                        <div>
                        <div className="triangle" style={{position: 'absolute',
                        left: (i[0]+4).toString() + "%",
                        top: (i[1]+0.55).toString() + "%",
                        cursor:'pointer'}}></div>
                        <p style={{
                            position: 'absolute',
                            left: i[0].toString() + "%",
                            top: i[1].toString() + "%",
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            color: 'white',
                            textAlign: 'left',
                            borderRadius: '10%',
                            paddingLeft: '0.8em',
                            paddingTop: '0.8em',
                            paddingBottom: '0.8em',
                            paddingRight: '0.8em',
                            cursor: 'pointer',
                            fontSize: '0.94em'
                        }}>
                            {i[2]}
                        </p>
                        </div>
                    );
                }
            }
            else {
                let taggedAccounts = [];
                for (let i of this.props.postDetails[1]) {
                    if (i['slideNumber'] == this.state.currSlide) {
                        taggedAccounts = i['taggedAccounts'];
                        break;
                    }
                }
                for (let i of taggedAccounts) {
                    shownTags.push(
                        <div style={{
                            width:'90%',
                            height:'5%',
                            backgroundColor: 'white',
                            color: 'black',
                            textAlign: 'left',
                            paddingLeft: '0.8em',
                            paddingTop: '0.8em',
                            paddingBottom: '0.8em',
                            paddingRight: '0.8em',
                            cursor: 'pointer',
                            fontSize: '0.94em'
                        }}>
                            {i}
                        </div>
                    );
                }
            }
        }

        const heartsOnPhoto = [];
        for(let i of this.state.hearts) {
            heartsOnPhoto.push(<img src={redHeart} style={{height:i[3]+'em', width:i[4]+'em', objectFit:'contain', position:'absolute', top:i[1]+'%',
            left:i[0]+'%', opacity:'0.8', transform: `rotate(${i[2]}deg)`}}/>)
        }


        return (
        <React.Fragment>
        {!this.state.currSlideIsVid && this.state.currSlideIsVid!==null && (
        <div>
        <div style={{background:'white', width:'82em', height:'54em', borderStyle:'solid', borderColor:'lightgray', borderRadius:'0.5%',
        display:'flex'}}>
        <div style={{position:'absolute', top:'0%', left:'0%', width:'65%', height:'100%'}}>
        {this.state.currPost!=="" && <img onClick={this.handleClick} onDoubleClick={this.likePost} src={this.state.currPost} style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}}/>}
        {this.state.postDetails!==null && <img className="iconToBeAdjustedForDarkMode" onClick={this.showNextSlide} src={nextArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'99%', cursor:'pointer',
        display: this.state.currSlide < this.state.numPosts-1 ? 'inline-block' : 'none', zIndex:'10'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-3%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        {this.state.postDetails!==null &&
        <img onClick={this.toggleTags} src={taggedAccountsIcon} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>}
        {this.state.postDetails!==null && <PostDots numSlides={this.state.numPosts} currSlide={this.state.currSlide}/>}
        {this.state.postDetails !== null && this.state.showTags &&
        shownTags
        }
        {heartsOnPhoto}
        </div>
        <div className="commentPopupBackground" style={{position:'absolute', left:'65%', top:'0%', width:'35%', height:'100%'}}>
        </div>
        <div className="popup" style={{display:'flex', flexDirection:'column', position:'absolute', left:'66%', top:'2%', width:'33.85%', height:'97.8%', borderStyle:'none', boxShadow:'none'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.state.postDetails!==null && <StoryIcon username={this.state.postDetails[0][0].usernames[0]} ownAccount={false} unseenStory={true} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', gap:'0.2em',
        marginTop:'-1em', marginLeft:'0.5em', textAlign:"left"}}>
        {this.state.postDetails!==null && <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.formatWithOxfordComma(this.state.postDetails[0][0].usernames)}</b></span>}
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img className="iconToBeAdjustedForDarkMode" onClick={()=>{this.props.showThreeDotsPopup(this.state.postId, this.props.postIdInReact); this.hideCommentsPopup();
        }} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'12em',
        cursor:'pointer'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em'}} />
        <div style={{position:'absolute', top:'15%', left:'2%', height:'33em', overflowY:'scroll', overflowX: 'scroll'}}>
        {caption}
        {commentsByUser}
        {commentsInGeneralByUser}
        {repliesByUser}
        {commentsInGeneralRepliesByUser}
        {commentsInGeneral}
        </div>
        <div style={{position:'absolute', top:'80%', left:'-2%', width:'100%', height:'17%', display:'flex',
        flexDirection:'column', alignItems:'start', paddingLeft:'0.4em'}}>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em', marginTop:'-0.3em'}} />
        <div style={{display:'flex'}}>
        {!this.state.isLiked && <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        {this.state.isLiked && <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick={this.focusTextInput} src={commentIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick={this.props.showSendPostPopup} src={sendIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        {!this.state.isSaved && <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={saveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        {this.state.isSaved && <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={blackSaveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        </div>
        <b onClick={() => {this.props.showPostLikersPopup(this.state.postId)}} style={{marginTop:'0.5em', marginLeft:'0.6em', cursor:'pointer'}}>{this.state.likesText}</b>
        <p style={{color:'gray', fontSize:'0.87em', marginLeft:'0.8em'}}>{this.state.timeText}</p>
        <div style={{display:'flex', justifyItems: 'center'}}>
        <textarea className="textArea" type="text" ref={this.textInput} value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0em', fontSize: '1em',
        marginTop:'0em', width:'19em', marginLeft:'0.6em', borderWidth: '0px 0px 0px 0px', outline:'none', color:'black', resize: 'none', fontFamily:'Arial'}}
        placeholder={this.state.addCommentText} onKeyDown={this.handleKeyDown}/>
        {this.state.sendComment && <span onClick={this.postComment} style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer',
        fontSize:'1.1em', marginLeft:'1.7em'}}>{this.state.postText}</span>}
        </div>
        </div>
        </div>
        </div>
        <img onClick={this.hideCommentsPopup} src={closePopupIcon} style={{height:'2em', width:'2em', position:'absolute', left:'110%', top:'2%', cursor:'pointer'}}/>
        </div>
    )}

    {this.state.currSlideIsVid && this.state.currSlideIsVid!== null && (
        <div>
        <div style={{background:'white', width:'82em', height:'54em', borderStyle:'solid', borderColor:'lightgray', borderRadius:'0.5%',
        display:'flex'}}>
        <div onClick={this.handleClick} onDoubleClick = {this.likePost} style={{position:'absolute', top:'0%', left:'0%', width:'65%', height:'100%', backgroundColor:'black'}}>
        <div style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}} data-vjs-player>
        <video id="videoPlayer" src={this.state.videoUrl} ref={this.videoNode} className="video-js" width="800" height="1000">
        <track kind="subtitles" src={frenchSubtitles} srclang="fr" label="French" />
        </video>
        {this.state.showLeftBanner && (<img src={rewind5Seconds} style={{height:'30%', width:'30%', objectFit:'contain', position:'absolute', top: '35%', left: '0%'}}/>)}
        {this.state.showRightBanner && (<img src={fastForward5Seconds} style={{height:'33%', width:'33%', objectFit: 'contain', position:'absolute', top: '35%', left: '73%'}}/>)}
        {this.state.showPauseSymbol && (<img src={pauseIcon} style={{height:'20%', width:'20%', objectFit: 'contain', position:'absolute', top: '35%', left: '38%'}}/>)}
        {this.state.showSettingsPopup && (
        <div style={{borderStyle: 'solid', borderWidth: '0.0001px', backgroundColor: 'rgb(0,0,0,0.2)', color: 'white', position:'absolute', top:'77%', left:'77%', width:'10%', height: '10%'}}>
        <p onClick={this.showQuality} style={{cursor:'pointer'}}> Quality </p>
        </div>
        )}
        {this.state.showQualityOptions && (
        <div style={{borderStyle: 'solid',  borderWidth: '0.0001px', backgroundColor: 'rgb(0,0,0,0.2)', color: 'white', position:'absolute', top:'20%', left:'77%', width:'10%',
        display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'enter'}}>
        <p style={{cursor:'pointer'}}>8k</p>
        <p style={{cursor:'pointer'}}>4k</p>
        <p style={{cursor:'pointer'}}>1080p</p>
        <p style={{cursor:'pointer'}}>720p</p>
        <p style={{cursor:'pointer'}}>360p</p>
        <p style={{cursor:'pointer'}}>144p</p>
        <p style={{cursor:'pointer'}}>Auto</p>
        </div>
        )}
        {this.state.showSection && <p onClick={this.showSections} style={{position:'absolute', top:'93%', left:'35%', cursor:'pointer', color:'white', fontWeight:'bold', fontSize:'0.94em'}}>{this.state.currSection}</p>}
        {this.state.showPreview &&
        <div>
        <img src={this.state.previewImage} style={{height:'20%', width:'20%', objectFit:'contain', position:'absolute', top:'75%', left:this.state.previewLeft+'%'}}/>
        <p style={{fontSize:'1.6em', color:'white', position:'absolute', top: '90%', left: (this.state.previewLeft+6.5) + '%'}}>{this.state.previewTime}</p>
        </div>
        }
        </div>
        {this.state.postDetails && <img className="iconToBeAdjustedForDarkMode" onClick={this.showNextSlide} src={nextArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'100%', cursor:'pointer',
        display: this.state.currSlide < this.state.numPosts-1 ? 'inline-block' : 'none', zIndex:'10'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-5%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        <img src={taggedAccountsIcon} onClick={this.toggleTags} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>
        {this.state.postDetails && <PostDots numSlides={this.state.numPosts} currSlide={this.state.currSlide}/>}
        {this.props.postDetails !== null && this.state.showTags && shownTags.length > 0 &&
        <div style={{position:'absolute', top:'2%', left:'25%', width:'50%', height:'16%', display:'flex',
        flexDirection:'column', alignItems:'start', backgroundColor:'white', overflow:'scroll', borderRadius:'2%', paddingTop:'1%'}}>
        <b style={{marginLeft:'30%'}}>Tagged Accounts</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        {shownTags}
        </div>}
        </div>
        <div className="commentPopupBackground" style={{position:'absolute', left:'65%', top:'0%', width:'35%', height:'100%'}}>
        </div>
        <div style={{display:'flex', flexDirection:'column', position:'absolute', left:'66%', top:'2%', width:'35%', height:'100%'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.state.postDetails!==null && <StoryIcon username={this.state.postDetails[1][0].usernames[0]} ownAccount={false} unseenStory={true} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', gap:'0.2em',
        marginTop:'-1em', marginLeft:'0.5em', textAlign:"left"}}>
        {this.state.postDetails!==null && <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.formatWithOxfordComma(this.state.postDetails[1][0].usernames)}</b></span>}
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img className="iconToBeAdjustedForDarkMode" onClick={()=>{this.props.showThreeDotsPopup(this.state.postId, this.props.postIdInReact); this.hideCommentsPopup();}} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'12em',
        cursor:'pointer'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em'}} />
        <div style={{position:'absolute', top:'15%', left:'2%', height:'33em', overflowY:'scroll', overflowX: 'scroll'}}>
        {caption}
        {commentsByUser}
        {commentsInGeneralByUser}
        {repliesByUser}
        {commentsInGeneralRepliesByUser}
        {commentsInGeneral}
        </div>
        <div style={{position:'absolute', top:'80%', left:'-2%', width:'100%', height:'17%', display:'flex',
        flexDirection:'column', alignItems:'start', paddingLeft:'0.4em'}}>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em', marginTop:'-0.3em'}} />
        <div style={{display:'flex'}}>
        {!this.state.isLiked && <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        {this.state.isLiked && <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick={this.focusTextInput} src={commentIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick={this.props.showSendPostPopup} src={sendIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        {!this.state.isSaved && <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={saveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        {this.state.isSaved && <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={blackSaveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        </div>
        <b onClick={() => {this.props.showPostLikersPopup(this.state.postId)}} style={{marginTop:'0.5em', marginLeft:'0.6em', cursor:'pointer'}}>{this.state.likesText}</b>
        <p style={{color:'gray', fontSize:'0.87em', marginLeft:'0.8em'}}>{this.state.timeText}</p>
        <div style={{display:'flex', justifyItems: 'center'}}>
        <textarea className="textArea" onClick={this.setCommentFocus} type="text" ref={this.textInput} value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0em', fontSize: '1em',
        marginTop:'0em', width:'19em', marginLeft:'0.6em', borderWidth: '0px 0px 0px 0px', outline:'none', color:'black', resize: 'none', fontFamily:'Arial'}}
        placeholder={this.state.addCommentText}/>
        {this.state.sendComment && <span onClick={this.postComment} style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer',
        fontSize:'1.1em', marginLeft:'1.7em'}}>{this.state.postText}</span>}
        </div>
        </div>
        </div>
        </div>
        <img onClick={this.hideCommentsPopup} src={closePopupIcon} style={{height:'2em', width:'2em', position:'absolute', left:'110%', top:'2%', cursor:'pointer'}}/>
        </div>
    )}
        </React.Fragment>);
    };
}

export default CommentsPopup;