'use client';

import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { CheckCircleIcon, AlertCircleIcon, LoaderIcon, Check, ChevronsUpDown } from 'lucide-react';
import { gaCountyCodeToNameMap } from '@/lib/data/ga_county_codes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { registrationSchema, type RegistrationFormData } from '@/lib/schemas/election-event-registration';

interface County {
  value: string;
  label: string;
}

interface CountiesResponse {
  counties: County[];
}

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
}

interface FormData {
  fullName: string;
  email: string;
  mobileNumber: string;
  countyCode: string;
  countyName: string;
  isVoterRegistered: string;
}

// Helper function to get FIPS code from county name
function getCountyFIPS(countyName: string): string | null {
  if (!countyName) return null;
  
  // Find the FIPS code by searching for matching county name
  for (const [fips, name] of Object.entries(gaCountyCodeToNameMap)) {
    if (name.toLowerCase() === countyName.toLowerCase()) {
      return fips.padStart(3, '0'); // Ensure 3-digit padding
    }
  }
  return null;
}

export default function RegistrationForm({ eventId, eventTitle }: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    countyCode: '',
    countyName: '',
    isVoterRegistered: ''
  });

  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countiesLoading, setCountiesLoading] = useState(true);
  const [countyOpen, setCountyOpen] = useState(false);
  
  // Refs for scrolling to success message and error messages
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Load counties on component mount
  useEffect(() => {
    async function loadCounties() {
      try {
        const response = await fetch('/api/ga/counties');
        if (response.ok) {
          const data: CountiesResponse = await response.json();
          setCounties(data.counties);
        }
      } catch (error) {
        console.error('Failed to load counties:', error);
      } finally {
        setCountiesLoading(false);
      }
    }
    loadCounties();
  }, []);

  // Scroll to success message when it appears
  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [success]);

  // Scroll to error message when submit error appears
  useEffect(() => {
    if (errors.submit && errorRef.current) {
      errorRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [errors.submit]);

  // Scroll to first field validation error when validation fails
  useEffect(() => {
    const fieldErrors = Object.keys(errors).filter(key => key !== 'submit');
    if (fieldErrors.length > 0) {
      const firstErrorField = fieldErrors[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [errors]);

  // Format mobile number as user types
  const formatMobileNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'mobileNumber') {
      value = formatMobileNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Handle county selection - get FIPS code when county name is selected
    if (field === 'countyName' && value) {
      const fipsCode = getCountyFIPS(value);
      setFormData(prev => ({ 
        ...prev, 
        countyName: value,
        countyCode: fipsCode || '' 
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      const result = registrationSchema.parse({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobileNumber: formData.mobileNumber,
        countyCode: formData.countyCode || undefined,
        countyName: formData.countyName || undefined,
        isVoterRegistered: formData.isVoterRegistered || undefined
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/ga/election-events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          mobileNumber: formData.mobileNumber,
          countyCode: formData.countyCode || undefined,
          countyName: formData.countyName || undefined,
          isVoterRegistered: formData.isVoterRegistered || undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          mobileNumber: '',
          countyCode: '',
          countyName: '',
          isVoterRegistered: ''
        });
      } else {
        setErrors({ submit: result.error || 'Sign-in failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        ref={successRef}
        className="text-center py-8 px-4 sm:px-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-lg"
      >
        <CheckCircleIcon className="h-20 w-20 sm:h-24 sm:w-24 text-green-600 dark:text-green-400 mx-auto mb-6 drop-shadow-sm" />
        <h3 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-3">
          Sign-in Successful!
        </h3>
        <p className="text-lg sm:text-xl text-green-800 dark:text-green-200 mb-6 leading-relaxed">
          Thank you for signing in. You&apos;re all checked in for the event.
        </p>
        <Button
          onClick={() => setSuccess(false)}
          variant="default"
          size="lg"
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold px-8 py-3 text-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Sign in another person
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Sign-in {eventTitle}
      </h2>

      {/* Separator */}
      <div className="border-t border-border mb-8"></div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-lg font-medium text-foreground">
            Full Name *
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            maxLength={255}
            className={cn(
              "text-xl h-14 bg-blue-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-600 text-foreground placeholder:text-muted-foreground",
              "focus:bg-blue-100 dark:focus:bg-slate-700 focus:border-blue-400 dark:focus:border-blue-400",
              errors.fullName && "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="text-base text-red-600 dark:text-red-400 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-lg font-medium text-foreground">
            Email Address *
          </Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            maxLength={255}
            className={cn(
              "text-xl h-14 bg-blue-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-600 text-foreground placeholder:text-muted-foreground",
              "focus:bg-blue-100 dark:focus:bg-slate-700 focus:border-blue-400 dark:focus:border-blue-400",
              errors.email && "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="text-base text-red-600 dark:text-red-400 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div className="space-y-2">
          <Label htmlFor="mobileNumber" className="text-lg font-medium text-foreground">
            Mobile Number *
          </Label>
          <Input
            type="tel"
            id="mobileNumber"
            value={formData.mobileNumber}
            onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
            className={cn(
              "text-xl h-14 bg-blue-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-600 text-foreground placeholder:text-muted-foreground",
              "focus:bg-blue-100 dark:focus:bg-slate-700 focus:border-blue-400 dark:focus:border-blue-400",
              errors.mobileNumber && "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
            placeholder="(555) 123-4567"
            maxLength={14}
          />
          {errors.mobileNumber && (
            <p className="text-base text-red-600 dark:text-red-400 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.mobileNumber}
            </p>
          )}
        </div>

        {/* County Selection with Search */}
        <div className="space-y-2">
          <Label className="text-lg font-medium text-foreground">
            County (Optional)
          </Label>
          {countiesLoading ? (
            <div className="flex items-center text-muted-foreground text-lg h-14">
              <LoaderIcon className="h-6 w-6 mr-3 animate-spin" />
              Loading counties...
            </div>
          ) : (
            <Popover open={countyOpen} onOpenChange={setCountyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countyOpen}
                  className={cn(
                    "w-full justify-between text-xl h-14 bg-blue-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-600",
                    "hover:bg-blue-100 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-400",
                    !formData.countyName && "text-muted-foreground",
                    formData.countyName && "text-foreground",
                    (errors.countyCode || errors.countyName) && "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
                  )}
                >
                  {formData.countyName || "Select a county (optional)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search counties..." className="text-lg" />
                  <CommandList>
                    <CommandEmpty>No county found.</CommandEmpty>
                    <CommandGroup>
                      {counties.map((county) => (
                        <CommandItem
                          key={county.value}
                          value={county.value}
                          onSelect={(currentValue) => {
                            handleInputChange('countyName', currentValue === formData.countyName ? "" : currentValue);
                            setCountyOpen(false);
                          }}
                          className="text-lg"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.countyName === county.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {county.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          {(errors.countyCode || errors.countyName) && (
            <p className="text-base text-red-600 dark:text-red-400 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.countyCode || errors.countyName}
            </p>
          )}
        </div>

        {/* Voter Registration Status */}
        <div className="space-y-4">
          <Label className="text-lg font-medium text-foreground">
            Are you registered to vote in Georgia?
          </Label>
          <RadioGroup
            value={formData.isVoterRegistered}
            onValueChange={(value: string) => handleInputChange('isVoterRegistered', value)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-4">
              <RadioGroupItem value="Y" id="voter-yes" className="h-6 w-6" />
              <Label htmlFor="voter-yes" className="text-lg text-foreground cursor-pointer">
                Yes, I am registered to vote
              </Label>
            </div>
            <div className="flex items-center space-x-4">
              <RadioGroupItem value="N" id="voter-no" className="h-6 w-6" />
              <Label htmlFor="voter-no" className="text-lg text-foreground cursor-pointer">
                No, I am not registered to vote
              </Label>
            </div>
            <div className="flex items-center space-x-4">
              <RadioGroupItem value="U" id="voter-unsure" className="h-6 w-6" />
              <Label htmlFor="voter-unsure" className="text-lg text-foreground cursor-pointer">
                I am unsure of my registration status
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div 
            ref={errorRef}
            className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-500 p-6 rounded-lg"
          >
            <div className="flex items-center">
              <AlertCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
              <p className="text-lg text-red-700 dark:text-red-300">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 text-xl font-medium"
          size="lg"
        >
          {loading ? (
            <>
              <LoaderIcon className="h-6 w-6 mr-3 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign-in to Event'
          )}
        </Button>

        <p className="text-base text-muted-foreground text-center">
          * Required fields. Your information will be used only for event check-in purposes.
        </p>
      </form>
    </div>
  );
} 