import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';

// Enhanced mock data with more realistic statuses
const mockStations = [
  { id: '1', name: 'DRILLING', description: 'Initial bore drilling', color: 'station-drilling', icon: '🔩' },
  { id: '2', name: 'REAMING', description: 'Bore reaming & sizing', color: 'station-reaming', icon: '⚙️' },
  { id: '3', name: 'RIFLING', description: 'Rifling groove cutting', color: 'station-rifling', icon: '🌀' },
  { id: '4', name: 'LAPPING', description: 'Bore lapping & finishing', color: 'station-lapping', icon: '✨' },
  { id: '5', name: 'CHAMBERING', description: 'Chamber cutting', color: 'station-chambering', icon: '🔧' },
  { id: '6', name: 'THREADING', description: 'Muzzle & breach threading', color: 'station-threading', icon: '🧵' },
  { id: '7', name: 'PROFILING', description: 'External profile machining', color: 'station-profiling', icon: '📐' },
  { id: '8', name: 'STRESS_RELIEF', description: 'Heat treatment', color: 'station-stress', icon: '🔥' },
  { id: '9', name: 'FINISHING', description: 'Final surface finishing', color: 'station-finishing', icon: '💎' },
  { id: '10', name: 'FINAL_QC', description: 'Quality control inspection', color: 'station-qc', icon: '🔍' }
];

const mockBarrels = [
  { 
    id: 'RB-001', 
    caliber: '.308 Winchester', 
    length_inches: 24, 
    twist_rate: '1:10', 
    material: '416R Stainless',
    status: 'DRILLING_PENDING',
    created_at: new Date().toISOString(),
    priority: 'HIGH',
    customer: 'Customer A',
    progress: 0
  },
  { 
    id: 'RB-002', 
    caliber: '.300 Win Mag', 
    length_inches: 26, 
    twist_rate: '1:10', 
    material: '4140 Chrome Moly',
    status: 'REAMING_IN_PROGRESS',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    priority: 'MEDIUM',
    customer: 'Customer B',
    progress: 15
  },
  { 
    id: 'RB-003', 
    caliber: '.223 Remington', 
    length_inches: 20, 
    twist_rate: '1:7', 
    material: '416R Stainless',
    status: 'RIFLING_IN_PROGRESS',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    priority: 'LOW',
    customer: 'Customer C',
    progress: 35
  },
  { 
    id: 'RB-004', 
    caliber: '.22-250 Remington', 
    length_inches: 24, 
    twist_rate: '1:14', 
    material: '4140 Chrome Moly',
    status: 'LAPPING_PENDING',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    priority: 'HIGH',
    customer: 'Customer D',
    progress: 40
  }
];

const getStatusColor = (status: string) => {
  if (status.includes('PENDING')) return 'status-pending';
  if (status.includes('IN_PROGRESS')) return 'status-in-progress';
  if (status.includes('COMPLETED')) return 'status-completed';
  if (status.includes('PAUSED')) return 'status-paused';
  return 'status-pending';
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

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

  const getCurrentTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Manufacturing Branding */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <span className="text-blue-600">🏭</span>
                Rifle Barrel MES
              </h1>
              <p className="text-slate-600 text-lg">
                Manufacturing Execution System • Real-time Production Tracking
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">Current Time</div>
              <div className="text-lg font-semibold text-slate-700">{getCurrentTime()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Manufacturing Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Active Barrels</p>
                  <p className="text-3xl font-bold">{barrels.length}</p>
                </div>
                <div className="text-4xl opacity-80">📦</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">In Progress</p>
                  <p className="text-3xl font-bold">
                    {barrels.filter(b => b.status.includes('IN_PROGRESS')).length}
                  </p>
                </div>
                <div className="text-4xl opacity-80">⚡</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Pending</p>
                  <p className="text-3xl font-bold">
                    {barrels.filter(b => b.status.includes('PENDING')).length}
                  </p>
                </div>
                <div className="text-4xl opacity-80">⏳</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Efficiency</p>
                  <p className="text-3xl font-bold">94%</p>
                </div>
                <div className="text-4xl opacity-80">📊</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Station Selection */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
            <CardTitle className="text-2xl flex items-center gap-3">
              <span className="text-blue-600">🏭</span>
              Manufacturing Stations
              <span className="text-sm font-normal text-slate-600 ml-auto">
                Select a station to view its queue
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {mockStations.map((station) => (
                <Button
                  key={station.id}
                  variant={selectedStation.id === station.id ? "default" : "outline"}
                  className={`h-auto p-4 text-left flex flex-col items-center gap-2 transition-all duration-200 ${
                    selectedStation.id === station.id 
                      ? `${station.color} shadow-lg scale-105` 
                      : 'hover:shadow-md hover:scale-102 border-2'
                  }`}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="text-3xl">{station.icon}</div>
                  <div className="text-center">
                    <div className="font-bold text-sm">{station.name.replace('_', ' ')}</div>
                    <div className="text-xs opacity-80 mt-1">{station.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Station Queue */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl flex items-center gap-3">
              <span className="text-3xl">{selectedStation.icon}</span>
              {selectedStation.name.replace('_', ' ')} Station Queue
              <span className="text-lg font-normal text-slate-600 ml-auto">
                {getStationQueue().length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {getStationQueue().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-50">📭</div>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No items in queue</h3>
                <p className="text-slate-500">This station is currently clear</p>
              </div>
            ) : (
              <div className="space-y-6">
                {getStationQueue().map((barrel) => (
                  <Card key={barrel.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <span className="text-2xl">🔫</span>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-slate-800">Barrel {barrel.id}</h4>
                            <p className="text-slate-600 font-medium">{barrel.caliber}</p>
                            <p className="text-sm text-slate-500">Customer: {barrel.customer}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(barrel.status)}`}>
                            {barrel.status.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(barrel.priority)}`}>
                            {barrel.priority}
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span>Progress</span>
                          <span>{barrel.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${barrel.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <span className="block text-slate-500 font-medium">Length</span>
                          <span className="font-bold">{barrel.length_inches}"</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <span className="block text-slate-500 font-medium">Twist Rate</span>
                          <span className="font-bold">{barrel.twist_rate}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <span className="block text-slate-500 font-medium">Material</span>
                          <span className="font-bold">{barrel.material}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <span className="block text-slate-500 font-medium">Created</span>
                          <span className="font-bold">{new Date(barrel.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                          <span>▶️</span> Start Operation
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <span>⏸️</span> Pause
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <span>✅</span> Complete
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <span>📝</span> Add Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Status Footer */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Frontend: Running on port 5174</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Backend: Database connection needed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Demo Mode: Sample data</span>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
