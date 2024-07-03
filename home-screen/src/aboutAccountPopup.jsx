import React, { Component } from 'react';
import accountBasedIn from './images/accountBasedIn.png';
import dateJoined from './images/dateJoined.png';
import StoryIcon from './storyIcon';
import './styles.css';


class AboutAccountPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            dateJoined: "",
            accountBasedIn: ""
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

    fetchUsername = async (postId) => {
        if(postId!==null) {

        const response = await fetch("http://localhost:8003/getPostInfo/"+ postId);
        if(!response.ok) {
            throw new Error("Network response no good");
        }
        const postInfo = await response.json();
        let username;
        if(postInfo[0]!==null) {
            username = postInfo[0]['usernames'][0];
        }
        else {
            username = postInfo[1][0]['usernames'][0];
        }
        const response2 = await fetch("http://localhost:5022/fetchUserInfo/" + username);
        if(!response.ok) {
            throw new Error("Network response no good");
        }
        const userInfo = await response2.json();
        this.setState({
            username: username,
            dateJoined: userInfo['created'],
            accountBasedIn:userInfo['accountBasedIn']
        });
    }
    }

    async componentDidMount() {
        await this.fetchUsername(this.props.postId);
    };

    async componentDidUpdate(prevProps, prevState) {
        if(prevProps.postId !== this.state.postId) {
            await this.fetchUsername(this.props.postId);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const currentDate = new Date();
        const secondsDiff = Math.floor((currentDate - date) / 1000);
    
        if (secondsDiff < 60) {
            return `${secondsDiff}s`;
        } else {
            const minutesDiff = Math.floor(secondsDiff / 60);
            if (minutesDiff < 60) {
                return `${minutesDiff}m`;
            } else {
                const hoursDiff = Math.floor(minutesDiff / 60);
                if (hoursDiff < 24) {
                    return `${hoursDiff}h`;
                } else {
                    const daysDiff = Math.floor(hoursDiff/24);
                    if (daysDiff < 7) {
                        return `${daysDiff}d`;
                    }
                    else {
                        const weeksDiff = Math.floor(hoursDiff / 24 / 7);
                        if (weeksDiff < 4) {
                            return `${weeksDiff}w`;
                        } else {
                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            const month = months[date.getUTCMonth()];
                            const day = date.getUTCDate();
                            const year = date.getUTCFullYear();
                            return `${month} ${day}, ${year}`;
                        }
                    }
                }
            }
        }
    }



    render() {
        return (
        <React.Fragment>
        <div style={{backgroundColor:'white', borderStyle:'solid', borderRadius:'0.5em', display:'flex',
        flexDirection:'column', alignItems:'center', width:'30em', paddingTop:'1em', height:'29em', borderColor:'lightgray'}}>
        <b style={{fontSize:'1.2em'}}>About this account</b>
        <hr style={{borderStyle:'solid', color:'lightgray', width:'100%', marginTop:'1em'}}/>
        {this.state.username!=="" && <StoryIcon key={this.state.username} language={this.props.language} username={this.state.username} isStory={false}/>}
        <br/>
        <b>{this.state.username}</b>
        <p style={{width:'22em', color:'#616161', fontSize:'0.95em'}}>To help keep our community authentic, we’re showing information about accounts on Megagram.</p>
        <div style={{display:'flex', gap:'0.7em', position:'absolute', left:'10%', top:'60%'}}>
        <img src={dateJoined} style={{height:'2.9em', width:'2.9em', objectFit:'contain', pointerEvents:'none'}}/>
        <div style={{display:'flex', flexDirection:'column', textAlign:'left'}}>
        <b>Date joined</b>
        <p style={{color:'gray', marginTop:'0.1em'}}>{this.formatDate(this.state.dateJoined)}</p>
        </div>
        </div>
        <div style={{display:'flex', gap:'0.5em', position:'absolute', left:'10%', top:'73%'}}>
        <img src={accountBasedIn} style={{height:'2.9em', width:'2.9em', objectFit:'contain', pointerEvents:'none'}}/>
        <div style={{display:'flex', flexDirection:'column', textAlign:'left'}}>
        <b>Account based in</b>
        <p style={{color:'gray', marginTop:'0.1em'}}>{this.state.accountBasedIn}</p>
        </div>
        </div>
        <div style={{position:'absolute', top:'87%', left:'0%', width:'100%'}}>
        <hr style={{borderStyle:'solid', color:'lightgray', width:'100%', marginTop:'1em', marginBottom:'-0.2em'}}/>
        <p onClick={this.props.closePopup} style={{cursor:'pointer'}}>Close</p>
        </div>
        </div>
        </React.Fragment>);
    };
}

export default AboutAccountPopup;