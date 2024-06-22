import React, { Component } from 'react';
import StoryIcon from './storyIcon';
import threeHorizontalDots from './images/threeHorizontalDots.png';
import imagePost from './images/imagePost.jpg';
import blankHeart from './images/blankHeartIcon.png';
import redHeart from './images/redHeartIcon.png';
import commentIcon from './images/commentIcon.png';
import sendIcon from './images/sendIcon.png';
import saveIcon from './images/saveIcon.png';
import blackSaveIcon from './images/blackSaveIcon.png';
import './styles.css';
import { toHaveAccessibleDescription } from '@testing-library/jest-dom/matchers';

class ImagePost extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLiked: false,
            isSaved: false,
            numLikes: 314,
            originalLikes: 314,
            caption: "What a wonderful time to be alive, init?",
            numComments: 24,
            comment: ""
        }
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

    toggleHeart = () => {
        if (this.state.isLiked) {
            this.setState(
                {isLiked: false,
                numLikes: this.state.numLikes-1,
            });
        }
        else {
            this.setState(
                {isLiked: true,
                numLikes: this.state.numLikes+1,
            });

        }
    }

    toggleSave = () => {
        this.setState({isSaved: !this.state.isSaved});
    }
    
    likePost = () => {
        this.setState(
            {isLiked: true,
            numLikes: this.state.originalLikes+1});
    }
    
    handleCommentChange = (event) => {
        this.setState({comment: event.target.value});
    };


    render() {
        return (
        <React.Fragment>
        <div style={{borderStyle:'solid', width:'38em', height:'72em', borderColor:'lightgray', paddingTop:'2em', paddingLeft:'2em'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        <StoryIcon unseenStory={true}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', marginLeft:'1em', gap:'0.2em',
        marginTop:'-1em'}}>
        <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.props.username}</b> <span style={{color:'gray'}}>• {this.props.time}</span></span>
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.props.location}</span>
        </div>
        <img src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'19em',
        cursor:'pointer'}}/>
        </div>
        <div onDoubleClick={this.likePost} style={{position:'absolute', top:'32%', width:'37em', height:'45em', marginLeft:'-0.5em'}}>
        <img src={imagePost} style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}}/>
        </div>
        <div style={{display:'flex', position:'absolute', top:'125%', alignItems:'center'}}>
        <img onClick = {this.toggleHeart} src={blankHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'none' : 'inline-block'}}/>
        <img onClick = {this.toggleHeart} src={redHeart} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer',
        display: this.state.isLiked ? 'inline-block' : 'none'}}/>
        <img src={commentIcon} style={{height:'3em', width:'3em', objectFit:'contain', cursor: 'pointer'}}/>
        <img src={sendIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', cursor: 'pointer'}}/>
        <img onClick={this.toggleSave} src={saveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: this.state.isSaved ? 'none' : 'inline-block'}}/>
        <img onClick={this.toggleSave} src={blackSaveIcon} style={{height:'3.2em', width:'3.2em', objectFit:'contain', marginLeft:'24em', cursor: 'pointer',
        display: !this.state.isSaved ? 'none' : 'inline-block'}}/>
        </div>
        <div style={{position:'absolute', top:'133%', display:'flex', flexDirection:'column', alignItems:'start', width:'37em', gap:'0.8em'}}>
        <b style={{fontSize:'1.25em', cursor:'pointer'}}>{this.state.numLikes} likes</b>
        <b style={{fontSize:'1.2em'}}>{this.props.username}</b>
        <span style={{fontSize:'1.2em', textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word'}}>{this.state.caption}</span>
        <p style={{color:'gray', marginTop:'0.4em', fontSize:'1.15em'}}>View all {this.state.numComments} comments</p>
        <br/>
        <input type="text" value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0.5em', fontSize: '1.2em', marginTop:'-1.2em', width:'27em', 
        borderWidth: '0px 0px 0.1em 0px', outline:'none', color:'black'}}
        placeholder="Add a comment..."/>

        </div>

        </div>
        </React.Fragment>);
    };
}

export default ImagePost;