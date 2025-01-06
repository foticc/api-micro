import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { SSEService } from '@app/pages/zpage/api/sse.service';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTimelineComponent, NzTimelineItemComponent } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'app-sse',
  imports: [NzCardComponent, NzButtonComponent, NzTimelineItemComponent, NzTimelineComponent, NzWaveDirective],
  templateUrl: './sse.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './sse.component.less'
})
export class SseComponent implements OnDestroy {
  msg: string[] = [];
  private subscription: Subscription | null = null;

  private service: SSEService = inject(SSEService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);

  connect(): void {
    this.subscription = this.service.connect().subscribe({
      next: data => {
        console.log('Received data:', data);
        this.pushData(data);
      },
      error: error => {
        console.error('SSE error:', error);
        this.clear();
        this.message.warning('已经断开连接');
      }
    });
  }

  break(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private pushData(data: string): void {
    this.msg.push(data);
    this.cdr.detectChanges();
  }

  clear(): void {
    this.msg.length = 0;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.break();
  }
}
