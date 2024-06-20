import React, { Component } from 'react';
import reportAProblemIcon from './images/reportAProblemIcon.png';
import savedIcon from './images/savedIcon.png';
import settingsIcon from './images/settingsIcon.png';
import yourActivityIcon from './images/yourActivityIcon.png';
import './styles.css';

class LeftSidebarPopup extends Component {
    constructor(props) {
        super(props);
    };


    render() {
        return (
        <React.Fragment>
        <div className="popup" style={{width: '15em', height:'20em', backgroundColor:'white', borderRadius:'0.4em', paddingTop: '1em'}}>
            <div class="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={settingsIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Settings</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={yourActivityIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Your activity</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={savedIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Saved</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <img src={reportAProblemIcon} style={{height:'2em', width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Report a problem</p>
            </div>
            <div style={{width:'15em', height:'0.9em', backgroundColor:'#f7f7f7'}}></div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Switch accounts</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', width:'14em'}}>
            <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Log out</p>
            </div>

        </div>
        
        </React.Fragment>);
    };
}

export default LeftSidebarPopup;