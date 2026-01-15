import { Settings, LogOut, Users, FolderOpen, Mail, BookOpen, Briefcase, Inbox } from "lucide-react";
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
import { RiskBadges } from "./RiskBadges";

interface HeaderProps {
  onLogout: () => void;
  onSettingsClick: () => void;
}

export function Header({ onLogout, onSettingsClick }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-zinc-800 bg-black px-4 md:px-6">
      <div className="flex items-center gap-6">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate("/chat")}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">WFS</span>
          <span className="text-xs font-mono text-zinc-400">Dave 2.0</span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center">
          <NavLink 
            active={isActive("/contacts")} 
            onClick={() => navigate("/contacts")}
            icon={<Users className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Contacts
          </NavLink>
          <NavLink 
            active={isActive("/cases")} 
            onClick={() => navigate("/cases")}
            icon={<Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Cases
          </NavLink>
          <NavLink 
            active={isActive("/knowledge")} 
            onClick={() => navigate("/knowledge")}
            icon={<BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Knowledge
          </NavLink>
          <NavLink 
            active={isActive("/content-library")} 
            onClick={() => navigate("/content-library")}
            icon={<FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Content
          </NavLink>
          <NavLink 
            active={isActive("/campaigns")} 
            onClick={() => navigate("/campaigns")}
            icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Campaigns
          </NavLink>
          <NavLink 
            active={isActive("/inbox")} 
            onClick={() => navigate("/inbox")}
            icon={<Inbox className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Inbox
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2">
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
            <DropdownMenuItem onClick={() => navigate("/contacts")} className="md:hidden text-zinc-500 focus:bg-zinc-900 focus:text-zinc-200 text-xs rounded-sm">
              <Users className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Contacts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/cases")} className="md:hidden text-zinc-500 focus:bg-zinc-900 focus:text-zinc-200 text-xs rounded-sm">
              <Briefcase className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Cases
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/knowledge")} className="md:hidden text-zinc-500 focus:bg-zinc-900 focus:text-zinc-200 text-xs rounded-sm">
              <BookOpen className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Knowledge Base
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/content-library")} className="md:hidden text-zinc-500 focus:bg-zinc-900 focus:text-zinc-200 text-xs rounded-sm">
              <FolderOpen className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Content Library
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/campaigns")} className="md:hidden text-zinc-500 focus:bg-zinc-900 focus:text-zinc-200 text-xs rounded-sm">
              <Mail className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Campaigns
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/inbox")} className="md:hidden text-zinc-500 focus:bg-zinc-900 focus:text-zinc-200 text-xs rounded-sm">
              <Inbox className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Inbox
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden bg-zinc-800" />
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