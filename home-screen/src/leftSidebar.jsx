import React, { Component } from 'react';
import aiIcon from './images/aiIcon.png';
import createIcon from './images/createIcon.png';
import exploreIcon from './images/exploreIcon.png';
import gamesIcon from './images/gamesIcon.jpg';
import homeIcon from './images/homeIcon.png';
import listenIcon from './images/listenIcon.png';
import messagesIcon from './images/messagesIcon.png';
import moreIcon from './images/moreIcon.png';
import newsIcon from './images/newsIcon.jpg';
import notifsIcon from './images/notificationsIcon.png';
import predictIcon from './images/predictIcon.png';
import profileIcon from './images/profileIcon.png';
import reelsIcon from './images/reelsIcon.png';
import searchIcon from './images/searchIcon.png';
import shopIcon from './images/shopIcon.jpg';
import timeCapsuleIcon from './images/timeCapsuleIcon.jpg';
import LeftSidebarPopup from './leftSidebarPopup';
import './styles.css';

class LeftSidebar extends Component {
    constructor(props) {
        super(props);
    };



    render() {
        return (
        <React.Fragment>
        <div style={{width:'14em', height:'63em', borderStyle:'solid', borderColor:'lightgray', borderWidth: '0.01em', position: 'relative'}}>
            <h1 className="headerMegagram" style={{fontFamily:'Billabong', fontSize:'1.9em', marginLeft:'0.5em', marginTop:'1em', fontWeight: '100'}}><span style={{cursor:"pointer"}}>Megagram</span></h1>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={homeIcon} style={{height:'2.3em', width:'2.3em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontWeight:'bold', fontSize:'1em', marginLeft:'0.4em'}}>Home</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={searchIcon} style={{height:'1.8em', width:'2.3em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Search</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={exploreIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Explore</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={reelsIcon} style={{height:'2.4em', width:'2.4em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Reels</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={messagesIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Messages</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={notifsIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Notifications</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={createIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Create</p>
            </div>
            <div className="sidebarElement"  style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={profileIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Profile</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={shopIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Shop</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={newsIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Weather/News</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={gamesIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Games</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={aiIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>AI Chat</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={timeCapsuleIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Time Capsule</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={predictIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/> 
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Predict</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={listenIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Listen</p>
            </div>
            <div onClick={this.props.changePopup} className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', marginTop:'7em'}}>
            <img src={moreIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>More</p>
        </div>
        {this.props.showPopup && (
        <div style={{position: 'absolute', bottom: '5em'}}>
            <LeftSidebarPopup />
        </div>
        )}
        </div>

        </React.Fragment>);
    };
}

export default LeftSidebar;