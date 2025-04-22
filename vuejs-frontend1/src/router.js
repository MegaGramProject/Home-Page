import HomePage from './views/HomePage.vue';
import NotFoundPage from './views/NotFoundPage.vue';
import StoryViewerPage from './views/StoryViewerPage.vue';

import { createRouter, createWebHistory } from 'vue-router';


const router = createRouter({
    history: createWebHistory("/"),
    routes: [
        {
            path: '/',
            name: 'HomePage(WithoutAuthUsername)',
            component: HomePage
        },
        {
            path: '/:authUsername',
            name: 'HomePage(WithAuthUsername)',
            component: HomePage
        },

        {
            path: '/stories/:authorUsernameOrStoryId',
            name: 'StoryViewerPage(WithoutAuthUsername)',
            component: StoryViewerPage
        },
        {
            path: '/stories/:authUsername/:authorUsernameOrStoryId',
            name: 'StoryViewerPage(WithAuthUsername)',
            component: StoryViewerPage
        },
        
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFoundPage',
            component: NotFoundPage
        }
    ]
});

export default router
