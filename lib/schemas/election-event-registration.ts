import { z } from 'zod';

// Shared registration schema for election events
export const registrationSchema = z.object({
  fullName: z.string()
    .refine((val) => {
      const trimmed = val.trim();
      if (trimmed.length === 0) return false;
      if (trimmed.length < 2) return false;
      if (trimmed.length > 255) return false;
      if (!trimmed.includes(' ')) return false; // Must contain at least one space
      return true;
    }, (val) => {
      const trimmed = val.trim();
      if (trimmed.length === 0) return { message: 'Full name is required' };
      if (trimmed.length < 2) return { message: 'Full name must be at least 2 characters' };
      if (trimmed.length > 255) return { message: 'Full name must be less than 255 characters' };
      if (!trimmed.includes(' ')) return { message: 'Please enter your first and last name' };
      return { message: 'Invalid full name' };
    })
    .transform((val) => val.trim()),
  
  email: z.string()
    .refine((val) => {
      const trimmed = val.trim();
      if (trimmed.length === 0) return false;
      if (trimmed.length > 255) return false;
      
      // Use a reasonable email regex pattern based on Colin McDonnell's research
      // This pattern prevents consecutive dots and handles edge cases properly
      const emailRegex = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_'+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;
      
      if (!emailRegex.test(trimmed)) return false;
      return true;
    }, (val) => {
      const trimmed = val.trim();
      if (trimmed.length === 0) return { message: 'Email address is required' };
      if (trimmed.length > 255) return { message: 'Email must be less than 255 characters' };
      return { message: 'Please enter a valid email address' };
    })
    .transform((val) => val.trim().toLowerCase()),
  
  mobileNumber: z.string()
    .refine((val) => {
      const trimmed = val.trim();
      if (trimmed.length === 0) return false;
      if (!/^(\(\d{3}\)\s\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\d{10})$/.test(trimmed)) return false;
      return true;
    }, (val) => {
      const trimmed = val.trim();
      if (trimmed.length === 0) return { message: 'Mobile number is required' };
      return { message: 'Invalid mobile number format. Please use (xxx) xxx-xxxx format.' };
    }),
  
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
  return true; // Both empty is valid
}, {
  message: 'If county information is provided, both county code and county name are required',
  path: ['countyCode'] // This will attach the error to countyCode field
});

// UUID validation schema for event IDs
export const eventIdSchema = z.string().uuid('Invalid event ID format');

// TypeScript type inference from the schema
export type RegistrationFormData = z.infer<typeof registrationSchema>; 