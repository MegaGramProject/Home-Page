import React, { Component } from 'react';
import { v4 as uuidv4 } from 'uuid';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import backArrow from "./images/backArrow.png";
import blackSaveIcon from './images/blackSaveIcon.png';
import blankHeart from './images/blankHeartIcon.png';
import commentIcon from './images/commentIcon.png';
import fastForward5Seconds from './images/fastForward5Seconds.png';
import rightArrow from "./images/nextArrow.png";
import pauseIcon from './images/pauseIcon.png';
import redHeart from './images/redHeartIcon.png';
import rewind5Seconds from './images/rewind5Seconds.png';
import saveIcon from './images/saveIcon.png';
import sendIcon from './images/sendIcon.png';
import taggedAccountsIcon from "./images/taggedAccountsIcon.png";
import threeHorizontalDots from './images/threeHorizontalDots.png';
import verifiedAccount from './images/verifiedAccount.png';
import videoSettingsIcon from './images/videoSettingsIcon.png';
import PostDots from "./postDots";
import StoryIcon from './storyIcon';
import './styles.css';
import frenchSubtitles from './subtitles_fr.vtt';

class MediaPost extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLiked: false,
            isSaved: false,
            numLikes: 0,
            caption: "Caption loading...",
            comment: "",
            sendComment: false,
            timeText: '',
            locationText: '',
            likesText: this.props.numLikes + ' likes',
            viewAllCommentsText: 'View all comments',
            addACommentText: 'Add a comment...',
            postText: 'Post',
            currSlide: 0,
            showTags: false,
            currSlideIsVid: null,
            videoUrl: "",
            numPosts: 0,
            showQualityOptions: false,
            showSettingsPopup: false,
            showRightBanner: false,
            showLeftBanner: false,
            postId: "",
            isVerified: false,
        };
        this.videoNode = React.createRef();
        this.spaceKeyTimer = null;
        this.spaceKeyPressed = false;
        this.slideToVideoUrlMapping = {};

    };

    handleClick = () => {
        this.props.onFocus(this.props.id);
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
            if (this.props.isFocused) {
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

    async updateViewAllCommentsText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.viewAllCommentsText,
                currLang,
                this.props.language
            );
            this.setState({viewAllCommentsText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateAddACommentText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.addACommentText,
                currLang,
                this.props.language
            );
            this.setState({addACommentText: translatedText });
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
                    const weeksDiff = Math.floor(hoursDiff / 24 / 7);
                    if (weeksDiff < 4) {
                        return `${weeksDiff}w`;
                    } else {
                        // If more than 4 weeks, return the actual date in "Month Day, Year" format
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
    

    toggleSettings = () => {
        if(this.state.showQualityOptions) {
            this.setState({showQualityOptions: false});
        }
        else if(this.state.showSettingsPopup) {
            this.setState({showSettingsPopup: false})
        }
        else {
            this.setState({showSettingsPopup: true});
        }
    }

    async componentDidMount() {
        await this.updatePostText("English");
        await this.updateAddACommentText("English");
        await this.updateViewAllCommentsText("English");
        await this.updateLikesText("English");
        await this.updateLocationText("English");
        await this.updateTimeText("English");
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.postDetails != this.props.postDetails) {
            if(this.props.postDetails[1].length>0) {
                    this.fetchVideos();
            }
            let currSlideIsVid = !(this.props.postDetails[0].length > 0 && this.props.postDetails[0][0].slides.includes(this.state.currSlide));
            if(!currSlideIsVid) {
                this.fetchLikes(this.props.postDetails[0][0].id);
                this.checkIfSaved(this.props.postDetails[0][0].id);
                this.checkIfUserVerified(this.props.postDetails[0][0].usernames[0]);
            }
            else {
                this.fetchLikes(this.props.postDetails[1][0].overallPostId);
                this.checkIfSaved(this.props.postDetails[1][0].overallPostId);
                this.checkIfUserVerified(this.props.postDetails[1][0].usernames[0]);
            }
            this.setState({
                caption: this.props.postDetails[2]['comment'],
                currSlideIsVid: currSlideIsVid,
                locationText: currSlideIsVid ? this.props.postDetails[1][0].locationOfPost : this.props.postDetails[0][0].locationOfPost,
                timeText: currSlideIsVid ? this.formatDate(this.props.postDetails[1][0].dateTimeOfPost) : this.formatDate(this.props.postDetails[0][0].dateTimeOfPost),
                numPosts: this.props.postDetails[0].length == 0 ? this.props.postDetails[1].length : this.props.postDetails[0][0].posts.length + this.props.postDetails[1].length,
                postId: currSlideIsVid ? this.props.postDetails[1][0].overallPostId : this.props.postDetails[0][0].id

            });
        }
            
        if (prevProps.language !== this.props.language) {
            await this.updatePostText(prevProps.language);
            await this.updateAddACommentText(prevProps.language);
            await this.updateViewAllCommentsText(prevProps.language);
            await this.updateLikesText(prevProps.language);
            await this.updateLocationText(prevProps.language);
            await this.updateTimeText(prevProps.language);
            }
        else if(prevState.likesText !== this.state.likesText) {
            await this.updateLikesText("English");
        }

        if(!prevState.currSlideIsVid && this.state.currSlideIsVid) {
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
                
                    this.player.src({ src: this.state.videoUrl, type: 'video/mp4' });
                    class ThumbnailPreview extends videojs.getComponent('Component') {
                        constructor(player, options) {
                            super(player, options);
                            this.thumbnailImg = videojs.dom.createEl('img', {
                                className: 'vjs-thumbnail-preview',
                                style: 'position: absolute; bottom: -90% height: 10% width: 10%;'
                            });
                    
                    
                            this.thumbnailImg.style.display = 'none';
                            this.el().appendChild(this.thumbnailImg);
                    

                            if (this.options_.player) {
                                const progressControl = this.options_.player.getChild('controlBar').getChild('progressControl');
                                progressControl.on('mousemove', this.handleMouseMove.bind(this));
                                progressControl.on('mouseout', () => { this.thumbnailImg.style.display = 'none';});
                            }
                        }
                    
                        handleMouseMove(event) {
                            if (this.options_.player) {
                                const progressControl = this.options_.player.getChild('controlBar').getChild('progressControl');
                                const rect = progressControl.el().getBoundingClientRect();
                                const mouseX = event.clientX - rect.left;
                                this.thumbnailImg.src = redHeart;
                                this.thumbnailImg.style.left = `${mouseX+125}px`;
                                this.thumbnailImg.style.display = 'inline-block';
                            }
                        }
                    }
                    
                    videojs.registerComponent('thumbnailPreview', ThumbnailPreview);
                    this.player.getChild('controlBar').addChild('thumbnailPreview', {
                        player: this.player,
                    });
                    this.player.getChild('controlBar').addChild('SubtitlesButton');
                    this.player.getChild('controlBar').addChild('SettingsButton', {
                        toggleSettings: this.toggleSettings,
                    });
                    this.player.getChild('controlBar').addChild('playbackRateMenuButton');
                    this.player.getChild('controlBar').addChild('fullscreenToggle');
        }

    
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    showQuality = () => {
        this.setState({showSettingsPopup: false, showQualityOptions: true});
    }

    toggleSettings = () => {
        if(this.state.showQualityOptions) {
            this.setState({showQualityOptions: false});
        }
        else if(this.state.showSettingsPopup) {
            this.setState({showSettingsPopup: false})
        }
        else {
            this.setState({showSettingsPopup: true});
        }
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



    toggleHeart = async () => {
        if (this.state.isLiked) {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/removeLike/'+this.props.postDetails[0][0].id, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: 'rishavry' }),
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
                        body: JSON.stringify({ username: 'rishavry' }),
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
            this.likePost();
        }
    }

    toggleSave = async () => {
        if(!this.state.isSaved) {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/addSave/'+this.props.postDetails[0][0].id, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: 'rishavry' }),
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
                        body: JSON.stringify({ username: 'rishavry' }),
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
                        body: JSON.stringify({ username: 'rishavry' }),
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
                        body: JSON.stringify({ username: 'rishavry' }),
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
    
    likePost = async () => {
        if(!this.state.isLiked) {
            try {
                if(!this.state.currSlideIsVid) {
                    const response = await fetch('http://localhost:8004/addLike/'+this.props.postDetails[0][0].id, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: 'rishavry' }),
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
                        body: JSON.stringify({ username: 'rishavry' }),
                    });
                    if(!response.ok) {
                        console.error('Network response was not ok');
                    }
                    const output = await response.json();
                }
                this.setState(
                    {isLiked: true,
                    likesText: this.state.numLikes==0 ? '1 like' : this.state.numLikes+1 + ' likes',
                    numLikes: this.state.numLikes+1});
            }
            catch (error) {
                console.error('Error:', error);
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

    showNextSlide = () => {
        let nextSlideIsVid = !(this.props.postDetails[0].length > 0 && this.props.postDetails[0][0].slides.includes(this.state.currSlide+1));
        if (nextSlideIsVid) {
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.state.currSlide+1],
                currSlide: this.state.currSlide+1,
                currSlideIsVid: nextSlideIsVid,
                showTags: false,
                });
        }
        else {
            this.setState({
                currSlide: this.state.currSlide+1,
                currSlideIsVid: nextSlideIsVid,
                showTags: false
                });
        }
    }

    showPreviousSlide = () => {
        let prevSlideIsVid = !(this.props.postDetails[0].length > 0 && this.props.postDetails[0][0].slides.includes(this.state.currSlide-1));
        if (prevSlideIsVid) {
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.state.currSlide-1],
                currSlide: this.state.currSlide-1,
                currSlideIsVid: prevSlideIsVid,
                showTags: false,
                });
        }
        else {
            this.setState({
                currSlide: this.state.currSlide-1,
                currSlideIsVid: prevSlideIsVid,
                showTags: false
                });
        }
    };


    toggleTags = () => {
        this.setState({showTags: !this.state.showTags});
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
                const videoUrl = URL.createObjectURL(videoBlob);
                this.slideToVideoUrlMapping[slideNumber] = videoUrl;
            } catch (error) {
                console.error('Trouble connecting to server:', error);
            }
        }
        if(this.slideToVideoUrlMapping[0]) {
            this.setState({videoUrl: this.slideToVideoUrlMapping[0]});
        }
    
    }

    async fetchLikes(postId) {
        const response = await fetch(`http://localhost:8004/getLikes/${postId}`);
        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const usersThatLiked = await response.json();
        let isLiked = false;
        for(let i of usersThatLiked) {
            if(i['username']==="rishavry") {
                isLiked = true;
                break;
            }
        }
        this.setState({
            numLikes: usersThatLiked.length,
            likesText:  usersThatLiked.length + " likes",
            isLiked: isLiked
        });
    }

    async checkIfSaved(postId) {
        const response = await fetch(`http://localhost:8004/getSaves/${postId}`);
        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const usersThatSaved = await response.json();
        let isSaved = false;
        for(let i of usersThatSaved) {
            if(i['username']==="rishavry") {
                isSaved = true;
                break;
            }
        }
        this.setState({
            isSaved: isSaved
        });
    }


    postComment = async () => {
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
                username: "rishavry"
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
            this.setState({comment: "", sendComment: false});
        }
        catch (error) {
            console.error(error);
        }

    }

    checkIfUserVerified = async (username) => {
        try {
            const response = await fetch('http://localhost:5022/isUserVerified/'+username);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const output = await response.json();
            this.setState({isVerified: output['isVerified']});
        }
        catch (error) {
            console.error(error);
        }
    }


    render() {
        let currPost = "";
        if (this.props.postDetails !== null) {
                if (!this.state.currSlideIsVid && this.state.currSlideIsVid!==null) {
                    const x = this.props.postDetails[0][0].slides.indexOf(this.state.currSlide);
                    currPost = 'data:image/jpeg;base64,' + this.props.postDetails[0][0].posts[x];
                }
        }

        let shownTags = [];
        if (this.props.postDetails!==null && this.state.showTags) {
            if(!this.state.currSlideIsVid) {
                let x = this.props.postDetails[0][0].slides.indexOf(this.state.currSlide);
                for (let i of this.props.postDetails[0][0].taggedAccounts[x]) {
                    shownTags.push(
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
        

        return (
        <React.Fragment>
        {!this.state.currSlideIsVid && this.state.currSlideIsVid!==null && (
        <div style={{width:'38em', height:'72em', borderColor:'lightgray', paddingTop:'2em', paddingLeft:'2em', position:'relative'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.props.postDetails && <StoryIcon username={this.props.postDetails[0][0].usernames[0]} unseenStory={true} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', marginLeft:'1em', gap:'0.2em',
        marginTop:'-1em', textAlign:'left',  textWrap:'wrap',  wordBreak: 'break-word', position:'relative'}}>
        <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.props.postDetails && this.props.postDetails[0][0].usernames[0]}{this.state.isVerified && <img src={verifiedAccount} style={{height:'1.5em', width:'1.5em', objectFit:'contain', paddingBottom:'0%', verticalAlign: 'text-bottom'}}/>}</b>
        <span style={{color:'gray'}}> • {this.state.timeText}</span></span>
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img className="iconToBeAdjustedForDarkMode" onClick = {this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'19em',
        cursor:'pointer'}}/>
        </div>
        <div style={{position:'absolute', top:'10%', width:'37em', height:'45em', marginLeft:'-0.5em'}}>
        {currPost!=="" && <img onDoubleClick={this.likePost} onClick={this.handleClick} src={currPost} style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}}/>}
        {this.props.postDetails!==null && <img className="iconToBeAdjustedForDarkMode" onClick={this.showNextSlide} src={rightArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'100%', cursor:'pointer',
        display: this.state.currSlide < this.state.numPosts-1 ? 'inline-block' : 'none'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-5%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        {this.props.postDetails!==null &&
        <img src={taggedAccountsIcon} onClick={this.toggleTags} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%',
        cursor:'pointer'}}/>}
        {this.props.postDetails!==null && <PostDots numSlides={this.state.numPosts} currSlide={this.state.currSlide}/>}
        {this.props.postDetails !== null && this.state.showTags &&
        shownTags
        }
        </div>
        <div style={{display:'flex', position:'absolute', top:'72%', alignItems:'center'}}>
        <img className="iconToBeAdjustedForDarkMode" onClick = {this.toggleHeart} src={blankHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'none' : 'inline-block'}}/>
        <img onClick = {this.toggleHeart} src={redHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'inline-block' : 'none'}}/>
        {this.props.postDetails && <img className="iconToBeAdjustedForDarkMode" onClick = {() => this.props.showCommentsPopup(this.props.postDetails, this.state.numLikes,
        this.props.numComments, this.state.currSlide, this.state.isLiked, this.props.isAd, this.state.isSaved)}
        src={commentIcon} style={{height:'3em', width:'3em', objectFit:'contain', cursor: 'pointer'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick = {this.props.showSendPostPopup} src={sendIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={saveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: this.state.isSaved ? 'none' : 'inline-block'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={blackSaveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: !this.state.isSaved ? 'none' : 'inline-block'}}/>
        </div>
        <div style={{position:'absolute', top:'77%', display:'flex', flexDirection:'column', alignItems:'start', width:'37em', gap:'0.8em'}}>
        <b onClick={() => {this.props.showPostLikersPopup(this.state.postId)}} style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.likesText}</b>
        {this.props.postDetails && <b style={{fontSize:'1.1em'}}>{this.props.postDetails[2]['username']}{this.state.isVerified && <img src={verifiedAccount} style={{height:'1.5em', width:'1.5em', objectFit:'contain', paddingBottom:'0%', verticalAlign: 'text-bottom'}}/>}</b>}
        <span style={{fontSize:'1.1em', textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word'}}>{this.state.caption}</span>
        {this.props.postDetails && <p onClick={() => this.props.showCommentsPopup(this.props.postDetails, this.state.numLikes,
        this.props.numComments, this.state.currSlide, this.state.isLiked, this.props.isAd, this.state.isSaved)}
        style={{color:'gray', marginTop:'0.4em', fontSize:'1.15em', cursor:'pointer'}}>{this.state.viewAllCommentsText}</p>}
        <br/>
        <div>
        <textarea className="textArea" type="text" value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0.5em', fontSize: '1.1em', marginTop:'-1.2em', width:'29em',
        borderWidth: '0px 0px 0.1em 0px', outline:'none', color:'black', resize: 'none', fontFamily:'Arial'}}
        placeholder={this.state.addACommentText}/>
        <span onClick={this.postComment} style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer', display: this.state.sendComment ? 'inline-block' : 'none',
        fontSize:'1.1em', marginLeft:'1.2em'}}>{this.state.postText}</span>
        </div>
        </div>
        </div>)}


        {this.state.currSlideIsVid && this.state.currSlideIsVid!== null &&  (
        <div style={{width:'38em', height:'72em', borderColor:'lightgray', paddingTop:'2em', paddingLeft:'2em', position:'relative'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.props.postDetails && <StoryIcon unseenStory={true} username={this.props.postDetails[1][0]['usernames'][0]} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', marginLeft:'1em', gap:'0.2em',
        marginTop:'-1em', textAlign:'left'}}>
        <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.props.postDetails && this.props.postDetails[1][0]['usernames'][0]}{this.state.isVerified && <img src={verifiedAccount} style={{height:'1.5em', width:'1.5em', objectFit:'contain', paddingBottom:'0%', verticalAlign: 'text-bottom'}}/>}</b>
        <span style={{color:'gray'}}>• {this.state.timeText}</span></span>
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img className="iconToBeAdjustedForDarkMode" onClick = {this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'19em',
        cursor:'pointer'}}/>
        </div>
        <div onClick={this.handleClick} onDoubleClick = {this.likePost} style={{position:'absolute', top:'10%', width:'37em', height:'45em', marginLeft:'-0.5em', backgroundColor:'black'}}>
        <div style={{position:'absolute', position:'relative', top:'20%', left:'0%'}} data-vjs-player>
        <video id="videoPlayer" src={this.state.videoUrl} ref={this.videoNode} className="video-js" width="600" height="800">
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
        </div>
        {this.props.postDetails && <img className="iconToBeAdjustedForDarkMode" onClick={this.showNextSlide} src={rightArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'100%', cursor:'pointer',
        display: this.state.currSlide < this.state.numPosts-1 ? 'inline-block' : 'none'}}/>}
        <img className="iconToBeAdjustedForDarkMode" onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-5%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        <img src={taggedAccountsIcon} onClick={this.toggleTags} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>
        {this.props.postDetails && <PostDots numSlides={this.state.numPosts} currSlide={this.state.currSlide}/>}
        {this.props.postDetails !== null && this.state.showTags && shownTags.length > 0 &&
        <div style={{position:'absolute', top:'72%', left:'25%', width:'50%', height:'20%', display:'flex',
        flexDirection:'column', alignItems:'start', backgroundColor:'white', overflow:'scroll', borderRadius:'5%', paddingTop:'1%'}}>
        <b style={{marginLeft:'30%'}}>Tagged Accounts</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        {shownTags}
        </div>
        }
        </div>
        <div style={{display:'flex', position:'absolute', top:'72%', alignItems:'center'}}>
        <img className="iconToBeAdjustedForDarkMode" onClick = {this.toggleHeart} src={blankHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'none' : 'inline-block'}}/>
        <img onClick = {this.toggleHeart} src={redHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'inline-block' : 'none'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick = {() => this.props.showCommentsPopup(this.props.postDetails, this.state.numLikes,
        this.props.numComments, this.state.currSlide, this.state.isLiked, this.props.isAd, this.state.isSaved)}
        src={commentIcon} style={{height:'3em', width:'3em', objectFit:'contain', cursor: 'pointer'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick = {this.props.showSendPostPopup} src={sendIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={saveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: this.state.isSaved ? 'none' : 'inline-block'}}/>
        <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleSave} src={blackSaveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: !this.state.isSaved ? 'none' : 'inline-block'}}/>
        </div>
        <div style={{position:'absolute', top:'77%', display:'flex', flexDirection:'column', alignItems:'start', width:'37em', gap:'0.8em'}}>
        <b onClick={()=>{this.props.showPostLikersPopup(this.state.postId)}} style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.likesText}</b>
        {this.props.postDetails && <b style={{fontSize:'1.1em'}}>{this.props.postDetails[2]['username']}{this.state.isVerified && <img src={verifiedAccount} style={{height:'1.5em', width:'1.5em', objectFit:'contain', paddingBottom:'0%', verticalAlign: 'text-bottom'}}/>}</b>}
        <span style={{fontSize:'1.1em', textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word'}}>{this.state.caption}</span>
        <p onClick={() => this.props.showCommentsPopup(this.props.postDetails, this.state.numLikes,
        this.props.numComments, this.state.currSlide, this.state.isLiked, this.props.isAd, this.state.isSaved)}
        style={{color:'gray', marginTop:'0.4em', fontSize:'1.15em', cursor:'pointer'}}>{this.state.viewAllCommentsText}</p>
        <br/>
        <div>
        <textarea className="textArea" type="text" value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0.5em', fontSize: '1.1em', marginTop:'-1.2em', width:'29em',
        borderWidth: '0px 0px 0.1em 0px', outline:'none', color:'black', fontFamily:'Arial'}}
        placeholder={this.state.addACommentText}/>
        <span onClick={this.postComment} style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer', display: this.state.sendComment ? 'inline-block' : 'none',
        fontSize:'1.1em', marginLeft:'1.2em'}}>{this.state.postText}</span>
        </div>
        </div>
        </div>
        )}
        </React.Fragment>
        );
    };
}

export default MediaPost;