import { Phone, MessageSquare, Mail, Globe, CheckCircle } from "lucide-react";
import { SlidePanel } from "./SlidePanel";

interface ChannelsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChannelsPanel({ isOpen, onClose }: ChannelsPanelProps) {
  const channels = [
    {
      icon: <Phone className="h-5 w-5" />,
      name: "Voice (Vapi)",
      status: "Active",
      detail: "+1-431-809-5507",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      name: "SMS (Twilio)",
      status: "Active",
      detail: "+1-431-809-5507",
    },
    {
      icon: <Mail className="h-5 w-5" />,
      name: "Email (SendGrid)",
      status: "Active",
      detail: "dave2.0@wfsadvisory.com",
    },
    {
      icon: <Globe className="h-5 w-5" />,
      name: "Web Chat",
      status: "You are here",
      detail: null,
      isCurrentChannel: true,
    },
  ];

  return (
    <SlidePanel title="Communication Channels" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {channels.map((channel) => (
          <div
            key={channel.name}
            className={`rounded-xl border p-4 ${
              channel.isCurrentChannel ? "border-primary bg-primary/5" : "bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2 ${
                  channel.isCurrentChannel
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {channel.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{channel.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{channel.status}</span>
                </div>
                {channel.detail && (
                  <p className="mt-1 text-sm text-muted-foreground">{channel.detail}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlidePanel>
  );
}