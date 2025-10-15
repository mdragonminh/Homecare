import { useEffect, useRef } from "react";
import { technicianApi } from "../services/technicianApi";

function calcDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function TechnicianTracker() {
  const last = useRef({ lat: null, lng: null, time: 0 });

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const now = Date.now();

        const dist = calcDistance(
          last.current.lat,
          last.current.lng,
          latitude,
          longitude
        );
        const moved = dist > 0.05; 
        const timedOut = now - last.current.time > 30000; 
        if (moved || timedOut) {
          try {
            await technicianApi.updateLocation(latitude, longitude);
            //console.log("Cập nhật vị trí:", latitude, longitude);
            last.current = { lat: latitude, lng: longitude, time: now };
          } catch (err) {
            console.warn("Lỗi cập nhật vị trí:", err.message);
          }
        }
      },
      (err) => console.warn("Không thể lấy vị trí:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return null;
}
