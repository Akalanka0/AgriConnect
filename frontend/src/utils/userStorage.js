const USER_STORAGE_KEY = 'user';

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to read user from storage:', error);
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user || typeof user !== 'object') {
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};
