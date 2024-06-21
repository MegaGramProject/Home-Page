import React, { Component } from 'react';
import dropdownV from './images/dropdownV.png';
import './styles.css';

class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            footnoteText: "An enhanced version of Instagram, created as a personal project and powered by Rishav Ray"
        }
    };

    changeLanguage = (newLanguage) => {
        this.props.changeLanguage(newLanguage);
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

    async updateFootnoteText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.footnoteText,
                currLang,
                this.props.language
            );
            this.setState({ footnoteText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateFootnoteText("English");
    }
    
    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.language !== this.props.language) {
            await this.updateFootnoteText(prevProps.language);
        }
    }


    render() {
        return (
        <React.Fragment>
        <div style={{marginLeft:'0em', marginTop: '0em', width:'20em'}}>
        <footer id="footnote" className="footnote">{this.state.footnoteText}</footer>
        <div className="dropdown">
        <button className="dropbtn">
                <div style={{ display: 'flex', gap: '0.1em'}}>
                    <span id="language" class="footnote">{this.props.language}</span>
                    <img className="dropdownV" src={dropdownV} alt="Dropdown"/>
                </div>
        </button>
        <div id="languageList" className="dropdown-content" style={{marginTop:'1em'}}>
                <p onClick={() => this.changeLanguage('العربية')}>العربية</p>
                <p onClick={() => this.changeLanguage('বাংলা')}>বাংলা</p>
                <p onClick={() => this.changeLanguage('Deutsch')}>Deutsch</p>
                <p onClick={() => this.changeLanguage('English')}>English</p>
                <p onClick={() => this.changeLanguage('Español')}>Español</p>
                <p onClick={() => this.changeLanguage('Français')}>Français</p>
                <p onClick={() => this.changeLanguage('हिंदी')}>हिंदी</p>
                <p onClick={() => this.changeLanguage('Bahasa Indonesia')}>Bahasa Indonesia</p>
                <p onClick={() => this.changeLanguage('Italiano')}>Italiano</p>
                <p onClick={() => this.changeLanguage('日本語')}>日本語</p>
                <p onClick={() => this.changeLanguage('Русский')}>Русский</p>
                <p onClick={() => this.changeLanguage('中国人')}>中国人</p>
        </div>
        </div>
        </div>
        </React.Fragment>);
    };
}

export default Footer;