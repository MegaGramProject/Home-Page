import { useState, useEffect } from 'react';

import grayDot from '../assets/images/grayDot.png';
import solidWhiteDot from '../assets/images/solidWhiteDot.png';

function PostDots({numSlides, currSlide, currSlideIsImage}) {
    const [slides, setSlides] = useState([]);

    useEffect(() => {
        const newSlides = [];
        if (numSlides>1) {
            for (let i = 0; i < numSlides; i++) {
                if (i == currSlide) {
                    newSlides.push(<img key={i} src={solidWhiteDot} style={{height:'0.75em', width:'0.75em',
                    marginBottom: '-0.1em', pointerEvents: 'none'}}/>);
                }
                else {
                    newSlides.push(<img key={i} src={grayDot} style={{height:'0.6em', width:'0.6em',
                    pointerEvents: 'none'}}/>);
                }
            }
        }
        setSlides(newSlides);
    }, [numSlides, currSlide]);

    return (
        <div style={{display:'flex', width:'100%', position:'absolute', top: currSlideIsImage ? '95%' : '90%', left: '0%',
        justifyContent:'center', alignItems:'center', gap:'0.2em'}}>
            {slides}
        </div>
    );
}

export default PostDots;