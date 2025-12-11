// File: src/components/common/CustomAddressDropdown.jsx

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Home, Check } from 'lucide-react';

export const CustomAddressDropdown = ({ 
  homes, 
  selectedHomeId, 
  onChange, 
  disabled,
  placeholder = "Chọn địa chỉ dịch vụ"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedHome = homes.find(h => h.id === selectedHomeId);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* Button hiển thị địa chỉ đã chọn */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl bg-white text-left transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:border-blue-400 hover:shadow-md"
      >
        <span className={selectedHome ? 'text-gray-900 flex items-center gap-2 flex-1 min-w-0' : 'text-gray-400'}>
          {selectedHome ? (
            <>
              <Home className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span className="truncate font-medium">
                {selectedHome.name}
              </span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[450px] overflow-y-auto">
          {homes.map((home) => {
            const isSelected = home.id === selectedHomeId;
            return (
              <button
                key={home.id}
                type="button"
                onClick={() => {
                  onChange({ target: { value: home.id } });
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-4 text-left transition-all duration-200 flex items-start gap-3 border-b border-gray-100 last:border-b-0 ${
                  isSelected 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'hover:bg-indigo-50'
                }`}
              >
                {/* Icon nhà */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Home className={`h-5 w-5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>

                {/* Thông tin địa chỉ */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-base mb-1 ${
                    isSelected ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {home.name}
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {home.address}
                  </div>
                </div>

                {/* Checkmark khi được chọn */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};