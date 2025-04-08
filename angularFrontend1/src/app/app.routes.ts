import { HomePage } from './HomePage.component';
import { NotFoundPage } from './NotFoundPage.component';

import { Routes } from '@angular/router';


export const routes: Routes = [
    {path: '', component: HomePage},
    {path: ':username', component: HomePage},
    {path: '**', component: NotFoundPage}
];