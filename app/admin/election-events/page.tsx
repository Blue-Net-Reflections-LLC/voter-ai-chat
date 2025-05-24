'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, FileDown, Eye, QrCode } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, IGetRowsParams } from 'ag-grid-community';


// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ElectionEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: 'active' | 'inactive' | 'cancelled';
  max_capacity: number;
  registration_count: number;
  created_at: string;
  seo_slug: string;
}

interface AdminEventsResponse {
  events: ElectionEvent[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  statistics: {
    totalEvents: number;
    activeEvents: number;
    inactiveEvents: number;
    cancelledEvents: number;
    totalRegistrations: number;
    avgRegistrationsPerEvent: number;
  };
}

export default function AdminElectionEventsPage() {
  const router = useRouter();
  const [gridApi, setGridApi] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`;
  };

  // AG-Grid column definitions
  const columnDefs: ColDef[] = [
    {
      headerName: 'Title',
      field: 'title',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => (
        <div className="py-1">
          <div className="font-medium text-foreground">{params.value}</div>
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {params.data.description}
          </div>
        </div>
      )
    },
    {
      headerName: 'Event Date',
      field: 'event_date',
      width: 150,
      sortable: true,
      cellRenderer: (params: any) => formatDate(params.value)
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => (
        <span className={getStatusBadge(params.value)}>
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Registrations',
      field: 'registration_count',
      width: 120,
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="text-center">
          <span className="font-medium">{params.value}</span>
          {params.data.max_capacity && (
            <span className="text-muted-foreground">
              /{params.data.max_capacity}
            </span>
          )}
        </div>
      )
    },
    {
      headerName: 'Location',
      field: 'location',
      flex: 1,
      sortable: true,
      filter: true
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 200,
      cellRenderer: (params: any) => (
        <div className="flex gap-2 py-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/election-events/${params.data.id}/registrations`)}
            title="View Registrations"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadQR(params.data.id, params.data.title, params.data.seo_slug)}
            title="Download QR Code"
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCSV(params.data.id, params.data.title)}
            title="Export CSV"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Client-side datasource for AG-Grid
  const [allEvents, setAllEvents] = useState<ElectionEvent[]>([]);

  // Load all data for client-side processing
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        // Only include parameters with actual values to avoid null validation errors
        const params = {
          page: '1',
          pageSize: '1000',
          sortField: 'event_date',
          sortDirection: 'desc'
        };
        
        const queryParams = new URLSearchParams(params);
        const response = await fetch(`/admin/api/ga/election-events?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data: AdminEventsResponse = await response.json();
        setAllEvents(data.events);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleExportCSV = async (eventId: string, eventTitle: string) => {
    try {
      const response = await fetch(`/admin/api/ga/election-events/${eventId}/export`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDownloadQR = async (eventId: string, eventTitle: string, seoSlug: string) => {
    try {
      const response = await fetch(`/api/ga/election-events/${eventId}/qr`);
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${seoSlug || eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const handleCreateEvent = () => {
    router.push('/admin/election-events/create');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Election Events</h1>
            <p className="text-muted-foreground">Manage election event registrations</p>
          </div>
          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* AG-Grid Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={allEvents}
              loading={loading}
              animateRows={true}
              rowHeight={60}
              headerHeight={50}
              pagination={true}
              paginationPageSize={20}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 