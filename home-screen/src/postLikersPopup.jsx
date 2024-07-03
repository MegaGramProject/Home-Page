import React, { Component } from 'react';
import FollowUser from './followUser';
import closePopupIcon from './images/closePopupIcon.png';
import './styles.css';

class PostLikersPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            postId: '',
            accounts:  []
        };

    };

    async componentDidUpdate(prevProps, prevState) {
        if(prevState.postId !== this.props.postId) {
            this.setState({postId: this.props.postId});
            this.fetchAccounts();
        }
    }

    fetchAccounts = async () => {
        const response = await fetch(`http://localhost:8004/getLikes/${this.props.postId}`);
        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        const usersThatLiked = await response.json();
        let accounts = []
        for(let i of usersThatLiked) {
            if(i['username']==='rishavry') {
                accounts.unshift(<FollowUser username={i['username']} isOwn={true} isFollowing={true}/>);
            }
            else {
                accounts.push(<FollowUser username={i['username']} isOwn={false} isFollowing={false}/>);
            }
        }
        this.setState({accounts: accounts});
    }

    closePopup = () => {
        this.setState({postId: '', accounts: []});
        this.props.closePopup();
    }


    render() {
        return (
        <React.Fragment>
        <div className="popup" style={{backgroundColor:'white',  boxShadow:'1px 4px 8px 3px rgba(0, 0, 0, 0.2)', width:'40em', height:'40em',
        display:'flex', flexDirection:'column', alignItems:'center', borderRadius:'1.5%', paddingTop:'1em', overflow:'scroll'}}>
        <div className="popup" style={{display:'flex', boxShadow:'none'}}>
        <b style={{position:'absolute', left:'45%'}}>Likes</b>
        <img src={closePopupIcon} onClick={this.closePopup} style={{height:'1.3em', width:'1.3em', cursor:'pointer', marginLeft:'30em'}}/>
        </div>
        <hr style={{color:'gray', width:'100%', marginTop:'0.7em'}}/>
        {this.state.accounts}
        </div>
        </React.Fragment>);
    };
}

export default PostLikersPopup;