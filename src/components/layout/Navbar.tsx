import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const getUserTypeText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "Student";
    case 1:
      if (typeof staffRole === "number") {
        switch (staffRole) {
          case 0:
            return "Rectorate User";
          case 1:
            return "Student Affairs User";
          case 2:
            return "Faculty Dean Office User";
          case 3:
            return "Department Secretary";
          default:
            return "Staff User";
        }
      }
      return "Staff User";
    case 2:
      return "Advisor";
    case 3:
      return "Admin";
    default:
      return "User";
  }
};

export default function Navbar({
  onSidebarToggle,
}: {
  onSidebarToggle?: () => void;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = user ? `${user.name} ${user.surname}` : "Kullanıcı";
  const userTypeText = user
    ? getUserTypeText(user.userType, user.staffRole)
    : "";

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm sticky top-0 z-20">
      <div className="flex items-center gap-2">
        {onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        <Link href="/main" className="text-xl font-bold text-gray-800">
          IZTECH - AGMS
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <span className="sr-only">View notifications</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 cursor-pointer"
          >
            <div className="text-right">
              <div className="text-gray-900 font-medium">{userName}</div>
              <div className="text-gray-500 text-sm">{userTypeText}</div>
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transform transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Profil Ayarları
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
