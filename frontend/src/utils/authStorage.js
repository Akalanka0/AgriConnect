export const getAccessToken = () => {
  return sessionStorage.getItem('token');
};

export const setAccessToken = (token) => {
  if (!token) {
    return;
  }

  sessionStorage.setItem('token', token);
  localStorage.removeItem('token');
};

export const clearAccessToken = () => {
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
};
