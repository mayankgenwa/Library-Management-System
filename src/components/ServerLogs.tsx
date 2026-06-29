import { useEffect, useState } from 'react';
import { RefreshCw, Clock, Database, AlertCircle } from 'lucide-react';
import { ApiLog } from '../types.js';

interface DbInfo {
  mode: 'mongodb' | 'json';
  uriConfigured: boolean;
}

interface Props {
  token: string;
}

export default function ServerLogs({ token }: Props) {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);

  const fetchDbInfo = async () => {
    try {
      const res = await fetch('/api/system/db-info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDbInfo({ mode: data.mode, uriConfigured: data.uriConfigured });
        }
      }
    } catch (err) {
      console.error('Failed to pull DB info', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to pull backend logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchDbInfo();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
      fetchDbInfo();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (status >= 300 && status < 400) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (status >= 400 && status < 500) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-400 bg-emerald-950/40 border border-emerald-900';
      case 'POST': return 'text-blue-400 bg-blue-950/40 border border-blue-900';
      case 'PUT': return 'text-amber-400 bg-amber-950/40 border border-amber-900';
      case 'DELETE': return 'text-rose-400 bg-rose-950/40 border border-rose-900';
      default: return 'text-stone-400 bg-stone-900 border border-stone-800';
    }
  };

  return (
    <div id="server-logs-panel" className="border border-stone-200 rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-150 mb-5">
        <div>
          <h3 className="text-base font-serif font-medium text-stone-900 flex items-center gap-2">
            <Clock size={16} className="text-stone-500 animate-pulse" />
            Live Backend Server Logs
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time HTTP requests intercepted by the Express router middlewares.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
            <input
              id="autorefresh-checkbox"
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-stone-300 text-[#1b3d2f] focus:ring-[#1b3d2f]"
            />
            Auto-refresh (3s)
          </label>
          <button
            id="refresh-logs-btn"
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 border border-stone-200 hover:border-stone-400 bg-stone-50 text-stone-600 rounded-md hover:text-stone-900 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Refresh Logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Database Mode Status Banner */}
      {dbInfo && (
        <div id="db-status-banner" className={`mb-6 p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
          dbInfo.mode === 'mongodb'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-stone-50 border-stone-200 text-stone-700'
        }`}>
          <div className="flex items-start gap-2.5">
            <Database size={16} className={`mt-0.5 flex-shrink-0 ${dbInfo.mode === 'mongodb' ? 'text-emerald-600' : 'text-stone-500'}`} />
            <div>
              <p className="font-semibold flex items-center gap-1.5">
                Active Database: {dbInfo.mode === 'mongodb' ? 'MongoDB (Connected)' : 'Local Offline JSON'}
                <span className={`inline-block w-2 h-2 rounded-full ${dbInfo.mode === 'mongodb' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                {dbInfo.mode === 'mongodb'
                  ? 'Your library records are fully synchronized with your live MongoDB cluster.'
                  : 'Currently running on a lightweight local database. All changes persist locally to db.json.'}
              </p>
            </div>
          </div>
          {dbInfo.mode !== 'mongodb' && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 text-[10px] text-amber-800 self-start md:self-auto">
              <AlertCircle size={12} className="text-amber-600 flex-shrink-0" />
              <span>
                To use your own cluster, add <strong>MONGODB_URI</strong> to your <strong>.env</strong> file.
              </span>
            </div>
          )}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="py-12 border border-dashed border-stone-200 rounded-lg text-center text-xs text-stone-400 font-serif italic">
          No requests caught yet. Trigger actions in the Library Web App or the Sandbox.
        </div>
      ) : (
        <div className="space-y-2 h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                id={`log-item-${log.id}`}
                key={log.id}
                className={`border rounded-lg transition-all ${
                  isExpanded ? 'border-stone-400 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Header row */}
                <button
                  id={`log-toggle-btn-${log.id}`}
                  onClick={() => toggleExpand(log.id)}
                  className="w-full text-left p-3 flex flex-wrap items-center gap-3 text-xs font-mono"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                  <span className="text-stone-800 font-semibold truncate flex-1">{log.url}</span>
                  <span className="text-[10px] text-stone-400 font-sans">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-stone-200 bg-stone-900 text-stone-300 font-mono text-[11px] rounded-b-lg space-y-3">
                    {log.requestBody && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Request Payload JSON:</span>
                        <pre className="bg-stone-950 p-3 rounded text-stone-200 overflow-x-auto whitespace-pre-wrap max-h-40">
                          {JSON.stringify(log.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Response Payload JSON:</span>
                      <pre className="bg-stone-950 p-3 rounded text-stone-200 overflow-x-auto whitespace-pre-wrap max-h-52">
                        {JSON.stringify(log.responseBody, null, 2)}
                      </pre>
                    </div>

                    <div className="text-[9px] text-stone-500 text-right pt-2 border-t border-stone-800 font-sans">
                      Request ID: {log.id} • Timestamp: {log.timestamp}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}