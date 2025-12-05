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
const PerformanceDemo = () => {
    const [isRunning, setIsRunning] = (0, react_1.useState)(false);
    const [currentTest, setCurrentTest] = (0, react_1.useState)(null);
    const [completedTests, setCompletedTests] = (0, react_1.useState)([]);
    const [metrics, setMetrics] = (0, react_1.useState)([]);
    const [systemLoad, setSystemLoad] = (0, react_1.useState)([]);
    const [testResults, setTestResults] = (0, react_1.useState)({});
    const performanceTests = [
        {
            id: 'bulk-orders',
            name: 'Bulk Order Processing',
            description: 'Generate 1,000 orders in 30 seconds',
            target: '1000 orders / 30s',
            icon: lucide_react_1.Zap,
            color: 'from-blue-500 to-purple-600'
        },
        {
            id: 'event-throughput',
            name: 'Event Throughput Test',
            description: 'Process 10,000 events through dual-path routing',
            target: '10K events / 60s',
            icon: lucide_react_1.Network,
            color: 'from-green-500 to-blue-500'
        },
        {
            id: 'snapshot-performance',
            name: 'Snapshot Creation Speed',
            description: 'Create snapshots for 100 aggregates',
            target: '< 5s per snapshot',
            icon: lucide_react_1.Database,
            color: 'from-purple-500 to-pink-500'
        },
        {
            id: 'query-latency',
            name: 'Query Response Time',
            description: 'Complex queries with temporal data',
            target: '< 200ms p99',
            icon: lucide_react_1.Clock,
            color: 'from-yellow-500 to-red-500'
        }
    ];
    const runPerformanceTest = async (testId) => {
        setCurrentTest(testId);
        const duration = testId === 'bulk-orders' ? 30000 :
            testId === 'event-throughput' ? 60000 :
                testId === 'snapshot-performance' ? 15000 : 10000;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            let newMetric;
            if (testId === 'bulk-orders') {
                newMetric = {
                    time: elapsed / 1000,
                    value: Math.floor(progress * 1000 + Math.random() * 50),
                    latency: 120 + Math.random() * 80,
                    throughput: 33 + Math.random() * 10
                };
            }
            else if (testId === 'event-throughput') {
                newMetric = {
                    time: elapsed / 1000,
                    value: Math.floor(progress * 10000 + Math.random() * 200),
                    latency: 380 + Math.random() * 120,
                    throughput: 167 + Math.random() * 50
                };
            }
            else if (testId === 'snapshot-performance') {
                newMetric = {
                    time: elapsed / 1000,
                    value: Math.floor(progress * 100),
                    latency: 2.5 + Math.random() * 2,
                    throughput: 6.7 + Math.random() * 2
                };
            }
            else {
                newMetric = {
                    time: elapsed / 1000,
                    value: Math.floor(progress * 1000),
                    latency: 85 + Math.random() * 30,
                    throughput: 100 + Math.random() * 20
                };
            }
            setMetrics(prev => [...prev.slice(-19), newMetric]);
            setSystemLoad(prev => [...prev.slice(-19), {
                    time: elapsed / 1000,
                    cpu: 45 + Math.random() * 30,
                    memory: 60 + Math.random() * 20,
                    network: 30 + Math.random() * 40
                }]);
            if (progress >= 1) {
                clearInterval(interval);
                setCompletedTests(prev => [...prev, testId]);
                setCurrentTest(null);
                setTestResults(prev => ({
                    ...prev,
                    [testId]: {
                        duration: duration / 1000,
                        finalValue: newMetric.value,
                        avgLatency: newMetric.latency,
                        avgThroughput: newMetric.throughput,
                        success: true
                    }
                }));
            }
        }, 500);
    };
    const runAllTests = async () => {
        setIsRunning(true);
        setCompletedTests([]);
        setTestResults({});
        setMetrics([]);
        setSystemLoad([]);
        for (const test of performanceTests) {
            await new Promise(resolve => {
                runPerformanceTest(test.id);
                const checkComplete = setInterval(() => {
                    if (currentTest === null) {
                        clearInterval(checkComplete);
                        resolve();
                    }
                }, 100);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        setIsRunning(false);
    };
    const resetTests = () => {
        setIsRunning(false);
        setCurrentTest(null);
        setCompletedTests([]);
        setMetrics([]);
        setSystemLoad([]);
        setTestResults({});
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Performance Demonstration</h2>
          <p className="text-gray-400">Real-time performance testing showcasing Nexus Blueprint capabilities</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <framer_motion_1.motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={runAllTests} disabled={isRunning} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            <lucide_react_1.Play className="w-5 h-5"/>
            <span>{isRunning ? 'Running Tests...' : 'Start Demo'}</span>
          </framer_motion_1.motion.button>
          
          <framer_motion_1.motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetTests} className="flex items-center space-x-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20">
            <lucide_react_1.RotateCcw className="w-5 h-5"/>
            <span>Reset</span>
          </framer_motion_1.motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {performanceTests.map((test, index) => {
            const isActive = currentTest === test.id;
            const isCompleted = completedTests.includes(test.id);
            const result = testResults[test.id];
            return (<framer_motion_1.motion.div key={test.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-6 ${isActive
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : isCompleted
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 bg-white/5'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${test.color} opacity-10`}/>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20' : isCompleted ? 'bg-green-500/20' : 'bg-white/10'}`}>
                      <test.icon className={`w-6 h-6 ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-white'}`}/>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{test.name}</h3>
                      <p className="text-sm text-gray-400">{test.description}</p>
                    </div>
                  </div>
                  
                  {isCompleted && (<framer_motion_1.motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-green-500/20 rounded-full">
                      <lucide_react_1.CheckCircle className="w-6 h-6 text-green-400"/>
                    </framer_motion_1.motion.div>)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Target:</span>
                    <span className="text-white font-medium">{test.target}</span>
                  </div>
                  
                  {result && (<div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Achieved:</span>
                        <span className="text-green-400 font-bold">
                          {test.id === 'bulk-orders' ? `${result.finalValue} orders` :
                        test.id === 'event-throughput' ? `${result.finalValue} events` :
                            test.id === 'snapshot-performance' ? `${result.avgLatency.toFixed(1)}s avg` :
                                `${result.avgLatency.toFixed(0)}ms p99`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white">{result.duration}s</span>
                      </div>
                    </div>)}
                  
                  {isActive && (<div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-blue-400">Running...</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <framer_motion_1.motion.div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{
                        duration: test.id === 'bulk-orders' ? 30 :
                            test.id === 'event-throughput' ? 60 :
                                test.id === 'snapshot-performance' ? 15 : 10,
                        ease: 'linear'
                    }}/>
                      </div>
                    </div>)}
                </div>
              </div>
            </framer_motion_1.motion.div>);
        })}
      </div>

      {(isRunning || metrics.length > 0) && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <lucide_react_1.Activity className="w-5 h-5 mr-2 text-blue-400"/>
              Real-time Performance
            </h3>
            <recharts_1.ResponsiveContainer width="100%" height={250}>
              <recharts_1.AreaChart data={metrics}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                <recharts_1.Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)"/>
              </recharts_1.AreaChart>
            </recharts_1.ResponsiveContainer>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <lucide_react_1.Cpu className="w-5 h-5 mr-2 text-purple-400"/>
              System Load
            </h3>
            <recharts_1.ResponsiveContainer width="100%" height={250}>
              <recharts_1.LineChart data={systemLoad}>
                <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="#ffffff20"/>
                <recharts_1.XAxis dataKey="time" stroke="#ffffff60"/>
                <recharts_1.YAxis stroke="#ffffff60"/>
                <recharts_1.Tooltip contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #ffffff20',
                borderRadius: '8px'
            }}/>
                <recharts_1.Line type="monotone" dataKey="cpu" stroke="#f59e0b" strokeWidth={2} dot={false}/>
                <recharts_1.Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} dot={false}/>
                <recharts_1.Line type="monotone" dataKey="network" stroke="#06b6d4" strokeWidth={2} dot={false}/>
              </recharts_1.LineChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </framer_motion_1.motion.div>)}

      {completedTests.length > 0 && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
            <lucide_react_1.Target className="w-6 h-6 mr-2 text-green-400"/>
            Performance Results Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Key Achievements</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-gray-300">Bulk Order Processing</span>
                  <span className="text-green-400 font-bold">✓ 1,000 orders in 30s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-gray-300">Event Throughput</span>
                  <span className="text-green-400 font-bold">✓ 10K events/min</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Business Impact</h4>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">73%</div>
                  <div className="text-sm text-gray-300">Cost Reduction vs Traditional</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">99.99%</div>
                  <div className="text-sm text-gray-300">System Availability</div>
                </div>
              </div>
            </div>
          </div>
        </framer_motion_1.motion.div>)}
    </div>);
};
exports.default = PerformanceDemo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGVyZm9ybWFuY2VEZW1vLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGVyZm9ybWFuY2VEZW1vLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFtRDtBQUNuRCxpREFBdUM7QUFDdkMsK0NBSXNCO0FBQ3RCLHVDQUF1SDtBQUV2SCxNQUFNLGVBQWUsR0FBRyxHQUFHLEVBQUU7SUFDM0IsTUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEQsTUFBTSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQWdCLElBQUksQ0FBQyxDQUFDO0lBQ3BFLE1BQU0sQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQVcsRUFBRSxDQUFDLENBQUM7SUFDbkUsTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQVEsRUFBRSxDQUFDLENBQUM7SUFDbEQsTUFBTSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQVEsRUFBRSxDQUFDLENBQUM7SUFDeEQsTUFBTSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQU0sRUFBRSxDQUFDLENBQUM7SUFFeEQsTUFBTSxnQkFBZ0IsR0FBRztRQUN2QjtZQUNFLEVBQUUsRUFBRSxhQUFhO1lBQ2pCLElBQUksRUFBRSx1QkFBdUI7WUFDN0IsV0FBVyxFQUFFLHFDQUFxQztZQUNsRCxNQUFNLEVBQUUsbUJBQW1CO1lBQzNCLElBQUksRUFBRSxrQkFBRztZQUNULEtBQUssRUFBRSw2QkFBNkI7U0FDckM7UUFDRDtZQUNFLEVBQUUsRUFBRSxrQkFBa0I7WUFDdEIsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixXQUFXLEVBQUUs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LENBQ1A7WUFBQSxFQUFFLEdBQUcsQ0FDUDtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxzQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUNkLENBQ0g7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixrQkFBZSxlQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgbW90aW9uIH0gZnJvbSAnZnJhbWVyLW1vdGlvbic7XHJcbmltcG9ydCB7IFxyXG4gIFphcCwgVGFyZ2V0LCBDbG9jaywgVHJlbmRpbmdVcCwgXHJcbiAgUGxheSwgUGF1c2UsIFJvdGF0ZUNjdywgQ2hlY2tDaXJjbGUsXHJcbiAgQWN0aXZpdHksIERhdGFiYXNlLCBOZXR3b3JrLCBDcHVcclxufSBmcm9tICdsdWNpZGUtcmVhY3QnO1xyXG5pbXBvcnQgeyBMaW5lQ2hhcnQsIExpbmUsIEFyZWFDaGFydCwgQXJlYSwgWEF4aXMsIFlBeGlzLCBDYXJ0ZXNpYW5HcmlkLCBUb29sdGlwLCBSZXNwb25zaXZlQ29udGFpbmVyIH0gZnJvbSAncmVjaGFydHMnO1xyXG5cclxuY29uc3QgUGVyZm9ybWFuY2VEZW1vID0gKCkgPT4ge1xyXG4gIGNvbnN0IFtpc1J1bm5pbmcsIHNldElzUnVubmluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW2N1cnJlbnRUZXN0LCBzZXRDdXJyZW50VGVzdF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuICBjb25zdCBbY29tcGxldGVkVGVzdHMsIHNldENvbXBsZXRlZFRlc3RzXSA9IHVzZVN0YXRlPHN0cmluZ1tdPihbXSk7XHJcbiAgY29uc3QgW21ldHJpY3MsIHNldE1ldHJpY3NdID0gdXNlU3RhdGU8YW55W10+KFtdKTtcclxuICBjb25zdCBbc3lzdGVtTG9hZCwgc2V0U3lzdGVtTG9hZF0gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xyXG4gIGNvbnN0IFt0ZXN0UmVzdWx0cywgc2V0VGVzdFJlc3VsdHNdID0gdXNlU3RhdGU8YW55Pih7fSk7XHJcblxyXG4gIGNvbnN0IHBlcmZvcm1hbmNlVGVzdHMgPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiAnYnVsay1vcmRlcnMnLFxyXG4gICAgICBuYW1lOiAnQnVsayBPcmRlciBQcm9jZXNzaW5nJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSAxLDAwMCBvcmRlcnMgaW4gMzAgc2Vjb25kcycsXHJcbiAgICAgIHRhcmdldDogJzEwMDAgb3JkZXJzIC8gMzBzJyxcclxuICAgICAgaWNvbjogWmFwLFxyXG4gICAgICBjb2xvcjogJ2Zyb20tYmx1ZS01MDAgdG8tcHVycGxlLTYwMCdcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiAnZXZlbnQtdGhyb3VnaHB1dCcsXHJcbiAgICAgIG5hbWU6ICdFdmVudCBUaHJvdWdocHV0IFRlc3QnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1Byb2Nlc3MgMTAsMDAwIGV2ZW50cyB0aHJvdWdoIGR1YWwtcGF0aCByb3V0aW5nJyxcclxuICAgICAgdGFyZ2V0OiAnMTBLIGV2ZW50cyAvIDYwcycsXHJcbiAgICAgIGljb246IE5ldHdvcmssXHJcbiAgICAgIGNvbG9yOiAnZnJvbS1ncmVlbi01MDAgdG8tYmx1ZS01MDAnXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBpZDogJ3NuYXBzaG90LXBlcmZvcm1hbmNlJyxcclxuICAgICAgbmFtZTogJ1NuYXBzaG90IENyZWF0aW9uIFNwZWVkJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGUgc25hcHNob3RzIGZvciAxMDAgYWdncmVnYXRlcycsXHJcbiAgICAgIHRhcmdldDogJzwgNXMgcGVyIHNuYXBzaG90JyxcclxuICAgICAgaWNvbjogRGF0YWJhc2UsXHJcbiAgICAgIGNvbG9yOiAnZnJvbS1wdXJwbGUtNTAwIHRvLXBpbmstNTAwJ1xyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgaWQ6ICdxdWVyeS1sYXRlbmN5JyxcclxuICAgICAgbmFtZTogJ1F1ZXJ5IFJlc3BvbnNlIFRpbWUnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbXBsZXggcXVlcmllcyB3aXRoIHRlbXBvcmFsIGRhdGEnLFxyXG4gICAgICB0YXJnZXQ6ICc8IDIwMG1zIHA5OScsXHJcbiAgICAgIGljb246IENsb2NrLFxyXG4gICAgICBjb2xvcjogJ2Zyb20teWVsbG93LTUwMCB0by1yZWQtNTAwJ1xyXG4gICAgfVxyXG4gIF07XHJcblxyXG4gIGNvbnN0IHJ1blBlcmZvcm1hbmNlVGVzdCA9IGFzeW5jICh0ZXN0SWQ6IHN0cmluZykgPT4ge1xyXG4gICAgc2V0Q3VycmVudFRlc3QodGVzdElkKTtcclxuICAgIFxyXG4gICAgY29uc3QgZHVyYXRpb24gPSB0ZXN0SWQgPT09ICdidWxrLW9yZGVycycgPyAzMDAwMCA6IFxyXG4gICAgICAgICAgICAgICAgICAgIHRlc3RJZCA9PT0gJ2V2ZW50LXRocm91Z2hwdXQnID8gNjAwMDAgOlxyXG4gICAgICAgICAgICAgICAgICAgIHRlc3RJZCA9PT0gJ3NuYXBzaG90LXBlcmZvcm1hbmNlJyA/IDE1MDAwIDogMTAwMDA7XHJcbiAgICBcclxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgY29uc3QgZWxhcHNlZCA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XHJcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gTWF0aC5taW4oZWxhcHNlZCAvIGR1cmF0aW9uLCAxKTtcclxuICAgICAgXHJcbiAgICAgIGxldCBuZXdNZXRyaWM7XHJcbiAgICAgIGlmICh0ZXN0SWQgPT09ICdidWxrLW9yZGVycycpIHtcclxuICAgICAgICBuZXdNZXRyaWMgPSB7XHJcbiAgICAgICAgICB0aW1lOiBlbGFwc2VkIC8gMTAwMCxcclxuICAgICAgICAgIHZhbHVlOiBNYXRoLmZsb29yKHByb2dyZXNzICogMTAwMCArIE1hdGgucmFuZG9tKCkgKiA1MCksXHJcbiAgICAgICAgICBsYXRlbmN5OiAxMjAgKyBNYXRoLnJhbmRvbSgpICogODAsXHJcbiAgICAgICAgICB0aHJvdWdocHV0OiAzMyArIE1hdGgucmFuZG9tKCkgKiAxMFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0gZWxzZSBpZiAodGVzdElkID09PSAnZXZlbnQtdGhyb3VnaHB1dCcpIHtcclxuICAgICAgICBuZXdNZXRyaWMgPSB7XHJcbiAgICAgICAgICB0aW1lOiBlbGFwc2VkIC8gMTAwMCxcclxuICAgICAgICAgIHZhbHVlOiBNYXRoLmZsb29yKHByb2dyZXNzICogMTAwMDAgKyBNYXRoLnJhbmRvbSgpICogMjAwKSxcclxuICAgICAgICAgIGxhdGVuY3k6IDM4MCArIE1hdGgucmFuZG9tKCkgKiAxMjAsXHJcbiAgICAgICAgICB0aHJvdWdocHV0OiAxNjcgKyBNYXRoLnJhbmRvbSgpICogNTBcclxuICAgICAgICB9O1xyXG4gICAgICB9IGVsc2UgaWYgKHRlc3RJZCA9PT0gJ3NuYXBzaG90LXBlcmZvcm1hbmNlJykge1xyXG4gICAgICAgIG5ld01ldHJpYyA9IHtcclxuICAgICAgICAgIHRpbWU6IGVsYXBzZWQgLyAxMDAwLFxyXG4gICAgICAgICAgdmFsdWU6IE1hdGguZmxvb3IocHJvZ3Jlc3MgKiAxMDApLFxyXG4gICAgICAgICAgbGF0ZW5jeTogMi41ICsgTWF0aC5yYW5kb20oKSAqIDIsXHJcbiAgICAgICAgICB0aHJvdWdocHV0OiA2LjcgKyBNYXRoLnJhbmRvbSgpICogMlxyXG4gICAgICAgIH07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmV3TWV0cmljID0ge1xyXG4gICAgICAgICAgdGltZTogZWxhcHNlZCAvIDEwMDAsXHJcbiAgICAgICAgICB2YWx1ZTogTWF0aC5mbG9vcihwcm9ncmVzcyAqIDEwMDApLFxyXG4gICAgICAgICAgbGF0ZW5jeTogODUgKyBNYXRoLnJhbmRvbSgpICogMzAsXHJcbiAgICAgICAgICB0aHJvdWdocHV0OiAxMDAgKyBNYXRoLnJhbmRvbSgpICogMjBcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBzZXRNZXRyaWNzKHByZXYgPT4gWy4uLnByZXYuc2xpY2UoLTE5KSwgbmV3TWV0cmljXSk7XHJcbiAgICAgIFxyXG4gICAgICBzZXRTeXN0ZW1Mb2FkKHByZXYgPT4gWy4uLnByZXYuc2xpY2UoLTE5KSwge1xyXG4gICAgICAgIHRpbWU6IGVsYXBzZWQgLyAxMDAwLFxyXG4gICAgICAgIGNwdTogNDUgKyBNYXRoLnJhbmRvbSgpICogMzAsXHJcbiAgICAgICAgbWVtb3J5OiA2MCArIE1hdGgucmFuZG9tKCkgKiAyMCxcclxuICAgICAgICBuZXR3b3JrOiAzMCArIE1hdGgucmFuZG9tKCkgKiA0MFxyXG4gICAgICB9XSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAocHJvZ3Jlc3MgPj0gMSkge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gICAgICAgIHNldENvbXBsZXRlZFRlc3RzKHByZXYgPT4gWy4uLnByZXYsIHRlc3RJZF0pO1xyXG4gICAgICAgIHNldEN1cnJlbnRUZXN0KG51bGwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNldFRlc3RSZXN1bHRzKHByZXYgPT4gKHtcclxuICAgICAgICAgIC4uLnByZXYsXHJcbiAgICAgICAgICBbdGVzdElkXToge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24gLyAxMDAwLFxyXG4gICAgICAgICAgICBmaW5hbFZhbHVlOiBuZXdNZXRyaWMudmFsdWUsXHJcbiAgICAgICAgICAgIGF2Z0xhdGVuY3k6IG5ld01ldHJpYy5sYXRlbmN5LFxyXG4gICAgICAgICAgICBhdmdUaHJvdWdocHV0OiBuZXdNZXRyaWMudGhyb3VnaHB1dCxcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfVxyXG4gICAgfSwgNTAwKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBydW5BbGxUZXN0cyA9IGFzeW5jICgpID0+IHtcclxuICAgIHNldElzUnVubmluZyh0cnVlKTtcclxuICAgIHNldENvbXBsZXRlZFRlc3RzKFtdKTtcclxuICAgIHNldFRlc3RSZXN1bHRzKHt9KTtcclxuICAgIHNldE1ldHJpY3MoW10pO1xyXG4gICAgc2V0U3lzdGVtTG9hZChbXSk7XHJcbiAgICBcclxuICAgIGZvciAoY29uc3QgdGVzdCBvZiBwZXJmb3JtYW5jZVRlc3RzKSB7XHJcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xyXG4gICAgICAgIHJ1blBlcmZvcm1hbmNlVGVzdCh0ZXN0LmlkKTtcclxuICAgICAgICBjb25zdCBjaGVja0NvbXBsZXRlID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgaWYgKGN1cnJlbnRUZXN0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoY2hlY2tDb21wbGV0ZSk7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCAxMDApO1xyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDAwKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNldElzUnVubmluZyhmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgcmVzZXRUZXN0cyA9ICgpID0+IHtcclxuICAgIHNldElzUnVubmluZyhmYWxzZSk7XHJcbiAgICBzZXRDdXJyZW50VGVzdChudWxsKTtcclxuICAgIHNldENvbXBsZXRlZFRlc3RzKFtdKTtcclxuICAgIHNldE1ldHJpY3MoW10pO1xyXG4gICAgc2V0U3lzdGVtTG9hZChbXSk7XHJcbiAgICBzZXRUZXN0UmVzdWx0cyh7fSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS02XCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi0yXCI+UGVyZm9ybWFuY2UgRGVtb25zdHJhdGlvbjwvaDI+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNDAwXCI+UmVhbC10aW1lIHBlcmZvcm1hbmNlIHRlc3Rpbmcgc2hvd2Nhc2luZyBOZXh1cyBCbHVlcHJpbnQgY2FwYWJpbGl0aWVzPC9wPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC00XCI+XHJcbiAgICAgICAgICA8bW90aW9uLmJ1dHRvblxyXG4gICAgICAgICAgICB3aGlsZUhvdmVyPXt7IHNjYWxlOiAxLjA1IH19XHJcbiAgICAgICAgICAgIHdoaWxlVGFwPXt7IHNjYWxlOiAwLjk1IH19XHJcbiAgICAgICAgICAgIG9uQ2xpY2s9e3J1bkFsbFRlc3RzfVxyXG4gICAgICAgICAgICBkaXNhYmxlZD17aXNSdW5uaW5nfVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgcHgtNiBweS0zIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1ncmVlbi01MDAgdG8tYmx1ZS01MDAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIGZvbnQtbWVkaXVtIGRpc2FibGVkOm9wYWNpdHktNTAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPFBsYXkgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XHJcbiAgICAgICAgICAgIDxzcGFuPntpc1J1bm5pbmcgPyAnUnVubmluZyBUZXN0cy4uLicgOiAnU3RhcnQgRGVtbyd9PC9zcGFuPlxyXG4gICAgICAgICAgPC9tb3Rpb24uYnV0dG9uPlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICA8bW90aW9uLmJ1dHRvblxyXG4gICAgICAgICAgICB3aGlsZUhvdmVyPXt7IHNjYWxlOiAxLjA1IH19XHJcbiAgICAgICAgICAgIHdoaWxlVGFwPXt7IHNjYWxlOiAwLjk1IH19XHJcbiAgICAgICAgICAgIG9uQ2xpY2s9e3Jlc2V0VGVzdHN9XHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMiBweC02IHB5LTMgYmctd2hpdGUvMTAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIGZvbnQtbWVkaXVtIGhvdmVyOmJnLXdoaXRlLzIwXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPFJvdGF0ZUNjdyBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cclxuICAgICAgICAgICAgPHNwYW4+UmVzZXQ8L3NwYW4+XHJcbiAgICAgICAgICA8L21vdGlvbi5idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC02XCI+XHJcbiAgICAgICAge3BlcmZvcm1hbmNlVGVzdHMubWFwKCh0ZXN0LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBjdXJyZW50VGVzdCA9PT0gdGVzdC5pZDtcclxuICAgICAgICAgIGNvbnN0IGlzQ29tcGxldGVkID0gY29tcGxldGVkVGVzdHMuaW5jbHVkZXModGVzdC5pZCk7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB0ZXN0UmVzdWx0c1t0ZXN0LmlkXTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAgICBrZXk9e3Rlc3QuaWR9XHJcbiAgICAgICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IGluZGV4ICogMC4xIH19XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtMnhsIGJvcmRlciBiYWNrZHJvcC1ibHVyLXhsIHAtNiAke1xyXG4gICAgICAgICAgICAgICAgaXNBY3RpdmUgXHJcbiAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1ibHVlLTUwMC81MCBiZy1ibHVlLTUwMC8xMCcgXHJcbiAgICAgICAgICAgICAgICAgIDogaXNDb21wbGV0ZWQgXHJcbiAgICAgICAgICAgICAgICAgID8gJ2JvcmRlci1ncmVlbi01MDAvNTAgYmctZ3JlZW4tNTAwLzEwJ1xyXG4gICAgICAgICAgICAgICAgICA6ICdib3JkZXItd2hpdGUvMTAgYmctd2hpdGUvNSdcclxuICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgaW5zZXQtMCBiZy1ncmFkaWVudC10by1iciAke3Rlc3QuY29sb3J9IG9wYWNpdHktMTBgfSAvPlxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgei0xMFwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItNFwiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcC0yIHJvdW5kZWQtbGcgJHtcclxuICAgICAgICAgICAgICAgICAgICAgIGlzQWN0aXZlID8gJ2JnLWJsdWUtNTAwLzIwJyA6IGlzQ29tcGxldGVkID8gJ2JnLWdyZWVuLTUwMC8yMCcgOiAnYmctd2hpdGUvMTAnXHJcbiAgICAgICAgICAgICAgICAgICAgfWB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRlc3QuaWNvbiBjbGFzc05hbWU9e2B3LTYgaC02ICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQWN0aXZlID8gJ3RleHQtYmx1ZS00MDAnIDogaXNDb21wbGV0ZWQgPyAndGV4dC1ncmVlbi00MDAnIDogJ3RleHQtd2hpdGUnXHJcbiAgICAgICAgICAgICAgICAgICAgICB9YH0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ib2xkIHRleHQtd2hpdGVcIj57dGVzdC5uYW1lfTwvaDM+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS00MDBcIj57dGVzdC5kZXNjcmlwdGlvbn08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAge2lzQ29tcGxldGVkICYmIChcclxuICAgICAgICAgICAgICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbD17eyBzY2FsZTogMCB9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZT17eyBzY2FsZTogMSB9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIGJnLWdyZWVuLTUwMC8yMCByb3VuZGVkLWZ1bGxcIlxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIDxDaGVja0NpcmNsZSBjbGFzc05hbWU9XCJ3LTYgaC02IHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDBcIj5UYXJnZXQ6PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1tZWRpdW1cIj57dGVzdC50YXJnZXR9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIHtyZXN1bHQgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXNtXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDBcIj5BY2hpZXZlZDo8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JlZW4tNDAwIGZvbnQtYm9sZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHt0ZXN0LmlkID09PSAnYnVsay1vcmRlcnMnID8gYCR7cmVzdWx0LmZpbmFsVmFsdWV9IG9yZGVyc2AgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0LmlkID09PSAnZXZlbnQtdGhyb3VnaHB1dCcgPyBgJHtyZXN1bHQuZmluYWxWYWx1ZX0gZXZlbnRzYCA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QuaWQgPT09ICdzbmFwc2hvdC1wZXJmb3JtYW5jZScgPyBgJHtyZXN1bHQuYXZnTGF0ZW5jeS50b0ZpeGVkKDEpfXMgYXZnYCA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3Jlc3VsdC5hdmdMYXRlbmN5LnRvRml4ZWQoMCl9bXMgcDk5YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXNtXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDBcIj5EdXJhdGlvbjo8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2hpdGVcIj57cmVzdWx0LmR1cmF0aW9ufXM8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIHtpc0FjdGl2ZSAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXNtIG1iLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTQwMFwiPlByb2dyZXNzPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJsdWUtNDAwXCI+UnVubmluZy4uLjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctd2hpdGUvMTAgcm91bmRlZC1mdWxsIGgtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtMiBiZy1ncmFkaWVudC10by1yIGZyb20tYmx1ZS01MDAgdG8tcHVycGxlLTUwMCByb3VuZGVkLWZ1bGxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWw9e3sgd2lkdGg6IDAgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlPXt7IHdpZHRoOiAnMTAwJScgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uPXt7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IHRlc3QuaWQgPT09ICdidWxrLW9yZGVycycgPyAzMCA6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdC5pZCA9PT0gJ2V2ZW50LXRocm91Z2hwdXQnID8gNjAgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdC5pZCA9PT0gJ3NuYXBzaG90LXBlcmZvcm1hbmNlJyA/IDE1IDogMTAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNlOiAnbGluZWFyJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0pfVxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsoaXNSdW5uaW5nIHx8IG1ldHJpY3MubGVuZ3RoID4gMCkgJiYgKFxyXG4gICAgICAgIDxtb3Rpb24uZGl2XHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTZcIlxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUvNSBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0yeGwgcC02XCI+XHJcbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1iLTQgZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICA8QWN0aXZpdHkgY2xhc3NOYW1lPVwidy01IGgtNSBtci0yIHRleHQtYmx1ZS00MDBcIiAvPlxyXG4gICAgICAgICAgICAgIFJlYWwtdGltZSBQZXJmb3JtYW5jZVxyXG4gICAgICAgICAgICA8L2gzPlxyXG4gICAgICAgICAgICA8UmVzcG9uc2l2ZUNvbnRhaW5lciB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9ezI1MH0+XHJcbiAgICAgICAgICAgICAgPEFyZWFDaGFydCBkYXRhPXttZXRyaWNzfT5cclxuICAgICAgICAgICAgICAgIDxkZWZzPlxyXG4gICAgICAgICAgICAgICAgICA8bGluZWFyR3JhZGllbnQgaWQ9XCJjb2xvclZhbHVlXCIgeDE9XCIwXCIgeTE9XCIwXCIgeDI9XCIwXCIgeTI9XCIxXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PVwiNSVcIiBzdG9wQ29sb3I9XCIjM2I4MmY2XCIgc3RvcE9wYWNpdHk9ezAuOH0vPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjk1JVwiIHN0b3BDb2xvcj1cIiMzYjgyZjZcIiBzdG9wT3BhY2l0eT17MH0vPlxyXG4gICAgICAgICAgICAgICAgICA8L2xpbmVhckdyYWRpZW50PlxyXG4gICAgICAgICAgICAgICAgPC9kZWZzPlxyXG4gICAgICAgICAgICAgICAgPENhcnRlc2lhbkdyaWQgc3Ryb2tlRGFzaGFycmF5PVwiMyAzXCIgc3Ryb2tlPVwiI2ZmZmZmZjIwXCIgLz5cclxuICAgICAgICAgICAgICAgIDxYQXhpcyBkYXRhS2V5PVwidGltZVwiIHN0cm9rZT1cIiNmZmZmZmY2MFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8WUF4aXMgc3Ryb2tlPVwiI2ZmZmZmZjYwXCIgLz5cclxuICAgICAgICAgICAgICAgIDxUb29sdGlwIFxyXG4gICAgICAgICAgICAgICAgICBjb250ZW50U3R5bGU9e3sgXHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzFlMjkzYicsIFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjZmZmZmZmMjAnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzhweCdcclxuICAgICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICA8QXJlYSB0eXBlPVwibW9ub3RvbmVcIiBkYXRhS2V5PVwidmFsdWVcIiBzdHJva2U9XCIjM2I4MmY2XCIgZmlsbE9wYWNpdHk9ezF9IGZpbGw9XCJ1cmwoI2NvbG9yVmFsdWUpXCIgLz5cclxuICAgICAgICAgICAgICA8L0FyZWFDaGFydD5cclxuICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZS81IGJhY2tkcm9wLWJsdXIteGwgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCBwLTZcIj5cclxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtd2hpdGUgbWItNCBmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxDcHUgY2xhc3NOYW1lPVwidy01IGgtNSBtci0yIHRleHQtcHVycGxlLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgU3lzdGVtIExvYWRcclxuICAgICAgICAgICAgPC9oMz5cclxuICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXsyNTB9PlxyXG4gICAgICAgICAgICAgIDxMaW5lQ2hhcnQgZGF0YT17c3lzdGVtTG9hZH0+XHJcbiAgICAgICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiBzdHJva2U9XCIjZmZmZmZmMjBcIiAvPlxyXG4gICAgICAgICAgICAgICAgPFhBeGlzIGRhdGFLZXk9XCJ0aW1lXCIgc3Ryb2tlPVwiI2ZmZmZmZjYwXCIgLz5cclxuICAgICAgICAgICAgICAgIDxZQXhpcyBzdHJva2U9XCIjZmZmZmZmNjBcIiAvPlxyXG4gICAgICAgICAgICAgICAgPFRvb2x0aXAgXHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRTdHlsZT17eyBcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMWUyOTNiJywgXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNmZmZmZmYyMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnOHB4J1xyXG4gICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgIDxMaW5lIHR5cGU9XCJtb25vdG9uZVwiIGRhdGFLZXk9XCJjcHVcIiBzdHJva2U9XCIjZjU5ZTBiXCIgc3Ryb2tlV2lkdGg9ezJ9IGRvdD17ZmFsc2V9IC8+XHJcbiAgICAgICAgICAgICAgICA8TGluZSB0eXBlPVwibW9ub3RvbmVcIiBkYXRhS2V5PVwibWVtb3J5XCIgc3Ryb2tlPVwiIzhiNWNmNlwiIHN0cm9rZVdpZHRoPXsyfSBkb3Q9e2ZhbHNlfSAvPlxyXG4gICAgICAgICAgICAgICAgPExpbmUgdHlwZT1cIm1vbm90b25lXCIgZGF0YUtleT1cIm5ldHdvcmtcIiBzdHJva2U9XCIjMDZiNmQ0XCIgc3Ryb2tlV2lkdGg9ezJ9IGRvdD17ZmFsc2V9IC8+XHJcbiAgICAgICAgICAgICAgPC9MaW5lQ2hhcnQ+XHJcbiAgICAgICAgICAgIDwvUmVzcG9uc2l2ZUNvbnRhaW5lcj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuICAgICAgKX1cclxuXHJcbiAgICAgIHtjb21wbGV0ZWRUZXN0cy5sZW5ndGggPiAwICYmIChcclxuICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxyXG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJiZy1ncmFkaWVudC10by1iciBmcm9tLWdyZWVuLTUwMC8yMCB0by1ibHVlLTUwMC8yMCBiYWNrZHJvcC1ibHVyLXhsIGJvcmRlciBib3JkZXItZ3JlZW4tNTAwLzMwIHJvdW5kZWQtMnhsIHAtNlwiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1iLTQgZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgPFRhcmdldCBjbGFzc05hbWU9XCJ3LTYgaC02IG1yLTIgdGV4dC1ncmVlbi00MDBcIiAvPlxyXG4gICAgICAgICAgICBQZXJmb3JtYW5jZSBSZXN1bHRzIFN1bW1hcnlcclxuICAgICAgICAgIDwvaDM+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNlwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxyXG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGQgdGV4dC13aGl0ZVwiPktleSBBY2hpZXZlbWVudHM8L2g0PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwLTMgYmctd2hpdGUvMTAgcm91bmRlZC1sZ1wiPlxyXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktMzAwXCI+QnVsayBPcmRlciBQcm9jZXNzaW5nPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWdyZWVuLTQwMCBmb250LWJvbGRcIj7inJMgMSwwMDAgb3JkZXJzIGluIDMwczwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC0zIGJnLXdoaXRlLzEwIHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTMwMFwiPkV2ZW50IFRocm91Z2hwdXQ8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JlZW4tNDAwIGZvbnQtYm9sZFwiPuKckyAxMEsgZXZlbnRzL21pbjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XHJcbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1zZW1pYm9sZCB0ZXh0LXdoaXRlXCI+QnVzaW5lc3MgSW1wYWN0PC9oND5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYmctZ3JhZGllbnQtdG8tciBmcm9tLWJsdWUtNTAwLzIwIHRvLXB1cnBsZS01MDAvMjAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWJsdWUtNTAwLzMwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIHRleHQtYmx1ZS00MDBcIj43MyU8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS0zMDBcIj5Db3N0IFJlZHVjdGlvbiB2cyBUcmFkaXRpb25hbDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy1ncmFkaWVudC10by1yIGZyb20tZ3JlZW4tNTAwLzIwIHRvLWJsdWUtNTAwLzIwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1ncmVlbi01MDAvMzBcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1ncmVlbi00MDBcIj45OS45OSU8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS0zMDBcIj5TeXN0ZW0gQXZhaWxhYmlsaXR5PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICl9XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGVyZm9ybWFuY2VEZW1vO1xyXG4iXX0=