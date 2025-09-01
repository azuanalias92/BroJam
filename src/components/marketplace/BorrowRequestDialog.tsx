"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Database } from "@/lib/supabase";
import { ItemTierBadge } from "@/components/tiers/ItemTierBadge";
import { useTranslations } from "@/contexts/TranslationContext";

type Item = Database["public"]["Tables"]["items"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

interface BorrowRequestDialogProps {
  item: Item;
  owner: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BorrowRequestDialog({ item, owner, open, onOpenChange }: BorrowRequestDialogProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("borrow_requests").insert({
        item_id: item.id,
        borrower_id: user.id,
        owner_id: item.owner_id,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        message: message || null,
      });

      if (error) throw error;

      onOpenChange(false);
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setMessage("");

      // Show success message (you could use a toast here)
      alert("Borrow request sent successfully!");
    } catch (error: any) {
      console.error("Error creating borrow request:", error);
      alert("Failed to send borrow request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t("marketplace.borrowRequestTitle")}</DialogTitle>
          <DialogDescription className="text-sm">{t("marketplace.borrowRequestDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm sm:text-base truncate">{item.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600">{item.category}</p>
                <p className="text-xs sm:text-sm font-medium">${item.purchase_price}</p>
              </div>
              <ItemTierBadge tier={item.tier} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("marketplace.startDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-11 text-sm touch-manipulation">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{startDate ? format(startDate, "MMM dd, yyyy") : t("marketplace.selectDate")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date: Date) => date < new Date()} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("marketplace.endDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-11 text-sm touch-manipulation">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{endDate ? format(endDate, "MMM dd, yyyy") : t("marketplace.selectDate")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date: Date) => date < (startDate || new Date())} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                {t("marketplace.messageOptional")}
              </Label>
              <Textarea
                id="message"
                placeholder={t("marketplace.messagePlaceholder")}
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                rows={3}
                className="text-base resize-none touch-manipulation"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 touch-manipulation">
                {t("marketplace.cancel")}
              </Button>
              <Button type="submit" disabled={!startDate || !endDate || loading} className="w-full sm:w-auto h-11 touch-manipulation">
                {loading ? t("marketplace.sending") : t("marketplace.sendRequest")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
