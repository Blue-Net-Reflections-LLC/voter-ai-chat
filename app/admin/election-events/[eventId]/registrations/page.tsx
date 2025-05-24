'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown, RefreshCw, QrCode } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, IGetRowsParams, GetRowIdParams } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom theme using the new theming API
const lightTheme = themeQuartz.withParams({
  backgroundColor: 'hsl(0 0% 100%)', // --background light
  foregroundColor: 'hsl(240 10% 3.9%)', // --foreground light
  headerBackgroundColor: 'hsl(0 0% 100%)', // --card light
  headerTextColor: 'hsl(240 10% 3.9%)', // --card-foreground light
  oddRowBackgroundColor: 'hsl(0 0% 100%)', // same as background
  borderColor: 'hsl(214 32% 91%)', // --border light
  rowHoverColor: 'hsl(240 4.8% 95.9% / 0.1)', // --accent light with opacity
});

const darkTheme = themeQuartz.withParams({
  backgroundColor: 'hsl(240 5.9% 10%)', // --background dark
  foregroundColor: 'hsl(0 0% 98%)', // --foreground dark
  headerBackgroundColor: 'hsl(240 10% 3.9%)', // --card dark
  headerTextColor: 'hsl(0 0% 98%)', // --card-foreground dark
  oddRowBackgroundColor: 'hsl(240 5.9% 10%)', // same as background
  borderColor: 'hsl(240 3.7% 15.9%)', // --border dark
  rowHoverColor: 'hsl(240 3.7% 15.9% / 0.15)', // --accent dark with opacity
});

interface Registration {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  county_code: string;
  county_name: string;
  is_voter_registered: 'Y' | 'N' | 'U';
  registration_ip: string;
  created_at: string;
}

interface EventDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: string;
  registration_count: number;
}

interface AdminRegistrationsResponse {
  registrations: Registration[];
  event: EventDetails;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  statistics: {
    totalRegistrations: number;
    registeredVoters: number;
    nonRegistered: number;
    uncertain: number;
    countiesRepresented: number;
    firstRegistration: string;
    latestRegistration: string;
  };
}

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventRegistrationsPage({ params }: PageProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string>('');
  const [gridApi, setGridApi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Select theme based on dark mode
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    params.then((resolvedParams) => {
      setEventId(resolvedParams.eventId);
    });
  }, [params]);

  useEffect(() => {
    if (!eventId) return;
    
    const loadRegistrations = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          pageSize: '1000',
          sortField: 'created_at',
          sortDirection: 'desc'
        });
        const response = await fetch(`/admin/api/ga/election-events/${eventId}/registrations?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch registrations');
        }
        const data: AdminRegistrationsResponse = await response.json();
        setAllRegistrations(data.registrations);
        if (data.event) {
          setEventDetails(data.event);
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, [eventId]);

  // Auto-load QR code when eventId is available
  useEffect(() => {
    if (!eventId) return;
    
    const loadQRCode = async () => {
      try {
        const response = await fetch(`/api/ga/election-events/${eventId}/qr`);
        if (!response.ok) {
          console.warn('Failed to load QR code');
          return;
        }

        const blob = await response.blob();
        const qrUrl = window.URL.createObjectURL(blob);
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.warn('Error loading QR code:', error);
      }
    };

    loadQRCode();
  }, [eventId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getVoterStatusBadge = (status: string) => {
    const styles = {
      Y: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      N: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      U: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    
    const labels = {
      Y: 'Yes',
      N: 'No',
      U: 'Uncertain'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || 'Unknown'}
      </span>
    );
  };

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  const handleExportCSV = async () => {
    if (!eventId || !eventDetails) return;
    
    try {
      const response = await fetch(`/admin/api/ga/election-events/${eventId}/export`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleRefresh = () => {
    if (!eventId) return;
    
    const loadRegistrations = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          pageSize: '1000',
          sortField: 'created_at',
          sortDirection: 'desc'
        });
        const response = await fetch(`/admin/api/ga/election-events/${eventId}/registrations?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch registrations');
        }
        const data: AdminRegistrationsResponse = await response.json();
        setAllRegistrations(data.registrations);
        if (data.event) {
          setEventDetails(data.event);
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  };

  const handleDownloadQR = async () => {
    if (!eventId || !eventDetails) return;
    
    try {
      const response = await fetch(`/api/ga/election-events/${eventId}/qr`);
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const blob = await response.blob();
      
      // Create URL for display
      const qrUrl = window.URL.createObjectURL(blob);
      setQrCodeUrl(qrUrl);
      
      // Also trigger download
      const a = document.createElement('a');
      a.href = qrUrl;
      a.download = `qr-${eventDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  // AG-Grid column definitions
  const columnDefs: ColDef[] = [
    {
      headerName: 'Full Name',
      field: 'full_name',
      flex: 1,
    },
    {
      headerName: 'Email',
      field: 'email',
      flex: 1,
    },
    {
      headerName: 'Mobile Number',
      field: 'mobile_number',
      width: 150,
    },
    {
      headerName: 'County',
      field: 'county_name',
      width: 150,
      cellRenderer: (params: any) => (
        <div>
          <div className="font-medium">{params.value || 'Not provided'}</div>
          {params.data.county_code && (
            <div className="text-xs">
              Code: {params.data.county_code}
            </div>
          )}
        </div>
      )
    },
    {
      headerName: 'Voter Registered',
      field: 'is_voter_registered',
      width: 130,
      cellRenderer: (params: any) => 
        params.value ? getVoterStatusBadge(params.value) : 
        <span className="text-sm">Unknown</span>
    },
    {
      headerName: 'Registration Date',
      field: 'created_at',
      width: 180,
      cellRenderer: (params: any) => formatDate(params.value)
    },
    {
      headerName: 'IP Address',
      field: 'registration_ip',
      width: 130,
      cellRenderer: (params: any) => (
        <span className="font-mono text-sm">{params.value || 'N/A'}</span>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin/election-events')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {eventDetails?.title || 'Event Registrations'}
            </h1>
            <p className="text-muted-foreground">
              {eventDetails ? (
                <>
                  {eventDetails.registration_count} registrations • {eventDetails.location} • {' '}
                  {new Date(eventDetails.event_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </>
              ) : (
                'Loading event details...'
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleDownloadQR} disabled={!eventDetails}>
              <QrCode className="h-4 w-4 mr-2" />
              Download QR
            </Button>
            <Button onClick={handleExportCSV} disabled={!eventDetails}>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Event Details & QR Code - Same Line */}
        {eventDetails && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Event Details - Takes most space */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      eventDetails.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : eventDetails.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {eventDetails.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Registrations</h3>
                    <p className="text-2xl font-bold text-foreground">{allRegistrations.length}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Event ID</h3>
                    <p className="font-mono text-sm text-foreground">{eventDetails.id}</p>
                  </div>
                </div>
              </div>
              
              {/* QR Code - Right side */}
              {qrCodeUrl && (
                <div className="flex-shrink-0">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">Registration QR Code</h3>
                  <div className="inline-block bg-white p-3 rounded-lg shadow-sm">
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR Code for ${eventDetails.title}`} 
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AG-Grid Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div 
            style={{ 
              height: '600px', 
              width: '100%'
            }}
          >
            <div className="h-full w-full flex flex-col">
              <div className="flex-grow h-full w-full">
                <AgGridReact
                  theme={currentTheme}
                  columnDefs={columnDefs}
                  rowData={allRegistrations}
                  loading={loading}
                  animateRows={true}
                  rowHeight={60}
                  headerHeight={50}
                  pagination={true}
                  paginationPageSize={20}
                  domLayout='normal'
                  defaultColDef={defaultColDef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 