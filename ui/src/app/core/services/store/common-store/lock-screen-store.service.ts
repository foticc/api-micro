import { Service, signal } from '@angular/core';

export interface LockScreenFlag {
  locked: boolean;
  password: string;
  beforeLockPath: string;
}

/**
 * 锁屏状态service的store
 */
@Service()
export class LockScreenStoreService {
  lockScreenSignalStore = signal<LockScreenFlag>({ locked: false, password: '', beforeLockPath: '' });
}
