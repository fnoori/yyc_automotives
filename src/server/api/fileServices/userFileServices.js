const _ = require('underscore')
const AWS = require('aws-sdk')

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

let s3 = new AWS.S3()

exports.deleteFile = async (file) => {
  console.log('\n\n\n')
  console.log('in deleteFile')
  console.log('\n\n\n')
  if (process.env.NODE_ENV === 'development-local') {

    try {
      if (!_.isUndefined(file)) {
        let awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key
        }

        await s3.deleteObject(awsDelete).promise()
      }

      return true
    } catch (e) {
      console.log(e)
      return false
    }
  } else if (process.env.NODE_ENV === 'development-aws') {

  } else if (process.env.NODE_ENV === 'production') {

  }
}
