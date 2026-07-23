import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';
// import { EditorComponent } from '@tinymce/tinymce-angular';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-rich-text',
  templateUrl: './rich-text.component.html',
  imports: [PageHeaderComponent, NzCardModule, FormsModule, NzFormModule, ReactiveFormsModule, NzGridModule]
})
export class RichTextComponent {
  pageHeaderInfo: Partial<PageHeaderType> = {
    title: '富文本我删除掉了，我希望antd admin相对纯粹，尽量少引用第三方库，如果想看原本的实现，请看https://github.com/huajian123/ng-antd-admin/releases/tag/v22.0',
    breadcrumb: ['首页', '扩展功能', '富文本']
  };
}
