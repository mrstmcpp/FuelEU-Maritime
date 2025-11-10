import type { TabConfig } from "../../config/tabs.config";

interface Props {
  tabs: TabConfig[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function TabNavigation({ tabs, activeId, onChange }: Props) {
  return (
    <nav className="flex flex-wrap gap-2 rounded-lg bg-gray-100 p-2 shadow-inner">
      {tabs.map(({ id, label, description }) => {
        const isActive = id === activeId;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 rounded-md px-4 py-3 text-left transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wide">{label}</div>
            <div className="text-xs text-gray-400">{description}</div>
          </button>
        );
      })}
    </nav>
  );
}
