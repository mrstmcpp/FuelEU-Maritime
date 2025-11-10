import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createPool, getPools } from "../../../infrastructure/api/pool.api";
import type { Pool } from "../../../../core/domain/pool.entity";

export default function PoolingPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [year, setYear] = useState<number>(2025);
  const [members, setMembers] = useState([
    { shipId: 1, cbBefore: 100 },
    { shipId: 2, cbBefore: -80 },
  ]);

  // Fetch existing pools
  const loadPools = async () => {
    try {
      setLoading(true);
      const res = await getPools();
      setPools(res);
    } catch {
      toast.error("Failed to load pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  // Create new pool
  const handleCreatePool = async () => {
    if (members.length === 0) {
      toast.error("Please add at least one ship.");
      return;
    }
    try {
      setCreating(true);
      const pool = await createPool(year, members);
      toast.success(`Pool created for ${year}`);
      setPools((prev) => [pool, ...prev]);
    } catch {
      toast.error("Failed to create pool");
    } finally {
      setCreating(false);
    }
  };

  // Add a new ship entry
  const handleAddShip = () => {
    setMembers([...members, { shipId: 0, cbBefore: 0 }]);
  };

  // Remove a ship by index
  const handleRemoveShip = (index: number) => {
    if (members.length === 1) {
      toast.error("At least one ship is required.");
      return;
    }
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">
          Emission Pooling
        </h2>
        <button
          onClick={handleCreatePool}
          disabled={creating}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow transition ${
            creating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {creating ? "Creating..." : "Create Pool"}
        </button>
      </div>

      {/* Input Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4 shadow-sm">
        {/* Year Input */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-gray-600 text-sm font-medium">Year:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Ship Members Section */}
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 sm:gap-3 border border-gray-200 rounded-md p-2 bg-gray-50 w-full"
            >
              <div className="flex-1 min-w-[90px]">
                <input
                  type="number"
                  value={m.shipId}
                  onChange={(e) => {
                    const updated = [...members];
                    updated[idx].shipId = Number(e.target.value);
                    setMembers(updated);
                  }}
                  placeholder="Ship ID"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 min-w-[110px]">
                <input
                  type="number"
                  value={m.cbBefore}
                  onChange={(e) => {
                    const updated = [...members];
                    updated[idx].cbBefore = Number(e.target.value);
                    setMembers(updated);
                  }}
                  placeholder="CB Before"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveShip(idx)}
                className="ml-auto text-red-500 hover:text-red-700 transition text-sm px-2"
                title="Remove this ship"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Add Ship Button */}
          <button
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={handleAddShip}
          >
            + Add Ship
          </button>
        </div>
      </div>

      {/* Pools Display */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Loading pools...
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center text-gray-400 py-10">No pools found.</div>
      ) : (
        <div className="space-y-6">
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto"
            >
              <div className="text-lg font-semibold text-gray-800 mb-3">
                Pool #{pool.id} — Year {pool.year}
              </div>

              <div className="grid grid-cols-3 min-w-[400px] bg-gray-100 text-gray-700 font-medium text-sm border-b border-gray-200">
                <div className="p-3 text-center">Ship ID</div>
                <div className="p-3 text-center">CB Before</div>
                <div className="p-3 text-center">CB After</div>
              </div>

              {pool.members.map((m) => (
                <div
                  key={m.shipId}
                  className={`grid grid-cols-3 text-sm text-center border-b border-gray-100 ${
                    m.cbAfter >= 0 ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="p-3 font-mono">{m.shipId}</div>
                  <div className="p-3">{m.cbBefore.toFixed(2)}</div>
                  <div
                    className={`p-3 font-semibold ${
                      m.cbAfter >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {m.cbAfter.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
