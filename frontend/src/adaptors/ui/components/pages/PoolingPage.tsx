import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Pool } from "../../../../core/domain/pool.entity";
import { createPool } from "../../../infrastructure/api/pool.api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const USE_MOCK_DATA = false; // set true for offline testing

export default function PoolingPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [year, setYear] = useState<number>(2024);
  const [members, setMembers] = useState<
    { shipId: number; cbBefore: number; cbAfter?: number }[]
  >([]);

  // derived
  const totalCB = members.reduce((sum, m) => sum + (m.cbBefore || 0), 0);
  const isValidPool =
    members.length > 0 &&
    totalCB >= 0 &&
    members.every(
      (m) =>
        (m.cbBefore < 0 && (m.cbAfter ?? m.cbBefore) >= m.cbBefore) ||
        (m.cbBefore > 0 && (m.cbAfter ?? m.cbBefore) >= 0)
    );

  // === FETCH ADJUSTED CBs ===
  const fetchAdjustedCBs = async () => {
    try {
      setLoading(true);

      if (USE_MOCK_DATA) {
        await new Promise((res) => setTimeout(res, 1000));
        const fakeData = [
          { shipId: 101, adjustedCb: -4.8 },
          { shipId: 102, adjustedCb: 2.1 },
          { shipId: 103, adjustedCb: 0.0 },
        ];
        setMembers(
          fakeData.map((d) => ({
            shipId: d.shipId,
            cbBefore: Number(d.adjustedCb),
          }))
        );
        toast.success("Loaded mock adjusted CBs");
      } else {
        const res = await fetch(`${BASE_URL}/compliance/adjusted-cb?year=${year}`);
        if (!res.ok) throw new Error("Failed to fetch adjusted CBs");
        const json = await res.json();
        setMembers(
          json.data.map((d: any) => ({
            shipId: d.shipId,
            cbBefore: Number(d.adjustedCb || d.cbGco2eq || 0),
          }))
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching adjusted CBs");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustedCBs();
  }, [year]);

  // === CREATE POOL ===
  const handleCreatePool = async () => {
    if (!isValidPool) {
      toast.error("Pool invalid — ensure total ≥ 0 and rules satisfied");
      return;
    }

    try {
      setCreating(true);
      if (USE_MOCK_DATA) {
        await new Promise((res) => setTimeout(res, 800));
        const mockPool: Pool = {
          id: Math.floor(Math.random() * 10000),
          year,
          members: members.map((m) => ({
            ...m,
            cbAfter: m.cbBefore + (Math.random() * 0.5 - 0.25),
          })),
          createdAt: new Date(),
        };
        setPools((prev) => [mockPool, ...prev]);
        toast.success(`✅ Mock pool created for ${year}`);
      } else {
        const res = await createPool(year, members);
        toast.success(`Pool created successfully for ${year}`);
        setPools((prev) => [res, ...prev]);
        // update UI with redistributed CBs
        setMembers(res.members || members);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create pool");
    } finally {
      setCreating(false);
    }
  };

  // ... keep your existing logic, states, and handlers unchanged

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Emission Pooling {USE_MOCK_DATA && "(Mock Mode)"}
        </h2>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 sm:w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={fetchAdjustedCBs}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Refresh
          </button>
          <button
            onClick={handleCreatePool}
            disabled={creating || !isValidPool}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition ${
              creating || !isValidPool
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={!isValidPool ? "Pool invalid — total CB must be ≥ 0" : ""}
          >
            {creating ? "Creating..." : "Create Pool"}
          </button>
        </div>
      </div>

      {/* Pool Sum */}
      <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
        <span className="text-gray-600 font-medium">Pool Sum:</span>
        <span
          className={`font-semibold ${
            totalCB >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {totalCB.toFixed(2)} gCO₂e
        </span>
        {totalCB < 0 && (
          <span className="text-xs sm:text-sm text-red-500 italic">
            Must be ≥ 0 to form a valid pool
          </span>
        )}
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Loading adjusted CBs...
        </div>
      ) : members.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          No compliance records found for {year}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 font-medium border-b border-gray-200">
              <tr>
                <th className="p-3 text-center">Ship ID</th>
                <th className="p-3 text-center">CB Before</th>
                <th className="p-3 text-center hidden sm:table-cell">
                  CB After
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.shipId}
                  className={`text-center border-b border-gray-100 ${
                    m.cbBefore >= 0 ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <td className="p-3 font-mono">{m.shipId}</td>
                  <td
                    className={`p-3 font-semibold ${
                      m.cbBefore >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {m.cbBefore.toFixed(2)}
                  </td>
                  <td
                    className={`p-3 hidden sm:table-cell font-semibold ${
                      (m.cbAfter ?? m.cbBefore) >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {(m.cbAfter ?? m.cbBefore).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="text-xs text-gray-500 mt-2 text-center sm:text-left">
        <span className="text-green-600 font-semibold">Green</span> = Surplus ship,&nbsp;
        <span className="text-red-600 font-semibold">Red</span> = Deficit ship
      </div>

      {/* Pools History */}
      {pools.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mt-6">
            Created Pools
          </h3>
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto"
            >
              <div className="text-gray-800 font-semibold mb-3">
                Pool #{pool.id} — Year {pool.year}
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 font-medium border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-center">Ship ID</th>
                    <th className="p-3 text-center">CB Before</th>
                    <th className="p-3 text-center">CB After</th>
                  </tr>
                </thead>
                <tbody>
                  {pool.members.map((m) => (
                    <tr
                      key={m.shipId}
                      className={`text-center border-b border-gray-100 ${
                        m.cbAfter! >= 0 ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <td className="p-3 font-mono">{m.shipId}</td>
                      <td className="p-3">{m.cbBefore.toFixed(2)}</td>
                      <td
                        className={`p-3 font-semibold ${
                          m.cbAfter! >= 0 ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {m.cbAfter!.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
