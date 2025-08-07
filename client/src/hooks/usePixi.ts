import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { Zone } from '../types'

export interface PixiApp {
  app: PIXI.Application
  viewport: PIXI.Container
  backgroundLayer: PIXI.Container
  zoneLayer: PIXI.Container
  avatarLayer: PIXI.Container
}

const WORLD_WIDTH = 1920
const WORLD_HEIGHT = 1080

export function usePixi(containerRef: React.RefObject<HTMLDivElement>) {
  const [pixiApp, setPixiApp] = useState<PixiApp | null>(null)
  const [isReady, setIsReady] = useState(false)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!containerRef.current || appRef.current) return

    const initPixi = async () => {
      try {
        const app = new PIXI.Application()
        
        await app.init({
          width: containerRef.current!.clientWidth,
          height: containerRef.current!.clientHeight,
          backgroundColor: 0x87CEEB,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        })

        containerRef.current!.appendChild(app.canvas)
        appRef.current = app

        const viewport = new PIXI.Container()
        app.stage.addChild(viewport)

        const backgroundLayer = new PIXI.Container()
        const zoneLayer = new PIXI.Container()
        const avatarLayer = new PIXI.Container()

        viewport.addChild(backgroundLayer)
        viewport.addChild(zoneLayer)
        viewport.addChild(avatarLayer)

        const pixiAppInstance: PixiApp = {
          app,
          viewport,
          backgroundLayer,
          zoneLayer,
          avatarLayer
        }

        setupBackground(backgroundLayer)
        setupZones(zoneLayer)
        setupViewport(viewport, app)

        setPixiApp(pixiAppInstance)
        setIsReady(true)

        const handleResize = () => {
          if (containerRef.current) {
            app.renderer.resize(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            )
            centerViewport(viewport, app)
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
        }
      } catch (error) {
        console.error('Failed to initialize PixiJS:', error)
      }
    }

    initPixi()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [containerRef])

  return { pixiApp, isReady }
}

function setupBackground(backgroundLayer: PIXI.Container) {
  const background = new PIXI.Graphics()
  background.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  background.fill(0x4A90E2)
  backgroundLayer.addChild(background)
}

function setupZones(zoneLayer: PIXI.Container) {
  const zones: Zone[] = [
    {
      id: 'zone1',
      name: 'Meeting Room 1',
      x: 200,
      y: 200,
      width: 300,
      height: 200,
      color: 0x32CD32
    },
    {
      id: 'zone2',
      name: 'Meeting Room 2',
      x: 700,
      y: 200,
      width: 300,
      height: 200,
      color: 0x32CD32
    },
    {
      id: 'zone3',
      name: 'Collaboration Space',
      x: 1200,
      y: 300,
      width: 400,
      height: 300,
      color: 0x32CD32
    },
    {
      id: 'zone4',
      name: 'Casual Chat',
      x: 300,
      y: 600,
      width: 250,
      height: 150,
      color: 0x32CD32
    },
    {
      id: 'zone5',
      name: 'Focus Area',
      x: 800,
      y: 550,
      width: 200,
      height: 200,
      color: 0x32CD32
    }
  ]

  zones.forEach(zone => {
    const zoneGraphics = new PIXI.Graphics()
    zoneGraphics.rect(zone.x, zone.y, zone.width, zone.height)
    zoneGraphics.fill({ color: zone.color, alpha: 0.3 })
    zoneGraphics.stroke({ color: zone.color, width: 3 })
    
    const zoneText = new PIXI.Text({
      text: zone.name,
      style: {
        fontSize: 18,
        fill: 0x000000,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    })
    
    zoneText.x = zone.x + zone.width / 2 - zoneText.width / 2
    zoneText.y = zone.y + zone.height / 2 - zoneText.height / 2
    
    zoneLayer.addChild(zoneGraphics)
    zoneLayer.addChild(zoneText)
  })
}

function setupViewport(viewport: PIXI.Container, app: PIXI.Application) {
  centerViewport(viewport, app)
}

function centerViewport(viewport: PIXI.Container, app: PIXI.Application) {
  const scaleX = app.renderer.width / WORLD_WIDTH
  const scaleY = app.renderer.height / WORLD_HEIGHT
  const scale = Math.min(scaleX, scaleY, 1)
  
  viewport.scale.set(scale)
  
  viewport.x = (app.renderer.width - WORLD_WIDTH * scale) / 2
  viewport.y = (app.renderer.height - WORLD_HEIGHT * scale) / 2
}

export const ZONES: Zone[] = [
  {
    id: 'zone1',
    name: 'Meeting Room 1',
    x: 200,
    y: 200,
    width: 300,
    height: 200,
    color: 0x32CD32
  },
  {
    id: 'zone2',
    name: 'Meeting Room 2',
    x: 700,
    y: 200,
    width: 300,
    height: 200,
    color: 0x32CD32
  },
  {
    id: 'zone3',
    name: 'Collaboration Space',
    x: 1200,
    y: 300,
    width: 400,
    height: 300,
    color: 0x32CD32
  },
  {
    id: 'zone4',
    name: 'Casual Chat',
    x: 300,
    y: 600,
    width: 250,
    height: 150,
    color: 0x32CD32
  },
  {
    id: 'zone5',
    name: 'Focus Area',
    x: 800,
    y: 550,
    width: 200,
    height: 200,
    color: 0x32CD32
  }
]

export function isPointInZone(x: number, y: number, zone: Zone): boolean {
  return x >= zone.x && 
         x <= zone.x + zone.width && 
         y >= zone.y && 
         y <= zone.y + zone.height
}

export function getZoneAtPoint(x: number, y: number): Zone | null {
  return ZONES.find(zone => isPointInZone(x, y, zone)) || null
}

export { WORLD_WIDTH, WORLD_HEIGHT }