import reportAProblemIcon from '../assets/images/reportAProblemIcon.png';
import blankSavedIcon from '../assets/images/blankSavedIcon.png';
import settingsIcon from '../assets/images/settingsIcon.png';
import yourActivityIcon from '../assets/images/yourActivityIcon.png';

function LeftSidebarPopup({authUser, notifyParentToShowErrorPopup}) {

    async function logout() {
        if (authUser==='Anonymous Guest') {
            notifyParentToShowErrorPopup('You cannot log out since you are not currently logged in.');
            return;
        }
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/logout/${authUser}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if(!response.ok) {
                notifyParentToShowErrorPopup('The server had trouble logging you out');
            }
            else {
                window.location.href = 'http://34.111.89.101/';
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup('There was trouble connecting to the server to log you out.');
        }
    }
    
    return (
        <>
            <div className="popup" style={{width: '15em', height:'20em', borderRadius:'0.4em', paddingTop: '1em'}}>
                <a href='http://34.111.89.101/settings' className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img className="iconToBeAdjustedForDarkMode" src={settingsIcon} style={{height:'2em', width:'2em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Settings</p>
                </a>

                <div className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={yourActivityIcon} style={{height:'2em',
                    width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Your activity</p>
                </div>

                <a href='http://34.111.89.101/saved' className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <img className="iconToBeAdjustedForDarkMode" src={blankSavedIcon} style={{height:'2em', width:'2em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Saved</p>
                </a>

                <div className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={reportAProblemIcon} style={{height:'2em',
                    width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Report a problem</p>
                </div>

                <div id="leftSideBarPopupGap" style={{width:'100%', height:'0.9em', backgroundColor:'#f7f7f7'}}></div>
                
                <a href='http://34.111.89.101/login' className="sidebarElement" target="_blank" rel="noopener noreferrer">
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Switch accounts</p>
                </a>

                <div onClick={logout} className="sidebarElement">
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Log out</p>
                </div>

            </div>
        </>
    );
}

export default LeftSidebarPopup;