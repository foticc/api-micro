import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
declare let BMap: NzSafeAny;

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.less',

  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzBreadCrumbModule,
    NzGridModule,
    NzListModule,
    NzStatisticModule,
    NzTypographyModule,
    NzEmptyModule,
    NzProgressModule,
    NzRateModule,
    NzTagModule,
    DecimalPipe,
    PercentPipe,
    NzAlertComponent,
    NzIconDirective
  ]
})
export class MonitorComponent {
  readonly deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30;
  miniAreaData = [264, 274, 284, 294, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470];
  wordCloudData = [
    {
      x: 'China',
      value: 1383220000,
      category: 'asia'
    },
    {
      x: 'India',
      value: 1316000000,
      category: 'asia'
    },
    {
      x: 'United States',
      value: 324982000,
      category: 'america'
    },
    {
      x: 'Indonesia',
      value: 263510000,
      category: 'asia'
    },
    {
      x: 'Brazil',
      value: 207505000,
      category: 'america'
    },
    {
      x: 'Pakistan',
      value: 196459000,
      category: 'asia'
    },
    {
      x: 'Nigeria',
      value: 191836000,
      category: 'africa'
    },
    {
      x: 'Bangladesh',
      value: 162459000,
      category: 'asia'
    },
    {
      x: 'Russia',
      value: 146804372,
      category: 'europe'
    },
    {
      x: 'Japan',
      value: 126790000,
      category: 'asia'
    },
    {
      x: 'Mexico',
      value: 123518000,
      category: 'america'
    },
    {
      x: 'Ethiopia',
      value: 104345000,
      category: 'africa'
    },
    {
      x: 'Philippines',
      value: 104037000,
      category: 'asia'
    },
    {
      x: 'Egypt',
      value: 93013300,
      category: 'africa'
    },
    {
      x: 'Vietnam',
      value: 92700000,
      category: 'asia'
    },
    {
      x: 'Germany',
      value: 82800000,
      category: 'europe'
    },
    {
      x: 'Democratic Republic of the Congo',
      value: 82243000,
      category: 'africa'
    },
    {
      x: 'Iran',
      value: 80135400,
      category: 'asia'
    },
    {
      x: 'Turkey',
      value: 79814871,
      category: 'asia'
    },
    {
      x: 'Thailand',
      value: 68298000,
      category: 'asia'
    },
    {
      x: 'France',
      value: 67013000,
      category: 'europe'
    },
    {
      x: 'United Kingdom',
      value: 65110000,
      category: 'europe'
    },
    {
      x: 'Italy',
      value: 60599936,
      category: 'europe'
    },
    {
      x: 'Tanzania',
      value: 56878000,
      category: 'africa'
    },
    {
      x: 'South Africa',
      value: 55908000,
      category: 'africa'
    },
    {
      x: 'Myanmar',
      value: 54836000,
      category: 'asia'
    },
    {
      x: 'South Korea',
      value: 51446201,
      category: 'asia'
    },
    {
      x: 'Colombia',
      value: 49224700,
      category: 'america'
    },
    {
      x: 'Kenya',
      value: 48467000,
      category: 'africa'
    },
    {
      x: 'Spain',
      value: 46812000,
      category: 'europe'
    },
    {
      x: 'Argentina',
      value: 43850000,
      category: 'america'
    },
    {
      x: 'Ukraine',
      value: 42541633,
      category: 'europe'
    },
    {
      x: 'Sudan',
      value: 42176000,
      category: 'africa'
    },
    {
      x: 'Uganda',
      value: 41653000,
      category: 'africa'
    },
    {
      x: 'Algeria',
      value: 41064000,
      category: 'africa'
    },
    {
      x: 'Poland',
      value: 38424000,
      category: 'europe'
    },
    {
      x: 'Iraq',
      value: 37883543,
      category: 'asia'
    },
    {
      x: 'Canada',
      value: 36541000,
      category: 'america'
    },
    {
      x: 'Morocco',
      value: 34317500,
      category: 'africa'
    },
    {
      x: 'Saudi Arabia',
      value: 33710021,
      category: 'asia'
    },
    {
      x: 'Uzbekistan',
      value: 32121000,
      category: 'asia'
    },
    {
      x: 'Malaysia',
      value: 32063200,
      category: 'asia'
    },
    {
      x: 'Peru',
      value: 31826018,
      category: 'america'
    },
    {
      x: 'Venezuela',
      value: 31431164,
      category: 'america'
    },
    {
      x: 'Nepal',
      value: 28825709,
      category: 'asia'
    },
    {
      x: 'Angola',
      value: 28359634,
      category: 'africa'
    },
    {
      x: 'Ghana',
      value: 28308301,
      category: 'africa'
    },
    {
      x: 'Yemen',
      value: 28120000,
      category: 'asia'
    },
    {
      x: 'Afghanistan',
      value: 27657145,
      category: 'asia'
    },
    {
      x: 'Mozambique',
      value: 27128530,
      category: 'africa'
    },
    {
      x: 'Australia',
      value: 24460900,
      category: 'australia'
    },
    {
      x: 'North Korea',
      value: 24213510,
      category: 'asia'
    },
    {
      x: 'Taiwan',
      value: 23545680,
      category: 'asia'
    },
    {
      x: 'Cameroon',
      value: 23248044,
      category: 'africa'
    },
    {
      x: 'Ivory Coast',
      value: 22671331,
      category: 'africa'
    },
    {
      x: 'Madagascar',
      value: 22434363,
      category: 'africa'
    },
    {
      x: 'Niger',
      value: 21564000,
      category: 'africa'
    },
    {
      x: 'Sri Lanka',
      value: 21203000,
      category: 'asia'
    },
    {
      x: 'Romania',
      value: 19760000,
      category: 'europe'
    },
    {
      x: 'Burkina Faso',
      value: 19632147,
      category: 'africa'
    },
    {
      x: 'Syria',
      value: 18907000,
      category: 'asia'
    },
    {
      x: 'Mali',
      value: 18875000,
      category: 'africa'
    },
    {
      x: 'Malawi',
      value: 18299000,
      category: 'africa'
    },
    {
      x: 'Chile',
      value: 18191900,
      category: 'america'
    },
    {
      x: 'Kazakhstan',
      value: 17975800,
      category: 'asia'
    },
    {
      x: 'Netherlands',
      value: 17121900,
      category: 'europe'
    },
    {
      x: 'Ecuador',
      value: 16737700,
      category: 'america'
    },
    {
      x: 'Guatemala',
      value: 16176133,
      category: 'america'
    },
    {
      x: 'Zambia',
      value: 15933883,
      category: 'africa'
    },
    {
      x: 'Cambodia',
      value: 15626444,
      category: 'asia'
    },
    {
      x: 'Senegal',
      value: 15256346,
      category: 'africa'
    },
    {
      x: 'Chad',
      value: 14965000,
      category: 'africa'
    },
    {
      x: 'Zimbabwe',
      value: 14542235,
      category: 'africa'
    },
    {
      x: 'Guinea',
      value: 13291000,
      category: 'africa'
    },
    {
      x: 'South Sudan',
      value: 12131000,
      category: 'africa'
    },
    {
      x: 'Rwanda',
      value: 11553188,
      category: 'africa'
    },
    {
      x: 'Belgium',
      value: 11356191,
      category: 'europe'
    }
  ];
  constructor() {}

  // 词云标签颜色
  getTagColor(category: string): string {
    const colorMap: Record<string, string> = {
      asia: 'blue',
      america: 'green',
      europe: 'orange',
      africa: 'red',
      australia: 'purple'
    };
    return colorMap[category] || 'default';
  }

  // 进度条格式化
  formatPercent = (percent: number): string => `${percent}%`;
}
