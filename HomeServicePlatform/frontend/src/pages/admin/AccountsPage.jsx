import { useEffect, useState } from "react";

export default function AccountsPage() {
  const [tab, setTab] = useState("customer");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Account List</h1>
      <div className="flex space-x-2 mb-6">
        {[
          { key: "customer", label: "Customer" },
          { key: "technician", label: "Technician" },
          { key: "operator", label: "Operator" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-lg border ${tab === t.key ? "bg-blue-600 text-white" : "bg-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p>Danh sách {tab} (sẽ kết nối API sau)</p>
      </div>
    </div>
  );
}
