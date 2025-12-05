import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Package, TrendingUp, Users, 
  Clock, CheckCircle, XCircle, AlertTriangle,
  DollarSign, Activity, Zap
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    revenue: 0,
    avgProcessingTime: 0,
    eventsProcessed: 0
  });

  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [eventFlow, setEventFlow] = useState<any[]>([]);

  // Simulate real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        orders: Math.floor(Math.random() * 50) + 150,
        events: Math.floor(Math.random() * 200) + 800,
        latency: Math.floor(Math.random() * 50) + 120
      };
      
      setRealtimeData(prev => [...prev.slice(-19), newDataPoint]);
      
      // Simulate new orders
      if (Math.random() > 0.7) {
        const newOrder = {
          id: `ORD-${Date.now()}`,
          customer: `Customer ${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 500) + 50,
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          items: Math.floor(Math.random() * 5) + 1
        };
        setOrders(prev => [newOrder, ...prev.slice(0, 9)]);
        
        setStats(prev => ({
          ...prev,
          totalOrders: prev.totalOrders + 1,
          activeOrders: prev.activeOrders + 1,
          revenue: prev.revenue + newOrder.amount,
          eventsProcessed: prev.eventsProcessed + 3
        }));
      }
      
      // Simulate order completions
      if (Math.random() > 0.8 && orders.length > 0) {
        setOrders(prev => {
          const updated = [...prev];
          const activeIndex = updated.findIndex(o => o.status === 'PLACED');
          if (activeIndex !== -1) {
            updated[activeIndex].status = 'COMPLETED';
          }
          return updated;
        });
        
        setStats(prev => ({
          ...prev,
          activeOrders: Math.max(0, prev.activeOrders - 1),
          completedOrders: prev.completedOrders + 1
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orders]);

  // Event flow animation
  useEffect(() => {
    const interval = setInterval(() => {
      const events = [
        { type: 'OrderPlaced', color: 'bg-blue-500', path: 'Command → EventStore' },
        { type: 'OrderValidated', color: 'bg-green-500', path: 'EventStore → Kinesis' },
        { type: 'PaymentProcessed', color: 'bg-purple-500', path: 'Kinesis → Projection' },
        { type: 'InventoryUpdated', color: 'bg-yellow-500', path: 'SNS → SQS → Handler' }
      ];
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setEventFlow(prev => [{ ...randomEvent, id: Date.now() }, ...prev.slice(0, 4)]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const performanceData = [
    { name: 'Command', latency: 145, target: 200 },
    { name: 'Event Store', latency: 52, target: 100 },
    { name: 'Kinesis', latency: 380, target: 500 },
    { name: 'Projection', latency: 1200, target: 2000 },
    { name: 'Query', latency: 85, target: 200 }
  ];

  const eventDistribution = [
    { name: 'OrderPlaced', value: 450, color: '#8b5cf6' },
    { name: 'OrderCancelled', value: 45, color: '#ef4444' },
    { name: 'PaymentProcessed', value: 420, color: '#10b981' },
    { name: 'InventoryUpdated', value: 380, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-8 h-8 text-blue-400" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-blue-400 rounded-full"
            />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalOrders.toLocaleString()}
          </div>
          <div className="text-blue-300 text-sm">Total Orders Processed</div>
          <div className="mt-3 flex items-center text-green-400 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+23% from last hour</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-green-400" />
            <div className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">LIVE</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.activeOrders}
          </div>
          <div className="text-green-300 text-sm">Active Orders</div>
          <div className="mt-3 text-xs text-gray-400">
            Processing in real-time
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-400" />
            <CheckCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${(stats.revenue / 1000).toFixed(1)}K
          </div>
          <div className="text-purple-300 text-sm">Revenue Generated</div>
          <div className="mt-3 flex items-center text-purple-400 text-sm">
            <Zap className="w-4 h-4 mr-1" />
            <span>Real-time tracking</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-yellow-400" />
            <div className="text-xs text-yellow-300">EVENTS</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(stats.eventsProcessed / 1000).toFixed(1)}K
          </div>
          <div className="text-yellow-300 text-sm">Events Processed</div>
          <div className="mt-3 text-xs text-gray-400">
            Avg: 850 events/sec
          </div>
        </motion.div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Real-Time Throughput
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={realtimeData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="time" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #ffffff20',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="orders" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOrders)" />
              <Area type="monotone" dataKey="events" stroke="#10b981" fillOpacity={1} fill="url(#colorEvents)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-400" />
            Performance Metrics (p99 Latency)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #ffffff20',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="latency" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="target" fill="#ffffff20" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-400 text-center">
            All metrics well below target thresholds ✓
          </div>
        </motion.div>
      </div>

      {/* Event Flow & Recent Orders */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Live Event Flow
          </h3>
          <div className="space-y-3">
            {eventFlow.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className={`w-2 h-2 ${event.color} rounded-full animate-pulse`} />
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{event.type}</div>
                  <div className="text-gray-400 text-xs">{event.path}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.floor(Math.random() * 50) + 10}ms
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-purple-400" />
            Recent Orders
          </h3>
          <div className="space-y-2">
            {orders.slice(0, 6).map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-green-400' : 'bg-blue-400 animate-pulse'
                  }`} />
                  <div>
                    <div className="text-white font-medium text-sm">{order.id}</div>
                    <div className="text-gray-400 text-xs">{order.customer}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-sm">${order.amount}</div>
                  <div className={`text-xs ${
                    order.status === 'COMPLETED' ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Event Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Event Type Distribution</h3>
        <div className="grid grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={eventDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {eventDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center space-y-3">
            {eventDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-white text-sm">{item.name}</span>
                </div>
                <span className="text-gray-400 text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
