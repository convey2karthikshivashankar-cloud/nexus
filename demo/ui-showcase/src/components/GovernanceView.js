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
const GovernanceView = () => {
    const [selectedPolicy, setSelectedPolicy] = (0, react_1.useState)(null);
    const [violations, setViolations] = (0, react_1.useState)([]);
    const [complianceScore, setComplianceScore] = (0, react_1.useState)(98.5);
    const [auditEvents, setAuditEvents] = (0, react_1.useState)([]);
    const policies = {
        'schema-validation': {
            name: 'Schema Validation',
            description: 'All events must conform to registered schemas',
            status: 'active',
            violations: 2,
            icon: lucide_react_1.FileText,
            color: 'from-blue-500 to-cyan-500',
            rules: [
                'Events must have registered schemas',
                'Backward compatibility required',
                'Schema evolution must be approved',
                'No breaking changes in production'
            ],
            enforcement: 'Pre-persistence validation',
            lastUpdated: '2024-01-15'
        },
        'database-operations': {
            name: 'Database Operations',
            description: 'EventStore operations must be append-only',
            status: 'active',
            violations: 0,
            icon: lucide_react_1.Lock,
            color: 'from-green-500 to-emerald-500',
            rules: [
                'Only INSERT operations allowed',
                'No UPDATE or DELETE operations',
                'Atomic batch writes required',
                'Immutable event log maintained'
            ],
            enforcement: 'Runtime policy checks',
            lastUpdated: '2024-01-15'
        },
        'service-communication': {
            name: 'Service Communication',
            description: 'Direct service calls are prohibited',
            status: 'active',
            violations: 1,
            icon: lucide_react_1.GitBranch,
            color: 'from-purple-500 to-pink-500',
            rules: [
                'Use Event Bus for communication',
                'No direct HTTP calls between services',
                'Async messaging preferred',
                'Circuit breaker patterns required'
            ],
            enforcement: 'API Gateway + Runtime checks',
            lastUpdated: '2024-01-15'
        },
        'audit-compliance': {
            name: 'Audit & Compliance',
            description: 'Complete audit trail for all operations',
            status: 'active',
            violations: 0,
            icon: lucide_react_1.Eye,
            color: 'from-yellow-500 to-orange-500',
            rules: [
                'All events must have correlation IDs',
                'User context required',
                'Causation chain maintained',
                'Retention policies enforced'
            ],
            enforcement: 'Framework-level enforcement',
            lastUpdated: '2024-01-15'
        }
    };
    const complianceData = [
        { name: 'Schema Compliance', value: 98.2, color: '#3b82f6' },
        { name: 'Database Policy', value: 100, color: '#10b981' },
        { name: 'Service Communication', value: 97.8, color: '#8b5cf6' },
        { name: 'Audit Trail', value: 100, color: '#f59e0b' }
    ];
    const violationTrends = [
        { time: '00:00', violations: 5, resolved: 4 },
        { time: '04:00', violations: 3, resolved: 3 },
        { time: '08:00', violations: 8, resolved: 6 },
        { time: '12:00', violations: 2, resolved: 2 },
        { time: '16:00', violations: 4, resolved: 4 },
        { time: '20:00', violations: 1, resolved: 1 }
    ];
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.9) {
                const violationTypes = [
                    { type: 'Schema Validation', severity: 'medium', message: 'Event schema version mismatch detected' },
                    { type: 'Service Communication', severity: 'low', message: 'Direct HTTP call attempt blocked' },
                    { type: 'Database Operations', severity: 'high', message: 'UPDATE operation attempt on EventStore' }
                ];
                const violation = violationTypes[Math.floor(Math.random() * violationTypes.length)];
                setViolations(prev => [{
                        id: Date.now(),
                        ...violation,
                        timestamp: new Date().toISOString(),
                        status: 'active'
                    }, ...prev.slice(0, 9)]);
            }
            const auditTypes = [
                'Schema registered',
                'Policy updated',
                'Violation resolved',
                'Compliance check passed',
                'Audit log archived'
            ];
            const auditEvent = {
                id: Date.now(),
                type: auditTypes[Math.floor(Math.random() * auditTypes.length)],
                user: `user-${Math.floor(Math.random() * 100)}`,
                timestamp: new Date().toISOString(),
                correlationId: `corr-${Date.now()}`
            };
            setAuditEvents(prev => [auditEvent, ...prev.slice(0, 9)]);
            setComplianceScore(prev => {
                const change = (Math.random() - 0.5) * 0.2;
                return Math.max(95, Math.min(100, prev + change));
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
            case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
        }
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Governance Dashboard</h2>
          <p className="text-gray-400">Real-time policy enforcement and compliance monitoring</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span className="text-green-300 text-sm font-medium">All Policies Active</span>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{complianceScore.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Compliance Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {Object.entries(policies).map(([key, policy], index) => {
            const isSelected = selectedPolicy === key;
            return (<framer_motion_1.motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`cursor-pointer rounded-2xl border backdrop-blur-xl p-6 transition-all ${isSelected
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'}`} onClick={() => setSelectedPolicy(isSelected ? null : key)}>
              <div className={`absolute inset-0 bg-gradient-to-br ${policy.color} opacity-10 rounded-2xl`}/>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      {react_1.default.createElement(policy.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{policy.name}</h3>
                      <p className="text-sm text-gray-400">{policy.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {policy.violations > 0 ? (<div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded border border-red-500/30">
                        <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-400"/>
                        <span className="text-red-400 text-sm font-medium">{policy.violations}</span>
                      </div>) : (<div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded border border-green-500/30">
                        <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
                        <span className="text-green-400 text-sm font-medium">✓</span>
                      </div>)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Enforcement:</span>
                    <span className="text-white">{policy.enforcement}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white">{policy.lastUpdated}</span>
                  </div>
                </div>
              </div>
            </framer_motion_1.motion.div>);
        })}
      </div>

      <framer_motion_1.AnimatePresence>
        {selectedPolicy && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Policy Rules</h3>
                <div className="space-y-3">
                  {policies[selectedPolicy].rules.map((rule, index) => (<framer_motion_1.motion.div key={rule} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                      <lucide_react_1.CheckCircle className="w-5 h-5 text-green-400"/>
                      <span className="text-white">{rule}</span>
                    </framer_motion_1.motion.div>))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Enforcement Details</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                    <div className="text-sm text-gray-300 mb-1">Enforcement Method</div>
                    <div className="text-white font-medium">{policies[selectedPolicy].enforcement}</div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <div className="text-sm text-gray-300 mb-1">Current Status</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"/>
                      <span className="text-green-400 font-medium">Active & Enforced</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                    <div className="text-sm text-gray-300 mb-1">Violations (24h)</div>
                    <div className="text-2xl font-bold text-yellow-400">{policies[selectedPolicy].violations}</div>
                  </div>
                </div>
              </div>
            </div>
          </framer_motion_1.motion.div>)}
      </framer_motion_1.AnimatePresence>

      <div className="grid grid-cols-2 gap-6">
        <framer_motion_1.motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Shield className="w-5 h-5 mr-2 text-green-400"/>
            Compliance Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <recharts_1.ResponsiveContainer width="100%" height={200}>
              <recharts_1.PieChart>
                <recharts_1.Pie data={complianceData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                  {complianceData.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={entry.color}/>))}
                </recharts_1.Pie>
                <recharts_1.Tooltip />
              </recharts_1.PieChart>
            </recharts_1.ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-3">
              {complianceData.map((item) => (<div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}/>
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value}%</span>
                </div>))}
            </div>
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Activity className="w-5 h-5 mr-2 text-blue-400"/>
            Violation Trends (24h)
          </h3>
          <recharts_1.ResponsiveContainer width="100%" height={200}>
            <recharts_1.LineChart data={violationTrends}>
              <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="#ffffff20"/>
              <recharts_1.XAxis dataKey="time" stroke="#ffffff60"/>
              <recharts_1.YAxis stroke="#ffffff60"/>
              <recharts_1.Tooltip contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #ffffff20',
            borderRadius: '8px'
        }}/>
              <recharts_1.Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2}/>
              <recharts_1.Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2}/>
            </recharts_1.LineChart>
          </recharts_1.ResponsiveContainer>
        </framer_motion_1.motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.AlertTriangle className="w-5 h-5 mr-2 text-yellow-400"/>
            Recent Violations
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {violations.length === 0 ? (<div className="text-center py-8 text-gray-400">
                <lucide_react_1.CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400"/>
                <p>No violations detected</p>
              </div>) : (violations.map((violation) => (<framer_motion_1.motion.div key={violation.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`p-3 rounded-lg border ${getSeverityColor(violation.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{violation.type}</span>
                    <span className="text-xs uppercase">{violation.severity}</span>
                  </div>
                  <p className="text-sm opacity-80">{violation.message}</p>
                  <div className="text-xs opacity-60 mt-2">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </div>
                </framer_motion_1.motion.div>)))}
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Eye className="w-5 h-5 mr-2 text-purple-400"/>
            Audit Trail
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {auditEvents.map((event) => (<framer_motion_1.motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{event.type}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  User: {event.user}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {event.correlationId}
                </div>
              </framer_motion_1.motion.div>))}
          </div>
        </framer_motion_1.motion.div>
      </div>

      <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <lucide_react_1.TrendingUp className="w-6 h-6 mr-2 text-purple-400"/>
          Governance Benefits
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-white font-medium mb-1">Policy Coverage</div>
            <div className="text-sm text-gray-400">All operations governed</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">&lt;10ms</div>
            <div className="text-white font-medium mb-1">Policy Check</div>
            <div className="text-sm text-gray-400">Minimal overhead</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">Zero</div>
            <div className="text-white font-medium mb-1">Breaking Changes</div>
            <div className="text-sm text-gray-400">In production</div>
          </div>
        </div>
      </framer_motion_1.motion.div>
    </div>);
};
exports.default = GovernanceView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR292ZXJuYW5jZVZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJHb3Zlcm5hbmNlVmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBbUQ7QUFDbkQsaURBQXdEO0FBQ3hELCtDQUlzQjtBQUN0Qix1Q0FBMkg7QUFFM0gsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO0lBQzFCLE1BQU0sQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQWdCLElBQUksQ0FBQyxDQUFDO0lBQzFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0QsTUFBTSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQVEsRUFBRSxDQUFDLENBQUM7SUFFMUQsTUFBTSxRQUFRLEdBQXdCO1FBQ3BDLG1CQUFtQixFQUFFO1lBQ25CLElBQUksRUFBRSxtQkFBbUI7WUFDekIsV0FBVyxFQUFFLCtDQUErQztZQUM1RCxNQUFNLEVBQUUsUUFBUTtZQUNoQixVQUFVLEVBQUUsQ0FBQztZQUNiLElBQUksRUFBRSx1QkFBUTtZQUNkLEtBQUssRUFBRSwyQkFBMkI7WUFDbEMsS0FBSyxFQUFFO2dCQUNMLHFDQUFxQztnQkFDckMsaUNBQWlDO2dCQUNqQyxtQ0FBbUM7Z0JBQ25DLG1DQUFtQzthQUNwQztZQUNELFdBQVcsRUFBRSw0QkFBNEI7WUFDekMsV0FBVyxFQUFFLFlBQVk7U0FDMUI7UUFDRCxxQkFBcUIsRUFBRTtZQUNyQixJQUFJLEVBQUUscUJBQXFCO1lBQzNCLFdBQVcsRUFBRSwyQ0FBMkM7WUFDeEQsTUFBTSxFQUFFLFFB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QUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FDbEU7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNkJBQTZCLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FDakU7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxDQUNyRTtVQUFBLEVBQUUsR0FBRyxDQUVMOztVQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQzFCO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLHdDQUF3QyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQ3JFO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDZCQUE2QixDQUFDLFlBQVksRUFBRSxHQUFHLENBQzlEO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FDOUQ7VUFBQSxFQUFFLEdBQUcsQ0FFTDs7VUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUMxQjtZQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUNoRTtZQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQ2xFO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxHQUFHLENBQzNEO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FDUDtNQUFBLEVBQUUsc0JBQU0sQ0FBQyxHQUFHLENBQ2Q7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixrQkFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgbW90aW9uLCBBbmltYXRlUHJlc2VuY2UgfSBmcm9tICdmcmFtZXItbW90aW9uJztcclxuaW1wb3J0IHsgXHJcbiAgU2hpZWxkLCBBbGVydFRyaWFuZ2xlLCBDaGVja0NpcmNsZSwgWENpcmNsZSxcclxuICBGaWxlVGV4dCwgR2l0QnJhbmNoLCBMb2NrLCBFeWUsXHJcbiAgQWN0aXZpdHksIENsb2NrLCBUcmVuZGluZ1VwLCBVc2Vyc1xyXG59IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XHJcbmltcG9ydCB7IFBpZUNoYXJ0LCBQaWUsIENlbGwsIExpbmVDaGFydCwgTGluZSwgWEF4aXMsIFlBeGlzLCBDYXJ0ZXNpYW5HcmlkLCBUb29sdGlwLCBSZXNwb25zaXZlQ29udGFpbmVyIH0gZnJvbSAncmVjaGFydHMnO1xyXG5cclxuY29uc3QgR292ZXJuYW5jZVZpZXcgPSAoKSA9PiB7XHJcbiAgY29uc3QgW3NlbGVjdGVkUG9saWN5LCBzZXRTZWxlY3RlZFBvbGljeV0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuICBjb25zdCBbdmlvbGF0aW9ucywgc2V0VmlvbGF0aW9uc10gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xyXG4gIGNvbnN0IFtjb21wbGlhbmNlU2NvcmUsIHNldENvbXBsaWFuY2VTY29yZV0gPSB1c2VTdGF0ZSg5OC41KTtcclxuICBjb25zdCBbYXVkaXRFdmVudHMsIHNldEF1ZGl0RXZlbnRzXSA9IHVzZVN0YXRlPGFueVtdPihbXSk7XHJcblxyXG4gIGNvbnN0IHBvbGljaWVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge1xyXG4gICAgJ3NjaGVtYS12YWxpZGF0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnU2NoZW1hIFZhbGlkYXRpb24nLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FsbCBldmVudHMgbXVzdCBjb25mb3JtIHRvIHJlZ2lzdGVyZWQgc2NoZW1hcycsXHJcbiAgICAgIHN0YXR1czogJ2FjdGl2ZScsXHJcbiAgICAgIHZpb2xhdGlvbnM6IDIsXHJcbiAgICAgIGljb246IEZpbGVUZXh0LFxyXG4gICAgICBjb2xvcjogJ2Zyb20tYmx1ZS01MDAgdG8tY3lhbi01MDAnLFxyXG4gICAgICBydWxlczogW1xyXG4gICAgICAgICdFdmVudHMgbXVzdCBoYXZlIHJlZ2lzdGVyZWQgc2NoZW1hcycsXHJcbiAgICAgICAgJ0JhY2t3YXJkIGNvbXBhdGliaWxpdHkgcmVxdWlyZWQnLFxyXG4gICAgICAgICdTY2hlbWEgZXZvbHV0aW9uIG11c3QgYmUgYXBwcm92ZWQnLFxyXG4gICAgICAgICdObyBicmVha2luZyBjaGFuZ2VzIGluIHByb2R1Y3Rpb24nXHJcbiAgICAgIF0sXHJcbiAgICAgIGVuZm9yY2VtZW50OiAnUHJlLXBlcnNpc3RlbmNlIHZhbGlkYXRpb24nLFxyXG4gICAgICBsYXN0VXBkYXRlZDogJzIwMjQtMDEtMTUnXHJcbiAgICB9LFxyXG4gICAgJ2RhdGFiYXNlLW9wZXJhdGlvbnMnOiB7XHJcbiAgICAgIG5hbWU6ICdEYXRhYmFzZSBPcGVyYXRpb25zJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdFdmVudFN0b3JlIG9wZXJhdGlvbnMgbXVzdCBiZSBhcHBlbmQtb25seScsXHJcbiAgICAgIHN0YXR1czogJ2FjdGl2ZScsXHJcbiAgICAgIHZpb2xhdGlvbnM6IDAsXHJcbiAgICAgIGljb246IExvY2ssXHJcbiAgICAgIGNvbG9yOiAnZnJvbS1ncmVlbi01MDAgdG8tZW1lcmFsZC01MDAnLFxyXG4gICAgICBydWxlczogW1xyXG4gICAgICAgICdPbmx5IElOU0VSVCBvcGVyYXRpb25zIGFsbG93ZWQnLFxyXG4gICAgICAgICdObyBVUERBVEUgb3IgREVMRVRFIG9wZXJhdGlvbnMnLFxyXG4gICAgICAgICdBdG9taWMgYmF0Y2ggd3JpdGVzIHJlcXVpcmVkJyxcclxuICAgICAgICAnSW1tdXRhYmxlIGV2ZW50IGxvZyBtYWludGFpbmVkJ1xyXG4gICAgICBdLFxyXG4gICAgICBlbmZvcmNlbWVudDogJ1J1bnRpbWUgcG9saWN5IGNoZWNrcycsXHJcbiAgICAgIGxhc3RVcGRhdGVkOiAnMjAyNC0wMS0xNSdcclxuICAgIH0sXHJcbiAgICAnc2VydmljZS1jb21tdW5pY2F0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnU2VydmljZSBDb21tdW5pY2F0aW9uJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3Qgc2VydmljZSBjYWxscyBhcmUgcHJvaGliaXRlZCcsXHJcbiAgICAgIHN0YXR1czogJ2FjdGl2ZScsXHJcbiAgICAgIHZpb2xhdGlvbnM6IDEsXHJcbiAgICAgIGljb246IEdpdEJyYW5jaCxcclxuICAgICAgY29sb3I6ICdmcm9tLXB1cnBsZS01MDAgdG8tcGluay01MDAnLFxyXG4gICAgICBydWxlczogW1xyXG4gICAgICAgICdVc2UgRXZlbnQgQnVzIGZvciBjb21tdW5pY2F0aW9uJyxcclxuICAgICAgICAnTm8gZGlyZWN0IEhUVFAgY2FsbHMgYmV0d2VlbiBzZXJ2aWNlcycsXHJcbiAgICAgICAgJ0FzeW5jIG1lc3NhZ2luZyBwcmVmZXJyZWQnLFxyXG4gICAgICAgICdDaXJjdWl0IGJyZWFrZXIgcGF0dGVybnMgcmVxdWlyZWQnXHJcbiAgICAgIF0sXHJcbiAgICAgIGVuZm9yY2VtZW50OiAnQVBJIEdhdGV3YXkgKyBSdW50aW1lIGNoZWNrcycsXHJcbiAgICAgIGxhc3RVcGRhdGVkOiAnMjAyNC0wMS0xNSdcclxuICAgIH0sXHJcbiAgICAnYXVkaXQtY29tcGxpYW5jZSc6IHtcclxuICAgICAgbmFtZTogJ0F1ZGl0ICYgQ29tcGxpYW5jZScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcGxldGUgYXVkaXQgdHJhaWwgZm9yIGFsbCBvcGVyYXRpb25zJyxcclxuICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcclxuICAgICAgdmlvbGF0aW9uczogMCxcclxuICAgICAgaWNvbjogRXllLFxyXG4gICAgICBjb2xvcjogJ2Zyb20teWVsbG93LTUwMCB0by1vcmFuZ2UtNTAwJyxcclxuICAgICAgcnVsZXM6IFtcclxuICAgICAgICAnQWxsIGV2ZW50cyBtdXN0IGhhdmUgY29ycmVsYXRpb24gSURzJyxcclxuICAgICAgICAnVXNlciBjb250ZXh0IHJlcXVpcmVkJyxcclxuICAgICAgICAnQ2F1c2F0aW9uIGNoYWluIG1haW50YWluZWQnLFxyXG4gICAgICAgICdSZXRlbnRpb24gcG9saWNpZXMgZW5mb3JjZWQnXHJcbiAgICAgIF0sXHJcbiAgICAgIGVuZm9yY2VtZW50OiAnRnJhbWV3b3JrLWxldmVsIGVuZm9yY2VtZW50JyxcclxuICAgICAgbGFzdFVwZGF0ZWQ6ICcyMDI0LTAxLTE1J1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbXBsaWFuY2VEYXRhID0gW1xyXG4gICAgeyBuYW1lOiAnU2NoZW1hIENvbXBsaWFuY2UnLCB2YWx1ZTogOTguMiwgY29sb3I6ICcjM2I4MmY2JyB9LFxyXG4gICAgeyBuYW1lOiAnRGF0YWJhc2UgUG9saWN5JywgdmFsdWU6IDEwMCwgY29sb3I6ICcjMTBiOTgxJyB9LFxyXG4gICAgeyBuYW1lOiAnU2VydmljZSBDb21tdW5pY2F0aW9uJywgdmFsdWU6IDk3LjgsIGNvbG9yOiAnIzhiNWNmNicgfSxcclxuICAgIHsgbmFtZTogJ0F1ZGl0IFRyYWlsJywgdmFsdWU6IDEwMCwgY29sb3I6ICcjZjU5ZTBiJyB9XHJcbiAgXTtcclxuXHJcbiAgY29uc3QgdmlvbGF0aW9uVHJlbmRzID0gW1xyXG4gICAgeyB0aW1lOiAnMDA6MDAnLCB2aW9sYXRpb25zOiA1LCByZXNvbHZlZDogNCB9LFxyXG4gICAgeyB0aW1lOiAnMDQ6MDAnLCB2aW9sYXRpb25zOiAzLCByZXNvbHZlZDogMyB9LFxyXG4gICAgeyB0aW1lOiAnMDg6MDAnLCB2aW9sYXRpb25zOiA4LCByZXNvbHZlZDogNiB9LFxyXG4gICAgeyB0aW1lOiAnMTI6MDAnLCB2aW9sYXRpb25zOiAyLCByZXNvbHZlZDogMiB9LFxyXG4gICAgeyB0aW1lOiAnMTY6MDAnLCB2aW9sYXRpb25zOiA0LCByZXNvbHZlZDogNCB9LFxyXG4gICAgeyB0aW1lOiAnMjA6MDAnLCB2aW9sYXRpb25zOiAxLCByZXNvbHZlZDogMSB9XHJcbiAgXTtcclxuXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBpZiAoTWF0aC5yYW5kb20oKSA+IDAuOSkge1xyXG4gICAgICAgIGNvbnN0IHZpb2xhdGlvblR5cGVzID0gW1xyXG4gICAgICAgICAgeyB0eXBlOiAnU2NoZW1hIFZhbGlkYXRpb24nLCBzZXZlcml0eTogJ21lZGl1bScsIG1lc3NhZ2U6ICdFdmVudCBzY2hlbWEgdmVyc2lvbiBtaXNtYXRjaCBkZXRlY3RlZCcgfSxcclxuICAgICAgICAgIHsgdHlwZTogJ1NlcnZpY2UgQ29tbXVuaWNhdGlvbicsIHNldmVyaXR5OiAnbG93JywgbWVzc2FnZTogJ0RpcmVjdCBIVFRQIGNhbGwgYXR0ZW1wdCBibG9ja2VkJyB9LFxyXG4gICAgICAgICAgeyB0eXBlOiAnRGF0YWJhc2UgT3BlcmF0aW9ucycsIHNldmVyaXR5OiAnaGlnaCcsIG1lc3NhZ2U6ICdVUERBVEUgb3BlcmF0aW9uIGF0dGVtcHQgb24gRXZlbnRTdG9yZScgfVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgdmlvbGF0aW9uID0gdmlvbGF0aW9uVHlwZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdmlvbGF0aW9uVHlwZXMubGVuZ3RoKV07XHJcbiAgICAgICAgc2V0VmlvbGF0aW9ucyhwcmV2ID0+IFt7XHJcbiAgICAgICAgICBpZDogRGF0ZS5ub3coKSxcclxuICAgICAgICAgIC4uLnZpb2xhdGlvbixcclxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgc3RhdHVzOiAnYWN0aXZlJ1xyXG4gICAgICAgIH0sIC4uLnByZXYuc2xpY2UoMCwgOSldKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc3QgYXVkaXRUeXBlcyA9IFtcclxuICAgICAgICAnU2NoZW1hIHJlZ2lzdGVyZWQnLFxyXG4gICAgICAgICdQb2xpY3kgdXBkYXRlZCcsXHJcbiAgICAgICAgJ1Zpb2xhdGlvbiByZXNvbHZlZCcsXHJcbiAgICAgICAgJ0NvbXBsaWFuY2UgY2hlY2sgcGFzc2VkJyxcclxuICAgICAgICAnQXVkaXQgbG9nIGFyY2hpdmVkJ1xyXG4gICAgICBdO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgYXVkaXRFdmVudCA9IHtcclxuICAgICAgICBpZDogRGF0ZS5ub3coKSxcclxuICAgICAgICB0eXBlOiBhdWRpdFR5cGVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGF1ZGl0VHlwZXMubGVuZ3RoKV0sXHJcbiAgICAgICAgdXNlcjogYHVzZXItJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDApfWAsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgY29ycmVsYXRpb25JZDogYGNvcnItJHtEYXRlLm5vdygpfWBcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIHNldEF1ZGl0RXZlbnRzKHByZXYgPT4gW2F1ZGl0RXZlbnQsIC4uLnByZXYuc2xpY2UoMCwgOSldKTtcclxuICAgICAgXHJcbiAgICAgIHNldENvbXBsaWFuY2VTY29yZShwcmV2ID0+IHtcclxuICAgICAgICBjb25zdCBjaGFuZ2UgPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAwLjI7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KDk1LCBNYXRoLm1pbigxMDAsIHByZXYgKyBjaGFuZ2UpKTtcclxuICAgICAgfSk7XHJcbiAgICB9LCAzMDAwKTtcclxuXHJcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCBnZXRTZXZlcml0eUNvbG9yID0gKHNldmVyaXR5OiBzdHJpbmcpID0+IHtcclxuICAgIHN3aXRjaCAoc2V2ZXJpdHkpIHtcclxuICAgICAgY2FzZSAnaGlnaCc6IHJldHVybiAndGV4dC1yZWQtNDAwIGJnLXJlZC01MDAvMjAgYm9yZGVyLXJlZC01MDAvMzAnO1xyXG4gICAgICBjYXNlICdtZWRpdW0nOiByZXR1cm4gJ3RleHQteWVsbG93LTQwMCBiZy15ZWxsb3ctNTAwLzIwIGJvcmRlci15ZWxsb3ctNTAwLzMwJztcclxuICAgICAgY2FzZSAnbG93JzogcmV0dXJuICd0ZXh0LWJsdWUtNDAwIGJnLWJsdWUtNTAwLzIwIGJvcmRlci1ibHVlLTUwMC8zMCc7XHJcbiAgICAgIGRlZmF1bHQ6IHJldHVybiAndGV4dC1ncmF5LTQwMCBiZy1ncmF5LTUwMC8yMCBib3JkZXItZ3JheS01MDAvMzAnO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC0zeGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItMlwiPkdvdmVybmFuY2UgRGFzaGJvYXJkPC9oMj5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDBcIj5SZWFsLXRpbWUgcG9saWN5IGVuZm9yY2VtZW50IGFuZCBjb21wbGlhbmNlIG1vbml0b3Jpbmc8L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTRcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0yIHB4LTQgcHktMiBiZy1ncmVlbi01MDAvMjAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWdyZWVuLTUwMC8zMFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMiBoLTIgYmctZ3JlZW4tNDAwIHJvdW5kZWQtZnVsbCBhbmltYXRlLXB1bHNlXCIgLz5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmVlbi0zMDAgdGV4dC1zbSBmb250LW1lZGl1bVwiPkFsbCBQb2xpY2llcyBBY3RpdmU8L3NwYW4+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXJpZ2h0XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIHRleHQtd2hpdGVcIj57Y29tcGxpYW5jZVNjb3JlLnRvRml4ZWQoMSl9JTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTQwMFwiPkNvbXBsaWFuY2UgU2NvcmU8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNlwiPlxyXG4gICAgICAgIHtPYmplY3QuZW50cmllcyhwb2xpY2llcykubWFwKChba2V5LCBwb2xpY3ldLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IHNlbGVjdGVkUG9saWN5ID09PSBrZXk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICAgICAga2V5PXtrZXl9XHJcbiAgICAgICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IGluZGV4ICogMC4xIH19XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgY3Vyc29yLXBvaW50ZXIgcm91bmRlZC0yeGwgYm9yZGVyIGJhY2tkcm9wLWJsdXIteGwgcC02IHRyYW5zaXRpb24tYWxsICR7XHJcbiAgICAgICAgICAgICAgICBpc1NlbGVjdGVkIFxyXG4gICAgICAgICAgICAgICAgICA/ICdib3JkZXItYmx1ZS01MDAvNTAgYmctYmx1ZS01MDAvMTAnIFxyXG4gICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvMTAgYmctd2hpdGUvNSBob3Zlcjpib3JkZXItd2hpdGUvMjAnXHJcbiAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2VsZWN0ZWRQb2xpY3koaXNTZWxlY3RlZCA/IG51bGwgOiBrZXkpfVxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLWJyICR7cG9saWN5LmNvbG9yfSBvcGFjaXR5LTEwIHJvdW5kZWQtMnhsYH0gLz5cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHotMTBcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTRcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMiByb3VuZGVkLWxnIGJnLXdoaXRlLzEwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7UmVhY3QuY3JlYXRlRWxlbWVudChwb2xpY3kuaWNvbiwgeyBjbGFzc05hbWU6IFwidy02IGgtNiB0ZXh0LXdoaXRlXCIgfSl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYm9sZCB0ZXh0LXdoaXRlXCI+e3BvbGljeS5uYW1lfTwvaDM+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS00MDBcIj57cG9saWN5LmRlc2NyaXB0aW9ufTwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtwb2xpY3kudmlvbGF0aW9ucyA+IDAgPyAoXHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMSBweC0yIHB5LTEgYmctcmVkLTUwMC8yMCByb3VuZGVkIGJvcmRlciBib3JkZXItcmVkLTUwMC8zMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8QWxlcnRUcmlhbmdsZSBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtcmVkLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcmVkLTQwMCB0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+e3BvbGljeS52aW9sYXRpb25zfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMSBweC0yIHB5LTEgYmctZ3JlZW4tNTAwLzIwIHJvdW5kZWQgYm9yZGVyIGJvcmRlci1ncmVlbi01MDAvMzBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPENoZWNrQ2lyY2xlIGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1ncmVlbi00MDBcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWdyZWVuLTQwMCB0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+4pyTPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDBcIj5FbmZvcmNlbWVudDo8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC13aGl0ZVwiPntwb2xpY3kuZW5mb3JjZW1lbnR9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDBcIj5MYXN0IFVwZGF0ZWQ6PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2hpdGVcIj57cG9saWN5Lmxhc3RVcGRhdGVkfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KX1cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICA8QW5pbWF0ZVByZXNlbmNlPlxyXG4gICAgICAgIHtzZWxlY3RlZFBvbGljeSAmJiAoXHJcbiAgICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgICBleGl0PXt7IG9wYWNpdHk6IDAsIHk6IC0yMCB9fVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJiZy13aGl0ZS81IGJhY2tkcm9wLWJsdXIteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTZcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLThcIj5cclxuICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNFwiPlBvbGljeSBSdWxlczwvaDM+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxyXG4gICAgICAgICAgICAgICAgICB7cG9saWNpZXNbc2VsZWN0ZWRQb2xpY3ldLnJ1bGVzLm1hcCgocnVsZTogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgICAgICAgICAgIGtleT17cnVsZX1cclxuICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeDogLTEwIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHg6IDAgfX1cclxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IGluZGV4ICogMC4xIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTMgcC0zIGJnLXdoaXRlLzEwIHJvdW5kZWQtbGdcIlxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIDxDaGVja0NpcmNsZSBjbGFzc05hbWU9XCJ3LTUgaC01IHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2hpdGVcIj57cnVsZX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi00XCI+RW5mb3JjZW1lbnQgRGV0YWlsczwvaDM+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy1ncmFkaWVudC10by1yIGZyb20tYmx1ZS01MDAvMjAgdG8tcHVycGxlLTUwMC8yMCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItYmx1ZS01MDAvMzBcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTMwMCBtYi0xXCI+RW5mb3JjZW1lbnQgTWV0aG9kPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlIGZvbnQtbWVkaXVtXCI+e3BvbGljaWVzW3NlbGVjdGVkUG9saWN5XS5lbmZvcmNlbWVudH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy1ncmFkaWVudC10by1yIGZyb20tZ3JlZW4tNTAwLzIwIHRvLWVtZXJhbGQtNTAwLzIwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ncmVlbi01MDAvMzBcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTMwMCBtYi0xXCI+Q3VycmVudCBTdGF0dXM8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTIgaC0yIGJnLWdyZWVuLTQwMCByb3VuZGVkLWZ1bGxcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmVlbi00MDAgZm9udC1tZWRpdW1cIj5BY3RpdmUgJiBFbmZvcmNlZDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy1ncmFkaWVudC10by1yIGZyb20teWVsbG93LTUwMC8yMCB0by1vcmFuZ2UtNTAwLzIwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci15ZWxsb3ctNTAwLzMwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS0zMDAgbWItMVwiPlZpb2xhdGlvbnMgKDI0aCk8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LXllbGxvdy00MDBcIj57cG9saWNpZXNbc2VsZWN0ZWRQb2xpY3ldLnZpb2xhdGlvbnN9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvQW5pbWF0ZVByZXNlbmNlPlxyXG5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC02XCI+XHJcbiAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeDogLTIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHg6IDAgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNCBmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICA8U2hpZWxkIGNsYXNzTmFtZT1cInctNSBoLTUgbXItMiB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgIENvbXBsaWFuY2UgT3ZlcnZpZXdcclxuICAgICAgICAgIDwvaDM+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTRcIj5cclxuICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXsyMDB9PlxyXG4gICAgICAgICAgICAgIDxQaWVDaGFydD5cclxuICAgICAgICAgICAgICAgIDxQaWVcclxuICAgICAgICAgICAgICAgICAgZGF0YT17Y29tcGxpYW5jZURhdGF9XHJcbiAgICAgICAgICAgICAgICAgIGN4PVwiNTAlXCJcclxuICAgICAgICAgICAgICAgICAgY3k9XCI1MCVcIlxyXG4gICAgICAgICAgICAgICAgICBpbm5lclJhZGl1cz17NDB9XHJcbiAgICAgICAgICAgICAgICAgIG91dGVyUmFkaXVzPXs4MH1cclxuICAgICAgICAgICAgICAgICAgcGFkZGluZ0FuZ2xlPXs1fVxyXG4gICAgICAgICAgICAgICAgICBkYXRhS2V5PVwidmFsdWVcIlxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICB7Y29tcGxpYW5jZURhdGEubWFwKChlbnRyeSwgaW5kZXgpID0+IChcclxuICAgICAgICAgICAgICAgICAgICA8Q2VsbCBrZXk9e2BjZWxsLSR7aW5kZXh9YH0gZmlsbD17ZW50cnkuY29sb3J9IC8+XHJcbiAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgPC9QaWU+XHJcbiAgICAgICAgICAgICAgICA8VG9vbHRpcCAvPlxyXG4gICAgICAgICAgICAgIDwvUGllQ2hhcnQ+XHJcbiAgICAgICAgICAgIDwvUmVzcG9uc2l2ZUNvbnRhaW5lcj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIHNwYWNlLXktM1wiPlxyXG4gICAgICAgICAgICAgIHtjb21wbGlhbmNlRGF0YS5tYXAoKGl0ZW0pID0+IChcclxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpdGVtLm5hbWV9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0zIGgtMyByb3VuZGVkLWZ1bGxcIiBzdHlsZT17eyBiYWNrZ3JvdW5kQ29sb3I6IGl0ZW0uY29sb3IgfX0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS0zMDBcIj57aXRlbS5uYW1lfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1ib2xkXCI+e2l0ZW0udmFsdWV9JTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuXHJcbiAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeDogMjAgfX1cclxuICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeDogMCB9fVxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC02XCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi00IGZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgIDxBY3Rpdml0eSBjbGFzc05hbWU9XCJ3LTUgaC01IG1yLTIgdGV4dC1ibHVlLTQwMFwiIC8+XHJcbiAgICAgICAgICAgIFZpb2xhdGlvbiBUcmVuZHMgKDI0aClcclxuICAgICAgICAgIDwvaDM+XHJcbiAgICAgICAgICA8UmVzcG9uc2l2ZUNvbnRhaW5lciB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9ezIwMH0+XHJcbiAgICAgICAgICAgIDxMaW5lQ2hhcnQgZGF0YT17dmlvbGF0aW9uVHJlbmRzfT5cclxuICAgICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiBzdHJva2U9XCIjZmZmZmZmMjBcIiAvPlxyXG4gICAgICAgICAgICAgIDxYQXhpcyBkYXRhS2V5PVwidGltZVwiIHN0cm9rZT1cIiNmZmZmZmY2MFwiIC8+XHJcbiAgICAgICAgICAgICAgPFlBeGlzIHN0cm9rZT1cIiNmZmZmZmY2MFwiIC8+XHJcbiAgICAgICAgICAgICAgPFRvb2x0aXAgXHJcbiAgICAgICAgICAgICAgICBjb250ZW50U3R5bGU9e3sgXHJcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMxZTI5M2InLCBcclxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNmZmZmZmYyMCcsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzhweCdcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8TGluZSB0eXBlPVwibW9ub3RvbmVcIiBkYXRhS2V5PVwidmlvbGF0aW9uc1wiIHN0cm9rZT1cIiNlZjQ0NDRcIiBzdHJva2VXaWR0aD17Mn0gLz5cclxuICAgICAgICAgICAgICA8TGluZSB0eXBlPVwibW9ub3RvbmVcIiBkYXRhS2V5PVwicmVzb2x2ZWRcIiBzdHJva2U9XCIjMTBiOTgxXCIgc3Ryb2tlV2lkdGg9ezJ9IC8+XHJcbiAgICAgICAgICAgIDwvTGluZUNoYXJ0PlxyXG4gICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTZcIj5cclxuICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJiZy13aGl0ZS81IGJhY2tkcm9wLWJsdXIteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTZcIlxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1iLTQgZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgPEFsZXJ0VHJpYW5nbGUgY2xhc3NOYW1lPVwidy01IGgtNSBtci0yIHRleHQteWVsbG93LTQwMFwiIC8+XHJcbiAgICAgICAgICAgIFJlY2VudCBWaW9sYXRpb25zXHJcbiAgICAgICAgICA8L2gzPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTMgbWF4LWgtWzMwMHB4XSBvdmVyZmxvdy15LWF1dG9cIj5cclxuICAgICAgICAgICAge3Zpb2xhdGlvbnMubGVuZ3RoID09PSAwID8gKFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktOCB0ZXh0LWdyYXktNDAwXCI+XHJcbiAgICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy0xMiBoLTEyIG14LWF1dG8gbWItMiB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8cD5ObyB2aW9sYXRpb25zIGRldGVjdGVkPC9wPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgIHZpb2xhdGlvbnMubWFwKCh2aW9sYXRpb24pID0+IChcclxuICAgICAgICAgICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICAgICAgICAgIGtleT17dmlvbGF0aW9uLmlkfVxyXG4gICAgICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHg6IC0yMCB9fVxyXG4gICAgICAgICAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHg6IDAgfX1cclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcC0zIHJvdW5kZWQtbGcgYm9yZGVyICR7Z2V0U2V2ZXJpdHlDb2xvcih2aW9sYXRpb24uc2V2ZXJpdHkpfWB9XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1lZGl1bVwiPnt2aW9sYXRpb24udHlwZX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB1cHBlcmNhc2VcIj57dmlvbGF0aW9uLnNldmVyaXR5fTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gb3BhY2l0eS04MFwiPnt2aW9sYXRpb24ubWVzc2FnZX08L3A+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyBvcGFjaXR5LTYwIG10LTJcIj5cclxuICAgICAgICAgICAgICAgICAgICB7bmV3IERhdGUodmlvbGF0aW9uLnRpbWVzdGFtcCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgICAgICkpXHJcbiAgICAgICAgICAgICl9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcblxyXG4gICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNCBmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICA8RXllIGNsYXNzTmFtZT1cInctNSBoLTUgbXItMiB0ZXh0LXB1cnBsZS00MDBcIiAvPlxyXG4gICAgICAgICAgICBBdWRpdCBUcmFpbFxyXG4gICAgICAgICAgPC9oMz5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zIG1heC1oLVszMDBweF0gb3ZlcmZsb3cteS1hdXRvXCI+XHJcbiAgICAgICAgICAgIHthdWRpdEV2ZW50cy5tYXAoKGV2ZW50KSA9PiAoXHJcbiAgICAgICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgICAgIGtleT17ZXZlbnQuaWR9XHJcbiAgICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHg6IC0yMCB9fVxyXG4gICAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB4OiAwIH19XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTMgYmctd2hpdGUvMTAgcm91bmRlZC1sZ1wiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMVwiPlxyXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlIGZvbnQtbWVkaXVtXCI+e2V2ZW50LnR5cGV9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS00MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICB7bmV3IERhdGUoZXZlbnQudGltZXN0YW1wKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1cclxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTQwMFwiPlxyXG4gICAgICAgICAgICAgICAgICBVc2VyOiB7ZXZlbnQudXNlcn1cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS01MDAgbXQtMVwiPlxyXG4gICAgICAgICAgICAgICAgICBJRDoge2V2ZW50LmNvcnJlbGF0aW9uSWR9XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgIGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWJyIGZyb20tcHVycGxlLTUwMC8yMCB0by1waW5rLTUwMC8yMCBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItcHVycGxlLTUwMC8zMCByb3VuZGVkLTJ4bCBwLTZcIlxyXG4gICAgICA+XHJcbiAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1iLTYgZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgIDxUcmVuZGluZ1VwIGNsYXNzTmFtZT1cInctNiBoLTYgbXItMiB0ZXh0LXB1cnBsZS00MDBcIiAvPlxyXG4gICAgICAgICAgR292ZXJuYW5jZSBCZW5lZml0c1xyXG4gICAgICAgIDwvaDM+XHJcbiAgICAgICAgXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGdhcC02XCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC00eGwgZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMCBtYi0yXCI+MTAwJTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1tZWRpdW0gbWItMVwiPlBvbGljeSBDb3ZlcmFnZTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTQwMFwiPkFsbCBvcGVyYXRpb25zIGdvdmVybmVkPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtNHhsIGZvbnQtYm9sZCB0ZXh0LWdyZWVuLTQwMCBtYi0yXCI+Jmx0OzEwbXM8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlIGZvbnQtbWVkaXVtIG1iLTFcIj5Qb2xpY3kgQ2hlY2s8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS00MDBcIj5NaW5pbWFsIG92ZXJoZWFkPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtNHhsIGZvbnQtYm9sZCB0ZXh0LWJsdWUtNDAwIG1iLTJcIj5aZXJvPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC13aGl0ZSBmb250LW1lZGl1bSBtYi0xXCI+QnJlYWtpbmcgQ2hhbmdlczwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTQwMFwiPkluIHByb2R1Y3Rpb248L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgR292ZXJuYW5jZVZpZXc7XHJcbiJdfQ==