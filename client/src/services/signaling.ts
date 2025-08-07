import { WebSocketMessage } from '../types'

export type MessageHandler = (message: WebSocketMessage) => void

export class SignalingService {
  private ws: WebSocket | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private shouldReconnect = true

  constructor(private url: string = 'ws://localhost:3001') {}

  connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    this.isConnecting = true
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.messageHandlers.forEach(handler => handler(message))
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.isConnecting = false
          this.ws = null

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          
          if (this.reconnectAttempts === 0) {
            reject(new Error('Failed to connect to signaling server'))
          }
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler)
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler)
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  joinRoom(name: string) {
    this.send({
      type: 'join',
      data: { name }
    })
  }

  leaveRoom() {
    this.send({
      type: 'leave',
      data: {}
    })
  }

  sendPosition(x: number, y: number) {
    this.send({
      type: 'position',
      data: { x, y }
    })
  }

  sendZoneEnter(zoneName: string) {
    this.send({
      type: 'zone-enter',
      data: { zoneName }
    })
  }

  sendZoneExit(zoneName: string) {
    this.send({
      type: 'zone-exit',
      data: { zoneName }
    })
  }

  sendWebRTCOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
    this.send({
      type: 'offer',
      data: { targetUserId, offer }
    })
  }

  sendWebRTCAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    this.send({
      type: 'answer',
      data: { targetUserId, answer }
    })
  }

  sendWebRTCIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: 'ice-candidate',
      data: { targetUserId, candidate }
    })
  }
}