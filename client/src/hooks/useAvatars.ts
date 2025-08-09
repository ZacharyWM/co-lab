import { useEffect, useRef, useCallback } from 'react';

import Avatar from '../components/Avatar';

import { useAppContext } from './useAppContext';
import { useMovement } from './useMovement';
import { PixiApp, getZoneAtPoint } from './usePixi';
import { useWebSocket } from './useWebSocket';
// import { User } from "../types";

export function useAvatars(pixiApp: PixiApp | null) {
  const { currentUser, users, setCurrentUser } = useAppContext();
  const { sendPosition, sendZoneEnter, sendZoneExit } = useWebSocket();
  const avatarsRef = useRef<Map<string, Avatar>>(new Map());
  const localAvatarRef = useRef<Avatar | null>(null);
  const currentZoneRef = useRef<string | null>(null);
  const lastPositionUpdateRef = useRef<number>(0);

  const handlePositionChange = useCallback(
    (x: number, y: number) => {
      if (!currentUser || !localAvatarRef.current) return;

      // Update local avatar immediately
      localAvatarRef.current.setPosition(x, y, true);

      // Update current user position
      setCurrentUser({
        ...currentUser,
        x,
        y,
      });

      // Check zone changes
      const currentZone = getZoneAtPoint(x, y);
      const currentZoneId = currentZone?.id || null;

      if (currentZoneId !== currentZoneRef.current) {
        if (currentZoneRef.current) {
          sendZoneExit(currentZoneRef.current);
        }

        if (currentZoneId) {
          sendZoneEnter(currentZoneId);
        }

        currentZoneRef.current = currentZoneId;
      }

      // Throttle position updates to server (10-15 Hz as per plan)
      const now = Date.now();
      if (now - lastPositionUpdateRef.current > 66) {
        // ~15 Hz
        sendPosition(x, y);
        lastPositionUpdateRef.current = now;
      }
    },
    [currentUser, setCurrentUser, sendPosition, sendZoneEnter, sendZoneExit]
  );

  const { setPosition } = useMovement(
    currentUser?.x || 100,
    currentUser?.y || 100,
    {
      speed: 200,
      onPositionChange: handlePositionChange,
    }
  );

  // Create or update local avatar
  useEffect(() => {
    if (!pixiApp || !currentUser || currentUser.id === '') return;

    if (!localAvatarRef.current) {
      localAvatarRef.current = new Avatar(currentUser, true);
      pixiApp.avatarLayer.addChild(localAvatarRef.current.container);
    } else {
      localAvatarRef.current.updateUser(currentUser);
    }
  }, [pixiApp, currentUser]);

  // Manage remote avatars
  useEffect(() => {
    if (!pixiApp) return;

    const currentAvatars = avatarsRef.current;
    const newAvatarIds = new Set<string>();

    // Add or update avatars for all users
    users.forEach((user, userId) => {
      if (userId === currentUser?.id) return; // Skip local user

      newAvatarIds.add(userId);

      let avatar = currentAvatars.get(userId);
      if (!avatar) {
        // Create new avatar
        avatar = new Avatar(user, false);
        currentAvatars.set(userId, avatar);
        pixiApp.avatarLayer.addChild(avatar.container);
      } else {
        // Update existing avatar
        avatar.updateUser(user);
      }
    });

    // Remove avatars for users who left
    const avatarsToRemove: string[] = [];
    currentAvatars.forEach((_avatar, userId) => {
      if (!newAvatarIds.has(userId)) {
        avatarsToRemove.push(userId);
      }
    });

    avatarsToRemove.forEach((userId) => {
      const avatar = currentAvatars.get(userId);
      if (avatar) {
        pixiApp.avatarLayer.removeChild(avatar.container);
        avatar.destroy();
        currentAvatars.delete(userId);
      }
    });
  }, [pixiApp, users, currentUser]);

  // Animation loop for smooth remote avatar movement
  useEffect(() => {
    if (!pixiApp) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update remote avatars for smooth interpolation
      avatarsRef.current.forEach((avatar) => {
        avatar.update(deltaTime);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [pixiApp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Destroy local avatar
      if (localAvatarRef.current) {
        localAvatarRef.current.destroy();
        localAvatarRef.current = null;
      }

      // Destroy all remote avatars
      avatarsRef.current.forEach((avatar) => {
        avatar.destroy();
      });
      avatarsRef.current.clear();
    };
  }, []);

  return {
    localAvatar: localAvatarRef.current,
    remoteAvatars: avatarsRef.current,
    currentZone: currentZoneRef.current,
    setPosition,
  };
}
