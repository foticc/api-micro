import { isPlatformBrowser } from '@angular/common';
import { inject, Service, PLATFORM_ID, DOCUMENT, signal } from '@angular/core';

@Service()
export class FullscreenService {
  private readonly isBrowser: boolean;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);

  readonly isFullscreen = signal(false);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.doc.addEventListener('fullscreenchange', () => {
        this.isFullscreen.set(!!this.doc.fullscreenElement);
      });
    }
  }

  get isEnabled(): boolean {
    return this.isBrowser && !!this.doc.fullscreenEnabled;
  }

  toggle(element?: Element): void {
    if (!this.isEnabled) return;
    if (this.doc.fullscreenElement) {
      this.exit();
    } else {
      this.request(element);
    }
  }

  request(element?: Element): void {
    if (!this.isEnabled) return; // 1. 检查浏览器是否支持全屏
    const target = element || this.doc.documentElement; // 2. 确定要全屏的目标元素
    target.requestFullscreen?.();
  }

  exit(): void {
    if (!this.isEnabled || !this.doc.fullscreenElement) return;
    this.doc.exitFullscreen?.();
  }
}
