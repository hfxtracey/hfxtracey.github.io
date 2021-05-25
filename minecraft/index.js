const { app } = require('./lib/server.js')
const helmet = require('helmet')
const middleware = require('webpack-dev-middleware')
const devconfig = require('./src/webpack.dev.js')
const compression = require('compression')
const webpack = require('webpack')
const compiler = webpack(devconfig)

app.use(compression())
app.use(helmet({ contentSecurityPolicy: false }))
app.use(middleware(compiler))
