import { Service, signal } from '@angular/core';

@Service()
export class SharedSignalService {
  readonly $sharedValue = signal('初始共享值');
}
