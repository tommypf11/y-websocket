import * as Y from 'yjs'
import { encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness.js'
import { readSyncMessage, writeSyncStep1, writeSyncStep2, writeUpdate } from 'y-protocols/sync.js'
import * as map from 'lib0/map'
import * as ws from 'ws'

export const docs = new Map()

export const messageSync = 0
export const messageAwareness = 1

export const setupWSConnection = (conn, req, { docName = 'default' } = {}) => {
  const doc = map.setIfUndefined(docs, docName, () => {
    const ydoc = new Y.Doc()
    ydoc.gc = true
    return ydoc
  })

  conn.binaryType = 'arraybuffer'

  const awareness = new awarenessProtocol.Awareness(doc)
  awareness.setLocalState(null)

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, doc)
  ws.send(conn, encoding.toUint8Array(encoder))

  conn.on('message', message => {
    const decoder = decoding.createDecoder(new Uint8Array(message))
    const messageType = decoding.readVarUint(decoder)

    if (messageType === messageSync) {
      syncProtocol.readSyncMessage(decoder, conn, doc, ws)
    } else if (messageType === messageAwareness) {
      awarenessProtocol.applyAwarenessUpdate(doc, decoding.readVarUint8Array(decoder), conn)
    }
  })

  conn.on('close', () => {
    awarenessProtocol.removeAwarenessStates(doc, [conn], null)
    if ([...awareness.getStates().keys()].length === 0) {
      docs.delete(docName)
    }
  })
}
