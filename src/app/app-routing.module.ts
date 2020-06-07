import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PrincipalComponent} from './components/principal/principal.component';

const routes: Routes = [
    { path: '', component: PrincipalComponent },
];

@NgModule({
    exports: [ RouterModule ],
    imports: [ RouterModule.forRoot(routes) ]
})
export class AppRoutingModule { }
