import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './app';
import App2 from './app2';
import NotFound from './notFound';

const Routing = () => (
<Routes>
    <Route exact path="/" element={<App />} />
    <Route exact path="/:username" element={<App2 />} />
    <Route path="*" element={<NotFound />} />
</Routes>
);

const Root = () => (
<BrowserRouter>
    <Routing />
</BrowserRouter>
);

export default Root;