import React from 'react';
import App from './app';
import { useParams } from 'react-router-dom';


const App2Wrapper = (props) => {
    const params = useParams();
    return <App {...props} params={params} />;
};

export default App2Wrapper;