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

import {
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
  Check,
  ChevronDown,
  Wrench,
  Locate,
} from "lucide-react";

import MapDisplay, { calculateDistance } from "../../../components/MapDisplay.jsx";
import AddHomeModal from "../home/AddHome.jsx";
import EditHomeModal from "../home/EditHomePage.jsx";

export function FindTechnicianPage({ loggedInUser }) {
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
  const [isAddHomeModalOpen, setIsAddHomeModalOpen] = useState(false);
  const [isEditHomeModalOpen, setIsEditHomeModalOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]); 
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [serviceSearchInput, setServiceSearchInput] = useState("");
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  
  const currentHomeData = useMemo(() => {
    return homes.find((home) => home.id === selectedHomeId);
  }, [homes, selectedHomeId]);
  
  const filteredServices = useMemo(() => {
    if (!serviceSearchInput) {
        return services;
    }
    const lowercasedInput = serviceSearchInput.toLowerCase();
    return services.filter(service =>
        service.name.toLowerCase().includes(lowercasedInput)
    );
  }, [services, serviceSearchInput]);
  
  const handleServiceSelection = useCallback((serviceId) => {
      setSelectedServiceIds(prevIds => {
          if (prevIds.includes(serviceId)) {
              return prevIds.filter(id => id !== serviceId);
          } else {
              return [...prevIds, serviceId];
          }
      });
  }, []);

  const handleGetMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatusMessage(t("error.geolocation_not_supported"));
      return;
    }
    
    // Chỉ cho phép tìm kiếm theo vị trí hiện tại khi người dùng CHƯA chọn nhà
    if (loggedInUser && selectedHomeId) {
        setStatusMessage(t("error.cannot_use_my_location_with_home"));
        return;
    }
    
    setIsGettingLocation(true);
    setStatusMessage(t("ui.getting_current_location"));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setTechnicians(null); // Clear previous results
        
        // Reverse Geocode để lấy địa chỉ từ tọa độ
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.results.length > 0) {
            setAddressInput(data.results[0].formatted_address);
            setStatusMessage(t("success.my_location_set"));
          } else {
            setAddressInput("");
            setStatusMessage(t("error.geocode_failed_no_address"));
          }
        } catch (error) {
          console.error("Reverse geocode error:", error);
          setStatusMessage(t("error.geocode_failed"));
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatusMessage(t("error.geolocation_denied_or_failed"));
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const handleServiceSearchInputChange = (e) => {
    const value = e.target.value;
    setServiceSearchInput(value);
    setIsServiceDropdownOpen(true);
  };

  const selectedServiceNames = useMemo(() => {
    return selectedServiceIds.map(id => 
        services.find(s => s.id === id)?.name
    ).filter(Boolean); 
  }, [selectedServiceIds, services]);

  const autocompleteRef = useRef(null);

  const loadServices = useCallback(async () => {
    setIsServicesLoading(true);
    const result = await serviceApi.getServices();
    if (result.success) {
      setServices(result.data || []);
    } else {
      console.error("Failed to load services:", result.message);
    }
    setIsServicesLoading(false);
  }, []);

  const loadUserHomes = useCallback(async () => {
    if (!loggedInUser) { 
        setIsLoading(false);
        return { allHomes: [], defaultHomeName: null };
    }

    setIsLoading(true);

    const result = await homeApi.getHomesOfCurrentUser(1, 100);

    let initialLat = null;
    let initialLng = null;
    let initialAddress = "";
    let initialHomeId = null;
    let allHomes = [];

    if (result.success && result.data?.items && result.data.items.length > 0) {
      allHomes = result.data.items;
      setHomes(allHomes);

      const defaultHome = allHomes.find((h) => h.isDefault) || allHomes[0];

      if (defaultHome.address && defaultHome.latitude && defaultHome.longitude) {
        initialHomeId = defaultHome.id;
        initialAddress = defaultHome.address;
        initialLat = defaultHome.latitude;
        initialLng = defaultHome.longitude;
      } else {
        initialHomeId = allHomes[0].id;
      }
    } else {
      setHomes([]);
    }

    setAddressInput(initialAddress);
    setCoords({ latitude: initialLat, longitude: initialLng });
    setSelectedHomeId(initialHomeId);
    setIsLoading(false);

    return { allHomes, defaultHomeName: allHomes.find(h => h.id === initialHomeId)?.name };
  }, [loggedInUser]); 

  const handleAddressSelection = (e) => {
    const newHomeId = e.target.value;
    const newHome = homes.find((h) => h.id === newHomeId);

    setSelectedHomeId(newHomeId);
    setTechnicians(null);
    setSelectedServiceIds([]); 
    setServiceSearchInput("");

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
    setTechnicians([]); 
    setStatusMessage(
      t("ui.searching_technicians", { address: addressInput, radius })
    );
    
    const serviceIdsQuery = selectedServiceIds.length > 0 ? selectedServiceIds.join(',') : null;

    const searchResult = await serviceApi.getNearbyTechnicians(
      addressInput,
      radius,
      serviceIdsQuery 
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
  }, [addressInput, coords.latitude, coords.longitude, searchRadius, selectedServiceIds, t]);

  const reloadHomeData = () => {
    setIsAddHomeModalOpen(false);
    setIsEditHomeModalOpen(false);
    setTechnicians(null); 
    loadUserHomes();
  };
  
  const handleMarkerDrag = useCallback(async (newLat, newLng) => {
    setCoords({ latitude: newLat, longitude: newLng });
    setStatusMessage(t("ui.updating_address"));

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLat},${newLng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results.length > 0) {
        setAddressInput(data.results[0].formatted_address);
        setStatusMessage(t("success.geocode_success"));
      } else {
        setStatusMessage(t("error.address_invalid"));
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
      setStatusMessage(t("error.geocode_failed"));
    }
  }, [t]);

  useEffect(() => {
    loadUserHomes();
    loadServices();
  }, [loadUserHomes, loadServices]);

  useEffect(() => {
    if (
      coords.latitude &&
      coords.longitude &&
      technicians === null
    ) {
      // handleFindTechnician();
    }
  }, [
    coords.latitude,
    coords.longitude,
    technicians,
    handleFindTechnician,
  ]);
  
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => initAutocomplete();
      return () => document.head.removeChild(script);
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      const input = document.getElementById("address-input");
      if (input) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
          types: ["address"],
          componentRestrictions: { country: "VN" },
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            setAddressInput(place.formatted_address);
            setCoords({
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
            setStatusMessage(t("success.geocode_success"));
          }
        });
      }
    }
  }, []);

  const handleGeocode = async () => {
    if (loggedInUser && selectedHomeId) return; 

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

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center pt-24">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-lg font-medium text-gray-700">
          {t("ui.loading_data")}
        </p>
      </div>
    );
  }

  const renderStatusMessage = (message) => {
    let icon, colorClass;
    
    const successKey = t("success.home_loaded").substring(0, 10);
    const errorKey = t("error.address_invalid").substring(0, 10);
    const searchingKey = t("ui.searching_technicians").substring(0, 10);

    if (message.startsWith(t("success.home_added").substring(0, 10)) || message.startsWith(t("success.home_edited").substring(0, 10)) || message.startsWith(successKey)) {
      icon = <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />;
      colorClass = "text-green-700 bg-green-50 border-green-200";
    } else if (message.startsWith(errorKey) || message.startsWith(t("error.address_invalid").substring(0, 10))) {
      icon = <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />;
      colorClass = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (message.startsWith(searchingKey) || message.startsWith(t("ui.searching_technicians").substring(0, 10))) {
      icon = <Loader2 className="h-4 w-4 mr-1 animate-spin flex-shrink-0" />;
      colorClass = "text-blue-700 bg-blue-50 border-blue-200";
    } else {
      icon = <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />;
      colorClass = "text-gray-600 bg-gray-50 border-gray-200";
    }

    return (
      <div
        className={`flex items-center p-2 mt-3 text-sm border rounded-lg transition-colors shadow-sm ${colorClass}`}
      >
        {icon}
        <span className="font-medium">{message}</span> 
      </div>
    );
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto pt-12 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modals */}
      {loggedInUser && isAddHomeModalOpen && (
        <AddHomeModal
          onClose={() => setIsAddHomeModalOpen(false)}
          onSuccess={reloadHomeData}
        />
      )}

      {loggedInUser && isEditHomeModalOpen && currentHomeData && (
        <EditHomeModal
          homeData={currentHomeData}
          onClose={() => setIsEditHomeModalOpen(false)}
          onSuccess={reloadHomeData}
        />
      )}

      <h1 className="text-2xl md:text-3xl font-extrabold mb-6 text-gray-900 border-b-2 border-blue-600 pb-3">
        <Search className="inline-block h-6 w-6 text-blue-600 mr-2" />
        {t("ui.search_technicians_title")}
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 mb-4 lg:items-stretch">
        <div className="lg:w-1/2 flex flex-col">
          <div className="p-4 border border-gray-200 rounded-xl shadow-md bg-white space-y-2 flex-1 flex flex-col">
            <h2 className="text-base font-bold text-gray-900 flex items-center border-b-2 border-blue-100 pb-2">
              <MapPin className="h-4 w-4 text-blue-600 mr-1" />
              {t("ui.confirm_address_and_range")}
            </h2>
            
            {loggedInUser && homes.length > 0 ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    {t("ui.select_service_address")}
                  </label>
                  <div className="flex flex-wrap gap-1 items-stretch">
                    <select
                      value={selectedHomeId || ""}
                      onChange={handleAddressSelection}
                      className="flex-grow min-w-[160px] h-10 px-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm font-medium"
                    >
                      <option value="" disabled>
                        {t("ui.select_service_needed")}
                      </option>
                      {homes.map((home) => (
                        <option key={home.id} value={home.id}>
                          {home.name} ({home.address.substring(0, 25)}...)
                        </option>
                      ))}
                    </select>

                    {currentHomeData && (
                      <button
                        onClick={() => setIsEditHomeModalOpen(true)}
                        className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center flex-shrink-0 font-semibold"
                        title={t("ui.edit_address")}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddHomeModalOpen(true)}
                      className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center flex-shrink-0 font-semibold"
                      title={t("ui.add_new")}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>

                  {currentHomeData && (
                    <p className="mt-2 text-sm text-blue-900 flex items-start gap-1 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg shadow-sm">
                      <Home className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                      <span><span className="font-bold">{currentHomeData.name}:</span> {currentHomeData.address}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : loggedInUser ? (
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-600 font-medium mb-3 text-sm">
                  {statusMessage || t("ui.no_properties_found")}
                </p>
                <button
                  onClick={() => setIsAddHomeModalOpen(true)}
                  className="px-5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all active:scale-95 shadow-md flex items-center justify-center mx-auto"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  {t("ui.add_new")}
                </button>
              </div>
            ) : (
                 <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-gray-600 font-medium mb-3 text-sm">
                        {t("ui.enter_address_to_search", { defaultValue: "Vui lòng nhập địa chỉ để tìm kiếm dịch vụ." })}
                    </p>
               </div>
            )}
            
            <div className="relative">
                <label
                    htmlFor="service-search-input"
                    className="block text-sm font-semibold text-gray-800 mb-1 flex items-center"
                >
                    <Wrench className="h-4 w-4 text-blue-600 mr-1" />
                    {t("ui.select_service_label", { defaultValue: "Tìm kiếm hoặc Chọn Dịch vụ" })}
                </label>
                <div className="relative">
                  <input
                      id="service-search-input"
                      type="text"
                      placeholder={t("ui.search_service_placeholder", { defaultValue: "Gõ tên dịch vụ..." })}
                      value={serviceSearchInput}
                      onChange={handleServiceSearchInputChange}
                      onFocus={() => setIsServiceDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsServiceDropdownOpen(false), 200)} 
                      className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium pr-10 shadow-sm hover:border-gray-400"
                      disabled={isSearching || isServicesLoading}
                  />
                  
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      {isServicesLoading ? (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                          <ChevronDown className="h-4 w-4" />
                      )}
                  </div>
                </div>
                
                {selectedServiceIds.length > 0 && (
                    <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 text-blue-900 rounded-lg shadow-sm">
                        <div className="flex flex-wrap gap-1.5">
                            {selectedServiceNames.map((name, index) => (
                                <span key={index} className="flex items-center text-sm px-2.5 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-sm hover:shadow-md transition-all">
                                    {name}
                                    <button 
                                        onClick={() => handleServiceSelection(selectedServiceIds[index])} 
                                        className="ml-1.5 hover:text-blue-100 transition-colors"
                                        title={t("ui.clear_selection", { defaultValue: "Xóa lựa chọn" })}
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {(isServiceDropdownOpen && !isServicesLoading) && (
                    <ul className="absolute z-20 w-full bg-white border-2 border-gray-300 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredServices.map((service) => {
                            const isSelected = selectedServiceIds.includes(service.id);
                            return (
                                <li
                                    key={service.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); 
                                        handleServiceSelection(service.id);
                                    }}
                                    className={`p-2.5 cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-800'}`}
                                >
                                    {service.name}
                                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                                </li>
                            );
                        })}
                        {filteredServices.length === 0 && serviceSearchInput && (
                             <li className="p-2.5 text-gray-500 text-sm text-center">
                                 {t("ui.no_results_found", { defaultValue: "Không tìm thấy kết quả" })}
                             </li>
                        )}
                    </ul>
                )}
            </div>

            <div>
              <label
                htmlFor="search-radius"
                className="block text-sm font-semibold text-gray-800 mb-1 flex items-center"
              >
                <Globe className="h-4 w-4 text-blue-600 mr-1" />
                {t("ui.search_radius_label")}
              </label>
              <div className="relative">
                <input
                  id="search-radius"
                  type="number"
                  min="1"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium pr-14 shadow-sm hover:border-gray-400"
                  placeholder={t("form.placeholder.search_radius")}
                  disabled={isSearching}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm flex items-center">
                  {t("ui.search_radius_unit")}
                </span>
              </div>
            </div>
            
           {!loggedInUser || (loggedInUser && !selectedHomeId) ? ( 
              <div className="relative space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {t("ui.manual_address_label")}
                </label>
                <input
                  id="address-input"
                  type="text"
                  placeholder={t("form.placeholder.address")}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onBlur={handleGeocode}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                  disabled={isSearching || isGettingLocation} // <--- Cập nhật: disable khi đang lấy vị trí
                />

                <button
                    onClick={handleGetMyLocation}
                    disabled={isSearching || isGettingLocation}
                    className="w-full py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.99] mt-2"
                >
                    {isGettingLocation ? (
                        <>
                            <Loader2 className="h-4 w-4 text-white mr-1 animate-spin" />
                            {t("ui.getting_location")}
                        </>
                    ) : (
                        <>
                            <Locate className="h-4 w-4 mr-1" />
                            {t("ui.use_my_current_location", { defaultValue: "Sử dụng Vị trí Hiện tại của tôi" })}
                        </>
                    )}
                </button>
              </div>
            ) : null}
            
            {renderStatusMessage(statusMessage)}
            
            <button
              onClick={handleFindTechnician}
              disabled={
                !coords.latitude ||
                isSearching ||
                parseFloat(searchRadius) <= 0
              }
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center active:scale-[0.98]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 text-white mr-1 animate-spin" />
                  {t("ui.searching")}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  {t("ui.find_technicians_button", { radius: searchRadius })}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 flex"> 
          <MapDisplay
            lat={coords.latitude}
            lng={coords.longitude}
            technicians={technicians}
            isDraggable={!loggedInUser || (loggedInUser && !selectedHomeId)} 
            onMarkerDrag={handleMarkerDrag}
          />
        </div>
      </div>

      <div className="p-4 border-2 border-gray-200 rounded-xl bg-white shadow-md max-h-[450px] overflow-y-auto">
        <h3 className="font-bold text-lg md:text-xl mb-4 text-gray-900 flex items-center border-b-2 border-red-200 pb-3">
          <ChevronsDown className="h-5 w-5 text-red-600 mr-1" />
          {t("ui.technicians_list_title", {
            count: technicians ? technicians.length : 0,
          })}
        </h3>

        {isSearching && (
          <p className="text-center text-blue-600 flex items-center justify-center p-3 font-medium">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            {t("ui.loading_data")}
          </p>
        )}

        {technicians && technicians.length === 0 && !isSearching && (
          <div className="text-center p-6 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-2" />
            <p className="text-gray-700 font-semibold text-base">
              {t("ui.no_technicians_found", { radius: searchRadius })}
            </p>
          </div>
        )}

        {technicians && technicians.length > 0 && (
          <ul className="space-y-3">
            {technicians.map((tech, index) => (
              <li
                key={tech.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center mb-3 sm:mb-0 w-full sm:w-auto">
                  <span
                    className={`text-xl font-bold mr-2 w-7 text-center ${
                      index < 3 ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mr-2 border-2 border-red-300 shadow-sm">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-900 text-sm">
                      {tech.name}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 mt-1 gap-1.5">
                      <div className="flex items-center">
                        <Star
                          className="h-3.5 w-3.5 text-yellow-500 mr-1"
                          fill="currentColor"
                        />
                        <span className="font-semibold">
                          {tech.rating || t("ui.not_updated")}
                        </span>
                      </div>
                      <span className="text-red-600 font-bold">
                        • {tech.distance} {t("ui.search_radius_unit")}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-sm px-5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all active:scale-95 shadow-md w-full sm:w-auto mt-2 sm:mt-0">
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