import thinGrayXIcon from '../../assets/images/thinGrayXIcon.png';


function ErrorPopup({errorMessage, closePopup}) {
    return (
        <div className="popup" style={{backgroundColor:'white', width:'30em', height: '30em',
        display:'flex', flexDirection:'column', alignItems:'center', borderRadius:'1.5%', position: 'relative',
        overflowY: 'scroll'}}>
            
            <div className="popup" style={{display:'flex', justifyContent: 'center', position: 'relative',
            width: '100%', borderStyle: 'solid', borderColor: 'lightgray', borderTop: 'none',
            borderLeft: 'none', borderRight: 'none', borderWidth: '0.08em', paddingTop: '1.5em',
            paddingBottom: '1em', boxShadow: 'none'}}>
                <b style={{fontSize: '1.25em', color: '#ed6258'}}>Error</b>
                <img src={thinGrayXIcon} onClick={closePopup} style={{height:'1.3em', width:'1.3em', 
                cursor:'pointer', position: 'absolute', right: '5%', top: '30%'}}/>
            </div>
        
            <p style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            maxWidth: '90%', maxHeight: '65%', overflowWrap: 'break-word', fontSize: '1em', color: 'gray'}}>
                {errorMessage}
            </p>

        </div>
    );
}

export default ErrorPopup;