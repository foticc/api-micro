import { Directive, inject } from '@angular/core';

import { FullscreenService } from '@core/services/common/fullscreen.service';

@Directive({
  selector: '[appToggleFullscreen]',
  exportAs: 'appToggleFullscreen',
  host: {
    '(click)': 'onClick()'
  }
})
export class ToggleFullscreenDirective {
  private readonly fullscreenService = inject(FullscreenService);
  readonly isFullscreenFlag = this.fullscreenService.isFullscreen;

  onClick(): void {
    this.fullscreenService.toggle();
  }
}
