import React, { useState, useEffect } from 'react';
import { KafkaEvent } from '../types';
import { initialKafkaEvents } from '../mockData';
import { X, Radio, RefreshCw, Send, Terminal, Layers } from 'lucide-react';

interface KafkaLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KafkaLogViewer: React.FC<KafkaLogViewerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [events, setEvents] = useState<KafkaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<KafkaEvent | null>(null);

  // Publish custom Kafka test event
  const [testTopic, setTestTopic] = useState<'task-assignments' | 'task-status-updates' | 'notification-pushes'>('task-assignments');
  const [testKey, setTestKey] = useState('TSK-TEST-99');
  const [testPayloadStr, setTestPayloadStr] = useState('{\n  "taskId": "TSK-TEST-99",\n  "testMessage": "Kafka Broker message test"\n}');

  const fetchKafkaEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kafka/events');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        if (data.events.length > 0 && !selectedEvent) {
          setSelectedEvent(data.events[0]);
        }
      }
    } catch (err) {
      console.warn('Kafka fetch fallback to local events:', err);
      setEvents(initialKafkaEvents);
      if (initialKafkaEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(initialKafkaEvents[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKafkaEvents();
  }, []);

  const handlePublishTestEvent = async () => {
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(testPayloadStr);
      } catch (e) {
        alert('Invalid JSON in payload');
        return;
      }

      const res = await fetch('/api/kafka/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: testTopic,
          key: testKey,
          payload: parsedPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchKafkaEvents();
      }
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-modal border border-white/20 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] text-white">
        
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-base font-bold">Kafka Broker Event Inspector</h3>
              <p className="text-xs text-slate-400">Event-driven real-time messaging pipeline</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchKafkaEvents}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left: Stream List */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col h-full space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Stream Log</h4>

            <div className="space-y-2 overflow-y-auto flex-1 max-h-96 pr-1">
              {events.map((evt) => (
                <div
                  key={evt.eventId}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedEvent?.eventId === evt.eventId
                      ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">{evt.eventId}</span>
                    <span className="text-[10px] text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-bold text-slate-200">{evt.topic}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">Partition: {evt.partition} | Offset: {evt.offset}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Payload Inspector & Publish test tool */}
          <div className="space-y-4">
            
            {/* Payload preview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selected Event Payload</span>
              </h4>
              <pre className="font-mono text-xs text-emerald-300 bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-48">
                {selectedEvent ? JSON.stringify(selectedEvent, null, 2) : 'Select an event on left.'}
              </pre>
            </div>

            {/* Test Publisher */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white">Publish Kafka Test Message</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={testTopic}
                  onChange={(e) => setTestTopic(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs rounded text-white"
                >
                  <option value="task-assignments">task-assignments</option>
                  <option value="task-status-updates">task-status-updates</option>
                  <option value="notification-pushes">notification-pushes</option>
                </select>

                <input
                  type="text"
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  placeholder="Event Key"
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs rounded text-white"
                />
              </div>

              <textarea
                rows={3}
                value={testPayloadStr}
                onChange={(e) => setTestPayloadStr(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs font-mono rounded text-white"
              />

              <button
                onClick={handlePublishTestEvent}
                className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish to Kafka Broker</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
