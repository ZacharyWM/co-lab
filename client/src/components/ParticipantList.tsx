import { useMemo } from "react";
import { useAppContext } from "../hooks/useAppContext";
import { ZONES, getZoneAtPoint } from "../hooks/usePixi";

export default function ParticipantList({
  currentZone,
}: {
  currentZone: string | null | undefined;
}) {
  const { currentUser, users } = useAppContext();

  const list = useMemo(() => {
    if (!currentZone) return [] as { id: string; name: string }[];
    const self = currentUser
      ? [{ id: currentUser.id, name: currentUser.name }]
      : [];
    const others: { id: string; name: string }[] = [];

    // Allow matching by zone id or display name for robustness
    const zone = ZONES.find(
      (z) => z.id === currentZone || z.name === currentZone
    );
    const acceptable = new Set<string>([
      currentZone,
      ...(zone ? [zone.name, zone.id] : []),
    ]);

    users.forEach((u, id) => {
      if (id === currentUser?.id) return;
      const theirZone =
        u.zone ??
        getZoneAtPoint(u.x, u.y)?.id ??
        getZoneAtPoint(u.x, u.y)?.name;
      if (theirZone && acceptable.has(theirZone)) {
        others.push({ id, name: u.name });
      }
    });
    others.sort((a, b) => a.name.localeCompare(b.name));
    return [...self, ...others];
  }, [currentZone, users, currentUser]);

  return (
    <div className="mt-2">
      <div className="text-xs font-semibold text-gray-900 mb-1">
        Participants in this zone ({list.length})
      </div>
      {currentZone ? (
        list.length > 0 ? (
          <ul className="text-xs text-gray-700 space-y-0.5 max-h-32 overflow-auto pr-1">
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>{p.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-500">No one here yet.</div>
        )
      ) : (
        <div className="text-xs text-gray-500">
          Move into a green zone to connect.
        </div>
      )}
    </div>
  );
}
