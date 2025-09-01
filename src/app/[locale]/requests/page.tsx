'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from '@/contexts/TranslationContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ItemTierBadge } from '@/components/tiers/ItemTierBadge'
import { format } from 'date-fns'
import { Database } from '@/lib/supabase'
import { RequestApprovalDialog } from '@/components/requests/RequestApprovalDialog'

type BorrowRequest = Database['public']['Tables']['borrow_requests']['Row']
type Item = Database['public']['Tables']['items']['Row']
type User = Database['public']['Tables']['users']['Row']

interface RequestWithDetails extends BorrowRequest {
  items: Item
  borrower: User
  owner: User
}

export default function RequestsPage() {
  const { user } = useAuth()
  const t = useTranslations();
  const [incomingRequests, setIncomingRequests] = useState<RequestWithDetails[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<RequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    if (!user) return

    try {
      // Fetch incoming requests (requests for items I own)
      const { data: incoming, error: incomingError } = await supabase
        .from('borrow_requests')
        .select(`
          *,
          items (*),
          borrower:users!borrow_requests_borrower_id_fkey (*),
          owner:users!borrow_requests_owner_id_fkey (*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (incomingError) throw incomingError

      // Fetch outgoing requests (requests I made)
      const { data: outgoing, error: outgoingError } = await supabase
        .from('borrow_requests')
        .select(`
          *,
          items (*),
          borrower:users!borrow_requests_borrower_id_fkey (*),
          owner:users!borrow_requests_owner_id_fkey (*)
        `)
        .eq('borrower_id', user.id)
        .order('created_at', { ascending: false })

      if (outgoingError) throw outgoingError

      setIncomingRequests(incoming as RequestWithDetails[])
      setOutgoingRequests(outgoing as RequestWithDetails[])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = (request: RequestWithDetails) => {
    setSelectedRequest(request)
    setShowApprovalDialog(true)
  }

  const handleRequestUpdate = () => {
    fetchRequests()
    setShowApprovalDialog(false)
    setSelectedRequest(null)
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

  const RequestCard = ({ request, isIncoming }: { request: RequestWithDetails; isIncoming: boolean }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{request.items.title}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={isIncoming ? request.borrower.avatar_url || '' : request.owner.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {isIncoming ? request.borrower.full_name?.charAt(0) : request.owner.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">
                {isIncoming ? `${t('requests.from')}: ${request.borrower.full_name}` : `${t('requests.to')}: ${request.owner.full_name}`}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ItemTierBadge tier={request.items.tier} />
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">{t('requests.startDate')}:</span>
              <p>{format(new Date(request.start_date), 'PPP')}</p>
            </div>
            <div>
              <span className="font-medium">{t('requests.endDate')}:</span>
              <p>{format(new Date(request.end_date), 'PPP')}</p>
            </div>
          </div>
          
          {request.message && (
            <div>
              <span className="font-medium text-sm">{t('requests.message')}:</span>
              <p className="text-sm text-gray-600 mt-1">{request.message}</p>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            {t('requests.requestedOn')} {format(new Date(request.created_at), 'PPP')}
          </div>
          
          {isIncoming && request.status === 'pending' && (
            <div className="flex space-x-2 pt-2">
              <Button 
                size="sm" 
                onClick={() => handleApprovalAction(request)}
              >
                {t('requests.reviewRequest')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('requests.pleaseSignIn')}</h1>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>{t('requests.loadingRequests')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('requests.title')}</h1>
      
      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming">
            {t('requests.incoming')} ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            {t('requests.outgoing')} ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="incoming" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t('requests.requestsForYourItems')}</h2>
            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('requests.noIncomingRequests')}
                </CardContent>
              </Card>
            ) : (
              incomingRequests.map((request) => (
                <RequestCard key={request.id} request={request} isIncoming={true} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="outgoing" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t('requests.yourRequests')}</h2>
            {outgoingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('requests.noOutgoingRequests')}
                </CardContent>
              </Card>
            ) : (
              outgoingRequests.map((request) => (
                <RequestCard key={request.id} request={request} isIncoming={false} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {selectedRequest && (
        <RequestApprovalDialog
          request={selectedRequest}
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          onUpdate={handleRequestUpdate}
        />
      )}
    </div>
  )
}