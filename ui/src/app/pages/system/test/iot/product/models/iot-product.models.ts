/** 与后端 IotProductDTO 对齐 */
export interface IotProduct {
  id?: number;
  productKey: string;
  name: string;
  description?: string;
  authType?: string;
  iotdbPathPattern?: string;
  currentTslVersion?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 与后端 IotProductParam 对齐 */
export interface IotProductQuery {
  productKey?: string;
  name?: string;
  status?: string;
}

/** 与后端 IotTslModelDTO 对齐 */
export interface IotTslModel {
  id?: number;
  productId?: number;
  version?: number;
  schemaJson: string;
  changelog?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IotTslModalData {
  productId: number;
  productName: string;
}

export const DEFAULT_TSL_SCHEMA = `{
  "properties": [
    { "identifier": "temperature", "name": "温度", "dataType": "float", "access": "r" }
  ],
  "events": [],
  "services": []
}`;

export const IOT_STATUS_OPTIONS = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' }
];
