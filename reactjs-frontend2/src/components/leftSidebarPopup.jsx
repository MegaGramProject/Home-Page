import reportAProblemIcon from '../assets/images/reportAProblemIcon.png';
import savedIcon from '../assets/images/saveIcon.png';
import settingsIcon from '../assets/images/settingsIcon.png';
import yourActivityIcon from '../assets/images/yourActivityIcon.png';

function LeftSidebarPopup({username}) {

    async function logout() {
        try {
            const response = await fetch(`http://34.111.89.101/reset-password/api/logout/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if(!response.ok) {
                throw new Error('The server had trouble logging you out');
            }
            const responseData = await response.text();
            if(responseData === "Successfully logged out") {
                window.location.href = 'http://34.111.89.101/login';
            }
            else {
                console.error(responseData);
            }
        }
        catch (error) {
            throw new Error('There was trouble connecting to the server to log you out.')
        }
    }

    function takeUserToLogin() {
        window.location.href = 'http://34.111.89.101/login';
    }

    function takeUserToSavedPosts() {
        window.location.href = 'http://34.111.89.101/saved';
    }

    function takeUserToSettings() {
        window.location.href = 'http://34.111.89.101/settings';
    }


    return (
        <>
            <div className="popup" style={{width: '15em', height:'20em', borderRadius:'0.4em', paddingTop: '1em',
            position: 'fixed', bottom: '10%', left: '1%'}}>
                <div onClick={takeUserToSettings} className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={settingsIcon} style={{height:'2em', width:'2em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Settings</p>
                </div>

                <div className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={yourActivityIcon} style={{height:'2em',
                    width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Your activity</p>
                </div>

                <div onClick={takeUserToSavedPosts} className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={savedIcon} style={{height:'2em', width:'2em',
                    pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Saved</p>
                </div>

                <div className="sidebarElement">
                    <img className="iconToBeAdjustedForDarkMode" src={reportAProblemIcon} style={{height:'2em',
                    width:'2em', pointerEvents:'none', objectFit:'contain'}}/>
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Report a problem</p>
                </div>

                <div id="leftSideBarPopupGap" style={{width:'100%', height:'0.9em', backgroundColor:'#f7f7f7'}}></div>
                
                <div onClick={takeUserToLogin} className="sidebarElement">
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Switch accounts</p>
                </div>

                <div onClick={logout} className="sidebarElement">
                    <p style={{fontSize:'0.89em', marginLeft:'0.4em'}}>Log out</p>
                </div>

            </div>
        </>
    );
}

export default LeftSidebarPopup;