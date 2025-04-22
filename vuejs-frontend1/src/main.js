import HomePage from './views/HomePage.vue';
import StoryViewerPage from './views/StoryViewerPage.vue';
import NotFoundPage from './views/NotFoundPage.vue';

import router from './router';

import { createApp } from 'vue';

const path = window.location.pathname;
let app;

if (path === '/') {
    app = createApp(HomePage);
    app.use(router);
    app.mount('#main');
}
else {
    const partsOfPath = path.split('/').filter(Boolean)

    // /:username
    if (partsOfPath.length === 1 && partsOfPath[0] !== 'stories' && /^[a-z0-9._]{1,30}$/.test(partsOfPath[0])) {
        app = createApp(HomePage);
        app.use(router);
        app.mount('#main');
    }

    // /stories/:authorUsernameOrStoryId
    else if (partsOfPath[0] === 'stories' && partsOfPath.length === 2) {
        const isValidAuthorUsername = /^[a-z0-9._]{1,30}$/.test(partsOfPath[1]);
        let isValidStoryId = false;

        if (!isValidAuthorUsername) {
            const intValue = parseInt(partsOfPath[1]);
            isValidStoryId = Number.isInteger(intValue) && intValue > 0;
        }

        if (isValidAuthorUsername || isValidStoryId) {
            app = createApp(StoryViewerPage);
            app.use(router);
            app.mount('#main');
        }
    }

    // /stories/:authUsername/:authorUsernameOrStoryId
    else if (partsOfPath[0] === 'stories' && partsOfPath.length === 3 && /^[a-z0-9._]{1,30}$/.test(partsOfPath[1])) {
        const isValidAuthorUsername = /^[a-z0-9._]{1,30}$/.test(partsOfPath[2]);
        let isValidStoryId = false;

        if (!isValidAuthorUsername) {
            const intValue = parseInt(partsOfPath[2]);
            isValidStoryId = Number.isInteger(intValue) && intValue > 0;
        }

        if (isValidAuthorUsername || isValidStoryId) {
            app = createApp(StoryViewerPage);
            app.use(router);
            app.mount('#main');
        }
    }

    else {
        app = createApp(NotFoundPage);
        app.use(router);
        app.mount('#main');
    }
}
