import logo from "../../../../assets/logo.png"

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-start md:items-center justify-between gap-3 px-6 py-5">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          {/* ✅ Replace with your logo path */}
          <img
            src={logo}
            alt="FuelEU Logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              FuelEU Compliance Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Monitor routes, manage compliance, and track Carbon Balances.
            </p>
          </div>
        </div>

        {/* Right: Optional action */}
        <div className="flex items-center gap-2">

            <button className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition">
              Dashboard
            </button>

        </div>
      </div>
    </header>
  );
}
