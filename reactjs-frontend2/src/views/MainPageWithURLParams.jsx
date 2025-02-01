import { useParams } from 'react-router-dom';

import MainPage from './MainPage';

function MainPageWithURLParams() {
    const urlParams = useParams();
    return <MainPage urlParams={urlParams} />;
}

export default MainPageWithURLParams;