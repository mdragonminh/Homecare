import React, { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// eslint-disable-next-line react-refresh/only-export-components
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
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
              title: tech.name || `Kỹ thuật viên ${id}`,
              icon: {
                url: technicianIconUrl,
                scaledSize: { width: 32, height: 32 },
              },
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
