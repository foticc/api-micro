import { Component, inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DictService } from '@app/pages/zpage/api/dict.service';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

@Component({
  selector: 'app-forms',
  imports: [],
  templateUrl: './forms.component.html',
  standalone: true,
  styleUrl: './forms.component.less'
})
export class FormsComponent extends BasicConfirmModalComponent {
  private service = inject(DictService);

  getCurrentValue(): NzSafeAny {
    return this.service
      .save({
        code: '123',
        value: 1,
        desc: 'hah'
      })
      .pipe(
        catchError(() => {
          return of(false);
        })
      );
  }
}
