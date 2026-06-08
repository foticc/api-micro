import { environment } from '@env/environment';
import { localUrl } from '@env/environment.prod';

export function apiUrl(path: string): string {
  return (environment.production ? localUrl : '/site/api') + path;
}
