import { Service, signal } from '@angular/core';
import { ViewTransitionInfo } from '@angular/router';

@Service()
export class ViewTransitionService {
  currentTransition = signal<ViewTransitionInfo | null>(null);
}
