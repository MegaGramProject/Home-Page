import bluePlusIcon from "../assets/images/bluePlusIcon.png";
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';

function UserIcon({authUser, username, inStoriesSection, userHasStories, userHasUnseenStory, userPfp,
userIsVerified, showStoryViewer}) {
    function onClickingProfilePhoto() {
      if (userHasStories) {
        showStoryViewer(username, inStoriesSection);
      }
      else {
        window.open(`http://34.111.89.101/profile/${username}`, '_blank');
      } 
    }

    return (
        <>
            {username === 'Anonymous Guest' && 
                (
                    <div style={{width: '8em', height: '10em'}}>
                        <p style={{fontSize: '0.7em', textAlign: 'start'}}>
                            You are currently logged in as a guest. This means that you can only view posts/stories
                            of public accounts. You cannot interact with other users in any way without logging in to
                            an account of your own.
                        </p>
                    </div>
                )
            }

            {username !== 'Anonymous Guest' &&
                (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                        {userHasStories &&
                            (
                                <div style={{background: userHasUnseenStory ? 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)' :
                                'lightgray', borderRadius:'100%', height:'4.6em', width:'4.6em', position:'relative'}}>
                                    <div style={{background: 'white', borderRadius:'100%', height:'4.45em', width:'4.45em',
                                    position:'absolute', left:'50%', top:'50%', transform: 'translate(-50%, -50%)'}}>
                                        <img onClick={onClickingProfilePhoto} src={userPfp}
                                        style={{height:'4.25em', width:'4.25em', objectFit:'contain', position:'absolute', left:'50%',
                                        top:'50%', transform: 'translate(-50%, -50%)', cursor: 'pointer'}}/>

                                        {(inStoriesSection && (username===authUser)) &&
                                            (   
                                                <a href="http://34.111.89.101/postStory" target="_blank" rel="noopener noreferrer">
                                                    <img src={bluePlusIcon}
                                                    style={{height:'1.75em', width:'1.75em', objectFit:'contain',
                                                    position:'absolute', left:'65%', top:'65%', cursor:'pointer'}}/>
                                                </a>
                                            )
                                        }
                                    </div>
                                </div>
                            )
                        }

                        {!userHasStories &&
                            (
                                <div style={{background: 'white', borderRadius:'100%', height:'4.2em', width:'4.2em',
                                position: 'relative'}}>
                                    <img onClick={onClickingProfilePhoto} src={userPfp}
                                    style={{height:'95%', width:'95%', objectFit:'contain', position:'absolute', left:'50%',
                                    top:'50%', transform: 'translate(-50%, -50%)', cursor: 'pointer'}}/>

                                    {(inStoriesSection && (username===authUser)) &&
                                        (   
                                            <a href="http://34.111.89.101/postStory" target="_blank" rel="noopener noreferrer">
                                                <img src={bluePlusIcon}
                                                style={{height:'1.75em', width:'1.75em', objectFit:'contain',
                                                position:'absolute', left:'65%', top:'65%', cursor:'pointer'}}/>
                                            </a>
                                        )
                                    }
                                </div> 
                            )
                        }
                        
                        {inStoriesSection && 
                            (
                                <div style={{display: 'flex', justifyContent: 'center', width: '100%', alignItems: 'center'}}>
                                    <p style={{textAlign:'center', fontSize:'0.8em', maxWidth: '7.5em',
                                    overflowWrap: 'break-word'}}>
                                        {(username===authUser) ? 'You' : username}
                                    </p>

                                    {userIsVerified &&
                                        (
                                            <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em',
                                            width: '1.5em', objectFit: 'contain'}}/>
                                        )
                                    }
                                </div>
                            )
                        }
                    </div>
                )
            }
        </>
    );
}

export default UserIcon;