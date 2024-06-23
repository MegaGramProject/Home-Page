import React, { Component } from 'react';
import './styles.css';

class ThreeDotsPopup extends Component {
    constructor(props) {
        super(props);
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
        {!this.props.isAd &&  (<div style={{height:'35em', width:'30em', borderRadius:'5%', boxShadow:'0 4px 8px 0 rgba(0, 0, 0, 0.2)', backgroundColor:'white',
        display:'flex', flexDirection:'column', alignItems:'center'}}>
        <b style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>Report</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <b style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>Unfollow</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Go to post</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Share to...</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Copy link</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Edit</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>About this account</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Cancel</p>
        </div>)
        }

        {this.props.isAd &&  (<div style={{height:'16em', width:'30em', borderRadius:'5%', boxShadow:'0 4px 8px 0 rgba(0, 0, 0, 0.2)', backgroundColor:'white',
        display:'flex', flexDirection:'column', alignItems:'center'}}>
        <b style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>Hide ad</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <b style={{fontSize:'1.1em', color:'red', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>Report ad</b>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Why you're seeing this ad?</p>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <p style={{fontSize:'1.1em', cursor:'pointer'}}>Cancel</p>
        </div>)
        }

        </React.Fragment>);
    };
}

export default ThreeDotsPopup;