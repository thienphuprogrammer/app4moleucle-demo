import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(path) {
    let baseUrl = process.env.REACT_APP_BACKEND_URL;
    console.log('Original baseUrl:', baseUrl);
    if (baseUrl && baseUrl.startsWith('http:')) {
        baseUrl = baseUrl.replace('http:', 'https:');
        console.log('Fixed baseUrl to HTTPS:', baseUrl);
    }
    
    // Ensure path ends with trailing slash to avoid server redirects
    let finalPath = path;
    if (path.endsWith('/') === false && !path.includes('?')) {
        finalPath = path + '/';
    }
    
    const finalUrl = `${baseUrl}${finalPath}`;
    console.log('Final API URL:', finalUrl);
    return finalUrl;
}
