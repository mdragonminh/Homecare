// src/pages/FindTechnicianPage.jsx

import React, { useState, useEffect, useRef } from 'react'; 
import { useParams } from 'react-router-dom';
// ⭐️ Đảm bảo đường dẫn import homeApi là chính xác 
import { homeApi } from '../../../services/homeApi.jsx'; 
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Loader2 } from 'lucide-react'; 

// ==========================================================
// CONSTANTS & HELPERS
// ==========================================================

// Khởi tạo icon marker (giữ nguyên)
const customMarkerIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const technicianIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Hàm tính khoảng cách
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính Trái đất (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
};

// MOCK API: Giả lập việc tìm kiếm Technician 
const MOCK_SEARCH_TECHNICIANS = async (latitude, longitude, radiusKm) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Giả lập độ trễ API
    
    // Tạo 5 Technician giả
    const mockData = [
        { id: 1, name: 'Nguyễn Văn A', rating: 4.8, lat: latitude + 0.01, lng: longitude + 0.015 },
        { id: 2, name: 'Trần Thị B', rating: 4.5, lat: latitude - 0.005, lng: longitude + 0.02 },
        { id: 3, name: 'Lê Văn C', rating: 4.9, lat: latitude + 0.001, lng: longitude - 0.002 },
        { id: 4, name: 'Phạm Thị D', rating: 4.2, lat: latitude + 0.03, lng: longitude + 0.005 },
        { id: 5, name: 'Vũ Văn E', rating: 5.0, lat: latitude - 0.01, lng: longitude - 0.01 },
    ].map(tech => ({
        ...tech,
        distance: calculateDistance(latitude, longitude, tech.lat, tech.lng)
    })).filter(tech => parseFloat(tech.distance) <= radiusKm) // Lọc theo bán kính
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)); // Sắp xếp theo khoảng cách

    return { success: true, data: mockData, message: "Tìm kiếm thành công" };
};

// ==========================================================
// Map Component
// ==========================================================
const MapDisplay = ({ lat, lng, technicians, onDragEnd }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerInstance = useRef(null);
    const technicianMarkers = useRef([]);
    const defaultCoords = { lat: 21.0285, lng: 105.8542 }; // Tọa độ Hà Nội

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstance.current) {
            // Khởi tạo bản đồ lần đầu
            mapInstance.current = L.map(mapRef.current, {
                center: [lat || defaultCoords.lat, lng || defaultCoords.lng],
                zoom: 13,
                layers: [
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    })
                ]
            });
            
            // Khởi tạo marker người dùng có thể kéo
            markerInstance.current = L.marker([lat || defaultCoords.lat, lng || defaultCoords.lng], { 
                icon: customMarkerIcon, 
                draggable: true 
            }).addTo(mapInstance.current);

            markerInstance.current.on('dragend', (e) => {
                const position = e.target.getLatLng();
                onDragEnd(position.lat, position.lng);
            });
        }
        
        // Cập nhật vị trí bản đồ và marker khi lat/lng thay đổi
        if (lat && lng) {
            const newLatlng = L.latLng(lat, lng);
            
            // Chỉ di chuyển bản đồ nếu vị trí hiện tại xa vị trí mới (tránh nhấp nháy)
            const currentCenter = mapInstance.current.getCenter();
            const distance = L.latLng(currentCenter).distanceTo(newLatlng);
            if (distance > 100) { // Nếu xa hơn 100m
                 mapInstance.current.setView(newLatlng, 15); 
            }
           
            markerInstance.current.setLatLng(newLatlng)
                .bindPopup("<b>Vị trí tìm kiếm</b>")
                .openPopup();
        }

        // Xóa marker Technician cũ
        technicianMarkers.current.forEach(marker => marker.remove());
        technicianMarkers.current = [];

        // Thêm marker Technician mới
        if (technicians && technicians.length > 0) {
            technicians.forEach(tech => {
                const marker = L.marker([tech.lat, tech.lng], { 
                    icon: technicianIcon 
                })
                .addTo(mapInstance.current)
                .bindPopup(`<b>${tech.name}</b><br>Cách bạn: ${tech.distance} km`);
                technicianMarkers.current.push(marker);
            });
        }
    }, [lat, lng, technicians, onDragEnd]);

    return (
        <div 
            ref={mapRef} 
            className="h-[500px] w-full rounded-xl shadow-xl border-4 border-blue-500" 
            style={{ minHeight: '500px' }} 
        />
    );
};


// ==========================================================
// Main Component: FindTechnicianPage
// ==========================================================
export function FindTechnicianPage() {
    const { serviceId } = useParams();
    
    const [addressInput, setAddressInput] = useState('');
    const [coords, setCoords] = useState({ latitude: null, longitude: null });
    const [technicians, setTechnicians] = useState(null); 
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true); 
    const [isSearching, setIsSearching] = useState(false); 
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [defaultHome, setDefaultHome] = useState(null);

    const addressInputRef = useRef(null);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    // ⭐️ useEffect: Tải địa chỉ mặc định và khởi tạo tọa độ (ĐÃ SỬA LỖI KEY TRUY CẬP)
    useEffect(() => {
        const loadDefaultHome = async () => {
            setIsLoading(true);
            const defaultLat = 21.0285; // Tọa độ Hà Nội mặc định
            const defaultLng = 105.8542;

            // Lấy 1 địa chỉ (page=1, pageSize=1)
            const result = await homeApi.getHomesOfCurrentUser(1, 1); 
            
            let initialLat = defaultLat;
            let initialLng = defaultLng;
            let initialAddress = '';
            let message = 'Vui lòng nhập địa chỉ nhà hoặc kéo marker trên bản đồ.';

            // ⭐️ SỬA LỖI QUAN TRỌNG: Dùng key 'items' thay vì 'data'
            if (result.success && result.data?.items && result.data.items.length > 0) {
                const home = result.data.items[0];
                
                // Kiểm tra dữ liệu hợp lệ
                if (home.address && home.latitude && home.longitude) {
                    setDefaultHome(home);
                    initialAddress = home.address;
                    initialLat = home.latitude;
                    initialLng = home.longitude;
                    message = `✅ Đã tải địa chỉ mặc định: ${home.address}. Sẵn sàng tìm Technician.`;
                } else {
                     message = '⚠️ Đã tải dữ liệu nhà nhưng thiếu thông tin tọa độ. Đã sử dụng tọa độ mặc định.';
                }
            }
            
            setAddressInput(initialAddress);
            setCoords({ latitude: initialLat, longitude: initialLng });
            setStatusMessage(message);
            setIsLoading(false);
            
            // BÁO HIỆU ĐÃ TẢI XONG
            setTimeout(() => setIsInitialLoadComplete(true), 100); 
        };
        loadDefaultHome();
    }, []);

    // ⭐️ useEffect: Tự động tìm kiếm sau khi load xong địa chỉ mặc định
    useEffect(() => {
        const defaultLat = 21.0285; 
        const defaultLng = 105.8542;
        
        // Chỉ chạy nếu load xong, có tọa độ hợp lệ, và tọa độ KHÁC tọa độ mặc định HN
        if (isInitialLoadComplete && coords.latitude && coords.longitude && technicians === null) {
            if (coords.latitude !== defaultLat || coords.longitude !== defaultLng) {
                handleFindTechnician();
            }
        }
    }, [isInitialLoadComplete, coords.latitude, coords.longitude]);

    // ⭐️ useEffect: Google Autocomplete 
    useEffect(() => {
        // Chỉ khởi tạo Autocomplete khi window.google.maps đã tải
        if (!addressInputRef.current || !window.google?.maps) return;
        
        const autocomplete = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
                types: ["geocode"],
                componentRestrictions: { country: ["vn"] }, // Ưu tiên Việt Nam
            }
        );

        const placeChangedListener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                setStatusMessage('⚠️ Không tìm thấy địa chỉ trong Google Maps.');
                return;
            }
            const newLat = place.geometry.location.lat();
            const newLng = place.geometry.location.lng();
            const newAddress = place.formatted_address;

            setAddressInput(newAddress);
            setCoords({ latitude: newLat, longitude: newLng });
            setStatusMessage('✅ Đã chọn vị trí từ gợi ý địa chỉ. Sẵn sàng tìm Technician.');
            setTechnicians(null); 
        });

        return () => {
             // Cleanup listener 
             // Tùy thuộc vào cách thư viện Google được load, có thể cần clean listener
        };
    }, []);

    // ⭐️ Hàm chuyển đổi Địa chỉ thành Tọa độ (Geocoding)
    const handleGeocode = async () => {
        if (!addressInput) {
            setStatusMessage('Vui lòng nhập địa chỉ.');
            return;
        }

        // Bỏ qua nếu địa chỉ không đổi và đã có tọa độ từ lần load/geocode trước
        if (defaultHome && addressInput === defaultHome.address && coords.latitude && coords.longitude) {
            setStatusMessage(`✅ Đã xác định vị trí dựa trên địa chỉ đã lưu.`);
            return;
        }

        setTechnicians(null); 
        setStatusMessage('Đang xác định vị trí trên bản đồ...');
        
        const geocodeResult = await homeApi.geocodeAddress(addressInput);
        
        if (geocodeResult.success) {
            setCoords({ 
                latitude: geocodeResult.latitude, 
                longitude: geocodeResult.longitude 
            });
            setStatusMessage('✅ Đã xác định vị trí. Nhấn "Tìm Technician" để tiếp tục.');
        } else {
            setCoords({ latitude: 21.0285, longitude: 105.8542 }); 
            setStatusMessage(geocodeResult.message || '⚠️ Không tìm thấy tọa độ cho địa chỉ này. Đã chuyển về tọa độ mặc định.');
        }
    };

    // ⭐️ Hàm chuyển đổi Tọa độ thành Địa chỉ (Reverse Geocoding)
    const handleDragEnd = async (lat, lng) => {
        setIsReverseGeocoding(true);
        setTechnicians(null);
        setStatusMessage("Đang tìm địa chỉ từ vị trí mới...");

        setCoords({ latitude: lat, longitude: lng });

        try {
            // Sử dụng Nominatim (OpenStreetMap) cho Reverse Geocoding
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            if (data?.display_name) {
                setAddressInput(data.display_name);
                setStatusMessage(`✅ Vị trí được cập nhật từ bản đồ: ${data.display_name}.`);
            } else {
                setStatusMessage('⚠️ Cập nhật vị trí thành công, nhưng không tìm thấy địa chỉ chi tiết.');
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            setStatusMessage('⚠️ Lỗi khi lấy địa chỉ từ vị trí mới.');
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    // ⭐️ Hàm tìm Technician
    const handleFindTechnician = async () => {
        if (!coords.latitude || !coords.longitude) {
            // Chạy Geocode lần cuối nếu chưa có tọa độ
            await handleGeocode(); 
            if (!coords.latitude) {
                 setStatusMessage('Vui lòng nhập địa chỉ hợp lệ trước khi tìm kiếm.');
                 return;
            }
        }
        
        setIsSearching(true);
        setTechnicians(null); 
        setStatusMessage(`🚀 Đang tìm kiếm Technician xung quanh ${addressInput || coords.latitude}...`);
        
        // GỌI MOCK API (Cần thay thế bằng API thật của bạn)
        const searchResult = await MOCK_SEARCH_TECHNICIANS(
            coords.latitude, 
            coords.longitude, 
            10 // Bán kính 10km
        );
        
        setIsSearching(false);

        if (searchResult.success) {
            setTechnicians(searchResult.data);
            setStatusMessage(`✅ Tìm thấy ${searchResult.data.length} Technician gần bạn trong 10km.`);
        } else {
            setTechnicians([]);
            setStatusMessage(searchResult.message || "Không tìm thấy Technician nào phù hợp.");
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-lg text-blue-600">Đang kiểm tra và tải địa chỉ mặc định...</p>
            </div>
        );
    }

    // Giao diện người dùng
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">🛠️ Tìm Technician cho Dịch vụ #{serviceId}</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/3 space-y-4">
                    <div className="p-4 border rounded-lg shadow-md bg-white">
                        <h2 className="text-xl font-semibold mb-3">📍 Xác nhận Địa Chỉ Phục Vụ</h2>
                        
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Nhập địa chỉ nhà của bạn"
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                                onBlur={handleGeocode} 
                                ref={addressInputRef}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                                disabled={isSearching || isReverseGeocoding}
                            />
                            {isReverseGeocoding ? (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <Navigation className="h-5 w-5 text-slate-400" />
                                </div>
                            )}
                        </div>

                        <p className={`mt-2 text-sm ${coords.latitude ? 'text-green-600' : 'text-red-500'}`}>
                            {statusMessage}
                        </p>

                        <button
                            onClick={handleFindTechnician}
                            disabled={!coords.latitude || isSearching || isReverseGeocoding}
                            className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="h-5 w-5 border-b-2 border-white mr-2 animate-spin" />
                                    Đang Tìm Kiếm (10km)...
                                </>
                            ) : (
                                "🔍 Tìm Technician Xung Quanh Bán Kính 10km"
                            )}
                        </button>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-white shadow-md max-h-96 overflow-y-auto">
                        <h3 className="font-bold text-lg mb-3">Danh sách Technician ({technicians ? technicians.length : 0} người)</h3>
                        
                        {isSearching && <p className="text-center text-gray-500">Đang tải danh sách...</p>}

                        {technicians && technicians.length === 0 && !isSearching && (
                            <p className="text-gray-500 text-sm">Không tìm thấy Technician nào trong phạm vi 10km.</p>
                        )}
                        
                        {technicians && technicians.length > 0 && (
                            <ul className="space-y-3">
                                {technicians.map((tech, index) => (
                                    <li key={tech.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-blue-50 transition duration-150 cursor-pointer">
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3 text-red-600">🔴</span> 
                                            <div>
                                                <p className="font-semibold text-gray-800">{tech.name}</p>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    ⭐️ {tech.rating} • **{tech.distance} km** (Gần nhất: #{index + 1})
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-sm px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600">
                                            Chọn
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="lg:w-2/3">
                    <MapDisplay 
                        lat={coords.latitude} 
                        lng={coords.longitude} 
                        technicians={technicians}
                        onDragEnd={handleDragEnd}
                    />
                </div>
            </div>
        </div>
    );
}