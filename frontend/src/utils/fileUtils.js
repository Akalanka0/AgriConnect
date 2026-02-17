export const getDownloadUrl = (filePath) => {
    if (!filePath) return '#';
    
    // Cloudinary PDF handling: Ensure they are treated as 'upload' and not 'raw' 
    // and remove fl_attachment to avoid 401 errors while allowing browser viewing
    let url = filePath;
    
    // If it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
        // Fix for PDFs that might be incorrectly served as 'image' or 'raw'
        // Cloudinary often needs PDFs to be under /image/upload/ or /files/upload/
        // to be viewable in the browser. 
        if (url.toLowerCase().endsWith('.pdf') && url.includes('/image/upload/')) {
            // Some configurations prefer /files/upload/ for PDFs
            // url = url.replace('/image/upload/', '/files/upload/');
        }
    }

    return url;
};

export const getFriendlyFileName = (filePath) => {
    if (!filePath) return '';

    if (filePath.includes('sample_document')) return 'Sample Document';
    if (filePath.includes('sample_profile')) return 'Sample Image';

    // Handle both forward and backward slashes
    return filePath.split('\\').pop().split('/').pop();
};
