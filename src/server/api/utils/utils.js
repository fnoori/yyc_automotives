
/**
 * @param {string} mimeType Ie. 'mimetype/png'
 * @returns {string} Just the file extension
 */
exports.getFileExtensionFromMimeType = (mimeType) => {
  return mimeType.split('/')[1]
}

/**
 * @param {array} vehicleData
 *                  - data extracted
 *                    - user_id
 *                    - vehicle_id
 * @returns {string} Just the file extension
 */
exports.getEmptyVehicleDirectoryToDelete = (vehicleData) => {
  return `uploads/users/${vehicleData.url.split('/')[2]}/${vehicleData.url.split('/')[3]}`
}
