import { Badge } from "@/components/ui/badge";
import { Calendar, Send, CheckCircle, XCircle, Clock } from "lucide-react";

interface BookingStatusBadgeProps {
  status?: string;
  className?: string;
}

const STATUS_CONFIG = {
  not_sent: {
    label: "Not Contacted",
    variant: "outline" as const,
    icon: Clock,
    className: "text-muted-foreground"
  },
  link_sent: {
    label: "Link Sent",
    variant: "secondary" as const,
    icon: Send,
    className: "text-blue-600"
  },
  booked: {
    label: "Meeting Booked",
    variant: "default" as const,
    icon: Calendar,
    className: "text-green-600"
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle,
    className: "text-primary"
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline" as const,
    icon: XCircle,
    className: "text-destructive"
  }
};

export function BookingStatusBadge({ status = "not_sent", className }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_sent;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
