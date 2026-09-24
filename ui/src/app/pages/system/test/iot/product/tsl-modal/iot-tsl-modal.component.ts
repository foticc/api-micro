import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { DEFAULT_TSL_SCHEMA, IotTslModalData, IotTslModel } from '@app/pages/system/test/iot/product/models/iot-product.models';
import { IotProductService } from '@app/pages/system/test/iot/product/services/iot-product.service';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-iot-tsl-modal',
  templateUrl: './iot-tsl-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzSelectModule]
})
export class IotTslModalComponent extends BasicConfirmModalComponent implements OnInit {
  addEditForm!: FormGroup;
  readonly nzModalData: IotTslModalData = inject(NZ_MODAL_DATA);
  readonly versions = signal<IotTslModel[]>([]);
  selectedVersion: number | null = null;

  private fb = inject(FormBuilder);
  private dataService = inject(IotProductService);
  override modalRef = inject(NzModalRef);

  protected getAsyncFnData(modalValue: NzSafeAny): Observable<NzSafeAny> {
    return of(modalValue);
  }

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.addEditForm)) {
      return of(false);
    }
    return of(this.addEditForm.getRawValue());
  }

  ngOnInit(): void {
    this.addEditForm = this.fb.group({
      schemaJson: [DEFAULT_TSL_SCHEMA, [Validators.required]],
      changelog: [null]
    });
    this.dataService.listTsl(this.nzModalData.productId).subscribe(list => {
      const versions = list ?? [];
      this.versions.set(versions);
      const current = versions[0];
      if (current?.version != null) {
        this.loadVersion(current.version);
      }
    });
  }

  loadVersion(version: number): void {
    this.selectedVersion = version;
    this.dataService.tslVersion(this.nzModalData.productId, version).subscribe(tsl => {
      this.addEditForm.patchValue({
        schemaJson: prettyJson(tsl.schemaJson),
        changelog: tsl.changelog
      });
    });
  }
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
