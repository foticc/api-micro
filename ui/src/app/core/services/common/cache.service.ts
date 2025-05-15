import { Injectable } from '@angular/core';

interface CacheItem<T> {
  value: T;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly storage;

  constructor() {
    this.storage = window.localStorage;
  }

  /**
   * 设置缓存（永久有效）
   * @param key 缓存键
   * @param value 缓存值
   */
  set<T>(key: string, value: T): void {
    const item: CacheItem<T> = { value };

    try {
      this.storage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('CacheService: 存储失败', error);
      this.clear();
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值或null
   */
  get<T>(key: string): T | null {
    const itemStr = this.storage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr) as CacheItem<T>;
      return item.value;
    } catch (error) {
      console.error('CacheService: 解析失败', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * 删除指定缓存
   * @param key 缓存键
   */
  remove(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  has(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }

  /**
   * 获取或设置缓存（原子操作）
   * @param key 缓存键
   * @param factory 值生成函数
   */
  getOrSet<T>(key: string, factory: () => T): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = factory();
    this.set(key, value);
    return value;
  }
}
