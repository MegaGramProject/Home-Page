import HomePage from './views/HomePage.vue';
import NotFoundPage from './views/NotFoundPage.vue';

import { createRouter, createWebHistory } from 'vue-router';


const router = createRouter({
    history: createWebHistory("/"),
    routes: [
        {
            path: '/',
            name: 'HomePage(WithoutUsername)',
            component: HomePage
        },
        {
            path: '/:username',
            name: 'HomePage(WithUsername)',
            component: HomePage
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFoundPage',
            component: NotFoundPage
        }
    ]
});

export default router
