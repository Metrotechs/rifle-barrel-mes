import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';

// Mock data for demo
const mockStations = [
  { id: '1', name: 'DRILLING', description: 'Initial drilling operation' },
  { id: '2', name: 'REAMING', description: 'Bore reaming and sizing' },
  { id: '3', name: 'RIFLING', description: 'Rifling groove cutting' },
  { id: '4', name: 'LAPPING', description: 'Bore lapping and finishing' },
  { id: '5', name: 'CHAMBERING', description: 'Chamber cutting and finishing' },
  { id: '6', name: 'THREADING', description: 'Muzzle and breach threading' },
  { id: '7', name: 'PROFILING', description: 'External profile machining' },
  { id: '8', name: 'STRESS_RELIEF', description: 'Heat treatment stress relief' },
  { id: '9', name: 'FINISHING', description: 'Final surface finishing' },
  { id: '10', name: 'FINAL_QC', description: 'Final quality control inspection' }
];

const mockBarrels = [
  { 
    id: '1', 
    caliber: '.308 Winchester', 
    length_inches: 24, 
    twist_rate: '1:10', 
    material: '416R Stainless',
    status: 'DRILLING_PENDING',
    created_at: new Date().toISOString()
  },
  { 
    id: '2', 
    caliber: '.300 Win Mag', 
    length_inches: 26, 
    twist_rate: '1:10', 
    material: '4140 Chrome Moly',
    status: 'REAMING_PENDING',
    created_at: new Date().toISOString()
  },
  { 
    id: '3', 
    caliber: '.223 Remington', 
    length_inches: 20, 
    twist_rate: '1:7', 
    material: '416R Stainless',
    status: 'RIFLING_IN_PROGRESS',
    created_at: new Date().toISOString()
  }
];

export default function App() {
  const [selectedStation, setSelectedStation] = useState(mockStations[0]);
  const [barrels] = useState(mockBarrels);

  const getStationQueue = () => {
    return barrels.filter(barrel => 
      barrel.status.includes(selectedStation.name) || 
      barrel.status === `${selectedStation.name}_PENDING` ||
      barrel.status === `${selectedStation.name}_IN_PROGRESS`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rifle Barrel Manufacturing Execution System
          </h1>
          <p className="text-gray-600">
            Real-time production tracking and workflow management
          </p>
        </div>

        {/* Station Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Station</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {mockStations.map((station) => (
                <Button
                  key={station.id}
                  variant={selectedStation.id === station.id ? "default" : "outline"}
                  className="h-auto p-3 text-left flex flex-col items-start"
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="font-semibold text-sm">{station.name}</div>
                  <div className="text-xs opacity-70 mt-1">{station.description}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Station Queue */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedStation.name} Queue
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({getStationQueue().length} items)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getStationQueue().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No barrels in queue for this station
              </div>
            ) : (
              <div className="space-y-4">
                {getStationQueue().map((barrel) => (
                  <Card key={barrel.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">Barrel #{barrel.id}</h4>
                          <p className="text-sm text-gray-600">{barrel.caliber}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {barrel.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Length:</span> {barrel.length_inches}"
                        </div>
                        <div>
                          <span className="text-gray-500">Twist:</span> {barrel.twist_rate}
                        </div>
                        <div>
                          <span className="text-gray-500">Material:</span> {barrel.material}
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span> {new Date(barrel.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Start Operation
                        </Button>
                        <Button size="sm" variant="outline">
                          Pause
                        </Button>
                        <Button size="sm" variant="outline">
                          Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>⚠️ Demo Mode - Backend database not connected</p>
          <p>Frontend: ✅ Running on http://localhost:5173</p>
          <p>Backend: ⚠️ Database connection needed</p>
        </div>
      </div>
    </div>
  );
}
