import {Injectable} from '@angular/core';
import {NgxSpinnerService} from 'ngx-spinner';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {

    constructor(
        private spinner: NgxSpinnerService,
    ) {

    }

    public loading() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        this.spinner.show();
    }

    public stopLoading() {
        this.spinner.hide();
    }
}
