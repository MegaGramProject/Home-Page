import { useEffect, useState } from 'react';

import UserIcon from './userIcon';

import accountBasedInIcon from '../assets/images/accountBasedIn.png';
import dateJoinedIcon from '../assets/images/dateJoined.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

function AboutAccountPopup({usernameOfMainPostAuthor, mainPostAuthorIsVerified, notifyParentToClosePopup,
mainPostAuthorHasStories, mainPostAuthorHasUnseenStory, authUser, mainPostAuthorProfilePhoto,
notifyParentToShowStoryViewer}) {
    const [dateJoined, setDateJoined] = useState("");
    const [accountBasedIn, setAccountBasedIn] = useState("");

    useEffect(() => {
        fetchDataOnMainPostAuthor();
    }, [usernameOfMainPostAuthor]);


    async function fetchDataOnMainPostAuthor() {
        let newDateJoined = "";
        let newAccountBasedIn = "";

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/expressJSBackend1/getInfoForAboutAccountPopup/
            ${usernameOfMainPostAuthor}`, {
                credentials: 'include'
            });
            if(!response.ok) {
                newDateJoined = 'The server had trouble getting the date when this user joined Megagram';
                newAccountBasedIn = 'The server had trouble getting where the user is based in';
            }
            else {
                const userInfo = await response.json();
                newDateJoined = userInfo['created'];
                newAccountBasedIn = userInfo['accountBasedIn'];
            }
        }
        catch (error) {
            newDateJoined = 'There was trouble connecting to server to get the date when this user joined Megagram';
            newAccountBasedIn = 'There as trouble connecting to server to get where this user is based in';
        }
        finally {
            setDateJoined(newDateJoined);
            setAccountBasedIn(newAccountBasedIn);
        }
    }

    function formatDate(dateString) {
        if (dateString.includes("joined Megagram")) {
            return dateString;
        }
        const date = new Date(dateString);
        
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();
        return `${month} ${day}, ${year}`;
    }

    function takeToUsersProfile() {
        window.location.href = `http://34.111.89.101/profile/${usernameOfMainPostAuthor}`;
    }

    return (
        <div className="popup" style={{backgroundColor:'white', borderRadius:'1.5%', display:'flex',
        flexDirection:'column', alignItems:'center', width:'40em', height: '40em', overflowY: 'scroll',
        position: 'relative'}}>

            <div style={{width: '100%', borderStyle: 'solid', borderColor: 'lightgray', borderWidth: '0.08em',
            borderTop: 'none', borderLeft: 'none', borderRight: 'none', paddingTop: '1em',
            paddingBottom: '1em'}}>
                <b style={{fontSize:'1.2em'}}>
                    About this account
                </b>
            </div>

            <br/>

            <UserIcon
                username={usernameOfMainPostAuthor}
                authUser={authUser}
                inStoriesSection={false}
                hasStories={mainPostAuthorHasStories}
                hasUnseenStory={mainPostAuthorHasUnseenStory}
                profilePhoto={mainPostAuthorProfilePhoto}
                isVerified={mainPostAuthorIsVerified}
                notifyParentToShowStoryViewer={notifyParentToShowStoryViewer}
            />

            <div style={{display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center',
            marginTop: '1em'}}>
                
                <b onClick={usernameOfMainPostAuthor.length > 0 ? takeToUsersProfile : null}
                style={{maxWidth: '10em', overflowWrap: 'break-word',
                cursor: usernameOfMainPostAuthor.length > 0 ? 'pointer' : ''}}>
                    {usernameOfMainPostAuthor}
                </b>

                {mainPostAuthorIsVerified &&
                    (
                        <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em', width: '1.5em',
                        objectFit: 'contain'}}/>
                    )
                }
            </div>

            <br/>

            <p style={{width:'85%', color:'#616161', fontSize:'0.95em'}}>
                To help keep our community authentic, we’re showing information about accounts on Megagram.
            </p>

            <br/>

            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '0.65em'}}>
                <div style={{display:'flex', gap:'0.7em', marginLeft: '-2em'}}>
                    <img className="iconToBeAdjustedForDarkMode" src={dateJoinedIcon} style={{height:'2.9em',
                    width:'2.9em', objectFit:'contain', pointerEvents:'none'}}/>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'start'}}>
                        <b>Date joined</b>
                        <p style={{color:'gray', marginTop:'0.1em', maxWidth: '25em', overflowWrap:'break-word',
                        textAlign: 'start'}}>
                            {formatDate(dateJoined)}
                        </p>
                    </div>
                </div>

                <div style={{display:'flex', gap:'0.5em', marginLeft: '-2em'}}>
                    <img className="iconToBeAdjustedForDarkMode" src={accountBasedInIcon} style={{height:'2.9em',
                    width:'2.9em', objectFit:'contain', pointerEvents:'none'}}/>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'start'}}>
                        <b>Account based in</b>
                        <p style={{color:'gray', marginTop:'0.1em', maxWidth: '25em', overflowWrap:'break-word',
                        textAlign: 'start'}}>
                            {accountBasedIn}
                        </p>
                    </div>
                </div>
            </div>

            <div id="closeAboutAccountSection" style={{width:'100%', borderStyle: 'solid', borderColor: 'lightgray',
            borderWidth:'0.08em', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', position: 'fixed',
            bottom: '0%', backgroundColor: 'white'}}>
                <p onClick={notifyParentToClosePopup} style={{cursor:'pointer'}}>
                    Close
                </p>
            </div>
        </div>
    );
}

export default AboutAccountPopup;