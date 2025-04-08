import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './views/HomePage';
import HomePageWithURLParams from './views/HomePageWithURLParams';
import NotFoundPage from './views/NotFoundPage';
import StoryViewerPageWithURLParams from './views/StoryViewerPageWithURLParams';

const Routing = () => (
    <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/:username" element={<HomePageWithURLParams />} />
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