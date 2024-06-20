import React, { Component } from 'react';
import LeftSidebar from "./leftSidebar";
import './styles.css';


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
        showPopup: false,
        };
        this.togglePopup = this.togglePopup.bind(this);
    };

    togglePopup = () => {
        this.setState({showPopup: !this.state.showPopup});
    };


    render() {
        return (
        <React.Fragment>
        <LeftSidebar showPopup={this.state.showPopup}  changePopup={this.togglePopup}/>
        </React.Fragment>);
    };
}

export default App;