exports.configureEnvironment = (app, cors) => {
  if (process.env.NODE_ENV === 'development-local') {
    app.use(cors())
    process.env.MONGO_URI = process.env.MONGO_URI_DEV_LOCAL
  } else if (process.env.NODE_ENV === 'development-aws') {
    process.env.MONGO_URI = process.env.MONGO_URI_DEV_ATLAS
  } else if (process.env.NODE_ENV === 'production') {
    process.env.MONGO_URI = process.env.MONGO_URI_PROD_ATLAS
  }
}
