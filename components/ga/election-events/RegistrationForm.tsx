'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react';
import { gaCountyCodeToNameMap } from '@/lib/data/ga_county_codes';

// Validation schema matching the backend
const registrationSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must be less than 255 characters'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  mobileNumber: z.string()
    .regex(
      /^(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\d{10})$/,
      'Invalid mobile number format. Please use (xxx) xxx-xxxx format.'
    ),
  countyCode: z.string().optional(),
  countyName: z.string().optional(),
  isVoterRegistered: z.enum(['Y', 'N', 'U']).optional()
}).refine((data) => {
  // If either county field is provided, both must be provided
  const hasCountyCode = data.countyCode && data.countyCode.trim() !== '';
  const hasCountyName = data.countyName && data.countyName.trim() !== '';
  
  if (hasCountyCode || hasCountyName) {
    return hasCountyCode && hasCountyName;
  }
  return true;
}, {
  message: 'If county information is provided, both county code and county name are required',
  path: ['countyCode']
});

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
      <div className="text-center py-8">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Sign-in Successful!
        </h3>
        <p className="text-gray-600 mb-4">
          Thank you for signing in. You're all checked in for the event.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Sign in another person
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Sign-in {eventTitle}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-lg font-medium text-gray-900 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`w-full px-4 py-4 text-xl text-black bg-blue-50 border-2 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-blue-100 ${
              errors.fullName ? 'border-red-400 bg-red-50' : 'border-blue-200'
            }`}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="mt-2 text-base text-red-600 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-lg font-medium text-gray-900 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-4 text-xl text-black bg-blue-50 border-2 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-blue-100 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-blue-200'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-2 text-base text-red-600 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label htmlFor="mobileNumber" className="block text-lg font-medium text-gray-900 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            id="mobileNumber"
            value={formData.mobileNumber}
            onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
            className={`w-full px-4 py-4 text-xl text-black bg-blue-50 border-2 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-blue-100 ${
              errors.mobileNumber ? 'border-red-400 bg-red-50' : 'border-blue-200'
            }`}
            placeholder="(555) 123-4567"
            maxLength={14}
          />
          {errors.mobileNumber && (
            <p className="mt-2 text-base text-red-600 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.mobileNumber}
            </p>
          )}
        </div>

        {/* County Selection */}
        <div>
          <label htmlFor="countyName" className="block text-lg font-medium text-gray-900 mb-2">
            County (Optional)
          </label>
          {countiesLoading ? (
            <div className="flex items-center text-gray-600 text-lg">
              <LoaderIcon className="h-6 w-6 mr-3 animate-spin" />
              Loading counties...
            </div>
          ) : (
            <select
              id="countyName"
              value={formData.countyName}
              onChange={(e) => handleInputChange('countyName', e.target.value)}
              className={`w-full px-4 py-4 text-xl text-black bg-blue-50 border-2 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-blue-100 ${
                errors.countyCode || errors.countyName ? 'border-red-400 bg-red-50' : 'border-blue-200'
              }`}
            >
              <option value="">Select a county (optional)</option>
              {counties.map((county) => (
                <option key={county.value} value={county.value}>
                  {county.label}
                </option>
              ))}
            </select>
          )}
          {(errors.countyCode || errors.countyName) && (
            <p className="mt-2 text-base text-red-600 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              {errors.countyCode || errors.countyName}
            </p>
          )}
        </div>

        {/* Voter Registration Status */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Are you registered to vote in Georgia?
          </label>
          <div className="space-y-4">
            {[
              { value: 'Y', label: 'Yes, I am registered to vote' },
              { value: 'N', label: 'No, I am not registered to vote' },
              { value: 'U', label: 'I am unsure of my registration status' }
            ].map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="isVoterRegistered"
                  value={option.value}
                  checked={formData.isVoterRegistered === option.value}
                  onChange={(e) => handleInputChange('isVoterRegistered', e.target.value)}
                  className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-4 text-lg text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border-2 border-red-200 p-6">
            <div className="flex items-center">
              <AlertCircleIcon className="h-6 w-6 text-red-400 mr-3" />
              <p className="text-lg text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-5 px-6 border-2 border-transparent text-xl font-medium text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {loading ? (
            <>
              <LoaderIcon className="h-6 w-6 mr-3 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign-in to Event'
          )}
        </button>

        <p className="text-base text-gray-600 text-center">
          * Required fields. Your information will be used only for event check-in purposes.
        </p>
      </form>
    </div>
  );
} 