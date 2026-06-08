import { Service, signal } from '@angular/core';

export enum EquipmentWidth {
  xs,
  sm,
  md,
  lg,
  xl,
  xxl
}

@Service()
export class WindowsWidthService {
  $windowWidth = signal<EquipmentWidth>(EquipmentWidth.xxl);
}
