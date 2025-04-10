
import homeIcon from '../assets/images/homeIcon.png';
import messagesIcon from '../assets/images/messagesIcon.png';
import moreIcon from '../assets/images/moreIcon.png';
import notificationsIcon from '../assets/images/notificationsIcon.png';
import searchIcon from '../assets/images/searchIcon.png';
import shopIcon from '../assets/images/shopIcon.png';
import aiIcon from '../assets/images/aiIcon.png';


function LeftSidebar({profilePhoto, displayPopup, authUserIsAnonymousGuest, toggleDisplayPopup}) {

    
    return (
        <div id="leftSidebar" style={{position: 'fixed', height: '100%', top: '0%', left: '0%', width: '14.5em'}}>
            <div style={{width:'100%', height:'100%', borderStyle:'solid',
            borderColor:'lightgray',  borderWidth: '0em 0.01em 0em 0em', position: 'relative',
            paddingTop: '1.5em'}}>
                <h1 className="headerMegagram" style={{fontFamily:'Billabong', fontSize:'1.9em', marginLeft:'-3em',
                fontWeight: '100'}}>
                    <span style={{cursor:"pointer"}}>Megagram</span>
                </h1>

                <div className="sidebarElement">
                    <img src={homeIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2.3em', width:'2.3em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <b style={{fontSize:'1em', marginLeft:'0.4em'}}>Home</b>
                </div>

                <a href="http://34.111.89.101/search" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img src={searchIcon} className="iconToBeAdjustedForDarkMode" style={{height:'1.8em', width:'2.3em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Search</p>
                </a>

                <a href="http://34.111.89.101/messages" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img src={messagesIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2.5em', width:'2.5em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Messages</p>
                </a>

                <a href="http://34.111.89.101/notifications" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img src={notificationsIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2.5em', width:'2.5em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Notifications</p>
                </a>

                <a href="http://34.111.89.101/ai-chat" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img src={aiIcon} className="iconToBeAdjustedForDarkMode" style={{height:'1.9em', width:'1.9em',
                    pointerEvents:'none', objectFit:'contain', marginLeft: '0.2em'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.7em'}}>AI Chat</p>
                </a>

                {!authUserIsAnonymousGuest &&
                    (
                        <a href="http://34.111.89.101/profile" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                            <img src={profilePhoto} style={{height:'2.2em', width:'2.2em', pointerEvents:'none',
                            objectFit:'contain'}}/>
                            <p style={{fontSize:'1em', marginLeft:'0.8em'}}>Profile</p>
                        </a>
                    )
                }

                <a href="http://34.111.89.101/shop" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img src={shopIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Shop</p>
                </a>

                <div onClick={toggleDisplayPopup} className="sidebarElement" style={{position: 'absolute', bottom: '4%',
                left: '0%'}}>
                    <img src={moreIcon} className="iconToBeAdjustedForDarkMode" style={{height:'1.8em', width:'1.8em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em', fontWeight: displayPopup ? 'bold' : 'normal'}}>
                        More
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LeftSidebar;