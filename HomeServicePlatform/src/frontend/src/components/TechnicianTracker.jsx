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

export function TechnicianTracker({role}) {
  const last = useRef({ lat: null, lng: null, time: 0 });

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    if (role?.toLowerCase() !== "technician") {
      //console.log("Không phải kỹ thuật viên, dừng theo dõi vị trí");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();
        if (accuracy > 150) {
          console.warn(
            `Độ chính xác thấp (${accuracy.toFixed(0)} m) — bỏ qua update`
          );
          return;
        }
        const dist = calcDistance(
          last.current.lat,
          last.current.lng,
          latitude,
          longitude
        );
        const moved = dist > 0.1;
        const timedOut = now - last.current.time > 60000; 
        if (dist > 5) {
          console.warn(`Sai lệch lớn (${dist.toFixed(2)} km) — bỏ qua`);
          return;
        }
        if (moved || timedOut) {
          try {
            await technicianApi.updateLocation(latitude, longitude);
            console.log("Cập nhật vị trí:", latitude, longitude);
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
