import * as PIXI from 'pixi.js';

import { User } from '../types';

export class Avatar {
  public container: PIXI.Container;
  private circle: PIXI.Graphics;
  private nameText: PIXI.Text;
  private user: User;
  private targetX: number;
  private targetY: number;
  private isLocal: boolean;

  constructor(user: User, isLocal: boolean = false) {
    this.user = user;
    this.isLocal = isLocal;
    this.targetX = user.x;
    this.targetY = user.y;

    this.container = new PIXI.Container();
    this.container.x = user.x;
    this.container.y = user.y;

    this.circle = new PIXI.Graphics();
    this.nameText = new PIXI.Text();

    this.createAvatar();
    this.updateNameText();
  }

  private createAvatar() {
    this.circle.clear();

    const avatarColor = this.isLocal
      ? 0xff6b6b
      : this.getColorFromId(this.user.id);
    const outlineColor = this.isLocal ? 0xcc0000 : 0x333333;
    const radius = 20;

    this.circle.circle(0, 0, radius);
    this.circle.fill(avatarColor);
    this.circle.stroke({ color: outlineColor, width: 3 });

    if (this.isLocal) {
      this.circle.circle(0, 0, radius + 2);
      this.circle.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
    }

    this.container.addChild(this.circle);
  }

  private updateNameText() {
    this.nameText.text = this.user.name;
    this.nameText.style = new PIXI.TextStyle({
      fontSize: 14,
      fill: 0xffffff,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 2 },
    });

    this.nameText.anchor.set(0.5, 0.5);
    this.nameText.x = 0;
    this.nameText.y = -35;

    this.container.addChild(this.nameText);
  }

  private getColorFromId(id: string): number {
    const colors = [
      0x3498db, // Blue
      0x2ecc71, // Green
      0x9b59b6, // Purple
      0xf39c12, // Orange
      0xe74c3c, // Red
      0x1abc9c, // Teal
      0xf1c40f, // Yellow
      0x34495e, // Dark Blue
      0xe67e22, // Dark Orange
      0x8e44ad, // Dark Purple
    ];

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash = hash & hash;
    }

    return colors[Math.abs(hash) % colors.length];
  }

  public setPosition(x: number, y: number, immediate: boolean = false) {
    this.targetX = x;
    this.targetY = y;

    if (immediate || this.isLocal) {
      this.container.x = x;
      this.container.y = y;
    }
  }

  public update(deltaTime: number) {
    if (!this.isLocal) {
      const lerpFactor = Math.min(deltaTime * 0.008, 1);

      this.container.x += (this.targetX - this.container.x) * lerpFactor;
      this.container.y += (this.targetY - this.container.y) * lerpFactor;
    }
  }

  public updateUser(userData: Partial<User>) {
    Object.assign(this.user, userData);

    if (userData.x !== undefined && userData.y !== undefined) {
      this.setPosition(userData.x, userData.y);
    }

    if (userData.name && userData.name !== this.nameText.text) {
      this.updateNameText();
    }
  }

  public getPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y,
    };
  }

  public getUserData(): User {
    return { ...this.user };
  }

  public destroy() {
    this.container.destroy({ children: true });
  }
}

export default Avatar;
