## Project Overview

A web-based virtual workspace supporting up to 20 concurrent users
with spatial audio/video zones, built using Bun, React,
TypeScript, PixiJS, and WebRTC.

## Core Features

• Blue virtual space with green communication zones
• Zone-based audio/video (only see/hear people in same zone)
• Simple avatars with name display
• Audio/video toggle controls
• No authentication (name-only entry)
• Support for up to 20 concurrent users

## Technology Stack

• Runtime: Bun (frontend & backend)
• Frontend: React + TypeScript
• Graphics: PixiJS for 2D virtual space (docs at @pixi-js-docs/llms-medium.txt and pixi-js-docs/llms.txt, and can also be found at https://pixijs.download/release/docs/index.html if you really need it)
• Communication: WebRTC for peer-to-peer audio/video
• Backend: Bun WebSocket server for signaling
• State Management: React Context
• Styling: Tailwind CSS

## Architecture Overview

### Backend (Signaling Server)

server/
├── index.ts # Main server entry
├── websocket.ts # WebSocket handler
├── room.ts # Room management
└── types.ts # Shared types

### Frontend

client/
├── src/
│ ├── components/
│ │ ├── Workspace.tsx # Main PixiJS canvas
│ │ ├── Avatar.tsx # Avatar component
│ │ ├── VideoGrid.tsx # Video containers
│ │ ├── Controls.tsx # Audio/video controls
│ │ └── NameEntry.tsx # Entry form
│ ├── hooks/
│ │ ├── useWebRTC.ts # WebRTC logic
│ │ ├── usePixi.ts # PixiJS integration
│ │ └── useWebSocket.ts # Server connection
│ ├── services/
│ │ ├── webrtc.ts # WebRTC service
│ │ └── signaling.ts # Signaling logic
│ └── types/
│ └── index.ts # TypeScript types

## Implementation Steps

### Step 1: Project Setup

• Initialize Bun project with workspaces configuration
• Create monorepo structure with client/ and server/ directories
• Install required dependencies:
• Client: react, react-dom, @types/react, @types/react-dom,
typescript, pixi.js, @pixi/react
• Server: ws, @types/ws, typescript
• Shared: webrtc-adapter
• Configure TypeScript for both client and server with appropriate
tsconfig.json files
• Set up package.json scripts for development and building

### Step 2: Backend Signaling Server

• Create Bun-based WebSocket server listening on port 3001
• Implement room management system with 20-user limit per room
• Create message handlers for:
• join: User enters room with name
• leave: User exits room
• position: Avatar position updates
• offer/answer/ice-candidate: WebRTC signaling
• zone-enter/zone-exit: Zone transition events
• Implement broadcast functionality to relay messages to
appropriate room participants
• Add connection cleanup on disconnect

### Step 3: Frontend Foundation

• Set up React application structure with TypeScript
• Create routing system:
• /: Name entry page
• /workspace: Main virtual workspace
• Implement NameEntry component with form validation
• Set up global state management (React Context recommended for
simplicity)
• Create WebSocket connection service with reconnection logic

### Step 4: PixiJS Virtual Workspace

• Initialize PixiJS Application with proper dimensions
• Create blue background using Graphics API
• Implement green communication zones:
• Use Graphics to draw green rectangles/circles
• Store zone boundaries in data structure
• Implement point-in-polygon/circle collision detection
• Set up viewport/camera system for potential future scrolling
• Create coordinate system (recommend 1920x1080 base with
responsive scaling)

### Step 5: Avatar System

• Design simple avatar using PixiJS Graphics (colored circle with
outline)
• Create Avatar class/component with:
• Position properties (x, y)
• Movement methods
• Name label using PixiJS Text
• Implement movement controls:
• Keyboard event listeners for WASD/arrow keys
• Movement speed limiting
• Boundary checking
• Add position synchronization via WebSocket
• Implement smooth interpolation for remote avatars

### Step 6: WebRTC Integration

• Create WebRTC service class for managing peer connections
• Implement media stream acquisition:
• Request user media (audio/video)
• Handle permission denials gracefully
• Set up signaling flow:
• Create offers when new peer joins zone
• Handle answers from peers
• Exchange ICE candidates
• Implement zone-based connection management:
• Track which zone each user is in
• Only establish connections with users in the same zone
• Clean up connections when leaving zone

### Step 7: UI Components

• Create video grid overlay component:
• Position videos for zone participants
• Handle dynamic addition/removal
• Implement control panel:
• Mute/unmute microphone button
• Enable/disable camera button
• Leave workspace button
• Add participant list showing all users in current zone
• Create zone indicator showing current zone name/status

### Step 8: Zone-Based Communication Logic

• Implement zone detection on avatar movement:
• Check collision with zone boundaries
• Trigger zone-enter/zone-exit events
• Create peer connection pooling system:
• Maintain connections only with same-zone users
• Handle connection lifecycle on zone transitions
• Implement stream management:
• Add/remove video elements dynamically
• Ensure proper cleanup of media streams

### Step 9: Testing and Optimization

• Create test scenarios:
• Single user movement and zone detection
• Multiple users in same zone
• Users transitioning between zones
• Maximum capacity (20 users)
• Implement error handling:
• WebSocket disconnections
• WebRTC connection failures
• Media permission denials
• Add performance optimizations:
• Throttle position updates
• Implement visibility culling for avatars
• Optimize PixiJS render calls

### Step 10: Final Polish

• Add smooth transitions:
• Avatar movement interpolation
• Zone entry/exit animations
• Connection state indicators
• Implement graceful degradation:
• Handle users without cameras/microphones
• Fallback for WebRTC connection issues
• Add user feedback:
• Connection status messages
• Zone transition notifications
• Error messages

## Key Technical Decisions

### WebRTC Architecture

• Use full mesh topology for simplicity (each peer connects
directly to others)
• Implement selective forwarding unit (SFU) pattern at application
level via zones
• Use public STUN servers initially (Google's public STUN)

### State Management

• Server maintains authoritative state for:
• User positions
• Zone membership
• Active connections
• Client performs optimistic updates with server reconciliation

### Performance Considerations

• Limit position update frequency to 10-15 Hz
• Use PixiJS sprite batching for avatars
• Implement connection pooling to reuse peer connections
• Add debouncing to zone transition logic

### Security Measures

• Sanitize user names (alphanumeric + spaces only)
• Implement rate limiting on position updates
• Validate all incoming WebSocket messages
• Use CORS appropriately for production

## Testing Approach

• Unit tests for zone collision detection
• Integration tests for WebRTC signaling flow
• End-to-end tests with multiple browser instances
• Load testing with 20 concurrent connections
• Browser compatibility testing (Chrome, Firefox, Safari, Edge)

## Deployment Considerations

• Use environment variables for:
• WebSocket server URL
• STUN/TURN servers
• Maximum room capacity
• Implement health checks for monitoring
• Add logging for debugging production issues
• Consider CDN for static assets

## Future Enhancement Ideas

• Persistent rooms with shareable URLs
• Screen sharing capabilities
• Text chat within zones
• Custom avatar colors/shapes
• Mobile device support with touch controls
• Recording and playback features
• Multiple room support
• Admin controls for room management</new_str>
