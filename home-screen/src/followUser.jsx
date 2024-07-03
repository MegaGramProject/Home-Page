import React, { Component } from 'react';
import profileIcon from './images/profileIcon.png';
import moreIcon from './images/moreIcon.png';
import solidWhiteDot from './images/solidWhiteDot.png';
import checkedIcon from './images/checkedIcon.png';
import './styles.css';

class FollowUser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isHovering: false,
            error: null,
            profilePhoto: null,
            profilePhotoLoading: true,
            isFollowing: true,
        }
    };

    handleMouseEnter = () => {
        this.setState({isHovering: true})
    }

    handleMouseLeave = () => {
        this.setState({isHovering: false})
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
        this.fetchProfilePhoto(this.props.username);
    }

    async componentDidUpdate(prevProps, prevState) {
        if(prevState.isFollowing != this.props.isFollowing) {
            this.setState({isFollowing: this.props.isFollowing});
        }
    }

    toggleFollow = () => {
        this.setState({isFollowing: !this.state.isFollowing});
    }


    render() {
        return (
        <React.Fragment>
        <div className="popup" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} style={{cursor:'pointer', width:'95%', display:'flex', alignItems:'center',
        backgroundColor: this.state.isHovering ? '#ebedeb' : 'white', justifyContent:'space-between', boxShadow:'none'}}>
        <div style={{display:'flex', alignItems:'start'}}>
        {!(this.state.profilePhotoLoading || this.state.error) &&
        <img src={this.state.profilePhoto} style={{objectFit:'contain', height:'3em', width:'3em'}}/>}
        {(this.state.profilePhotoLoading || this.state.error) &&
        <img src={this.state.moreIcon} style={{objectFit:'contain', height:'3em', width:'3em'}}/>}
        <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <p>{this.props.username}</p>
        <br/>
        </div>
        </div>
        {this.state.isFollowing && !this.props.isOwn &&
        <button onClick={this.toggleFollow} style={{backgroundColor:'#f5f5f5', color:'black', fontWeight:'bold', cursor:'pointer',
        borderStyle:'none', width:'10em', borderRadius:'0.5em', paddingLeft:'0.5em', paddingBottom:'0.5em', paddingTop:'0.5em'}}>Following</button>}
        {!this.state.isFollowing && !this.props.isOwn &&
        <button onClick={this.toggleFollow} style={{backgroundColor:'#1f86ed', fontWeight:'bold', color:'white', cursor:'pointer',
        borderStyle:'none', width:'8em', borderRadius:'0.5em', paddingLeft:'0.5em', paddingBottom:'0.5em', paddingTop:'0.5em'}}>Follow</button>}
        </div>
        </React.Fragment>);
    };
}

export default FollowUser;