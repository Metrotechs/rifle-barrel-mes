import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { apiClient } from './services/api';
import { socketService } from './services/socket';
import type { Station, Barrel } from './types';

const queryClient = new QueryClient();

function MESApp() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationQueue, setStationQueue] = useState<Barrel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        // Initialize stations
        const stationsData = await apiClient.initializeStations();
        setStations(stationsData);
        
        // Connect to WebSocket
        socketService.connect();
        
        // Listen for real-time updates
        socketService.onQueueUpdated((queue) => {
          setStationQueue(queue);
        });

        socketService.onBarrelUpdated((data) => {
          console.log('Barrel updated:', data);
          // Refresh queue if we have a selected station
          if (selectedStation) {
            refreshQueue();
          }
        });
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const refreshQueue = async () => {
    if (selectedStation) {
      try {
        const queue = await apiClient.getStationQueue(selectedStation.id);
        setStationQueue(queue);
      } catch (error) {
        console.error('Failed to refresh queue:', error);
      }
    }
  };

  const selectStation = async (station: Station) => {
    setSelectedStation(station);
    socketService.joinStation(station.id);
    
    try {
      const queue = await apiClient.getStationQueue(station.id);
      setStationQueue(queue);
    } catch (error) {
      console.error('Failed to load station queue:', error);
    }
  };

  const startOperation = async (barrel: Barrel) => {
    if (!selectedStation) return;
    
    try {
      await apiClient.startOperation(barrel.id, {
        stationId: selectedStation.id,
        operatorId: 'tablet-operator', // In real app, get from auth
      });
      await refreshQueue();
    } catch (error) {
      console.error('Failed to start operation:', error);
    }
  };

  const completeOperation = async (barrel: Barrel) => {
    try {
      await apiClient.completeOperation(barrel.id, {
        notes: 'Completed via tablet interface',
      });
      await refreshQueue();
    } catch (error) {
      console.error('Failed to complete operation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('PENDING')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('IN_PROGRESS')) return 'bg-blue-100 text-blue-800';
    if (status === 'READY_TO_SHIP') return 'bg-green-100 text-green-800';
    if (status === 'HOLD' || status === 'REWORK') return 'bg-orange-100 text-orange-800';
    if (status === 'SCRAP') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading MES System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔫 Rifle Barrel MES - Shop Floor
        </h1>

        {!selectedStation ? (
          // Station Selection
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Your Station</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stations.map((station) => (
                <Card
                  key={station.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => selectStation(station)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {station.name.replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 mb-2">
                      {station.description}
                    </p>
                    <p className="text-sm font-semibold">
                      Step {station.sequence}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Station Queue View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedStation.name.replace(/_/g, ' ')} - Work Queue
              </h2>
              <div className="space-x-2">
                <Button onClick={refreshQueue} variant="outline">
                  Refresh
                </Button>
                <Button onClick={() => setSelectedStation(null)} variant="outline">
                  Change Station
                </Button>
              </div>
            </div>

            {stationQueue.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-500">
                    No barrels in queue for this station
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {stationQueue.map((barrel) => (
                  <Card key={barrel.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {barrel.caliber} - {barrel.twist} twist
                          </h3>
                          <p className="text-sm text-gray-600">
                            Length: {barrel.lengthIn}" | ID: {barrel.id.slice(0, 8)}...
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(barrel.status)}`}>
                            {barrel.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="space-x-2">
                          {barrel.status.includes('PENDING') && (
                            <Button
                              onClick={() => startOperation(barrel)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Start
                            </Button>
                          )}
                          {barrel.status.includes('IN_PROGRESS') && (
                            <Button
                              onClick={() => completeOperation(barrel)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MESApp />
    </QueryClientProvider>
  );
}

export default App;
