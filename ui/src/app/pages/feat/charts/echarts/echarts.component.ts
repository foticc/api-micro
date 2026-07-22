import { ComponentPortal, ComponentType, Portal, PortalModule } from '@angular/cdk/portal';
import { Component, OnInit, AfterViewInit, TemplateRef, viewChild, signal } from '@angular/core';

import { AdvancedComponent } from '@app/pages/feat/charts/echarts/advanced/advanced.component';
import { SeriesComponent } from '@app/pages/feat/charts/echarts/series/series.component';
import { StartedComponent } from '@app/pages/feat/charts/echarts/started/started.component';
import { PageHeaderType, PageHeaderComponent } from '@shared/components/page-header/page-header.component';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

enum TabEnum {
  Started,
  Advanced,
  Series
}

type targetComp = StartedComponent | AdvancedComponent | SeriesComponent;

@Component({
  selector: 'app-echarts',
  templateUrl: './echarts.component.html',

  imports: [PageHeaderComponent, PortalModule, NzTabsModule]
})
export class EchartsComponent implements OnInit, AfterViewInit {
  pageHeaderInfo: Partial<PageHeaderType> = {
    title: 'Echarts',
    breadcrumb: ['首页', '功能', '图表', 'Echarts'],
    desc: 'Echarts的示例内容'
  };
  readonly headerFooter = viewChild.required<TemplateRef<NzSafeAny>>('headerFooter');

  tabEnum = TabEnum;
  currentSelTab = signal<number>(this.tabEnum.Started);
  componentArray: Array<ComponentType<targetComp>> = [StartedComponent, AdvancedComponent, SeriesComponent];
  componentPortal?: ComponentPortal<targetComp>;
  selectedPortal!: Portal<NzSafeAny>;

  to(tabIndex: TabEnum): void {
    this.currentSelTab.set(tabIndex);
    this.componentPortal = new ComponentPortal(this.componentArray[tabIndex]);
    this.selectedPortal = this.componentPortal;
  }

  ngOnInit(): void {
    this.to(this.tabEnum.Started);
  }

  ngAfterViewInit(): void {
    this.pageHeaderInfo = {
      title: 'Echarts',
      desc: '本来是展示ngx-echarts的基本操作，不过我认为展示第三方库的使用方法没有意义，所以这里改成了portal区块化各个功能的演示示例。如果你要看echarts的相关例子，请下载v21以及之前的antd admin代码',
      breadcrumb: ['首页', '功能', '图表', 'Echarts'],
      footer: this.headerFooter()
    };
  }
}
