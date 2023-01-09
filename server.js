const next = require('next')

const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const port = process.env.PORT || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev: false })
const handle = app.getRequestHandler()

const apiPaths = {
  '/api': {
    target: 'http://localhost:7071',
    pathRewrite: {
      '^/api': '/api'
    },
    changeOrigin: true
  }
}



app
  .prepare()
  .then(() => {
    const isDevelopment = process.env.NODE_ENV !== "production"
    
    console.log("tipo ", typeof  process.env.NODE_ENV);
    console.log('Ambiente >> ', process.env.NODE_ENV);
    console.log('é dev? ', isDevelopment);
    console.log('é dev runtime? ', process.env.NODE_ENV !== "production");
    const server = express()

    if (isDevelopment) {
      server.use('/api', createProxyMiddleware(apiPaths['/api']))
    }

    server.all('*', (req, res) => {
      return handle(req, res)
    })

    server.listen(port, (err) => {
      if (err) throw err
      console.log(`> Ready on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.log('Error:::::', err)
  })
