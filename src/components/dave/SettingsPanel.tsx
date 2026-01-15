import { Moon, Sun, Bell, BellOff, CheckCircle, XCircle, LogOut, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SlidePanel } from "./SlidePanel";
import { useState, useEffect } from "react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const SOUND_ENABLED_KEY = 'dave-sound-enabled';

export function SettingsPanel({ isOpen, onClose, onLogout }: SettingsPanelProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
  };

  const handleSoundChange = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem(SOUND_ENABLED_KEY, String(checked));
  };

  const apiStatuses = [
    { name: "Supabase", status: "connected" },
    { name: "Vapi (Voice)", status: "connected" },
    { name: "Twilio (SMS)", status: "connected" },
    { name: "SendGrid (Email)", status: "connected" },
  ];

  return (
    <SlidePanel title="Settings" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-8">
        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <Label htmlFor="dark-mode" className="cursor-pointer">
                Dark Mode
              </Label>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleDarkModeChange}
            />
          </div>
        </div>

        {/* Sound */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sound
          </h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="sound" className="cursor-pointer">
                  UI Sounds
                </Label>
                <p className="text-xs text-muted-foreground">
                  Click sounds and feedback
                </p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={handleSoundChange}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Notifications
          </h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {notifications ? (
                <Bell className="h-5 w-5 text-muted-foreground" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <Label htmlFor="notifications" className="cursor-pointer">
                Push Notifications
              </Label>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </div>

        {/* API Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            API Status
          </h3>
          <div className="space-y-2">
            {apiStatuses.map((api) => (
              <div
                key={api.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm font-medium">{api.name}</span>
                <div className="flex items-center gap-1.5">
                  {api.status === "connected" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs text-success">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-xs text-destructive">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            onClick={onLogout}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </SlidePanel>
  );
}