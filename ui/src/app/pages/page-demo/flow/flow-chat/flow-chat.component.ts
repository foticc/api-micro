import { Component } from '@angular/core';

import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-flow-chat',
  templateUrl: './flow-chat.component.html',
  styleUrl: './flow-chat.component.less',

  imports: [PageHeaderComponent, NzCardModule, NzResultModule, NzGridModule, NzButtonModule, NzTooltipModule, NzIconModule]
})
export class FlowChatComponent {
  pageHeaderInfo: Partial<PageHeaderType> = {
    title: '流程编辑器，有了流程图，我就该知道未来该做什么了',
    breadcrumb: ['首页', '扩展功能', '图形编辑器', '流程图'],
    desc: '我希望antd admin功能纯粹，尽量减少依赖，如果想看流程图原本的实现，请看https://github.com/huajian123/ng-antd-admin/releases/tag/v22.0'
  };
}
