import { useState, useEffect } from "react";
import { Video, Phone, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlidePanel } from "./SlidePanel";
import { api, Appointment } from "@/lib/api";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface CalendarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarPanel({ isOpen, onClose }: CalendarPanelProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { appointments } = await api.getAppointments(10);
      setAppointments(appointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAppointments = appointments.reduce((acc, apt) => {
    const date = parseISO(apt.startTime);
    let group = "Upcoming";
    if (isToday(date)) group = "Today";
    else if (isTomorrow(date)) group = "Tomorrow";

    if (!acc[group]) acc[group] = [];
    acc[group].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const TypeIcon = ({ type }: { type: Appointment["type"] }) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-primary" />;
      case "phone":
        return <Phone className="h-4 w-4 text-success" />;
      case "in-person":
        return <MapPin className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <SlidePanel title="Upcoming Meetings" isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No upcoming meetings</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([group, apts]) => (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </h3>
              <div className="space-y-2">
                {apts.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {format(parseISO(apt.startTime), "h:mm a")}
                        </p>
                        <p className="text-sm text-foreground">{apt.contactName || apt.title}</p>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <TypeIcon type={apt.type} />
                          <span className="capitalize">{apt.type} Call</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="flex-1">
                        Join
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SlidePanel>
  );
}