"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ItemTierBadge } from "@/components/tiers/ItemTierBadge";
import { format } from "date-fns";
import { Database } from "@/lib/supabase";
import { CheckCircle, XCircle, Clock, MessageCircle, Star } from "lucide-react";
import { useTranslations } from "@/contexts/TranslationContext";
import { createOrGetConversation } from "@/lib/chat";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { RatingModal } from "@/components/RatingModal";
import { getPendingRatings, hasUserRated } from "@/lib/ratings";

type BorrowRequest = Database["public"]["Tables"]["borrow_requests"]["Row"];
type Item = Database["public"]["Tables"]["items"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

interface RequestWithDetails extends BorrowRequest {
  items: Item;
  borrower: User;
  owner: User;
}

interface RequestApprovalDialogProps {
  request: RequestWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function RequestApprovalDialog({ request, open, onOpenChange, onUpdate }: RequestApprovalDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [checkingRating, setCheckingRating] = useState(false);

  const handleApproval = async (approved: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("borrow_requests")
        .update({
          status: approved ? "approved" : "rejected",
          // response: response || null, // Remove if response field doesn't exist in schema
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      onUpdate();
      onOpenChange(false);
      setResponse("");
    } catch (error: any) {
      console.error("Error updating request:", error);
      alert("Failed to update request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) return;
    
    setChatLoading(true);
    
    try {
      const otherUserId = request.borrower_id === user.id ? request.owner_id : request.borrower_id;
      
      const { data: conversation, error } = await createOrGetConversation(
        user.id,
        otherUserId,
        request.id
      );
      
      if (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to start chat. Please try again.');
        return;
      }
      
      if (conversation) {
        onOpenChange(false);
        router.push(`/chat/${conversation.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("borrow_requests")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      onUpdate();
      // Don't close dialog immediately - show rating option
      checkUserRatingStatus();
    } catch (error: any) {
      console.error("Error completing request:", error);
      alert("Failed to complete request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkUserRatingStatus = async () => {
    if (!user || request.status !== 'completed') return;
    
    setCheckingRating(true);
    try {
      const userHasRated = await hasUserRated(request.id, user.id);
      setHasRated(userHasRated);
    } catch (error) {
      console.error('Error checking rating status:', error);
    } finally {
      setCheckingRating(false);
    }
  };

  const handleRateUser = () => {
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = () => {
    setHasRated(true);
    setShowRatingModal(false);
    onUpdate();
  };

  // Check rating status when dialog opens for completed requests
  useEffect(() => {
    if (open && request.status === 'completed') {
      checkUserRatingStatus();
    }
  }, [open, request.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon(request.status)}
            <span>{t('requests.borrowRequest')}</span>
            <Badge className={getStatusColor(request.status)}>{t(`requests.status.${request.status}`)}</Badge>
          </DialogTitle>
          <DialogDescription>{t('requests.reviewAndManage')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-lg">{request.items.title}</h4>
                <p className="text-sm text-gray-600">{request.items.category}</p>
                <p className="text-sm font-medium">${request.items.purchase_price}</p>
              </div>
              <ItemTierBadge tier={request.items.tier} />
            </div>
            <p className="text-sm text-gray-600">{request.items.description}</p>
          </div>

          {/* Borrower Information */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.borrower.avatar_url || ""} />
              <AvatarFallback>{request.borrower.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.borrower.full_name}</p>
              <div className="flex items-center space-x-2">
                <Badge className="text-xs">{t(`tiers.${request.borrower.tier.toLowerCase()}`)} {t('tiers.tier')}</Badge>
                <span className="text-xs text-gray-500">{request.borrower.items_lent || 0} {t('requests.itemsLent')}</span>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">{t('requests.startDate')}</Label>
              <p className="text-sm">{format(new Date(request.start_date), "PPP")}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">{t('requests.endDate')}</Label>
              <p className="text-sm">{format(new Date(request.end_date), "PPP")}</p>
            </div>
          </div>

          {request.message && (
            <div>
              <Label className="text-sm font-medium">{t('requests.borrowerMessage')}</Label>
              <div className="bg-gray-50 p-3 rounded-md mt-1">
                <p className="text-sm">{request.message}</p>
              </div>
            </div>
          )}

          {/* Response field removed - not in current schema */}

          {/* Response Input (only for pending requests) */}
          {request.status === "pending" && (
            <div className="space-y-2">
              <Label htmlFor="response">{t('requests.responseMessage')}</Label>
              <Textarea
                id="response"
                placeholder={t('requests.addMessagePlaceholder')}
                value={response}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2">
          {request.status === "pending" && (
            <div className="flex space-x-2 w-full">
              <Button variant="outline" onClick={() => handleApproval(false)} disabled={loading} className="flex-1">
                {loading ? t('common.processing') : t('requests.reject')}
              </Button>
              <Button onClick={() => handleApproval(true)} disabled={loading} className="flex-1">
                {loading ? t('common.processing') : t('requests.approve')}
              </Button>
            </div>
          )}

          {request.status === "approved" && (
            <div className="flex space-x-2 w-full">
              <Button onClick={handleComplete} disabled={loading} className="flex-1">
                {loading ? t('common.processing') : t('requests.markAsComplete')}
              </Button>
              <Button variant="outline" onClick={handleStartChat} disabled={chatLoading} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                {chatLoading ? 'Starting...' : 'Start Chat'}
              </Button>
            </div>
          )}

          {request.status === "completed" && (
            <div className="flex flex-col space-y-2 w-full">
              {!hasRated && !checkingRating && (
                <Button onClick={handleRateUser} className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  {user?.id === request.borrower_id ? 'Rate Lender' : 'Rate Borrower'}
                </Button>
              )}
              {hasRated && (
                <div className="text-center text-sm text-green-600 py-2">
                  ✓ You have rated this user
                </div>
              )}
              <Button variant="outline" onClick={handleStartChat} disabled={chatLoading} className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                {chatLoading ? 'Starting...' : 'Message'}
              </Button>
            </div>
          )}

          {request.status === "active" && (
            <Button variant="outline" onClick={handleStartChat} disabled={chatLoading} className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              {chatLoading ? 'Starting...' : 'Message'}
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Rating Modal */}
      {showRatingModal && user && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          requestId={request.id}
          ratedUser={{
            id: user.id === request.borrower_id ? request.owner.id : request.borrower.id,
            full_name: user.id === request.borrower_id ? request.owner.full_name : request.borrower.full_name,
            avatar_url: user.id === request.borrower_id ? request.owner.avatar_url : request.borrower.avatar_url
          }}
          ratingType={user.id === request.borrower_id ? 'borrower_to_lender' : 'lender_to_borrower'}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </Dialog>
  );
}
