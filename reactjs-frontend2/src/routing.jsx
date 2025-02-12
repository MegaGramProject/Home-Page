import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainPage from './views/MainPage';
import MainPageWithURLParams from './views/MainPageWithURLParams';
import NotFoundPage from './views/NotFoundPage';
import StoryViewerPageWithURLParams from './views/StoryViewerPageWithURLParams';

const Routing = () => (
    <Routes>
        <Route exact path="/" element={<MainPage />} />
        <Route exact path="/:username" element={<MainPageWithURLParams />} />
        <Route exact path="/stories/:username/:storyId" element={<StoryViewerPageWithURLParams />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
);

const Root = () => (
    <BrowserRouter>
        <Routing />
    </BrowserRouter>
);

export default Root;