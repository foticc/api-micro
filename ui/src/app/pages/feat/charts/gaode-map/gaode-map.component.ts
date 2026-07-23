import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// import AMapLoader from '@amap/amap-jsapi-loader';
import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { WaterMarkComponent } from '@shared/components/water-mark/water-mark.component';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-gaode-map',
  templateUrl: './gaode-map.component.html',

  imports: [PageHeaderComponent, NzCardModule, WaterMarkComponent, NzInputModule, FormsModule]
})
export class GaodeMapComponent {
  pageHeaderInfo: Partial<PageHeaderType> = {
    title: '我希望antd admin纯粹，所以移除了高德地图的功能，如果想看原本的实现，请看https://github.com/huajian123/ng-antd-admin/releases/tag/v22.0',
    breadcrumb: ['首页', '功能', '图表', '高德地图']
  };
}
