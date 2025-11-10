import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getBankingRecords, applyBanking } from "../../../infrastructure/api/banking.api";
import type { BankEntry } from "../../../../core/domain/bankEntry.entity";

export default function BankingPage() {
  const [records, setRecords] = useState<BankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await getBankingRecords();
      setRecords(data);
    } catch {
      toast.error("Failed to fetch banking records");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBanking = async () => {
    try {
      setApplying(true);
      const res = await applyBanking();
      if (res.success) {
        toast.success(res.message || "Banking applied successfully");
        await loadRecords();
      } else {
        toast.error(res.message || "Failed to apply banking");
      }
    } catch {
      toast.error("Error applying banking logic");
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Carbon Banking</h2>
        <button
          onClick={handleApplyBanking}
          disabled={applying}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow transition ${
            applying
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {applying ? "Applying..." : "Apply Banking"}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Loading records...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center text-gray-400 py-10">No banking records found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-3 bg-gray-100 text-gray-700 font-medium text-sm border-b border-gray-200">
            <div className="p-3 text-center">Ship ID</div>
            <div className="p-3 text-center">Year</div>
            <div className="p-3 text-center">Amount (gCO₂eq)</div>
          </div>

          {records.map((r) => (
            <div
              key={`${r.shipId}-${r.year}`}
              className={`grid grid-cols-3 text-sm text-center border-b border-gray-100 ${
                r.amountGco2eq >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="p-3 font-mono">{r.shipId}</div>
              <div className="p-3">{r.year}</div>
              <div
                className={`p-3 font-semibold ${
                  r.amountGco2eq >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {r.amountGco2eq.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
