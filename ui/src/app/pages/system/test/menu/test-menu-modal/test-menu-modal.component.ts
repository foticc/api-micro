import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { TestMenuModalData } from '@app/pages/system/test/models/test-menu.models';
import { isMenuExternalLink, mergeMenuPrefix } from '@app/pages/system/test/shared/menu-prefix.util';
import { IconSelComponent } from '@shared/biz-components/icon-sel/icon-sel.component';
import { fnCheckForm } from '@utils/tools';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

type MenuType = 'C' | 'F';

@Component({
  selector: 'app-test-menu-modal',
  templateUrl: './test-menu-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule, NzInputModule, NzRadioModule, NzButtonModule, IconSelComponent, NzInputNumberModule, NzSwitchModule]
})
export class TestMenuModalComponent extends BasicConfirmModalComponent implements OnInit {
  validateForm!: FormGroup;
  selIconVisible = false;
  codePrefix = '';
  pathPrefix = '';
  isExternalLink = false;
  readonly nzModalData: TestMenuModalData | null = inject(NZ_MODAL_DATA, { optional: true });
  menuType: MenuType = 'C';
  private basePathPrefix = '';
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  override modalRef = inject(NzModalRef);

  override getCurrentValue(): Observable<NzSafeAny> {
    if (!fnCheckForm(this.validateForm)) {
      return of(false);
    }
    const value = this.validateForm.getRawValue();
    const external = isMenuExternalLink(value.newLinkFlag);
    return of({
      ...value,
      code: mergeMenuPrefix(value.code, this.codePrefix),
      path: this.menuType === 'C' && !external ? mergeMenuPrefix(value.path, this.pathPrefix) : value.path
    });
  }

  initForm(): void {
    this.validateForm = this.fb.group({
      menuName: [null, [Validators.required]],
      code: [null, [Validators.required]],
      orderNum: [1],
      menuType: ['C'],
      path: [null, [Validators.required]],
      visible: [true],
      status: [true],
      newLinkFlag: [false],
      icon: [null],
      alIcon: [null]
    });
  }

  seledIcon(e: string): void {
    this.validateForm.get('icon')?.setValue(e);
  }

  setFormStatusByType(methodName: 'disable' | 'enable'): void {
    this.validateForm.get('newLinkFlag')?.[methodName]();
    this.validateForm.get('icon')?.[methodName]();
    this.validateForm.get('alIcon')?.[methodName]();
    this.validateForm.get('visible')?.[methodName]();
    this.validateForm.get('path')?.[methodName]();
  }

  changeMenuType(type: MenuType): void {
    this.menuType = type;
    if (type === 'F') {
      this.setFormStatusByType('disable');
    } else {
      this.setFormStatusByType('enable');
    }
  }

  private syncPathPrefix(isExternal?: boolean): void {
    const external = isExternal ?? isMenuExternalLink(this.validateForm.get('newLinkFlag')?.value);
    this.isExternalLink = external;
    this.pathPrefix = external ? '' : this.basePathPrefix;
  }

  ngOnInit(): void {
    this.initForm();
    this.validateForm
      .get('newLinkFlag')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.syncPathPrefix(isMenuExternalLink(value));
        this.cdr.markForCheck();
      });
    if (!this.nzModalData) {
      return;
    }
    this.codePrefix = this.nzModalData.codePrefix ?? '';
    this.basePathPrefix = this.nzModalData.pathPrefix ?? '';
    if (this.nzModalData.menuType) {
      this.changeMenuType(this.nzModalData.menuType);
    }
    const { codePrefix: _codePrefix, pathPrefix: _pathPrefix, ...formData } = this.nzModalData;
    this.validateForm.patchValue(formData);
    this.syncPathPrefix();
  }
}
