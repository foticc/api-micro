import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { ApiResource, ApiResourceService } from '@app/pages/zpage/apidemo/api-resource.service';
import { SearchCommonVO } from '@core/services/types';
import { CardTableWrapComponent } from '@shared/components/card-table-wrap/card-table-wrap.component';
import { ModalWrapService } from '@widget/base-modal';

import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-demo-table',
  imports: [CardTableWrapComponent, NzButtonComponent, NzIconDirective, NzTableModule],
  templateUrl: './demo-table.html',
  standalone: true,
  styleUrl: './demo-table.less'
})
export class DemoTable implements OnInit {
  checked = false;
  indeterminate = false;
  listOfData: readonly ApiResource[] = [];
  listOfCurrentPageData: readonly ApiResource[] = [];
  setOfCheckedId = new Set<number>();

  private apiResourceService = inject(ApiResourceService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(ModalWrapService);
  destroyRef = inject(DestroyRef);

  total = 0;
  loading = true;
  pageSize = 10;
  pageIndex = 1;

  getDataList(pageIndex: number, pageSize: number, sortField: string | null, sortOrder: string | null, filter: Array<{ key: string; value: string[] }>): void {
    this.loading = true;
    const params: SearchCommonVO<NzSafeAny> = {
      page: pageIndex,
      size: pageSize,
      filters: filter
    };
    this.apiResourceService
      .page(params)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        const { content, page } = data;
        this.listOfData = [...content];
        this.total = page.totalElements;
        this.pageSize = page.size;
        this.pageIndex = page.number;
        this.loading = false;
      });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    console.log(params);
    const { pageSize, pageIndex, sort, filter } = params;
    const currentSort = sort.find(item => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    this.getDataList(pageIndex, pageSize, sortField, sortOrder, filter);
  }

  reloadTable(): void {}

  allDel(): void {}

  add(): void {}

  ngOnInit(): void {
    this.getDataList(this.pageIndex, this.pageSize, null, null, []);
  }

  onCurrentPageDataChange($event: ApiResource[]): void {}

  onAllChecked($event: boolean): void {}
}
