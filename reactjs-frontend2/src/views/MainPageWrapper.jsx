import React from 'react';
import { useParams } from 'react-router-dom';

import MainPage from './MainPage';

function MainPageWrapper() {
    const params = useParams();
    return <MainPage params={params} />;
}

export default MainPageWrapper;