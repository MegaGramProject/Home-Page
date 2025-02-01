import { useState } from 'react';

import AccountPreview from './accountPreview';

import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';


function UserBar({username, ownAccount, isPrivate, numFollowers, numFollowing, numPosts, fullName, profilePhoto,
isVerified, authUser, notifyParentToShowErrorPopup}) {
    const [followText, setFollowText] = useState('Follow');
    const [displayAccountPreview, setDisplayAccountPreview] = useState(false);
    function takeUserToLogin() {
        window.location.href = "http://34.111.89.101/login";
    }

    async function toggleFollowUser() {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/djangoBackend2/toggleFollowUser/${authUser}/${username}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if(!response.ok) {
                notifyParentToShowErrorPopup(
                `The server had trouble toggling your follow-status of ${username}`);
            }
            else {
                const newFollowText = await response.text();
                setFollowText(newFollowText);
            }

        }
        catch (error) {
            notifyParentToShowErrorPopup(`There was an error connecting to the server to toggle your follow-status
            of ${username}`);
        }
    }

    function setDisplayAccountPreviewToTrue () {
        setDisplayAccountPreview(true);
    }

    function setDisplayAccountPreviewToFalse () {
        setDisplayAccountPreview(false);
    }

    function takeToUsersProfile() {
        window.location.href = `http://34.111.89.101/profile/${username}`;
    }

    function updateFollowTextFromAccountPreview(newFollowText) {
        setFollowText(newFollowText);
    }

    return (
        <>
            <div style={{display:'flex', width:'20em', alignItems:'start', position:'relative',
            marginBottom: '-1em'}} onMouseEnter={setDisplayAccountPreviewToTrue}
            onMouseLeave={setDisplayAccountPreviewToFalse}>
                <img src={profilePhoto} style={{height:'2.5em', width:'2.5em', objectFit:'contain', 
                cursor:'pointer'}}/>   

                <div style={{display:'flex', flexDirection:'column', alignItems: 'start', marginLeft:'0.7em'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <b onClick={takeToUsersProfile} onMouseEnter={setDisplayAccountPreviewToTrue}
                        onMouseLeave={setDisplayAccountPreviewToFalse}
                        style={{fontSize:'0.85em', cursor:'pointer', maxWidth: '5em', overflowWrap: 'break-word'}}>
                            {username}
                        </b>

                        {isVerified &&
                            (
                                <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em',
                                width: '1.5em', objectFit: 'contain'}}/>
                            )
                        }
                    </div>

                    <p style={{fontSize:'0.7em', marginTop:'0.1em', color:'#787878',
                    maxWidth: '11em', overflowWrap: 'break-word'}}>
                        {fullName==='?' ? 'Could not get full name' : fullName}
                    </p>
                </div>

                <p onClick={ownAccount ? takeUserToLogin : toggleFollowUser}
                style={{color: followText==="Follow" ? '#348feb' : 'gray', cursor:'pointer',
                fontSize:'0.85em', fontWeight:'bold', position:'absolute', left:'76%', top: '0%'}}> 
                    {ownAccount ? 'Switch' : followText}
                </p>
                
                {(!ownAccount && displayAccountPreview) && 
                    <div style={{position:'absolute', top:'36%'}}>
                        <AccountPreview
                            username={username}
                            profilePhoto={profilePhoto}
                            fullName={fullName}
                            isPrivate={isPrivate}
                            numPosts={numPosts}
                            numFollowers={numFollowers}
                            numFollowing={numFollowing}
                            followText={followText}
                            notifyParentToUpdateFollowText={updateFollowTextFromAccountPreview}
                            isVerified={isVerified}
                            authUser={authUser}
                            notifyParentToShowErrorPopup={notifyParentToShowErrorPopup}
                        />
                    </div>
                }
            </div>

            <br/>
            <br/>
        </>
    );
}

export default UserBar;