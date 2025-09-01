'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ItemTierBadge } from '@/components/tiers/ItemTierBadge'
import { format } from 'date-fns'
import { Database } from '@/lib/supabase'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

type BorrowRequest = Database['public']['Tables']['borrow_requests']['Row']
type Item = Database['public']['Tables']['items']['Row']
type User = Database['public']['Tables']['users']['Row']

interface RequestWithDetails extends BorrowRequest {
  items: Item
  borrower: User
  owner: User
}

interface RequestApprovalDialogProps {
  request: RequestWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function RequestApprovalDialog({ request, open, onOpenChange, onUpdate }: RequestApprovalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')

  const handleApproval = async (approved: boolean) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          // response: response || null, // Remove if response field doesn't exist in schema
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (error) throw error

      onUpdate()
      onOpenChange(false)
      setResponse('')
    } catch (error: any) {
      console.error('Error updating request:', error)
      alert('Failed to update request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (error) throw error

      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error completing request:', error)
      alert('Failed to complete request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon(request.status)}
            <span>Borrow Request</span>
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review and manage this borrowing request
          </DialogDescription>
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
              <AvatarImage src={request.borrower.avatar_url || ''} />
              <AvatarFallback>
                {request.borrower.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.borrower.full_name}</p>
              <div className="flex items-center space-x-2">
                <Badge className="text-xs">{request.borrower.tier} Tier</Badge>
                <span className="text-xs text-gray-500">
                  {request.borrower.items_lent || 0} items lent
                </span>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Start Date</Label>
              <p className="text-sm">{format(new Date(request.start_date), 'PPP')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">End Date</Label>
              <p className="text-sm">{format(new Date(request.end_date), 'PPP')}</p>
            </div>
          </div>

          {request.message && (
            <div>
              <Label className="text-sm font-medium">Borrower's Message</Label>
              <div className="bg-gray-50 p-3 rounded-md mt-1">
                <p className="text-sm">{request.message}</p>
              </div>
            </div>
          )}

          {/* Response field removed - not in current schema */}

          {/* Response Input (only for pending requests) */}
          {request.status === 'pending' && (
            <div className="space-y-2">
              <Label htmlFor="response">Response Message (Optional)</Label>
              <Textarea
                id="response"
                placeholder="Add a message for the borrower..."
                value={response}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2">
          {request.status === 'pending' && (
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleApproval(false)}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={() => handleApproval(true)}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          )}
          
          {request.status === 'approved' && (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Mark as Completed'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}