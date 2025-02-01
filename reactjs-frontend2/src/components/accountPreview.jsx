import privateAccount from "../assets/images/privateAccount.png";
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png'

function AccountPreview({authUser, username, profilePhoto, fullName, isPrivate, numPosts, numFollowers,
numFollowing, notifyParentToUpdateFollowText, followText, isVerified, notifyParentToShowErrorPopup}) {

    function formatNumber(number) {
        if(number==='?') {
            return '?';
        }
        if (number < 10000) {
            return number.toLocaleString();
        } else if (number >= 10000 && number < 1000000) {
            return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        } else if (number >= 1000000 && number < 1000000000) {
            return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (number >= 1000000000 && number < 1000000000000) {
            return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        } else {
            return (number / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
        }
    }

    async function toggleFollowUser() {
        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/toggleFollowUser/${authUser}/${username}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if(!response.ok) {
                notifyParentToShowErrorPopup(
                `The server had trouble toggling your follow-status of ${username}`);
            }
            else {
                const newFollowText = await response.text();
                notifyParentToUpdateFollowText(newFollowText);
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(`There was an error connecting to the server to toggle your follow-status
            of ${username}`);
        }
    }

    function takeToUsersProfile() {
        window.location.href = `http://34.111.89.101/profile/${username}`;
    }
    

    return (
        <div className="popup" style={{width:'22em', position:'absolute',
        padding: '1.5em 1.5em', borderRadius:'2%', zIndex: '10'}}>
            <div style={{display:'flex', justifyContent:'start', alignItems:'start'}}>
                <img src={profilePhoto} onClick={takeToUsersProfile}
                style={{width:'3em', height:'3em', cursor: 'pointer'}}/>

                <div style={{display:'flex', flexDirection:'column', marginLeft:'0.7em',
                alignItems: 'start'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <b onClick={takeToUsersProfile} style={{fontSize:'0.85em', cursor:'pointer',
                        maxWidth: '5em', overflowWrap:'break-word'}}>
                            {username}
                        </b>

                        {isVerified &&
                            (
                                <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em',
                                width: '1.5em', objectFit: 'contain'}}/>
                            )
                        }
                    </div>
        
                    <p style={{fontSize:'0.8em', color:'#787878', maxWidth: '12em', overflowWrap:'break-word',
                    textAlign: 'start'}}>
                        {fullName==='?' ? 'Could not get full name' : fullName}
                    </p>
                </div>
            </div>

            <div style={{display:'flex', width: '100%', justifyContent: 'space-between',
            alignItems: 'end', marginTop: '1em'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <b style={{maxWidth: '3em', overflowWrap: 'break-word'}}>
                        {formatNumber(numPosts)}
                    </b>
                    <p>posts</p>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <b style={{maxWidth: '3em', overflowWrap: 'break-word'}}>
                        {formatNumber(numFollowers)}
                    </b>
                    <p>followers</p>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <b style={{maxWidth: '3em', overflowWrap: 'break-word'}}>
                        {formatNumber(numFollowing)}
                    </b>
                    <p>following</p>
                </div>
            </div>

            {isPrivate==true &&
                (
                    <div style={{display:'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <img src={privateAccount} style={{height:'7em', width:'7em', objectFit:'contain',
                        pointerEvents: 'none'}}/>
                        <b>
                            This account is private
                        </b>
                        <p style={{color:'gray', fontSize:'0.8em', marginTop:'0.1em'}}>
                            Follow this account to see their photos and videos.
                        </p>
                    </div>
                )
            }

            {(isPrivate==false || isPrivate==='?') && 
                (
                    <p onClick={takeToUsersProfile}
                    style={{fontSize: '0.84em', color: '#666666', cursor: 'pointer',
                    marginTop: '20%', marginBottom: '20%'}}>
                        Click here to visit this profile.
                    </p>
                )
            }

            <button onClick={toggleFollowUser}className="blueButton"
            style={{width:'96%', backgroundColor: followText==='Follow' ? '#327bf0' : '#b3b4b5',
            cursor:'pointer'}}>
                {followText}
            </button>
        </div>
    );
}

export default AccountPreview;