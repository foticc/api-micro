import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { WaterMarkComponent } from '@shared/components/water-mark/water-mark.component';
import { NumberLoopPipe } from '@shared/pipes/number-loop.pipe';

import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-workbench',
  templateUrl: './workbench.component.html',
  styleUrl: './workbench.component.less',

  imports: [
    FormsModule,
    PageHeaderComponent,
    NzGridModule,
    WaterMarkComponent,
    NzCardModule,
    NzTypographyModule,
    NzListModule,
    NzButtonModule,
    NzWaveModule,
    NzIconModule,
    NzAvatarModule,
    NzStatisticModule,
    NzProgressModule,
    NzRateModule,
    DecimalPipe,
    NumberLoopPipe
  ]
})
export class WorkbenchComponent {
  readonly pageHeaderContent = viewChild.required<TemplateRef<NzSafeAny>>('pageHeaderContent');
  msg = inject(NzMessageService);

  // 能力评估数据（转换为列表展示格式）
  radarData = [
    { name: 'Design', score: 70 },
    { name: 'Development', score: 60 },
    { name: 'Marketing', score: 50 },
    { name: 'Users', score: 40 },
    { name: 'Test', score: 60 },
    { name: 'Language', score: 70 },
    { name: 'Technology', score: 50 },
    { name: 'Support', score: 30 },
    { name: 'Sales', score: 60 },
    { name: 'UX', score: 50 }
  ];
  pageHeaderInfo = computed<Partial<PageHeaderType>>(() => ({
    title: '工作台',
    breadcrumb: ['首页', 'Dashboard', '工作台'],
    desc: this.pageHeaderContent()
  }));
}
