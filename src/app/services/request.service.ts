  import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  constructor(private http: HttpClient) { }

  public get(url: string): Observable<any> {
    return this.http.get(url);
  }

  public getAuth(url: string, hash: string, blob = false): Observable<any> {
    return this.http.get(url, {
      headers: {
        'indice-api-key': hash
      }
    });
  }

  public post(url: string, data: any, options?: any): Observable<any> {
    return this.http.post(url, data, options);
  }

  public put(url: string, data: any): Observable<any> {
    return this.http.put(url, data);
  }

  public delete(url: string): Observable<any> {
    return this.http.delete(url);
  }
}
