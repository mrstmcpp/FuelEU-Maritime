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

  // === Fetch data ===
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

  const handleSelect = (routeId: string) => {
    setSelectedRoute((prev) => (prev === routeId ? null : routeId));
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          GHG Intensity Comparison
        </h2>
        <button
          onClick={loadComparisons}
          disabled={loading}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition ${
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 font-medium border-b border-gray-200">
              <tr>
                <th className="p-3 text-center whitespace-nowrap">Route ID</th>
                <th className="p-3 text-center whitespace-nowrap">
                  GHG Intensity (gCO₂e/MJ)
                </th>
                <th className="p-3 text-center whitespace-nowrap">% Diff vs Baseline</th>
                <th className="p-3 text-center whitespace-nowrap">Compliant</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const isSelected = r.routeId === selectedRoute;
                const bgColor = isSelected
                  ? "bg-blue-100"
                  : r.compliant
                  ? "bg-green-50 hover:bg-green-100"
                  : "bg-red-50 hover:bg-red-100";
                return (
                  <tr
                    key={r.routeId}
                    onClick={() => handleSelect(r.routeId)}
                    className={`cursor-pointer transition-colors border-b border-gray-100 ${bgColor}`}
                  >
                    <td className="p-3 font-mono text-center">{r.routeId}</td>
                    <td className="p-3 text-center">
                      {r.ghgIntensity.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {r.percentDiff.toFixed(2)}%
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {r.compliant ? (
                        <span className="text-green-700">✅ Yes</span>
                      ) : (
                        <span className="text-red-700">❌ No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart */}
      {!loading && data.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">
            GHG Intensity per Route
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                onClick={(state) => {
                  const routeId = state?.activeLabel;
                  if (routeId) handleSelect(routeId);
                }}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <XAxis dataKey="routeId" />
                <YAxis domain={[0, "dataMax + 10"]} />
                <Tooltip />
                <ReferenceLine
                  y={89.33}
                  stroke="#f97316"
                  strokeDasharray="3 3"
                  label={{
                    value: "Target (89.33)",
                    position: "top",
                    fill: "#f97316",
                    fontSize: 12,
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
        </div>
      )}
    </div>
  );
}
