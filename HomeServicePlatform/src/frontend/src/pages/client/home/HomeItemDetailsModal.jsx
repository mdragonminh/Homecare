import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { homeApi } from "../../../services/homeApi";

const initialItemDetails = null;

const getItemIcon = (type) => {
    const typeMap = {
        electronics: '📺',
        appliance: '❄️',
        furniture: '🛋️',
        device: '📱',
        air_purifier: '💨',
    };
    return typeMap[type?.toLowerCase()] || '📦';
};

export default function HomeItemDetailsModal({ homeItemId, onClose }) {
    const { t } = useTranslation();
    const [itemDetails, setItemDetails] = useState(initialItemDetails);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchItemDetails = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const res = await homeApi.getHomeItemById(homeItemId);
                if (res.success) setItemDetails(res.data);
                else setFetchError(res.message);
            } catch (err) {
                console.error("Error fetching item details:", err);
                setFetchError(t("error.fetch_failed"));
            } finally {
                setLoading(false);
            }
        };
        if (homeItemId) fetchItemDetails();
    }, [homeItemId, t]);

    const DetailRow = ({ labelKey, value }) => (
        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <span className="text-sm font-medium text-gray-600">{t(labelKey)}:</span>
            <span className={`text-sm font-semibold ${value ? 'text-gray-900' : 'italic text-gray-400'}`}>
                {value || t("ui.no_name") || "N/A"}
            </span>
        </div>
    );

    const NotesDisplay = ({ notes }) => (
        <div className="mt-6">
            <span className="text-sm font-medium text-gray-600 block mb-2">{t("form.label.notes")}:</span>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800 text-sm whitespace-pre-wrap shadow-sm">
                {notes || <span className="italic text-gray-400">{t("ui.uncategorized") || "No notes available"}</span>}
            </div>
        </div>
    );

    if (fetchError) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform scale-100 transition-transform duration-300">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t("error.error_occurred")}</h3>
                    <p className="text-gray-600 mb-6">{fetchError}</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
                    >
                        {t("ui.back_to_home")}
                    </button>
                </div>
            </div>
        );
    }

    return (
       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">{t("ui.manage_items")} - {t("ui.details")}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition duration-200"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-gray-50">
                    {loading && (
                        <div className="flex flex-col items-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                            <p className="text-gray-600 text-sm">{t("ui.loading_data")}</p>
                        </div>
                    )}

                    {itemDetails && !loading && (
                        <>
                            {/* Summary */}
                            <div className="flex items-center gap-4 p-5 bg-white rounded-xl mb-6 shadow-sm border border-gray-100">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl">
                                    {getItemIcon(itemDetails.type)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{itemDetails.name}</h3>
                                    <p className="text-sm text-indigo-600 font-medium">
                                        {t(`item.type.${itemDetails.type.toLowerCase()}`, itemDetails.type) || t("ui.uncategorized")}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                <DetailRow labelKey="form.label.brand" value={itemDetails.brand} />
                                <DetailRow labelKey="form.label.model_number" value={itemDetails.modelNumber} />
                                <DetailRow labelKey="form.label.serial_number" value={itemDetails.serialNumber} />
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-sm font-medium text-gray-600">{t("ui.status")}:</span>
                                    <span className="text-sm text-green-600 bg-green-50 px-4 py-1 rounded-full font-semibold shadow-sm">
                                        {t("ui.working_well")}
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            <NotesDisplay notes={itemDetails.notes} />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-100 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition duration-200 shadow-sm"
                    >
                        {t("ui.back_to_home") || "Close"}
                    </button>
                </div>
            </div>
        </div>
    );
}