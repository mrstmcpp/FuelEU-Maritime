export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6">
        <h1 className="text-3xl font-bold text-gray-800">
          FuelEU Compliance Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Monitor routes, compare KPIs, and manage compliance workflows.
        </p>
      </div>
    </header>
  );
}
