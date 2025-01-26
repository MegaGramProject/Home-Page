import React, { Component } from 'react';

import solidWhiteDot from '../assets/images/solidWhiteDot.png';
import grayDot from '../assets/images/grayDot.png';

class PostDots extends Component {
    constructor(props) {
        super(props);
    };


    render() {
        const slides = [];
        if (this.props.numSlides>1) {
            for (let i = 0; i < this.props.numSlides; i++) {
                if (i==this.props.currSlide) {
                    slides.push(<img src={solidWhiteDot} style={{height:'0.75em', width:'0.75em'}}/>);
                }
                else {
                    slides.push(<img src={grayDot} style={{height:'0.6em', width:'0.6em'}}/>);
                }
            }
        }
        return (
        <React.Fragment>
        <div style={{display:'flex', width:'100%', position:'absolute', top:'95%', justifyContent:'center', alignItems:'start',  gap:'0.2em'}}>
        {slides}
        </div>
        </React.Fragment>);
    };
}

export default PostDots;