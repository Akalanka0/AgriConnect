export const sanitizeExternalUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '#';
  }

  try {
    const url = new URL(value, window.location.origin);
    const protocol = url.protocol.toLowerCase();

    if (protocol === 'http:' || protocol === 'https:') {
      return url.toString();
    }

    return '#';
  } catch {
    return '#';
  }
};
