import reportAProblemIcon from '../../assets/images/reportAProblemIcon.png';
import blankSavedIcon from '../../assets/images/blankSavedIcon.png';
import settingsIcon from '../../assets/images/settingsIcon.png';
import yourActivityIcon from '../../assets/images/yourActivityIcon.png';


function LeftSidebarPopup({authUserId, originalURL, notifyParentToShowErrorPopup}) {


    async function logout() {
        try {
            const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/logout/${authUserId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if(!response.ok) {
                notifyParentToShowErrorPopup('The expressJSBackend1 server had trouble logging you out');
            }
            else {
                window.location.href = originalURL;
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(
                'There was trouble connecting to the expressJSBackend1 server to log you out.');
        }
    }
    

    return (
        <div className="popup" style={{width: '15em', height: authUserId == -1 ? '16.5em' : '20em', borderRadius:'0.4em',
        paddingTop: '1em'}}>
            <a href='http://34.111.89.101/settings' className="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img src={settingsIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2em', width:'2em',
                pointerEvents:'none', objectFit:'contain'}}/>
                <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Settings</p>
            </a>

            <a href="http://34.111.89.101/your-activity" className="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img src={yourActivityIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2em',
                width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
                <p style="fontSize: 0.89em; marginLeft: 0.4em;">Your activity</p>
            </a>

            <a href='http://34.111.89.101/saved' className="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img src={blankSavedIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2em', width:'2em',
                pointerEvents:'none', objectFit:'contain'}}/>
                <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Saved</p>
            </a>

            <a href="http://34.111.89.101/report-a-problem" class="sidebarElement" target="_blank" rel="noopener noreferrer">
                <img src={reportAProblemIcon} className="iconToBeAdjustedForDarkMode" style={{height:'2em',
                width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
                <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Report a problem</p>
            </a>

            <div id="leftSideBarPopupGap" style={{width:'100%', height:'0.9em', backgroundColor:'#f7f7f7'}}></div>
            
            <a href='http://34.111.89.101/login' className="sidebarElement" target="_blank" rel="noopener noreferrer">
                <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Switch accounts</p>
            </a>

            {authUserId !== -1 &&
                (
                    <div onClick={logout} className="sidebarElement">
                        <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Log out</p>
                    </div>
                )
            }

        </div>
    );
}

export default LeftSidebarPopup;