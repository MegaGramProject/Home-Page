
import homeIcon from '../assets/images/homeIcon.png';
import messagesIcon from '../assets/images/messagesIcon.png';
import moreIcon from '../assets/images/moreIcon.png';
import notificationsIcon from '../assets/images/notificationsIcon.png';
import searchIcon from '../assets/images/searchIcon.png';
import shopIcon from '../assets/images/shopIcon.png';

function LeftSidebar({profilePhoto, displayPopup, toggleDisplayPopup}) {
    function takeUserToSearch() {
        window.location.href = 'http://34.111.89.101/search';
    }

    function takeUserToMessages() {
        window.location.href = 'http://34.111.89.101/messages';
    }

    function takeUserToNotifications() {
        window.location.href = 'http://34.111.89.101/notifications';
    }

    function takeUserToProfile() {
        window.location.href = 'http://34.111.89.101/profile';
    }

    function takeUserToShop() {
        window.location.href = 'http://34.111.89.101/shop';
    }
    
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
                    <img className="iconToBeAdjustedForDarkMode" src={homeIcon} style={{height:'2.3em', width:'2.3em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <b style={{fontSize:'1em', marginLeft:'0.4em'}}>Home</b>
                </div>

                <div onClick={takeUserToSearch} className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={searchIcon} style={{height:'1.8em', width:'2.3em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Search</p>
                </div>

                <div onClick={takeUserToMessages} className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode"  src={messagesIcon} style={{height:'2.5em', width:'2.5em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Messages</p>
                </div>

                <div onClick={takeUserToNotifications} className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={notificationsIcon} style={{height:'2.5em', width:'2.5em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Notifications</p>
                </div>


                <div onClick={takeUserToProfile} className="sidebarElement">
                    <img src={profilePhoto} style={{height:'2.2em', width:'2.2em', pointerEvents:'none',
                    objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.8em'}}>Profile</p>
                </div>

                <div onClick={takeUserToShop} className="sidebarElement">
                    <img src={shopIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'1em', marginLeft:'0.4em'}}>Shop</p>
                </div>

                <div onClick={toggleDisplayPopup} className="sidebarElement" style={{position: 'absolute', bottom: '4%',
                left: '3%'}}>
                    <img className="iconToBeAdjustedForDarkMode" src={moreIcon} style={{height:'1.8em', width:'1.8em',
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