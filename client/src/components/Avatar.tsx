import * as PIXI from 'pixi.js'
import { User } from '../types'

export class Avatar {
  public container: PIXI.Container
  private circle: PIXI.Graphics
  private nameText: PIXI.Text
  private user: User
  private targetX: number
  private targetY: number
  private isLocal: boolean

  constructor(user: User, isLocal: boolean = false) {
    this.user = user
    this.isLocal = isLocal
    this.targetX = user.x
    this.targetY = user.y

    this.container = new PIXI.Container()
    this.container.x = user.x
    this.container.y = user.y

    this.circle = new PIXI.Graphics()
    this.nameText = new PIXI.Text()

    this.createAvatar()
    this.updateNameText()
  }

  private createAvatar() {
    this.circle.clear()
    
    const avatarColor = this.isLocal ? 0xFF6B6B : this.getColorFromId(this.user.id)
    const outlineColor = this.isLocal ? 0xCC0000 : 0x333333
    const radius = 20
    
    this.circle.circle(0, 0, radius)
    this.circle.fill(avatarColor)
    this.circle.stroke({ color: outlineColor, width: 3 })
    
    if (this.isLocal) {
      this.circle.circle(0, 0, radius + 2)
      this.circle.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.8 })
    }

    this.container.addChild(this.circle)
  }

  private updateNameText() {
    this.nameText.text = this.user.name
    this.nameText.style = new PIXI.TextStyle({
      fontSize: 14,
      fill: 0xFFFFFF,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 2 }
    })
    
    this.nameText.anchor.set(0.5, 0.5)
    this.nameText.x = 0
    this.nameText.y = -35
    
    this.container.addChild(this.nameText)
  }

  private getColorFromId(id: string): number {
    const colors = [
      0x3498DB, // Blue
      0x2ECC71, // Green  
      0x9B59B6, // Purple
      0xF39C12, // Orange
      0xE74C3C, // Red
      0x1ABC9C, // Teal
      0xF1C40F, // Yellow
      0x34495E, // Dark Blue
      0xE67E22, // Dark Orange
      0x8E44AD  // Dark Purple
    ]
    
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
      hash = hash & hash
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  public setPosition(x: number, y: number, immediate: boolean = false) {
    this.targetX = x
    this.targetY = y
    
    if (immediate || this.isLocal) {
      this.container.x = x
      this.container.y = y
    }
  }

  public update(deltaTime: number) {
    if (!this.isLocal) {
      const lerpFactor = Math.min(deltaTime * 0.008, 1)
      
      this.container.x += (this.targetX - this.container.x) * lerpFactor
      this.container.y += (this.targetY - this.container.y) * lerpFactor
    }
  }

  public updateUser(userData: Partial<User>) {
    Object.assign(this.user, userData)
    
    if (userData.x !== undefined && userData.y !== undefined) {
      this.setPosition(userData.x, userData.y)
    }
    
    if (userData.name && userData.name !== this.nameText.text) {
      this.updateNameText()
    }
  }

  public getPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y
    }
  }

  public getUserData(): User {
    return { ...this.user }
  }

  public destroy() {
    this.container.destroy({ children: true })
  }
}

export default Avatar