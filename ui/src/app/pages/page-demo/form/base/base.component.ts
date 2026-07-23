import { Component, DestroyRef, inject, signal, effect } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

interface BaseFormModel {
  title: string;
  date: Date[] | null;
  desc: string;
  standard: string;
  client: string;
  invitedCommenter: string;
  weights: number | null;
  isPublic: string;
}

import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { WaterMarkComponent } from '@shared/components/water-mark/water-mark.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrl: './base.component.less',

  imports: [
    PageHeaderComponent,
    NzCardModule,
    WaterMarkComponent,
    FormField,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzRadioModule,
    NzSelectModule,
    NzButtonModule,
    NzWaveModule
  ]
})
export class BaseComponent {
  pageHeaderInfo: Partial<PageHeaderType> = {
    title: '基础表单',
    desc: '表单页用于向用户收集或验证信息，基础表单常见于数据项较少的表单场景。',
    breadcrumb: ['首页', '表单页', '基础表单']
  };
  listOfOption = [
    { label: '同事甲', value: '同事甲' },
    { label: '同事乙', value: '同事乙' },
    { label: '同事丙', value: '同事丙' }
  ];
  destroyRef = inject(DestroyRef);

  formModel = signal<BaseFormModel>({
    title: '',
    date: null,
    desc: '',
    standard: '',
    client: '',
    invitedCommenter: '',
    weights: null,
    isPublic: ''
  });

  validateForm = form(this.formModel, schemaPath => {
    required(schemaPath.title, { message: '请输入标题' });
    required(schemaPath.date, { message: '请选择起止日期' });
    required(schemaPath.desc, { message: '请输入目标描述' });
    required(schemaPath.standard, { message: '请输入衡量标准' });
  });

  submitForm(): void {
    if (this.validateForm().invalid()) {
      // 标记所有字段为 touched，使验证错误提示显示
      this.validateForm().markAsTouched();
      return;
    }
    console.log('表单提交:', this.formModel());
    // 提交逻辑
  }

  // 使用 effect 监听表单数据变化
  private formChangeEffect = effect(() => {
    const formValue = this.formModel();
    console.log('表单数据变化:', formValue);
  });
}
