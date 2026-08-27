import Constants from 'expo-constants';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://monpro-api.onrender.com/api/v1';
