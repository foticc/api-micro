import { Service, inject } from '@angular/core';

import { LangKey } from '@config/constant';
import { WindowService } from '@core/services/common/window.service';
import { Lang, LanguageService } from '@store/common-store/language.service';

@Service()
export class InitLangService {
  private windowServe = inject(WindowService);
  private languageService = inject(LanguageService);

  initLang(): void {
    const saved = this.windowServe.getStorage(LangKey) as Lang | null;
    this.languageService.setLang(saved ?? 'zh_CN');
  }
}
