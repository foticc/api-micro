import { Service, signal } from '@angular/core';

@Service()
export class SpinService {
  $globalSpinStore = signal(false);
}
