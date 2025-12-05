import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle,
  FileText, GitBranch, Lock, Eye,
  Activity, Clock, TrendingUp, Users
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GovernanceView = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [complianceScore, setComplianceScore] = useState(98.5);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const policies: Record<string, any> = {
    'schema-validation': {
      name: 'Schema Validation',
      description: 'All events must conform to registered schemas',
      status: 'active',
      violations: 2,
      icon: FileText,
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
      icon: Lock,
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
      icon: GitBranch,
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
      icon: Eye,
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

  useEffect(() => {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Governance Dashboard</h2>
          <p className="text-gray-400">Real-time policy enforcement and compliance monitoring</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
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
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`cursor-pointer rounded-2xl border backdrop-blur-xl p-6 transition-all ${
                isSelected 
                  ? 'border-blue-500/50 bg-blue-500/10' 
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              onClick={() => setSelectedPolicy(isSelected ? null : key)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${policy.color} opacity-10 rounded-2xl`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      {React.createElement(policy.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{policy.name}</h3>
                      <p className="text-sm text-gray-400">{policy.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {policy.violations > 0 ? (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded border border-red-500/30">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">{policy.violations}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded border border-green-500/30">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">✓</span>
                      </div>
                    )}
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
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPolicy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Policy Rules</h3>
                <div className="space-y-3">
                  {policies[selectedPolicy].rules.map((rule: string, index: number) => (
                    <motion.div
                      key={rule}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">{rule}</span>
                    </motion.div>
                  ))}
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
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-400" />
            Compliance Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-3">
              {complianceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Violation Trends (24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={violationTrends}>
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
              <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
            Recent Violations
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {violations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>No violations detected</p>
              </div>
            ) : (
              violations.map((violation) => (
                <motion.div
                  key={violation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${getSeverityColor(violation.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{violation.type}</span>
                    <span className="text-xs uppercase">{violation.severity}</span>
                  </div>
                  <p className="text-sm opacity-80">{violation.message}</p>
                  <div className="text-xs opacity-60 mt-2">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-purple-400" />
            Audit Trail
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {auditEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-white/10 rounded-lg"
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
      >
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-purple-400" />
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
      </motion.div>
    </div>
  );
};

export default GovernanceView;
