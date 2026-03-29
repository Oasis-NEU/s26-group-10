import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
})

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

export const getBackendUrl = () => BACKEND_URL
