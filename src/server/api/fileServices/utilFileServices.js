const fs = require('fs')
const errors = require('../utils/errors')

exports.deleteEmptyDir = async (dir) => {
  try {
    fs.rmdirSync(dir)
    
    return true
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    return false
  }
}
