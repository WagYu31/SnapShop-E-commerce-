import { Platform } from 'react-native';

// Use machine IP for iOS/Android (can't use localhost from simulator/emulator)
// Use localhost for web
const API_HOST = Platform.OS === 'web' ? 'http://localhost:8080' : 'http://10.35.8.181:8080';

export const API_URL = `${API_HOST}/api/v1`;
export const API_HOST_URL = API_HOST;
