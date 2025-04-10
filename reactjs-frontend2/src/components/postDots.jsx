import grayDot from '../assets/images/grayDot.png';
import solidWhiteDot from '../assets/images/solidWhiteDot.png';


function PostDots({numSlides, currSlide, currSlideIsImage}) {

    
    return (
        <div style={{display:'flex', width:'100%', position:'absolute', top: currSlideIsImage ? '95%' : '90%', left: '0%',
        justifyContent:'center', alignItems:'center', gap:'0.2em'}}>
            {Array.from({ length: numSlides }).map((_, index) => (
                <img
                    key={index}
                    src={index == currSlide ? solidWhiteDot : grayDot}
                    style={{height: index == currSlide ? '0.9em' : '0.6em', width: index == currSlide ? '0.9em' : '0.6em',
                    marginBottom: index == currSlide ? '-0.1em' : '', pointerEvents: 'none'}}
                />
                ))
            }
        </div>
    );
}

export default PostDots;