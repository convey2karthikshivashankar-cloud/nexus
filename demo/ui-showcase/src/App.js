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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const Dashboard_1 = __importDefault(require("./components/Dashboard"));
const PerformanceDemo_1 = __importDefault(require("./components/PerformanceDemo"));
const ArchitectureView_1 = __importDefault(require("./components/ArchitectureView"));
const LiveMetrics_1 = __importDefault(require("./components/LiveMetrics"));
const GovernanceView_1 = __importDefault(require("./components/GovernanceView"));
function App() {
    const [activeView, setActiveView] = (0, react_1.useState)('dashboard');
    const [isAutoPlay, setIsAutoPlay] = (0, react_1.useState)(true);
    // Auto-rotate views for self-pitching demo
    (0, react_1.useEffect)(() => {
        if (!isAutoPlay)
            return;
        const views = ['dashboard', 'performance', 'architecture', 'governance'];
        let currentIndex = 0;
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % views.length;
            setActiveView(views[currentIndex]);
        }, 15000); // 15 seconds per view
        return () => clearInterval(interval);
    }, [isAutoPlay]);
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <framer_motion_1.motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <lucide_react_1.Zap className="w-6 h-6 text-white"/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nexus Blueprint 3.0</h1>
                <p className="text-sm text-purple-300">Event-Sourced Microservices Platform</p>
              </div>
            </framer_motion_1.motion.div>

            <div className="flex items-center space-x-4">
              <framer_motion_1.motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAutoPlay(!isAutoPlay)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${isAutoPlay
            ? 'bg-purple-500 text-white'
            : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {isAutoPlay ? '⏸ Pause Demo' : '▶ Auto Play'}
              </framer_motion_1.motion.button>
              
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                <span className="text-green-300 text-sm font-medium">Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
            { id: 'dashboard', label: 'Live Dashboard', icon: lucide_react_1.Activity },
            { id: 'performance', label: 'Performance Demo', icon: lucide_react_1.TrendingUp },
            { id: 'architecture', label: 'Architecture', icon: lucide_react_1.Layers },
            { id: 'governance', label: 'Governance', icon: lucide_react_1.Shield }
        ].map((tab) => (<framer_motion_1.motion.button key={tab.id} whileHover={{ y: -2 }} onClick={() => {
                setActiveView(tab.id);
                setIsAutoPlay(false);
            }} className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all ${activeView === tab.id
                ? 'text-white border-b-2 border-purple-500 bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <tab.icon className="w-4 h-4"/>
                <span>{tab.label}</span>
              </framer_motion_1.motion.button>))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <framer_motion_1.AnimatePresence mode="wait">
          <framer_motion_1.motion.div key={activeView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {activeView === 'dashboard' && <Dashboard_1.default />}
            {activeView === 'performance' && <PerformanceDemo_1.default />}
            {activeView === 'architecture' && <ArchitectureView_1.default />}
            {activeView === 'governance' && <GovernanceView_1.default />}
          </framer_motion_1.motion.div>
        </framer_motion_1.AnimatePresence>
      </main>

      {/* Live Metrics Sidebar */}
      <LiveMetrics_1.default />

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="grid grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">99.99%</div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">&lt;200ms</div>
              <div className="text-xs text-gray-400">Latency (p99)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">10K+</div>
              <div className="text-xs text-gray-400">Events/sec</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">73%</div>
              <div className="text-xs text-gray-400">Cost Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">100%</div>
              <div className="text-xs text-gray-400">Audit Trail</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">&lt;5s</div>
              <div className="text-xs text-gray-400">Snapshot Time</div>
            </div>
          </div>
        </div>
      </footer>
    </div>);
}
exports.default = App;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFtRDtBQUNuRCxpREFBd0Q7QUFDeEQsK0NBSXNCO0FBQ3RCLHVFQUErQztBQUMvQyxtRkFBMkQ7QUFDM0QscUZBQTZEO0FBQzdELDJFQUFtRDtBQUNuRCxpRkFBeUQ7QUFFekQsU0FBUyxHQUFHO0lBQ1YsTUFBTSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQThELFdBQVcsQ0FBQyxDQUFDO0lBQ3ZILE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBRW5ELDJDQUEyQztJQUMzQyxJQUFBLGlCQUFTLEVBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBSSxDQUFDLFVBQVU7WUFBRSxPQUFPO1FBRXhCLE1BQU0sS0FBSyxHQUF3QixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzlGLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVyQixNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO1lBQ2hDLFlBQVksR0FBRyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ2pELGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxzQkFBc0I7UUFFakMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUVqQixPQUFPLENBQ0wsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDJF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R0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IG1vdGlvbiwgQW5pbWF0ZVByZXNlbmNlIH0gZnJvbSAnZnJhbWVyLW1vdGlvbic7XHJcbmltcG9ydCB7IFxyXG4gIEFjdGl2aXR5LCBaYXAsIFNoaWVsZCwgRGF0YWJhc2UsIEdpdEJyYW5jaCwgXHJcbiAgVHJlbmRpbmdVcCwgQ2xvY2ssIENoZWNrQ2lyY2xlLCBBbGVydENpcmNsZSxcclxuICBCYXJDaGFydDMsIExheWVycywgQ3B1LCBOZXR3b3JrXHJcbn0gZnJvbSAnbHVjaWRlLXJlYWN0JztcclxuaW1wb3J0IERhc2hib2FyZCBmcm9tICcuL2NvbXBvbmVudHMvRGFzaGJvYXJkJztcclxuaW1wb3J0IFBlcmZvcm1hbmNlRGVtbyBmcm9tICcuL2NvbXBvbmVudHMvUGVyZm9ybWFuY2VEZW1vJztcclxuaW1wb3J0IEFyY2hpdGVjdHVyZVZpZXcgZnJvbSAnLi9jb21wb25lbnRzL0FyY2hpdGVjdHVyZVZpZXcnO1xyXG5pbXBvcnQgTGl2ZU1ldHJpY3MgZnJvbSAnLi9jb21wb25lbnRzL0xpdmVNZXRyaWNzJztcclxuaW1wb3J0IEdvdmVybmFuY2VWaWV3IGZyb20gJy4vY29tcG9uZW50cy9Hb3Zlcm5hbmNlVmlldyc7XHJcblxyXG5mdW5jdGlvbiBBcHAoKSB7XHJcbiAgY29uc3QgW2FjdGl2ZVZpZXcsIHNldEFjdGl2ZVZpZXddID0gdXNlU3RhdGU8J2Rhc2hib2FyZCcgfCAncGVyZm9ybWFuY2UnIHwgJ2FyY2hpdGVjdHVyZScgfCAnZ292ZXJuYW5jZSc+KCdkYXNoYm9hcmQnKTtcclxuICBjb25zdCBbaXNBdXRvUGxheSwgc2V0SXNBdXRvUGxheV0gPSB1c2VTdGF0ZSh0cnVlKTtcclxuXHJcbiAgLy8gQXV0by1yb3RhdGUgdmlld3MgZm9yIHNlbGYtcGl0Y2hpbmcgZGVtb1xyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBpZiAoIWlzQXV0b1BsYXkpIHJldHVybjtcclxuICAgIFxyXG4gICAgY29uc3Qgdmlld3M6IHR5cGVvZiBhY3RpdmVWaWV3W10gPSBbJ2Rhc2hib2FyZCcsICdwZXJmb3JtYW5jZScsICdhcmNoaXRlY3R1cmUnLCAnZ292ZXJuYW5jZSddO1xyXG4gICAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XHJcbiAgICBcclxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBjdXJyZW50SW5kZXggPSAoY3VycmVudEluZGV4ICsgMSkgJSB2aWV3cy5sZW5ndGg7XHJcbiAgICAgIHNldEFjdGl2ZVZpZXcodmlld3NbY3VycmVudEluZGV4XSk7XHJcbiAgICB9LCAxNTAwMCk7IC8vIDE1IHNlY29uZHMgcGVyIHZpZXdcclxuICAgIFxyXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gIH0sIFtpc0F1dG9QbGF5XSk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1ncmFkaWVudC10by1iciBmcm9tLXNsYXRlLTkwMCB2aWEtcHVycGxlLTkwMCB0by1zbGF0ZS05MDBcIj5cclxuICAgICAgey8qIEhlYWRlciAqL31cclxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJib3JkZXItYiBib3JkZXItd2hpdGUvMTAgYmFja2Ryb3AtYmx1ci14bCBiZy13aGl0ZS81XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYXgtdy03eGwgbXgtYXV0byBweC02IHB5LTRcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgICAgIDxtb3Rpb24uZGl2IFxyXG4gICAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeDogLTIwIH19XHJcbiAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB4OiAwIH19XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMCBoLTEwIGJnLWdyYWRpZW50LXRvLWJyIGZyb20tcHVycGxlLTUwMCB0by1waW5rLTUwMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICA8WmFwIGNsYXNzTmFtZT1cInctNiBoLTYgdGV4dC13aGl0ZVwiIC8+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC13aGl0ZVwiPk5leHVzIEJsdWVwcmludCAzLjA8L2gxPlxyXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXB1cnBsZS0zMDBcIj5FdmVudC1Tb3VyY2VkIE1pY3Jvc2VydmljZXMgUGxhdGZvcm08L3A+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvbW90aW9uLmRpdj5cclxuXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC00XCI+XHJcbiAgICAgICAgICAgICAgPG1vdGlvbi5idXR0b25cclxuICAgICAgICAgICAgICAgIHdoaWxlSG92ZXI9e3sgc2NhbGU6IDEuMDUgfX1cclxuICAgICAgICAgICAgICAgIHdoaWxlVGFwPXt7IHNjYWxlOiAwLjk1IH19XHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0F1dG9QbGF5KCFpc0F1dG9QbGF5KX1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMiByb3VuZGVkLWxnIGZvbnQtbWVkaXVtIHRyYW5zaXRpb24tY29sb3JzICR7XHJcbiAgICAgICAgICAgICAgICAgIGlzQXV0b1BsYXkgXHJcbiAgICAgICAgICAgICAgICAgICAgPyAnYmctcHVycGxlLTUwMCB0ZXh0LXdoaXRlJyBcclxuICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIGhvdmVyOmJnLXdoaXRlLzIwJ1xyXG4gICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge2lzQXV0b1BsYXkgPyAn4o+4IFBhdXNlIERlbW8nIDogJ+KWtiBBdXRvIFBsYXknfVxyXG4gICAgICAgICAgICAgIDwvbW90aW9uLmJ1dHRvbj5cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMiBweC00IHB5LTIgYmctZ3JlZW4tNTAwLzIwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1ncmVlbi01MDAvMzBcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0yIGgtMiBiZy1ncmVlbi00MDAgcm91bmRlZC1mdWxsIGFuaW1hdGUtcHVsc2VcIiAvPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmVlbi0zMDAgdGV4dC1zbSBmb250LW1lZGl1bVwiPlByb2R1Y3Rpb24gUmVhZHk8L3NwYW4+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvaGVhZGVyPlxyXG5cclxuICAgICAgey8qIE5hdmlnYXRpb24gKi99XHJcbiAgICAgIDxuYXYgY2xhc3NOYW1lPVwiYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIGJhY2tkcm9wLWJsdXIteGwgYmctd2hpdGUvNVwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG8gcHgtNlwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IHNwYWNlLXgtMVwiPlxyXG4gICAgICAgICAgICB7W1xyXG4gICAgICAgICAgICAgIHsgaWQ6ICdkYXNoYm9hcmQnLCBsYWJlbDogJ0xpdmUgRGFzaGJvYXJkJywgaWNvbjogQWN0aXZpdHkgfSxcclxuICAgICAgICAgICAgICB7IGlkOiAncGVyZm9ybWFuY2UnLCBsYWJlbDogJ1BlcmZvcm1hbmNlIERlbW8nLCBpY29uOiBUcmVuZGluZ1VwIH0sXHJcbiAgICAgICAgICAgICAgeyBpZDogJ2FyY2hpdGVjdHVyZScsIGxhYmVsOiAnQXJjaGl0ZWN0dXJlJywgaWNvbjogTGF5ZXJzIH0sXHJcbiAgICAgICAgICAgICAgeyBpZDogJ2dvdmVybmFuY2UnLCBsYWJlbDogJ0dvdmVybmFuY2UnLCBpY29uOiBTaGllbGQgfVxyXG4gICAgICAgICAgICBdLm1hcCgodGFiKSA9PiAoXHJcbiAgICAgICAgICAgICAgPG1vdGlvbi5idXR0b25cclxuICAgICAgICAgICAgICAgIGtleT17dGFiLmlkfVxyXG4gICAgICAgICAgICAgICAgd2hpbGVIb3Zlcj17eyB5OiAtMiB9fVxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBzZXRBY3RpdmVWaWV3KHRhYi5pZCBhcyB0eXBlb2YgYWN0aXZlVmlldyk7XHJcbiAgICAgICAgICAgICAgICAgIHNldElzQXV0b1BsYXkoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMiBweC02IHB5LTQgZm9udC1tZWRpdW0gdHJhbnNpdGlvbi1hbGwgJHtcclxuICAgICAgICAgICAgICAgICAgYWN0aXZlVmlldyA9PT0gdGFiLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgPyAndGV4dC13aGl0ZSBib3JkZXItYi0yIGJvcmRlci1wdXJwbGUtNTAwIGJnLXdoaXRlLzUnXHJcbiAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1ncmF5LTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGhvdmVyOmJnLXdoaXRlLzUnXHJcbiAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICA8dGFiLmljb24gY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8c3Bhbj57dGFiLmxhYmVsfTwvc3Bhbj5cclxuICAgICAgICAgICAgICA8L21vdGlvbi5idXR0b24+XHJcbiAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvbmF2PlxyXG5cclxuICAgICAgey8qIE1haW4gQ29udGVudCAqL31cclxuICAgICAgPG1haW4gY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG8gcHgtNiBweS04XCI+XHJcbiAgICAgICAgPEFuaW1hdGVQcmVzZW5jZSBtb2RlPVwid2FpdFwiPlxyXG4gICAgICAgICAgPG1vdGlvbi5kaXZcclxuICAgICAgICAgICAga2V5PXthY3RpdmVWaWV3fVxyXG4gICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgICBleGl0PXt7IG9wYWNpdHk6IDAsIHk6IC0yMCB9fVxyXG4gICAgICAgICAgICB0cmFuc2l0aW9uPXt7IGR1cmF0aW9uOiAwLjMgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge2FjdGl2ZVZpZXcgPT09ICdkYXNoYm9hcmQnICYmIDxEYXNoYm9hcmQgLz59XHJcbiAgICAgICAgICAgIHthY3RpdmVWaWV3ID09PSAncGVyZm9ybWFuY2UnICYmIDxQZXJmb3JtYW5jZURlbW8gLz59XHJcbiAgICAgICAgICAgIHthY3RpdmVWaWV3ID09PSAnYXJjaGl0ZWN0dXJlJyAmJiA8QXJjaGl0ZWN0dXJlVmlldyAvPn1cclxuICAgICAgICAgICAge2FjdGl2ZVZpZXcgPT09ICdnb3Zlcm5hbmNlJyAmJiA8R292ZXJuYW5jZVZpZXcgLz59XHJcbiAgICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICAgPC9BbmltYXRlUHJlc2VuY2U+XHJcbiAgICAgIDwvbWFpbj5cclxuXHJcbiAgICAgIHsvKiBMaXZlIE1ldHJpY3MgU2lkZWJhciAqL31cclxuICAgICAgPExpdmVNZXRyaWNzIC8+XHJcblxyXG4gICAgICB7LyogRm9vdGVyIFN0YXRzICovfVxyXG4gICAgICA8Zm9vdGVyIGNsYXNzTmFtZT1cImZpeGVkIGJvdHRvbS0wIGxlZnQtMCByaWdodC0wIGJvcmRlci10IGJvcmRlci13aGl0ZS8xMCBiYWNrZHJvcC1ibHVyLXhsIGJnLXdoaXRlLzVcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC13LTd4bCBteC1hdXRvIHB4LTYgcHktM1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy02IGdhcC00IHRleHQtY2VudGVyXCI+XHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1ncmVlbi00MDBcIj45OS45OSU8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTQwMFwiPlVwdGltZTwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LWJsdWUtNDAwXCI+Jmx0OzIwMG1zPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS00MDBcIj5MYXRlbmN5IChwOTkpPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIHRleHQtcHVycGxlLTQwMFwiPjEwSys8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTQwMFwiPkV2ZW50cy9zZWM8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC15ZWxsb3ctNDAwXCI+NzMlPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS00MDBcIj5Db3N0IFNhdmluZ3M8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1waW5rLTQwMFwiPjEwMCU8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTQwMFwiPkF1ZGl0IFRyYWlsPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIHRleHQtY3lhbi00MDBcIj4mbHQ7NXM8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTQwMFwiPlNuYXBzaG90IFRpbWU8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9mb290ZXI+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBcHA7XHJcbiJdfQ==