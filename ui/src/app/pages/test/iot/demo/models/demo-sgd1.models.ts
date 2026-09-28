/** 与后端 DemoSgd1 对齐 */
export interface DemoSgd1 {
  time?: string;
  temperature?: number;
  humidity?: number;
}

/** 与后端 DemoSgd1Query 对齐，时间格式 yyyy-MM-dd HH:mm:ss */
export interface DemoSgd1Query {
  start?: string;
  end?: string;
}
