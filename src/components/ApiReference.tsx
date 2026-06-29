import { useState } from 'react';
import { Play, Copy, Check, Terminal, Code, HelpCircle } from 'lucide-react';

interface ApiAction {
  step: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  requiresAuth: boolean;
  role: 'Public' | 'Authenticated' | 'Librarian' | 'Member';
  description: string;
  defaultPayload?: any;
  endpointTemplate?: (currentBookId?: string, currentMemberId?: string) => string;
}

const API_STEPS: ApiAction[] = [
  {
    step: 'Step 9',
    name: 'Implement Registration API',
    method: 'POST',
    url: '/api/auth/register',
    requiresAuth: false,
    role: 'Public',
    description: 'Validates input, checks for duplicate email, hashes the password using bcrypt, and creates a user with "member" or "librarian" role.',
    defaultPayload: {
      name: 'Arthur Conan Doyle',
      email: 'arthur@conandoyle.com',
      password: 'password123',
      role: 'member'
    }
  },
  {
    step: 'Step 10',
    name: 'Implement Login API',
    method: 'POST',
    url: '/api/auth/login',
    requiresAuth: false,
    role: 'Public',
    description: 'Verifies the password using bcrypt.compare and signs a secure JWT token containing user ID and role, valid for 24 hours.',
    defaultPayload: {
      email: 'julian@member.com',
      password: 'password123'
    }
  },
  {
    step: 'Step 13a',
    name: 'Add Book',
    method: 'POST',
    url: '/api/books',
    requiresAuth: true,
    role: 'Librarian',
    description: 'Allows librarians to add new books to the inventory. Validates required fields and ensures quantity is non-negative.',
    defaultPayload: {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      category: 'Classics',
      quantity: 5
    }
  },
  {
    step: 'Step 13b',
    name: 'Get All Books',
    method: 'GET',
    url: '/api/books',
    requiresAuth: true,
    role: 'Authenticated',
    description: 'Retrieves all available books in the inventory. Accessible by both logged-in members and librarians.'
  },
  {
    step: 'Step 13c',
    name: 'Get Book Details',
    method: 'GET',
    url: '/api/books/:id',
    requiresAuth: true,
    role: 'Authenticated',
    description: 'Fetches detailed information about a single book including its stock status and current available count.',
    endpointTemplate: (bookId) => `/api/books/${bookId || 'b_1'}`
  },
  {
    step: 'Step 13d',
    name: 'Update Book',
    method: 'PUT',
    url: '/api/books/:id',
    requiresAuth: true,
    role: 'Librarian',
    description: 'Enables librarians to modify metadata or adjust the stock quantity of an existing book.',
    endpointTemplate: (bookId) => `/api/books/${bookId || 'b_1'}`,
    defaultPayload: {
      title: 'The Shadow of the Wind (Special Edition)',
      author: 'Carlos Ruiz Zafón',
      isbn: '9780143034902',
      category: 'Fiction',
      quantity: 6
    }
  },
  {
    step: 'Step 13e',
    name: 'Delete Book',
    method: 'DELETE',
    url: '/api/books/:id',
    requiresAuth: true,
    role: 'Librarian',
    description: 'Permits librarians to permanently remove a book from the catalog and scrap associated history records.',
    endpointTemplate: (bookId) => `/api/books/${bookId || 'b_5'}`
  },
  {
    step: 'Step 14a',
    name: 'Get Members',
    method: 'GET',
    url: '/api/members',
    requiresAuth: true,
    role: 'Librarian',
    description: 'Lists all registered users whose roles are "member". Safeguards passwords from leaking in the API response.'
  },
  {
    step: 'Step 14b',
    name: 'Delete Member',
    method: 'DELETE',
    url: '/api/members/:id',
    requiresAuth: true,
    role: 'Librarian',
    description: 'Revokes a member account and wipes their details from the directory.',
    endpointTemplate: (_, memberId) => `/api/members/${memberId || 'u_julian'}`
  },
  {
    step: 'Step 15',
    name: 'Borrow Book API',
    method: 'POST',
    url: '/api/books/:id/borrow',
    requiresAuth: true,
    role: 'Member',
    description: 'Enforces borrow rules: ensures book is available (availableQuantity > 0) and the member does not already possess an unreturned copy.',
    endpointTemplate: (bookId) => `/api/books/${bookId || 'b_1'}/borrow`
  },
  {
    step: 'Step 16',
    name: 'Return Book API',
    method: 'POST',
    url: '/api/books/:id/return',
    requiresAuth: true,
    role: 'Member',
    description: 'Records book return date, updates status to "returned", and increments the available stock count on the book.',
    endpointTemplate: (bookId) => `/api/books/${bookId || 'b_4'}/return`
  },
  {
    step: 'Step 17',
    name: 'My Borrowed Books API',
    method: 'GET',
    url: '/api/members/me/books',
    requiresAuth: true,
    role: 'Member',
    description: 'Fetches a list of all active, unreturned books currently checked out by the logged-in member.'
  }
];

interface ApiReferenceProps {
  token: string | null;
  selectedBookId?: string;
  selectedMemberId?: string;
}

export default function ApiReference({ token, selectedBookId, selectedMemberId }: ApiReferenceProps) {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [customPayload, setCustomPayload] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const activeApi = API_STEPS[activeStepIdx];

  // Initialize payload whenever active API shifts
  useState(() => {
    if (activeApi.defaultPayload) {
      setCustomPayload(JSON.stringify(activeApi.defaultPayload, null, 2));
    } else {
      setCustomPayload('');
    }
  });

  const handleStepChange = (idx: number) => {
    setActiveStepIdx(idx);
    setResponse(null);
    setResStatus(null);
    const api = API_STEPS[idx];
    if (api.defaultPayload) {
      setCustomPayload(JSON.stringify(api.defaultPayload, null, 2));
    } else {
      setCustomPayload('');
    }
  };

  const getTargetUrl = () => {
    if (activeApi.endpointTemplate) {
      return activeApi.endpointTemplate(selectedBookId, selectedMemberId);
    }
    return activeApi.url;
  };

  const handleRunRequest = async () => {
    setLoading(true);
    setResponse(null);
    setResStatus(null);

    const url = getTargetUrl();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (activeApi.requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method: activeApi.method,
      headers,
    };

    if (activeApi.method !== 'GET' && customPayload) {
      try {
        options.body = JSON.stringify(JSON.parse(customPayload));
      } catch (e) {
        setResponse({ error: 'Invalid JSON entered inside request body' });
        setResStatus(400);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(url, options);
      setResStatus(res.status);
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: 'Network error or request rejected by the server.', details: err.message });
      setResStatus(500);
    } finally {
      setLoading(false);
    }
  };

  const getCurlCommand = () => {
    const url = `${window.location.origin}${getTargetUrl()}`;
    let cmd = `curl -X ${activeApi.method} "${url}" \\\n  -H "Content-Type: application/json"`;
    
    if (activeApi.requiresAuth) {
      cmd += ` \\\n  -H "Authorization: Bearer ${token || 'YOUR_JWT_TOKEN'}"`;
    }

    if (activeApi.method !== 'GET' && customPayload) {
      try {
        const compactJson = JSON.stringify(JSON.parse(customPayload));
        cmd += ` \\\n  -d '${compactJson}'`;
      } catch (e) {
        cmd += ` \\\n  -d '${customPayload.replace(/\n/g, '')}'`;
      }
    }

    return cmd;
  };

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(getCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const methodColors = {
    GET: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    POST: 'bg-blue-50 text-blue-800 border-blue-200',
    PUT: 'bg-amber-50 text-amber-800 border-amber-200',
    DELETE: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const roleBadgeColors = {
    Public: 'bg-stone-100 text-stone-600',
    Authenticated: 'bg-purple-50 text-purple-700 border-purple-200',
    Librarian: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Member: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  return (
    <div id="api-ref-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Steps Sidebar */}
      <div className="lg:col-span-4 border border-stone-200 rounded-lg bg-[#faf9f5] p-4 h-[calc(100vh-280px)] overflow-y-auto">
        <h3 className="font-serif font-medium text-stone-950 mb-3 pb-2 border-b border-stone-200 text-sm flex items-center gap-1.5">
          <Code size={14} className="text-stone-500" />
          Assignment Roadmap
        </h3>
        <div className="space-y-1.5">
          {API_STEPS.map((api, idx) => (
            <button
              id={`step-nav-${idx}`}
              key={api.step + api.name}
              onClick={() => handleStepChange(idx)}
              className={`w-full text-left p-2.5 rounded text-xs transition-colors flex flex-col gap-1 ${
                activeStepIdx === idx
                  ? 'bg-stone-800 text-white'
                  : 'hover:bg-stone-200/60 text-stone-700'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                  activeStepIdx === idx ? 'bg-stone-700 text-stone-200' : 'bg-stone-200 text-stone-600'
                }`}>
                  {api.step}
                </span>
                <span className={`font-mono text-[9px] px-1 py-0.5 rounded ${
                  activeStepIdx === idx ? 'bg-stone-700 text-stone-300' : 'bg-stone-150 text-stone-500'
                }`}>
                  {api.method}
                </span>
              </div>
              <span className="font-medium truncate">{api.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Sandbox */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        <div className="border border-stone-200 rounded-lg bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-stone-150">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-stone-400 uppercase tracking-widest">{activeApi.step}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${roleBadgeColors[activeApi.role]}`}>
                  {activeApi.role}
                </span>
              </div>
              <h3 className="text-lg font-serif font-medium text-stone-900">{activeApi.name}</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 border rounded ${methodColors[activeApi.method]}`}>
                {activeApi.method}
              </span>
              <span className="text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200 px-2 py-1 rounded">
                {getTargetUrl()}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 mb-5 leading-relaxed bg-[#fbfaf7] p-3 border-l-2 border-stone-400 rounded-r-md">
            {activeApi.description}
          </p>

          {/* Quick Context Tips */}
          {activeApi.requiresAuth && !token && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md flex items-start gap-1.5 font-sans leading-normal">
              <HelpCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <span>
                <strong>Authentication required:</strong> Sign in using the Library Web App first, or trigger login via Step 10 below, to acquire a JWT token. The sandbox will then automatically append this token.
              </span>
            </div>
          )}

          {/* Dynamic Placeholder values */}
          {activeApi.endpointTemplate && (
            <div className="mb-4 text-[11px] text-stone-500 bg-stone-50 p-2 border border-stone-200 rounded">
              <span className="font-semibold text-stone-700">Dynamic Params Context:</span>
              <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[10px]">
                <div>Selected Book ID: <span className="text-[#9c4d32] font-semibold">{selectedBookId || 'b_1 (Default)'}</span></div>
                <div>Selected Member ID: <span className="text-[#9c4d32] font-semibold">{selectedMemberId || 'u_julian (Default)'}</span></div>
              </div>
              <p className="text-[9px] text-stone-400 mt-1 italic">
                * Select different rows in the Books or Members lists to dynamically swap these IDs in the URL.
              </p>
            </div>
          )}

          {/* Input Payload */}
          {activeApi.method !== 'GET' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex justify-between items-center">
                <span>Request Payload (JSON)</span>
                <span className="text-[10px] font-mono text-stone-400">application/json</span>
              </label>
              <textarea
                id="api-payload-editor"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                rows={6}
                className="w-full font-mono text-xs p-3 bg-stone-900 text-stone-100 rounded-md border border-stone-700 focus:outline-none focus:border-stone-500 shadow-inner"
              />
            </div>
          )}

          {/* Action trigger */}
          <div className="flex gap-2">
            <button
              id="api-run-request-btn"
              onClick={handleRunRequest}
              disabled={loading}
              className="px-4 py-2 bg-[#1b3d2f] hover:bg-[#153025] text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Play size={13} fill="currentColor" />
              {loading ? 'Executing Request...' : 'Send Live Request'}
            </button>
            <button
              id="api-copy-curl-btn"
              onClick={copyCurlToClipboard}
              className="px-4 py-2 border border-stone-200 hover:border-stone-400 text-stone-700 text-xs font-medium rounded-md flex items-center gap-1.5 bg-white transition-colors"
            >
              {copiedCurl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copiedCurl ? 'Copied' : 'Copy cURL'}
            </button>
          </div>
        </div>

        {/* Console / Response View */}
        <div className="border border-stone-200 rounded-lg bg-stone-950 text-stone-200 font-mono text-xs flex flex-col h-[300px] shadow-sm">
          <div className="bg-stone-900 px-4 py-2.5 border-b border-stone-800 flex justify-between items-center rounded-t-lg">
            <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1.5">
              <Terminal size={12} />
              Sandbox Response Console
            </span>
            {resStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                resStatus >= 200 && resStatus < 300 
                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' 
                  : 'bg-red-900/40 text-red-400 border border-red-800'
              }`}>
                STATUS: {resStatus}
              </span>
            )}
          </div>
          <div className="p-4 overflow-auto flex-1 text-stone-300">
            {response ? (
              <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-500 italic text-center text-xs">
                <span>No API request fired yet in this turn.</span>
                <span>Click "Send Live Request" above to test the Express controller routes.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
