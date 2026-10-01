"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/Store";

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const tabs = [
    { name: "Cerebro Global", href: "/admin/schemas" },
    { name: "Entrenamiento IA", href: "/admin/examples" },
    { name: "Asistente SQL", href: "/generator" },
    { name: "Mobile Reports", href: "/mobile-report" },
    { name: "Preset Reports", href: "/preset-report" }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-8 py-0 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 py-4">
          <Database size={22} className="text-indigo-600"/>
          NexusAI Data Engine
        </h1>
        <nav className="flex gap-6 text-sm font-medium h-full">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            return (
              <Link 
                key={tab.href}
                href={tab.href} 
                className={isActive 
                  ? "text-indigo-600 border-b-2 border-indigo-600 py-4 cursor-pointer" 
                  : "text-slate-500 hover:text-slate-900 py-4 cursor-pointer transition-colors border-b-2 border-transparent"
                }
              >
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
         <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Connected (PostgreSQL)</span>
         <span className="border-l border-slate-200 pl-4 py-4 mr-2">latency: 14ms</span>
         <button onClick={handleLogout} className="flex items-center gap-2 border-l border-slate-200 pl-4 py-4 text-slate-500 hover:text-red-600 transition-colors cursor-pointer" title="Cerrar sesión">
           <LogOut size={16} />
         </button>
      </div>
    </div>
  );
}
