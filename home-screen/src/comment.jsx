import React, { Component } from 'react';
import blankHeart from './images/blankHeartIcon.png';
import profileIcon from './images/profileIcon.png';
import moreIcon from './images/moreIcon.png';
import redHeart from './images/redHeartIcon.png';
import './styles.css';

class Comment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLiked: false,
            numLikes: this.props.numLikes,
            replies: this.props.replies || [],
            showReplies: false,
            replyText: "Reply",
            timeText: this.props.time,
            likesText: this.props.numLikes + " likes",
            viewRepliesText: "View replies",
            hideRepliesText: "Hide replies",
            editText: "Edit",
            deleteText: "Delete",
            error: null,
            profilePhoto: null,
            profilePhotoLoading: true

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

    async updateReplyText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.replyText,
                currLang,
                this.props.language
            );
            this.setState({replyText: translatedText });
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

    async updateViewRepliesText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.viewRepliesText,
                currLang,
                this.props.language
            );
            this.setState({viewRepliesText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateHideRepliesText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.hideRepliesText,
                currLang,
                this.props.language
            );
            this.setState({hideRepliesText: translatedText });
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
            this.setState({editText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateDeleteText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.deleteText,
                currLang,
                this.props.language
            );
            this.setState({deleteText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateReplyText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.replyText,
                currLang,
                this.props.language
            );
            this.setState({replyText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    fetchProfilePhoto(username) {
        fetch(`http://localhost:8003/getProfilePhoto/${username}`)
            .then(response => {
                if (!response.ok) {
                    this.setState({
                        error: true,
                        profilePhotoLoading: false
                    });
                    throw new Error('Network response was not ok');
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                const base64Flag = 'data:image/jpeg;base64,';
                const imageStr = this.arrayBufferToBase64(buffer);
                this.setState({
                    profilePhoto: base64Flag + imageStr,
                    profilePhotoLoading: false
                });
            })
            .catch(error => {
                this.setState({
                    error: true,
                    profilePhotoLoading: false
                });
            });
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    async componentDidMount() {
        this.setState({
            viewRepliesText: "View replies (" + this.state.replies.length + ")",
            hideRepliesText: "Hide replies (" + this.state.replies.length + ")",
        });
        this.fetchProfilePhoto(this.props.username);
        await this.updateReplyText("English");
        await this.updateTimeText("English");
        await this.updateLikesText("English");
        await this.updateViewRepliesText("English");
        await this.updateHideRepliesText("English");
        await this.updateDeleteText("English");
        await this.updateEditText("English");
    }

    async componentDidUpdate(prevProps, prevState) {
        if(prevProps.language !== this.props.language) {
            await this.updateReplyText(prevProps.language);
            await this.updateTimeText(prevProps.language);
            await this.updateLikesText(prevProps.language);
            await this.updateViewRepliesText(prevProps.language);
            await this.updateHideRepliesText(prevProps.language);
            await this.updateDeleteText(prevProps.language);
            await this.updateEditText(prevProps.language);
        }
        else {
            if(prevState.likesText !== this.state.likesText) {
                await this.updateLikesText("English");
            }
            if(prevState.viewRepliesText !== this.state.viewRepliesText) {
                await this.updateViewRepliesText("English");
            }
            if(prevState.hideRepliesText !== this.state.hideRepliesText) {
                await this.updateHideRepliesText("English");
            }
            
        }
        
    }
    

    toggleLike = () => {
        if (this.state.isLiked) {
            this.setState({isLiked: false,
            likesText: (this.state.numLikes-1) + ' likes',
            numLikes: this.state.numLikes-1});
        }
        else {
            this.setState({isLiked: true,
                likesText: (this.state.numLikes+1) + ' likes',
                numLikes: this.state.numLikes+1,
            });
        }
    }

    likeComment = () => {
        if (!this.state.isLiked) {
            this.setState({isLiked: true,
            likesText: (this.state.numLikes+1) + ' likes',
            numLikes: this.state.numLikes+1,
            });
        }
    }

    toggleReplies = () => {
        if (this.state.showReplies) {
            this.setState({showReplies: false});

        }
        else {
            this.setState({showReplies: true});
        }
    }



    render() {
        const repliesToComment = [];
        if (this.state.showReplies) {
            for (let i = this.state.replies.length-1; i > -1; i--) {
                repliesToComment.push(
                <Comment username={'rishavry3'} time={'15s'} comment={this.state.replies[i]}
                numLikes={13} isCaption={false} language={this.props.language} isOwn={false}/>
                );
                repliesToComment.push(<br/>);
            }
        }

        return (
        <React.Fragment>
        <div style={{display:'flex', alignItems:'start', justifyContent:'center'}}>
        {!(this.state.profilePhotoLoading || this.state.error) && (  <img src={this.state.profilePhoto} style={{height:'2.5em', width:'2.5em', objectFit:'contain', cursor:'pointer'}}/>)}
        {(this.state.profilePhotoLoading || this.state.error) && (  <img src={moreIcon} style={{height:'2.5em', width:'2.5em', objectFit:'contain', cursor:'pointer'}}/>)}
        <div onDoubleClick={this.likeComment} style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <b>{this.props.username}</b>
        <p style={{textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word', marginTop:'0.4em', width:'21em'}}>{this.props.comment}</p>
        {this.props.isOwn && this.props.isCaption && (
        <p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.timeText}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>Edit</span>
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>Delete</span>
        </p>)}
        {this.props.isOwn && !this.props.isCaption && (<p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.timeText}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1.1em'}}>{this.state.likesText}</span>
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>{this.state.editText}</span>
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>{this.state.deleteText}</span>
        </p>)}
        {!this.props.isOwn && this.props.isCaption && (<p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.timeText}</p>)}
        {!this.props.isOwn && !this.props.isCaption && (<p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.timeText}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1.1em'}}>{this.state.likesText}</span>
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold'}}>{this.state.replyText}</span>
        </p>)}

        {this.state.replies.length > 0 && !this.state.showReplies && (
        <div onClick={this.toggleReplies} style={{cursor:'pointer'}}>
        <p style={{ color: 'gray', fontSize: '0.88em', marginTop: '0.7em', fontWeight: 'bold' }}>
        <span style={{letterSpacing:'-0.1em', marginRight:'1em'}}>-------</span>{this.state.viewRepliesText}
        </p>
        </div>
        )}
        {this.state.showReplies && (
        <div onClick={this.toggleReplies} style={{cursor:'pointer', position:'relative'}}>
        <p style={{ color: 'gray', fontSize: '0.88em', marginTop: '0.7em', fontWeight: 'bold' }}>
        <span style={{letterSpacing:'-0.1em', marginRight:'1em'}}>-------</span>{this.state.hideRepliesText}
        </p>
        </div>
        )}
        </div>
        {!this.props.isCaption && !this.state.isLiked && (
            <img onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'1em', width:'1em', cursor:'pointer'}}/>)
        }
        {!this.props.isCaption && this.state.isLiked && (
            <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'1em', width:'1em', cursor:'pointer'}}/>)
        }
        </div>
        {this.state.showReplies &&
        <div style={{ marginRight:'-3em'}}>
        {repliesToComment}
        </div>
        }

        </React.Fragment>);
    };
}

export default Comment;