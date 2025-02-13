import { useState } from 'react';

function ThreeDotsPopup({authUser, postDetails, hidePost, notifyParentToShowAboutAccountPopup,
notifyParentToClosePopup, notifyParentToShowErrorPopup}){
    const [followText, setFollowText] = useState('Unfollow');

    function copyPostLinkToClipboard() {
        navigator.clipboard.writeText(
            `http://34.111.89.101/profile/${postDetails.usernames[0]}?overallPostId=${postDetails.overallPostId}`
        )
        .then(() => {
            console.log('Successfully copied link to post');
        })
        .catch(err => {
            console.error('Failed to copy text to clipboard:', err);
        });
    }
    

    function visitAdLink() {
        window.location.href = postDetails.adInfo.link;
    }

    async function toggleFollowUser() {
        const username = postDetails.usernames[0];
        
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
                if (newFollowText==='Following') {
                    newFollowText = 'Unfollow'
                }
                else if(newFollowText==='Requested') {
                    newFollowText='Unrequest';
                }
                setFollowText(newFollowText);
            }
        }

        catch (error) {
            notifyParentToShowErrorPopup(`There was trouble connecting to the server to toggle your follow-status
            of ${username}`);
        }
    }

    async function markPostAsNotInterested() {
        if (authUser === 'Anonymous Guest') {
            notifyParentToShowErrorPopup(`You cannot mark posts as 'Not-Interested' when you are on 'Anonymous
            Guest' mode`);
            return;
        }

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/markPostAsNotInterested/
            ${authUser}/${postDetails.overallPostId}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if(!response.ok) {
                notifyParentToShowErrorPopup('The server had trouble marking this post as not-interested');
            }
            else {
                hidePost(postDetails.overallPostId);
            }
        }
        catch (error) {
            notifyParentToShowErrorPopup(`There was trouble connecting to the server for marking this post as
            not-interested`);
        }
    }

    return (
        <>
            {postDetails.adInfo==null &&  
                (
                    <div className="popup" style={{height:'30em', width:'30em', borderRadius:'5%',
                    display:'flex', flexDirection:'column', alignItems:'center'}}>
                        
                        <b onClick={()=>{hidePost(postDetails.overallPostId)}} style={{fontSize:'1.1em', color:'#ed6258',
                        paddingBottom:'0.7em', paddingTop:'1em', cursor:'pointer'}}>
                            Hide post
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <b onClick={toggleFollowUser} style={{fontSize:'1.1em',
                        color: followText==='Unfollow' ? '#ed6258' : followText==='Follow' ? '#3db0fc' : '#a2a3a3',
                        paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>
                            {followText}
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <b onClick={markPostAsNotInterested} style={{fontSize:'1.1em',
                        color: '#ed6258', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>
                            Not Interested
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Go to post
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={copyPostLinkToClipboard}
                        style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Copy link
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={() => {notifyParentToShowAboutAccountPopup(postDetails.overallPostId)}}
                        style={{fontSize:'1.1em', cursor:'pointer'}}>
                            About this account
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={notifyParentToClosePopup} style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Cancel
                        </p>
                     </div>
                )
            }

            {postDetails.adInfo!==null && 
                (
                    <div className="popup" style={{height:'17em', width:'30em', borderRadius:'5%',
                    display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <b onClick={()=>{hidePost(postDetails.overallPostId)}} style={{fontSize:'1.1em', color:'#ed6258',
                        paddingBottom:'0.7em', paddingTop:'1em', cursor:'pointer'}}>
                            Hide ad
                        </b>
                        
                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <b onClick={markPostAsNotInterested} style={{fontSize:'1.1em',
                        color: '#ed6258', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>
                            Not Interested
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />
                        
                        <p onClick={visitAdLink} style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Visit ad-link
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={notifyParentToClosePopup} style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Cancel
                        </p>
                    </div>
                )
            }
        </>
    );
}

export default ThreeDotsPopup;