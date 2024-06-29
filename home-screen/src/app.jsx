import React, { Component } from 'react';
import CommentsPopup from './commentsPopup';
import Footer from "./footer";
import backArrow from "./images/backArrow.png";
import rightArrow from "./images/nextArrow.png";
import LeftSidebar from "./leftSidebar";
import MediaPost from "./mediaPost";
import SendPostPopup from './sendPostPopup';
import StoryIcon from "./storyIcon";
import './styles.css';
import ThreeDotsPopup from './threeDotsPopup';
import UserBar from "./userBar";


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
        commentsPopupPostDetails: null,
        commentsPopupTime: '',
        commentsPopupLocation: '',
        commentsPopupNumLikes: '',
        commentsPopupNumComments: '',
        commentsPopupCurrSlide: '',
        commentsPopupIsLiked: '',
        commentsPopupIsAd: '',
        commentsPopupIsSaved: '',
        showSendPostPopup: false,
        post1Details: null,
        post2Details: null,
        post3Details: null,
        post4Details: null,
        post5Details: null,
        focusedComponent: null,
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



    showCommentsPopup = (postDetails, numLikes, numComments, currSlide, isLiked, isAd, isSaved) => {
        this.setState({
            showCommentsPopup: true,
            commentsPopupPostDetails: postDetails,
            commentsPopupNumLikes: numLikes,
            commentsPopupNumComments: numComments,
            commentsPopupCurrSlide: currSlide,
            commentsPopupIsLiked: isLiked,
            commentsPopupIsAd: isAd,
            commentsPopupIsSaved: isSaved
        });
    };


    hideCommentsPopup = () => {
        this.setState({
            showCommentsPopup:false
        });
    };

    showSendPostPopup = () => {
        this.setState({
            showSendPostPopup: true
        });
    };

    closeSendPostPopup = () => {
        this.setState({
            showSendPostPopup: false
        });
    };

    closeThreeDotsPopup = () => {
        this.setState({
            showThreeDotsPopup: false
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

    async fetchPosts(username) {
        try {
            let postDetails = [];
    
            // Fetch posts
            let postsResponse = await fetch(`http://localhost:8003/getPosts/${username}`);
            if (!postsResponse.ok) {
                throw new Error('Network response was not ok');
            }
            let postsData = await postsResponse.json();
    
            if (postsData.length > 0) {
                postDetails.push([postsData[0]]); // Assuming you want to push the first item
            } else {
                postDetails.push([]);
            }
    
            // Fetch videos
            let videosResponse = await fetch(`http://localhost:8004/getVideos/${username}`);
            if (!videosResponse.ok) {
                throw new Error('Network response was not ok');
            }
            let videosData = await videosResponse.json();

            // Process videos based on username
            if (username === "rishavry2") {
                if (postDetails[0].length > 0) {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === postDetails[0][0]['id']);
                    postDetails.push(postsToSend);
                    this.setState({ post1Details: postDetails });
                }
            } else if (username === "rishavry3") {
                if (postDetails[0].length > 0) {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === postDetails[0][0]['id']);
                    postDetails.push(postsToSend);
                    this.setState({ post2Details: postDetails });
                }
            } else if (username === "rishavry5") {
                if (postDetails[0].length > 0) {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === postDetails[0][0]['id']);
                    postDetails.push(postsToSend);
                    this.setState({ post3Details: postDetails });
                } else {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === '683d0792-8f29-487d-bbf9-fc5dffeba864');
                    postDetails.push(postsToSend);
                    this.setState({ post3Details: postDetails });
                }
            } else if (username === "rishavry6") {
                if (postDetails[0].length > 0) {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === postDetails[0][0]['id']);
                    postDetails.push(postsToSend);
                    this.setState({ post4Details: postDetails });
                } else {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === '953c1754-bd3a-40d6-82c1-91b1d943de98');
                    postDetails.push(postsToSend);
                    this.setState({ post4Details: postDetails });
                }
            } else if (username === "rishavry7") {
                if (postDetails[0].length > 0) {
                    let postsToSend = videosData.filter(x => x['overallPostId'] === postDetails[0][0]['id']);
                    postDetails.push(postsToSend);
                    console.log(postDetails);
                    this.setState({ post5Details: postDetails });
                }
            }
    
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            // Handle error appropriately (e.g., show error message)
        }
    }
    


    async componentDidMount() {
        this.fetchPosts("rishavry2");
        this.fetchPosts("rishavry3");
        this.fetchPosts("rishavry5");
        this.fetchPosts("rishavry6");
        this.fetchPosts("rishavry7");
        await this.updateSeeAllText("English");
        await this.updateSuggestedForYouText("English");
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevState.language !== this.state.language) {
            await this.updateSeeAllText(prevState.language);
            await this.updateSuggestedForYouText(prevState.language);
        }
    }

    handleFocus = (id) => {
        this.setState({focusedComponent: id });
    };



    render() {
        return (
        <React.Fragment>
        <div style={{opacity:this.state.showThreeDotsPopup || this.state.showCommentsPopup || this.state.showSendPostPopup ? '0.1' : '1', pointerEvents:this.state.showThreeDotsPopup ||
        this.state.showCommentsPopup || this.state.showSendPostPopup ? 'none' : 'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
        <LeftSidebar username={"rishavry"} language={this.state.language} showPopup={this.state.showPopup}  changePopup={this.togglePopup}/>
        <div style={{position: 'absolute', left:'28.5%', marginTop:'2.3em', width:'45em', height:'50em'}}>
        <div style={{display:'flex', justifyContent:'start', alignItems:'start', gap:'1em'}}>
        <StoryIcon username='rishavry' ownAccount={true} unseenStory={false} isStory={true}/>
        <StoryIcon username='rishavry2' ownAccount={false} unseenStory={true} isStory={true}/>
        <StoryIcon username='rishavry3' ownAccount={false} unseenStory={true} isStory={true}/>
        <StoryIcon username='rishavry4' ownAccount={false} unseenStory={true} isStory={true}/>
        <StoryIcon username='rishavry5' ownAccount={false} unseenStory={true} isStory={true}/>
        <StoryIcon username='rishavry6' ownAccount={false} unseenStory={true} isStory={true}/>
        <StoryIcon username='rishavry7' ownAccount={false} unseenStory={true} isStory={true}/>
        </div>
        <img src={rightArrow} style={{height:'1.5em', width:'1.5em', objectFit:'contain', position:'absolute',
        left:'88%', top:'3%', cursor:'pointer'}}/>
        <img src={backArrow} style={{height:'1em', width:'1em', objectFit:'contain', position:'absolute',
        left:'-7.5%', top:'3%', cursor:'pointer'}}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
        marginLeft:'-5em', marginTop: '2em', gap:'1em'}}>
        <MediaPost id={1} postDetails={this.state.post1Details} language={this.state.language} numLikes={314} numComments={24}
        togglePopup={this.togglePostPopup} showCommentsPopup={this.showCommentsPopup}
        showSendPostPopup={this.showSendPostPopup} onFocus={this.handleFocus} isFocused={this.state.focusedComponent==1}/>
        <MediaPost id={2} postDetails={this.state.post2Details} language={this.state.language} numLikes={314} numComments={24}
        togglePopup={this.togglePostPopup} showCommentsPopup={this.showCommentsPopup}
        showSendPostPopup={this.showSendPostPopup} onFocus={this.handleFocus} isFocused={this.state.focusedComponent==2}/>
        <MediaPost id={3} postDetails={this.state.post3Details} language={this.state.language} numLikes={314} numComments={24}
        togglePopup={this.toggleAdPopup} showCommentsPopup={this.showCommentsPopup}
        showSendPostPopup={this.showSendPostPopup} onFocus={this.handleFocus} isFocused={this.state.focusedComponent==3}/>
        <MediaPost id={4} postDetails={this.state.post4Details} language={this.state.language} numLikes={314} numComments={24}
        togglePopup={this.toggleAdPopup} showCommentsPopup={this.showCommentsPopup}
        showSendPostPopup={this.showSendPostPopup} onFocus={this.handleFocus} isFocused={this.state.focusedComponent==4}/>
        <MediaPost id={5} postDetails={this.state.post5Details} language={this.state.language} numLikes={314} numComments={24}
        togglePopup={this.toggleAdPopup} showCommentsPopup={this.showCommentsPopup}
        showSendPostPopup={this.showSendPostPopup} onFocus={this.handleFocus} isFocused={this.state.focusedComponent==5}/>
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
        <ThreeDotsPopup closePopup = {this.closeThreeDotsPopup} language={this.state.language} isAd={this.state.threeDotsPopupIsAd}/>
        </div>

        <div style={{position:'fixed', left:'12%', top:'3%', display:this.state.showCommentsPopup ? 'inline-block' : 'none',
        opacity:this.state.showThreeDotsPopup || this.state.showSendPostPopup ? '0' : '1', pointerEvents:this.state.showThreeDotsPopup ||
        this.state.showSendPostPopup ? 'none' : 'auto'}}>
        <CommentsPopup id={5} language={this.state.language} postDetails={this.state.commentsPopupPostDetails}
        numLikes={this.state.commentsPopupNumLikes} numComments={this.state.commentsPopupNumComments}
        currSlide={this.state.commentsPopupCurrSlide}
        isLiked={this.state.commentsPopupIsLiked}  togglePopup={this.state.commentsPopupIsAd ? this.toggleAdPopup : this.togglePostPopup}
        isSaved={this.state.commentsPopupIsSaved} hideCommentsPopup={this.hideCommentsPopup} showSendPostPopup={this.showSendPostPopup}
        onFocus={this.handleFocus} isFocused={this.state.focusedComponent==5}/>
        </div>

        <div style={{position:'fixed', left:'35%', top:'25%', display:this.state.showSendPostPopup ? 'inline-block' : 'none'}}>
        <SendPostPopup language={this.state.language} closePopup={this.closeSendPostPopup}/>
        </div>


        </React.Fragment>);
    };
}

export default App;