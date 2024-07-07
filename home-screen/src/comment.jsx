import React, { Component } from 'react';
import blankHeart from './images/blankHeartIcon.png';
import moreIcon from './images/moreIcon.png';
import redHeart from './images/redHeartIcon.png';
import verifiedAccount from './images/verifiedAccount.png';
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
            likesText: this.props.numLikes==1 ? "1 like" : this.props.numLikes + " likes",
            viewRepliesText: "View replies",
            hideRepliesText: "Hide replies",
            editText: "Edit",
            deleteText: "Delete",
            error: null,
            profilePhoto: null,
            profilePhotoLoading: true,
            editMode: false,
            commentText: this.props.comment,
            showSave: true,
            commentText2: "",
            isEdited: this.props.isEdited,
            isVerified: false,
            editedText: "Edited",
            saveText: "Save"
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

    async updateEditedText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.editedText,
                currLang,
                this.props.language
            );
            this.setState({editedText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSaveText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.saveText,
                currLang,
                this.props.language
            );
            this.setState({saveText: translatedText });
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

    checkIfLiked = async () => {
        const data = `
        query {
            commentLikes(where: {username: {eq: "${this.props.username}" }, commentid : {eq: "${this.props.id}" }} ) {
                commentid
            }
        }
        `;
        const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: data })
        };

        try {
            const response = await fetch('http://localhost:5022/graphql', options);
            if (!response.ok) {
                let responseData2 = await response.json();
                throw new Error("Error liking comment");
            }
            const responseData = await response.json();
            this.setState({
                isLiked: responseData['data']['commentLikes'].length==0 ? false : true
            });
            }
        catch (error) {
            console.error(error);
        }
    }

    async componentDidMount() {
        this.setState({
            viewRepliesText: "View replies (" + this.state.replies.length + ")",
            hideRepliesText: "Hide replies (" + this.state.replies.length + ")",
        });
        this.fetchProfilePhoto(this.props.username);
        this.checkIfUserVerified(this.props.username);
        this.checkIfLiked();
        await this.updateReplyText("English");
        await this.updateTimeText("English");
        await this.updateLikesText("English");
        await this.updateViewRepliesText("English");
        await this.updateHideRepliesText("English");
        await this.updateDeleteText("English");
        await this.updateEditText("English");
        await this.updateEditedText("English");
        await this.updateSaveText("English");
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
            await this.updateEditedText(prevProps.language);
            await this.updateSaveText(prevProps.language);
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
        if(prevState.replies.length!==this.state.replies.length) {
            this.setState({
                viewRepliesText: "View replies (" + this.state.replies.length + ")",
                hideRepliesText: "Hide replies (" + this.state.replies.length + ")",
            });
        }
        
    }
    

    toggleLike = async () => {
        if (this.state.isLiked) {
            const data = `
            mutation {
                removeCommentLike(commentid: "${this.props.id}", username: "${this.props.username}") {
                }
            }
            `;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: data })
                };
    
            try {
                const response = await fetch('http://localhost:5022/graphql', options);
                if (!response.ok) {
                    throw new Error("Error liking comment");
                }
                const responseData = await response.json();
                this.setState({isLiked: false,
                likesText: this.state.numLikes==2 ? '1 like' : (this.state.numLikes-1) + ' likes',
                numLikes: this.state.numLikes-1});
            }
            catch (error) {
                console.error(error);
            }
        }
        else {
            this.likeComment();
        }
    }

    likeComment =  async () => {
        if (!this.state.isLiked) {
            const data = `
            mutation {
                addCommentLike(commentid: "${this.props.id}", username: "${this.props.username}", postid: "${this.props.postid}") {
                    commentid
                }
            }
            `;

            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: data })
            };

            try {
            const response = await fetch('http://localhost:5022/graphql', options);
            if (!response.ok) {
                throw new Error("Error liking comment");
            }
            const responseData = await response.json();
            this.setState({isLiked: true,
                likesText: this.state.numLikes==0 ? '1 like' : (this.state.numLikes+1) + ' likes',
                numLikes: this.state.numLikes+1,
                });
            }
            catch (error) {
            console.error(error);
            }
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

    turnOnEditMode = () => {
        this.setState({
            editMode: true,
            commentText2: this.state.commentText
        });
    }

    saveEditedComment = async () => {
        let date = new Date();
        if(!this.state.isEdited) {
            if(this.state.commentText2!== this.state.commentText) {
                try {
                    const data = `
                    mutation {
                        editComment(commentid: "${this.props.id}", datetime: "${date.toISOString()}", comment: "${this.state.commentText2}") {
                        commentid
                        }
                    }`;
                    const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: data })
                    };
                    const response = await fetch('http://localhost:5022/graphql', options);
                    if (!response.ok) {
                        throw new Error("Error editing comment");
                    }
                    const responseData = await response.json();
                    this.setState({
                        isEdited: true,
                        editMode: false,
                        commentText: this.state.commentText2,
                        commentText2: "",
                    });
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                this.setState({
                    editMode: false,
                    commentText2: "",
                });
            }
        }
        else {
            if (this.state.commentText2!==this.state.commentText){
                try {
                    const data = `
                    mutation {
                        editComment(commentid: "${this.props.id}", datetime: "${date.toISOString()}", comment: "${this.state.commentText2}") {
                        commentid
                        }
                    }`;
                    const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: data })
                    };
                    const response = await fetch('http://localhost:5022/graphql', options);
                    if (!response.ok) {
                        throw new Error("Error editing comment");
                    }
                    const responseData = await response.json();
                    this.setState({
                        editMode: false,
                        commentText: this.state.commentText2,
                        commentText2: "",
                    });
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                this.setState({
                    editMode: false,
                    commentText2: "",
                });
            }
        }
    }

    saveEditedReply = async () => {
        let date = new Date();
        if(!this.state.isEdited) {
            if(this.state.commentText2!== this.state.commentText) {
                try {
                    const data = `
                    mutation {
                        editReply(replyid: "${this.props.id}", datetime: "${date.toISOString()}", comment: "${this.state.commentText2}") {
                        commentid
                        }
                    }`;
                    const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: data })
                    };
                    const response = await fetch('http://localhost:5022/graphql', options);
                    if (!response.ok) {
                        throw new Error("Error editing reply");
                    }
                    const responseData = await response.json();
                    this.setState({
                        isEdited: true,
                        editMode: false,
                        commentText: this.state.commentText2,
                        commentText2: "",
                    });
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                this.setState({
                    editMode: false,
                    commentText2: "",
                });
            }
        }
        else {
            if (this.state.commentText2!==this.state.commentText){
                try {
                    const data = `
                    mutation {
                        editReply(replyid: "${this.props.id}", datetime: "${date.toISOString()}", comment: "${this.state.commentText2}") {
                        commentid
                        }
                    }`;
                    const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: data })
                    };
                    const response = await fetch('http://localhost:5022/graphql', options);
                    if (!response.ok) {
                        throw new Error("Error editing reply");
                    }
                    const responseData = await response.json();
                    this.setState({
                        editMode: false,
                        commentText: this.state.commentText2,
                        commentText2: "",
                    });
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                this.setState({
                    editMode: false,
                    commentText2: "",
                });
            }
        }
    }


    handleCommentChange = (event) => {
        if (event.target.value.length > 0) {
            this.setState({
                commentText2: event.target.value,
                showSave: true
            });
        }
        else {
            this.setState({
                commentText2: event.target.value,
                showSave: false
            });
        }
    };


    deleteReply = async (replyId) => {
        try {
            const data = `
            mutation {
                removeReply (
                replyid: "${replyId}"
                ) {
                }
            }`;
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: data })
            };
            const response = await fetch('http://localhost:5022/graphql', options);
            if (!response.ok) {
                throw new Error("Error deleting reply");
            }
            const responseData = await response.json();
            this.setState({
                replies: this.state.replies.filter(x=>x['replyid']!==replyId),
            });
        }
        catch (error) {
            console.error(error);
        }
    }

    checkIfUserVerified = async (username) => {
        try {
            const response = await fetch('http://localhost:5022/isUserVerified/'+username);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const output = await response.json();
            this.setState({isVerified: output['isVerified']});
        }
        catch (error) {
            console.error(error);
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

    formatText(string) {
        const words = string.split(' ');
    
        const formattedWords = words.map((word, index) => {
            if (word.startsWith('#') || word.startsWith('@')) {
                return <span key={index} style={{color: '#457aa3', cursor:'pointer'}}>{word}</span>;
            }
            return word;
        });
    
        const formattedText = formattedWords.reduce((acc, word, index) => {
            if (index === 0) {
                return [word];
            }
            return [...acc, ' ', word];
        }, []);
    
        return <p style={{textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word', marginTop:'0.4em', width:'21em'}}>{formattedText}</p>;
    }


    render() {
        const repliesToComment = [];
        if (this.state.showReplies) {
            let currReply;
            let currReplyId;
            let currReplyLikes;
            let currReplyReplies;
            let currReplyIsEdited;
            for (let i = this.state.replies.length-1; i > -1; i--) {
                currReply = this.state.replies[i];
                currReplyId = currReply['replyid'];
                currReplyLikes = this.props.allPostCommentLikes.filter(x => x['commentid']===currReplyId)
                currReplyReplies = this.props.allPostReplies.filter(x=>x['commentid']===currReplyId);
                currReplyIsEdited = currReply['isedited'];
                if(currReply['username']===this.props.username) {
                    repliesToComment.push(<Comment key={currReplyId} username={currReply['username']} id={currReplyId} postid={this.props.postid} time={this.formatDate(currReply['datetime'])} comment={currReply['comment']}
                    numLikes={currReplyLikes.length} replies={currReplyReplies} isCaption={false} language={this.props.language} isOwn={true} toggleReply={this.props.toggleReply} deleteComment={this.deleteReply}
                    isReply={true} isEdited={currReplyIsEdited} allPostCommentLikes={this.props.allPostCommentLikes} allPostReplies={this.props.allPostReplies}/>);
                    repliesToComment.push(<br/>);
                }
                else {
                    repliesToComment.push(<Comment key={currReplyId} username={currReply['username']} id={currReplyId} postid={this.props.postid} time={this.formatDate(currReply['datetime'])} comment={currReply['comment']}
                    numLikes={currReplyLikes.length} replies={currReplyReplies} isCaption={false} language={this.props.language} isOwn={false} toggleReply={this.props.toggleReply} isReply={true} isEdited={currReplyIsEdited}
                    allPostCommentLikes={this.props.allPostCommentLikes} allPostReplies={this.props.allPostReplies}/>);
                    repliesToComment.push(<br/>);
                }
            }
        }

        return (
        <React.Fragment>
        <div style={{display:'flex', alignItems:'start', justifyContent:'center'}}>
        {!(this.state.profilePhotoLoading || this.state.error) && (  <img src={this.state.profilePhoto} style={{height:'2.5em', width:'2.5em', objectFit:'contain', cursor:'pointer'}}/>)}
        {(this.state.profilePhotoLoading || this.state.error) && (  <img src={moreIcon} style={{height:'2.5em', width:'2.5em', objectFit:'contain', cursor:'pointer'}}/>)}
        <div onDoubleClick={this.likeComment} style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <div style={{display:'flex', alignItems:'center'}}>
        <b>{this.props.username}</b>
        {this.state.isVerified && <img src={verifiedAccount} style={{height:'1.5em', width:'1.5em', objectFit:'contain', paddingBottom:'0%', verticalAlign: 'text-bottom'}}/>}
        </div>
        {!this.state.editMode && this.formatText(this.state.commentText)}
        {this.state.editMode &&  <textarea type="text" ref={this.textInput} value={this.state.commentText2} onChange={this.handleCommentChange} style={{paddingTop: '0.3em', fontSize: '1em',
        marginTop:'0em', width:'21em', marginLeft:'0em', borderWidth: '0px 0px 0px 0px', outline:'none', color:'black', fontFamily:'Arial', resize:'true'}}
        placeholder={'Edit comment...'}/>}
        {this.props.isOwn && this.props.isCaption && (
        <p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.isEdited &&  <span style={{marginRight:'1em', color: 'gray', fontSize: '1em'}}>{this.state.editedText}</span>}
        {this.state.timeText}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>Edit</span>
        <span onClick={() => {this.props.deleteComment(this.props.id)}} style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>Delete</span>
        </p>)}
        {this.props.isOwn && !this.props.isCaption && (<p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.isEdited &&  <span style={{marginRight:'1em', color: 'gray', fontSize: '1em'}}>{this.state.editedText}</span>}
        {this.state.timeText}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1.1em', cursor:'pointer'}}>{this.state.likesText}</span>
        {!this.state.editMode && <span onClick={this.turnOnEditMode} style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>{this.state.editText}</span>}
        {this.state.editMode && this.state.showSave && <span onClick={!this.props.isReply ? this.saveEditedComment : this.saveEditedReply} style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>{this.state.saveText}</span>}
        <span onClick={() => {this.props.deleteComment(this.props.id)}} style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1em', cursor:'pointer'}}>{this.state.deleteText}</span>
        <span onClick={()=>{this.props.toggleReply(this.props.id, this.props.comment, this.props.username)}} style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', cursor:'pointer'}}>{this.state.replyText}</span>
        </p>)}
        {!this.props.isOwn && this.props.isCaption && (<p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.isEdited &&  <span style={{marginRight:'1em', color: 'gray', fontSize: '1em'}}>{this.state.editedText}</span>}
        {this.state.timeText}</p>)}
        {!this.props.isOwn && !this.props.isCaption && (<p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>
        {this.state.isEdited &&  <span style={{marginRight:'1em', color: 'gray', fontSize: '1em'}}>{this.state.editedText}</span>}
        {this.state.timeText}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1.1em', cursor:'pointer'}}>{this.state.likesText}</span>
        <span onClick={()=>{this.props.toggleReply(this.props.id, this.props.comment, this.props.username)}} style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', cursor:'pointer'}}>{this.state.replyText}</span>
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
            <img className="iconToBeAdjustedForDarkMode" onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'1em', width:'1em', cursor:'pointer'}}/>)
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