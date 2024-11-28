import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { JwtHelperService } from '@auth0/angular-jwt';

export interface UserInfo {
  userId: string;
  authCode: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  private userInfo$ = new BehaviorSubject<UserInfo>({ userId: '', authCode: [] });

  parsToken(token: string): UserInfo {
    const helper = new JwtHelperService();
    try {
      const { authorities, sub } = helper.decodeToken(token);
      return {
        userId: sub,
        authCode: authorities
      };
    } catch (e) {
      return {
        userId: '',
        authCode: []
      };
    }
  }

  setUserInfo(userInfo: UserInfo): void {
    this.userInfo$.next(userInfo);
  }

  getUserInfo(): Observable<UserInfo> {
    return this.userInfo$.asObservable();
  }
}
