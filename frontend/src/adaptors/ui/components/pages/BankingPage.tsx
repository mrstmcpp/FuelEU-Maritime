import PageContainer from "../layout/PageContainer";
import SectionTitle from "../layout/SectionTitle";

export default function BankingPage() {
  return (
    <PageContainer>
      <SectionTitle
        title="Carbon Banking"
        subtitle="Manage CO₂ banking and carryover under Article 20."
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-500">
          💰 Banking transactions and balances will appear here.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <button className="rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition">
          Add Bank Entry
        </button>
      </div>
    </PageContainer>
  );
}
