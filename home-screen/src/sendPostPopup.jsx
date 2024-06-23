import React, { Component } from 'react';
import SelectUser from './selectUser';
import closePopupIcon from './images/closePopupIcon.png';
import './styles.css';

class SendPostPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            accountToSend: "",
            accountsSelected: []
        }
    };

    handleInputChange = (event) => {
        this.setState({accountToSend: event.target.value});
    }

    addAccount = (newAccount) => {
        this.setState({
            accountsSelected: [...this.state.accountsSelected, newAccount],
        });

    }

    removeAccount = (deletedAccount) => {
        const newAccountsSelected = this.state.accountsSelected.filter(x => x!==deletedAccount);
        this.setState({
            accountsSelected: newAccountsSelected
        })
    }

    sendPost = () => {
        console.log("SENT TO " + this.state.accountsSelected)
    };



    render() {
        return (
        <React.Fragment>
        <div style={{backgroundColor:'white', borderRadius:'2%', width:'35em', height:'35em', borderStyle:'solid', borderColor:'lightgray',
        paddingTop:'1em'}}>
        <b>Share</b>
        <img onClick={this.props.closePopup} src={closePopupIcon} style={{objectFit:'contain', height:'1em', width:'1em', position:'absolute', left:'90%',
        cursor:'pointer'}}/>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <div style={{display:'flex',  paddingLeft:'1em', alignItems:'center'}}>
        <b>To:</b>
        <input type="text" value={this.state.accountToSend} onChange={this.handleInputChange} placeholder={"Search..."}
        style={{width:'35em', marginLeft:'1em', fontSize:'0.9em', borderStyle:'none', outline: 'none'}}/>
        </div>
        <hr style={{width: '100%', borderTop: '1px solid lightgray'}} />
        <div style={{display:'flex', flexDirection:'column', alignItems:'start', height:'26em',
        paddingLeft:'1em', overflow:'scroll'}}>
        {this.state.accountToSend==="" && <b>Suggested</b>}
        <br/>
        <SelectUser username={"rishavry2"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry3"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry4"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry5"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry6"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        <SelectUser username={"rishavry7"} fullName={"R R"} addAccount={this.addAccount} removeAccount={this.removeAccount}/>
        </div>
        {this.state.accountsSelected.length == 0 && <button type="button" className="blueButton" style={{width:'42em'}}>Send</button>}
        {this.state.accountsSelected.length > 0 && <button onClick={this.sendPost} type="button" className="blueButton"
        style={{width:'42em', cursor:'pointer', backgroundColor:'#347aeb'}}>Send</button>}
        </div>
        </React.Fragment>);
    };
}

export default SendPostPopup;