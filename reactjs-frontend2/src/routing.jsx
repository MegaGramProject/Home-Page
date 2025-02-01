import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainPage from './views/MainPage';
import MainPageWithURLParams from './views/MainPageWithURLParams';
import NotFoundPage from './views/NotFoundPage';

const Routing = () => (
    <Routes>
        <Route exact path="/" element={<MainPage />} />
        <Route exact path="/:username" element={<MainPageWithURLParams />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
);

const Root = () => (
    <BrowserRouter>
        <Routing />
    </BrowserRouter>
);

export default Root;