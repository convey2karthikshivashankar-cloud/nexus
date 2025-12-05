"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const recharts_1 = require("recharts");
const Dashboard = () => {
    const [orders, setOrders] = (0, react_1.useState)([]);
    const [stats, setStats] = (0, react_1.useState)({
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        revenue: 0,
        avgProcessingTime: 0,
        eventsProcessed: 0
    });
    const [realtimeData, setRealtimeData] = (0, react_1.useState)([]);
    const [eventFlow, setEventFlow] = (0, react_1.useState)([]);
    // Simulate real-time data
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    return (<div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-6">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <lucide_react_1.ShoppingCart className="w-8 h-8 text-blue-400"/>
            <framer_motion_1.motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-3 h-3 bg-blue-400 rounded-full"/>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalOrders.toLocaleString()}
          </div>
          <div className="text-blue-300 text-sm">Total Orders Processed</div>
          <div className="mt-3 flex items-center text-green-400 text-sm">
            <lucide_react_1.TrendingUp className="w-4 h-4 mr-1"/>
            <span>+23% from last hour</span>
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <lucide_react_1.Activity className="w-8 h-8 text-green-400"/>
            <div className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">LIVE</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.activeOrders}
          </div>
          <div className="text-green-300 text-sm">Active Orders</div>
          <div className="mt-3 text-xs text-gray-400">
            Processing in real-time
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <lucide_react_1.DollarSign className="w-8 h-8 text-purple-400"/>
            <lucide_react_1.CheckCircle className="w-6 h-6 text-purple-400"/>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${(stats.revenue / 1000).toFixed(1)}K
          </div>
          <div className="text-purple-300 text-sm">Revenue Generated</div>
          <div className="mt-3 flex items-center text-purple-400 text-sm">
            <lucide_react_1.Zap className="w-4 h-4 mr-1"/>
            <span>Real-time tracking</span>
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <lucide_react_1.Activity className="w-8 h-8 text-yellow-400"/>
            <div className="text-xs text-yellow-300">EVENTS</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(stats.eventsProcessed / 1000).toFixed(1)}K
          </div>
          <div className="text-yellow-300 text-sm">Events Processed</div>
          <div className="mt-3 text-xs text-gray-400">
            Avg: 850 events/sec
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-2 gap-6">
        <framer_motion_1.motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Activity className="w-5 h-5 mr-2 text-blue-400"/>
            Real-Time Throughput
          </h3>
          <recharts_1.ResponsiveContainer width="100%" height={250}>
            <recharts_1.AreaChart data={realtimeData}>
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
              <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="#ffffff20"/>
              <recharts_1.XAxis dataKey="time" stroke="#ffffff60"/>
              <recharts_1.YAxis stroke="#ffffff60"/>
              <recharts_1.Tooltip contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #ffffff20',
            borderRadius: '8px'
        }}/>
              <recharts_1.Area type="monotone" dataKey="orders" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOrders)"/>
              <recharts_1.Area type="monotone" dataKey="events" stroke="#10b981" fillOpacity={1} fill="url(#colorEvents)"/>
            </recharts_1.AreaChart>
          </recharts_1.ResponsiveContainer>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Clock className="w-5 h-5 mr-2 text-green-400"/>
            Performance Metrics (p99 Latency)
          </h3>
          <recharts_1.ResponsiveContainer width="100%" height={250}>
            <recharts_1.BarChart data={performanceData}>
              <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="#ffffff20"/>
              <recharts_1.XAxis dataKey="name" stroke="#ffffff60"/>
              <recharts_1.YAxis stroke="#ffffff60"/>
              <recharts_1.Tooltip contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #ffffff20',
            borderRadius: '8px'
        }}/>
              <recharts_1.Bar dataKey="latency" fill="#10b981" radius={[8, 8, 0, 0]}/>
              <recharts_1.Bar dataKey="target" fill="#ffffff20" radius={[8, 8, 0, 0]}/>
            </recharts_1.BarChart>
          </recharts_1.ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-400 text-center">
            All metrics well below target thresholds ✓
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* Event Flow & Recent Orders */}
      <div className="grid grid-cols-2 gap-6">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Zap className="w-5 h-5 mr-2 text-yellow-400"/>
            Live Event Flow
          </h3>
          <div className="space-y-3">
            {eventFlow.map((event, index) => (<framer_motion_1.motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className={`w-2 h-2 ${event.color} rounded-full animate-pulse`}/>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{event.type}</div>
                  <div className="text-gray-400 text-xs">{event.path}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.floor(Math.random() * 50) + 10}ms
                </div>
              </framer_motion_1.motion.div>))}
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.ShoppingCart className="w-5 h-5 mr-2 text-purple-400"/>
            Recent Orders
          </h3>
          <div className="space-y-2">
            {orders.slice(0, 6).map((order) => (<framer_motion_1.motion.div key={order.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${order.status === 'COMPLETED' ? 'bg-green-400' : 'bg-blue-400 animate-pulse'}`}/>
                  <div>
                    <div className="text-white font-medium text-sm">{order.id}</div>
                    <div className="text-gray-400 text-xs">{order.customer}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-sm">${order.amount}</div>
                  <div className={`text-xs ${order.status === 'COMPLETED' ? 'text-green-400' : 'text-blue-400'}`}>
                    {order.status}
                  </div>
                </div>
              </framer_motion_1.motion.div>))}
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* Event Distribution */}
      <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Event Type Distribution</h3>
        <div className="grid grid-cols-2 gap-6">
          <recharts_1.ResponsiveContainer width="100%" height={200}>
            <recharts_1.PieChart>
              <recharts_1.Pie data={eventDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {eventDistribution.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={entry.color}/>))}
              </recharts_1.Pie>
              <recharts_1.Tooltip />
            </recharts_1.PieChart>
          </recharts_1.ResponsiveContainer>
          <div className="flex flex-col justify-center space-y-3">
            {eventDistribution.map((item) => (<div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}/>
                  <span className="text-white text-sm">{item.name}</span>
                </div>
                <span className="text-gray-400 text-sm">{item.value}</span>
              </div>))}
          </div>
        </div>
      </framer_motion_1.motion.div>
    </div>);
};
exports.default = Dashboard;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGFzaGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRGFzaGJvYXJkLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFtRDtBQUNuRCxpREFBdUM7QUFDdkMsK0NBSXNCO0FBQ3RCLHVDQUFtSztBQUVuSyxNQUFNLFNBQVMsR0FBRyxHQUFHLEVBQUU7SUFDckIsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQVEsRUFBRSxDQUFDLENBQUM7SUFDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQUM7UUFDakMsV0FBVyxFQUFFLENBQUM7UUFDZCxZQUFZLEVBQUUsQ0FBQztRQUNmLGVBQWUsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sRUFBRSxDQUFDO1FBQ1YsaUJBQWlCLEVBQUUsQ0FBQztRQUNwQixlQUFlLEVBQUUsQ0FBQztLQUNuQixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBUSxFQUFFLENBQUMsQ0FBQztJQUM1RCxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBUSxFQUFFLENBQUMsQ0FBQztJQUV0RCwwQkFBMEI7SUFDMUIsSUFBQSxpQkFBUyxFQUFDLEdBQUcsRUFBRTtRQUNiLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFDaEMsTUFBTSxZQUFZLEdBQUc7Z0JBQ25CLElBQUksRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLGtCQUFrQixFQUFFO2dCQUNyQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRztnQkFDNUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFL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O2tCQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsRUFDeEU7a0JBQUEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FDeEQ7Z0JBQUEsRUFBRSxHQUFHLENBQ0w7Z0JBQUEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FDNUQ7Y0FBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUMsQ0FDSjtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxHQUFHLENBQ1A7TUFBQSxFQUFFLHNCQUFNLENBQUMsR0FBRyxDQUNkO0lBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBRUYsa0JBQWUsU0FBUyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IG1vdGlvbiB9IGZyb20gJ2ZyYW1lci1tb3Rpb24nO1xyXG5pbXBvcnQgeyBcclxuICBTaG9wcGluZ0NhcnQsIFBhY2thZ2UsIFRyZW5kaW5nVXAsIFVzZXJzLCBcclxuICBDbG9jaywgQ2hlY2tDaXJjbGUsIFhDaXJjbGUsIEFsZXJ0VHJpYW5nbGUsXHJcbiAgRG9sbGFyU2lnbiwgQWN0aXZpdHksIFphcFxyXG59IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XHJcbmltcG9ydCB7IExpbmVDaGFydCwgTGluZSwgQXJlYUNoYXJ0LCBBcmVhLCBCYXJDaGFydCwgQmFyLCBQaWVDaGFydCwgUGllLCBDZWxsLCBYQXhpcywgWUF4aXMsIENhcnRlc2lhbkdyaWQsIFRvb2x0aXAsIExlZ2VuZCwgUmVzcG9uc2l2ZUNvbnRhaW5lciB9IGZyb20gJ3JlY2hhcnRzJztcclxuXHJcbmNvbnN0IERhc2hib2FyZCA9ICgpID0+IHtcclxuICBjb25zdCBbb3JkZXJzLCBzZXRPcmRlcnNdID0gdXNlU3RhdGU8YW55W10+KFtdKTtcclxuICBjb25zdCBbc3RhdHMsIHNldFN0YXRzXSA9IHVzZVN0YXRlKHtcclxuICAgIHRvdGFsT3JkZXJzOiAwLFxyXG4gICAgYWN0aXZlT3JkZXJzOiAwLFxyXG4gICAgY29tcGxldGVkT3JkZXJzOiAwLFxyXG4gICAgcmV2ZW51ZTogMCxcclxuICAgIGF2Z1Byb2Nlc3NpbmdUaW1lOiAwLFxyXG4gICAgZXZlbnRzUHJvY2Vzc2VkOiAwXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IFtyZWFsdGltZURhdGEsIHNldFJlYWx0aW1lRGF0YV0gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xyXG4gIGNvbnN0IFtldmVudEZsb3csIHNldEV2ZW50Rmxvd10gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xyXG5cclxuICAvLyBTaW11bGF0ZSByZWFsLXRpbWUgZGF0YVxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgY29uc3QgbmV3RGF0YVBvaW50ID0ge1xyXG4gICAgICAgIHRpbWU6IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCksXHJcbiAgICAgICAgb3JkZXJzOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MCkgKyAxNTAsXHJcbiAgICAgICAgZXZlbnRzOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyMDApICsgODAwLFxyXG4gICAgICAgIGxhdGVuY3k6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwKSArIDEyMFxyXG4gICAgICB9O1xyXG4gICAgICBcclxuICAgICAgc2V0UmVhbHRpbWVEYXRhKHByZXYgPT4gWy4uLnByZXYuc2xpY2UoLTE5KSwgbmV3RGF0YVBvaW50XSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBTaW11bGF0ZSBuZXcgb3JkZXJzXHJcbiAgICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC43KSB7XHJcbiAgICAgICAgY29uc3QgbmV3T3JkZXIgPSB7XHJcbiAgICAgICAgICBpZDogYE9SRC0ke0RhdGUubm93KCl9YCxcclxuICAgICAgICAgIGN1c3RvbWVyOiBgQ3VzdG9tZXIgJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwKX1gLFxyXG4gICAgICAgICAgYW1vdW50OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApICsgNTAsXHJcbiAgICAgICAgICBzdGF0dXM6ICdQTEFDRUQnLFxyXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICBpdGVtczogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNSkgKyAxXHJcbiAgICAgICAgfTtcclxuICAgICAgICBzZXRPcmRlcnMocHJldiA9PiBbbmV3T3JkZXIsIC4uLnByZXYuc2xpY2UoMCwgOSldKTtcclxuICAgICAgICBcclxuICAgICAgICBzZXRTdGF0cyhwcmV2ID0+ICh7XHJcbiAgICAgICAgICAuLi5wcmV2LFxyXG4gICAgICAgICAgdG90YWxPcmRlcnM6IHByZXYudG90YWxPcmRlcnMgKyAxLFxyXG4gICAgICAgICAgYWN0aXZlT3JkZXJzOiBwcmV2LmFjdGl2ZU9yZGVycyArIDEsXHJcbiAgICAgICAgICByZXZlbnVlOiBwcmV2LnJldmVudWUgKyBuZXdPcmRlci5hbW91bnQsXHJcbiAgICAgICAgICBldmVudHNQcm9jZXNzZWQ6IHByZXYuZXZlbnRzUHJvY2Vzc2VkICsgM1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gU2ltdWxhdGUgb3JkZXIgY29tcGxldGlvbnNcclxuICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjggJiYgb3JkZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBzZXRPcmRlcnMocHJldiA9PiB7XHJcbiAgICAgICAgICBjb25zdCB1cGRhdGVkID0gWy4uLnByZXZdO1xyXG4gICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSB1cGRhdGVkLmZpbmRJbmRleChvID0+IG8uc3RhdHVzID09PSAnUExBQ0VEJyk7XHJcbiAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHVwZGF0ZWRbYWN0aXZlSW5kZXhdLnN0YXR1cyA9ICdDT01QTEVURUQnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZWQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2V0U3RhdHMocHJldiA9PiAoe1xyXG4gICAgICAgICAgLi4ucHJldixcclxuICAgICAgICAgIGFjdGl2ZU9yZGVyczogTWF0aC5tYXgoMCwgcHJldi5hY3RpdmVPcmRlcnMgLSAxKSxcclxuICAgICAgICAgIGNvbXBsZXRlZE9yZGVyczogcHJldi5jb21wbGV0ZWRPcmRlcnMgKyAxXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9XHJcbiAgICB9LCAyMDAwKTtcclxuXHJcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XHJcbiAgfSwgW29yZGVyc10pO1xyXG5cclxuICAvLyBFdmVudCBmbG93IGFuaW1hdGlvblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnRzID0gW1xyXG4gICAgICAgIHsgdHlwZTogJ09yZGVyUGxhY2VkJywgY29sb3I6ICdiZy1ibHVlLTUwMCcsIHBhdGg6ICdDb21tYW5kIOKGkiBFdmVudFN0b3JlJyB9LFxyXG4gICAgICAgIHsgdHlwZTogJ09yZGVyVmFsaWRhdGVkJywgY29sb3I6ICdiZy1ncmVlbi01MDAnLCBwYXRoOiAnRXZlbnRTdG9yZSDihpIgS2luZXNpcycgfSxcclxuICAgICAgICB7IHR5cGU6ICdQYXltZW50UHJvY2Vzc2VkJywgY29sb3I6ICdiZy1wdXJwbGUtNTAwJywgcGF0aDogJ0tpbmVzaXMg4oaSIFByb2plY3Rpb24nIH0sXHJcbiAgICAgICAgeyB0eXBlOiAnSW52ZW50b3J5VXBkYXRlZCcsIGNvbG9yOiAnYmcteWVsbG93LTUwMCcsIHBhdGg6ICdTTlMg4oaSIFNRUyDihpIgSGFuZGxlcicgfVxyXG4gICAgICBdO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcmFuZG9tRXZlbnQgPSBldmVudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZXZlbnRzLmxlbmd0aCldO1xyXG4gICAgICBzZXRFdmVudEZsb3cocHJldiA9PiBbeyAuLi5yYW5kb21FdmVudCwgaWQ6IERhdGUubm93KCkgfSwgLi4ucHJldi5zbGljZSgwLCA0KV0pO1xyXG4gICAgfSwgMTUwMCk7XHJcblxyXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gIH0sIFtdKTtcclxuXHJcbiAgY29uc3QgcGVyZm9ybWFuY2VEYXRhID0gW1xyXG4gICAgeyBuYW1lOiAnQ29tbWFuZCcsIGxhdGVuY3k6IDE0NSwgdGFyZ2V0OiAyMDAgfSxcclxuICAgIHsgbmFtZTogJ0V2ZW50IFN0b3JlJywgbGF0ZW5jeTogNTIsIHRhcmdldDogMTAwIH0sXHJcbiAgICB7IG5hbWU6ICdLaW5lc2lzJywgbGF0ZW5jeTogMzgwLCB0YXJnZXQ6IDUwMCB9LFxyXG4gICAgeyBuYW1lOiAnUHJvamVjdGlvbicsIGxhdGVuY3k6IDEyMDAsIHRhcmdldDogMjAwMCB9LFxyXG4gICAgeyBuYW1lOiAnUXVlcnknLCBsYXRlbmN5OiA4NSwgdGFyZ2V0OiAyMDAgfVxyXG4gIF07XHJcblxyXG4gIGNvbnN0IGV2ZW50RGlzdHJpYnV0aW9uID0gW1xyXG4gICAgeyBuYW1lOiAnT3JkZXJQbGFjZWQnLCB2YWx1ZTogNDUwLCBjb2xvcjogJyM4YjVjZjYnIH0sXHJcbiAgICB7IG5hbWU6ICdPcmRlckNhbmNlbGxlZCcsIHZhbHVlOiA0NSwgY29sb3I6ICcjZWY0NDQ0JyB9LFxyXG4gICAgeyBuYW1lOiAnUGF5bWVudFByb2Nlc3NlZCcsIHZhbHVlOiA0MjAsIGNvbG9yOiAnIzEwYjk4MScgfSxcclxuICAgIHsgbmFtZTogJ0ludmVudG9yeVVwZGF0ZWQnLCB2YWx1ZTogMzgwLCBjb2xvcjogJyNmNTllMGInIH1cclxuICBdO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTZcIj5cclxuICAgICAgey8qIEhlcm8gU3RhdHMgKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtNCBnYXAtNlwiPlxyXG4gICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMSB9fVxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1ibHVlLTUwMC8yMCB0by1ibHVlLTYwMC8yMCBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItYmx1ZS01MDAvMzAgcm91bmRlZC0yeGwgcC02XCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi00XCI+XHJcbiAgICAgICAgICAgIDxTaG9wcGluZ0NhcnQgY2xhc3NOYW1lPVwidy04IGgtOCB0ZXh0LWJsdWUtNDAwXCIgLz5cclxuICAgICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgICBhbmltYXRlPXt7IHNjYWxlOiBbMSwgMS4yLCAxXSB9fVxyXG4gICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDIsIHJlcGVhdDogSW5maW5pdHkgfX1cclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTMgaC0zIGJnLWJsdWUtNDAwIHJvdW5kZWQtZnVsbFwiXHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0zeGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItMVwiPlxyXG4gICAgICAgICAgICB7c3RhdHMudG90YWxPcmRlcnMudG9Mb2NhbGVTdHJpbmcoKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWJsdWUtMzAwIHRleHQtc21cIj5Ub3RhbCBPcmRlcnMgUHJvY2Vzc2VkPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTMgZmxleCBpdGVtcy1jZW50ZXIgdGV4dC1ncmVlbi00MDAgdGV4dC1zbVwiPlxyXG4gICAgICAgICAgICA8VHJlbmRpbmdVcCBjbGFzc05hbWU9XCJ3LTQgaC00IG1yLTFcIiAvPlxyXG4gICAgICAgICAgICA8c3Bhbj4rMjMlIGZyb20gbGFzdCBob3VyPC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG5cclxuICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XHJcbiAgICAgICAgICB0cmFuc2l0aW9uPXt7IGRlbGF5OiAwLjIgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWJyIGZyb20tZ3JlZW4tNTAwLzIwIHRvLWdyZWVuLTYwMC8yMCBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItZ3JlZW4tNTAwLzMwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItNFwiPlxyXG4gICAgICAgICAgICA8QWN0aXZpdHkgY2xhc3NOYW1lPVwidy04IGgtOCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWdyZWVuLTMwMCBiZy1ncmVlbi01MDAvMjAgcHgtMiBweS0xIHJvdW5kZWRcIj5MSVZFPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0zeGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItMVwiPlxyXG4gICAgICAgICAgICB7c3RhdHMuYWN0aXZlT3JkZXJzfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtZ3JlZW4tMzAwIHRleHQtc21cIj5BY3RpdmUgT3JkZXJzPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTMgdGV4dC14cyB0ZXh0LWdyYXktNDAwXCI+XHJcbiAgICAgICAgICAgIFByb2Nlc3NpbmcgaW4gcmVhbC10aW1lXHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcblxyXG4gICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMyB9fVxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1wdXJwbGUtNTAwLzIwIHRvLXB1cnBsZS02MDAvMjAgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLXB1cnBsZS01MDAvMzAgcm91bmRlZC0yeGwgcC02XCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi00XCI+XHJcbiAgICAgICAgICAgIDxEb2xsYXJTaWduIGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1wdXJwbGUtNDAwXCIgLz5cclxuICAgICAgICAgICAgPENoZWNrQ2lyY2xlIGNsYXNzTmFtZT1cInctNiBoLTYgdGV4dC1wdXJwbGUtNDAwXCIgLz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi0xXCI+XHJcbiAgICAgICAgICAgICR7KHN0YXRzLnJldmVudWUgLyAxMDAwKS50b0ZpeGVkKDEpfUtcclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXB1cnBsZS0zMDAgdGV4dC1zbVwiPlJldmVudWUgR2VuZXJhdGVkPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTMgZmxleCBpdGVtcy1jZW50ZXIgdGV4dC1wdXJwbGUtNDAwIHRleHQtc21cIj5cclxuICAgICAgICAgICAgPFphcCBjbGFzc05hbWU9XCJ3LTQgaC00IG1yLTFcIiAvPlxyXG4gICAgICAgICAgICA8c3Bhbj5SZWFsLXRpbWUgdHJhY2tpbmc8L3NwYW4+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcblxyXG4gICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IDAuNCB9fVxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYnIgZnJvbS15ZWxsb3ctNTAwLzIwIHRvLXllbGxvdy02MDAvMjAgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLXllbGxvdy01MDAvMzAgcm91bmRlZC0yeGwgcC02XCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi00XCI+XHJcbiAgICAgICAgICAgIDxBY3Rpdml0eSBjbGFzc05hbWU9XCJ3LTggaC04IHRleHQteWVsbG93LTQwMFwiIC8+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXllbGxvdy0zMDBcIj5FVkVOVFM8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi0xXCI+XHJcbiAgICAgICAgICAgIHsoc3RhdHMuZXZlbnRzUHJvY2Vzc2VkIC8gMTAwMCkudG9GaXhlZCgxKX1LXHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC15ZWxsb3ctMzAwIHRleHQtc21cIj5FdmVudHMgUHJvY2Vzc2VkPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTMgdGV4dC14cyB0ZXh0LWdyYXktNDAwXCI+XHJcbiAgICAgICAgICAgIEF2ZzogODUwIGV2ZW50cy9zZWNcclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICB7LyogUmVhbC10aW1lIENoYXJ0cyAqL31cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC02XCI+XHJcbiAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeDogLTIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHg6IDAgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNCBmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICA8QWN0aXZpdHkgY2xhc3NOYW1lPVwidy01IGgtNSBtci0yIHRleHQtYmx1ZS00MDBcIiAvPlxyXG4gICAgICAgICAgICBSZWFsLVRpbWUgVGhyb3VnaHB1dFxyXG4gICAgICAgICAgPC9oMz5cclxuICAgICAgICAgIDxSZXNwb25zaXZlQ29udGFpbmVyIHdpZHRoPVwiMTAwJVwiIGhlaWdodD17MjUwfT5cclxuICAgICAgICAgICAgPEFyZWFDaGFydCBkYXRhPXtyZWFsdGltZURhdGF9PlxyXG4gICAgICAgICAgICAgIDxkZWZzPlxyXG4gICAgICAgICAgICAgICAgPGxpbmVhckdyYWRpZW50IGlkPVwiY29sb3JPcmRlcnNcIiB4MT1cIjBcIiB5MT1cIjBcIiB4Mj1cIjBcIiB5Mj1cIjFcIj5cclxuICAgICAgICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PVwiNSVcIiBzdG9wQ29sb3I9XCIjOGI1Y2Y2XCIgc3RvcE9wYWNpdHk9ezAuOH0vPlxyXG4gICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCI5NSVcIiBzdG9wQ29sb3I9XCIjOGI1Y2Y2XCIgc3RvcE9wYWNpdHk9ezB9Lz5cclxuICAgICAgICAgICAgICAgIDwvbGluZWFyR3JhZGllbnQ+XHJcbiAgICAgICAgICAgICAgICA8bGluZWFyR3JhZGllbnQgaWQ9XCJjb2xvckV2ZW50c1wiIHgxPVwiMFwiIHkxPVwiMFwiIHgyPVwiMFwiIHkyPVwiMVwiPlxyXG4gICAgICAgICAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCI1JVwiIHN0b3BDb2xvcj1cIiMxMGI5ODFcIiBzdG9wT3BhY2l0eT17MC44fS8+XHJcbiAgICAgICAgICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjk1JVwiIHN0b3BDb2xvcj1cIiMxMGI5ODFcIiBzdG9wT3BhY2l0eT17MH0vPlxyXG4gICAgICAgICAgICAgICAgPC9saW5lYXJHcmFkaWVudD5cclxuICAgICAgICAgICAgICA8L2RlZnM+XHJcbiAgICAgICAgICAgICAgPENhcnRlc2lhbkdyaWQgc3Ryb2tlRGFzaGFycmF5PVwiMyAzXCIgc3Ryb2tlPVwiI2ZmZmZmZjIwXCIgLz5cclxuICAgICAgICAgICAgICA8WEF4aXMgZGF0YUtleT1cInRpbWVcIiBzdHJva2U9XCIjZmZmZmZmNjBcIiAvPlxyXG4gICAgICAgICAgICAgIDxZQXhpcyBzdHJva2U9XCIjZmZmZmZmNjBcIiAvPlxyXG4gICAgICAgICAgICAgIDxUb29sdGlwIFxyXG4gICAgICAgICAgICAgICAgY29udGVudFN0eWxlPXt7IFxyXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMWUyOTNiJywgXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjZmZmZmZmMjAnLFxyXG4gICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc4cHgnXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgPEFyZWEgdHlwZT1cIm1vbm90b25lXCIgZGF0YUtleT1cIm9yZGVyc1wiIHN0cm9rZT1cIiM4YjVjZjZcIiBmaWxsT3BhY2l0eT17MX0gZmlsbD1cInVybCgjY29sb3JPcmRlcnMpXCIgLz5cclxuICAgICAgICAgICAgICA8QXJlYSB0eXBlPVwibW9ub3RvbmVcIiBkYXRhS2V5PVwiZXZlbnRzXCIgc3Ryb2tlPVwiIzEwYjk4MVwiIGZpbGxPcGFjaXR5PXsxfSBmaWxsPVwidXJsKCNjb2xvckV2ZW50cylcIiAvPlxyXG4gICAgICAgICAgICA8L0FyZWFDaGFydD5cclxuICAgICAgICAgIDwvUmVzcG9uc2l2ZUNvbnRhaW5lcj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcblxyXG4gICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHg6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHg6IDAgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNCBmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICA8Q2xvY2sgY2xhc3NOYW1lPVwidy01IGgtNSBtci0yIHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgUGVyZm9ybWFuY2UgTWV0cmljcyAocDk5IExhdGVuY3kpXHJcbiAgICAgICAgICA8L2gzPlxyXG4gICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXsyNTB9PlxyXG4gICAgICAgICAgICA8QmFyQ2hhcnQgZGF0YT17cGVyZm9ybWFuY2VEYXRhfT5cclxuICAgICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiBzdHJva2U9XCIjZmZmZmZmMjBcIiAvPlxyXG4gICAgICAgICAgICAgIDxYQXhpcyBkYXRhS2V5PVwibmFtZVwiIHN0cm9rZT1cIiNmZmZmZmY2MFwiIC8+XHJcbiAgICAgICAgICAgICAgPFlBeGlzIHN0cm9rZT1cIiNmZmZmZmY2MFwiIC8+XHJcbiAgICAgICAgICAgICAgPFRvb2x0aXAgXHJcbiAgICAgICAgICAgICAgICBjb250ZW50U3R5bGU9e3sgXHJcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMxZTI5M2InLCBcclxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNmZmZmZmYyMCcsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzhweCdcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8QmFyIGRhdGFLZXk9XCJsYXRlbmN5XCIgZmlsbD1cIiMxMGI5ODFcIiByYWRpdXM9e1s4LCA4LCAwLCAwXX0gLz5cclxuICAgICAgICAgICAgICA8QmFyIGRhdGFLZXk9XCJ0YXJnZXRcIiBmaWxsPVwiI2ZmZmZmZjIwXCIgcmFkaXVzPXtbOCwgOCwgMCwgMF19IC8+XHJcbiAgICAgICAgICAgIDwvQmFyQ2hhcnQ+XHJcbiAgICAgICAgICA8L1Jlc3BvbnNpdmVDb250YWluZXI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTIgdGV4dC14cyB0ZXh0LWdyYXktNDAwIHRleHQtY2VudGVyXCI+XHJcbiAgICAgICAgICAgIEFsbCBtZXRyaWNzIHdlbGwgYmVsb3cgdGFyZ2V0IHRocmVzaG9sZHMg4pyTXHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgey8qIEV2ZW50IEZsb3cgJiBSZWNlbnQgT3JkZXJzICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTZcIj5cclxuICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJiZy13aGl0ZS81IGJhY2tkcm9wLWJsdXIteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTZcIlxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1iLTQgZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgPFphcCBjbGFzc05hbWU9XCJ3LTUgaC01IG1yLTIgdGV4dC15ZWxsb3ctNDAwXCIgLz5cclxuICAgICAgICAgICAgTGl2ZSBFdmVudCBGbG93XHJcbiAgICAgICAgICA8L2gzPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cclxuICAgICAgICAgICAge2V2ZW50Rmxvdy5tYXAoKGV2ZW50LCBpbmRleCkgPT4gKFxyXG4gICAgICAgICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICAgICAgICBrZXk9e2V2ZW50LmlkfVxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB4OiAtMjAgfX1cclxuICAgICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeDogMCB9fVxyXG4gICAgICAgICAgICAgICAgZXhpdD17eyBvcGFjaXR5OiAwLCB4OiAyMCB9fVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zIHAtMyBiZy13aGl0ZS81IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTIgaC0yICR7ZXZlbnQuY29sb3J9IHJvdW5kZWQtZnVsbCBhbmltYXRlLXB1bHNlYH0gLz5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC13aGl0ZSBmb250LW1lZGl1bSB0ZXh0LXNtXCI+e2V2ZW50LnR5cGV9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1ncmF5LTQwMCB0ZXh0LXhzXCI+e2V2ZW50LnBhdGh9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWdyYXktNTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgIHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MCkgKyAxMH1tc1xyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuXHJcbiAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX1cclxuICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC02XCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi00IGZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgIDxTaG9wcGluZ0NhcnQgY2xhc3NOYW1lPVwidy01IGgtNSBtci0yIHRleHQtcHVycGxlLTQwMFwiIC8+XHJcbiAgICAgICAgICAgIFJlY2VudCBPcmRlcnNcclxuICAgICAgICAgIDwvaDM+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxyXG4gICAgICAgICAgICB7b3JkZXJzLnNsaWNlKDAsIDYpLm1hcCgob3JkZXIpID0+IChcclxuICAgICAgICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgICAgICAga2V5PXtvcmRlci5pZH1cclxuICAgICAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgc2NhbGU6IDAuOSB9fVxyXG4gICAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCBzY2FsZTogMSB9fVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMyBiZy13aGl0ZS81IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTNcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTIgaC0yIHJvdW5kZWQtZnVsbCAke1xyXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyLnN0YXR1cyA9PT0gJ0NPTVBMRVRFRCcgPyAnYmctZ3JlZW4tNDAwJyA6ICdiZy1ibHVlLTQwMCBhbmltYXRlLXB1bHNlJ1xyXG4gICAgICAgICAgICAgICAgICB9YH0gLz5cclxuICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1tZWRpdW0gdGV4dC1zbVwiPntvcmRlci5pZH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDAgdGV4dC14c1wiPntvcmRlci5jdXN0b21lcn08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1yaWdodFwiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1ib2xkIHRleHQtc21cIj4ke29yZGVyLmFtb3VudH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B0ZXh0LXhzICR7XHJcbiAgICAgICAgICAgICAgICAgICAgb3JkZXIuc3RhdHVzID09PSAnQ09NUExFVEVEJyA/ICd0ZXh0LWdyZWVuLTQwMCcgOiAndGV4dC1ibHVlLTQwMCdcclxuICAgICAgICAgICAgICAgICAgfWB9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtvcmRlci5zdGF0dXN9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICB7LyogRXZlbnQgRGlzdHJpYnV0aW9uICovfVxyXG4gICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX1cclxuICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICBjbGFzc05hbWU9XCJiZy13aGl0ZS81IGJhY2tkcm9wLWJsdXIteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTZcIlxyXG4gICAgICA+XHJcbiAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNFwiPkV2ZW50IFR5cGUgRGlzdHJpYnV0aW9uPC9oMz5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTZcIj5cclxuICAgICAgICAgIDxSZXNwb25zaXZlQ29udGFpbmVyIHdpZHRoPVwiMTAwJVwiIGhlaWdodD17MjAwfT5cclxuICAgICAgICAgICAgPFBpZUNoYXJ0PlxyXG4gICAgICAgICAgICAgIDxQaWVcclxuICAgICAgICAgICAgICAgIGRhdGE9e2V2ZW50RGlzdHJpYnV0aW9ufVxyXG4gICAgICAgICAgICAgICAgY3g9XCI1MCVcIlxyXG4gICAgICAgICAgICAgICAgY3k9XCI1MCVcIlxyXG4gICAgICAgICAgICAgICAgaW5uZXJSYWRpdXM9ezYwfVxyXG4gICAgICAgICAgICAgICAgb3V0ZXJSYWRpdXM9ezgwfVxyXG4gICAgICAgICAgICAgICAgcGFkZGluZ0FuZ2xlPXs1fVxyXG4gICAgICAgICAgICAgICAgZGF0YUtleT1cInZhbHVlXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICB7ZXZlbnREaXN0cmlidXRpb24ubWFwKChlbnRyeSwgaW5kZXgpID0+IChcclxuICAgICAgICAgICAgICAgICAgPENlbGwga2V5PXtgY2VsbC0ke2luZGV4fWB9IGZpbGw9e2VudHJ5LmNvbG9yfSAvPlxyXG4gICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgPC9QaWU+XHJcbiAgICAgICAgICAgICAgPFRvb2x0aXAgLz5cclxuICAgICAgICAgICAgPC9QaWVDaGFydD5cclxuICAgICAgICAgIDwvUmVzcG9uc2l2ZUNvbnRhaW5lcj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBzcGFjZS15LTNcIj5cclxuICAgICAgICAgICAge2V2ZW50RGlzdHJpYnV0aW9uLm1hcCgoaXRlbSkgPT4gKFxyXG4gICAgICAgICAgICAgIDxkaXYga2V5PXtpdGVtLm5hbWV9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTMgaC0zIHJvdW5kZWRcIiBzdHlsZT17eyBiYWNrZ3JvdW5kQ29sb3I6IGl0ZW0uY29sb3IgfX0gLz5cclxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC13aGl0ZSB0ZXh0LXNtXCI+e2l0ZW0ubmFtZX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDAgdGV4dC1zbVwiPntpdGVtLnZhbHVlfTwvc3Bhbj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IERhc2hib2FyZDtcclxuIl19