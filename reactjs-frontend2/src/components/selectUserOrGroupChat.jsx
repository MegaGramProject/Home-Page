import checkedIcon from '../assets/images/checkedIcon.png';
import solidGrayDot from '../assets/images/solidGrayDot.png';
import verifiedBlueCheck from '../assets/images/verifiedBlueCheck.png';


function SelectUserOrGroupChat({groupChatId, usernameOrGroupChatName, fullName, profilePhoto, isSelected, isVerified,
selectThisUserOrGroupChat, unselectThisUserOrGroupChat}) {


    function toggleSelectThisUserOrGroupChat() {
        if(!isSelected) {
            if(groupChatId==null) {
                selectThisUserOrGroupChat(usernameOrGroupChatName);
            }
            else {
                selectThisUserOrGroupChat('GROUP CHAT ID: ' + groupChatId);
            }
        }
        else {
            if(groupChatId==null) {
                unselectThisUserOrGroupChat(usernameOrGroupChatName);
            }
            else {
                unselectThisUserOrGroupChat('GROUP CHAT ID: ' + groupChatId);
            }
        }
    }


    return (
        <div className="selectUserOrGroupChat" onClick={toggleSelectThisUserOrGroupChat} style={{cursor:'pointer', width:
        '93%', display: 'flex', alignItems:'center', paddingLeft: '2em', position: 'relative', paddingTop: '0.5em',
        paddingBottom: '0.5em', paddingRight: '0.5em'}}>
           <img src={profilePhoto} style={{height:'3.75em', width:'3.75em', objectFit:'contain'}}/>

            <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em',
            gap: '0.7em'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <b style={{maxWidth: '10em', overflowWrap: 'break-word', textAlign: 'start'}}>
                        {usernameOrGroupChatName}
                    </b>
                    
                    {isVerified &&
                        (
                            <img src={verifiedBlueCheck} style={{pointerEvents: 'none', height: '1.5em', width: '1.5em',
                            objectFit: 'contain'}}/>
                        )
                    }
                </div>
                <p style={{marginTop:'-0.3em', color: 'gray', maxWidth: '10em', overflowWrap: 'break-word',
                textAlign: 'start'}}>
                    {fullName === '?' ?
                        'Could not fetch full-name' : fullName
                    }
                </p>
            </div>

            {isSelected && 
                (
                    <img className="iconToBeAdjustedForDarkMode" src={checkedIcon}
                    style={{objectFit:'contain', height:'2em', width:'2em',
                    position: 'absolute', right: '2%', top: '30%'}}/>
                )
            }

            {!isSelected &&
                (
                    <img src={solidGrayDot} style={{objectFit:'contain', height:'2em', width:'2em',
                    position: 'absolute', right: '2%', top: '30%'}}/>
                )
            }
        </div>
    );
}

export default SelectUserOrGroupChat;