import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { homeApi } from "../services/homeApi.jsx";
import { serviceApi } from "../services/serviceApi.jsx";
import { calculateDistance } from "../components/findTechnician/MapDisplay.jsx";
import { loadGoogleMapsAPI } from "../utils/googleMapsLoader";
const getInitialDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

// ---------------------------------------------------------------------
// CUSTOM HOOK: useFindTechnician
// ---------------------------------------------------------------------

export function useFindTechnician(loggedInUser) {
  const { t } = useTranslation();
  const [homes, setHomes] = useState([]);
  const [selectedHomeId, setSelectedHomeId] = useState(null);
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
  const initialDateTime = getInitialDateTime();
  const [preferredDate, _setPreferredDate] = useState(initialDateTime.date); // Định dạng 'YYYY-MM-DD'
  const [preferredTime, _setPreferredTime] = useState(initialDateTime.time);
  const [isUserSetDateTime, setIsUserSetDateTime] = useState(false);
  const autocompleteRef = useRef(null);
  const setPreferredDate = useCallback((date) => {
    _setPreferredDate(date);
    setIsUserSetDateTime(true);
  }, []);
  const setPreferredTime = useCallback((time) => {
    _setPreferredTime(time);
    setIsUserSetDateTime(true);
  }, []);

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
  const validatePreferredDateTime = useCallback(() => {
    if (!preferredDate || !preferredTime) {
      return {
        isValid: false,
        message: t("validation.missing_date_time", {
          defaultValue: "Vui lòng chọn ngày và giờ.",
        }),
      };
    }
    const selectedDateTime = new Date(`${preferredDate}T${preferredTime}:00`);
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 120 * 1000);

    if (selectedDateTime.getTime() < twoMinutesAgo.getTime()) {
      return {
        isValid: false,
        message: t("validation.past_date_time", {
          defaultValue: "Ngày giờ đã chọn phải là thời điểm trong tương lai.",
        }),
      };
    }

    return { isValid: true, message: null };
  }, [preferredDate, preferredTime, t]);

  const handleCreateAndMatchBooking = useCallback(async () => {
    if (!addressInput || !loggedInUser?.userId) {
      setStatusMessage({
        text: t("validation.missing_address_or_login", {
          defaultValue: "Vui lòng đảm bảo bạn đã đăng nhập và đã chọn địa chỉ.",
        }),
        type: "error",
      });
      return;
    }
    if (selectedServiceIds.length === 0) {
      setStatusMessage({
        text: t("validation.service_required", {
          defaultValue: "Vui lòng chọn ít nhất một dịch vụ để tạo yêu cầu.",
        }),
        type: "error",
      });
      return;
    }

    const validationResult = validatePreferredDateTime();
    if (!validationResult.isValid) {
      setStatusMessage({
        text: validationResult.message,
        type: "error",
      });
      return;
    }

    // Bắt đầu quá trình matching
    setIsMatching(true);
    setStatusMessage({
      text: t("ui.matching_technician_process", {
        defaultValue: "Đang tạo yêu cầu và ghép nối kỹ thuật viên...",
      }),
      type: "searching",
    });
    let preferredDateTime = null;
    if (preferredDate && preferredTime) {
      const vietnamDateTime = new Date(
        `${preferredDate}T${preferredTime}:00+07:00`
      );
      if (!isUserSetDateTime) {
        const newTime = vietnamDateTime.getTime() + 10 * 60 * 1000;
        vietnamDateTime.setTime(newTime);
      }
      preferredDateTime = vietnamDateTime.toISOString();

      console.log("Frontend gửi desireDateTime:", preferredDateTime);
    }
    setIsMatching(true);
    setStatusMessage({
      text: t("ui.matching_technician_process", {
        defaultValue: "Đang tạo yêu cầu và ghép nối kỹ thuật viên...",
      }),
      type: "searching",
    });

    try {
      const matchResult = await serviceApi.createAndMatchBooking(
        addressInput,
        selectedServiceIds,
        loggedInUser.userId,
        preferredDateTime
      );

      if (matchResult.success) {
        const responseData = matchResult.data;

        if (responseData?.isMatched === true) {
          setStatusMessage({
            text: t("success.match_booking_success", {
              defaultValue: "Đã ghép nối thành công với kỹ thuật viên!",
            }),
            type: "success",
          });
        } else if (responseData?.isMatched === false) {
          setStatusMessage({
            text: t("error.no_technician_accepted_match", {
              defaultValue:
                "Yêu cầu đã được tạo nhưng chưa có kỹ thuật viên nhận. Vui lòng thử lại sau.",
            }),
            type: "error",
          });
        } else {
          setStatusMessage({
            text: t("success.request_created_pending_match", {
              defaultValue:
                "Yêu cầu đã được tạo thành công. Đang chờ kỹ thuật viên xác nhận...",
            }),
            type: "success",
          });
        }
      } else {
        setStatusMessage({
          text:
            matchResult.message ||
            t("error.match_booking_failed", {
              defaultValue: "Ghép nối thất bại.",
            }),
          type: "error",
        });
      }
    } catch (err) {
      console.error("Match booking error:", err);
      setStatusMessage({
        text: t("error.unexpected_error", {
          defaultValue: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        }),
        type: "error",
      });
    } finally {
      setIsMatching(false);
    }
  }, [
    addressInput,
    selectedServiceIds,
    loggedInUser,
    preferredDate,
    preferredTime,
    isUserSetDateTime,
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
    // Đã loại bỏ việc reset dịch vụ

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

    const radiusForDisplay = 50;

    setIsSearching(true);
    setTechnicians([]);
    setStatusMessage({
      text: t("ui.searching_technicians", {
        address: addressInput,
        radius: radiusForDisplay,
      }),
      type: "searching",
    });

    const searchResult = await serviceApi.getNearbyTechnicians(
      addressInput,
      selectedServiceIds.map(String)
    );

    setIsSearching(false);

    if (searchResult.success) {
      const techniciansResult = searchResult.data
        .map((tech) => {
          const { latitude, longitude } = tech;
          const calculatedDistanceInMeters = calculateDistance(
            coords.latitude,
            coords.longitude,
            latitude,
            longitude
          );
          const calculatedDistanceInKm = (
            calculatedDistanceInMeters / 1000
          ).toFixed(2);
          return {
            ...tech,
            distance: calculatedDistanceInKm,
            lat: latitude,
            lng: longitude,
          };
        })
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      setTechnicians(techniciansResult);

      const count = techniciansResult.length;

      if (count === 0) {
        setStatusMessage({
          text: t("ui.no_technicians_found", {
            defaultValue: "Không tìm thấy kỹ thuật viên phù hợp.",
          }),
          type: "warning",
        });
      } else {
        setStatusMessage({
          text: t("success.technician_found", {
            count: count,
            radius: radiusForDisplay,
            defaultValue: `Đã tìm thấy ${count} kỹ thuật viên.`,
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
  }, [addressInput, coords.latitude, coords.longitude, selectedServiceIds, t]);

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
                type: "success",
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
 useEffect(() => {
    if (!loggedInUser || isUserSetDateTime) return;

    const updateCurrentDateTime = () => {
      const now = new Date();
      // ********** SỬA Ở ĐÂY **********
      // Lấy các thành phần ngày/tháng/năm theo múi giờ địa phương
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      
      const date = `${year}-${month}-${day}`; // Định dạng YYYY-MM-DD
      const time = now.toTimeString().slice(0, 5); // HH:MM (24h format)
      // **********************************

      _setPreferredDate(date);
      _setPreferredTime(time);
    };
    updateCurrentDateTime();
    const intervalId = setInterval(updateCurrentDateTime, 1000);

    return () => clearInterval(intervalId);
  }, [isUserSetDateTime, loggedInUser]);
  // ---------------------------------------------------------------------
  // RETURN VALUES
  // ---------------------------------------------------------------------

  return {
    // State
    homes,
    selectedHomeId,
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
    setAddressInput,
    setIsAddHomeModalOpen,
    setIsEditHomeModalOpen,
    setIsServiceDropdownOpen,
    setServiceSearchInput,
    setPreferredDate,
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
    validatePreferredDateTime,
  };
}
