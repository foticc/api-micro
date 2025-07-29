import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { SetMenuService } from '@app/pages/zpage/api/set-menu.service';
import { BasicConfirmModalComponent } from '@widget/base-modal';

import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzFormatEmitEvent, NzTreeNode, NzTreeNodeKey } from 'ng-zorro-antd/core/tree';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTreeComponent } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-newdemo',
  imports: [NzTreeComponent, NzButtonComponent, NzIconDirective, FormsModule, NzSkeletonModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './set-menu-modal.component.html',
  styleUrl: './set-menu-modal.component.less'
})
export class SetMenuModalComponent extends BasicConfirmModalComponent implements OnInit {
  private service: SetMenuService = inject(SetMenuService);
  private messageService: NzMessageService = inject(NzMessageService);

  readonly roleId: number = inject(NZ_MODAL_DATA);
  destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('nzTreeComponent', { static: false }) nzTreeComponent!: NzTreeComponent;
  // nzSelectedKeys change
  isSpinning: boolean = false;
  nodes: NzTreeNode[] = [];
  nzCheckedKeys: NzTreeNodeKey[] = [];
  nzAsyncData: boolean = false;

  nzClick(event: NzFormatEmitEvent): void {}

  nzCheck(event: NzFormatEmitEvent): void {
    if (event.eventName === 'check') {
      const nzTreeNodes = this.nzTreeComponent.getTreeNodes();
      const flattenCanceledNodes = this.getFlattenNodes(nzTreeNodes).filter(f => {
        return f.isChecked || f.isHalfChecked;
      });
    }
    // console.log(this.nzTreeComponent.getCheckedNodeList(), this.nzTreeComponent.getSelectedNodeList(), this.nzTreeComponent.getExpandedNodeList());
  }

  nzSelect(keys: string[]): void {}

  ngOnInit(): void {
    this.spinning(true);
    this.service
      .getMenuTree(this.roleId)
      .pipe(
        finalize(() => {
          this.spinning(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data: NzTreeNode[]) => {
        this.nodes = [...data];
        this.nzCheckedKeys = this.getCheckedNode(data);
        this.spinning(false);
        this.cdr.detectChanges();
      });
  }

  getFlattenNodes(node: NzTreeNode[]): NzTreeNode[] {
    const stack: NzTreeNode[] = [...node];
    const result: NzTreeNode[] = [];

    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      result.push(currentNode);

      if (currentNode.children) {
        // 反向入栈以保证顺序
        for (let i = currentNode.children.length - 1; i >= 0; i--) {
          stack.push(currentNode.children[i]);
        }
      }
    }
    return result;
  }

  getCheckedNode(nodes: NzTreeNode[]): number[] {
    return this.getFlattenNodes(nodes)
      .filter(f => {
        return f.isChecked;
      })
      .map(m => {
        return Number(m.key);
      });
  }

  setMenu(): void {
    const nzTreeNodes = this.nzTreeComponent.getTreeNodes();
    const checkedNode = this.getCheckedNode(nzTreeNodes);
    this.loading(true);
    this.service
      .assignMenuToRole(this.roleId, checkedNode)
      .pipe(
        finalize(() => {
          this.loading(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        this.messageService.success('设置成功!');
      });
  }

  loading(loading: boolean): void {
    this.nzAsyncData = loading;
  }

  spinning(isSpinning: boolean): void {
    this.isSpinning = isSpinning;
  }

  getCurrentValue(): NzSafeAny {
    return 1;
  }
}
