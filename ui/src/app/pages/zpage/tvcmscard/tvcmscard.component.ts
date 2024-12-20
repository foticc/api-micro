import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AcDetailService } from '@app/pages/zpage/api/acdetail.service';
import { NzAvatarComponent } from 'ng-zorro-antd/avatar';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent, NzCardMetaComponent } from 'ng-zorro-antd/card';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzPaginationComponent } from 'ng-zorro-antd/pagination';

interface SearchParam {
  name: string;
  desc: string;
}
@Component({
  selector: 'app-tvcmscard',
  imports: [
    NzAvatarComponent,
    NzCardComponent,
    NzCardMetaComponent,
    NzColDirective,
    NzIconDirective,
    NzRowDirective,
    NzPaginationComponent,
    FormsModule,
    NzButtonComponent,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzWaveDirective,
    ReactiveFormsModule,
    NzListModule
  ],
  templateUrl: './tvcmscard.component.html',
  standalone: true,
  styleUrl: './tvcmscard.component.less'
})
export class TvcmscardComponent implements OnInit {
  searchParam: Partial<SearchParam> = {};
  list: any[] = [];
  pageIndex = 1;
  pageSize = 12;
  total = 0;
  loading: boolean = true;

  private cdr = inject(ChangeDetectorRef);
  private api = inject(AcDetailService);

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    const params = {
      size: this.pageSize!,
      page: this.pageIndex!,
      ...this.searchParam
    };
    this.api
      .fetchPage(params)
      .pipe(
        finalize(() => {
          this.listChangeDectction(false);
        })
      )
      .subscribe(result => {
        const { content, page } = result;
        this.list = content;
        this.total = page.totalElements;
        this.pageSize = page.size;
        this.pageIndex = page.number;
      });
  }

  changePageIndex(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadList();
  }

  changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.loadList();
  }

  listChangeDectction(loading: boolean): void {
    this.loading = loading;
    this.cdr.detectChanges();
  }
}
