"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarDisplay } from "@/components/ui/StarRating";
import { getUserRatings, RatingWithDetails } from "@/lib/ratings";
import { Star, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRatingsProps {
  userId: string;
}

export function UserRatings({ userId }: UserRatingsProps) {
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [userId]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const userRatings = await getUserRatings(userId);
      setRatings(userRatings);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Ratings & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2" />
          Ratings & Reviews ({ratings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ratings.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ratings received yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={rating.rater.avatar_url || ""} 
                      alt={rating.rater.full_name || ""} 
                    />
                    <AvatarFallback>
                      {rating.rater.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {rating.rater.full_name || "Anonymous User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StarDisplay rating={rating.rating} size="sm" />
                    </div>
                    
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {rating.borrow_requests.items.title}
                    </Badge>
                    
                    {rating.review && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {rating.review}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}