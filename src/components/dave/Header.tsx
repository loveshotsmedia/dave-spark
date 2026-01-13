import { Settings, LogOut, Users, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-foreground">WFS</span>
          <div className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1">
            <span className="text-xs font-medium text-primary-foreground">Dave 2.0</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contacts")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/content-library")}
            className="text-muted-foreground hover:text-foreground"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Content
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <RiskBadges />

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  DW
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  DW
                </AvatarFallback>
              </Avatar>
              <span>Dave Wilson</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/contacts")} className="md:hidden">
              <Users className="mr-2 h-4 w-4" />
              Contacts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/content-library")} className="md:hidden">
              <FolderOpen className="mr-2 h-4 w-4" />
              Content Library
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden" />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}