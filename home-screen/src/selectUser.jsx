import React, { Component } from 'react';
import profileIcon from './images/profileIcon.png';
import solidWhiteDot from './images/solidWhiteDot.png';
import checkedIcon from './images/checkedIcon.png';
import './styles.css';

class SelectUser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isHovering: false,
            isChecked: false
        }
    };

    handleMouseEnter = () => {
        this.setState({isHovering: true})
    }

    handleMouseLeave = () => {
        this.setState({isHovering: false})
    }

    toggleCheck = () => {
        if(!this.state.isChecked) {
            this.setState({isChecked: true});
            this.props.addAccount(this.props.username);
        }
        else {
            this.setState({
                isChecked: false
            });
            this.props.removeAccount(this.props.username);
        }
    }


    render() {
        return (
        <React.Fragment>
        <div onClick={this.toggleCheck} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} style={{cursor:'pointer', width:'95%', display:'flex', alignItems:'center',
        backgroundColor: this.state.isHovering ? '#ebedeb' : 'white'}}>
        <img src={profileIcon} style={{objectFit:'contain', height:'3em', width:'3em'}}/>
        <div style={{display:'flex', flexDirection:'column', alignItems:'start', marginLeft:'1em'}}>
        <p>{this.props.username}</p>
        <p style={{marginTop:'-0.3em'}}>{this.props.fullName}</p>
        </div>
        {this.state.isChecked && <img src={checkedIcon} style={{objectFit:'contain', height:'2em', width:'2em', marginLeft:'22em'}}/>}
        {!this.state.isChecked && <img src={solidWhiteDot} style={{objectFit:'contain', height:'2em', width:'2em', marginLeft:'22em'}}/>}
        </div>
        </React.Fragment>);
    };
}

export default SelectUser;