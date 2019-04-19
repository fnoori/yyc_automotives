exports.configureEnvironment = (app, cors) => {
  if (process.env.NODE_ENV === 'development') {
    app.use(cors())
  } else if (process.env.NODE_ENV === 'development-aws') {

  } else if (process.env.NODE_ENV === 'production') {

  }
}
