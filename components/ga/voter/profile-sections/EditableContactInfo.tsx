"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Phone, Mail, Clock, User } from "lucide-react";

interface ContactData {
  homePhone?: string;
  workPhone?: string;
  mobilePhone?: string;
  emailAddress?: string;
  contactUpdatedDate?: string;
  contactUpdatedBy?: string;
}

interface EditableContactInfoProps {
  registrationNumber: string;
  contactData?: ContactData;
  loading?: boolean;
  onContactUpdate?: (updatedData: ContactData) => void;
}

export function EditableContactInfo({ 
  registrationNumber, 
  contactData, 
  loading = false,
  onContactUpdate 
}: EditableContactInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    homePhone: contactData?.homePhone || '',
    workPhone: contactData?.workPhone || '',
    mobilePhone: contactData?.mobilePhone || '',
    emailAddress: contactData?.emailAddress || '',
  });

  // Reset form when contactData changes
  React.useEffect(() => {
    setFormData({
      homePhone: contactData?.homePhone || '',
      workPhone: contactData?.workPhone || '',
      mobilePhone: contactData?.mobilePhone || '',
      emailAddress: contactData?.emailAddress || '',
    });
  }, [contactData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/ga/voter/profile/${registrationNumber}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homePhone: formData.homePhone.trim() || null,
          workPhone: formData.workPhone.trim() || null,
          mobilePhone: formData.mobilePhone.trim() || null,
          emailAddress: formData.emailAddress.trim() || null,
          updatedBy: 'canvasser_prototype', // For prototype - in production this would be the authenticated user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contact information');
      }

      const result = await response.json();
      
      // Update parent component with new data
      if (onContactUpdate) {
        onContactUpdate(result.data);
      }

      setIsEditing(false);
      toast({
        title: "Contact Updated",
        description: "Contact information has been successfully updated.",
      });

    } catch (error) {
      console.error('Error updating contact info:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update contact information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    setFormData({
      homePhone: contactData?.homePhone || '',
      workPhone: contactData?.workPhone || '',
      mobilePhone: contactData?.mobilePhone || '',
      emailAddress: contactData?.emailAddress || '',
    });
    setIsEditing(false);
  };

  const formatPhoneDisplay = (phone?: string) => {
    if (!phone) return 'Not provided';
    return phone;
  };

  const hasContactInfo = contactData?.homePhone || contactData?.workPhone || 
                        contactData?.mobilePhone || contactData?.emailAddress;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center">
              <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
              Contact Information
            </CardTitle>
            <CardDescription className="text-sm">
              Phone numbers and email for voter outreach
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="flex-shrink-0"
            >
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="min-w-0"
              >
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-0"
              >
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                <span className="sm:hidden">{isSaving ? '...' : ''}</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Phone Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Home Phone</Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.homePhone}
                    onChange={(e) => handleInputChange('homePhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[1.25rem]">
                    {formatPhoneDisplay(contactData?.homePhone)}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Work Phone</Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.workPhone}
                    onChange={(e) => handleInputChange('workPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[1.25rem]">
                    {formatPhoneDisplay(contactData?.workPhone)}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mobile Phone</Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.mobilePhone}
                    onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[1.25rem]">
                    {formatPhoneDisplay(contactData?.mobilePhone)}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                Email Address
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="voter@example.com"
                  className="w-full sm:max-w-md"
                />
              ) : (
                <p className="text-sm text-muted-foreground min-h-[1.25rem] break-all">
                  {contactData?.emailAddress || 'Not provided'}
                </p>
              )}
            </div>

            {/* Last Updated Info */}
            {contactData?.contactUpdatedDate && (
              <div className="pt-3 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    Last updated: {new Date(contactData.contactUpdatedDate).toLocaleDateString()}
                  </div>
                  {contactData.contactUpdatedBy && (
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1 flex-shrink-0" />
                      by {contactData.contactUpdatedBy}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help text for canvassers */}
            {isEditing && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Field Note:</strong> Update contact information as provided by the voter. 
                  Leave fields blank if not provided. Changes are saved immediately and will be 
                  available to other team members.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 