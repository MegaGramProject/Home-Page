import StoryViewerPage from './StoryViewerPage';

import { useParams } from 'react-router-dom';


function StoryViewerPageWithURLParams() {
    const urlParams = useParams(); 
    return <StoryViewerPage urlParams={urlParams} />;
};

export default StoryViewerPageWithURLParams;
