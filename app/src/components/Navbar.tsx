
//not in use yet

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-white text-gray-900 flex items-center justify-between px-4 shadow-sm">
        <div className="text-lg font-bold">MyApp</div>
        <div className="space-x-4">
            <button className="hover:text-gray-400">Home</button>
            <button className="hover:text-gray-400">About</button>
            <button className="hover:text-gray-400">Contact</button>
        </div>
    </nav>
  );
}