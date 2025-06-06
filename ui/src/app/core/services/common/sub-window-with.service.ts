import { BreakpointObserver } from '@angular/cdk/layout';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import { SideCollapsedMaxWidth, TopCollapsedMaxWidth } from '@config/constant';
import { ThemeService } from '@store/common-store/theme.service';
import { EquipmentWidth, WindowsWidthService } from '@store/common-store/windows-width.service';

/*监听屏幕宽度服务*/
@Injectable({
  providedIn: 'root'
})
export class SubWindowWithService {
  subWidthObj: Record<string, [EquipmentWidth, [number, number]]> = {
    '(max-width: 575.98px)': [EquipmentWidth.xs, [0, 575.98]],
    '(min-width: 576px) and (max-width: 767.98px)': [EquipmentWidth.sm, [576, 767.98]],
    '(min-width: 768px) and (max-width: 991.98px)': [EquipmentWidth.md, [768, 991.98]],
    '(min-width: 992px) and (max-width: 1199.98px)': [EquipmentWidth.lg, [992, 1199.98]],
    '(min-width: 1200px) and (max-width: 1599.98px)': [EquipmentWidth.xl, [1200, 1599.98]],
    '(min-width: 1600px)': [EquipmentWidth.xxl, [1600, 9999]]
  };
  private destroyRef = inject(DestroyRef);
  private winWidthService = inject(WindowsWidthService);
  private breakpointObserver = inject(BreakpointObserver);
  private themesService = inject(ThemeService);
  // todo signal 修正
  themesOptions$ = toObservable(this.themesService.$themesOptions);
  // 监听主题（是top，还是side），确定over模式最小宽度
  subWidthForTheme(): void {
    this.themesOptions$
      .pipe(
        switchMap(res => {
          let maxWidth = '';
          if (res.mode === 'side' || (res.mode === 'mixin' && !res.splitNav)) {
            maxWidth = `(max-width: ${SideCollapsedMaxWidth}px)`;
          } else if (res.mode === 'top' || (res.mode === 'mixin' && res.splitNav)) {
            maxWidth = `(max-width: ${TopCollapsedMaxWidth}px)`;
          }
          // 可以入参[Breakpoints.Small, Breakpoints.XSmall]
          return this.breakpointObserver.observe([maxWidth]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        const isOverMode = result.matches;
        this.themesService.$isOverModeTheme.set(isOverMode);
        // 是over模式，展开折叠状态得左侧菜单
        if (isOverMode) {
          this.themesService.$isCollapsed.set(false);
        }
      });
  }

  // 根据传入的屏幕宽度判断是在哪个栅格节点
  judgeWindowsWidth(width: number): EquipmentWidth {
    let currentPoint: EquipmentWidth;
    Object.values(this.subWidthObj).forEach(item => {
      if (width >= item[1][0] && width <= item[1][1]) {
        currentPoint = item[0];
      }
    });
    return currentPoint!;
  }

  // 监听浏览器宽度用于通用的栅格系统
  subWidthForStore(): void {
    this.breakpointObserver
      .observe(Object.keys(this.subWidthObj))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        Object.keys(res.breakpoints).forEach(item => {
          if (res.breakpoints[item]) {
            this.winWidthService.$windowWidth.set(this.subWidthObj[item][0]);
          }
        });
      });
  }

  subWindowWidth(): void {
    this.subWidthForTheme();
    this.subWidthForStore();
    // 初始化的时候就设置当前节点
    this.winWidthService.$windowWidth.set(this.judgeWindowsWidth(window.innerWidth));
  }
}
