import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';

export interface SelectModel {
  value: NzSafeAny;
  label: string;
}

@Component({
  selector: 'app-select-simple',
  standalone: true,
  imports: [FormsModule, NzSelectComponent, NzOptionComponent],
  template: `
    <nz-select [ngModel]="value" [nzPlaceHolder]="nzPlaceHolder" (ngModelChange)="onChange($event)">
      @for (option of options; track option.value) {
        <nz-option [nzLabel]="option.label" [nzValue]="option.value"></nz-option>
      }
    </nz-select>
  `,
  styles: [
    `
      nz-select {
        margin: 0 8px 10px 0;
        width: 120px;
      }
    `
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DictSelectComponent),
      multi: true
    }
  ]
})
export class DictSelectComponent implements ControlValueAccessor {
  @Input() options: SelectModel[] = [];
  @Input() nzPlaceHolder: string = '';
  value: NzSafeAny;

  onChange: NzSafeAny = (event: NzSafeAny) => {
    this.value = event;
  };
  onTouched: NzSafeAny = (event: NzSafeAny) => {
    this.value = event;
  };

  writeValue(value: NzSafeAny): void {
    this.value = value;
  }

  registerOnChange(fn: NzSafeAny): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: NzSafeAny): void {
    this.onTouched = fn;
  }
}
