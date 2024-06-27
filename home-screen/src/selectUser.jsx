import React, { Component } from 'react';
import profileIcon from './images/profileIcon.png';
import moreIcon from './images/moreIcon.png';
import solidWhiteDot from './images/solidWhiteDot.png';
import checkedIcon from './images/checkedIcon.png';
import './styles.css';

class SelectUser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isHovering: false,
            isChecked: false,
            error: null,
            profilePhoto: null,
            profilePhotoLoading: true
        }
    };

    handleMouseEnter = () => {
        this.setState({isHovering: true})
    }

    handleMouseLeave = () => {
        this.setState({isHovering: false})
    }

    toggleCheck = () => {
        if(!this.state.isChecked) {
            this.setState({isChecked: true});
            this.props.addAccount(this.props.username);
        }
        else {
            this.setState({
                isChecked: false
            });
            this.props.removeAccount(this.props.username);
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
        this.fetchProfilePhoto(this.props.username);
    }


    render() {
        return (
        <React.Fragment>
        <div onClick={this.toggleCheck} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} style={{cursor:'pointer', width:'95%', display:'flex', alignItems:'center',
        backgroundColor: this.state.isHovering ? '#ebedeb' : 'white'}}>
        {!(this.state.profilePhotoLoading || this.state.error) &&
        <img src={this.state.profilePhoto} style={{objectFit:'contain', height:'3em', width:'3em'}}/>}
        {(this.state.profilePhotoLoading || this.state.error) &&
        <img src={this.state.moreIcon} style={{objectFit:'contain', height:'3em', width:'3em'}}/>}
        <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <p>{this.props.username}</p>
        <p style={{marginTop:'-0.3em'}}>{this.props.fullName}</p>
        </div>
        {this.state.isChecked && <img src={checkedIcon} style={{objectFit:'contain', height:'2em', width:'2em', marginLeft:'22em'}}/>}
        {!this.state.isChecked && <img src={solidWhiteDot} style={{objectFit:'contain', height:'2em', width:'2em', marginLeft:'22em'}}/>}
        </div>
        </React.Fragment>);
    };
}

export default SelectUser;