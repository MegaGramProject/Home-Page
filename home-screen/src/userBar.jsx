import React, { Component } from 'react';
import profileIcon from './images/profileIcon.png';
import AccountPreview from './accountPreview';
import './styles.css';

class UserBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            switchText: "Switch",
            suggestedForYouText: "Suggested for you",
            followText: "Follow",
            showAccountPreview: false
        };
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

    async updateSuggestedForYouText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.suggestedForYouText,
                currLang,
                this.props.language
            );
            this.setState({suggestedForYouText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSwitchText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.switchText,
                currLang,
                this.props.language
            );
            this.setState({switchText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateFollowText("English");
        await this.updateSuggestedForYouText("English");
        await this.updateSwitchText("English");
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.language !== this.props.language) {
            await this.updateFollowText(prevProps.language);
            await this.updateSuggestedForYouText(prevProps.language);
            await this.updateSwitchText(prevProps.language);
        }
    }


    takeUserToLogin() {
        window.location.href = "http://localhost:8000/login";
    }

    toggleFollowText = () => {
        if (this.state.followText==="Follow") {
            this.setState({followText: "Following"});
        }
        else {
            this.setState({followText: "Follow"});
        }
        
    }

    toggleAccountPreview = () => {
        this.setState({showAccountPreview: !this.state.showAccountPreview});
    }

    showAccountPreview = () => {
        this.setState({showAccountPreview: true});
    }



    render() {
        return (
        <React.Fragment>
        <div style={{display:'flex', width:'20em', marginTop:'-2em', alignItems:'center', position:'relative'}}>
        <img onMouseEnter={this.props.ownAccount ? null : this.toggleAccountPreview} onMouseLeave={this.props.ownAccount ? null : this.toggleAccountPreview} src={profileIcon} style={{height:'2.5em', width:'2.5em', objectFit:'contain', cursor:'pointer'}}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', marginLeft:'0.7em'}}>
        <p onMouseEnter={this.props.ownAccount ? null : this.toggleAccountPreview} onMouseLeave={this.props.ownAccount ? null : this.toggleAccountPreview} style={{fontWeight:'bold', fontSize:'0.85em', cursor:'pointer'}}>{this.props.username}</p>
        <p style={{display: this.props.ownAccount ? 'inline-block' : 'none', fontSize:'0.7em', marginTop:'-0.7em', color:'#787878'}}>{this.props.fullName}</p>
        <p style={{display: this.props.ownAccount ? 'none' : 'inline-block',  fontSize:'0.7em', marginTop:'-0.7em', color:'#787878'}}>{this.state.suggestedForYouText}</p>
        </div>
        <p onClick={this.props.ownAccount ? this.takeUserToLogin : this.toggleFollowText} style={{color: this.state.followText==="Follow" ? '#348feb' : 'gray', cursor:'pointer', fontSize:'0.85em', fontWeight:'bold', position:'absolute', left:'82%', marginTop:'1.5em'}}>  {this.props.ownAccount ? this.state.switchText : this.state.followText}</p>
        <div class="accountPreview" style={{display: this.state.showAccountPreview ? 'inline-block' : 'none',
        position:'absolute', top:'55%'}} onMouseEnter={this.showAccountPreview} onMouseLeave={this.toggleAccountPreview}>
        <AccountPreview username={this.props.username} fullName={"R R"} isPrivate={true} numPosts={5}
        numFollowers={836} numFollowing={500}/>
        </div>
        </div>
        <br/><br/>
        </React.Fragment>);
    };
}

export default UserBar;