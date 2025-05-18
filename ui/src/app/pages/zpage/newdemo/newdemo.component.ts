import { Component, OnInit, ViewChild, AfterViewInit, inject, input } from '@angular/core';

import { MenuTree, NnnService } from '@app/pages/zpage/api/nnn.service';
import { BasicConfirmModalComponent } from '@widget/base-modal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzFormatEmitEvent, NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzTreeComponent } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-newdemo',
  imports: [NzTreeComponent, NzButtonComponent],
  standalone: true,
  templateUrl: './newdemo.component.html',
  styleUrl: './newdemo.component.less'
})
export class NewdemoComponent extends BasicConfirmModalComponent implements OnInit, AfterViewInit {
  private service: NnnService = inject(NnnService);

  readonly roleId: number = inject(NZ_MODAL_DATA);
  @ViewChild('nzTreeComponent', { static: false }) nzTreeComponent!: NzTreeComponent;
  defaultCheckedKeys = [125, 138];
  defaultSelectedKeys = [];
  defaultExpandedKeys = [120];

  nodes: NzTreeNodeOptions[] = [];

  nzClick(event: NzFormatEmitEvent): void {}

  nzCheck(event: NzFormatEmitEvent): void {
    if (event.eventName === 'check') {
      let nzTreeNodes = this.nzTreeComponent.getTreeNodes();
      let flattenCanceledNodes = this.getFlattenCanceledNodes(nzTreeNodes).filter(f => {
        return f.isChecked || f.isHalfChecked;
      });
      console.log(flattenCanceledNodes);
    }
    // console.log(this.nzTreeComponent.getCheckedNodeList(), this.nzTreeComponent.getSelectedNodeList(), this.nzTreeComponent.getExpandedNodeList());
  }

  // nzSelectedKeys change
  nzSelect(keys: string[]): void {
    console.log(keys, this.nzTreeComponent.getSelectedNodeList());
  }

  ngAfterViewInit(): void {
    // get node by key: '10011'
    // use tree methods
  }

  ngOnInit(): void {
    this.service.getMenuTree(this.roleId).subscribe((data: NzTreeNodeOptions[]) => {
      this.nodes = [...data];
      // this.defaultCheckedKeys = [...this.defaultCheckedKeys];
      // this.defaultSelectedKeys = [...this.defaultSelectedKeys];
      // this.defaultExpandedKeys = [...this.defaultExpandedKeys];
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
}
