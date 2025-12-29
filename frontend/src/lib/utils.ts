import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path: string): string {
  let baseUrl = process.env.REACT_APP_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  if (baseUrl && baseUrl.startsWith('http:')) {
    baseUrl = baseUrl.replace('http:', 'https:');
  }

  if (baseUrl && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return `${baseUrl}${path}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
