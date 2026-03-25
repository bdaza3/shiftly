export const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-full">
      <div className="p-4 font-bold">Shiftly</div>
      <nav className="p-4">
        <a href="#" className="block py-2 hover:bg-gray-600">Dashboard</a>
        <a href="#" className="block py-2 hover:bg-gray-600">Schedule</a>
        <a href="#" className="block py-2 hover:bg-gray-600">Request</a>
      </nav>
    </div>
  );
};