#!/usr/bin/env node

import * as http from 'http'
import { setupWSConnection } from './utils.js'
import { WebSocketServer } from 'ws'

const port = process.env.PORT || 1234
const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('Yjs WebSocket Server is running\n')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req)
})

server.listen(port)
console.log(`WebSocket server running on :${port}`)
