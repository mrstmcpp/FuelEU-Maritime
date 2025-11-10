import PageContainer from "../layout/PageContainer";
import SectionTitle from "../layout/SectionTitle";

export default function PoolingPage() {
  return (
    <PageContainer>
      <SectionTitle
        title="Emission Pooling"
        subtitle="Manage emission pooling and allocation under Article 21."
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-500">
          🤝 Pool creation, members, and CB adjustments will be shown here.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <button className="rounded-md bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700 transition">
          Create Pool
        </button>
      </div>
    </PageContainer>
  );
}
