import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from '@services/base-http.service';
export interface DownLoadObj {
  downloadUrl: string;
}

@Service()
export class DownloadService {
  http = inject(BaseHttpService);

  public fileStreamDownload(downloadDto: DownLoadObj): Observable<string> {
    return this.http.downLoadWithBlob('/file/download/document', downloadDto, { needSuccessInfo: false });
  }
}
