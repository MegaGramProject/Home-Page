import HomePage from './views/HomePage.vue';
import NotFoundPage from './views/NotFoundPage.vue';

import router from './router';

import { createApp } from 'vue';


//let path = window.location.pathname.substring(10);
let path = window.location.pathname;

const isRootPath = path === '/';
const isUsernamePath = /^\/[a-zA-Z_.]+$/.test(path);

if (isRootPath || isUsernamePath) {
    const app = createApp(HomePage);
    app.use(router);
    app.mount('#main');
}
else {
    const app = createApp(NotFoundPage);
    app.use(router);
    app.mount('#main');
}
