import React, { Component } from 'react';
import reportAProblemIcon from './images/reportAProblemIcon.png';
import savedIcon from './images/saveIcon.png';
import settingsIcon from './images/settingsIcon.png';
import yourActivityIcon from './images/yourActivityIcon.png';
import './styles.css';

class LeftSidebarPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            settingsText: "Settings",
            activityText: "Your activity",
            savedText: "Saved",
            reportProblemText: "Report a problem",
            switchAccountsText: "Switch accounts",
            logoutText: "Log out"
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

    async updateSettingsText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.settingsText,
                currLang,
                this.props.language
            );
            this.setState({settingsText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateActivityText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.activityText,
                currLang,
                this.props.language
            );
            this.setState({ activityText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSavedText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.savedText,
                currLang,
                this.props.language
            );
            this.setState({ savedText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateReportProblemText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.reportProblemText,
                currLang,
                this.props.language
            );
            this.setState({reportProblemText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSwitchAccountsText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.switchAccountsText,
                currLang,
                this.props.language
            );
            this.setState({ switchAccountsText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateLogoutText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.logoutText,
                currLang,
                this.props.language
            );
            this.setState({ logoutText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateSettingsText("English");
        await this.updateActivityText("English");
        await this.updateSavedText("English");
        await this.updateReportProblemText("English");
        await this.updateSwitchAccountsText("English");
        await this.updateLogoutText("English");
    }

    
    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.language !== this.props.language) {
            await this.updateSettingsText(prevProps.language);
            await this.updateActivityText(prevProps.language);
            await this.updateSavedText(prevProps.language);
            await this.updateReportProblemText(prevProps.language);
            await this.updateSwitchAccountsText(prevProps.language);
            await this.updateLogoutText(prevProps.language);
        }
    }

    logoutUser = async () => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'username': this.props.username}),
            credentials: 'include'
        };
        const response = await fetch('http://localhost:8003/cookies/removeTokens', options);
        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const responseData = await response.text();
        if(responseData === "Successfully logged out") {
            window.location.href = 'http://localhost:8000/login';
        }
        else {
            console.log(responseData);
        }

    }


    render() {
        return (
        <React.Fragment>
        <div className="popup" style={{width: '15em', height:'20em', borderRadius:'0.4em', paddingTop: '1em'}}>
            <div class="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={settingsIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>{this.state.settingsText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={yourActivityIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>{this.state.activityText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={savedIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>{this.state.savedText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={reportAProblemIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>{this.state.reportProblemText}</p>
            </div>
            <div id="leftSideBarPopupGap" style={{width:'15em', height:'0.9em', backgroundColor:'#f7f7f7'}}></div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>{this.state.switchAccountsText}</p>
            </div>
            <div onClick={this.logoutUser} className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>{this.state.logoutText}</p>
            </div>

        </div>
        
        </React.Fragment>);
    };
}

export default LeftSidebarPopup;