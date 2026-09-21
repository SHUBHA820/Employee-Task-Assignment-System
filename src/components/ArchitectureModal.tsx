import React, { useState, useEffect } from 'react';
import { EurekaServiceInstance } from '../types';
import { getEurekaRegistry } from '../mockData';
import {
  X,
  Layers,
  Server,
  Database,
  Radio,
  ShieldCheck,
  Globe,
  Terminal,
  Activity,
  CheckCircle,
  Play,
  Cpu,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'DIAGRAM' | 'EUREKA' | 'POSTMAN'>('DIAGRAM');
  const [eurekaServices, setEurekaServices] = useState<EurekaServiceInstance[]>([]);
  const [isLoadingEureka, setIsLoadingEureka] = useState(false);

  // Postman API Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/tasks');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('GET');
  const [apiResponse, setApiResponse] = useState<string>('Click "Send Request" to test API route.');
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const fetchEurekaData = async () => {
    setIsLoadingEureka(true);
    try {
      const res = await fetch('/api/eureka/services');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if (data.services) {
        setEurekaServices(data.services);
      }
    } catch (err) {
      console.warn('Eureka fetch fallback to local registry:', err);
      setEurekaServices(getEurekaRegistry());
    } finally {
      setIsLoadingEureka(false);
    }
  };

  useEffect(() => {
    fetchEurekaData();
  }, []);

  const handleTestApi = async () => {
    setIsSendingRequest(true);
    try {
      const res = await fetch(selectedEndpoint, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponse(`Error: ${err.message}`);
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="glass-modal border border-white/20 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[92vh] text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">SOA Microservices & Service Registry</h3>
              <p className="text-xs text-slate-400">
                Author & Lead System Architect: <strong className="text-white">YARAMALA SHUBHAROOP AKUL</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('DIAGRAM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'DIAGRAM' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                SOA Diagram
              </button>

              <button
                onClick={() => setActiveTab('EUREKA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'EUREKA' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Eureka Registry ({eurekaServices.length})
              </button>

              <button
                onClick={() => setActiveTab('POSTMAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'POSTMAN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Postman Tester
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: VISUAL SOA ARCHITECTURE DIAGRAM */}
          {activeTab === 'DIAGRAM' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white uppercase text-[10px] bg-indigo-600 px-2 py-0.5 rounded mr-2">
                    Formal Specification
                  </span>
                  <span>Strict Database-per-service microservices with Eureka Discovery & Kafka Event Broker.</span>
                </div>
                <span className="font-mono font-bold text-slate-300">Author: YARAMALA SHUBHAROOP AKUL</span>
              </div>

              {/* Interactive Architecture Flow Diagram */}
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-8">
                
                {/* Level 1: Client */}
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Frontend Tier</span>
                  <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 shadow-lg">
                    <Globe className="w-6 h-6 text-indigo-400" />
                    <div className="text-left">
                      <p className="font-bold text-sm text-white">React Client Website</p>
                      <p className="text-[10px] text-indigo-300">Manager & Employee Dashboards (Port 3000)</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-indigo-500">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500"></div>
                </div>

                {/* Level 2: API Gateway & Eureka Registry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-lg relative">
                    <div className="flex items-center space-x-3 mb-2">
                      <ShieldCheck className="w-6 h-6 text-cyan-400" />
                      <div>
                        <h4 className="font-bold text-sm text-white">Spring Cloud API Gateway</h4>
                        <p className="text-[10px] text-slate-400">Port 8080 • JWT Filter & Role Enforcement</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Routes incoming HTTP requests, validates JWT tokens, and load balances to registered microservices.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Server className="w-6 h-6 text-amber-400" />
                      <div>
                        <h4 className="font-bold text-sm text-white">Eureka Service Discovery</h4>
                        <p className="text-[10px] text-slate-400">Port 8761 • Heartbeats & Service Registry</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Registers instance IPs/ports dynamically for User, Main Task, and Notification microservices.
                    </p>
                  </div>

                </div>

                <div className="flex justify-center text-cyan-500">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500 to-emerald-500"></div>
                </div>

                {/* Level 3: Microservices with Dedicated PostgreSQL DBs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30">
                    <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs mb-2">
                      <UserCheck className="w-4 h-4" />
                      <span>User Service (:8081)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-3">Manages employee profiles, roles, and logins.</p>
                    <div className="p-2 rounded-lg bg-slate-950 text-[10px] font-mono text-purple-300 flex items-center space-x-1.5 border border-purple-500/20">
                      <Database className="w-3.5 h-3.5" />
                      <span>user_service_db (pgAdmin)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs mb-2">
                      <Activity className="w-4 h-4" />
                      <span>Main Task Service (:8082)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-3">Task CRUD lifecycle, priority, and review state.</p>
                    <div className="p-2 rounded-lg bg-slate-950 text-[10px] font-mono text-indigo-300 flex items-center space-x-1.5 border border-indigo-500/20">
                      <Database className="w-3.5 h-3.5" />
                      <span>main_task_db (pgAdmin)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-2">
                      <Radio className="w-4 h-4" />
                      <span>Notification Service (:8083)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-3">Consumes Kafka events and pushes WebSocket alerts.</p>
                    <div className="p-2 rounded-lg bg-slate-950 text-[10px] font-mono text-emerald-300 flex items-center space-x-1.5 border border-emerald-500/20">
                      <Database className="w-3.5 h-3.5" />
                      <span>notification_db (pgAdmin)</span>
                    </div>
                  </div>

                </div>

                {/* Level 4: Kafka Event Broker */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/40 shadow-xl text-center">
                  <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-sm mb-1">
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span>Apache Kafka Event Broker</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl mx-auto">
                    Publishes topics: <code className="text-emerald-300">task-assignments</code>, <code className="text-emerald-300">task-status-updates</code>, and <code className="text-emerald-300">notification-pushes</code> for event-driven async communication.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE EUREKA SERVICE REGISTRY */}
          {activeTab === 'EUREKA' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-white">Eureka Microservice Discovery Cluster</h4>
                  <p className="text-xs text-slate-400">Live instances registered with Spring Cloud Eureka Server at localhost:8761</p>
                </div>
                <button
                  onClick={fetchEurekaData}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEureka ? 'animate-spin' : ''}`} />
                  <span>Refresh Heartbeats</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eurekaServices.map((srv) => (
                  <div key={srv.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-bold text-sm text-white">{srv.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{srv.host}:{srv.port}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {srv.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <p>DB: <strong className="text-indigo-300">{srv.database}</strong> ({srv.dbType})</p>
                      <p>Uptime: <span className="text-slate-400">{srv.uptime}</span></p>
                      <p>Last Heartbeat: <span className="text-slate-400 font-mono text-[10px]">{new Date(srv.lastHeartbeat).toLocaleTimeString()}</span></p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Service Endpoints:</p>
                      <div className="flex flex-wrap gap-1">
                        {srv.endpoints.map((ep, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                            {ep}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: POSTMAN API TESTER */}
          {activeTab === 'POSTMAN' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-base text-white">Postman Agent Mode — Microservice API Runner</h4>
                <p className="text-xs text-slate-400">Test REST endpoints across API Gateway, Task Service, and User Service.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as any)}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-emerald-400"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>

                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="/api/tasks">GET /api/tasks (Main Task Service)</option>
                  <option value="/api/users">GET /api/users (User Service)</option>
                  <option value="/api/notifications">GET /api/notifications (Notification Service)</option>
                  <option value="/api/eureka/services">GET /api/eureka/services (Eureka Registry)</option>
                  <option value="/api/kafka/events">GET /api/kafka/events (Kafka Broker Stream)</option>
                  <option value="/api/metrics">GET /api/metrics (Analytics Engine)</option>
                </select>

                <button
                  onClick={handleTestApi}
                  disabled={isSendingRequest}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isSendingRequest ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>

              {/* JSON Response Window */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>HTTP Response Payload (JSON)</span>
                </p>
                <pre className="font-mono text-xs text-emerald-400 bg-slate-900 p-4 rounded-lg overflow-x-auto max-h-72">
                  {apiResponse}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
