import React, { Component } from 'react';
import profileIcon from "./images/profileIcon.png";
import bluePlusIcon from "./images/bluePlusIcon.png";
import './styles.css';

class StoryIcon extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };


    render() {
        return (
        <React.Fragment>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
            <div style={{background: this.props.unseenStory ? 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' : 'lightgray', borderRadius:'100%', height:'4.6em',
            width:'4.6em', position:'relative'}}>
            <div style={{background: 'white', borderRadius:'100%', height:'4.2em', width:'4.2em', position:'absolute', left:'5%', top:'5%'}}>
            <img src={profileIcon} style={{height:'3.75em', width:'3.75em', objectFit:'contain', position:'absolute', left:'4%', top:'5%', cursor:'pointer'}}/>
            <img src={bluePlusIcon} style={{display: this.props.ownAccount ? 'inline-block' : 'none', height:'1.75em', width:'1.75em', objectFit:'contain', position:'absolute', left:'65%', top:'65%', cursor:'pointer'}}/>
            </div>
            </div>
            <p style={{textAlign:'center', fontSize:'0.8em', marginTop:'0.2em'}}>{this.props.username}</p>
            </div>
        </React.Fragment>);
    };
}

export default StoryIcon;