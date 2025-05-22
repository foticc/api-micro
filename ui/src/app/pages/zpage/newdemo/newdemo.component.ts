import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { NnnService } from '@app/pages/zpage/api/nnn.service';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCheckboxComponent } from 'ng-zorro-antd/checkbox';
import { NzFormatEmitEvent, NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzTreeComponent } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-newdemo',
  imports: [NzTreeComponent, NzButtonComponent, NzSpinComponent, NzIconDirective, FormsModule, NzCheckboxComponent, NzSkeletonComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newdemo.component.html',
  styleUrl: './newdemo.component.less'
})
export class NewdemoComponent extends BasicConfirmModalComponent implements OnInit, AfterViewInit {
  private service: NnnService = inject(NnnService);

  readonly roleId: number = inject(NZ_MODAL_DATA);
  destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('nzTreeComponent', { static: false }) nzTreeComponent!: NzTreeComponent;
  // nzSelectedKeys change
  isSpinning: boolean = false;
  nodes: NzTreeNodeOptions[] = [];

  nzClick(event: NzFormatEmitEvent): void {}

  nzCheck(event: NzFormatEmitEvent): void {
    if (event.eventName === 'check') {
      let nzTreeNodes = this.nzTreeComponent.getTreeNodes();
      let flattenCanceledNodes = this.getFlattenCanceledNodes(nzTreeNodes).filter(f => {
        return f.isChecked || f.isHalfChecked;
      });
    }
    // console.log(this.nzTreeComponent.getCheckedNodeList(), this.nzTreeComponent.getSelectedNodeList(), this.nzTreeComponent.getExpandedNodeList());
  }

  nzSelect(keys: string[]): void {}

  ngAfterViewInit(): void {
    // get node by key: '10011'
    // use tree methods
  }

  ngOnInit(): void {
    this.service
      .getMenuTree(this.roleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: NzTreeNodeOptions[]) => {
        this.nodes = [...data];
        this.cdr.detectChanges();
      });
  }

  getFlattenCanceledNodes(node: NzTreeNode[]): NzTreeNode[] {
    const stack: NzTreeNode[] = [...node];
    const result: any[] = [];

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

  setMenu(): void {
    let nzTreeNodes = this.nzTreeComponent.getTreeNodes();
    let flattenCanceledNodes = this.getFlattenCanceledNodes(nzTreeNodes)
      .filter(f => {
        return f.isChecked || f.isHalfChecked;
      })
      .map(m => {
        return Number(m.key);
      });
    this.service.assignMenuToRole(this.roleId, flattenCanceledNodes).subscribe(res => {
      console.log('bind');
    });
  }

  getCurrentValue(): NzSafeAny {
    return 1;
  }

  expandOnChange(e: boolean): void {
    console.log(e);
  }

  allCheckedOnChange(e: boolean): void {
    console.log(e);
  }
}
