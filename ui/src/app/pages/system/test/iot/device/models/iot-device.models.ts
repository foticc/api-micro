import { IOT_STATUS_OPTIONS } from '@app/pages/system/test/iot/product/models/iot-product.models';

/** 与后端 IotDeviceDTO 对齐 */
export interface IotDevice {
  id?: number;
  productId: number;
  serialNo: string;
  nickname?: string;
  iotdbPath?: string;
  tslVersion?: number;
  fwVersion?: string;
  status?: string;
  lastOnlineAt?: string;
  lastOfflineAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** 仅创建或重置密钥时回传一次 */
  deviceSecret?: string;
}

/** 与后端 DeviceSampleDTO 对齐 */
export interface DeviceSample {
  time?: string;
  values?: Record<string, number>;
}

/** 与后端 IotDeviceParam 对齐 */
export interface IotDeviceQuery {
  productId?: number;
  serialNo?: string;
  nickname?: string;
  status?: string;
}

export { IOT_STATUS_OPTIONS };
