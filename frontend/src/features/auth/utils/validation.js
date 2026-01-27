export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validateNIC = (nic) => /^([0-9]{9}[xXvV]|[0-9]{12})$/.test(nic);
export const validatePhone = (phone) => /^(?:\+94|0)?[1-9][0-9]{8}$/.test(phone.replace(/\s+/g, ''));
export const validateRoleId = (id) => /^[a-zA-Z0-9-]{3,}$/.test(id);

export const checkPasswordStrength = (password) => {
    if (password.length < 8) return 'weak';
    if (password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/) && password.match(/[^a-zA-Z0-9]/)) {
        return 'strong';
    }
    return 'medium';
};
