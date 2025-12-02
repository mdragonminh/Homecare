import React, { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line react-refresh/only-export-components
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
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

  // Icon URLs
  const technicianIconUrl = useMemo(() => 
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
  , []);
  
  const userIconUrl = useMemo(() => 
    "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
  , []);
  useEffect(() => {
    if (!mapRef.current || isMapInit || !window.google?.maps) return;

    const initialLat = lat || 21.0285;
    const initialLng = lng || 105.8542;
    const initialLocation = new window.google.maps.LatLng(initialLat, initialLng);
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
      title: t("ui.your_service_location", { defaultValue: "Vị trí dịch vụ của bạn" }),
      draggable: false, 
      icon: {
          url: userIconUrl,
          scaledSize: new window.google.maps.Size(32, 32),
      }
    });
    
    setIsMapInit(true);

    setTimeout(() => {
        window.google.maps.event.trigger(mapInstance.current, 'resize');
    }, 100);

  }, []); 
  useEffect(() => {
    if (!userMarkerInstance.current) return;
    userMarkerInstance.current.setDraggable(isDraggable);
    let listener = null;
    if (isDraggable && onMarkerDragEnd) {
      listener = userMarkerInstance.current.addListener('dragend', () => {
        const newPos = userMarkerInstance.current.getPosition();
        onMarkerDragEnd(newPos.lat(), newPos.lng()); 
      });
    }
    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [isDraggable, onMarkerDragEnd]);
  useEffect(() => {
    if (!isMapInit || !lat || !lng || !mapInstance.current || !userMarkerInstance.current) return;

    const newPos = new window.google.maps.LatLng(lat, lng);
    userMarkerInstance.current.setPosition(newPos);
    const currentCenter = mapInstance.current.getCenter();
    const distance = calculateDistance(currentCenter.lat(), currentCenter.lng(), lat, lng);
    
    if (distance > 100) {
        mapInstance.current.setCenter(newPos);
        mapInstance.current.setZoom(15);
    }
    technicianMarkers.current.forEach(marker => marker.setMap(null));
    technicianMarkers.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(newPos); 
    let hasTechnicians = false;
    
    technicians?.forEach(tech => { 
        const { id, lat: techLat, lng: techLng } = tech; 
        
        if (techLat && techLng) {
            hasTechnicians = true;
            const techPos = new window.google.maps.LatLng(techLat, techLng);
            bounds.extend(techPos);

            const marker = new window.google.maps.Marker({
                position: techPos,
                map: mapInstance.current,
                title: tech.name || `Kỹ thuật viên ${id}`,
                icon: {
                    url: technicianIconUrl,
                    scaledSize: new window.google.maps.Size(32, 32),
                },
            });

            const techPopup = popupContent?.find(p => p.id === id); 
            if (techPopup?.content) {
               const infoWindow = new window.google.maps.InfoWindow({ content: techPopup.content });
               marker.addListener('click', () => { infoWindow.open({ anchor: marker, map: mapInstance.current }); });
            }

            technicianMarkers.current.push(marker);
        }
    });
    if (hasTechnicians) {
        mapInstance.current.fitBounds(bounds, { padding: 50 });
    }
    
  }, [lat, lng, technicians, popupContent, isMapInit, technicianIconUrl]);

  return (
    <div
      ref={mapRef}
      style={{ 
        height: "100%", // ĐÃ ĐỔI TỪ "500px" SANG "100%"
        width: "100%", 
        borderRadius: "12px",
        minHeight: '200px',
      }}
      className="map-container"
    />
  );
}