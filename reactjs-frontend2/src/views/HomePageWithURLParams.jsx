import HomePage from './HomePage';

import { useParams } from 'react-router-dom';


function HomePageWithURLParams() {
    const urlParams = useParams();
    return <HomePage urlParams={urlParams} />;
}

export default HomePageWithURLParams;