"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import {
  Home,
  Mail,
  BadgeCheck,
  Settings,
  FileText,
  Award,
  Users,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

function getMenuItems(user: any) {
  if (!user) return [];
  // Staff sub-roles
  if (user.userType === 1) {
    switch (user.staffRole) {
      case 0: // Rectorate
        return [
          { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
          {
            name: "Top Students",
            icon: <Users size={18} />,
            href: "/rectorate",
          },
          { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
        ];
      case 1: // Student Affairs
        return [
          { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
          {
            name: "Severance Requests",
            icon: <FileText size={18} />,
            href: "/severance-requests",
          },
          {
            name: "Graduation Approval",
            icon: <Award size={18} />,
            href: "/graduation-approval",
          },
          {
            name: "Top Students",
            icon: <Users size={18} />,
            href: "/top-students",
          },
          {
            name: "Ceremony Planning",
            icon: <Calendar size={18} />,
            href: "/ceremony",
          },
          { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
        ];
      case 2: // Faculty Deans Office
        return [
          { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
          {
            name: "Graduation Approval",
            icon: <Award size={18} />,
            href: "/graduation-approval",
          },
          { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
        ];
      case 3: // Department Secretary
        return [
          { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
          {
            name: "Graduation Approval",
            icon: <Award size={18} />,
            href: "/graduation-approval",
          },
          { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
        ];
      default:
        // Other staff (library, sks, doitp, career, etc.)
        return [
          { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
          {
            name: "Severance Requests",
            icon: <FileText size={18} />,
            href: "/severance-requests",
          },
          { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
        ];
    }
  }
  // Advisor
  if (user.userType === 2 || user.role === "advisor") {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
      {
        name: "Graduation Approval",
        icon: <Award size={18} />,
        href: "/graduation-approval",
      },
      { name: "Messages", icon: <Mail size={18} />, href: "/messages/inbox" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Student
  if (user.userType === 0 || user.role === "student") {
    return [
      { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
      {
        name: "Severance Requests",
        icon: <FileText size={18} />,
        href: "/severance-requests",
      },
      {
        name: "Graduation Status",
        icon: <BadgeCheck size={18} />,
        href: "/graduation-status",
      },
      { name: "Messages", icon: <Mail size={18} />, href: "/messages/inbox" },
      { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
    ];
  }
  // Default
  return [
    { name: "Home", icon: <Home size={18} />, href: "/dashboard" },
    { name: "Settings", icon: <Settings size={18} />, href: "/profile" },
  ];
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const menuItems = getMenuItems(user);
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r">
      <div className="p-6 font-bold text-xl text-gray-800">Menu</div>
      <nav className="flex flex-col space-y-2 px-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-4 py-2 rounded-md transition",
              pathname === item.href
                ? "bg-blue-100 text-blue-700 font-bold"
                : "hover:bg-gray-100 text-gray-700"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">N</div>
    </aside>
  );
}
