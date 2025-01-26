import React, { Component } from 'react';

import SelectUser from './selectUser';

import closePopupIcon from '../assets/images/closePopupIcon.png';

class SendPostPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            accountToSend: "",
            accountsSelected: [],
            shareText: "Share",
            toText: "To:",
            suggestedText: "Suggested",
            sendText: "Send",
            searchText: "Search..."
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

    async updateShareText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.shareText,
                currLang,
                this.props.language
            );
            this.setState({ shareText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSuggestedText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.suggestedText,
                currLang,
                this.props.language
            );
            this.setState({ suggestedText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSendText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.sendText,
                currLang,
                this.props.language
            );
            this.setState({ sendText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSearchText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.searchText,
                currLang,
                this.props.language
            );
            this.setState({ searchText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateToText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.toText,
                currLang,
                this.props.language
            );
            this.setState({ toText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateShareText("English");
        await this.updateSuggestedText("English");
        await this.updateSendText("English");
        await this.updateToText("English");
        await this.updateSearchText("English");
    }
    
    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.language !== this.props.language) {
            await this.updateShareText(prevProps.language);
            await this.updateSuggestedText(prevProps.language);
            await this.updateToText(prevProps.language);
            await this.updateSearchText(prevProps.language);
        }
    }

    handleInputChange = (event) => {
        this.setState({accountToSend: event.target.value});
    }

    addAccount = (newAccount) => {
        this.setState({
            accountsSelected: [...this.state.accountsSelected, newAccount],
        });

    }

    removeAccount = (deletedAccount) => {
        const newAccountsSelected = this.state.accountsSelected.filter(x => x!==deletedAccount);
        this.setState({
            accountsSelected: newAccountsSelected
        })
    }

    sendPost = () => {
        console.log("SENT TO " + this.state.accountsSelected)
    };



    render() {
        return (
        <React.Fragment>
        <div style={{backgroundColor:'white', borderRadius:'2%', width:'35em', height:'35em', borderStyle:'solid', borderColor:'lightgray',
        paddingTop:'1em'}}>
        <b>{this.state.shareText}</b>
        <img onClick={this.props.closePopup} src={closePopupIcon} style={{objectFit:'contain', height:'1em', width:'1em', position:'absolute', left:'90%',
        cursor:'pointer'}}/>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <div style={{display:'flex',  paddingLeft:'1em', alignItems:'center'}}>
        <b>{this.state.toText}</b>
        <input type="text" value={this.state.accountToSend} onChange={this.handleInputChange} placeholder={this.state.searchText}
        style={{width:'35em', marginLeft:'1em', fontSize:'0.9em', borderStyle:'none', outline: 'none'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <div style={{display:'flex', flexDirection:'column', alignItems:'start', height:'26em',
        paddingLeft:'1em', overflow:'scroll'}}>
        {this.state.accountToSend==="" && <b>{this.state.suggestedText}</b>}
        <br/>
        <SelectUser username={"rishavry2"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry3"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry4"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry5"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry6"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry7"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        </div>
        {this.state.accountsSelected.length == 0 && <button type="button" className="blueButton" style={{width:'42em'}}>{this.state.sendText}</button>}
        {this.state.accountsSelected.length > 0 && <button onClick={this.sendPost} type="button" className="blueButton"
        style={{width:'42em', cursor:'pointer', backgroundColor:'#347aeb'}}>{this.state.sendText}</button>}
        </div>
        </React.Fragment>);
    };
}

export default SendPostPopup;