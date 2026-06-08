import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';

@Service()
export class ExampleService {
  http = inject(BaseHttpService);

  public sessionTimeOut(): Observable<void> {
    return this.http.get(`/sessionTimeOut/`);
  }
}
