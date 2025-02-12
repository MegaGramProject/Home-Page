import { useParams } from 'react-router-dom';
import StoryViewerPage from './StoryViewerPage';

function StoryViewerPageWithURLParams() {
    const urlParams = useParams(); 
    return <StoryViewerPage urlParams={urlParams} />;
};

export default StoryViewerPageWithURLParams;
