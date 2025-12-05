import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Database, Network, Shield, 
  GitBranch, Zap, Clock, CheckCircle,
  ArrowRight, Activity, Server, Cloud
} from 'lucide-react';

const ArchitectureView = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [dataFlow, setDataFlow] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const architectureComponents: Record<string, any> = {
    'api-gateway': {
      name: 'API Gateway',
      description: 'Entry point with authentication, rate limiting, and request validation',
      icon: Network,
      position: { x: 50, y: 100 },
      color: 'from-blue-500 to-cyan-500',
      features: ['IAM Authentication', 'Request Validation', 'Rate Limiting', 'CORS Support'],
      metrics: { latency: '45ms', throughput: '10K req/s', uptime: '99.99%' }
    },
    'command-service': {
      name: 'Command Service',
      description: 'CQRS command processing with event sourcing and snapshots',
      icon: Zap,
      position: { x: 300, y: 100 },
      color: 'from-purple-500 to-pink-500',
      features: ['Event Sourcing', 'Snapshot Optimization', 'Command Validation', 'Correlation Tracking'],
      metrics: { latency: '120ms', throughput: '5K cmd/s', uptime: '99.99%' }
    },
    'event-store': {
      name: 'Event Store',
      description: 'Immutable event log with DynamoDB and CDC streams',
      icon: Database,
      position: { x: 550, y: 100 },
      color: 'from-green-500 to-emerald-500',
      features: ['Immutable Log', 'DynamoDB Streams', 'Atomic Writes', 'Point-in-Time Recovery'],
      metrics: { latency: '25ms', throughput: '15K writes/s', uptime: '99.99%' }
    },
    'schema-registry': {
      name: 'Schema Registry',
      description: 'AWS Glue-based schema validation and evolution',
      icon: Shield,
      position: { x: 800, y: 50 },
      color: 'from-yellow-500 to-orange-500',
      features: ['Schema Validation', 'Backward Compatibility', 'Version Management', 'CI/CD Integration'],
      metrics: { latency: '15ms', throughput: '20K validations/s', uptime: '99.99%' }
    },
    'event-router': {
      name: 'Event Router',
      description: 'Dual-path event routing for optimal cost and performance',
      icon: GitBranch,
      position: { x: 550, y: 250 },
      color: 'from-indigo-500 to-purple-500',
      features: ['Dual-Path Routing', 'Cost Optimization', 'Load Balancing', 'Circuit Breaker'],
      metrics: { latency: '35ms', throughput: '25K events/s', uptime: '99.99%' }
    },
    'kinesis': {
      name: 'Kinesis Stream',
      description: 'High-throughput, low-latency stream for critical events',
      icon: Activity,
      position: { x: 350, y: 400 },
      color: 'from-red-500 to-pink-500',
      features: ['Real-time Processing', 'Auto Scaling', 'Ordering Guarantees', 'Replay Capability'],
      metrics: { latency: '200ms', throughput: '10K events/s', uptime: '99.99%' }
    },
    'sns-sqs': {
      name: 'SNS/SQS Chain',
      description: 'Cost-optimized fan-out for non-critical events',
      icon: Network,
      position: { x: 750, y: 400 },
      color: 'from-cyan-500 to-blue-500',
      features: ['Fan-out Pattern', 'Dead Letter Queues', 'Cost Optimization', 'Retry Logic'],
      metrics: { latency: '2s', throughput: '50K events/s', uptime: '99.99%' }
    },
    'opensearch': {
      name: 'OpenSearch',
      description: 'Query dashboard with projections and full-text search',
      icon: Server,
      position: { x: 550, y: 550 },
      color: 'from-teal-500 to-green-500',
      features: ['Full-text Search', 'Real-time Indexing', 'Aggregations', 'Temporal Queries'],
      metrics: { latency: '85ms', throughput: '5K queries/s', uptime: '99.99%' }
    },
    'policy-engine': {
      name: 'Policy Engine',
      description: 'OPA-based governance and compliance enforcement',
      icon: Shield,
      position: { x: 50, y: 300 },
      color: 'from-orange-500 to-red-500',
      features: ['Runtime Enforcement', 'CI/CD Integration', 'Audit Logging', 'Compliance Checks'],
      metrics: { latency: '10ms', throughput: '30K checks/s', uptime: '99.99%' }
    }
  };

  const dataFlowPaths = [
    ['api-gateway', 'command-service', 'event-store', 'event-router', 'kinesis', 'opensearch'],
    ['api-gateway', 'command-service', 'event-store', 'event-router', 'sns-sqs', 'opensearch'],
    ['schema-registry', 'event-store'],
    ['policy-engine', 'command-service']
  ];

  const animateDataFlow = () => {
    setIsAnimating(true);
    setDataFlow([]);
    
    const path = dataFlowPaths[Math.floor(Math.random() * dataFlowPaths.length)];
    
    path.forEach((component, index) => {
      setTimeout(() => {
        setDataFlow(prev => [...prev, component]);
        if (index === path.length - 1) {
          setTimeout(() => {
            setDataFlow([]);
            setIsAnimating(false);
          }, 2000);
        }
      }, index * 800);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        animateDataFlow();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const getConnectionLines = () => {
    const connections = [
      ['api-gateway', 'command-service'],
      ['command-service', 'event-store'],
      ['event-store', 'event-router'],
      ['event-router', 'kinesis'],
      ['event-router', 'sns-sqs'],
      ['kinesis', 'opensearch'],
      ['sns-sqs', 'opensearch'],
      ['schema-registry', 'event-store'],
      ['policy-engine', 'command-service']
    ];

    return connections.map(([from, to], index) => {
      const fromComp = architectureComponents[from];
      const toComp = architectureComponents[to];
      
      const isActive = dataFlow.includes(from) && dataFlow.includes(to) && 
                      Math.abs(dataFlow.indexOf(from) - dataFlow.indexOf(to)) === 1;
      
      return (
        <motion.line
          key={`${from}-${to}`}
          x1={fromComp.position.x + 75}
          y1={fromComp.position.y + 50}
          x2={toComp.position.x + 75}
          y2={toComp.position.y + 50}
          stroke={isActive ? '#3b82f6' : '#ffffff20'}
          strokeWidth={isActive ? 3 : 1}
          strokeDasharray={isActive ? '0' : '5,5'}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Architecture</h2>
          <p className="text-gray-400">Event-sourced microservices with governance-first approach</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={animateDataFlow}
          disabled={isAnimating}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50"
        >
          <Activity className="w-5 h-5" />
          <span>{isAnimating ? 'Animating...' : 'Show Data Flow'}</span>
        </motion.button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="relative w-full h-[600px] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            {getConnectionLines()}
          </svg>
          
          {Object.entries(architectureComponents).map(([key, component]) => {
            const isSelected = selectedComponent === key;
            const isInFlow = dataFlow.includes(key);
            
            return (
              <motion.div
                key={key}
                className={`absolute w-32 h-24 cursor-pointer ${
                  isSelected ? 'z-20' : isInFlow ? 'z-10' : 'z-0'
                }`}
                style={{
                  left: component.position.x,
                  top: component.position.y
                }}
                whileHover={{ scale: 1.1, z: 15 }}
                onClick={() => setSelectedComponent(isSelected ? null : key)}
                animate={{
                  scale: isInFlow ? 1.1 : 1,
                  boxShadow: isInFlow ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 0px rgba(0,0,0,0)'
                }}
              >
                <div className={`w-full h-full rounded-xl border backdrop-blur-xl p-3 transition-all ${
                  isSelected 
                    ? 'border-blue-500/50 bg-blue-500/20' 
                    : isInFlow
                    ? 'border-blue-400/50 bg-blue-400/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${component.color} opacity-10 rounded-xl`} />
                  
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <component.icon className={`w-6 h-6 mb-1 ${
                      isSelected ? 'text-blue-400' : isInFlow ? 'text-blue-300' : 'text-white'
                    }`} />
                    <div className={`text-xs font-medium text-center leading-tight ${
                      isSelected ? 'text-blue-300' : isInFlow ? 'text-blue-200' : 'text-white'
                    }`}>
                      {component.name}
                    </div>
                  </div>
                  
                  {isInFlow && (
                    <motion.div
                      className="absolute inset-0 border-2 border-blue-400 rounded-xl"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedComponent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${architectureComponents[selectedComponent].color} bg-opacity-20`}>
                    {React.createElement(architectureComponents[selectedComponent].icon, { className: "w-8 h-8 text-white" })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {architectureComponents[selectedComponent].name}
                    </h3>
                    <p className="text-gray-400">
                      {architectureComponents[selectedComponent].description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white">Key Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {architectureComponents[selectedComponent].features.map((feature: string, index: number) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Latency (p99)</span>
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {architectureComponents[selectedComponent].metrics.latency}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Throughput</span>
                      <Activity className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {architectureComponents[selectedComponent].metrics.throughput}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Uptime</span>
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {architectureComponents[selectedComponent].metrics.uptime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Governance First</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Schema validation and policy enforcement are built into the foundation, not added as an afterthought.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Pre-deployment validation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Runtime policy enforcement</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Audit trail completeness</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <GitBranch className="w-8 h-8 text-green-400" />
            <h3 className="text-xl font-bold text-white">Dual-Path Routing</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Intelligent event routing optimizes for both performance and cost based on event criticality.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Kinesis for critical events</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">SNS/SQS for cost optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">73% cost reduction</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Event Sourcing</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Complete audit trail with snapshot optimization for performance and temporal queries.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Immutable event log</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Snapshot optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Point-in-time recovery</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArchitectureView;
