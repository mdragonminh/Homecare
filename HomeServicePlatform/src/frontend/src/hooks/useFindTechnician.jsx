// src/hooks/useFindTechnician.jsx (Tên file đề xuất)

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { homeApi } from "../services/homeApi.jsx";
import { serviceApi } from "../services/serviceApi.jsx";
import { calculateDistance } from "../components/findTechnician/MapDisplay.jsx";

// ---------------------------------------------------------------------
// CUSTOM HOOK: useFindTechnician
// ---------------------------------------------------------------------

export function useFindTechnician(loggedInUser) {
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
  const [isMatching, setIsMatching] = useState(false);
  
  const autocompleteRef = useRef(null);

  const currentHomeData = useMemo(() => {
    return homes.find((home) => home.id === selectedHomeId);
  }, [homes, selectedHomeId]);

  const filteredServices = useMemo(() => {
    if (!serviceSearchInput) {
      return services;
    }
    const lowercasedInput = serviceSearchInput.toLowerCase();
    return services.filter((service) =>
      service.name.toLowerCase().includes(lowercasedInput)
    );
  }, [services, serviceSearchInput]);

  const selectedServiceNames = useMemo(() => {
    return selectedServiceIds.map(id => 
        services.find(s => s.id === id)?.name
    ).filter(Boolean); 
  }, [selectedServiceIds, services]);

  const handleServiceSelection = useCallback((serviceId) => {
    setSelectedServiceIds((prevIds) => {
      if (prevIds.includes(serviceId)) {
        return prevIds.filter((id) => id !== serviceId);
      } else {
        return [...prevIds, serviceId];
      }
    });
  }, []);

  const handleCreateAndMatchBooking = useCallback(async () => {
    if (!addressInput || selectedServiceIds.length === 0 || !loggedInUser?.userId) {
      setStatusMessage(t("validation.missing_booking_info", { defaultValue: "Vui lòng nhập địa chỉ và chọn dịch vụ." }));
      console.error("VALIDATION FAILED: Missing one of address, services, or customerId.");
      return;
    }

    setIsMatching(true);
    setTechnicians(null); 
    setStatusMessage(t("ui.matching_technician_process", { defaultValue: "Đang tạo yêu cầu và tìm kiếm kỹ thuật viên phù hợp..." }));

    const radius = parseFloat(searchRadius);

    const matchResult = await serviceApi.createAndMatchBooking(
      addressInput,
      selectedServiceIds,
      loggedInUser.userId,
      radius
    );

    setIsMatching(false);

    if (matchResult.success) {
      setStatusMessage(t("success.match_booking_success", { defaultValue: "Đã tạo yêu cầu thành công. Chờ kỹ thuật viên chấp nhận." }));
    } else {
      setStatusMessage(
        matchResult.message || t("error.match_booking_failed", { defaultValue: "Lỗi khi tạo yêu cầu và ghép nối." })
      );
    }
  }, [addressInput, selectedServiceIds, loggedInUser, searchRadius, t]);
  
  const handleGetMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatusMessage(t("error.geolocation_not_supported"));
      return;
    }

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
        setTechnicians(null);
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
  
  // ---------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------

  useEffect(() => {
    loadUserHomes();
    loadServices();
  }, [loadUserHomes, loadServices]);

  useEffect(() => {
    // Logic for Google Autocomplete initialization
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
  }, [t]);
  
  // ---------------------------------------------------------------------
  // RETURN VALUES
  // ---------------------------------------------------------------------

  return {
    // State
    homes,
    selectedHomeId,
    searchRadius,
    addressInput,
    coords,
    technicians,
    statusMessage,
    isLoading,
    isSearching,
    isAddHomeModalOpen,
    isEditHomeModalOpen,
    isGettingLocation,
    isServicesLoading,
    selectedServiceIds,
    isServiceDropdownOpen,
    isMatching,
    serviceSearchInput,

    // Memoized Values
    currentHomeData,
    filteredServices,
    selectedServiceNames,

    // Setters
    setSelectedHomeId, // Có thể bỏ nếu chỉ dùng qua handleAddressSelection
    setSearchRadius,
    setAddressInput,
    setIsAddHomeModalOpen,
    setIsEditHomeModalOpen,
    setIsServiceDropdownOpen,
    setServiceSearchInput,
    
    // Handlers
    handleAddressSelection,
    handleFindTechnician,
    handleCreateAndMatchBooking,
    handleGetMyLocation,
    handleServiceSearchInputChange,
    handleServiceSelection,
    reloadHomeData,
    handleMarkerDrag,
    handleGeocode,
  };
}