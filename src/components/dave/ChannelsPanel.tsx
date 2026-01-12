import { Globe, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlidePanel } from "./SlidePanel";

interface ChannelsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChannelsPanel({ isOpen, onClose }: ChannelsPanelProps) {
  // Only show the current active channel (Web Chat)
  // Other channels require external API configuration
  
  return (
    <SlidePanel title="Communication Channels" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {/* Active Channel - Web Chat */}
        <div className="rounded-xl border border-primary bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-primary text-primary-foreground">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Web Chat</p>
              <div className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Active - You are here</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Required Notice */}
        <div className="rounded-xl border border-muted bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Additional Channels</p>
              <p className="text-sm text-muted-foreground">
                Voice, SMS, and Email channels require external API configuration.
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• <strong>Voice:</strong> Requires Vapi API key</p>
                <p>• <strong>SMS:</strong> Requires Twilio credentials</p>
                <p>• <strong>Email:</strong> Requires SendGrid API key</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
                onClick={() => window.open("https://docs.lovable.dev/features/cloud", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                View Configuration Docs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}