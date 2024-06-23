import React, { Component } from 'react';
import profileIcon from './images/profileIcon.png';
import blankHeart from './images/blankHeartIcon.png';
import redHeart from './images/redHeartIcon.png';
import './styles.css';

class Comment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLiked: false,
            numLikes: this.props.numLikes
        };
    };

    toggleLike = () => {
        if (this.state.isLiked) {
            this.setState({isLiked: false,
            numLikes: this.state.numLikes-1});
        }
        else {
            this.setState({isLiked: true,
                numLikes: this.state.numLikes+1});
        }
    }

    likeComment = () => {
        if (!this.state.isLiked) {
            this.setState({isLiked: true,
            numLikes: this.state.numLikes+1});
        }
    }



    render() {
        return (
        <React.Fragment>
        <div style={{display:'flex', alignItems:'start', justifyContent:'center'}}>
        <img src={profileIcon} style={{height:'2.5em', width:'2.5em', objectFit:'contain', cursor:'pointer'}}/>
        <div onDoubleClick={this.likeComment} style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <b>{this.props.username}</b>
        <p style={{textAlign: 'left', textWrap:'wrap',  wordBreak: 'break-word', marginTop:'0.4em', width:'21em'}}>{this.props.comment}</p>
        {!this.props.isCaption && (
        <p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>{this.props.time}
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold', fontSize: '1.1em'}}>{this.state.numLikes} likes</span>
        <span style={{marginLeft: '1em', color: 'gray', fontWeight: 'bold'}}>
        Reply
        </span>
        </p>)}
        {this.props.isCaption && (
            <p style={{color:'gray', fontSize:'0.77em', marginTop:'-0.4em'}}>{this.props.time}</p>
        )}
        </div>
        {!this.props.isCaption && !this.state.isLiked && (
            <img onClick={this.toggleLike} src={blankHeart} style={{objectFit:'contain', height:'1em', width:'1em', cursor:'pointer'}}/>)
        }
        {!this.props.isCaption && this.state.isLiked && (
            <img onClick={this.toggleLike} src={redHeart} style={{objectFit:'contain', height:'1em', width:'1em', cursor:'pointer'}}/>)
        }
        </div>
        </React.Fragment>);
    };
}

export default Comment;