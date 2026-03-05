export const getDownloadUrl = (filePath) => {
    if (!filePath) return '#';

    // For Cloudinary image resources, inject fl_attachment so the browser downloads
    // the file instead of displaying it inline (images open in a new tab without this).
    // Raw resources (PDFs, docs) are directly downloadable and don't support this flag.
    if (
        filePath.includes('res.cloudinary.com') &&
        filePath.includes('/image/upload/') &&
        !filePath.includes('fl_attachment')
    ) {
        return filePath.replace('/image/upload/', '/image/upload/fl_attachment/');
    }

    return filePath;
};

export const getFriendlyFileName = (filePath) => {
    if (!filePath) return '';

    if (filePath.includes('sample_document')) return 'Sample Document';
    if (filePath.includes('sample_profile')) return 'Sample Image';

    // Handle both forward and backward slashes
    return filePath.split('\\').pop().split('/').pop();
};
