import PageContainer from "../layout/PageContainer";
import SectionTitle from "../layout/SectionTitle";

export default function ComparePage() {
  return (
    <PageContainer>
      <SectionTitle
        title="Route Comparison"
        subtitle="Compare GHG intensity and performance against baseline routes."
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-500">📊 Comparison chart will appear here.</p>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-500">
          🧮 Summary of compliance differences and statistics will be displayed here.
        </p>
      </div>
    </PageContainer>
  );
}
