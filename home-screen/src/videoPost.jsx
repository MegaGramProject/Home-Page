import React, { Component } from 'react';
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
import videoPost from './images/videoPost.mp4';
import videoSettingsIcon from './images/videoSettingsIcon.png';
import PostDots from "./postDots";
import StoryIcon from './storyIcon';
import './styles.css';
import frenchSubtitles from './subtitles_fr.vtt';

class VideoPost extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLiked: false,
            isSaved: false,
            numLikes: 314,
            originalLikes: 314,
            caption: "What a wonderful time to be alive, init?",
            comment: "",
            sendComment: false,
            timeText: this.props.time,
            locationText: this.props.location,
            likesText: this.props.numLikes + ' likes',
            viewAllCommentsText: 'View all ' + this.props.numComments + ' comments',
            addACommentText: 'Add a comment...',
            postText: 'Post',
            currSlide: 0,
            playbackRate: 1,
            isFocused: false,
            showRightBanner: false,
            showLeftBanner: false,
            showPauseSymbol: false,
            showSettingsPopup: false,
            showQualityOptions: false,
        }
        this.videoNode = React.createRef();
        this.spaceKeyTimer = null;
        this.spaceKeyPressed = false;
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


        this.player = videojs(this.videoNode.current, {
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
    
        this.player.src({ src: {videoPost}, type: 'video/mp4' });
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
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }


    handleKeyDown = (event) => {
        if (this.state.isFocused) {
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

    handleKeyUp = (event) => {
        if (this.state.isFocused  && event.key === ' ') {
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



    toggleHeart = () => {
        if (this.state.isLiked) {
            this.setState(
                {isLiked: false,
                likesText: (this.state.numLikes-1) + ' likes',
                numLikes: this.state.numLikes-1,
            });
        }
        else {
            this.setState(
                {isLiked: true,
                likesText: (this.state.numLikes+1) + ' likes',
                numLikes: this.state.numLikes+1,
            });

        }
    }

    toggleSave = () => {
        this.setState({isSaved: !this.state.isSaved});
    }
    
    likePost = (event) => {
        event.preventDefault();
        this.setState(
            {isLiked: true,
            likesText: (this.state.originalLikes+1) + ' likes',
            numLikes: this.state.originalLikes+1});
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
        this.setState({currSlide: this.state.currSlide+1});
    };

    showPreviousSlide = () => {
        this.setState({currSlide: this.state.currSlide-1});
    };

    setFocus = () => {
        this.setState({isFocused: true});
    }

    showQuality = () => {
        this.setState({showSettingsPopup: false, showQualityOptions: true});
    }


    render() {
        return (
        <React.Fragment>
        <div style={{width:'38em', height:'72em', borderColor:'lightgray', paddingTop:'2em', paddingLeft:'2em', position:'relative'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        <StoryIcon unseenStory={true}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', marginLeft:'1em', gap:'0.2em',
        marginTop:'-1em'}}>
        <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.props.username}</b> <span style={{color:'gray'}}>• {this.state.timeText}</span></span>
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img onClick = {this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'19em',
        cursor:'pointer'}}/>
        </div>
        <div onClick={this.setFocus} onDoubleClick = {this.likePost} style={{position:'absolute', top:'10%', width:'37em', height:'45em', marginLeft:'-0.5em', backgroundColor:'black'}}>
        <div style={{position:'absolute', position:'relative', top:'20%', left:'0%'}} data-vjs-player>
        <video src={videoPost} ref={this.videoNode} className="video-js vjs-default-skin" width="600" height="800">
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
        <img onClick={this.showNextSlide} src={rightArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'100%', cursor:'pointer',
        display: this.state.currSlide < this.props.numSlides-1 ? 'inline-block' : 'none'}}/>
        <img onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-5%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        <img src={taggedAccountsIcon} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>
        <PostDots numSlides={this.props.numSlides} currSlide={this.state.currSlide}/>
        </div>
        <div style={{display:'flex', position:'absolute', top:'72%', alignItems:'center'}}>
        <img onClick = {this.toggleHeart} src={blankHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'none' : 'inline-block'}}/>
        <img onClick = {this.toggleHeart} src={redHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'inline-block' : 'none'}}/>
        <img onClick = {() => this.props.showCommentsPopup(this.props.username, this.props.location, this.props.time, this.state.numLikes,
        this.props.numComments, this.props.numSlides, this.state.currSlide, this.state.isLiked, this.props.isAd, this.state.isSaved)}
        src={commentIcon} style={{height:'3em', width:'3em', objectFit:'contain', cursor: 'pointer'}}/>
        <img onClick = {this.props.showSendPostPopup} src={sendIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer'}}/>
        <img onClick={this.toggleSave} src={saveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: this.state.isSaved ? 'none' : 'inline-block'}}/>
        <img onClick={this.toggleSave} src={blackSaveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: !this.state.isSaved ? 'none' : 'inline-block'}}/>
        </div>
        <div style={{position:'absolute', top:'77%', display:'flex', flexDirection:'column', alignItems:'start', width:'37em', gap:'0.8em'}}>
        <b style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.likesText}</b>
        <b style={{fontSize:'1.1em'}}>{this.props.username}</b>
        <span style={{fontSize:'1.1em', textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word'}}>{this.state.caption}</span>
        <p onClick={() => this.props.showCommentsPopup(this.props.username, this.props.location, this.props.time, this.state.numLikes,
        this.props.numComments, this.props.numSlides, this.state.currSlide, this.state.isLiked, this.props.isAd, this.state.isSaved)}
        style={{color:'gray', marginTop:'0.4em', fontSize:'1.15em', cursor:'pointer'}}>{this.state.viewAllCommentsText}</p>
        <br/>
        <div>
        <textarea type="text" value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0.5em', fontSize: '1.1em', marginTop:'-1.2em', width:'29em',
        borderWidth: '0px 0px 0.1em 0px', outline:'none', color:'black', resize: 'none', fontFamily:'Arial'}}
        placeholder={this.state.addACommentText}/>
        <span style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer', display: this.state.sendComment ? 'inline-block' : 'none',
        fontSize:'1.1em', marginLeft:'1.2em'}}>{this.state.postText}</span>
        </div>
        </div>
        </div>
        </React.Fragment>);
    };
}

export default VideoPost;