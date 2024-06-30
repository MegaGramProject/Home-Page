import React, { Component } from 'react';
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

        };
        this.textInput = React.createRef();
        this.videoNode = React.createRef();
        this.spaceKeyTimer = null;
        this.spaceKeyPressed = false;
        this.slideToVideoUrlMapping = {};
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


    async componentDidUpdate(prevProps, prevState) {
        if(prevProps.isSaved !== this.props.isSaved) {
            this.setState({isSaved: this.props.isSaved});
        }
        if(prevProps.isLiked !== this.props.isLiked) {
            this.setState({isLiked: this.props.isLiked});
        }
        if (prevProps.postDetails != this.props.postDetails || prevState.postDetails==null && this.props.postDetails!==null) {
            if(this.props.postDetails[1].length>0) {
                    await this.fetchVideos();
            }
            let currSlideIsVid = !(this.props.postDetails[0].length > 0 && this.props.postDetails[0][0].slides.includes(this.props.currSlide));
            if(currSlideIsVid) {
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
                });
            }
            else {
                const x = this.props.postDetails[0][0].slides.indexOf(this.props.currSlide);
                const currPost = 'data:image/jpeg;base64,' + this.props.postDetails[0][0].posts[x];
                this.setState({
                    currSlideIsVid: currSlideIsVid,
                    locationText: currSlideIsVid ? this.props.postDetails[1][0].locationOfPost : this.props.postDetails[0][0].locationOfPost,
                    timeText: currSlideIsVid ? this.formatDate(this.props.postDetails[1][0].dateTimeOfPost) : this.formatDate(this.props.postDetails[0][0].dateTimeOfPost),
                    numPosts: this.props.postDetails[0].length == 0 ? this.props.postDetails[1].length : this.props.postDetails[0][0].posts.length + this.props.postDetails[1].length,
                    likesText: this.props.numLikes + ' likes',
                    numLikes: this.props.numLikes,
                    currSlide: this.props.currSlide,
                    postDetails: this.props.postDetails,
                    currPost: currPost
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
                    this.setState({playerInitialized: true});
        }

    }

    formatDate(dateString) {
        const date = new Date(dateString)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();
        return `${month} ${day}, ${year}`;
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
                    likesText: (this.state.numLikes+1) + ' likes',
                    numLikes: this.state.numLikes+1});
            }
            catch (error) {
                console.error('Error:', error);
            }
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
                    likesText: (this.state.numLikes-1) + ' likes',
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

    showNextSlide = () => {
        let nextSlideIsVid = !(this.state.postDetails[0].length > 0 && this.state.postDetails[0][0].slides.includes(this.state.currSlide+1));
        if (nextSlideIsVid) {
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.state.currSlide+1],
                currPost: "",
                currSlide: this.state.currSlide+1,
                currSlideIsVid: nextSlideIsVid,
                showTags: false,
                });
        }
        else {
            const x = this.state.postDetails[0][0].slides.indexOf(this.state.currSlide+1);
            const currPost = 'data:image/jpeg;base64,' + this.state.postDetails[0][0].posts[x];
            this.setState({
                videoUrl: "",
                currPost: currPost,
                currSlide: this.state.currSlide+1,
                currSlideIsVid: nextSlideIsVid,
                showTags: false
                });
        }
    }

    showPreviousSlide = () => {
        let prevSlideIsVid = !(this.state.postDetails[0].length > 0 && this.state.postDetails[0][0].slides.includes(this.state.currSlide-1));
        if (prevSlideIsVid) {
            this.setState({
                videoUrl: this.slideToVideoUrlMapping[this.state.currSlide-1],
                currPost: "",
                currSlide: this.state.currSlide-1,
                currSlideIsVid: prevSlideIsVid,
                showTags: false,
                });
        }
        else {
            const x = this.state.postDetails[0][0].slides.indexOf(this.state.currSlide-1);
            const currPost = 'data:image/jpeg;base64,' + this.state.postDetails[0][0].posts[x];
            this.setState({
                videoUrl: "",
                currPost: currPost,
                currSlide: this.state.currSlide-1,
                currSlideIsVid: prevSlideIsVid,
                showTags: false
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

    focusTextInput = () => {
        this.textInput.current.focus();
    };

    postComment = () => {
        this.setState({
        commentsSent: [...this.state.commentsSent, this.state.comment],
        comment: "",
        sendComment: false,
        });
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


    handleClick = () => {
        this.props.onFocus(this.props.id);
    }
    
    toggleTags = () => {
        this.setState({showTags: !this.state.showTags});
    }

    hideCommentsPopup = () => {
        this.slideToVideoUrlMapping = {};
        this.setState({postDetails: null, videoUrl: "", currPost: ""});
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
                const videoUrl = URL.createObjectURL(videoBlob);
                this.slideToVideoUrlMapping[slideNumber] = videoUrl;
            } catch (error) {
                console.error('Trouble connecting to server:', error);
            }
        }
        if(this.slideToVideoUrlMapping[this.props.currSlide]) {
            this.setState({videoUrl: this.slideToVideoUrlMapping[this.props.currSlide]});
        }
    
    }




    render() {
        const commentsByUser = [];
        for (let i = this.state.commentsSent.length-1; i > -1; i--) {
                commentsByUser.push(<Comment username={'rishavry7'} time={'15s'} comment={this.state.commentsSent[i]}
                numLikes={13} isCaption={false} language={this.props.language} isOwn={true}/>);
                commentsByUser.push(<br/>);
        }


        let shownTags = [];
        if (this.state.postDetails!==null && this.state.showTags) {
            if(!this.state.currSlideIsVid) {
                let x = this.state.postDetails[0][0].slides.indexOf(this.state.currSlide);
                for (let i of this.state.postDetails[0][0].taggedAccounts[x]) {
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
                    console.log(i)
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
        <div>
        <div style={{background:'white', width:'82em', height:'54em', borderStyle:'solid', borderColor:'lightgray', borderRadius:'0.5%',
        display:'flex'}}>
        <div style={{position:'absolute', top:'0%', left:'0%', width:'65%', height:'100%'}}>
        {this.state.currPost!=="" && <img onClick={this.handleClick} onDoubleClick={this.likePost} src={this.state.currPost} style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}}/>}
        {this.state.postDetails!==null && <img onClick={this.showNextSlide} src={nextArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'99%', cursor:'pointer',
        display: this.state.currSlide < this.state.numPosts-1 ? 'inline-block' : 'none'}}/>}
        <img onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-3%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        {this.state.postDetails!==null &&
        <img onClick={this.toggleTags} src={taggedAccountsIcon} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>}
        {this.state.postDetails!==null && <PostDots numSlides={this.state.numPosts} currSlide={this.state.currSlide}/>}
        {this.state.postDetails !== null && this.state.showTags &&
        shownTags
        }
        </div>
        <div style={{display:'flex', flexDirection:'column', position:'absolute', left:'66%', top:'2%', width:'35%', height:'100%'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.state.postDetails!==null && <StoryIcon username={this.state.postDetails[0][0].usernames[0]} ownAccount={false} unseenStory={true} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', gap:'0.2em',
        marginTop:'-1em', marginLeft:'0.5em', textAlign:"left"}}>
        {this.state.postDetails!==null && <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.state.postDetails[0][0].usernames[0]}</b></span>}
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img onClick={this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'12em',
        cursor:'pointer'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em'}} />
        <div style={{position:'absolute', top:'15%', left:'2%', height:'33em', overflowY:'scroll', overflowX: 'scroll'}}>
        <Comment username={'rishavry'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={0} isCaption={true} language={this.props.language} isOwn={false}/>
        <br/>
        {commentsByUser}
        <Comment username={'rishavry2'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={70} isCaption={false} replies={["A", "B", "C"]} language={this.props.language} isOwn={false}/>
        <b/>
        <Comment username={'rishavry3'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        <br/>
        <Comment username={'rishavry4'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        <br/>
        <Comment username={'rishavry5'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        </div>
        <div style={{position:'absolute', top:'80%', left:'-2%', width:'100%', height:'17%', display:'flex',
        flexDirection:'column', alignItems:'start', paddingLeft:'0.4em'}}>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em', marginTop:'-0.3em'}} />
        <div style={{display:'flex'}}>
        {!this.state.isLiked && <img onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        {this.state.isLiked && <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        <img onClick={this.focusTextInput} src={commentIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        <img onClick={this.props.showSendPostPopup} src={sendIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        {!this.state.isSaved && <img onClick={this.toggleSave} src={saveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        {this.state.isSaved && <img onClick={this.toggleSave} src={blackSaveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        </div>
        <b style={{marginTop:'0.5em', marginLeft:'0.6em'}}>{this.state.likesText}</b>
        <p style={{color:'gray', fontSize:'0.87em', marginLeft:'0.8em'}}>{this.state.timeText}</p>
        <div style={{display:'flex', justifyItems: 'center'}}>
        <textarea  type="text" ref={this.textInput} value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0em', fontSize: '1em',
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
        </div>
        {this.state.postDetails && <img onClick={this.showNextSlide} src={nextArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'100%', cursor:'pointer',
        display: this.state.currSlide < this.state.numPosts-1 ? 'inline-block' : 'none'}}/>}
        <img onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-5%', cursor:'pointer',
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
        <div style={{display:'flex', flexDirection:'column', position:'absolute', left:'66%', top:'2%', width:'35%', height:'100%'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.state.postDetails!==null && <StoryIcon username={this.state.postDetails[1][0].usernames[0]} ownAccount={false} unseenStory={true} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', gap:'0.2em',
        marginTop:'-1em', marginLeft:'0.5em', textAlign:"left"}}>
        {this.state.postDetails!==null && <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.state.postDetails[1][0].usernames[0]}</b></span>}
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img onClick={this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'12em',
        cursor:'pointer'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em'}} />
        <div style={{position:'absolute', top:'15%', left:'2%', height:'33em', overflowY:'scroll', overflowX: 'scroll'}}>
        <Comment username={'rishavry'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={0} isCaption={true} language={this.props.language} isOwn={false}/>
        <br/>
        {commentsByUser}
        <Comment username={'rishavry2'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={70} isCaption={false} replies={["A", "B", "C"]} language={this.props.language} isOwn={false}/>
        <b/>
        <Comment username={'rishavry3'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        <br/>
        <Comment username={'rishavry4'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        <br/>
        <Comment username={'rishavry5'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        </div>
        <div style={{position:'absolute', top:'80%', left:'-2%', width:'100%', height:'17%', display:'flex',
        flexDirection:'column', alignItems:'start', paddingLeft:'0.4em'}}>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em', marginTop:'-0.3em'}} />
        <div style={{display:'flex'}}>
        {!this.state.isLiked && <img onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        {this.state.isLiked && <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        <img onClick={this.focusTextInput} src={commentIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        <img onClick={this.props.showSendPostPopup} src={sendIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        {!this.state.isSaved && <img onClick={this.toggleSave} src={saveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        {this.state.isSaved && <img onClick={this.toggleSave} src={blackSaveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        </div>
        <b style={{marginTop:'0.5em', marginLeft:'0.6em'}}>{this.state.likesText}</b>
        <p style={{color:'gray', fontSize:'0.87em', marginLeft:'0.8em'}}>{this.state.timeText}</p>
        <div style={{display:'flex', justifyItems: 'center'}}>
        <textarea  type="text" ref={this.textInput} value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0em', fontSize: '1em',
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
        </React.Fragment>);
    };
}

export default CommentsPopup;