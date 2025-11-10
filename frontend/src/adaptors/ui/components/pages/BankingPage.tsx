import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getBankingRecords,
  applyBanking,
  bankPositiveCB,
} from "../../../infrastructure/api/banking.api";
import type { BankEntry } from "../../../../core/domain/bankEntry.entity";

export default function BankingPage() {
  const [records, setRecords] = useState<BankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [banking, setBanking] = useState(false);
  const [shipId, setShipId] = useState<number>(1);
  const [year, setYear] = useState<number>(2025);
  const [amount, setAmount] = useState<number>(0);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await getBankingRecords(shipId, year);
      setRecords(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch banking records");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBanking = async () => {
    if (amount <= 0) return toast.error("Enter a valid amount to apply");
    try {
      setApplying(true);
      const res = await applyBanking(shipId, amount);
      if (res.success) {
        toast.success(res.message || "Banking applied successfully");
        await loadRecords();
      } else {
        toast.error(res.message || "Failed to apply banking");
      }
    } catch (err: any) {
      toast.error(err.message || "Error applying banking logic");
    } finally {
      setApplying(false);
    }
  };

  const handleBankPositive = async () => {
    if (amount <= 0) return toast.error("Enter a valid positive CB to bank");
    try {
      setBanking(true);
      const res = await bankPositiveCB(shipId, year, amount);
      if (res.success) {
        toast.success(res.message || "Banked successfully");
        await loadRecords();
      } else {
        toast.error(res.message || "Failed to bank");
      }
    } catch (err: any) {
      toast.error(err.message || "Error banking CB");
    } finally {
      setBanking(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [shipId, year]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">FuelEU Banking</h2>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Ship ID:</label>
          <input
            type="number"
            value={shipId}
            onChange={(e) => setShipId(Number(e.target.value))}
            className="border px-2 py-1 rounded-md w-20 text-sm"
          />
          <label className="text-sm text-gray-600">Year:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1 rounded-md w-20 text-sm"
          />
          <button
            onClick={loadRecords}
            className="text-blue-600 hover:underline text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Amount (gCO₂e)"
          className="border px-3 py-2 rounded-md text-sm w-40"
        />

        <button
          onClick={handleBankPositive}
          disabled={banking}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow transition ${
            banking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {banking ? "Banking..." : "Bank Positive CB"}
        </button>

        <button
          onClick={handleApplyBanking}
          disabled={applying}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow transition ${
            applying
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {applying ? "Applying..." : "Apply Banked CB"}
        </button>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Loading records...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          No banking records found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-5 bg-gray-100 text-gray-700 font-medium text-sm border-b border-gray-200">
            <div className="p-3 text-center">Ship ID</div>
            <div className="p-3 text-center">Year</div>
            <div className="p-3 text-center">CB Before</div>
            <div className="p-3 text-center">Applied</div>
            <div className="p-3 text-center">CB After</div>
          </div>

          {records.map((r) => (
            <div
              key={`${r.shipId}-${r.year}`}
              className={`grid grid-cols-5 text-sm text-center border-b border-gray-100 ${
                r.amountGco2eq >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="p-3 font-mono">{r.shipId}</div>
              <div className="p-3">{r.year}</div>
              <div className="p-3 text-gray-600">
                {(r.cb_before ?? 0).toFixed(2)}
              </div>
              <div className="p-3 text-gray-600">
                {(r.applied ?? 0).toFixed(2)}
              </div>
              <div
                className={`p-3 font-semibold ${
                  r.amountGco2eq >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {(r.cb_after ?? r.amountGco2eq).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
