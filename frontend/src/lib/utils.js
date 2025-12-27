import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(path) {
    // In Next.js, use standard process.env or NEXT_PUBLIC_ prefix
    // But we are mapping REACT_APP_BACKEND_URL in next.config.js
    let baseUrl = process.env.REACT_APP_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    
    // Client-side fallback if env is missing (for preview)
    if (!baseUrl && typeof window !== 'undefined') {
        // Fallback to relative path if proxying, or just hope for the best
        // Actually, let's try to infer or default
    }

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
