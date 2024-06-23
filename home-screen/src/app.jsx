import React, { Component } from 'react';
import Footer from "./footer";
import ImagePost from "./imagePost";
import backArrow from "./images/backArrow.png";
import rightArrow from "./images/nextArrow.png";
import LeftSidebar from "./leftSidebar";
import StoryIcon from "./storyIcon";
import './styles.css';
import UserBar from "./userBar";
import ThreeDotsPopup from './threeDotsPopup';
import CommentsPopup from './commentsPopup';


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
        showPopup: false,
        language: 'English',
        suggestedForYouText: 'Suggested for you',
        seeAllText: 'See all',
        showThreeDotsPopup: false,
        threeDotsPopupIsAd: false,
        showCommentsPopup: false,
        commentsPopupUsername: '',
        commentsPopupTime: '',
        commentsPopupLocation: '',
        commentsPopupNumLikes: '',
        commentsPopupNumComments: '',
        commentsPopupNumSlides: '',
        commentsPopupCurrSlide: '',
        commentsPopupIsLiked: '',
        commentsPopupIsAd: '',
        commentsPopupIsSaved: ''
        };
    };

    togglePopup = () => {
        this.setState({showPopup: !this.state.showPopup});
    };

    changeLanguage = (newLanguage) => {
        this.setState({language: newLanguage});
    };

    togglePostPopup = () => {
        this.setState({
            showThreeDotsPopup: !this.state.showThreeDotsPopup,
            threeDotsPopupIsAd: false,
        });
    };

    toggleAdPopup = () => {
        this.setState({
            showThreeDotsPopup: !this.state.showThreeDotsPopup,
            threeDotsPopupIsAd: true,
        });
    };

    showCommentsPopup = (username, location, time, numLikes, numComments, numSlides, currSlide, isLiked, isAd, isSaved) => {
        this.setState({
            showCommentsPopup: true,
            commentsPopupUsername: username,
            commentsPopupLocation: location,
            commentsPopupTime: time,
            commentsPopupNumComments: numComments,
            commentsPopupNumLikes: numLikes,
            commentsPopupNumSlides: numSlides,
            commentsPopupCurrSlide: currSlide,
            commentsPopupIsLiked: isLiked,
            commentsPopupIsAd: isAd,
            commentsPopupIsSaved: isSaved
        });
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


    async updateSuggestedForYouText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.suggestedForYouText,
                currLang,
                this.state.language
            );
            this.setState({suggestedForYouText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSeeAllText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.seeAllText,
                currLang,
                this.state.language
            );
            this.setState({seeAllText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async componentDidMount() {
        await this.updateSeeAllText("English");
        await this.updateSuggestedForYouText("English");
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevState.language !== this.state.language) {
            await this.updateSeeAllText(prevState.language);
            await this.updateSuggestedForYouText(prevState.language);
        }
    }


    render() {
        return (
        <React.Fragment>
        <div style={{opacity:this.state.showThreeDotsPopup || this.state.showCommentsPopup ? '0.1' : '1', pointerEvents:this.state.showThreeDotsPopup ||
        this.state.showCommentsPopup ? 'none' : 'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
        <LeftSidebar language={this.state.language} showPopup={this.state.showPopup}  changePopup={this.togglePopup}/>
        <div style={{position: 'absolute', left:'28.5%', marginTop:'2.3em', width:'45em', height:'50em'}}>
        <div style={{display:'flex', justifyContent:'start', alignItems:'start', gap:'1em'}}>
        <StoryIcon username='rishavry' ownAccount={true} unseenStory={false}/>
        <StoryIcon username='rishavry2' ownAccount={false} unseenStory={true}/>
        <StoryIcon username='rishavry3' ownAccount={false} unseenStory={true}/>
        <StoryIcon username='rishavry4' ownAccount={false} unseenStory={true}/>
        <StoryIcon username='rishavry5' ownAccount={false} unseenStory={true}/>
        <StoryIcon username='rishavry6' ownAccount={false} unseenStory={true}/>
        <StoryIcon username='rishavry7' ownAccount={false} unseenStory={true}/>
        </div>
        <img src={rightArrow} style={{height:'1.5em', width:'1.5em', objectFit:'contain', position:'absolute',
        left:'88%', top:'3%', cursor:'pointer'}}/>
        <img src={backArrow} style={{height:'1em', width:'1em', objectFit:'contain', position:'absolute',
        left:'-7.5%', top:'3%', cursor:'pointer'}}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
        marginLeft:'-5em', marginTop: '2em', gap:'5em'}}>
        <ImagePost language={this.state.language} username={'rishavry2'} time={'5h'} location={'Da Nang, Vietnam'} numLikes={314} numComments={24}
        togglePopup={this.togglePostPopup} numSlides={1} showCommentsPopup={this.showCommentsPopup} isAd={false}/>
        <ImagePost language={this.state.language} username={'rishavry3'} time={'4h'} location={'Da Nang, Vietnam'} numLikes={314} numComments={24}
        togglePopup={this.togglePostPopup} numSlides={4} showCommentsPopup={this.showCommentsPopup} isAd={false}/>
        <ImagePost language={this.state.language} username={'rishavry4'} time={'3h'} location={'Da Nang, Vietnam'} numLikes={314} numComments={24}
        togglePopup={this.toggleAdPopup} numSlides={5} showCommentsPopup={this.showCommentsPopup} isAd={true}/>
        <ImagePost language={this.state.language} username={'rishavry5'} time={'2h'} location={'Da Nang, Vietnam'} numLikes={314} numComments={24}
        togglePopup={this.toggleAdPopup} numSlides={3} showCommentsPopup={this.showCommentsPopup} isAd={true}/>
        </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', position: 'absolute',
        left:'76%', marginTop:'4em'}}>
        <UserBar language={this.state.language} username='rishavry' fullName='rishav ' ownAccount={true}/>
        <div style={{marginTop:'-1em'}}>
        <span style={{color:'gray', fontWeight:'600', fontSize:'0.9em'}}>{this.state.suggestedForYouText}</span>
        <span style={{fontSize:'0.77em', marginLeft:'10em', cursor:'pointer'}}>{this.state.seeAllText}</span>
        </div>
        <br/>
        <br/>
        <br/>
        <UserBar language={this.state.language} username='rishavry2' fullName='' ownAccount={false}/>
        <UserBar language={this.state.language} username='rishavry3' fullName='' ownAccount={false}/>
        <UserBar language={this.state.language} username='rishavry4' fullName='' ownAccount={false}/>
        <UserBar language={this.state.language} username='rishavry5' fullName='' ownAccount={false}/>
        <UserBar language={this.state.language} username='rishavry6' fullName='' ownAccount={false}/>
        <Footer language={this.state.language} changeLanguage={this.changeLanguage}/>
        </div>
        </div>
        </div>

        <div style={{position:'fixed', left:'35%', top:'25%', display:this.state.showThreeDotsPopup ? 'inline-block' : 'none'}}>
        <ThreeDotsPopup isAd={this.state.threeDotsPopupIsAd}/>
        </div>

        <div style={{position:'fixed', left:'12%', top:'3%', display:this.state.showCommentsPopup ? 'inline-block' : 'none'}}>
        <CommentsPopup language={this.state.language} username={this.state.commentsPopupUsername} time={this.state.commentsPopupTime} location={this.state.commentsPopupLocation}
        numLikes={this.state.commentsPopupNumLikes} numComments={this.state.commentsPopupNumComments}
        numSlides={this.state.commentsPopupNumSlides} currSlide={this.state.commentsPopupCurrSlide}
        isLiked={this.state.commentsPopupIsLiked}  togglePopup={this.state.commentsPopupIsAd ? this.toggleAdPopup : this.togglePostPopup}
        isSaved={this.state.commentsPopupIsSaved}/>
        </div>


        </React.Fragment>);
    };
}

export default App;