import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getRouteComparisons } from "../../../infrastructure/api/compare.api";
import type { RouteComparison } from "../../../../core/domain/comparison.entity";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

export default function ComparePage() {
  const [data, setData] = useState<RouteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Fetch comparison data
  const loadComparisons = async () => {
    try {
      setLoading(true);
      const res = await getRouteComparisons();
      setData(res);
      toast.success("Comparison data loaded");
    } catch {
      toast.error("Failed to load comparison data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisons();
  }, []);

  // Handle bar or row click
  const handleSelect = (routeId: string) => {
    setSelectedRoute((prev) => (prev === routeId ? null : routeId));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          GHG Intensity Comparison
        </h2>
        <button
          onClick={loadComparisons}
          disabled={loading}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Fetching comparison data...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          No comparison data available.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-4 bg-gray-100 text-gray-700 font-medium text-sm border-b border-gray-200">
            <div className="p-3 text-center">Route ID</div>
            <div className="p-3 text-center">GHG Intensity (gCO₂e/MJ)</div>
            <div className="p-3 text-center">% Diff vs Baseline</div>
            <div className="p-3 text-center">Compliant</div>
          </div>

          {data.map((r) => {
            const isSelected = r.routeId === selectedRoute;
            return (
              <div
                key={r.routeId}
                onClick={() => handleSelect(r.routeId)}
                className={`grid grid-cols-4 text-sm text-center border-b border-gray-100 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-100 border-blue-400"
                    : r.compliant
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-red-50 hover:bg-red-100"
                }`}
              >
                <div className="p-3 font-mono">{r.routeId}</div>
                <div className="p-3">{r.ghgIntensity.toFixed(2)}</div>
                <div className="p-3">{r.percentDiff.toFixed(2)}%</div>
                <div className="p-3 font-semibold">
                  {r.compliant ? (
                    <span className="text-green-700">✅ Yes</span>
                  ) : (
                    <span className="text-red-700">❌ No</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {!loading && data.length > 0 && (
        <div className="h-80 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              onClick={(state) => {
                const routeId = state?.activeLabel;
                if (routeId) handleSelect(routeId);
              }}
            >
              <XAxis dataKey="routeId" />
              <YAxis />
              <Tooltip />
              <ReferenceLine
                y={89.3368}
                stroke="#f97316"
                strokeDasharray="3 3"
                label={{
                  value: "Target (89.33)",
                  position: "top",
                  fill: "#f97316",
                }}
              />
              <Bar dataKey="ghgIntensity" name="GHG Intensity">
                {data.map((entry) => {
                  const isSelected = entry.routeId === selectedRoute;
                  const color = entry.compliant ? "#22c55e" : "#ef4444";
                  return (
                    <Cell
                      key={entry.routeId}
                      fill={isSelected ? "#3b82f6" : color}
                      stroke={isSelected ? "#1d4ed8" : undefined}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
