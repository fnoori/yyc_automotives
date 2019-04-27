
/**
 * @param {string} mimeType Ie. 'mimetype/png'
 * @returns {string} Just the file extension
 */
exports.getFileExtensionFromMimeType = (mimeType) => {
  return mimeType.split('/')[1]
}
