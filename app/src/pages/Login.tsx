import { useNavigate, Link } from "react-router";
import { LogIn } from "lucide-react";

export function Login() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#4F46E5] mb-2">Shiftly</h1>
            <p className="text-gray-500">Sign in to manage your shifts</p>
          </div>



          <div className="mt-6 text-center">
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Admin:</strong> admin@shiftly.com
              </p>
              <p>
                <strong>Employee:</strong> employee@shiftly.com
              </p>
              <p className="text-gray-500 mt-2">
                Password: any (demo mode)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
