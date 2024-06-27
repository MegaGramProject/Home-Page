import React, { Component } from 'react';
import moreIcon from './images/moreIcon.png';
import bluePlusIcon from "./images/bluePlusIcon.png";
import './styles.css';

class StoryIcon extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            profilePhotoLoading: true,
            profilePhoto: null
        };
    };

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



    render() {
        return (
        <React.Fragment>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
            <div style={{background: this.props.unseenStory ? 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' : 'lightgray', borderRadius:'100%', height:'4.6em',
            width:'4.6em', position:'relative'}}>
            <div style={{background: 'white', borderRadius:'100%', height:'4.2em', width:'4.2em', position:'absolute', left:'5%', top:'5%'}}>
            {!(this.state.profilePhotoLoading || this.state.error) &&
            (<img src={this.state.profilePhoto} style={{height:'3.75em', width:'3.75em', objectFit:'contain', position:'absolute', left:'4%', top:'5%', cursor:'pointer'}}/>)}
            {(this.state.profilePhotoLoading || this.state.error) &&
            (<img src={moreIcon} style={{height:'3.75em', width:'3.75em', objectFit:'contain', position:'absolute', left:'4%', top:'5%', cursor:'pointer'}}/>)}
            <img src={bluePlusIcon} style={{display: this.props.ownAccount ? 'inline-block' : 'none', height:'1.75em', width:'1.75em', objectFit:'contain', position:'absolute', left:'65%', top:'65%', cursor:'pointer'}}/>
            </div>
            </div>
            {this.props.isStory && (<p style={{textAlign:'center', fontSize:'0.8em', marginTop:'0.2em'}}>{this.props.username}</p>)}
            </div>
        </React.Fragment>);
    };
}

export default StoryIcon;