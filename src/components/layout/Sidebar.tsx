"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { Home, LogOut, Mail, BadgeCheck, Settings, FileText, Award, Users, Calendar } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const handleSeveranceRequestClick = () => {
  // TODO: Implement the special logic for Severance Requests
  alert("Severance Request Clicked!");
};

function getMenuItems(user: any) {
  if (!user) return [];
  const role = user.role || user.userType;
  // Advisor
  if (role === "advisor" || role === 2) {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/home" },
      { name: "Graduation Approval", icon: <Award size={18} />, href: "/graduation-approval" },
      { name: "Messages", icon: <Mail size={18} />, href: "/messages/inbox" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Student
  if (role === "student" || role === 0) {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/home" },
      { name: "Severance Requests", icon: <FileText size={18} />, onClick: handleSeveranceRequestClick },
      { name: "Graduation Status", icon: <BadgeCheck size={18} />, href: "/graduation-status" },
      { name: "Messages", icon: <Mail size={18} />, href: "/messages/inbox" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Library, sks, doitp, career
  if (["library", "sks", "doitp", "career"].includes(role)) {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/home" },
      { name: "Severance Requests", icon: <FileText size={18} />, onClick: handleSeveranceRequestClick },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Student Affairs
  if (role === "studentAffairs") {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/home" },
      { name: "Severance Requests", icon: <FileText size={18} />, onClick: handleSeveranceRequestClick },
      { name: "Graduation Approval", icon: <Award size={18} />, href: "/graduation-approval" },
      { name: "Top Students", icon: <Users size={18} />, href: "/top-students" },
      { name: "Ceremony Planning", icon: <Calendar size={18} />, href: "/ceremony" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Department Secretary, Faculty Deans Office
  if (["departmentSecretary", "facultyDeansOffice"].includes(role)) {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/home" },
      { name: "Graduation Approval", icon: <Award size={18} />, href: "/graduation-approval" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Rectorate
  if (role === "rectorate") {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/home" },
      { name: "Top Students", icon: <Users size={18} />, href: "/rectorate" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Default
  return [
    { name: "Home", icon: <Home size={18} />, href: "/home" },
    { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
  ];
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const [active, setActive] = useState("Home");
  const menuItems = getMenuItems(user);

  return (
    <aside className="w-64 min-h-screen bg-white border-r">
      <div className="p-6 font-bold text-xl text-gray-800">Menu</div>
      <nav className="flex flex-col space-y-2 px-4">
        {menuItems.map((item) => (
          item.href ? (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setActive(item.name)}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-md transition",
                active === item.name
                  ? "bg-blue-100 text-blue-600 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ) : (
            <button
              key={item.name}
              onClick={item.onClick}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-md transition w-full text-left",
                active === item.name
                  ? "bg-blue-100 text-blue-600 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          )
        ))}
      </nav>
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">N</div>
    </aside>
  );
}
