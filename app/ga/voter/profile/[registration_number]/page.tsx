"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MessageSquare, Mail, MapPin, Mic, MicOff, Save, CheckCircle, AlertCircle, Clock, Info, User, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Import Campaign Context
import { useCampaignContext } from "../../CampaignContext";

// Import Section Components
import { VoterInfoSection } from "@/components/ga/voter/profile-sections/VoterInfoSection";
import { LocationSection } from "@/components/ga/voter/profile-sections/LocationSection";
import { DistrictsSection } from "@/components/ga/voter/profile-sections/DistrictsSection";
import { VotingHistorySection } from "@/components/ga/voter/profile-sections/VotingHistorySection";
import { CensusSection } from "@/components/ga/voter/profile-sections/CensusSection";
import { ParticipationScoreWidget } from "@/components/voter/ParticipationScoreWidget";

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

// Helper hook for fetching HOUSEHOLD participation score based on address
function useHouseholdParticipationScore(residenceAddress: any | null | undefined) {
  const [data, setData] = useState<{ score: number | null; voterCount: number | null } | null>(null);
  const [loading, setLoading] = useState(false); // Initially not loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we have a valid address object
    if (!residenceAddress || typeof residenceAddress !== 'object') {
      setData(null); // Clear data if no address
      setLoading(false);
      setError(null);
      return;
    }

    // Format address components for the resident_address query parameter
    const addressParamValue = [
      residenceAddress.streetNumber || '',
      residenceAddress.preDirection || '',
      residenceAddress.streetName || '',
      residenceAddress.streetType || '',
      residenceAddress.postDirection || '',
      residenceAddress.aptUnitNumber || '',
      residenceAddress.city || '',
      residenceAddress.zipcode || ''
    ].join(',');

    // Check if we have *any* address part to filter by
    if (!addressParamValue.split(',').some(part => part !== '')) {
      console.warn(`[Household Score Hook] No address components to query.`);
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null); // Reset data on new fetch

    const controller = new AbortController();
    const signal = controller.signal;

    const params = new URLSearchParams();
    params.set('resident_address', addressParamValue);
    const queryString = params.toString();

    console.log(`[Household Score Hook] Fetching with query: ${queryString}`);

    fetch(`/api/ga/voter/participation-score?${queryString}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(jsonData => {
        console.log(`[Household Score Hook] Received data:`, jsonData);
        // Ensure the response format matches { score: number | null, voterCount: number | null }
        setData({
          score: jsonData.score ?? null,
          voterCount: jsonData.voterCount ?? null
        });
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          console.log(`Fetch aborted for household score`);
          return; // Don't update state if fetch was aborted
        }
        console.error(`Error fetching household score:`, e);
        setError(e.message || 'An error occurred');
        setData(null); // Ensure data is null on error
        setLoading(false);
      });

      // Cleanup function
      return () => {
        controller.abort();
      };

  }, [JSON.stringify(residenceAddress)]); // Depend on the stringified address object

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

// Compact Voter Verification Component
function CompactVoterVerification({ voterData }: { voterData: any }) {
  if (!voterData) return null;

  const getAge = (birthYear: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  const formatRace = (race: string) => {
    if (!race) return "Unknown";
    const raceMap: { [key: string]: string } = {
      'WH': 'White', 'BH': 'Black', 'HP': 'Hispanic', 'AS': 'Asian', 
      'AI': 'Native', 'OT': 'Other', 'UN': 'Unknown'
    };
    return raceMap[race] || race;
  };

  const formatGender = (gender: string) => {
    if (!gender) return "Unknown";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const birthYear = voterData.birthYear || (voterData.dateOfBirth ? new Date(voterData.dateOfBirth).getFullYear() : null);
  const age = birthYear ? getAge(birthYear) : null;

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <User className="h-4 w-4" />
      <span className="font-medium">
        {formatRace(voterData.race)} | {age ? `${age}y` : 'Age unknown'} | {formatGender(voterData.gender)}
      </span>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700">
            <Info className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-orange-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Voter Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Before starting conversation:</p>
              <ul className="text-xs space-y-1">
                <li>• Verify you're speaking with <strong>{voterData.firstName} {voterData.lastName}</strong></li>
                <li>• Confirm person matches: <strong>{formatRace(voterData.race)}, {age ? `${age} years old` : 'age unknown'}, {formatGender(voterData.gender)}</strong></li>
                <li>• If there's a mismatch, politely ask if {voterData.firstName} is available</li>
                <li>• Use "Wrong person" option if speaking with different individual</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign Status Banner Component
function CampaignStatusBanner({ voterData, registrationNumber }: { voterData: any; registrationNumber: string }) {
  const { selectedCampaign } = useCampaignContext();
  
  if (!selectedCampaign) return null;

  // Mock contact status - in real app this would be fetched
  const contactStatus = 'not_contacted'; // For prototype, always show as not contacted
  
  return (
    <Card className="mb-4 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300">
              {selectedCampaign.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Campaign #{Math.floor(Math.random() * 200) + 1} of {selectedCampaign.targetContacts.toLocaleString()}
            </span>
          </div>
          <Badge variant="outline" className="text-yellow-800 bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Not Contacted
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          You are the first team member to visit this voter. Use the AI talking points below to guide your conversation.
        </p>
      </CardContent>
    </Card>
  );
}

// AI Talking Points Component
function AITalkingPoints({ voterData }: { voterData: any }) {
  const { selectedCampaign } = useCampaignContext();
  
  if (!selectedCampaign || !voterData) return null;

  // Generate mock talking points based on voter data
  const generateTalkingPoints = () => {
    const points = [];
    const voterName = voterData.firstName || 'there';
    
    // Greeting
    points.push(`Hi ${voterName}, I'm here with ${selectedCampaign.name}.`);
    
    // Voting history point
    if (voterData.lastVoteDate) {
      points.push(`I see you're a reliable voter who participated in recent elections - that's great!`);
    } else {
      points.push(`This election is really important, and every vote counts.`);
    }
    
    // Local connection
    if (voterData.county) {
      points.push(`As a ${voterData.county} County resident, you know how important local issues are.`);
    }
    
    // Call to action
    points.push(`Do you have a plan for voting on Election Day? I'd love to help make sure you have all the information you need.`);
    
    return points;
  };

  const talkingPoints = generateTalkingPoints();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
          AI Talking Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {talkingPoints.map((point, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{index + 1}</span>
              </div>
              <p className="text-sm leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Personalize these points based on the conversation. Use the voter's information below to connect on local issues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Contact Recording Component
function ContactRecording({ voterData, registrationNumber }: { voterData: any; registrationNumber: string }) {
  const { selectedCampaign } = useCampaignContext();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [contactOutcome, setContactOutcome] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!selectedCampaign) return null;

  const handleStartRecording = () => {
    setIsRecording(true);
    toast({
      title: "Recording Started",
      description: "Capturing audio for sentiment analysis...",
    });
    
    // Mock recording - in real app would start audio capture
    setTimeout(() => {
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Audio captured for analysis.",
      });
    }, 3000);
  };

  const handleSubmitContact = async () => {
    if (!contactOutcome) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a contact outcome.",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Mock API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Contact Recorded",
        description: "Voter interaction has been saved to the campaign.",
      });
      
      // Reset form
      setContactOutcome('');
      setNotes('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record contact. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-4 border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
          Record Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Recording */}
        <div className="flex items-center space-x-3">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={handleStartRecording}
            disabled={isRecording}
            className="flex items-center space-x-2"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>{isRecording ? "Recording..." : "Capture Response"}</span>
          </Button>
          <span className="text-xs text-muted-foreground">
            {isRecording ? "Recording voter response for sentiment analysis" : "Record key voter responses"}
          </span>
        </div>

        {/* Contact Outcome */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Contact Outcome *</label>
          <Select value={contactOutcome} onValueChange={setContactOutcome}>
            <SelectTrigger>
              <SelectValue placeholder="Select outcome..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">✅ Positive - Committed to vote</SelectItem>
              <SelectItem value="neutral">🔵 Neutral - Acknowledged information</SelectItem>
              <SelectItem value="negative">🔴 Negative - Not interested</SelectItem>
              <SelectItem value="not_home">🏠 Not home - Left information</SelectItem>
              <SelectItem value="wrong_person">👤 Wrong person - Different individual</SelectItem>
              <SelectItem value="moved">📦 Moved - No longer at address</SelectItem>
              <SelectItem value="callback">📞 Requested callback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            placeholder="Key points from conversation, voter concerns, follow-up needed..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmitContact}
          disabled={isSubmitting || !contactOutcome}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Recording Contact...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Record Contact
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Contact History Component (enhanced for demonstration)
function ContactHistory({ registrationNumber }: { registrationNumber: string }) {
  // Enhanced mock contact history data for demonstration
  const contactHistory = [
    {
      id: 1,
      date: "2024-01-15",
      time: "2:30 PM",
      method: "door",
      outcome: "positive",
      campaign: "GOTV Drive 2024",
      volunteer: "Sarah Martinez",
      duration: "8 minutes",
      sentiment: 2, // -2 to 2 scale
      votingLikelihood: 9, // 1-10 scale
      issues: ["Education", "Healthcare"],
      notes: "Very engaged voter. Committed to vote early. Expressed strong interest in education funding initiatives. Asked about early voting locations and dates. Promised to share information with neighbors.",
      followUp: "Send early voting guide",
      followUpDate: "2024-01-20",
      scriptUsed: "Education-focused door script v2.1"
    },
    {
      id: 2,
      date: "2024-01-08",
      time: "6:45 PM",
      method: "phone",
      outcome: "neutral",
      campaign: "Voter Outreach January",
      volunteer: "Mike Rodriguez",
      duration: "4 minutes",
      sentiment: 0,
      votingLikelihood: 6,
      issues: ["Local Infrastructure"],
      notes: "Answered questions about polling location changes. Seemed moderately interested but non-committal. Mentioned concerns about road conditions in neighborhood.",
      followUp: null,
      followUpDate: null,
      scriptUsed: "General phone script v1.3"
    },
    {
      id: 3,
      date: "2023-12-22",
      time: "11:15 AM",
      method: "text",
      outcome: "positive",
      campaign: "Holiday Outreach 2023",
      volunteer: "System (Automated)",
      duration: null,
      sentiment: 1,
      votingLikelihood: 8,
      issues: [],
      notes: "Responded positively to holiday greeting text. Replied 'Thank you! Looking forward to voting in 2024.' Opted in for future text updates.",
      followUp: "Add to text campaign list",
      followUpDate: "2024-01-01",
      scriptUsed: "Holiday greeting template"
    },
    {
      id: 4,
      date: "2023-11-28",
      time: "4:20 PM",
      method: "email",
      outcome: "no_response",
      campaign: "Post-Election Survey",
      volunteer: "Jennifer Chen",
      duration: null,
      sentiment: null,
      votingLikelihood: null,
      issues: [],
      notes: "Email sent requesting feedback on voting experience. No response received after 2 weeks.",
      followUp: null,
      followUpDate: null,
      scriptUsed: "Post-election survey email"
    },
    {
      id: 5,
      date: "2023-11-07",
      time: "7:30 AM",
      method: "phone",
      outcome: "attempted",
      campaign: "Election Day GOTV",
      volunteer: "David Kim",
      duration: null,
      sentiment: null,
      votingLikelihood: null,
      issues: [],
      notes: "No answer. Left voicemail reminding about election day and polling hours. Attempted callback at 2 PM - still no answer.",
      followUp: "Check if voted",
      followUpDate: "2023-11-08",
      scriptUsed: "Election day reminder script"
    }
  ];

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive': return 'text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'neutral': return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 'negative': return 'text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'no_response': return 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
      case 'attempted': return 'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      default: return 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getSentimentIcon = (sentiment: number | null) => {
    if (sentiment === null) return '❓';
    if (sentiment >= 1) return '😊';
    if (sentiment <= -1) return '😞';
    return '😐';
  };

  const getSentimentColor = (sentiment: number | null) => {
    if (sentiment === null) return 'text-gray-500';
    if (sentiment >= 1) return 'text-green-600';
    if (sentiment <= -1) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'door': return '🚪';
      case 'phone': return '📞';
      case 'email': return '📧';
      case 'text': return '💬';
      case 'event': return '🎪';
      case 'mail': return '📮';
      default: return '📋';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'door': return 'Door-to-Door';
      case 'phone': return 'Phone Call';
      case 'email': return 'Email';
      case 'text': return 'Text Message';
      case 'event': return 'Event/Tent';
      case 'mail': return 'Direct Mail';
      default: return method;
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'positive': return 'Positive Response';
      case 'neutral': return 'Neutral Response';
      case 'negative': return 'Negative Response';
      case 'no_response': return 'No Response';
      case 'attempted': return 'Contact Attempted';
      default: return outcome;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Contact History
          </div>
          <Badge variant="outline" className="text-xs">
            {contactHistory.length} interactions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contactHistory.length > 0 ? (
          <div className="space-y-4">
            {contactHistory.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getMethodIcon(contact.method)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{getMethodLabel(contact.method)}</span>
                        <Badge className={`text-xs border ${getOutcomeColor(contact.outcome)}`}>
                          {getOutcomeLabel(contact.outcome)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {contact.date} at {contact.time}
                        {contact.duration && ` • ${contact.duration}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sentiment & Likelihood */}
                  <div className="flex items-center space-x-3 text-sm">
                    {contact.sentiment !== null && (
                      <div className="flex items-center space-x-1">
                        <span className={getSentimentColor(contact.sentiment)}>
                          {getSentimentIcon(contact.sentiment)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Sentiment: {contact.sentiment > 0 ? '+' : ''}{contact.sentiment}
                        </span>
                      </div>
                    )}
                    {contact.votingLikelihood && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground">
                          Vote Likelihood: {contact.votingLikelihood}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign & Volunteer */}
                <div className="flex items-center justify-between mb-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {contact.campaign}
                    </Badge>
                    <span className="text-muted-foreground">by {contact.volunteer}</span>
                  </div>
                  {contact.scriptUsed && (
                    <span className="text-xs text-muted-foreground">
                      Script: {contact.scriptUsed}
                    </span>
                  )}
                </div>

                {/* Issues Discussed */}
                {contact.issues.length > 0 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-2">Issues:</span>
                      {contact.issues.map((issue, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {contact.notes && (
                  <div className="mb-2">
                    <p className="text-sm leading-relaxed">{contact.notes}</p>
                  </div>
                )}

                {/* Follow-up */}
                {contact.followUp && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                    <Clock className="h-3 w-3" />
                    <span>Follow-up: {contact.followUp}</span>
                    {contact.followUpDate && (
                      <span>• Due: {contact.followUpDate}</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Summary Stats */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3 text-sm">Contact Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Total Contacts</div>
                  <div className="font-medium">{contactHistory.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Positive Responses</div>
                  <div className="font-medium text-green-600">
                    {contactHistory.filter(c => c.outcome === 'positive').length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Avg. Sentiment</div>
                  <div className="font-medium">
                    {(() => {
                      const sentiments = contactHistory.filter(c => c.sentiment !== null).map(c => c.sentiment!);
                      const avg = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;
                      return avg > 0 ? `+${avg.toFixed(1)}` : avg.toFixed(1);
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Contact</div>
                  <div className="font-medium">{contactHistory[0]?.date}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No contact history found</p>
            <p className="text-xs text-muted-foreground">
              This voter has not been contacted through any campaigns yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Profile Page Component
export default function VoterProfilePage() {
  const params = useParams<{ registration_number: string }>();
  const registrationNumber = params?.registration_number;
  const router = useRouter();
  const { selectedCampaign, campaigns, selectCampaign } = useCampaignContext();

  // For prototype: Auto-select first campaign if none selected
  useEffect(() => {
    if (!selectedCampaign && campaigns.length > 0) {
      selectCampaign(campaigns[0]); // Auto-select "GOTV Drive 2024" for demo
    }
  }, [selectedCampaign, campaigns, selectCampaign]);

  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      const offset = 160; // Fixed header + nav height
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  };

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

  // Fetch household score *after* location data (with address) is loaded
  const { 
    data: householdScoreData, 
    loading: householdScoreLoading, 
    error: householdScoreError 
  } = useHouseholdParticipationScore(locationData?.residenceAddress);

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
    <div className="container py-2 max-w-4xl mx-auto">
      {/* Back Button - Above everything with proper spacing */}
      <div className="mb-4 pt-[75px]">
        <Link
          href="/ga/voter/profile"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      {/* Enhanced Voter Header */}
      <div className="mb-4" id="page-top">
        {/* Prominent Voter Name */}
        <div className="mb-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {infoLoading ? (
              <Skeleton className="w-64 h-10 inline-block" />
            ) : (
              `${infoData?.firstName || 'MIRAL'} ${infoData?.lastName || 'SAMPLE'}`.trim()
            )}
          </h1>
          
          {/* Voter Demographics */}
          {infoData && (
            <div className="flex items-center space-x-4 text-lg text-muted-foreground mb-2">
              <span className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {infoData.race || 'OTHER'} | {infoData.birthYear ? new Date().getFullYear() - infoData.birthYear : '29'}y | {infoData.gender || 'Female'}
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                    <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center text-orange-800">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Voter Verification
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Before starting conversation:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Verify you're speaking with <strong>{infoData.firstName} {infoData.lastName}</strong></li>
                        <li>• Confirm person matches demographics shown</li>
                        <li>• If there's a mismatch, politely ask if {infoData.firstName} is available</li>
                        <li>• Use "Wrong person" option if speaking with different individual</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Address */}
          {locationData?.residenceAddress && (
            <p className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {formatAddress(locationData.residenceAddress)}
            </p>
          )}
        </div>
      </div>

      {/* Fixed Section Navigation */}
      <div className="fixed top-[87px] left-0 right-0 z-40 bg-background border-b shadow-sm py-3">
        <div className="container max-w-4xl mx-auto px-4">
          <nav className="flex space-x-4 overflow-x-auto">
            {selectedCampaign && (
              <button
                onClick={() => scrollToSection('campaign-tools')}
                className="text-sm font-medium hover:text-primary whitespace-nowrap px-3 py-1 rounded hover:bg-muted transition-colors"
              >
                📋 Campaign Tools
              </button>
            )}
            <button
              onClick={() => scrollToSection('contact-history')}
              className="text-sm font-medium hover:text-primary whitespace-nowrap px-3 py-1 rounded hover:bg-muted transition-colors"
            >
              📞 Contact History
            </button>
            <button
              onClick={() => scrollToSection('voter-info')}
              className="text-sm font-medium hover:text-primary whitespace-nowrap px-3 py-1 rounded hover:bg-muted transition-colors"
            >
              👤 Voter Info
            </button>
            <button
              onClick={() => scrollToSection('voting-history')}
              className="text-sm font-medium hover:text-primary whitespace-nowrap px-3 py-1 rounded hover:bg-muted transition-colors"
            >
              🗳️ History
            </button>
            <button
              onClick={() => scrollToSection('districts')}
              className="text-sm font-medium hover:text-primary whitespace-nowrap px-3 py-1 rounded hover:bg-muted transition-colors"
            >
              🏛️ Districts
            </button>
            <button
              onClick={() => scrollToSection('census')}
              className="text-sm font-medium hover:text-primary whitespace-nowrap px-3 py-1 rounded hover:bg-muted transition-colors"
            >
              📊 Census
            </button>
          </nav>
        </div>
      </div>

      {/* Content with top padding to account for fixed navigation */}
      <div className="pt-2">

        {/* Campaign Context Section - Only show if campaign is selected */}
        {selectedCampaign && (
          <div id="campaign-tools">
            <CampaignStatusBanner voterData={infoData} registrationNumber={registrationNumber} />
            
            <div id="ai-talking-points">
              <AITalkingPoints voterData={infoData} />
            </div>
            
            <div id="contact-recording">
              <ContactRecording voterData={infoData} registrationNumber={registrationNumber} />
            </div>
          </div>
        )}

        {/* Quick Voter Facts for Field Operations */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Registration:</span>
                  <span className="text-sm">{registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">County:</span>
                  <span className="text-sm">{infoData?.county || 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-sm">{infoData?.status || 'Loading...'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Voted:</span>
                  <span className="text-sm">{participationData?.lastVoteDate || 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Participation:</span>
                  <div className="text-sm">
                    {participationData?.participationScore !== undefined ? (
                      <ParticipationScoreWidget score={participationData.participationScore} size="small" variant="compact" />
                    ) : (
                      'Loading...'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact History Section - Always visible */}
        <div id="contact-history">
          <ContactHistory registrationNumber={registrationNumber} />
        </div>

        {/* Render Section Components with IDs for navigation */}
        <div id="voter-info">
          <VoterInfoSection data={infoData} loading={infoLoading} error={infoError} />
          
          <LocationSection
            locationData={locationData}
            locationLoading={locationLoading}
            locationError={locationError}
            otherVotersData={otherVotersData?.otherVoters || []}
            otherVotersLoading={otherVotersLoading}
            otherVotersError={otherVotersError}
            householdScoreData={householdScoreData}
            householdScoreLoading={householdScoreLoading}
            householdScoreError={householdScoreError}
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

      {/* Floating Voter Name Overlay and Scroll to Top Button */}
      {showScrollTop && (
        <>
          {/* Voter Name Overlay */}
          <div className="fixed bottom-6 right-20 z-40 bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
            <div className="text-lg font-bold">
              {infoData ? `${infoData.firstName || 'MIRAL'} ${infoData.lastName || 'SAMPLE'}`.trim() : 'Loading...'}
            </div>
            {selectedCampaign && (
              <div className="text-xs text-blue-600 font-medium">{selectedCampaign.name}</div>
            )}
          </div>

          {/* Scroll to Top Button */}
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Bottom spacing to ensure all content is viewable */}
      <div className="h-24"></div>

      {/* Global styles for smooth scroll and proper anchor positioning */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 160px; /* Fixed header (100px) + nav (60px) */
        }
      `}</style>
    </div>
  );
} 