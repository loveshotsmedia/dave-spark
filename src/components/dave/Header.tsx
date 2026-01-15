import { Settings, LogOut, Users, FolderOpen, Mail, BookOpen, Briefcase, Inbox, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RiskBadges } from "./RiskBadges";

interface HeaderProps {
  onLogout: () => void;
  onSettingsClick: () => void;
}

export function Header({ onLogout, onSettingsClick }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/contacts", label: "Contacts", icon: Users },
    { path: "/cases", label: "Cases", icon: Briefcase },
    { path: "/knowledge", label: "Knowledge", icon: BookOpen },
    { path: "/content-library", label: "Content", icon: FolderOpen },
    { path: "/campaigns", label: "Campaigns", icon: Mail },
    { path: "/inbox", label: "Inbox", icon: Inbox },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-zinc-800 bg-black px-3 md:px-6">
      <div className="flex items-center gap-3 md:gap-6">
        {/* Mobile Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900">
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-black border-zinc-800 p-0">
            <SheetHeader className="border-b border-zinc-800 px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">WFS</span>
                <span className="text-xs font-mono text-zinc-400">Dave 2.0</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col py-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200
                    ${isActive(item.path) 
                      ? 'text-white bg-zinc-900 border-l-2 border-l-emerald-500' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="uppercase tracking-wide text-xs">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 p-4">
              <Button
                variant="ghost"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2 text-red-500 hover:text-red-400 hover:bg-zinc-900 rounded-sm"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-xs uppercase tracking-wide">Logout</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate("/chat")}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">WFS</span>
          <span className="text-xs font-mono text-zinc-400">Dave 2.0</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center">
          {navItems.map((item) => (
            <NavLink 
              key={item.path}
              active={isActive(item.path)} 
              onClick={() => navigate(item.path)}
              icon={<item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <RiskBadges />

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="h-8 w-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-sm"
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-zinc-900/50">
              <Avatar className="h-6 w-6 rounded-sm">
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs font-mono rounded-sm">
                  DW
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800 rounded-sm">
            <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 focus:bg-zinc-900 focus:text-zinc-200 rounded-sm">
              <Avatar className="h-5 w-5 rounded-sm">
                <AvatarFallback className="bg-zinc-800 text-zinc-500 text-xs font-mono rounded-sm">
                  DW
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">Dave Wilson</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:bg-zinc-900 focus:text-red-400 text-xs rounded-sm">
              <LogOut className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

interface NavLinkProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ active, onClick, icon, children }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-3 py-3 text-xs transition-colors duration-200
        ${active 
          ? 'text-white border-l-2 border-l-emerald-500 bg-zinc-900/30 -ml-px' 
          : 'text-zinc-500 hover:text-zinc-300'
        }
      `}
    >
      {icon}
      <span className="uppercase tracking-wide">{children}</span>
    </button>
  );
}