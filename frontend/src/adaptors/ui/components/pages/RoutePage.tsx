import { useEffect, useState } from "react";
import { getAllRoutes, setBaseline } from "../../../infrastructure/api/route.api";
import type { Route } from "../../../../core/domain/route.entity";
import { RouteTable } from "../RouteTable";
import PageContainer from "../layout/PageContainer";


export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = async () => {
    setLoading(true);
    const data = await getAllRoutes();
    setRoutes(data);
    setLoading(false);
  };

  const handleBaseline = async (routeId: string) => {
    await setBaseline(routeId);
    await fetchRoutes();
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return (
    <PageContainer>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Routes Overview</h2>
      {loading ? (
        <p className="text-gray-500">Loading routes...</p>
      ) : (
        <RouteTable routes={routes} onSetBaseline={handleBaseline} />
      )}
    </PageContainer>
  );
}