import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Dict } from '@app/pages/zpage/dict/dict.service';
import { DictItemService } from '@app/pages/zpage/dict-item/dict-item.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzColDirective } from 'ng-zorro-antd/grid';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-forms',
  imports: [NzFormModule, ReactiveFormsModule, NzColDirective, NzInputDirective],
  templateUrl: './dict-item.forms.component.html',
  standalone: true,
  styleUrl: './dict-item.forms.component.less'
})
export class DictItemFormsComponent extends BasicConfirmModalComponent implements OnInit {
  protected addEditForm!: FormGroup;
  private fb = inject(FormBuilder);
  private service = inject(DictItemService);
  override modalRef = inject(NzModalRef);

  readonly dict: Dict = inject(NZ_MODAL_DATA);

  getCurrentValue(): NzSafeAny {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return this.service.create(this.addEditForm.value).pipe(
      catchError(() => {
        return of(false);
      })
    );
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const dictId = this.dict.id;
    this.addEditForm = this.fb.group({
      id: [null, []],
      label: [null, [Validators.maxLength(255)]],
      value: [null, [Validators.maxLength(255)]],
      dictId: [dictId, [Validators.required]]
    });
  }
}
