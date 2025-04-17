import { useEffect, useState } from 'react';

import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

function FollowUser({authUserId, userId, username, userFullName, userPfp, userIsVerified, originalFollowText,
showErrorPopup}) {
    const [followText, setFollowText] = useState('');


    useEffect(() => {
        setFollowText(originalFollowText)
    }, [originalFollowText]);


    async function toggleFollowUser() {
        if (authUserId === -1) {
            showErrorPopup(`You cannot toggle your follow-status of user ${username} when you are on 'Anonymous
            Guest' mode`);
            return;
        }

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
                        userIdToToggleFollow: userId
                    }
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                showErrorPopup(`The server had trouble toggling your follow-status of user ${username}`);
            }
            else {
                let newFollowingStatus = await response.json();
                newFollowingStatus = newFollowingStatus.data.toggleFollowUser;
                
                if(newFollowingStatus === 'Stranger') {
                    newFollowingStatus = 'Follow';
                }
                setFollowText(newFollowingStatus);
            }
        }

        catch (error) {
            showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of user ${username}`);
        }
    }


    return (
        <div className="selectUserOrGroupChat" style={{width:'95%', display:'flex',
        alignItems:'center', justifyContent:'space-between', boxShadow:'none', padding: '0.5em 1em'}}>
            <div style={{display:'flex', alignItems:'start'}}>
                <a href={`http://34.111.89.101/profile/${username}`} target="_blank" rel="noopener noreferrer">
                    <img src={userPfp} style={{objectFit:'contain', height:'3em',
                    width:'3em', cursor: 'pointer'}}/>
                </a>

                <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <b style={{maxWidth: '10em', overflowWrap: 'break-word', cursor: 'pointer', textAlign: 'start',
                        fontWeight: 'bold'}}>
                            {username}
                        </b>
                        {userIsVerified &&
                            (
                                <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em',
                                width: '1.5em', objectFit: 'contain'}}/>
                            )
                        }
                    </div>
                    <p style={{maxWidth: '10em', overflowWrap: 'break-word', color: 'gray',
                    marginTop:'0.5em', textAlign: 'start'}}>
                        {userFullName==='?' ? 'Could not get full name' : userFullName}
                    </p>
                </div>
            </div>

            
            {(authUserId !== userId) &&
                (
                    <button onClick={toggleFollowUser} style={{
                    backgroundColor: followText!=='Follow' ? '#f5f5f5' : '#1f86ed',
                    color: followText!=='Follow' ? 'black' : 'white', fontWeight:'bold', cursor:'pointer',
                    borderStyle:'none', width:'10em', borderRadius:'0.5em', paddingLeft:'0.5em', paddingBottom:'0.5em',
                    paddingTop:'0.5em'}}>
                        {followText}
                    </button>
                )
            }
        </div>
    );
}

export default FollowUser;