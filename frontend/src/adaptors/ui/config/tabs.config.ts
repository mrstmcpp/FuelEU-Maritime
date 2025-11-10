
import React from "react";
import RoutesPage from "../components/pages/RoutePage";
import ComparePage from "../components/pages/ComparePage";
import BankingPage from "../components/pages/BankingPage";
import PoolingPage from "../components/pages/PoolingPage";

/**
 * Type-safe tab identifiers
 */
export type TabId = "routes" | "compare" | "banking" | "pooling";

/**
 * Tab configuration structure
 */
export interface TabConfig {
  id: TabId;
  label: string;
  description: string;
  render: () => React.ReactElement;
}

/**
 * Reusable, extendable tab configuration
 * Add a new tab by pushing an object here.
 */
export const TABS: TabConfig[] = [
  {
    id: "routes",
    label: "Routes",
    description: "Browse routes and manage baselines.",
    render: () => React.createElement(RoutesPage),
  },
  {
    id: "compare",
    label: "Compare",
    description: "Compare KPIs with baselines.",
    render: () => React.createElement(ComparePage),
  },
  {
    id: "banking",
    label: "Banking",
    description: "Manage Article 20 banking.",
    render: () => React.createElement(BankingPage),
  },
  {
    id: "pooling",
    label: "Pooling",
    description: "Create and view emission pools.",
    render: () => React.createElement(PoolingPage),
  },
];

/**
 * Optional default tab helper
 */
export const DEFAULT_TAB: TabId = "routes";
