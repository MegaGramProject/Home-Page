import React, { Component } from 'react';
import profileIcon from './images/profileIcon.png';
import moreIcon from './images/moreIcon.png';
import solidWhiteDot from './images/solidWhiteDot.png';
import checkedIcon from './images/checkedIcon.png';
import './styles.css';

class FollowUser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isHovering: false,
            error: null,
            profilePhoto: null,
            profilePhotoLoading: true,
            isFollowing: true,
            followText: "Follow",
            followingText: "Following"
        }
    };

    handleMouseEnter = () => {
        this.setState({isHovering: true})
    }

    handleMouseLeave = () => {
        this.setState({isHovering: false})
    }


    fetchProfilePhoto(username) {
        fetch(`http://localhost:8003/getProfilePhoto/${username}`)
            .then(response => {
                if (!response.ok) {
                    this.setState({
                        error: true,
                        profilePhotoLoading: false
                    });
                    throw new Error('Network response was not ok');
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                const base64Flag = 'data:image/jpeg;base64,';
                const imageStr = this.arrayBufferToBase64(buffer);
                this.setState({
                    profilePhoto: base64Flag + imageStr,
                    profilePhotoLoading: false
                });
            })
            .catch(error => {
                this.setState({
                    error: true,
                    profilePhotoLoading: false
                });
            });
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
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

    async updateFollowText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.followText,
                currLang,
                this.props.language
            );
            this.setState({followText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateFollowingText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.followingText,
                currLang,
                this.props.language
            );
            this.setState({followingText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }


    async componentDidMount() {
        this.fetchProfilePhoto(this.props.username);
        await this.updateFollowText("English");
        await this.updateFollowingText("English");
    }

    async componentDidUpdate(prevProps, prevState) {
        if(prevState.isFollowing != this.props.isFollowing) {
            this.setState({isFollowing: this.props.isFollowing});
        }
        if(prevProps.language!==this.props.language) {
            await this.updateFollowText(prevProps.language);
            await this.updateFollowingText(prevProps.language);
        }
    }

    toggleFollow = () => {
        this.setState({isFollowing: !this.state.isFollowing});
    }


    render() {
        return (
        <React.Fragment>
        <div className="popup" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} style={{cursor:'pointer', width:'95%', display:'flex', alignItems:'center',
        backgroundColor: this.state.isHovering ? '#ebedeb' : 'white', justifyContent:'space-between', boxShadow:'none'}}>
        <div style={{display:'flex', alignItems:'start'}}>
        {!(this.state.profilePhotoLoading || this.state.error) &&
        <img src={this.state.profilePhoto} style={{objectFit:'contain', height:'3em', width:'3em'}}/>}
        {(this.state.profilePhotoLoading || this.state.error) &&
        <img src={this.state.moreIcon} style={{objectFit:'contain', height:'3em', width:'3em'}}/>}
        <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <p>{this.props.username}</p>
        <br/>
        </div>
        </div>
        {this.state.isFollowing && !this.props.isOwn &&
        <button onClick={this.toggleFollow} style={{backgroundColor:'#f5f5f5', color:'black', fontWeight:'bold', cursor:'pointer',
        borderStyle:'none', width:'10em', borderRadius:'0.5em', paddingLeft:'0.5em', paddingBottom:'0.5em', paddingTop:'0.5em'}}>{this.state.followingText}</button>}
        {!this.state.isFollowing && !this.props.isOwn &&
        <button onClick={this.toggleFollow} style={{backgroundColor:'#1f86ed', fontWeight:'bold', color:'white', cursor:'pointer',
        borderStyle:'none', width:'8em', borderRadius:'0.5em', paddingLeft:'0.5em', paddingBottom:'0.5em', paddingTop:'0.5em'}}>{this.state.followText}</button>}
        </div>
        </React.Fragment>);
    };
}

export default FollowUser;