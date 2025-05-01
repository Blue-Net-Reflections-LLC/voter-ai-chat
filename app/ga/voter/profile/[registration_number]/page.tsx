"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Import Section Components
import { VoterInfoSection } from "@/components/ga/voter/profile-sections/VoterInfoSection";
import { LocationSection } from "@/components/ga/voter/profile-sections/LocationSection";
import { DistrictsSection } from "@/components/ga/voter/profile-sections/DistrictsSection";
import { VotingHistorySection } from "@/components/ga/voter/profile-sections/VotingHistorySection";
import { CensusSection } from "@/components/ga/voter/profile-sections/CensusSection";

// Helper hook for fetching voter profile section data
function useVoterProfileSection(registrationNumber: string | undefined, section: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if registrationNumber is valid
    if (!registrationNumber || !/^\d+$/.test(registrationNumber)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null); // Reset data on new fetch

    // Use AbortController for cleanup
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`/api/ga/voter/profile/${registrationNumber}?section=${section}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (json.errors && json.errors[section]) {
          setError(json.errors[section]);
          setData(null); // Ensure data is null on error
        } else {
          // Handle cases where the section might not be in the response (e.g., partial success)
          setData(json[section] || null);
        }
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          console.log(`Fetch aborted for section: ${section}`);
          return; // Don't update state if fetch was aborted
        }
        console.error(`Error fetching ${section}:`, e);
        setError(e.message || 'An error occurred');
        setData(null); // Ensure data is null on error
        setLoading(false);
      });

      // Cleanup function to abort fetch if component unmounts or deps change
      return () => {
        controller.abort();
      };

  }, [registrationNumber, section]);

  return { data, loading, error };
}

// Helper to format address object as a string
function formatAddress(address: any) {
  if (!address) return 'Not available';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    return [
      address.streetNumber,
      address.preDirection,
      address.streetName,
      address.streetType,
      address.postDirection,
      address.aptUnitNumber ? `Apt ${address.aptUnitNumber}` : null,
      address.city,
      address.zipcode
    ].filter(Boolean).join(' ');
  }
  return String(address);
}

// Main Profile Page Component
export default function VoterProfilePage() {
  const params = useParams<{ registration_number: string }>();
  const registrationNumber = params?.registration_number; // Use optional chaining
  const router = useRouter();

  // Section data hooks
  const {
    data: infoData,
    loading: infoLoading,
    error: infoError
  } = useVoterProfileSection(registrationNumber, 'info');

  const {
    data: locationData,
    loading: locationLoading,
    error: locationError
  } = useVoterProfileSection(registrationNumber, 'location');

  const {
    data: districtsData,
    loading: districtsLoading,
    error: districtsError
  } = useVoterProfileSection(registrationNumber, 'districts'); // Fetch districts

  const {
    data: representativesData,
    loading: representativesLoading,
    error: representativesError
  } = useVoterProfileSection(registrationNumber, 'representatives'); // Fetch representatives

  const {
    data: participationData,
    loading: participationLoading,
    error: participationError
  } = useVoterProfileSection(registrationNumber, 'participation'); // Fetch participation

  const {
    data: censusData,
    loading: censusLoading,
    error: censusError
  } = useVoterProfileSection(registrationNumber, 'census'); // Fetch census

  const {
    data: otherVotersData,
    loading: otherVotersLoading,
    error: otherVotersError
  } = useVoterProfileSection(registrationNumber, 'otherVoters'); // Fetch other voters

  // Derive voter name for page title once info data is loaded
  const voterName = infoData
    ? `${infoData.firstName || ''} ${infoData.middleName ? infoData.middleName + ' ' : ''}${infoData.lastName || ''}`.trim() || 'Voter Profile'
    : 'Voter Profile';

  // Handle back button
  const handleBack = () => {
    router.back(); // Simple back navigation
  };

  // Handle invalid registration number case early
  if (!registrationNumber || !/^\d+$/.test(registrationNumber)) {
    return (
      <div className="container py-4 max-w-5xl mx-auto text-center text-red-500">
        Invalid Registration Number provided in URL.
      </div>
    );
  }

  return (
    <div className="container py-4 max-w-5xl mx-auto">
      {/* Back Button and Header */}
      <div className="mb-8 flex items-center" id="page-top">
        <Button
          variant="ghost"
          className="p-0 mr-2 hover:bg-accent" // Added hover effect
          onClick={handleBack}
          aria-label="Go back" // Added aria-label
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold truncate"> {/* Added truncate */}
          {infoLoading ? <Skeleton className="w-48 h-9" /> : voterName}
        </h1>
      </div>

      {/* Section Navigation - traditional sticky positioning */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm py-3 mb-6 -mx-4 px-4">
        <nav className="flex space-x-6 overflow-x-auto no-scrollbar">
          <a href="#voter-info" className="text-sm font-medium hover:text-primary whitespace-nowrap">Voter Info</a>
          <a href="#location" className="text-sm font-medium hover:text-primary whitespace-nowrap">Location</a>
          <a href="#voting-history" className="text-sm font-medium hover:text-primary whitespace-nowrap">Voting History</a>
          <a href="#districts" className="text-sm font-medium hover:text-primary whitespace-nowrap">Districts</a>
          <a href="#census" className="text-sm font-medium hover:text-primary whitespace-nowrap">Census Data</a>
        </nav>
      </div>

      {/* Inline style for no-scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Render Section Components with IDs for navigation */}
      <div id="voter-info">
        <VoterInfoSection data={infoData} loading={infoLoading} error={infoError} />
      </div>

      <div id="location">
        <LocationSection
          locationData={locationData}
          locationLoading={locationLoading}
          locationError={locationError}
          otherVotersData={otherVotersData?.otherVoters || []}
          otherVotersLoading={otherVotersLoading}
          otherVotersError={otherVotersError}
        />
      </div>

      <div id="voting-history">
        <VotingHistorySection
          participationData={participationData}
          participationLoading={participationLoading}
          participationError={participationError}
        />
      </div>

      <div id="districts">
        <DistrictsSection
          districtsData={districtsData}
          districtsLoading={districtsLoading}
          districtsError={districtsError}
          representativesData={representativesData}
          representativesLoading={representativesLoading}
          representativesError={representativesError}
        />
      </div>

      <div id="census">
        <CensusSection data={censusData} loading={censusLoading} error={censusError} />
      </div>
    </div>
  );
} 