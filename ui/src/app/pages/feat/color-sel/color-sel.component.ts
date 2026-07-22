import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-color-sel',
  templateUrl: './color-sel.component.html',
  styleUrl: './color-sel.component.less',

  imports: [FormsModule, PageHeaderComponent, NzCardModule, NzGridModule, NzIconModule, NzColorPickerModule]
})
export class ColorSelComponent {
  // 基本颜色
  color = signal('#2889e9');

  // 不同格式的颜色
  hexColor = signal('#1677ff');
  rgbColor = signal('rgb(22, 119, 255)');
  hsbColor = signal('hsb(215, 91%, 100%)');

  // 不同尺寸
  largeColor = signal('#52c41a');
  defaultColor = signal('#fa8c16');
  smallColor = signal('#f5222d');

  // 禁用透明度
  noAlphaColor = signal('#722ed1');

  // 显示文本
  textColor = signal('#eb2f96');

  pageHeaderInfo: Partial<PageHeaderType> = {
    title: '颜色选择器',
    desc: '基于 ng-zorro-antd NzColorPickerModule，支持多种格式、尺寸和配置选项',
    breadcrumb: ['首页', '功能', '颜色选择器']
  };
}
