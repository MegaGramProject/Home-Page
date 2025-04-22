import { HomePage } from './HomePage.component';
import { NotFoundPage } from './NotFoundPage.component';
import { StoryViewerPage } from './StoryViewerPage.component';

import { Routes } from '@angular/router';


export const routes: Routes = [
    {path: '', component: HomePage},
    {path: ':authUsername', component: HomePage},

    {path: 'stories/:authorUsernameOrStoryId', component: StoryViewerPage},
    {path: 'stories/:authUsername/:authorUsernameOrStoryId', component: StoryViewerPage},

    {path: '**', component: NotFoundPage}
];