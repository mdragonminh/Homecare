import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CustomTimePicker = ({ value, onChange, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Chọn giờ';
    return timeStr;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const [selectedHour, selectedMinute] = (value || '00:00').split(':');

  const handleTimeSelect = (hour, minute) => {
    onChange({ target: { value: `${hour}:${minute}` } });
    setShowPicker(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => !disabled && setShowPicker(!showPicker)}
        disabled={disabled}
        className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl bg-white text-left transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:border-blue-400"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {formatTime(value)}
        </span>
        <Clock className="h-5 w-5 text-gray-400" />
      </button>

      {showPicker && (
        <div className="absolute z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-64">
          <div className="text-sm font-semibold text-gray-700 mb-3">Chọn thời gian</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-2 text-center">Giờ</div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {hours.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeSelect(hour, selectedMinute || '00')}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                      hour === selectedHour ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2 text-center">Phút</div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {minutes.map(minute => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour || '00', minute)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                      minute === selectedMinute ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};