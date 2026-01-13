import { useState, useEffect } from "react";
import { Loader2, User, Building2, DollarSign, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Contact, ClientFile, updateContact, updateClientFile } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  clientFile: ClientFile | null;
  onContactUpdated: (contact: Contact) => void;
}

const STATUS_OPTIONS = ["Prospect", "Active", "Inactive", "VIP", "Whale", "Client"];
const PLANNING_NEEDS = [
  "Estate Freeze",
  "IFA",
  "Succession Planning",
  "Corporate Insurance",
  "Personal Insurance",
  "Tax Planning",
  "Retirement Planning",
  "Wealth Transfer",
];

export function EditContactModal({
  isOpen,
  onClose,
  contact,
  clientFile,
  onContactUpdated,
}: EditContactModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  // Contact fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [netWorth, setNetWorth] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  // Client file fields
  const [businessName, setBusinessName] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [acb, setAcb] = useState("");
  const [planningNeeds, setPlanningNeeds] = useState<string[]>([]);
  const [coiAccountant, setCoiAccountant] = useState("");
  const [coiLawyer, setCoiLawyer] = useState("");

  // Populate form when contact/clientFile changes
  useEffect(() => {
    if (contact) {
      setFullName(contact.full_name || "");
      setEmail(contact.email || "");
      setPhone(contact.phone || "");
      setCompany(contact.company || "");
      setTitle(contact.title || "");
      setStatus(contact.status || "");
      setNetWorth(contact.net_worth ? String(contact.net_worth) : "");
      setNotes(contact.notes || "");
      setTags(contact.tags?.join(", ") || "");
    }
    if (clientFile) {
      setBusinessName(clientFile.business_name || "");
      setBusinessValue(clientFile.business_value ? String(clientFile.business_value) : "");
      setAcb(clientFile.acb ? String(clientFile.acb) : "");
      setPlanningNeeds(clientFile.planning_needs || []);
      setCoiAccountant(clientFile.coi_accountant || "");
      setCoiLawyer(clientFile.coi_lawyer || "");
    }
  }, [contact, clientFile, isOpen]);

  const handleSave = async () => {
    if (!contact) return;

    setIsSaving(true);
    try {
      // Update contact
      const contactData: Partial<Contact> = {
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        title: title || undefined,
        status: status || undefined,
        net_worth: netWorth ? Number(netWorth) : undefined,
        notes: notes || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };

      const contactResult = await updateContact(contact.id, contactData);

      // Update client file if we have any data
      if (businessName || businessValue || acb || planningNeeds.length > 0) {
        await updateClientFile(contact.id, {
          business_name: businessName || undefined,
          business_value: businessValue ? Number(businessValue) : undefined,
          acb: acb ? Number(acb) : undefined,
          planning_needs: planningNeeds.length > 0 ? planningNeeds : undefined,
          coi_accountant: coiAccountant || undefined,
          coi_lawyer: coiLawyer || undefined,
        });
      }

      if (contactResult.contact) {
        onContactUpdated(contactResult.contact);
      } else {
        onContactUpdated({ ...contact, ...contactData });
      }
    } catch (error) {
      console.error("Failed to save contact:", error);
      toast({
        title: "Save failed",
        description: "Failed to update contact",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlanningNeed = (need: string) => {
    setPlanningNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Edit Contact
          </DialogTitle>
          <DialogDescription>
            Update contact and client file information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (204) 555-1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Smith Holdings Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="CEO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="netWorth">Net Worth ($)</Label>
                <Input
                  id="netWorth"
                  type="number"
                  value={netWorth}
                  onChange={(e) => setNetWorth(e.target.value)}
                  placeholder="5000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="estate planning, ifa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this contact..."
                rows={3}
              />
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Smith Holdings Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessValue">Business Value ($)</Label>
                <Input
                  id="businessValue"
                  type="number"
                  value={businessValue}
                  onChange={(e) => setBusinessValue(e.target.value)}
                  placeholder="10000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acb">Adjusted Cost Base ($)</Label>
                <Input
                  id="acb"
                  type="number"
                  value={acb}
                  onChange={(e) => setAcb(e.target.value)}
                  placeholder="100000"
                />
              </div>
            </div>
          </div>

          {/* Planning Needs */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Planning Needs
            </h3>

            <div className="flex flex-wrap gap-2">
              {PLANNING_NEEDS.map((need) => (
                <Button
                  key={need}
                  type="button"
                  variant={planningNeeds.includes(need) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlanningNeed(need)}
                >
                  {need}
                </Button>
              ))}
            </div>
          </div>

          {/* COI Contacts */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Centers of Influence
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coiAccountant">Accountant</Label>
                <Input
                  id="coiAccountant"
                  value={coiAccountant}
                  onChange={(e) => setCoiAccountant(e.target.value)}
                  placeholder="Jane Doe, CPA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coiLawyer">Lawyer</Label>
                <Input
                  id="coiLawyer"
                  value={coiLawyer}
                  onChange={(e) => setCoiLawyer(e.target.value)}
                  placeholder="Bob Smith, LLB"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !fullName.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
