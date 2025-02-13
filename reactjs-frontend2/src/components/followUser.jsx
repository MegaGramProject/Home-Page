import { useEffect, useState } from 'react';

import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

function FollowUser({username, fullName, profilePhoto, isVerified, followStatus,
notifyParentToShowErrorPopup, authUser}) {
    const [followText, setFollowText] = useState("");

    useEffect(() => {
        setFollowText(followStatus)
    }, []);

    async function toggleFollowUser() {
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup(`You cannot toggle your follow-status of ${username} when you are on 'Anonymous
            Guest' mode`);
            return;
        }

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
                const newFollowText = await response.text(); //either 'Follow', 'Following', or 'Requested'
                setFollowText(newFollowText);
            }
        }

        catch (error) {
            notifyParentToShowErrorPopup(`There was trouble connecting to the server to toggle your follow-status
            of ${username}`);
        }
    }


    return (
        <div className="selectUserOrGroupChat" style={{width:'95%', display:'flex',
        alignItems:'center', justifyContent:'space-between', boxShadow:'none', padding: '0.5em 1em'}}>
            <div style={{display:'flex', alignItems:'start'}}>
                <a href={`http://34.111.89.101/profile/${username}`} target="_blank" rel="noopener noreferrer">
                    <img src={profilePhoto} style={{objectFit:'contain', height:'3em',
                    width:'3em', cursor: 'pointer'}}/>
                </a>

                <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <a href={`http://34.111.89.101/profile/${username}`} style={{maxWidth: '10em', overflowWrap: 'break-word',
                        cursor: 'pointer', textAlign: 'start', fontWeight: 'bold'}} target="_blank" rel="noopener noreferrer">
                            {username}
                        </a>
                        {isVerified &&
                            (
                                <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em',
                                width: '1.5em', objectFit: 'contain'}}/>
                            )
                        }
                    </div>
                    <p style={{maxWidth: '10em', overflowWrap: 'break-word', color: 'gray',
                    marginTop:'0.5em', textAlign: 'start'}}>
                        {fullName==='?' ? 'Could not get full name' : fullName}
                    </p>
                </div>
            </div>

            {(username !== authUser) &&
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