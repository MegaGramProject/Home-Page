import { useState } from 'react';


function ThreeDotsPopup({authUserId, postDetails, hidePost, showAboutAccountPopup, closePopup, showErrorPopup}){
    const [copyLinkText, setCopyLinkText] = useState('Copy link');
    const [toggleFollowText, setToggleFollowText] = useState('Unfollow');


    function copyPostLinkToClipboard() {
        navigator.clipboard.writeText(
            `http://34.111.89.101/posts/${postDetails.overallPostId}`
        )
        .then(() => {
            setCopyLinkText('Copied');
            setTimeout(() => {
                setCopyLinkText('Copy link');
            }, 550);
        })
        .catch(_ => {
            _;
            setCopyLinkText('Failed to copy');
            setTimeout(() => {
                setCopyLinkText('Copy link');
            }, 550);
        });
    }


    function visitPostLink() {
        window.open(`http://34.111.89.101/posts/${postDetails.overallPostId}`, '_blank');
    }


    function visitAdLink() {
        window.open(postDetails.adInfo.link, '_blank');
    }


    async function toggleFollowUser() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        const usernameToToggleFollow = postDetails.authors[0];
        const userIdToToggleFollow = postDetails.authorIds[0];

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
                showErrorPopup(`The server had trouble toggling your follow-status of user ${usernameToToggleFollow}`);
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
        catch {
            showErrorPopup(`There was trouble connecting to the server to toggle your follow-status of user
            ${usernameToToggleFollow}`);
        }
    }

    
    async function markPostAsNotInterested() {
        if (authUserId == -1) {
            showErrorPopup('Dear Anonymous Guest, you must be logged in to an account to do that');
            return;
        }

        //for sake of simplicity, the code for this method has been omitted
        closePopup();
    }


    return (
        <>
            {postDetails.adInfo==null &&  
                (
                    <div className="popup" style={{height:'30em', width:'30em', borderRadius:'5%',
                    display:'flex', flexDirection:'column', alignItems:'center'}}>
                        
                        <b onClick={hidePost} style={{fontSize:'1.1em', color:'#ed6258',
                        paddingBottom:'0.7em', paddingTop:'1em', cursor:'pointer'}}>
                            Hide post
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <b onClick={toggleFollowUser} style={{fontSize:'1.1em',
                        color: toggleFollowText === 'Follow' ? '#3db0fc' : '#ed6258', paddingBottom:'0.7em', paddingTop:'0.7em',
                        cursor:'pointer'}}>
                            {toggleFollowText}
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <b onClick={markPostAsNotInterested} style={{fontSize:'1.1em',
                        color: '#ed6258', paddingBottom:'0.7em', paddingTop:'0.7em', cursor:'pointer'}}>
                            Not Interested
                        </b>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={visitPostLink} style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Go to post
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={copyPostLinkToClipboard}
                        style={{fontSize:'1.1em', cursor:'pointer'}}>
                            {copyLinkText}
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={() => {showAboutAccountPopup(postDetails.authors[0], postDetails.authorIds[0])}}
                        style={{fontSize:'1.1em', cursor:'pointer'}}>
                            About this account
                        </p>

                        <hr style={{width: '99%', borderTop: '1px solid lightgray'}} />

                        <p onClick={closePopup} style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Cancel
                        </p>
                     </div>
                )
            }

            {postDetails.adInfo!==null && 
                (
                    <div className="popup" style={{height:'17em', width:'30em', borderRadius:'5%',
                    display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <b onClick={hidePost} style={{fontSize:'1.1em', color:'#ed6258',
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

                        <p onClick={closePopup} style={{fontSize:'1.1em', cursor:'pointer'}}>
                            Cancel
                        </p>
                    </div>
                )
            }
        </>
    );
}

export default ThreeDotsPopup;