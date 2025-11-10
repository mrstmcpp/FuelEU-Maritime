import { useMemo, useState } from "react";
import AppHeader from "./adaptors/ui/components/layout/Header";
import TabNavigation from "./adaptors/ui/components/layout/TabNavigation";
import PageContainer from "./adaptors/ui/components/layout/PageContainer";
import { TABS, DEFAULT_TAB, type TabId } from "./adaptors/ui/config/tabs.config";
import "./index.css";

export default function App() {
  const [activeId, setActiveId] = useState<TabId>(DEFAULT_TAB);
  const activeTab = useMemo(
    () => TABS.find((tab) => tab.id === activeId) ?? TABS[0],
    [activeId],
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <TabNavigation tabs={TABS} activeId={activeId} onChange={(id) => setActiveId(id as TabId)} />
        <PageContainer>{activeTab.render()}</PageContainer>
      </section>
    </main>
  );
}
