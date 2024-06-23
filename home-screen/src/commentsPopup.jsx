import React, { Component } from 'react';
import Comment from './comment';
import backArrow from './images/backArrow.png';
import blackSaveIcon from './images/blackSaveIcon.png';
import blankHeart from './images/blankHeartIcon.png';
import commentIcon from './images/commentIcon.png';
import imagePost from './images/imagePost.jpg';
import nextArrow from './images/nextArrow.png';
import redHeart from './images/redHeartIcon.png';
import saveIcon from './images/saveIcon.png';
import sendIcon from './images/sendIcon.png';
import taggedAccountsIcon from './images/taggedAccountsIcon.png';
import threeHorizontalDots from './images/threeHorizontalDots.png';
import PostDots from './postDots';
import StoryIcon from './storyIcon';
import closePopupIcon from './images/closePopupIcon.png';
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
            commentsSent: []
        };
        this.textInput = React.createRef();
    };

    componentDidUpdate(prevProps) {
        if (prevProps.isLiked !== this.props.isLiked || prevProps.numLikes !== this.props.numLikes
            || prevProps.currSlide !== this.props.currSlide || prevProps.isSaved !== this.props.isSaved) {
            this.setState({
                isLiked: this.props.isLiked,
                numLikes: this.props.numLikes,
                currSlide: this.props.currSlide,
                isSaved: this.props.isSaved
            });
        }
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
                numLikes: this.state.numLikes+1
            });
        }
    }

    toggleLike = () => {
        if (!this.state.isLiked) {
            this.setState({
                isLiked:true,
                numLikes: this.state.numLikes+1
            });
        }
        else {
            this.setState({
                isLiked:false,
                numLikes: this.state.numLikes-1
            });

        }
    }

    showNextSlide = () => {
        this.setState({currSlide: this.state.currSlide+1});
    };

    showPreviousSlide = () => {
        this.setState({currSlide: this.state.currSlide-1});
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

    render() {
        const commentsByUser = [];
        for (let i = this.state.commentsSent.length-1; i > -1; i--) {
                commentsByUser.push(<Comment username={'rishavry3'} time={'15s'} comment={this.state.commentsSent[i]}
                numLikes={13} isCaption={false}/>);
                commentsByUser.push(<br/>);
        }
        return (
        <React.Fragment>
        <div style={{background:'white', width:'82em', height:'54em', borderStyle:'solid', borderColor:'lightgray', borderRadius:'0.5%',
        display:'flex'}}>
        <div style={{position:'absolute', top:'0%', left:'0%', width:'65%', height:'100%'}}>
        <img onDoubleClick={this.likePost} src={imagePost} style={{objectFit:'cover',  width: '100%', height: '100%', position: 'absolute', top: 0,
        left: 0,}}/>
        <img onClick={this.showNextSlide} src={nextArrow} style={{objectFit:'contain', width:'2em', height:'2em', position:'absolute', top:'45%', left:'99%', cursor:'pointer',
        display: this.state.currSlide < this.props.numSlides-1 ? 'inline-block' : 'none'}}/>
        <img onClick={this.showPreviousSlide} src={backArrow} style={{objectFit:'contain', width:'1.4em', height:'1.4em', position:'absolute', top:'45%', left:'-3%', cursor:'pointer',
        display: this.state.currSlide > 0 ? 'inline-block' : 'none'}}/>
        <img src={taggedAccountsIcon} style={{objectFit:'contain', width:'2.7em', height:'2.7em', position:'absolute', top:'92%', left:'3%', cursor:'pointer'}}/>
        <PostDots numSlides={this.props.numSlides} currSlide={this.state.currSlide}/>
        </div>
        <div style={{display:'flex', flexDirection:'column', position:'absolute', left:'66%', top:'2%', width:'35%', height:'100%'}}>
        <div style={{display:'flex', justifyContent:'start'}}>
        <StoryIcon unseenStory={true}/>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'start', gap:'0.2em',
        marginTop:'-1em', marginLeft:'0.5em'}}>
        <span style={{fontSize:'1.1em', cursor:'pointer'}}><b>{this.props.username}</b></span>
        <span style={{fontSize:'0.9em', cursor:'pointer'}}>{this.props.location}</span>
        </div>
        <img onClick={this.props.togglePopup} src={threeHorizontalDots} style={{height:'4em', width:'4em', objectFit:'contain', marginLeft:'12em',
        cursor:'pointer'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em'}} />
        <div style={{position:'absolute', top:'15%', left:'2%', height:'33em', overflowY:'scroll', overflowX: 'scroll'}}>
        <Comment username={'rishavry1'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={0} isCaption={true}/>
        <br/>
        {commentsByUser}
        <Comment username={'rishavry2'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={70} isCaption={false} replies={["A", "B", "C"]}/>
        <br/>
        <Comment username={'rishavry3'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]}/>
        <br/>
        <Comment username={'rishavry4'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]}/>
        <br/>
        <Comment username={'rishavry5'} time={'10m'} comment={'What a time to be alive, init? Makes you very greatfulsaldmsaldmsakldmsad'}
        numLikes={7} isCaption={false} replies={[]}/>
        </div>
        <div style={{position:'absolute', top:'80%', left:'-2%', width:'100%', height:'17%', display:'flex',
        flexDirection:'column', alignItems:'start', paddingLeft:'0.4em'}}>
        <hr style={{width: '100%', borderTop: '1px solid lightgray', marginLeft:'-0.90em', marginTop:'-0.3em'}} />
        <div style={{display:'flex'}}>
        {!this.state.isLiked && <img onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        {this.state.isLiked && <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>}
        <img onClick={this.focusTextInput} src={commentIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        <img src={sendIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', cursor:'pointer'}}/>
        {!this.state.isSaved && <img onClick={this.toggleSave} src={saveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        {this.state.isSaved && <img onClick={this.toggleSave} src={blackSaveIcon} style={{objectFit:'contain', height:'2.4em', width:'2.4em', marginLeft:'18em', cursor:'pointer'}}/>}
        </div>
        <b style={{marginTop:'0.5em', marginLeft:'0.6em'}}>{this.state.numLikes} likes</b>
        <p style={{color:'gray', fontSize:'0.87em', marginLeft:'0.8em'}}>{this.props.time}</p>
        <div style={{display:'flex', justifyItems: 'center'}}>
        <textarea  type="text" ref={this.textInput} value={this.state.comment} onChange={this.handleCommentChange} style={{padding: '0em', fontSize: '1em',
        marginTop:'0em', width:'19em', marginLeft:'0.6em', borderWidth: '0px 0px 0px 0px', outline:'none', color:'black', resize: 'none', fontFamily:'Arial'}}
        placeholder={"Add a comment..."} onKeyDown={this.handleKeyDown}/>
        {this.state.sendComment && <span onClick={this.postComment} style={{color:'#387deb', fontWeight:'bold', cursor: 'pointer',
        fontSize:'1.1em', marginLeft:'1.7em'}}>Post</span>}
        </div>
        </div>
        </div>
        </div>
        <img onClick={this.props.hideCommentsPopup} src={closePopupIcon} style={{height:'2em', width:'2em', position:'absolute', left:'110%', top:'2%', cursor:'pointer'}}/>
        </React.Fragment>);
    };
}

export default CommentsPopup;