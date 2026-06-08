import { Component } from '@angular/core';

import { NumberLoopPipe } from '@shared/pipes/number-loop.pipe';

import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-menu111',
  templateUrl: './menu112.component.html',

  imports: [NzInputModule, NumberLoopPipe]
})
export class Menu112Component {}
