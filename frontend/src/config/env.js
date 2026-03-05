const isLocalhostUrl = (value) => /localhost|127\.0\.0\.1/i.test(value);

export const appEnv = {
  mode: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL || '',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  weatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || ''
};

export const validateProductionEnv = () => {
  if (!appEnv.isProd) {
    return;
  }

  if (appEnv.apiUrl && isLocalhostUrl(appEnv.apiUrl)) {
    throw new Error('Invalid production configuration: VITE_API_URL cannot target localhost.');
  }

  if (appEnv.socketUrl && isLocalhostUrl(appEnv.socketUrl)) {
    throw new Error('Invalid production configuration: VITE_SOCKET_URL cannot target localhost.');
  }
};
