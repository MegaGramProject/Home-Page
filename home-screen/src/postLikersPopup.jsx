import React, { Component } from 'react';
import FollowUser from './followUser';
import closePopupIcon from './images/closePopupIcon.png';
import './styles.css';

class PostLikersPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            postId: '',
            accounts:  [],
            likesText: "Likes"
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

    async updateLikesText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.likesText,
                currLang,
                this.props.language
            );
            this.setState({likesText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateLikesText("English");
    }

    async componentDidUpdate(prevProps, prevState) {
        if(prevState.postId !== this.props.postId) {
            this.setState({postId: this.props.postId});
            this.fetchAccounts();
        }
        if(prevProps.language !== this.props.language) {
            await this.updateLikesText(prevProps.language);
        }
        else if(prevState.likesText !== this.state.likesText) {
            await this.updateLikesText("English");
        }

    }

    fetchAccounts = async () => {
        const response = await fetch(`http://localhost:8004/getLikes/${this.props.postId}`);
        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const usersThatLiked = await response.json();
        let accounts = []
        for(let i of usersThatLiked) {
            if(i['username']==='rishavry') {
                accounts.unshift(<FollowUser language={this.props.language} username={i['username']} isOwn={true} isFollowing={true}/>);
            }
            else {
                accounts.push(<FollowUser language={this.props.language} username={i['username']} isOwn={false} isFollowing={false}/>);
            }
        }
        this.setState({accounts: accounts});
    }

    closePopup = () => {
        this.setState({postId: '', accounts: []});
        this.props.closePopup();
    }


    render() {
        return (
        <React.Fragment>
        <div className="popup" style={{backgroundColor:'white',  boxShadow:'1px 4px 8px 3px rgba(0, 0, 0, 0.2)', width:'40em', height:'40em',
        display:'flex', flexDirection:'column', alignItems:'center', borderRadius:'1.5%', paddingTop:'1em', overflow:'scroll'}}>
        <div className="popup" style={{display:'flex', boxShadow:'none'}}>
        <b style={{position:'absolute', left:'45%'}}>{this.state.likesText}</b>
        <img src={closePopupIcon} onClick={this.closePopup} style={{height:'1.3em', width:'1.3em', cursor:'pointer', marginLeft:'30em'}}/>
        </div>
        <hr style={{color:'gray', width:'100%', marginTop:'0.7em'}}/>
        {this.state.accounts}
        </div>
        </React.Fragment>);
    };
}

export default PostLikersPopup;