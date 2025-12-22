import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(path) {
    let baseUrl = process.env.REACT_APP_BACKEND_URL;
    if (baseUrl && baseUrl.startsWith('http:')) {
        baseUrl = baseUrl.replace('http:', 'https:');
    }
    
    // Remove trailing slash from base if present to avoid double slashes
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    
    // Ensure path starts with slash
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    return `${baseUrl}${path}`;
}
