import React, { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
const createTechnicianIcon = (color = "#EF4444") => {
  // Mặc định là màu đỏ (Red 500)
  const svg = `
    <svg width="50" height="60" viewBox="0 0 50 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="25" cy="54" rx="10" ry="4" fill="black" fill-opacity="0.2"/>
      <path d="M25 56C25 56 45 37.67 45 25C45 13.9543 36.0457 5 25 5C13.9543 5 5 13.9543 5 25C5 37.67 25 56 25 56Z" fill="${color}"/>
      <circle cx="25" cy="25" r="14" fill="white"/>
      <path d="M25 21C26.6569 21 28 19.6569 28 18C28 16.3431 26.6569 15 25 15C23.3431 15 22 16.3431 22 18C22 19.6569 23.3431 21 25 21Z" fill="${color}"/>
      <path d="M25 23C21.6863 23 19 25.6863 19 29V31H31V29C31 25.6863 28.3137 23 25 23Z" fill="${color}"/>
      <path d="M25 56C25 56 45 37.67 45 25C45 13.9543 36.0457 5 25 5C13.9543 5 5 13.9543 5 25C5 37.67 25 56 25 56Z" stroke="white" stroke-width="2"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
const createTechTooltip = (name) => `
  <style>
    .gm-ui-hover-effect {
      display: none !important;
    }
  </style>
  <div style="
    padding: 4px 8px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    font-size: 12px;
    font-weight: 500;
    color: #111827;
    white-space: nowrap;
    line-height: 1.2;
  ">
    👨‍🔧 ${name}
  </div>
`;


// eslint-disable-next-line react-refresh/only-export-components
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

export default function MapDisplay({
  lat,
  lng,
  technicians,
  popupContent,
  isDraggable = false,
  onMarkerDragEnd,
}) {
  const { t } = useTranslation();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const userMarkerInstance = useRef(null);
  const technicianMarkers = useRef([]);
  const [isMapInit, setIsMapInit] = useState(false);

  const technicianIconUrl = useMemo(
    () =>
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    []
  );

  const userIconUrl = useMemo(
    () => "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    []
  );

  // Helper: is google maps ready
  const isGoogleReady = () =>
    typeof window !== "undefined" &&
    !!window.google &&
    !!window.google.maps &&
    typeof window.google.maps.Map === "function";

  // INIT MAP (safe: checks google and prevents crash)
  useEffect(() => {
    if (!mapRef.current || isMapInit) return;

    if (!isGoogleReady()) {
      // Google Maps chưa load — skip init to avoid crash
      console.warn(
        "MapDisplay: Google Maps API not ready yet. Skipping map init to avoid crash."
      );
      return;
    }

    try {
      const initialLat = typeof lat === "number" ? lat : 21.0285;
      const initialLng = typeof lng === "number" ? lng : 105.8542;
      const initialLocation = { lat: initialLat, lng: initialLng };

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: initialLocation,
        zoom: 15,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        streetViewControl: false,
      });

      userMarkerInstance.current = new window.google.maps.Marker({
        position: initialLocation,
        map: mapInstance.current,
        title: t("ui.your_service_location", {
          defaultValue: "Vị trí dịch vụ của bạn",
        }),
        draggable: false,
        icon: {
          url: userIconUrl,
          // scaledSize expects Size-like obj in newer API usage; use width/height literal
          scaledSize: { width: 32, height: 32 },
        },
      });

      setIsMapInit(true);

      // small resize trigger so map tiles render properly
      setTimeout(() => {
        try {
          window.google.maps.event.trigger(mapInstance.current, "resize");
        } catch (e) {
          // ignore
        }
      }, 100);
    } catch (e) {
      console.error("MapDisplay init error (caught):", e);
    }
    // Intentionally run once like original
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DRAG HANDLER for user marker
  useEffect(() => {
    if (!userMarkerInstance.current) return;

    try {
      userMarkerInstance.current.setDraggable(!!isDraggable);

      let listener = null;
      if (isDraggable && typeof onMarkerDragEnd === "function") {
        listener = userMarkerInstance.current.addListener("dragend", () => {
          const newPos = userMarkerInstance.current.getPosition();
          if (newPos && typeof onMarkerDragEnd === "function") {
            onMarkerDragEnd(newPos.lat(), newPos.lng());
          }
        });
      }

      return () => {
        try {
          if (listener && typeof listener.remove === "function") {
            listener.remove();
          } else if (listener && window.google?.maps?.event) {
            // fallback
            window.google.maps.event.removeListener(listener);
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (e) {
      console.error("MapDisplay drag handler error:", e);
    }
  }, [isDraggable, onMarkerDragEnd]);

  // UPDATE MARKERS AND BOUNDS
  useEffect(() => {
    // require map initialized and google available
    if (!isMapInit) return;
    if (!isGoogleReady()) return;
    if (!mapInstance.current || !userMarkerInstance.current) return;

    try {
      // Update user marker position if lat/lng provided
      if (typeof lat === "number" && typeof lng === "number") {
        const newPos = { lat, lng };
        userMarkerInstance.current.setPosition(newPos);

        const currentCenter = mapInstance.current.getCenter?.();
        if (currentCenter && typeof currentCenter.lat === "function") {
          const distance = calculateDistance(
            currentCenter.lat(),
            currentCenter.lng(),
            lat,
            lng
          );

          if (distance > 100) {
            // recenter only if far enough
            mapInstance.current.setCenter(newPos);
            mapInstance.current.setZoom(15);
          }
        } else {
          // if getCenter not available, still set center once
          mapInstance.current.setCenter(newPos);
        }
      }

      // clear old technician markers
      technicianMarkers.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch (e) {
          // ignore per-marker errors
        }
      });
      technicianMarkers.current = [];

      const bounds = new window.google.maps.LatLngBounds();

      if (typeof lat === "number" && typeof lng === "number") {
        bounds.extend({ lat, lng });
      }

      let hasTechnicians = false;

      technicians?.forEach((tech) => {
        try {
          const { id, lat: techLat, lng: techLng } = tech;

          // ensure numeric coords
          if (
            techLat != null &&
            techLng != null &&
            !Number.isNaN(Number(techLat)) &&
            !Number.isNaN(Number(techLng))
          ) {
            hasTechnicians = true;

            const techPos = { lat: Number(techLat), lng: Number(techLng) };
            bounds.extend(techPos);

            const marker = new window.google.maps.Marker({
              position: techPos,
              map: mapInstance.current,
              
              icon: {
                url: createTechnicianIcon("#EF4444"), // Màu đỏ rực rỡ
                scaledSize: new window.google.maps.Size(40, 48),
                anchor: new window.google.maps.Point(20, 48), // Gắn mũi nhọn vào đúng vị trí tọa độ
              },
            });
            const hoverInfoWindow = new window.google.maps.InfoWindow({
  content: createTechTooltip(tech.name || `Kỹ thuật viên ${id}`),
  disableAutoPan: true,
});

marker.addListener("mouseover", () => {
  hoverInfoWindow.open({
    anchor: marker,
    map: mapInstance.current,
  });
});

marker.addListener("mouseout", () => {
  hoverInfoWindow.close();
});

            const techPopup = popupContent?.find((p) => p.id === id);
            if (techPopup?.content) {
              const infoWindow = new window.google.maps.InfoWindow({
                content: techPopup.content,
              });
              marker.addListener("click", () =>
                infoWindow.open({ anchor: marker, map: mapInstance.current })
              );
            }

            technicianMarkers.current.push(marker);
          }
        } catch (e) {
          console.warn("Skipping technician marker due to error:", e);
        }
      });

      if (hasTechnicians) {
        // fit to bounds (with padding)
        try {
          mapInstance.current.fitBounds(bounds, { padding: 50 });
        } catch (e) {
          // fallback: set center to user if fitBounds fails
          if (typeof lat === "number" && typeof lng === "number") {
            mapInstance.current.setCenter({ lat, lng });
          }
        }
      }
    } catch (e) {
      console.error("MapDisplay update markers error:", e);
    }
  }, [lat, lng, technicians, popupContent, isMapInit, technicianIconUrl]);

  return (
    <div
      ref={mapRef}
      style={{
        height: "100%", // keep responsive; minHeight specified
        width: "100%",
        borderRadius: "12px",
        minHeight: "200px",
      }}
      className="map-container"
    />
  );
}
