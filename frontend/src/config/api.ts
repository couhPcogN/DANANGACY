const LAN_IP = '10.103.48.63';
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const DEFAULT_URL = isWeb ? 'http://127.0.0.1:8000' : `http://${LAN_IP}:8000`;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;
