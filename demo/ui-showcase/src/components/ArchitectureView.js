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
const ArchitectureView = () => {
    const [selectedComponent, setSelectedComponent] = (0, react_1.useState)(null);
    const [dataFlow, setDataFlow] = (0, react_1.useState)([]);
    const [isAnimating, setIsAnimating] = (0, react_1.useState)(false);
    const architectureComponents = {
        'api-gateway': {
            name: 'API Gateway',
            description: 'Entry point with authentication, rate limiting, and request validation',
            icon: lucide_react_1.Network,
            position: { x: 50, y: 100 },
            color: 'from-blue-500 to-cyan-500',
            features: ['IAM Authentication', 'Request Validation', 'Rate Limiting', 'CORS Support'],
            metrics: { latency: '45ms', throughput: '10K req/s', uptime: '99.99%' }
        },
        'command-service': {
            name: 'Command Service',
            description: 'CQRS command processing with event sourcing and snapshots',
            icon: lucide_react_1.Zap,
            position: { x: 300, y: 100 },
            color: 'from-purple-500 to-pink-500',
            features: ['Event Sourcing', 'Snapshot Optimization', 'Command Validation', 'Correlation Tracking'],
            metrics: { latency: '120ms', throughput: '5K cmd/s', uptime: '99.99%' }
        },
        'event-store': {
            name: 'Event Store',
            description: 'Immutable event log with DynamoDB and CDC streams',
            icon: lucide_react_1.Database,
            position: { x: 550, y: 100 },
            color: 'from-green-500 to-emerald-500',
            features: ['Immutable Log', 'DynamoDB Streams', 'Atomic Writes', 'Point-in-Time Recovery'],
            metrics: { latency: '25ms', throughput: '15K writes/s', uptime: '99.99%' }
        },
        'schema-registry': {
            name: 'Schema Registry',
            description: 'AWS Glue-based schema validation and evolution',
            icon: lucide_react_1.Shield,
            position: { x: 800, y: 50 },
            color: 'from-yellow-500 to-orange-500',
            features: ['Schema Validation', 'Backward Compatibility', 'Version Management', 'CI/CD Integration'],
            metrics: { latency: '15ms', throughput: '20K validations/s', uptime: '99.99%' }
        },
        'event-router': {
            name: 'Event Router',
            description: 'Dual-path event routing for optimal cost and performance',
            icon: lucide_react_1.GitBranch,
            position: { x: 550, y: 250 },
            color: 'from-indigo-500 to-purple-500',
            features: ['Dual-Path Routing', 'Cost Optimization', 'Load Balancing', 'Circuit Breaker'],
            metrics: { latency: '35ms', throughput: '25K events/s', uptime: '99.99%' }
        },
        'kinesis': {
            name: 'Kinesis Stream',
            description: 'High-throughput, low-latency stream for critical events',
            icon: lucide_react_1.Activity,
            position: { x: 350, y: 400 },
            color: 'from-red-500 to-pink-500',
            features: ['Real-time Processing', 'Auto Scaling', 'Ordering Guarantees', 'Replay Capability'],
            metrics: { latency: '200ms', throughput: '10K events/s', uptime: '99.99%' }
        },
        'sns-sqs': {
            name: 'SNS/SQS Chain',
            description: 'Cost-optimized fan-out for non-critical events',
            icon: lucide_react_1.Network,
            position: { x: 750, y: 400 },
            color: 'from-cyan-500 to-blue-500',
            features: ['Fan-out Pattern', 'Dead Letter Queues', 'Cost Optimization', 'Retry Logic'],
            metrics: { latency: '2s', throughput: '50K events/s', uptime: '99.99%' }
        },
        'opensearch': {
            name: 'OpenSearch',
            description: 'Query dashboard with projections and full-text search',
            icon: lucide_react_1.Server,
            position: { x: 550, y: 550 },
            color: 'from-teal-500 to-green-500',
            features: ['Full-text Search', 'Real-time Indexing', 'Aggregations', 'Temporal Queries'],
            metrics: { latency: '85ms', throughput: '5K queries/s', uptime: '99.99%' }
        },
        'policy-engine': {
            name: 'Policy Engine',
            description: 'OPA-based governance and compliance enforcement',
            icon: lucide_react_1.Shield,
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
    (0, react_1.useEffect)(() => {
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
            return (<framer_motion_1.motion.line key={`${from}-${to}`} x1={fromComp.position.x + 75} y1={fromComp.position.y + 50} x2={toComp.position.x + 75} y2={toComp.position.y + 50} stroke={isActive ? '#3b82f6' : '#ffffff20'} strokeWidth={isActive ? 3 : 1} strokeDasharray={isActive ? '0' : '5,5'} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: index * 0.1 }}/>);
        });
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Architecture</h2>
          <p className="text-gray-400">Event-sourced microservices with governance-first approach</p>
        </div>
        
        <framer_motion_1.motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={animateDataFlow} disabled={isAnimating} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50">
          <lucide_react_1.Activity className="w-5 h-5"/>
          <span>{isAnimating ? 'Animating...' : 'Show Data Flow'}</span>
        </framer_motion_1.motion.button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="relative w-full h-[600px] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            {getConnectionLines()}
          </svg>
          
          {Object.entries(architectureComponents).map(([key, component]) => {
            const isSelected = selectedComponent === key;
            const isInFlow = dataFlow.includes(key);
            return (<framer_motion_1.motion.div key={key} className={`absolute w-32 h-24 cursor-pointer ${isSelected ? 'z-20' : isInFlow ? 'z-10' : 'z-0'}`} style={{
                    left: component.position.x,
                    top: component.position.y
                }} whileHover={{ scale: 1.1, z: 15 }} onClick={() => setSelectedComponent(isSelected ? null : key)} animate={{
                    scale: isInFlow ? 1.1 : 1,
                    boxShadow: isInFlow ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 0px rgba(0,0,0,0)'
                }}>
                <div className={`w-full h-full rounded-xl border backdrop-blur-xl p-3 transition-all ${isSelected
                    ? 'border-blue-500/50 bg-blue-500/20'
                    : isInFlow
                        ? 'border-blue-400/50 bg-blue-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${component.color} opacity-10 rounded-xl`}/>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <component.icon className={`w-6 h-6 mb-1 ${isSelected ? 'text-blue-400' : isInFlow ? 'text-blue-300' : 'text-white'}`}/>
                    <div className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-blue-300' : isInFlow ? 'text-blue-200' : 'text-white'}`}>
                      {component.name}
                    </div>
                  </div>
                  
                  {isInFlow && (<framer_motion_1.motion.div className="absolute inset-0 border-2 border-blue-400 rounded-xl" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }}/>)}
                </div>
              </framer_motion_1.motion.div>);
        })}
        </div>
      </div>

      <framer_motion_1.AnimatePresence>
        {selectedComponent && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${architectureComponents[selectedComponent].color} bg-opacity-20`}>
                    {react_1.default.createElement(architectureComponents[selectedComponent].icon, { className: "w-8 h-8 text-white" })}
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
                    {architectureComponents[selectedComponent].features.map((feature, index) => (<framer_motion_1.motion.div key={feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg">
                        <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
                        <span className="text-sm text-white">{feature}</span>
                      </framer_motion_1.motion.div>))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Latency (p99)</span>
                      <lucide_react_1.Clock className="w-4 h-4 text-blue-400"/>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {architectureComponents[selectedComponent].metrics.latency}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Throughput</span>
                      <lucide_react_1.Activity className="w-4 h-4 text-green-400"/>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {architectureComponents[selectedComponent].metrics.throughput}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Uptime</span>
                      <lucide_react_1.CheckCircle className="w-4 h-4 text-purple-400"/>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {architectureComponents[selectedComponent].metrics.uptime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </framer_motion_1.motion.div>)}
      </framer_motion_1.AnimatePresence>

      <div className="grid grid-cols-3 gap-6">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <lucide_react_1.Shield className="w-8 h-8 text-blue-400"/>
            <h3 className="text-xl font-bold text-white">Governance First</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Schema validation and policy enforcement are built into the foundation, not added as an afterthought.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Pre-deployment validation</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Runtime policy enforcement</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Audit trail completeness</span>
            </div>
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <lucide_react_1.GitBranch className="w-8 h-8 text-green-400"/>
            <h3 className="text-xl font-bold text-white">Dual-Path Routing</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Intelligent event routing optimizes for both performance and cost based on event criticality.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Kinesis for critical events</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">SNS/SQS for cost optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">73% cost reduction</span>
            </div>
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <lucide_react_1.Database className="w-8 h-8 text-purple-400"/>
            <h3 className="text-xl font-bold text-white">Event Sourcing</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Complete audit trail with snapshot optimization for performance and temporal queries.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Immutable event log</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Snapshot optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-sm text-gray-300">Point-in-time recovery</span>
            </div>
          </div>
        </framer_motion_1.motion.div>
      </div>
    </div>);
};
exports.default = ArchitectureView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXJjaGl0ZWN0dXJlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkFyY2hpdGVjdHVyZVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQW1EO0FBQ25ELGlEQUF3RDtBQUN4RCwrQ0FJc0I7QUFFdEIsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUU7SUFDNUIsTUFBTSxDQUFDLGlCQUFpQixFQUFFLG9CQUFvQixDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFnQixJQUFJLENBQUMsQ0FBQztJQUNoRixNQUFNLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBVyxFQUFFLENBQUMsQ0FBQztJQUN2RCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUV0RCxNQUFNLHNCQUFzQixHQUF3QjtRQUNsRCxhQUFhLEVBQUU7WUFDYixJQUFJLEVBQUUsYUFBYTtZQUNuQixXQUFXLEVBQUUsd0VBQXdFO1lBQ3JGLElBQUksRUFBRSxzQkFBTztZQUNiLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRTtZQUMzQixLQUFLLEVBQUUsMkJBQTJCO1lBQ2xDLFFBQVEsRUFBRSxDQUFDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxjQUFjLENBQUM7WUFDdkYsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUU7U0FDeEU7UUFDRCxpQkFBaUIsRUFBRTtZQUNqQixJQUFJLEVBQUUsaUJBQWlCO1lBQ3ZCLFdBQVcsRUFBRSwyREFBMkQ7WUFDeEUsSUFBSSxFQUFFLGtCQUFHO1lBQ1QsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdB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Qjs7VUFDRixFQUFFLENBQUMsQ0FDSDtVQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQ3hCO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDZCQUE2QixDQUMxQztjQUFBLENBQUMsMEJBQVcsQ0FBQyxTQUFTLENBQUMsd0JBQXdCLEVBQy9DO2NBQUEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FDbkU7WUFBQSxFQUFFLEdBQUcsQ0FDTDtZQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FDMUM7Y0FBQSxDQUFDLDBCQUFXLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUMvQztjQUFBLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQ3JFO1lBQUEsRUFBRSxHQUFHLENBQ0w7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNkJBQTZCLENBQzFDO2NBQUEsQ0FBQywwQkFBVyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFDL0M7Y0FBQSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUN0RTtZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLHNCQUFNLENBQUMsR0FBRyxDQUNkO01BQUEsRUFBRSxHQUFHLENBQ1A7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixrQkFBZSxnQkFBZ0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBtb3Rpb24sIEFuaW1hdGVQcmVzZW5jZSB9IGZyb20gJ2ZyYW1lci1tb3Rpb24nO1xyXG5pbXBvcnQgeyBcclxuICBMYXllcnMsIERhdGFiYXNlLCBOZXR3b3JrLCBTaGllbGQsIFxyXG4gIEdpdEJyYW5jaCwgWmFwLCBDbG9jaywgQ2hlY2tDaXJjbGUsXHJcbiAgQXJyb3dSaWdodCwgQWN0aXZpdHksIFNlcnZlciwgQ2xvdWRcclxufSBmcm9tICdsdWNpZGUtcmVhY3QnO1xyXG5cclxuY29uc3QgQXJjaGl0ZWN0dXJlVmlldyA9ICgpID0+IHtcclxuICBjb25zdCBbc2VsZWN0ZWRDb21wb25lbnQsIHNldFNlbGVjdGVkQ29tcG9uZW50XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xyXG4gIGNvbnN0IFtkYXRhRmxvdywgc2V0RGF0YUZsb3ddID0gdXNlU3RhdGU8c3RyaW5nW10+KFtdKTtcclxuICBjb25zdCBbaXNBbmltYXRpbmcsIHNldElzQW5pbWF0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuXHJcbiAgY29uc3QgYXJjaGl0ZWN0dXJlQ29tcG9uZW50czogUmVjb3JkPHN0cmluZywgYW55PiA9IHtcclxuICAgICdhcGktZ2F0ZXdheSc6IHtcclxuICAgICAgbmFtZTogJ0FQSSBHYXRld2F5JyxcclxuICAgICAgZGVzY3JpcHRpb246ICdFbnRyeSBwb2ludCB3aXRoIGF1dGhlbnRpY2F0aW9uLCByYXRlIGxpbWl0aW5nLCBhbmQgcmVxdWVzdCB2YWxpZGF0aW9uJyxcclxuICAgICAgaWNvbjogTmV0d29yayxcclxuICAgICAgcG9zaXRpb246IHsgeDogNTAsIHk6IDEwMCB9LFxyXG4gICAgICBjb2xvcjogJ2Zyb20tYmx1ZS01MDAgdG8tY3lhbi01MDAnLFxyXG4gICAgICBmZWF0dXJlczogWydJQU0gQXV0aGVudGljYXRpb24nLCAnUmVxdWVzdCBWYWxpZGF0aW9uJywgJ1JhdGUgTGltaXRpbmcnLCAnQ09SUyBTdXBwb3J0J10sXHJcbiAgICAgIG1ldHJpY3M6IHsgbGF0ZW5jeTogJzQ1bXMnLCB0aHJvdWdocHV0OiAnMTBLIHJlcS9zJywgdXB0aW1lOiAnOTkuOTklJyB9XHJcbiAgICB9LFxyXG4gICAgJ2NvbW1hbmQtc2VydmljZSc6IHtcclxuICAgICAgbmFtZTogJ0NvbW1hbmQgU2VydmljZScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ1FSUyBjb21tYW5kIHByb2Nlc3Npbmcgd2l0aCBldmVudCBzb3VyY2luZyBhbmQgc25hcHNob3RzJyxcclxuICAgICAgaWNvbjogWmFwLFxyXG4gICAgICBwb3NpdGlvbjogeyB4OiAzMDAsIHk6IDEwMCB9LFxyXG4gICAgICBjb2xvcjogJ2Zyb20tcHVycGxlLTUwMCB0by1waW5rLTUwMCcsXHJcbiAgICAgIGZlYXR1cmVzOiBbJ0V2ZW50IFNvdXJjaW5nJywgJ1NuYXBzaG90IE9wdGltaXphdGlvbicsICdDb21tYW5kIFZhbGlkYXRpb24nLCAnQ29ycmVsYXRpb24gVHJhY2tpbmcnXSxcclxuICAgICAgbWV0cmljczogeyBsYXRlbmN5OiAnMTIwbXMnLCB0aHJvdWdocHV0OiAnNUsgY21kL3MnLCB1cHRpbWU6ICc5OS45OSUnIH1cclxuICAgIH0sXHJcbiAgICAnZXZlbnQtc3RvcmUnOiB7XHJcbiAgICAgIG5hbWU6ICdFdmVudCBTdG9yZScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW1tdXRhYmxlIGV2ZW50IGxvZyB3aXRoIER5bmFtb0RCIGFuZCBDREMgc3RyZWFtcycsXHJcbiAgICAgIGljb246IERhdGFiYXNlLFxyXG4gICAgICBwb3NpdGlvbjogeyB4OiA1NTAsIHk6IDEwMCB9LFxyXG4gICAgICBjb2xvcjogJ2Zyb20tZ3JlZW4tNTAwIHRvLWVtZXJhbGQtNTAwJyxcclxuICAgICAgZmVhdHVyZXM6IFsnSW1tdXRhYmxlIExvZycsICdEeW5hbW9EQiBTdHJlYW1zJywgJ0F0b21pYyBXcml0ZXMnLCAnUG9pbnQtaW4tVGltZSBSZWNvdmVyeSddLFxyXG4gICAgICBtZXRyaWNzOiB7IGxhdGVuY3k6ICcyNW1zJywgdGhyb3VnaHB1dDogJzE1SyB3cml0ZXMvcycsIHVwdGltZTogJzk5Ljk5JScgfVxyXG4gICAgfSxcclxuICAgICdzY2hlbWEtcmVnaXN0cnknOiB7XHJcbiAgICAgIG5hbWU6ICdTY2hlbWEgUmVnaXN0cnknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FXUyBHbHVlLWJhc2VkIHNjaGVtYSB2YWxpZGF0aW9uIGFuZCBldm9sdXRpb24nLFxyXG4gICAgICBpY29uOiBTaGllbGQsXHJcbiAgICAgIHBvc2l0aW9uOiB7IHg6IDgwMCwgeTogNTAgfSxcclxuICAgICAgY29sb3I6ICdmcm9tLXllbGxvdy01MDAgdG8tb3JhbmdlLTUwMCcsXHJcbiAgICAgIGZlYXR1cmVzOiBbJ1NjaGVtYSBWYWxpZGF0aW9uJywgJ0JhY2t3YXJkIENvbXBhdGliaWxpdHknLCAnVmVyc2lvbiBNYW5hZ2VtZW50JywgJ0NJL0NEIEludGVncmF0aW9uJ10sXHJcbiAgICAgIG1ldHJpY3M6IHsgbGF0ZW5jeTogJzE1bXMnLCB0aHJvdWdocHV0OiAnMjBLIHZhbGlkYXRpb25zL3MnLCB1cHRpbWU6ICc5OS45OSUnIH1cclxuICAgIH0sXHJcbiAgICAnZXZlbnQtcm91dGVyJzoge1xyXG4gICAgICBuYW1lOiAnRXZlbnQgUm91dGVyJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdEdWFsLXBhdGggZXZlbnQgcm91dGluZyBmb3Igb3B0aW1hbCBjb3N0IGFuZCBwZXJmb3JtYW5jZScsXHJcbiAgICAgIGljb246IEdpdEJyYW5jaCxcclxuICAgICAgcG9zaXRpb246IHsgeDogNTUwLCB5OiAyNTAgfSxcclxuICAgICAgY29sb3I6ICdmcm9tLWluZGlnby01MDAgdG8tcHVycGxlLTUwMCcsXHJcbiAgICAgIGZlYXR1cmVzOiBbJ0R1YWwtUGF0aCBSb3V0aW5nJywgJ0Nvc3QgT3B0aW1pemF0aW9uJywgJ0xvYWQgQmFsYW5jaW5nJywgJ0NpcmN1aXQgQnJlYWtlciddLFxyXG4gICAgICBtZXRyaWNzOiB7IGxhdGVuY3k6ICczNW1zJywgdGhyb3VnaHB1dDogJzI1SyBldmVudHMvcycsIHVwdGltZTogJzk5Ljk5JScgfVxyXG4gICAgfSxcclxuICAgICdraW5lc2lzJzoge1xyXG4gICAgICBuYW1lOiAnS2luZXNpcyBTdHJlYW0nLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0hpZ2gtdGhyb3VnaHB1dCwgbG93LWxhdGVuY3kgc3RyZWFtIGZvciBjcml0aWNhbCBldmVudHMnLFxyXG4gICAgICBpY29uOiBBY3Rpdml0eSxcclxuICAgICAgcG9zaXRpb246IHsgeDogMzUwLCB5OiA0MDAgfSxcclxuICAgICAgY29sb3I6ICdmcm9tLXJlZC01MDAgdG8tcGluay01MDAnLFxyXG4gICAgICBmZWF0dXJlczogWydSZWFsLXRpbWUgUHJvY2Vzc2luZycsICdBdXRvIFNjYWxpbmcnLCAnT3JkZXJpbmcgR3VhcmFudGVlcycsICdSZXBsYXkgQ2FwYWJpbGl0eSddLFxyXG4gICAgICBtZXRyaWNzOiB7IGxhdGVuY3k6ICcyMDBtcycsIHRocm91Z2hwdXQ6ICcxMEsgZXZlbnRzL3MnLCB1cHRpbWU6ICc5OS45OSUnIH1cclxuICAgIH0sXHJcbiAgICAnc25zLXNxcyc6IHtcclxuICAgICAgbmFtZTogJ1NOUy9TUVMgQ2hhaW4nLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nvc3Qtb3B0aW1pemVkIGZhbi1vdXQgZm9yIG5vbi1jcml0aWNhbCBldmVudHMnLFxyXG4gICAgICBpY29uOiBOZXR3b3JrLFxyXG4gICAgICBwb3NpdGlvbjogeyB4OiA3NTAsIHk6IDQwMCB9LFxyXG4gICAgICBjb2xvcjogJ2Zyb20tY3lhbi01MDAgdG8tYmx1ZS01MDAnLFxyXG4gICAgICBmZWF0dXJlczogWydGYW4tb3V0IFBhdHRlcm4nLCAnRGVhZCBMZXR0ZXIgUXVldWVzJywgJ0Nvc3QgT3B0aW1pemF0aW9uJywgJ1JldHJ5IExvZ2ljJ10sXHJcbiAgICAgIG1ldHJpY3M6IHsgbGF0ZW5jeTogJzJzJywgdGhyb3VnaHB1dDogJzUwSyBldmVudHMvcycsIHVwdGltZTogJzk5Ljk5JScgfVxyXG4gICAgfSxcclxuICAgICdvcGVuc2VhcmNoJzoge1xyXG4gICAgICBuYW1lOiAnT3BlblNlYXJjaCcsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgZGFzaGJvYXJkIHdpdGggcHJvamVjdGlvbnMgYW5kIGZ1bGwtdGV4dCBzZWFyY2gnLFxyXG4gICAgICBpY29uOiBTZXJ2ZXIsXHJcbiAgICAgIHBvc2l0aW9uOiB7IHg6IDU1MCwgeTogNTUwIH0sXHJcbiAgICAgIGNvbG9yOiAnZnJvbS10ZWFsLTUwMCB0by1ncmVlbi01MDAnLFxyXG4gICAgICBmZWF0dXJlczogWydGdWxsLXRleHQgU2VhcmNoJywgJ1JlYWwtdGltZSBJbmRleGluZycsICdBZ2dyZWdhdGlvbnMnLCAnVGVtcG9yYWwgUXVlcmllcyddLFxyXG4gICAgICBtZXRyaWNzOiB7IGxhdGVuY3k6ICc4NW1zJywgdGhyb3VnaHB1dDogJzVLIHF1ZXJpZXMvcycsIHVwdGltZTogJzk5Ljk5JScgfVxyXG4gICAgfSxcclxuICAgICdwb2xpY3ktZW5naW5lJzoge1xyXG4gICAgICBuYW1lOiAnUG9saWN5IEVuZ2luZScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnT1BBLWJhc2VkIGdvdmVybmFuY2UgYW5kIGNvbXBsaWFuY2UgZW5mb3JjZW1lbnQnLFxyXG4gICAgICBpY29uOiBTaGllbGQsXHJcbiAgICAgIHBvc2l0aW9uOiB7IHg6IDUwLCB5OiAzMDAgfSxcclxuICAgICAgY29sb3I6ICdmcm9tLW9yYW5nZS01MDAgdG8tcmVkLTUwMCcsXHJcbiAgICAgIGZlYXR1cmVzOiBbJ1J1bnRpbWUgRW5mb3JjZW1lbnQnLCAnQ0kvQ0QgSW50ZWdyYXRpb24nLCAnQXVkaXQgTG9nZ2luZycsICdDb21wbGlhbmNlIENoZWNrcyddLFxyXG4gICAgICBtZXRyaWNzOiB7IGxhdGVuY3k6ICcxMG1zJywgdGhyb3VnaHB1dDogJzMwSyBjaGVja3MvcycsIHVwdGltZTogJzk5Ljk5JScgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGRhdGFGbG93UGF0aHMgPSBbXHJcbiAgICBbJ2FwaS1nYXRld2F5JywgJ2NvbW1hbmQtc2VydmljZScsICdldmVudC1zdG9yZScsICdldmVudC1yb3V0ZXInLCAna2luZXNpcycsICdvcGVuc2VhcmNoJ10sXHJcbiAgICBbJ2FwaS1nYXRld2F5JywgJ2NvbW1hbmQtc2VydmljZScsICdldmVudC1zdG9yZScsICdldmVudC1yb3V0ZXInLCAnc25zLXNxcycsICdvcGVuc2VhcmNoJ10sXHJcbiAgICBbJ3NjaGVtYS1yZWdpc3RyeScsICdldmVudC1zdG9yZSddLFxyXG4gICAgWydwb2xpY3ktZW5naW5lJywgJ2NvbW1hbmQtc2VydmljZSddXHJcbiAgXTtcclxuXHJcbiAgY29uc3QgYW5pbWF0ZURhdGFGbG93ID0gKCkgPT4ge1xyXG4gICAgc2V0SXNBbmltYXRpbmcodHJ1ZSk7XHJcbiAgICBzZXREYXRhRmxvdyhbXSk7XHJcbiAgICBcclxuICAgIGNvbnN0IHBhdGggPSBkYXRhRmxvd1BhdGhzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGRhdGFGbG93UGF0aHMubGVuZ3RoKV07XHJcbiAgICBcclxuICAgIHBhdGguZm9yRWFjaCgoY29tcG9uZW50LCBpbmRleCkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBzZXREYXRhRmxvdyhwcmV2ID0+IFsuLi5wcmV2LCBjb21wb25lbnRdKTtcclxuICAgICAgICBpZiAoaW5kZXggPT09IHBhdGgubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHNldERhdGFGbG93KFtdKTtcclxuICAgICAgICAgICAgc2V0SXNBbmltYXRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgfSwgMjAwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCBpbmRleCAqIDgwMCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGlmICghaXNBbmltYXRpbmcpIHtcclxuICAgICAgICBhbmltYXRlRGF0YUZsb3coKTtcclxuICAgICAgfVxyXG4gICAgfSwgODAwMCk7XHJcblxyXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gIH0sIFtpc0FuaW1hdGluZ10pO1xyXG5cclxuICBjb25zdCBnZXRDb25uZWN0aW9uTGluZXMgPSAoKSA9PiB7XHJcbiAgICBjb25zdCBjb25uZWN0aW9ucyA9IFtcclxuICAgICAgWydhcGktZ2F0ZXdheScsICdjb21tYW5kLXNlcnZpY2UnXSxcclxuICAgICAgWydjb21tYW5kLXNlcnZpY2UnLCAnZXZlbnQtc3RvcmUnXSxcclxuICAgICAgWydldmVudC1zdG9yZScsICdldmVudC1yb3V0ZXInXSxcclxuICAgICAgWydldmVudC1yb3V0ZXInLCAna2luZXNpcyddLFxyXG4gICAgICBbJ2V2ZW50LXJvdXRlcicsICdzbnMtc3FzJ10sXHJcbiAgICAgIFsna2luZXNpcycsICdvcGVuc2VhcmNoJ10sXHJcbiAgICAgIFsnc25zLXNxcycsICdvcGVuc2VhcmNoJ10sXHJcbiAgICAgIFsnc2NoZW1hLXJlZ2lzdHJ5JywgJ2V2ZW50LXN0b3JlJ10sXHJcbiAgICAgIFsncG9saWN5LWVuZ2luZScsICdjb21tYW5kLXNlcnZpY2UnXVxyXG4gICAgXTtcclxuXHJcbiAgICByZXR1cm4gY29ubmVjdGlvbnMubWFwKChbZnJvbSwgdG9dLCBpbmRleCkgPT4ge1xyXG4gICAgICBjb25zdCBmcm9tQ29tcCA9IGFyY2hpdGVjdHVyZUNvbXBvbmVudHNbZnJvbV07XHJcbiAgICAgIGNvbnN0IHRvQ29tcCA9IGFyY2hpdGVjdHVyZUNvbXBvbmVudHNbdG9dO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgaXNBY3RpdmUgPSBkYXRhRmxvdy5pbmNsdWRlcyhmcm9tKSAmJiBkYXRhRmxvdy5pbmNsdWRlcyh0bykgJiYgXHJcbiAgICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhkYXRhRmxvdy5pbmRleE9mKGZyb20pIC0gZGF0YUZsb3cuaW5kZXhPZih0bykpID09PSAxO1xyXG4gICAgICBcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICA8bW90aW9uLmxpbmVcclxuICAgICAgICAgIGtleT17YCR7ZnJvbX0tJHt0b31gfVxyXG4gICAgICAgICAgeDE9e2Zyb21Db21wLnBvc2l0aW9uLnggKyA3NX1cclxuICAgICAgICAgIHkxPXtmcm9tQ29tcC5wb3NpdGlvbi55ICsgNTB9XHJcbiAgICAgICAgICB4Mj17dG9Db21wLnBvc2l0aW9uLnggKyA3NX1cclxuICAgICAgICAgIHkyPXt0b0NvbXAucG9zaXRpb24ueSArIDUwfVxyXG4gICAgICAgICAgc3Ryb2tlPXtpc0FjdGl2ZSA/ICcjM2I4MmY2JyA6ICcjZmZmZmZmMjAnfVxyXG4gICAgICAgICAgc3Ryb2tlV2lkdGg9e2lzQWN0aXZlID8gMyA6IDF9XHJcbiAgICAgICAgICBzdHJva2VEYXNoYXJyYXk9e2lzQWN0aXZlID8gJzAnIDogJzUsNSd9XHJcbiAgICAgICAgICBpbml0aWFsPXt7IHBhdGhMZW5ndGg6IDAgfX1cclxuICAgICAgICAgIGFuaW1hdGU9e3sgcGF0aExlbmd0aDogMSB9fVxyXG4gICAgICAgICAgdHJhbnNpdGlvbj17eyBkdXJhdGlvbjogMC41LCBkZWxheTogaW5kZXggKiAwLjEgfX1cclxuICAgICAgICAvPlxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS02XCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi0yXCI+U3lzdGVtIEFyY2hpdGVjdHVyZTwvaDI+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNDAwXCI+RXZlbnQtc291cmNlZCBtaWNyb3NlcnZpY2VzIHdpdGggZ292ZXJuYW5jZS1maXJzdCBhcHByb2FjaDwvcD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICBcclxuICAgICAgICA8bW90aW9uLmJ1dHRvblxyXG4gICAgICAgICAgd2hpbGVIb3Zlcj17eyBzY2FsZTogMS4wNSB9fVxyXG4gICAgICAgICAgd2hpbGVUYXA9e3sgc2NhbGU6IDAuOTUgfX1cclxuICAgICAgICAgIG9uQ2xpY2s9e2FuaW1hdGVEYXRhRmxvd31cclxuICAgICAgICAgIGRpc2FibGVkPXtpc0FuaW1hdGluZ31cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMiBweC02IHB5LTMgYmctZ3JhZGllbnQtdG8tciBmcm9tLXB1cnBsZS01MDAgdG8tcGluay01MDAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIGZvbnQtbWVkaXVtIGRpc2FibGVkOm9wYWNpdHktNTBcIlxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxBY3Rpdml0eSBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cclxuICAgICAgICAgIDxzcGFuPntpc0FuaW1hdGluZyA/ICdBbmltYXRpbmcuLi4nIDogJ1Nob3cgRGF0YSBGbG93J308L3NwYW4+XHJcbiAgICAgICAgPC9tb3Rpb24uYnV0dG9uPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC04XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgaC1bNjAwcHhdIG92ZXJmbG93LWhpZGRlblwiPlxyXG4gICAgICAgICAgPHN2ZyBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHctZnVsbCBoLWZ1bGxcIj5cclxuICAgICAgICAgICAge2dldENvbm5lY3Rpb25MaW5lcygpfVxyXG4gICAgICAgICAgPC9zdmc+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHtPYmplY3QuZW50cmllcyhhcmNoaXRlY3R1cmVDb21wb25lbnRzKS5tYXAoKFtrZXksIGNvbXBvbmVudF0pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IHNlbGVjdGVkQ29tcG9uZW50ID09PSBrZXk7XHJcbiAgICAgICAgICAgIGNvbnN0IGlzSW5GbG93ID0gZGF0YUZsb3cuaW5jbHVkZXMoa2V5KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgICAgIGtleT17a2V5fVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgYWJzb2x1dGUgdy0zMiBoLTI0IGN1cnNvci1wb2ludGVyICR7XHJcbiAgICAgICAgICAgICAgICAgIGlzU2VsZWN0ZWQgPyAnei0yMCcgOiBpc0luRmxvdyA/ICd6LTEwJyA6ICd6LTAnXHJcbiAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IGNvbXBvbmVudC5wb3NpdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgICB0b3A6IGNvbXBvbmVudC5wb3NpdGlvbi55XHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgd2hpbGVIb3Zlcj17eyBzY2FsZTogMS4xLCB6OiAxNSB9fVxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2VsZWN0ZWRDb21wb25lbnQoaXNTZWxlY3RlZCA/IG51bGwgOiBrZXkpfVxyXG4gICAgICAgICAgICAgICAgYW5pbWF0ZT17e1xyXG4gICAgICAgICAgICAgICAgICBzY2FsZTogaXNJbkZsb3cgPyAxLjEgOiAxLFxyXG4gICAgICAgICAgICAgICAgICBib3hTaGFkb3c6IGlzSW5GbG93ID8gJzAgMCAyMHB4IHJnYmEoNTksIDEzMCwgMjQ2LCAwLjUpJyA6ICcwIDAgMHB4IHJnYmEoMCwwLDAsMCknXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy1mdWxsIGgtZnVsbCByb3VuZGVkLXhsIGJvcmRlciBiYWNrZHJvcC1ibHVyLXhsIHAtMyB0cmFuc2l0aW9uLWFsbCAke1xyXG4gICAgICAgICAgICAgICAgICBpc1NlbGVjdGVkIFxyXG4gICAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1ibHVlLTUwMC81MCBiZy1ibHVlLTUwMC8yMCcgXHJcbiAgICAgICAgICAgICAgICAgICAgOiBpc0luRmxvd1xyXG4gICAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1ibHVlLTQwMC81MCBiZy1ibHVlLTQwMC8xMCdcclxuICAgICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvMjAgYmctd2hpdGUvNSBob3Zlcjpib3JkZXItd2hpdGUvNDAnXHJcbiAgICAgICAgICAgICAgICB9YH0+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgaW5zZXQtMCBiZy1ncmFkaWVudC10by1iciAke2NvbXBvbmVudC5jb2xvcn0gb3BhY2l0eS0xMCByb3VuZGVkLXhsYH0gLz5cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgei0xMCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBoLWZ1bGxcIj5cclxuICAgICAgICAgICAgICAgICAgICA8Y29tcG9uZW50Lmljb24gY2xhc3NOYW1lPXtgdy02IGgtNiBtYi0xICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpc1NlbGVjdGVkID8gJ3RleHQtYmx1ZS00MDAnIDogaXNJbkZsb3cgPyAndGV4dC1ibHVlLTMwMCcgOiAndGV4dC13aGl0ZSdcclxuICAgICAgICAgICAgICAgICAgICB9YH0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1jZW50ZXIgbGVhZGluZy10aWdodCAke1xyXG4gICAgICAgICAgICAgICAgICAgICAgaXNTZWxlY3RlZCA/ICd0ZXh0LWJsdWUtMzAwJyA6IGlzSW5GbG93ID8gJ3RleHQtYmx1ZS0yMDAnIDogJ3RleHQtd2hpdGUnXHJcbiAgICAgICAgICAgICAgICAgICAgfWB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAge2NvbXBvbmVudC5uYW1lfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIHtpc0luRmxvdyAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYm9yZGVyLTIgYm9yZGVyLWJsdWUtNDAwIHJvdW5kZWQteGxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiBbMCwgMSwgMF0gfX1cclxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDEsIHJlcGVhdDogSW5maW5pdHkgfX1cclxuICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgPEFuaW1hdGVQcmVzZW5jZT5cclxuICAgICAgICB7c2VsZWN0ZWRDb21wb25lbnQgJiYgKFxyXG4gICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgICAgZXhpdD17eyBvcGFjaXR5OiAwLCB5OiAtMjAgfX1cclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC02XCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC04XCI+XHJcbiAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zIG1iLTRcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BwLTMgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1iciAke2FyY2hpdGVjdHVyZUNvbXBvbmVudHNbc2VsZWN0ZWRDb21wb25lbnRdLmNvbG9yfSBiZy1vcGFjaXR5LTIwYH0+XHJcbiAgICAgICAgICAgICAgICAgICAge1JlYWN0LmNyZWF0ZUVsZW1lbnQoYXJjaGl0ZWN0dXJlQ29tcG9uZW50c1tzZWxlY3RlZENvbXBvbmVudF0uaWNvbiwgeyBjbGFzc05hbWU6IFwidy04IGgtOCB0ZXh0LXdoaXRlXCIgfSl9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC13aGl0ZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2FyY2hpdGVjdHVyZUNvbXBvbmVudHNbc2VsZWN0ZWRDb21wb25lbnRdLm5hbWV9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9oMz5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNDAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7YXJjaGl0ZWN0dXJlQ29tcG9uZW50c1tzZWxlY3RlZENvbXBvbmVudF0uZGVzY3JpcHRpb259XHJcbiAgICAgICAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxyXG4gICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LXNlbWlib2xkIHRleHQtd2hpdGVcIj5LZXkgRmVhdHVyZXM8L2g0PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICB7YXJjaGl0ZWN0dXJlQ29tcG9uZW50c1tzZWxlY3RlZENvbXBvbmVudF0uZmVhdHVyZXMubWFwKChmZWF0dXJlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IChcclxuICAgICAgICAgICAgICAgICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17ZmVhdHVyZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB4OiAtMTAgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB4OiAwIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IGluZGV4ICogMC4xIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMiBwLTIgYmctd2hpdGUvMTAgcm91bmRlZC1sZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxDaGVja0NpcmNsZSBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXdoaXRlXCI+e2ZlYXR1cmV9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LXNlbWlib2xkIHRleHQtd2hpdGUgbWItNFwiPlBlcmZvcm1hbmNlIE1ldHJpY3M8L2g0PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYmctZ3JhZGllbnQtdG8tciBmcm9tLWJsdWUtNTAwLzIwIHRvLXB1cnBsZS01MDAvMjAgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWJsdWUtNTAwLzMwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTMwMFwiPkxhdGVuY3kgKHA5OSk8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8Q2xvY2sgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWJsdWUtNDAwXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LWJsdWUtNDAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7YXJjaGl0ZWN0dXJlQ29tcG9uZW50c1tzZWxlY3RlZENvbXBvbmVudF0ubWV0cmljcy5sYXRlbmN5fVxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1ncmVlbi01MDAvMjAgdG8tZW1lcmFsZC01MDAvMjAgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWdyZWVuLTUwMC8zMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS0zMDBcIj5UaHJvdWdocHV0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPEFjdGl2aXR5IGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1ncmVlbi00MDBcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIHRleHQtZ3JlZW4tNDAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7YXJjaGl0ZWN0dXJlQ29tcG9uZW50c1tzZWxlY3RlZENvbXBvbmVudF0ubWV0cmljcy50aHJvdWdocHV0fVxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1wdXJwbGUtNTAwLzIwIHRvLXBpbmstNTAwLzIwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1wdXJwbGUtNTAwLzMwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTMwMFwiPlVwdGltZTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxDaGVja0NpcmNsZSBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtcHVycGxlLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1wdXJwbGUtNDAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7YXJjaGl0ZWN0dXJlQ29tcG9uZW50c1tzZWxlY3RlZENvbXBvbmVudF0ubWV0cmljcy51cHRpbWV9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvQW5pbWF0ZVByZXNlbmNlPlxyXG5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGdhcC02XCI+XHJcbiAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX1cclxuICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgdHJhbnNpdGlvbj17eyBkZWxheTogMC4xIH19XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iciBmcm9tLWJsdWUtNTAwLzIwIHRvLXB1cnBsZS01MDAvMjAgYmFja2Ryb3AtYmx1ci14bCBib3JkZXIgYm9yZGVyLWJsdWUtNTAwLzMwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTMgbWItNFwiPlxyXG4gICAgICAgICAgICA8U2hpZWxkIGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1ibHVlLTQwMFwiIC8+XHJcbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlXCI+R292ZXJuYW5jZSBGaXJzdDwvaDM+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtZ3JheS0zMDAgbWItNFwiPlxyXG4gICAgICAgICAgICBTY2hlbWEgdmFsaWRhdGlvbiBhbmQgcG9saWN5IGVuZm9yY2VtZW50IGFyZSBidWlsdCBpbnRvIHRoZSBmb3VuZGF0aW9uLCBub3QgYWRkZWQgYXMgYW4gYWZ0ZXJ0aG91Z2h0LlxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktMzAwXCI+UHJlLWRlcGxveW1lbnQgdmFsaWRhdGlvbjwvc3Bhbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0yXCI+XHJcbiAgICAgICAgICAgICAgPENoZWNrQ2lyY2xlIGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1ncmVlbi00MDBcIiAvPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTMwMFwiPlJ1bnRpbWUgcG9saWN5IGVuZm9yY2VtZW50PC9zcGFuPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktMzAwXCI+QXVkaXQgdHJhaWwgY29tcGxldGVuZXNzPC9zcGFuPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuXHJcbiAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX1cclxuICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgdHJhbnNpdGlvbj17eyBkZWxheTogMC4yIH19XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iciBmcm9tLWdyZWVuLTUwMC8yMCB0by1lbWVyYWxkLTUwMC8yMCBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItZ3JlZW4tNTAwLzMwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTMgbWItNFwiPlxyXG4gICAgICAgICAgICA8R2l0QnJhbmNoIGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1ncmVlbi00MDBcIiAvPlxyXG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC13aGl0ZVwiPkR1YWwtUGF0aCBSb3V0aW5nPC9oMz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1ncmF5LTMwMCBtYi00XCI+XHJcbiAgICAgICAgICAgIEludGVsbGlnZW50IGV2ZW50IHJvdXRpbmcgb3B0aW1pemVzIGZvciBib3RoIHBlcmZvcm1hbmNlIGFuZCBjb3N0IGJhc2VkIG9uIGV2ZW50IGNyaXRpY2FsaXR5LlxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktMzAwXCI+S2luZXNpcyBmb3IgY3JpdGljYWwgZXZlbnRzPC9zcGFuPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktMzAwXCI+U05TL1NRUyBmb3IgY29zdCBvcHRpbWl6YXRpb248L3NwYW4+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMlwiPlxyXG4gICAgICAgICAgICAgIDxDaGVja0NpcmNsZSBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS0zMDBcIj43MyUgY29zdCByZWR1Y3Rpb248L3NwYW4+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG5cclxuICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XHJcbiAgICAgICAgICB0cmFuc2l0aW9uPXt7IGRlbGF5OiAwLjMgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLWJyIGZyb20tcHVycGxlLTUwMC8yMCB0by1waW5rLTUwMC8yMCBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItcHVycGxlLTUwMC8zMCByb3VuZGVkLTJ4bCBwLTZcIlxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zIG1iLTRcIj5cclxuICAgICAgICAgICAgPERhdGFiYXNlIGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1wdXJwbGUtNDAwXCIgLz5cclxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGVcIj5FdmVudCBTb3VyY2luZzwvaDM+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtZ3JheS0zMDAgbWItNFwiPlxyXG4gICAgICAgICAgICBDb21wbGV0ZSBhdWRpdCB0cmFpbCB3aXRoIHNuYXBzaG90IG9wdGltaXphdGlvbiBmb3IgcGVyZm9ybWFuY2UgYW5kIHRlbXBvcmFsIHF1ZXJpZXMuXHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMlwiPlxyXG4gICAgICAgICAgICAgIDxDaGVja0NpcmNsZSBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS0zMDBcIj5JbW11dGFibGUgZXZlbnQgbG9nPC9zcGFuPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktMzAwXCI+U25hcHNob3Qgb3B0aW1pemF0aW9uPC9zcGFuPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWdyZWVuLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktMzAwXCI+UG9pbnQtaW4tdGltZSByZWNvdmVyeTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFyY2hpdGVjdHVyZVZpZXc7XHJcbiJdfQ==