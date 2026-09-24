import { Route } from '@angular/router';

export default [
  { path: '', redirectTo: 'product', pathMatch: 'full' },
  {
    path: 'product',
    title: 'IoT 产品',
    data: { key: 'iot-product' },
    loadComponent: () => import('./product/iot-product.component').then(m => m.IotProductComponent)
  },
  {
    path: 'device',
    title: 'IoT 设备',
    data: { key: 'iot-device' },
    loadComponent: () => import('./device/iot-device.component').then(m => m.IotDeviceComponent)
  },
  {
    path: 'property',
    title: 'IoT 测点',
    data: { key: 'iot-property' },
    loadComponent: () => import('./property/iot-property.component').then(m => m.IotPropertyComponent)
  },
  {
    path: 'demo',
    title: 'IoTDB 联调',
    data: { key: 'iot-demo' },
    loadComponent: () => import('./demo/iot-demo.component').then(m => m.IotDemoComponent)
  }
] satisfies Route[];
