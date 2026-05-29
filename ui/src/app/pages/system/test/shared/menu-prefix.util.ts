/** 菜单是否为外链（兼容 boolean / 0|1） */
export function isMenuExternalLink(flag: unknown): boolean {
  return flag === true || flag === 1;
}

export function buildMenuCodePrefix(parentCode: string): string {
  return parentCode.endsWith(':') ? parentCode : `${parentCode}:`;
}

export function buildMenuPathPrefix(parentPath: string): string {
  return parentPath.endsWith('/') ? parentPath : `${parentPath}/`;
}

export function stripMenuPrefix(value: string | null | undefined, prefix: string): string {
  if (!prefix || value == null) {
    return value ?? '';
  }
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export function mergeMenuPrefix(value: string | null | undefined, prefix: string): string {
  if (!prefix) {
    return (value ?? '').trim();
  }
  return `${prefix}${(value ?? '').trim()}`;
}
