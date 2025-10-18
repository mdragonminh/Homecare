
import React, { useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


const customMarkerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const technicianIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
/* eslint-disable react-refresh/only-export-components */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

// ---------------------------------------------------------------------
// 2. MAP DISPLAY COMPONENT
// ---------------------------------------------------------------------

const MapDisplay = ({ lat, lng, technicians, isDraggable, onMarkerDrag }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const technicianMarkers = useRef([]);
  const defaultCoords = { lat: 21.0285, lng: 105.8542 }; // Hanoi

  // Memoize popup content để tránh re-generate không cần thiết
  const popupContent = useMemo(() => {
    if (!technicians || technicians.length === 0) return null;
    const groupedTechs = technicians.reduce((acc, tech) => {
      const key = `${tech.lat}_${tech.lng}`;
      if (!acc[key]) {
        acc[key] = { lat: tech.lat, lng: tech.lng, techs: [] };
      }
      acc[key].techs.push(tech);
      return acc;
    }, {});

    return Object.values(groupedTechs).map(group => ({
      lat: group.lat,
      lng: group.lng,
      content: group.techs
        .map(tech => `<b>${tech.name}</b><br>${t("ui.technicians.distance_label", { distance: tech.distance })}`)
        .join("<br><hr>")
    }));
  }, [technicians, t]);

  useEffect(() => {
    if (!mapRef.current) return;

    const initialLat = lat || defaultCoords.lat;
    const initialLng = lng || defaultCoords.lng;

    if (!mapInstance.current) {
      // Khởi tạo bản đồ lần đầu
      mapInstance.current = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        layers: [
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          }),
        ],
      });

      // Tạo Marker vị trí người dùng
      markerInstance.current = L.marker([initialLat, initialLng], {
        icon: customMarkerIcon,
        draggable: isDraggable, // Sử dụng trạng thái kéo thả
      }).addTo(mapInstance.current);

      // Thêm sự kiện khi kết thúc kéo
      markerInstance.current.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        // Gọi hàm callback từ component cha
        onMarkerDrag(lat, lng); 
      });
    }

    // Cập nhật khả năng kéo thả động
    if (markerInstance.current) {
      if (isDraggable && !markerInstance.current.dragging.enabled()) {
        markerInstance.current.dragging.enable();
      } else if (!isDraggable && markerInstance.current.dragging.enabled()) {
        markerInstance.current.dragging.disable();
      }
    }


    // Cập nhật vị trí và pop-up của Marker chính
    if (lat && lng) {
      const newLatlng = L.latLng(lat, lng);
      const currentCenter = mapInstance.current.getCenter();
      const distance = L.latLng(currentCenter).distanceTo(newLatlng);

      // Chỉ thay đổi view nếu vị trí mới cách xa vị trí hiện tại
      if (distance > 100) {
        mapInstance.current.setView(newLatlng, 15);
      }

      markerInstance.current
        .setLatLng(newLatlng)
        .bindPopup(`<b>${t("ui.your_service_location", { defaultValue: "Vị trí dịch vụ của bạn" })}</b>`)
        .openPopup();
    }

    // Xóa các Marker kỹ thuật viên cũ
    technicianMarkers.current.forEach((marker) => marker.remove());
    technicianMarkers.current = [];

    // Thêm các Marker kỹ thuật viên mới
    if (popupContent && lat && lng) {
      // Khởi tạo bounds bằng vị trí người dùng
      const bounds = L.latLngBounds(L.latLng(lat, lng)); 

      popupContent.forEach(({ lat: techLat, lng: techLng, content }) => {
        const groupLatLng = L.latLng(techLat, techLng);
        bounds.extend(groupLatLng);

        const marker = L.marker([techLat, techLng], { icon: technicianIcon })
          .addTo(mapInstance.current)
          .bindPopup(content);
        technicianMarkers.current.push(marker);
      });

      // Điều chỉnh bản đồ để hiển thị tất cả marker
      if (technicians?.length > 0) {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [lat, lng, technicians, popupContent, isDraggable, onMarkerDrag, t]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl shadow-lg border-2 border-gray-500 relative z-0 overflow-hidden transition-all duration-300"
      style={{ minHeight: "400px" }}
    />
  );
};

export default MapDisplay;