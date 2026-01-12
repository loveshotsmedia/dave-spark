import { User, Mail, Phone, FileText, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Contact } from "@/lib/api";

interface ContactCardProps {
  contact: Contact;
  onGenerateProposal?: (contactId: string) => void;
  onPreCall?: (contactId: string) => void;
  compact?: boolean;
}

function formatNetWorth(value?: number): string {
  if (!value) return "";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

export function ContactCard({
  contact,
  onGenerateProposal,
  onPreCall,
  compact = false,
}: ContactCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{contact.name}</h4>
              {contact.netWorth && (
                <span className="text-sm font-medium text-success">
                  {formatNetWorth(contact.netWorth)}
                </span>
              )}
            </div>
            {(contact.title || contact.company) && (
              <p className="text-sm text-muted-foreground">
                {contact.title}
                {contact.title && contact.company && ", "}
                {contact.company}
              </p>
            )}
          </div>
        </div>

        {contact.status && (
          <Badge
            variant={
              contact.status === "Whale"
                ? "default"
                : contact.status === "Client"
                ? "secondary"
                : "outline"
            }
          >
            {contact.status}
          </Badge>
        )}
      </div>

      {!compact && (
        <>
          <div className="mt-3 space-y-1.5">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>

          {contact.tags && contact.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {onPreCall && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreCall(contact.id)}
                className="flex-1"
              >
                <PhoneCall className="mr-1.5 h-3.5 w-3.5" />
                Prep for Call
              </Button>
            )}
            {onGenerateProposal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateProposal(contact.id)}
                className="flex-1"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Generate Proposal
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}