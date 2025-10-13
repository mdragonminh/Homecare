import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { homeApi } from "../../../services/homeApi.jsx";
import { serviceApi } from "../../../services/serviceApi.jsx";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  Loader2,
  PlusCircle,
  Edit,
  MapPin,
  Search,
  Home,
  ChevronsDown,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Star,
  Globe,
} from "lucide-react";
import AddHomeModal from "../home/AddHome.jsx";
import EditHomeModal from "../home/EditHomePage.jsx";

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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
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

const MapDisplay = ({ lat, lng, technicians, onDragEnd }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const technicianMarkers = useRef([]);
  const defaultCoords = { lat: 21.0285, lng: 105.8542 };

  useEffect(() => {
    if (!mapRef.current) return;

    const initialLat = lat || defaultCoords.lat;
    const initialLng = lng || defaultCoords.lng;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        layers: [
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          }),
        ],
      });

      markerInstance.current = L.marker([initialLat, initialLng], {
        icon: customMarkerIcon,
        draggable: true,
      }).addTo(mapInstance.current);

      markerInstance.current.on("dragend", (e) => {
        const position = e.target.getLatLng();
        onDragEnd(position.lat, position.lng);
      });
    }

    if (lat && lng) {
      const newLatlng = L.latLng(lat, lng);
      const currentCenter = mapInstance.current.getCenter();
      const distance = L.latLng(currentCenter).distanceTo(newLatlng);

      if (distance > 100) {
        mapInstance.current.setView(newLatlng, 15);
      }

      markerInstance.current
        .setLatLng(newLatlng)
        .bindPopup(`<b>${t("ui.search_by_name_or_address")}</b>`)
        .openPopup();
    }

    technicianMarkers.current.forEach((marker) => marker.remove());
    technicianMarkers.current = [];

    if (technicians && technicians.length > 0) {
      const bounds = L.latLngBounds(L.latLng(lat, lng));

      technicians.forEach((tech) => {
        const techLatLng = L.latLng(tech.lat, tech.lng);
        bounds.extend(techLatLng);

        const marker = L.marker([tech.lat, tech.lng], {
          icon: technicianIcon,
        })
          .addTo(mapInstance.current)
          .bindPopup(
            `<b>${tech.name}</b><br>${t("ui.technicians.distance_label", {
              distance: tech.distance,
            })}`
          );
        technicianMarkers.current.push(marker);
      });
    }
  }, [lat, lng, technicians, onDragEnd, t]);

  return (
    <div
      ref={mapRef}
      className="h-[500px] w-full rounded-xl shadow-lg border-2 border-gray-500 relative z-0 overflow-hidden transition-all duration-300"
      style={{ minHeight: "500px" }}
    />
  );
};

export function FindTechnicianPage() {
  const { t } = useTranslation();
  const [homes, setHomes] = useState([]);
  const [selectedHomeId, setSelectedHomeId] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [addressInput, setAddressInput] = useState("");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [technicians, setTechnicians] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isAddHomeModalOpen, setIsAddHomeModalOpen] = useState(false);
  const [isEditHomeModalOpen, setIsEditHomeModalOpen] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const currentHomeData = useMemo(() => {
    return homes.find((home) => home.id === selectedHomeId);
  }, [homes, selectedHomeId]);

  const loadUserHomes = useCallback(async () => {
    setIsLoading(true);

    const result = await homeApi.getHomesOfCurrentUser(1, 100);

    let initialLat = null;
    let initialLng = null;
    let initialAddress = "";
    let message = "";
    let initialHomeId = null;

    if (result.success && result.data?.items && result.data.items.length > 0) {
      const allHomes = result.data.items;
      setHomes(allHomes);

      const defaultHome = allHomes.find((h) => h.isDefault) || allHomes[0];

      if (
        defaultHome.address &&
        defaultHome.latitude &&
        defaultHome.longitude
      ) {
        initialHomeId = defaultHome.id;
        initialAddress = defaultHome.address;
        initialLat = defaultHome.latitude;
        initialLng = defaultHome.longitude;
        message = t("success.home_added", { count: allHomes.length, name: defaultHome.name });
      } else {
        initialHomeId = allHomes[0].id;
        message = t("error.address_invalid");
      }
    } else {
      setHomes([]);
      message = t("ui.no_properties_found");
    }

    setAddressInput(initialAddress);
    setCoords({ latitude: initialLat, longitude: initialLng });
    setSelectedHomeId(initialHomeId);
    setStatusMessage(message);
    setIsLoading(false);

    setTimeout(() => setIsInitialLoadComplete(true), 100);
  }, [t]);

  const handleAddressSelection = (e) => {
    const newHomeId = e.target.value;
    const newHome = homes.find((h) => h.id === newHomeId);

    setSelectedHomeId(newHomeId);
    setTechnicians(null);

    if (newHome && newHome.latitude && newHome.longitude) {
      setAddressInput(newHome.address);
      setCoords({ latitude: newHome.latitude, longitude: newHome.longitude });
      setStatusMessage(t("success.home_edited", { name: newHome.name }));
    } else {
      setAddressInput(newHome?.address || "");
      setCoords({ latitude: null, longitude: null });
      setStatusMessage(t("error.address_invalid"));
    }
  };

  const handleFindTechnician = useCallback(async () => {
    if (!coords.latitude || !coords.longitude) {
      setStatusMessage(t("validation.address_required"));
      return;
    }

    const radius = parseFloat(searchRadius);
    if (isNaN(radius) || radius <= 0) {
      setStatusMessage(t("validation.required_fields_missing"));
      return;
    }

    setIsSearching(true);
    setTechnicians(null);
    setStatusMessage(
      t("ui.searching_technicians", { address: addressInput, radius })
    );

    const searchResult = await serviceApi.getNearbyTechnicians(
      addressInput, // Truyền địa chỉ (string)
      radius       
    );

    setIsSearching(false);

    if (searchResult.success) {
      const filteredTechnicians = searchResult.data
        .map((tech) => {
          const { id, name, latitude, longitude, rating } = tech;
          const calculatedDistance = calculateDistance(
            coords.latitude,
            coords.longitude,
            latitude,
            longitude
          );

          return {
            id,
            name,
            rating,
            latitude,
            longitude,
            lat: latitude,
            lng: longitude,
            distance: calculatedDistance,
          };
        })
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .filter((tech) => parseFloat(tech.distance) <= radius);

      setTechnicians(filteredTechnicians);
      setStatusMessage(
        t("success.technician_found", { count: filteredTechnicians.length, radius })
      );
    } else {
      setTechnicians([]);
      setStatusMessage(
        searchResult.message || t("ui.no_technicians_found")
      );
    }
  }, [addressInput, coords.latitude, coords.longitude, searchRadius, t]);

  const reloadHomeData = () => {
    setIsAddHomeModalOpen(false);
    setIsEditHomeModalOpen(false);
    setTechnicians(null);
    loadUserHomes();
  };

  useEffect(() => {
    loadUserHomes();
  }, [loadUserHomes]);

  useEffect(() => {
    if (
      isInitialLoadComplete &&
      coords.latitude &&
      coords.longitude &&
      technicians === null
    ) {
      handleFindTechnician();
    }
  }, [
    isInitialLoadComplete,
    coords.latitude,
    coords.longitude,
    technicians,
    handleFindTechnician,
  ]);

  const handleGeocode = async () => {
    if (selectedHomeId) return;

    if (!addressInput) {
      setCoords({ latitude: null, longitude: null });
      setStatusMessage(t("validation.address_required"));
      return;
    }

    setTechnicians(null);
    setStatusMessage(t("ui.loading_data"));

    const geocodeResult = await homeApi.geocodeAddress(addressInput);

    if (geocodeResult.success) {
      setCoords({
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
      });
      setStatusMessage(t("success.geocode_success"));
    } else {
      setCoords({ latitude: null, longitude: null });
      setStatusMessage(
        geocodeResult.message || t("error.address_invalid")
      );
    }
  };

  const handleDragEnd = async (lat, lng) => {
    setIsReverseGeocoding(true);
    setTechnicians(null);
    setStatusMessage(t("ui.loading_data"));

    setCoords({ latitude: lat, longitude: lng });
    setSelectedHomeId(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data?.display_name) {
        setAddressInput(data.display_name);
        setStatusMessage(
          t("success.location_updated", { address: data.display_name })
        );
      } else {
        setAddressInput(`Lat: ${lat}, Lng: ${lng}`);
        setStatusMessage(t("error.address_invalid"));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setStatusMessage(t("error.unexpected"));
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center pt-32">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-xl font-medium text-gray-700">
          {t("ui.loading_data")}
        </p>
      </div>
    );
  }

  const renderStatusMessage = (message) => {
    let icon, colorClass, text;
    if (message.startsWith(t("success.home_added").substring(0, 2))) {
      icon = <CheckCircle className="h-5 w-5 mr-2" />;
      colorClass = "text-green-700 bg-green-100 border-green-300";
      text = message.substring(3);
    } else if (message.startsWith(t("error.address_invalid").substring(0, 2))) {
      icon = <AlertTriangle className="h-5 w-5 mr-2" />;
      colorClass = "text-amber-700 bg-amber-100 border-amber-300";
      text = message.substring(3);
    } else if (message.startsWith(t("ui.searching_technicians").substring(0, 2))) {
      icon = <Loader2 className="h-5 w-5 mr-2 animate-spin" />;
      colorClass = "text-blue-700 bg-blue-100 border-blue-300";
      text = message.substring(3);
    } else {
      icon = <MapPin className="h-5 w-5 mr-2" />;
      colorClass = "text-gray-600 bg-gray-100 border-gray-300";
      text = message;
    }

    return (
      <div
        className={`flex items-center p-3 mt-4 text-sm border rounded-lg transition-colors shadow-sm ${colorClass}`}
      >
        {icon}
        <span className="font-medium">{text}</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pt-16 min-h-screen bg-gray-50">
      {isAddHomeModalOpen && (
        <AddHomeModal
          onClose={() => setIsAddHomeModalOpen(false)}
          onSuccess={reloadHomeData}
        />
      )}

      {isEditHomeModalOpen && currentHomeData && (
        <EditHomeModal
          homeData={currentHomeData}
          onClose={() => setIsEditHomeModalOpen(false)}
          onSuccess={reloadHomeData}
        />
      )}

      <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900 border-b pb-4">
        <Search className="inline-block h-7 w-7 text-blue-600 mr-2" />
        {t("ui.search_technicians_title")}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="lg:w-1/2 space-y-6">
          <div className="p-6 border rounded-xl shadow-md bg-white space-y-5 h-full">
            <h2 className="text-xl font-bold text-gray-800 flex items-center border-b pb-3 mb-4">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              {t("ui.confirm_address_and_range")}
            </h2>
            {homes.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("ui.select_service_address")}
                  </label>
                  <div className="flex flex-wrap gap-2 items-stretch">
                    <select
                      value={selectedHomeId || ""}
                      onChange={handleAddressSelection}
                      className="flex-grow min-w-[180px] h-10 p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 hover:border-blue-500 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                    >
                      <option value="" disabled>
                        {t("ui.select_saved_address")}
                      </option>
                      {homes.map((home) => (
                        <option key={home.id} value={home.id}>
                          {home.name} ({home.address.substring(0, 30)}...)
                        </option>
                      ))}
                    </select>

                    {currentHomeData && (
                      <button
                        onClick={() => setIsEditHomeModalOpen(true)}
                        className="w-10 h-10 bg-amber-500 text-white rounded-lg shadow-sm hover:bg-amber-600 transition-colors flex items-center justify-center flex-shrink-0"
                        title={t("ui.edit_address")}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddHomeModalOpen(true)}
                      className="w-10 h-10 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center flex-shrink-0"
                      title={t("ui.add_new")}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>

                  {currentHomeData && (
                    <p className="mt-3 text-sm text-gray-700 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-inner">
                      <Home className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="font-bold">{currentHomeData.name}:</span>{" "}
                      {currentHomeData.address}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 my-4"></div>
              </div>
            ) : (
              <div className="text-center p-5 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-600 font-medium mb-4 text-base">
                  {statusMessage || t("ui.no_properties_found")}
                </p>
                <button
                  onClick={() => setIsAddHomeModalOpen(true)}
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center mx-auto"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  {t("ui.add_new")}
                </button>
              </div>
            )}
            <div className="mt-4">
              <label
                htmlFor="search-radius"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                {t("ui.search_radius_label")}
              </label>
              <div className="relative">
                <input
                  id="search-radius"
                  type="number"
                  min="1"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium pr-12 shadow-sm"
                  placeholder={t("form.placeholder.search_radius")}
                  disabled={isSearching}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium flex items-center">
                  <Globe className="h-4 w-4 mr-1" /> {t("ui.search_radius_unit")}
                </span>
              </div>
            </div>
            {!selectedHomeId && (
              <div className="relative mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("ui.manual_address_label")}
                </label>
                <input
                  type="text"
                  placeholder={t("form.placeholder.address")}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onBlur={handleGeocode}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all pr-10 shadow-sm"
                  disabled={isSearching || isReverseGeocoding}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center mt-7">
                  {isReverseGeocoding ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <Navigation className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            )}
            {renderStatusMessage(statusMessage)}
            <button
              onClick={handleFindTechnician}
              disabled={
                !coords.latitude ||
                isSearching ||
                isReverseGeocoding ||
                parseFloat(searchRadius) <= 0
              }
              className="w-full mt-6 py-3 bg-blue-600 text-white font-bold text-base rounded-lg shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.005] active:scale-[0.995]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 text-white mr-2 animate-spin" />
                  {t("ui.searching")}
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  {t("ui.find_technicians_button", { radius: searchRadius })}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:w-1/2">
          <MapDisplay
            lat={coords.latitude}
            lng={coords.longitude}
            technicians={technicians}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>

      <div className="p-6 border rounded-xl bg-white shadow-xl max-h-[500px] overflow-y-auto">
        <h3 className="font-bold text-xl md:text-2xl mb-4 text-gray-800 flex items-center border-b pb-3">
          <ChevronsDown className="h-6 w-6 text-red-600 mr-2" />
          {t("ui.technicians_list_title", {
            count: technicians ? technicians.length : 0,
          })}
        </h3>

        {isSearching && (
          <p className="text-center text-blue-600 flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {t("ui.loading_data")}
          </p>
        )}

        {technicians && technicians.length === 0 && !isSearching && (
          <div className="text-center p-6 border border-red-300 rounded-lg bg-red-50">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              {t("ui.no_technicians_found", { radius: searchRadius })}
            </p>
          </div>
        )}

        {technicians && technicians.length > 0 && (
          <ul className="space-y-4">
            {technicians.map((tech, index) => (
              <li
                key={tech.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-150 cursor-pointer shadow-sm"
              >
                <div className="flex items-center mb-3 sm:mb-0">
                  <span
                    className={`text-lg font-bold mr-4 ${
                      index < 3 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {index + 1}.
                  </span>
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 border border-red-300">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">
                      {tech.name}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 mt-0.5">
                      <Star
                        className="h-4 w-4 text-yellow-500 mr-1"
                        fill="currentColor"
                      />
                      <span className="font-semibold mr-3">
                        {tech.rating || t("ui.not_updated")}
                      </span>
                      <span className="text-red-600 font-extrabold">
                        • {tech.distance} {t("ui.search_radius_unit")}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-sm px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md w-full sm:w-auto mt-2 sm:mt-0">
                  {t("ui.select_technician")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}