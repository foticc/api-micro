import { inject, Service, Type } from '@angular/core';
import { Observable } from 'rxjs';

import { ModalResponse, ModalWrapService } from '@widget/base-modal';
import { TaskModalComponent } from '@widget/biz-widget/task/task-modal.component';

import { ModalOptions } from 'ng-zorro-antd/modal';

export interface TaskModalData {
  id?: number;
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  assignee?: string;
  dueDate?: string;
}

@Service()
export class TaskModalService {
  private modalWrapService = inject(ModalWrapService);

  protected getContentComponent(): Type<TaskModalComponent> {
    return TaskModalComponent;
  }

  public show(modalOptions: ModalOptions = {}, modalData?: TaskModalData): Observable<ModalResponse> {
    return this.modalWrapService.show<TaskModalComponent, TaskModalData>(this.getContentComponent(), modalOptions, modalData);
  }
}
