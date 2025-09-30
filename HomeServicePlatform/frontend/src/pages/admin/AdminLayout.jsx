import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { Shield, Users, UserCog, Construction, UserPlus } from "lucide-react";

export default function AdminLayout({ loggedInUser }) {
  const navigate = useNavigate();

  if (!loggedInUser || loggedInUser.role !== "admin") {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-screen p-4">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>

          <nav className="space-y-1">
            <NavLink
              to="/admin/accounts"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`
              }
            >
              <Users className="w-4 h-4 mr-2" />
              Account List
            </NavLink>
            <NavLink
              to="/admin/accounts/operator/create"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`
              }
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Tạo Operator
            </NavLink>
            <NavLink
              to="/admin/technicians"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`
              }
            >
              <Construction className="w-4 h-4 mr-2" />
              Technicians
            </NavLink>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
