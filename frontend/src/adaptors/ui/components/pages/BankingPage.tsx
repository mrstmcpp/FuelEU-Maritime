import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getBankingRecords, applyBanking } from "../../../infrastructure/api/banking.api";
import type { BankEntry } from "../../../../core/domain/bankEntry.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function BankingPage() {
  const [records, setRecords] = useState<BankEntry[]>([]);
  const [cbData, setCbData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipId, setShipId] = useState<number>(101);
  const [year, setYear] = useState<number>(2024);
  const [amount, setAmount] = useState<number>(0);
  const [applying, setApplying] = useState(false);
  const [banking, setBanking] = useState(false);

  // Derived KPI values
  const totalBanked = records.filter(r => r.amountGco2eq > 0)
    .reduce((sum, r) => sum + r.amountGco2eq, 0);
  const totalApplied = records.filter(r => r.amountGco2eq < 0)
    .reduce((sum, r) => sum + Math.abs(r.amountGco2eq), 0);
  const available = totalBanked - totalApplied;

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/banking/records?shipId=${shipId}&year=${year}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load records");
      setRecords(json.data);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch banking records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceCB = async () => {
    try {
      const res = await fetch(`${BASE_URL}/compliance/cb?year=${year}`);
      const json = await res.json();
      if (json.success) setCbData(json.data);
    } catch (err) {
      toast.error("Failed to fetch compliance data");
    }
  };

  const handleBankPositive = async () => {
    if (amount <= 0) {
      toast.error("Enter a positive CB amount");
      return;
    }
    try {
      setBanking(true);
      const res = await fetch(`${BASE_URL}/banking/bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipId, year, amountGco2eq: amount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("CB banked successfully");
        await loadRecords();
      } else toast.error(json.message);
    } catch {
      toast.error("Failed to bank CB");
    } finally {
      setBanking(false);
    }
  };

  const handleApplyBanking = async () => {
    if (amount <= 0) {
      toast.error("Enter a positive amount to apply");
      return;
    }
    try {
      setApplying(true);
      const res = await fetch(`${BASE_URL}/banking/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipId, year, applyAmount: amount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Banked CB applied successfully");
        await loadRecords();
      } else toast.error(json.message);
    } catch {
      toast.error("Failed to apply banked CB");
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    loadRecords();
    loadComplianceCB();
  }, [shipId, year]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">FuelEU Banking</h2>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-blue-500"
        />
        <button
          onClick={handleBankPositive}
          disabled={banking || amount <= 0}
          className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
            amount <= 0 || banking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {banking ? "Banking..." : "Bank Positive CB"}
        </button>

        <button
          onClick={handleApplyBanking}
          disabled={applying || available <= 0 || amount <= 0}
          className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
            applying || available <= 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {applying ? "Applying..." : "Apply Banked CB"}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-600">Ship ID:</label>
          <input
            type="number"
            value={shipId}
            onChange={(e) => setShipId(Number(e.target.value))}
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <label className="text-sm text-gray-600">Year:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              loadRecords();
              loadComplianceCB();
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm text-gray-600">Total Banked</h4>
          <p className="text-lg font-semibold text-green-600">
            {totalBanked.toFixed(2)} gCO₂e
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm text-gray-600">Total Applied</h4>
          <p className="text-lg font-semibold text-amber-600">
            {totalApplied.toFixed(2)} gCO₂e
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm text-gray-600">Available Balance</h4>
          <p
            className={`text-lg font-semibold ${
              available >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {available.toFixed(2)} gCO₂e
          </p>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Loading banking records...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          No banking records found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm mt-4">
          <div className="grid grid-cols-3 bg-gray-100 text-gray-700 font-medium text-sm border-b border-gray-200">
            <div className="p-3 text-center">Year</div>
            <div className="p-3 text-center">Amount (gCO₂e)</div>
            <div className="p-3 text-center">Type</div>
          </div>
          {records.map((r) => (
            <div
              key={`${r.shipId}-${r.year}-${r.id}`}
              className={`grid grid-cols-3 text-sm text-center border-b border-gray-100 ${
                r.amountGco2eq >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="p-3 font-mono">{r.year}</div>
              <div
                className={`p-3 font-semibold ${
                  r.amountGco2eq >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {r.amountGco2eq.toFixed(2)}
              </div>
              <div className="p-3">
                {r.amountGco2eq >= 0 ? "Banked" : "Applied"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
