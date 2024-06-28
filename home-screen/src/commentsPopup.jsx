import React, { Component } from 'react';
import Comment from './comment';
import backArrow from './images/backArrow.png';
import blackSaveIcon from './images/blackSaveIcon.png';
import blankHeart from './images/blankHeartIcon.png';
import closePopupIcon from './images/closePopupIcon.png';
import commentIcon from './images/commentIcon.png';
import nextArrow from './images/nextArrow.png';
import redHeart from './images/redHeartIcon.png';
import saveIcon from './images/saveIcon.png';
import sendIcon from './images/sendIcon.png';
import taggedAccountsIcon from './images/taggedAccountsIcon.png';
import threeHorizontalDots from './images/threeHorizontalDots.png';
import PostDots from './postDots';
import StoryIcon from './storyIcon';
import './styles.css';

class CommentsPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            comment: "",
            sendComment: false,
            isLiked: this.props.isLiked,
            numLikes: this.props.numLikes,
            currSlide: this.props.currSlide,
            isSaved: this.props.isSaved,
            commentsSent: [],
            likesText: this.props.numLikes + " likes",
            timeText: this.props.time,
            addCommentText: "Add a comment...",
            postText: "Post",
            locationText: '',
            showTags: false,

        };
        this.textInput = React.createRef();
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

    async updateTimeText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.timeText,
                currLang,
                this.props.language
            );
            this.setState({timeText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateAddCommentText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.addCommentText,
                currLang,
                this.props.language
            );
            this.setState({addCommentText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updatePostText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.postText,
                currLang,
                this.props.language
            );
            this.setState({postText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateLocationText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.locationText,
                currLang,
                this.props.language
            );
            this.setState({locationText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }


    async componentDidMount() {
        await this.updateAddCommentText("English");
        await this.updateTimeText("English");
        await this.updateLikesText("English");
        await this.updateLocationText("English");
        await this.updatePostText("English");
        window.addEventListener('keydown', this.handleKeyDown2);
    }

    async componentWillUnmount () {
        window.removeEventListener('keydown', this.handleKeyDown2);
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.postDetails != this.props.postDetails || prevProps.currSlide !== this.props.currSlide ||
            prevProps.isLiked != this.props.isLiked || prevProps.isSaved != this.props.isSaved) {
            this.setState({
                isLiked: this.props.isLiked,
                numLikes: this.props.numLikes,
                currSlide: this.props.currSlide,
                isSaved: this.props.isSaved,
                timeText: this.formatDate(this.props.postDetails.dateTimeOfPost),
                likesText: this.props.numLikes + " likes",
                locationText: this.props.postDetails.locationOfPost,
            });
        }
        else if(prevProps.language != this.props.language) {
            await this.updateAddCommentText(prevProps.language);
            await this.updateTimeText(prevProps.language);
            await this.updateLikesText(prevProps.language);
            await this.updateLocationText(prevProps.language);
            await this.updatePostText(prevProps.language);
        }
        else {
            if(prevState.likesText !== this.state.likesText) {
                await this.updateLikesText("English");
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();
        
        return `${month} ${day}, ${year}`;
    }

    handleCommentChange = (event) => {
        if (event.target.value.length > 0) {
            this.setState({comment: event.target.value,
            sendComment:true});
        }
        else {
            this.setState({comment: event.target.value,
            sendComment:false});
        }
    };

    likePost = () => {
        if (!this.state.isLiked) {
            this.setState({
                isLiked:true,
                likesText: (this.state.numLikes+1) + ' likes',
                numLikes: this.state.numLikes+1
            });
        }
    }

    toggleLike = () => {
        if (!this.state.isLiked) {
            this.setState({
                isLiked:true,
                likesText: (this.state.numLikes+1) + ' likes',
                numLikes: this.state.numLikes+1
            });
        }
        else {
            this.setState({
                isLiked:false,
                likesText: (this.state.numLikes-1) + ' likes',
                numLikes: this.state.numLikes-1
            });

        }
    }

    showNextSlide = () => {
        this.setState({
            currSlide: this.state.currSlide+1,
            showTags: false
        });
    };

    showPreviousSlide = () => {
        this.setState({
            currSlide: this.state.currSlide-1,
            showTags: false
        });
    };

    toggleSave = () => {
        this.setState({isSaved: !this.state.isSaved});
    };

    focusTextInput = () => {
        this.textInput.current.focus();
    };

    postComment = () => {
        this.setState({
        commentsSent: [...this.state.commentsSent, this.state.comment],
        comment: "",
        sendComment: false,
        });
    }

    handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            this.postComment();
        }
    }


    handleKeyDown2 = (event) => {
        if (this.props.isFocused && event.key === 'ArrowRight') {
            if(this.props.postDetails && this.state.currSlide < this.props.postDetails.posts.length-1) {
                this.showNextSlide();
            }
        }
        else if(this.props.isFocused && event.key=== 'ArrowLeft') {
            if(this.state.currSlide>0) {
                this.showPreviousSlide();
            }
        }
        }

    handleClick = () => {
        this.props.onFocus(this.props.id);
    }
    
    toggleTags = () => {
        this.setState({showTags: !this.state.showTags});
    }


    render() {
        const commentsByUser = [];
        for (let i = this.state.commentsSent.length-1; i > -1; i--) {
                commentsByUser.push(<Comment username={'rishavry7'} time={'15s'} comment={this.state.commentsSent[i]}
                numLikes={13} isCaption={false} language={this.props.language} isOwn={true}/>);
                commentsByUser.push(<br/>);
        }
        let currPost = "";
        if (this.props.postDetails !== null) {
                currPost = 'data:image/jpeg;base64,' + this.props.postDetails.posts[this.state.currSlide];
        }

        let shownTags = [];
        if (this.props.postDetails!==null && this.state.showTags) {
            for (let i of this.props.postDetails.taggedAccounts[this.state.currSlide]) {
                shownTags.push(
                    <p style={{
                        position: 'absolute',
                        left: i[0].toString() + "%",
                        top: i[1].toString() + "%",
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        textAlign: 'left',
                        borderRadius: '10%',
                        paddingLeft: '0.8em',
                        paddingTop: '0.8em',
                        paddingBottom: '0.8em',
                        paddingRight: '0.8em',
                        cursor: 'pointer',
                        fontSize: '0.94em'
                    }}>
                        {i[2]}
                    </p>
                );
            }
        }

        return (
        <React.Fragment>
        <div style={{background:'white', width:'82em', height:'54em', borderStyle:'solid', borderColor:'lightgray', borderRadius:'0.5%',
        display:'flex'}}>
        <div style={{position:'absolute', top:'0%', left:'0%', width:'65%', height:'100%'}}>
        {currPost!=="" && <img onClick={this.handleClick} onDoubleClick={this.likePost} src={currPost} style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}}/>}
        {this.props.postDetails!==null && <img onClick={this.showNextSlide} src={nextArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'99%', cursor:'pointer',
        display: this.state.currSlide < this.props.postDetails.posts.length-1 ? 'inline-block' : 'none'}}/>}
        <img onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-3%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        {this.props.postDetails!==null &&
        <img onClick={this.toggleTags} src={taggedAccountsIcon} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>}
        {this.props.postDetails!==null && <PostDots numSlides={this.props.postDetails.posts.length} currSlide={this.state.currSlide}/>}
        {this.props.postDetails !== null && this.state.showTags &&
        shownTags
        }
        </div>
        <div style={{display:'flex', flexDirection:'column', position:'absolute', left:'66%', top:'2%', width:'35%', height:'100%'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        {this.props.postDetails!==null && <StoryIcon username={this.props.postDetails.usernames[0]} ownAccount={false} unseenStory={true} isStory={false}/>}
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', gap:'0.2em',
        marginTop:'-1em', marginLeft:'0.5em', textAlign:"left"}}>
        {this.props.postDetails!==null && <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.props.postDetails.usernames[0]}</b></span>}
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.state.locationText}</span>
        </div>
        <img onClick={this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'12em',
        cursor:'pointer'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em'}} />
        <div style={{position:'absolute', top:'15%', left:'2%', height:'33em', overflowY:'scroll', overflowX: 'scroll'}}>
        <Comment username={'rishavry'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={0} isCaption={true} language={this.props.language} isOwn={false}/>
        <br/>
        {commentsByUser}
        <Comment username={'rishavry2'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={70} isCaption={false} replies={["A", "B", "C"]} language={this.props.language} isOwn={false}/>
        <b/>
        <Comment username={'rishavry3'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        <br/>
        <Comment username={'rishavry4'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        <br/>
        <Comment username={'rishavry5'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]} language={this.props.language} isOwn={false}/>
        </div>
        <div style={{position:'absolute', top:'80%', left:'-2%', width:'100%', height:'17%', display:'flex',
        flexDirection:'column', alignItems:'start', paddingLeft:'0.4em'}}>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em', marginTop:'-0.3em'}} />
        <div style={{display:'flex'}}>
        {!this.state.isLiked && <img onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        {this.state.isLiked && <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        <img onClick={this.focusTextInput} src={commentIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        <img onClick={this.props.showSendPostPopup} src={sendIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        {!this.state.isSaved && <img onClick={this.toggleSave} src={saveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        {this.state.isSaved && <img onClick={this.toggleSave} src={blackSaveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        </div>
        <b style={{marginTop:'0.5em', marginLeft:'0.6em'}}>{this.state.likesText}</b>
        <p style={{color:'gray', fontSize:'0.87em', marginLeft:'0.8em'}}>{this.state.timeText}</p>
        <div style={{display:'flex', justifyItems: 'center'}}>
        <textarea  type="text" ref={this.textInput} value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0em', fontSize: '1em',
        marginTop:'0em', width:'19em', marginLeft:'0.6em', borderWidth: '0px 0px 0px 0px', outline:'none', color:'black', resize: 'none', fontFamily:'Arial'}}
        placeholder={this.state.addCommentText} onKeyDown={this.handleKeyDown}/>
        {this.state.sendComment && <span onClick={this.postComment} style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer',
        fontSize:'1.1em', marginLeft:'1.7em'}}>{this.state.postText}</span>}
        </div>
        </div>
        </div>
        </div>
        <img onClick={this.props.hideCommentsPopup} src={closePopupIcon} style={{height:'2em', width:'2em', position:'absolute', left:'110%', top:'2%', cursor:'pointer'}}/>
        </React.Fragment>);
    };
}

export default CommentsPopup;