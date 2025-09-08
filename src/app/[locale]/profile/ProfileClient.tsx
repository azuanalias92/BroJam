"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/TranslationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TIER_COLORS, TIER_BENEFITS, getUserTierProgress } from "@/lib/tiers";
import { User, Mail, Calendar, Edit, Save, X, Camera, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StarDisplay } from "@/components/ui/StarRating";
import { getUserRatingStats } from "@/lib/ratings";
import { UserRatings } from "@/components/UserRatings";

export function ProfileClient() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ratingStats, setRatingStats] = useState<{ averageRating: number; totalRatings: number } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
      });
      // Load rating stats
      loadRatingStats();
    }
  }, [profile]);

  const loadRatingStats = async () => {
    if (!user) return;
    try {
      const stats = await getUserRatingStats(user.id);
      setRatingStats(stats);
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update public.users table
      const { error: publicError } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (publicError) throw publicError;

      // Update auth.users metadata to keep data in sync
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
        },
      });

      if (authError) throw authError;

      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadMessage({ type: "error", message: t('profile.selectImageFile') });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({ type: "error", message: t('profile.imageSizeLimit') });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Create storage bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucket = buckets?.find((bucket) => bucket.name === "avatars");

      if (!avatarBucket) {
        const { error: bucketError } = await supabase.storage.createBucket("avatars", {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
          fileSizeLimit: 5242880, // 5MB
        });
        if (bucketError) throw bucketError;
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update public.users table with new avatar URL
      const { error: publicUpdateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (publicUpdateError) throw publicUpdateError;

      // Update auth.users metadata to keep data in sync
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (authUpdateError) throw authUpdateError;

      await refreshProfile();
      setUploadMessage({ type: "success", message: t('profile.avatarUpdated') });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setUploadMessage({ type: "error", message: t('profile.avatarUploadFailed') });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Clear message after 3 seconds
      setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
      });
    }
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('profile.pleaseSignIn')}</h1>
        </div>
      </div>
    );
  }

  const tierProgressData = getUserTierProgress(profile.items_lent);

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      {uploadMessage && (
        <Alert variant={uploadMessage.type === "error" ? "destructive" : "default"} className="mb-4 sm:mb-6">
          <AlertDescription>{uploadMessage.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || ""} />
                    <AvatarFallback className="text-xl sm:text-2xl">{profile.full_name?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-9 w-9 sm:h-8 sm:w-8 rounded-full p-0 touch-manipulation"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Camera className="h-4 w-4" />}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl">{profile.full_name || t('profile.user')}</CardTitle>
              <CardDescription className="text-sm break-all">{user.email}</CardDescription>
              <div className="flex justify-center mt-2">
                <Badge className={TIER_COLORS[profile.tier]}>{TIER_BENEFITS[profile.tier].name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t('profile.reputationScore')}</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Progress value={tierProgressData.progress} className="flex-1" />
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {tierProgressData.itemsLent}/{tierProgressData.nextTierThreshold || "Max"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">{t('profile.itemsLent')}</Label>
                    <p className="font-medium text-sm sm:text-base">{profile.items_lent || 0}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">{t('profile.reputationScore')}</Label>
                    <p className="font-medium text-sm sm:text-base">{profile.reputation_score || 0}</p>
                  </div>
                </div>

                {/* Rating Display */}
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm flex items-center">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Rating
                  </Label>
                  {ratingStats && ratingStats.totalRatings > 0 ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <StarDisplay rating={ratingStats.averageRating} size="sm" showValue />
                      <span className="text-xs text-muted-foreground">({ratingStats.totalRatings} reviews)</span>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">No ratings yet</p>
                  )}
                </div>

                <div className="text-sm">
                  <Label className="text-muted-foreground flex items-center text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {t('profile.memberSince')}
                  </Label>
                  <p className="font-medium text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {t("profile.profileInformation")}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">{t("profile.managePersonalInfo")}</CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full sm:w-auto touch-manipulation">
                    <Edit className="h-4 w-4 mr-2" />
                    {t("profile.edit")}
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={handleSave} disabled={loading} className="touch-manipulation">
                      <Save className="h-4 w-4 mr-2" />
                      {t("profile.save")}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="touch-manipulation">
                      <X className="h-4 w-4 mr-2" />
                      {t("profile.cancel")}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    {t('profile.fullName')}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder={t('profile.enterFullName')}
                      className="mt-2 h-11 text-base touch-manipulation"
                    />
                  ) : (
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground">{profile.full_name || t('profile.notProvided')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('profile.email')}
                  </Label>
                  <div className="flex items-center mt-2">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm sm:text-base text-muted-foreground break-all">{user.email}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t('profile.tierProgress')}</Label>
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tierProgressData.nextTier
                        ? `${tierProgressData.itemsLent} ${t('profile.itemsLentProgress')} - ${Math.round(tierProgressData.progress)}% ${t('profile.progressTo')} ${TIER_BENEFITS[tierProgressData.nextTier].name}`
                        : t('profile.maxTierAchieved')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ratings Section */}
      <div className="mt-6">
        <UserRatings userId={user.id} />
      </div>
    </div>
  );
}
