import AccountPreview from './AccountPreview';

import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

import { useState } from 'react';


function UserBar({username, userFullName, userPfp, authUserId, userId, numFollowers, numFollowings, numPosts,
userIsPrivate, userIsVerified, showErrorPopup}) {
    const [toggleFollowText, setToggleFollowText] = useState('Follow');
    const [displayAccountPreview, setDisplayAccountPreview] = useState(false);


    function takeUserToLogin() {
        window.open('http://34.111.89.101/login', '_blank');
    }

    
    async function toggleFollowUser() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        const usernameToToggleFollow = username;
        const userIdToToggleFollow = userId;

        try {
            const response = await fetch('http://34.111.89.101/api/Home-Page/djangoBackend2/graphql', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: `query toggleFollowUser($authUserId: Int!, $userIdToToggleFollow: Int!) {
                        toggleFollowUser(authUserId: $authUserId, userIdToToggleFollow: $userIdToToggleFollow)
                    }`,
                    variables: {
                        authUserId: authUserId,
                        userIdToToggleFollow: userIdToToggleFollow
                    }
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                showErrorPopup(
                `The server had trouble toggling your follow-status of user ${usernameToToggleFollow}`);
            }
            else {
                let newFollowingStatus = await response.text();
                newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                if (newFollowingStatus==='Stranger') {
                    setToggleFollowText('Follow');
                }
                else if(newFollowingStatus==='Following') {
                    setToggleFollowText('Unfollow');
                }
                else {
                    setToggleFollowText('Cancel Request');
                }
            }
        }
        catch (error) {
            showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of user
            ${usernameToToggleFollow}`);
        }
    }


    function setDisplayAccountPreviewToTrue() {
        setDisplayAccountPreview(true);
    }


    function setDisplayAccountPreviewToFalse() {
        setDisplayAccountPreview(false);
    }


    function updateFollowTextFromAccountPreview(newFollowText) {
        setToggleFollowText(newFollowText);
    }


    return (
        <>
            <div style={{display:'flex', width:'20em', alignItems:'start', position:'relative',
            marginBottom: '-1em'}} onMouseEnter={setDisplayAccountPreviewToTrue}
            onMouseLeave={setDisplayAccountPreviewToFalse}>
                <a href={`http://34.111.89.101/profile/${username}`} target="_blank" rel="noopener noreferrer">
                    <img src={userPfp} style={{height:'2.5em', width:'2.5em', objectFit:'contain', 
                    cursor:'pointer'}}/>   
                </a>

                <div style={{display:'flex', flexDirection:'column', alignItems: 'start', marginLeft:'0.7em'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <a href={`http://34.111.89.101/profile/${username}`} onMouseEnter={setDisplayAccountPreviewToTrue}
                        onMouseLeave={setDisplayAccountPreviewToFalse} style={{fontSize:'0.85em', cursor:'pointer',
                        maxWidth: '8em', overflowWrap: 'break-word', textAlign: 'start', fontWeight: 'bold'}}
                        target="_blank" rel="noopener noreferrer">
                            {username}
                        </a>

                        {userIsVerified &&
                            (
                                <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em',
                                width: '1.5em', objectFit: 'contain'}}/>
                            )
                        }
                    </div>

                    <p style={{fontSize:'0.7em', marginTop:'0.1em', color:'#787878',
                    maxWidth: '10em', overflowWrap: 'break-word', textAlign: 'start'}}>
                        { userFullName === '?' ? 'Could not get full name' : userFullName }
                    </p>
                </div>

                <p onClick={userId == authUserId ? takeUserToLogin : toggleFollowUser}
                style={{color: toggleFollowText==="Follow" ? '#348feb' : 'gray', cursor:'pointer',
                fontSize:'0.85em', fontWeight:'bold', position:'absolute', left:'76%', top: '0%'}}> 
                    { userId == authUserId ? 'Switch' : toggleFollowText }
                </p>
                
                {(userId != authUserId && displayAccountPreview) && 
                    <div style={{position:'absolute', top:'36%', left: '-2%'}}>
                        <AccountPreview
                            username={username}
                            userPfp={userPfp}
                            userFullName={userFullName}
                            toggleFollowText={toggleFollowText}
                            authUserId={authUserId}
                            userId={userId}
                            numPosts={numPosts}
                            numFollowers={numFollowers}
                            numFollowings={numFollowings}
                            userIsPrivate={userIsPrivate}
                            userIsVerified={userIsVerified}
                            updateFollowText={updateFollowTextFromAccountPreview}
                            showErrorPopup={showErrorPopup}
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