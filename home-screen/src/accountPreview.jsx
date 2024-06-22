import React, { Component } from 'react';
import profileIcon from "./images/profileIcon.png";
import privateAccount from "./images/privateAccount.png";
import './styles.css';


class AccountPreview extends Component {
    constructor(props) {
        super(props);
        this.state = {
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



    render() {
        return (
        <React.Fragment>
        <div class="popup" style={{backgroundColor:"white", width:'22em', height:'22em', position:'absolute', zIndex:'3',
        paddingTop:'2em', paddingLeft:'2em', borderRadius:'2%'}}>
        <div style={{display:'flex', justifyContent:'start', alignItems:'start'}}>
        <img src={profileIcon} style={{width:'3em', height:'3em'}}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', marginLeft:'0.7em'}}>
        <p style={{fontWeight:'bold', fontSize:'0.85em', cursor:'pointer'}}>{this.props.username}</p>
        <p style={{fontSize:'0.7em', marginTop:'-0.7em', color:'#787878'}}>{this.props.fullName}</p>
        </div>
        </div>
        <div style={{position:'absolute', top:'30%', display:'flex', gap:'7em', marginLeft:'1.5em', fontWeight:'bold'}}>
        <span>{this.props.numPosts}</span>
        <span>{this.props.numFollowers}</span>
        <span>{this.props.numFollowing}</span>
        </div>
        <div style={{position:'absolute', top:'40%', display:'flex', gap:'6em', marginLeft:'0.5em', marginTop:'-0.3em',
        fontSize:'0.9em'}}>
        <span>posts</span>
        <span>followers</span>
        <span>following</span>
        </div>
        {this.props.isPrivate && (<div style={{position:'absolute', top:'45%', display:'flex', flexDirection: 'column'}}>
        <img src={privateAccount} style={{height:'7em', width:'7em', objectFit:'contain', marginLeft:'6.4em'}}/>
        <b style={{marginLeft:'0.4em'}}>This account is private</b>
        <p style={{color:'gray', fontSize:'0.8em', marginLeft:'0.4em', marginTop:'0.1em'}}>Follow this account to see their photos and videos.</p>
        </div>)}
        <button className="blueButton" style={{width:'27em', backgroundColor:'#327bf0', position:'absolute', top:'81.5%', marginLeft:'-15em', cursor:'pointer'}}>Follow</button>
        </div>
        </React.Fragment>);
    };
}

export default AccountPreview;