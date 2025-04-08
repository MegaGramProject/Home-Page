import { useParams } from 'react-router-dom';

import HomePage from './HomePage';

function HomePageWithURLParams() {
    const urlParams = useParams();
    return <HomePage urlParams={urlParams} />;
}

export default HomePageWithURLParams;