import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { JwtHelperService } from '@auth0/angular-jwt';
import { AccountService } from '@services/system/account.service';

export interface UserInfo {
  userName: string;
  userId: number;
  authCode: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserInfoStoreService {
  $userInfo = signal<UserInfo>({ userId: -1, userName: '', authCode: [] });

  userService = inject(AccountService);

  parsToken(token: string): UserInfo {
    const helper = new JwtHelperService();
    try {
      const { userName, sub, uid } = helper.decodeToken(token);
      console.log('userName,sub,uid', {
        userId: uid || sub,
        userName: userName || sub,
        authCode: []
      });
      return {
        userId: uid || sub,
        userName: userName || sub,
        authCode: []
      };
    } catch (e) {
      return {
        userId: -1,
        userName: '',
        authCode: []
      };
    }
  }

  getUserAuthCodeByUserId(userId: number): Observable<string[]> {
    return this.userService.getAccountAuthCode(userId);
  }
}
