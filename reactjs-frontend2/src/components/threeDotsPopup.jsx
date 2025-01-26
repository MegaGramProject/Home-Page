import React, { Component } from 'react';

class ThreeDotsPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hidePostText: "Hide post",
            unfollowText: "Unfollow",
            goToPostText: "Go to post",
            shareToText: "Share to...",
            copyLinkText: "Copy link",
            editText: "Edit",
            aboutThisAccountText: "About this account",
            cancelText: "Cancel",
            hideAdText: "Hide ad",
            whyAdText: "Why are you seeing this ad?",
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

    async updateReportText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.reportText,
                currLang,
                this.props.language
            );
            this.setState({ reportText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateUnfollowText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.unfollowText,
                currLang,
                this.props.language
            );
            this.setState({ unfollowText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateGoToPostText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.goToPostText,
                currLang,
                this.props.language
            );
            this.setState({ goToPostText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateShareToText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.shareToText,
                currLang,
                this.props.language
            );
            this.setState({ shareToText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateCopyLinkText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.copyLinkText,
                currLang,
                this.props.language
            );
            this.setState({ copyLinkText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateEditText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.editText,
                currLang,
                this.props.language
            );
            this.setState({ editText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateAboutAccountText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.aboutThisAccountText,
                currLang,
                this.props.language
            );
            this.setState({ aboutThisAccountText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateCancelText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.cancelText,
                currLang,
                this.props.language
            );
            this.setState({ cancelText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateHideAdText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.hideAdText,
                currLang,
                this.props.language
            );
            this.setState({ hideAdText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateReportAdText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.reportAdText,
                currLang,
                this.props.language
            );
            this.setState({ reportAdText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateWhyAdText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.whyAdText,
                currLang,
                this.props.language
            );
            this.setState({ whyAdText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateWhyAdText("English");
        await this.updateReportAdText("English");
        await this.updateHideAdText("English");
        await this.updateCancelText("English");
        await this.updateAboutAccountText("English");
        await this.updateEditText("English");
        await this.updateCopyLinkText("English");
        await this.updateShareToText("English");
        await this.updateGoToPostText("English");
        await this.updateUnfollowText("English");
        await this.updateReportText("English");
    }
    
    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.language !== this.props.language) {
            await this.updateWhyAdText(prevProps.language);
            await this.updateReportAdText(prevProps.language);
            await this.updateHideAdText(prevProps.language);
            await this.updateCancelText(prevProps.language);
            await this.updateAboutAccountText(prevProps.language);
            await this.updateEditText(prevProps.language);
            await this.updateCopyLinkText(prevProps.language);
            await this.updateShareToText(prevProps.language);
            await this.updateGoToPostText(prevProps.language);
            await this.updateUnfollowText(prevProps.language);
            await this.updateReportText(prevProps.language);
        }
    }


    render() {
        return (
        <React.Fragment>
        {!this.props.isAd &&  (<div className="popup" style={{height:'35em', width:'30em', borderRadius:'5%', boxShadow:'0 4px 8px 0 rgba(0, 0, 0, 0.2)', backgroundColor:'white',
        display:'flex', flexDirection:'column', alignItems:'center'}}>
        <b onClick={()=>{this.props.hidePost(this.props.id)}} style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>{this.state.hidePostText}</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <b style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>{this.state.unfollowText}</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.goToPostText}</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.shareToText}</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.copyLinkText}</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.editText}</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p onClick={() => {this.props.showAboutAccountPopup(this.props.postId)}} style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.aboutThisAccountText}</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p onClick={this.props.closePopup} style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.cancelText}</p>
        </div>)
        }

        {this.props.isAd &&  (<div className="popup" style={{height:'13em', width:'30em', borderRadius:'5%', boxShadow:'0 4px 8px 0 rgba(0, 0, 0, 0.2)', backgroundColor:'white',
        display:'flex', flexDirection:'column', alignItems:'center'}}>
        <b onClick={()=>{this.props.hidePost(this.props.id)}} style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>{this.state.hideAdText}</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.whyAdText}</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p onClick={this.props.closePopup} style={{fontSize:'1.1em', cursor:'pointer'}}>{this.state.cancelText}</p>
        </div>)
        }

        </React.Fragment>);
    };
}

export default ThreeDotsPopup;