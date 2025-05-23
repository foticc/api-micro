import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { ActionCode } from '@config/actionCode';
import { TokenKey, TokenPre } from '@config/constant';
import { SimpleReuseStrategy } from '@core/services/common/reuse-strategy';
import { TabService } from '@core/services/common/tab.service';
import { WindowService } from '@core/services/common/window.service';
import { Menu } from '@core/services/types';
import { LoginService } from '@services/login/login.service';
import { MenuStoreService } from '@store/common-store/menu-store.service';
import { UserInfo, UserInfoStoreService } from '@store/common-store/userInfo-store.service';
import { fnFlatDataHasParentToTree } from '@utils/treeTableTools';

/*
 * 登录/登出
 * */
@Injectable({
  providedIn: 'root'
})
export class LoginInOutService {
  private destroyRef = inject(DestroyRef);
  private activatedRoute = inject(ActivatedRoute);
  private tabService = inject(TabService);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private userInfoService = inject(UserInfoStoreService);
  private menuService = inject(MenuStoreService);
  private windowServe = inject(WindowService);

  // 通过用户所拥有的权限码来获取菜单数组
  getMenuByUserAuthCode(authCode: string[]): Observable<Menu[]> {
    return this.loginService.getMenuByUserAuthCode(authCode);
  }

  loginIn(token: string): Promise<void> {
    return new Promise(resolve => {
      // 将 token 持久化缓存，请注意，如果没有缓存，则会在路由守卫中被拦截，不让路由跳转
      // 这个路由守卫在src/app/core/services/common/guard/judgeLogin.guard.ts
      this.windowServe.setSessionStorage(TokenKey, TokenPre + token);
      // 解析token ，然后获取用户信息
      const userInfo: UserInfo = this.userInfoService.parsToken(TokenPre + token);
      // 根据用户的id来获取当前用户所拥有的权限码
      this.userInfoService
        .getUserAuthCodeByUserId(userInfo.userId)
        .pipe(
          switchMap(autoCodeArray => {
            userInfo.authCode = autoCodeArray;
            // todo  这里是手动添加静态页面标签页操作中打开详情的按钮的权限，因为他们涉及到路由跳转，会走路由守卫，但是权限又没有通过后端管理，所以下面两行手动添加权限，实际操作中可以删除下面2行，如果你也有类似的需求，请全局搜索ActionCode.TabsDetail，这个需要在路由中配置一下
            userInfo.authCode.push(ActionCode.TabsDetail);
            userInfo.authCode.push(ActionCode.SearchTableDetail);
            // 将用户信息缓存到全局service中
            this.userInfoService.$userInfo.set(userInfo);
            return this.getMenuByUserAuthCode(userInfo.authCode);
          }),
          finalize(() => {
            resolve();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(menus => {
          menus = menus.filter(item => {
            item.selected = false;
            item.open = false;
            return item.menuType === 'C';
          });
          const temp = fnFlatDataHasParentToTree(menus);
          // 存储menu
          this.menuService.setMenuArrayStore(temp);
          resolve();
        });
    });
  }

  // 清除Tab缓存,是与路由复用相关的东西
  clearTabCash(): Promise<void> {
    return SimpleReuseStrategy.deleteAllRouteSnapshot(this.activatedRoute.snapshot).then(() => {
      return new Promise(resolve => {
        // 清空tab
        this.tabService.clearTabs();
        resolve();
      });
    });
  }

  clearSessionCash(): Promise<void> {
    return new Promise(resolve => {
      this.windowServe.removeSessionStorage(TokenKey);
      this.menuService.setMenuArrayStore([]);
      resolve();
    });
  }

  loginOut(): Promise<void> {
    this.loginService.loginOut().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    return this.router
      .navigate(['/login/login-form'])
      .then(() => {
        return this.clearTabCash();
      })
      .then(() => {
        return this.clearSessionCash();
      });
  }
}
