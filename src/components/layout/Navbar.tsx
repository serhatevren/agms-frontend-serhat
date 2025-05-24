import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, User } from "lucide-react";

export default function Navbar({ onSidebarToggle }: { onSidebarToggle?: () => void }) {
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

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm sticky top-0 z-20 pl-[220px]">
      <div className="flex items-center gap-2 min-w-[220px]">
        <button onClick={onSidebarToggle} className="p-2 rounded hover:bg-[#f3eaea]">
          <Menu size={22} className="text-[#7c0a02]" />
        </button>
        <div className="flex items-center gap-1 ml-0">
          <img
            src="/iztech-logo.png"
            alt="IZTECH Logo"
            className="h-12 w-12 object-contain"
          />
          <Link
            href="/dashboard"
            className="font-extrabold text-2xl tracking-tight text-[#7c0a02]"
          >
            IZTECH&nbsp;<span className="text-black">AGMS</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center">
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
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-[#f3eaea] cursor-pointer"
          >
            <User size={20} className="text-[#7c0a02]" />
            <span className="font-medium text-sm text-black">{userName}</span>
            <svg className="w-4 h-4 ml-1 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-2">
              <div className="px-4 py-2 border-b">
                <div className="font-bold text-black text-base">{userName}</div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  window.location.href = "/profile";
                }}
                className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Profil Ayarları
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-[#8B0000] hover:bg-neutral-100"
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
