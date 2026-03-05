const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
const sameOriginSocketUrl = typeof window !== 'undefined' ? window.location.origin : '';

export const SOCKET_URL = envSocketUrl || sameOriginSocketUrl;
