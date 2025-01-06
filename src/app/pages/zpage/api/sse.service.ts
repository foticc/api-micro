import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SSEService {

  connect(): Observable<string> {
    return new Observable(observer => {
      const eventSource = new EventSource('/demo/api/sse/stream');
      eventSource.onmessage = event => {
        observer.next(event.data);
      };
      eventSource.onerror = error => {
        observer.error(error);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
