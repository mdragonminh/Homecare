
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { homeApi } from "../services/homeApi.jsx";
import { serviceApi } from "../services/serviceApi.jsx";
import { calculateDistance } from "../components/findTechnician/MapDisplay.jsx";
import { loadGoogleMapsAPI } from "../utils/googleMapsLoader";
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
  const [preferredDate, setPreferredDate] = useState(""); // Định dạng 'YYYY-MM-DD'
  const [preferredTime, setPreferredTime] = useState("");
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
    return selectedServiceIds
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter(Boolean);
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
      setStatusMessage({
        text: t("validation.missing_address_service_or_login", {
          defaultValue: "Vui lòng đảm bảo bạn đã đăng nhập, đã chọn địa chỉ và chọn ít nhất một dịch vụ.",
        }),
        type: "error",
      });
      return;
    }
    if (!preferredDate) {
      setStatusMessage({
        text: t("validation.preferred_date_required", {
          defaultValue: "Vui lòng chọn Ngày mong muốn để tạo yêu cầu.",
        }),
        type: "error",
      });
      return;
    }
    if (!preferredTime) {
      setStatusMessage({
        text: t("validation.preferred_time_required", {
          defaultValue: "Vui lòng chọn Giờ mong muốn để tạo yêu cầu.",
        }),
        type: "error",
      });
      return;
    }
    const localDateTime = new Date(`${preferredDate}T${preferredTime}:00`);
    const preferredDateTime = localDateTime.toISOString();
    setIsMatching(true);
    setStatusMessage({
      text: t("ui.matching_technician_process", {
        defaultValue: "Đang tạo yêu cầu và tìm kiếm kỹ thuật viên phù hợp...",
      }),
      type: "searching",
    });

    const radius = parseFloat(searchRadius);
    const matchResult = await serviceApi.createAndMatchBooking(
      addressInput,
      selectedServiceIds,
      loggedInUser.userId,
      radius,
      preferredDateTime
    );

    setIsMatching(false);

    if (matchResult.success) {
      const responseData = matchResult.data;
      if (responseData && responseData.isMatched === true) {
           setStatusMessage({
               text: t("success.match_booking_success", {
                   defaultValue: "Đã tạo yêu cầu thành công và ghép nối với kỹ thuật viên.",
               }),
               type: "success",
           });
      } 
      
      else if (responseData && responseData.isMatched === false) {
           setStatusMessage({
               text: t("error.no_technician_accepted_match", {
                   defaultValue: "Yêu cầu đã được tạo, NHƯNG không có kỹ thuật viên nào chấp nhận yêu cầu của bạn. Vui lòng thử lại sau.",
               }),
               type: "error", 
           });
      }
      else {
           setStatusMessage({
               text: t("success.request_created_pending_match", {
                   defaultValue: "Đã tạo yêu cầu thành công. Chờ kỹ thuật viên chấp nhận/xác nhận.",
               }),
               type: "success",
           });
      }

    } else {
      setStatusMessage({
        text:
          matchResult.message ||
          t("error.match_booking_failed", {
            defaultValue: "Lỗi khi tạo yêu cầu và ghép nối.",
          }),
        type: "error",
      });
    }
  }, [
    addressInput,
    selectedServiceIds,
    loggedInUser,
    searchRadius,
    preferredDate,
    preferredTime,
    t,
  ]);

  const handleGetMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatusMessage({
        text: t("error.geolocation_not_supported"),
        type: "error",
      });
      return;
    }

    if (loggedInUser && selectedHomeId) {
      setStatusMessage({
        text: t("error.cannot_use_my_location_with_home"),
        type: "error",
      });
      return;
    }

    setIsGettingLocation(true);
    setStatusMessage({
      text: t("ui.getting_current_location"),
      type: "searching",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setTechnicians(null);
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY
            }`
          );
          const data = await response.json();
          if (data.results.length > 0) {
            setAddressInput(data.results[0].formatted_address);
            setStatusMessage({
              text: t("success.my_location_set"),
              type: "success",
            });
          } else {
            setAddressInput("");
            setStatusMessage({
              text: t("error.geocode_failed_no_address"),
              type: "error",
            });
          }
        } catch (error) {
          console.error("Reverse geocode error:", error);
          setStatusMessage({
            text: t("error.geocode_failed"),
            type: "error",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatusMessage({
          text: t("error.geolocation_denied_or_failed"),
          type: "error",
        });
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

      if (
        defaultHome.address &&
        defaultHome.latitude &&
        defaultHome.longitude
      ) {
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

    return {
      allHomes,
      defaultHomeName: allHomes.find((h) => h.id === initialHomeId)?.name,
    };
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
      setStatusMessage({
        text: t("success.home_edited", { name: newHome.name }),
        type: "success",
      });
    } else {
      setAddressInput(newHome?.address || "");
      setCoords({ latitude: null, longitude: null });
      setStatusMessage({
        text: t("error.address_invalid"),
        type: "error",
      });
    }
  };
  const handleFindTechnician = useCallback(async () => {
    if (!coords.latitude || !coords.longitude) {
      setStatusMessage({
        text: t("validation.address_required"),
        type: "error",
      });
      return;
    }
    if (selectedServiceIds.length === 0) {
      setStatusMessage({
        text: t("validation.service_required", {
           defaultValue: "Vui lòng chọn ít nhất một dịch vụ để tìm kiếm.",
        }),
        type: "error",
      });
      return;
    }
    const radius = parseFloat(searchRadius);
    if (isNaN(radius) || radius <= 0) {
      setStatusMessage({
        text: t("validation.search_radius_invalid", { 
           defaultValue: "Vui lòng nhập bán kính tìm kiếm hợp lệ (phải lớn hơn 0).",
        }), 
        type: "error",
      });
      return;
    }
    setIsSearching(true);
    setTechnicians([]);
    setStatusMessage({
      text: t("ui.searching_technicians", { address: addressInput, radius }),
      type: "searching",
    });
    const searchResult = await serviceApi.getNearbyTechnicians(
      addressInput,
      radius,
      selectedServiceIds.map(String) 
    );
    setIsSearching(false);

    if (searchResult.success) {
      const filteredTechnicians = searchResult.data
        .map((tech) => {
          const { latitude, longitude } = tech;
          const calculatedDistanceInMeters = calculateDistance(
        coords.latitude,
        coords.longitude,
        latitude,
        longitude
      );
          const calculatedDistanceInKm = (calculatedDistanceInMeters / 1000).toFixed(2);
          return {
            ...tech, 
            distance: calculatedDistanceInKm,
            lat: latitude, 
            lng: longitude, 
          };
        })
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)) 
        .filter((tech) => parseFloat(tech.distance) <= radius);

      setTechnicians(filteredTechnicians);
      
      const count = filteredTechnicians.length;

      if (count === 0) {
         setStatusMessage({
          text: t("ui.no_technicians_found", {
            defaultValue: "Không tìm thấy kỹ thuật viên phù hợp trong bán kính.",
          }),
          type: "warning",
        });
      } else {
         setStatusMessage({
          text: t("success.technician_found", {
            count: count,
            radius,
            defaultValue: `Đã tìm thấy ${count} kỹ thuật viên trong bán kính ${radius} km.`,
          }),
          type: "success",
        });
      }
    } else {
      setTechnicians([]);
      setStatusMessage({
        text: searchResult.message || t("ui.no_technicians_found"),
        type: "error",
      });
    }
  }, [
    addressInput,
    coords.latitude,
    coords.longitude,
    searchRadius,
    selectedServiceIds, 
    t,
  ]);

  const reloadHomeData = () => {
    setIsAddHomeModalOpen(false);
    setIsEditHomeModalOpen(false);
    setTechnicians(null);
    loadUserHomes();
  };

  const handleMarkerDrag = useCallback(
    async (newLat, newLng) => {
      setCoords({ latitude: newLat, longitude: newLng });
      setStatusMessage({
        text: t("ui.updating_address"),
        type: "searching",
      });

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLat},${newLng}&key=${
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY
          }`
        );
        const data = await response.json();
        if (data.results.length > 0) {
          setAddressInput(data.results[0].formatted_address);
          setStatusMessage({
            text: t("success.geocode_success"),
            type: "success",
          });
        } else {
          setStatusMessage({
            text: t("error.address_invalid"),
            type: "error",
          });
        }
      } catch (error) {
        console.error("Reverse geocode error:", error);
        setStatusMessage({
          text: t("error.geocode_failed"),
          type: "error",
        });
      }
    },
    [t]
  );

  const handleGeocode = async () => {
    if (loggedInUser && selectedHomeId) return;

    if (!addressInput) {
      setCoords({ latitude: null, longitude: null });
      setStatusMessage({
        text: t("validation.address_required"),
        type: "error",
      });
      return;
    }

    setTechnicians(null);
    setStatusMessage({
      text: t("ui.loading_data"),
      type: "searching",
    });

    const geocodeResult = await homeApi.geocodeAddress(addressInput);

    if (geocodeResult.success) {
      setCoords({
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
      });
      setStatusMessage({
        text: t("success.geocode_success"),
        type: "success",
      });
    } else {
      setCoords({ latitude: null, longitude: null });
      setStatusMessage({
        text: geocodeResult.message || t("error.address_invalid"),
        type: "error",
      });
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
  let isMounted = true;

  async function initAutocomplete() {
    try {
      // Đợi Google Maps API load xong
      await loadGoogleMapsAPI();
      
      if (!isMounted) return;

      const input = document.getElementById("address-input");
      
      if (input && !autocompleteRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          input,
          {
            types: ["address"],
            componentRestrictions: { country: "VN" },
          }
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            setAddressInput(place.formatted_address);
            setCoords({
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
            setStatusMessage({
              text: t("success.geocode_success"),
              type: "success"
            });
          }
        });
      }
    } catch (error) {
      console.error("Autocomplete initialization error:", error);
    }
  }

  initAutocomplete();

  return () => {
    isMounted = false;
  };
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
    preferredDate, 
    preferredTime,
    currentHomeData,
    filteredServices,
    selectedServiceNames,

    // Setters
    setSelectedHomeId, 
    setSearchRadius,
    setAddressInput,
    setIsAddHomeModalOpen,
    setIsEditHomeModalOpen,
    setIsServiceDropdownOpen,
    setServiceSearchInput,
    setPreferredDate, // THÊM
    setPreferredTime,

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
