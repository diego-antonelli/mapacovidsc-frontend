import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {PrincipalComponent} from './components/principal/principal.component';
import {AppRoutingModule} from './app-routing.module';
import {NgxSpinnerModule} from 'ngx-spinner';
import {AlertModule} from 'ngx-alerts';
import {RequestService} from './services/request.service';
import {LoadingService} from './services/loading.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NgxSmartModalModule} from 'ngx-smart-modal';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';

import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localePt);

@NgModule({
    declarations: [
        AppComponent,
        PrincipalComponent
    ],
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        NgxSpinnerModule,
        NgxSmartModalModule.forRoot(),
        AlertModule.forRoot({maxMessages: 5, timeout: 5000, position: 'right'}),
        LeafletModule.forRoot()
    ],
    providers: [
        RequestService,
        LoadingService,
        { provide: LOCALE_ID, useValue: 'pt-BR' }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
