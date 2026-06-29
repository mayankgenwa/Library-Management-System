import { useState, useEffect } from 'react';
import { BookOpen, LogOut, Code, Database, Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthCard from './components/AuthCard.tsx';
import BookList from './components/BookList.tsx';
import BookForm from './components/BookForm.tsx';
import MemberManager from './components/MemberManager.tsx';
import ApiReference from './components/ApiReference.tsx';
import ServerLogs from './components/ServerLogs.tsx';
import { Book, User } from './types.js';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [myBorrowedBooks, setMyBorrowedBooks] = useState<any[]>([]);

  // Selected IDs for API test bindings
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'catalog' | 'members' | 'api-sandbox' | 'server-logs'>('catalog');
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Restore Session
  useEffect(() => {
    const savedToken = localStorage.getItem('lms_token');
    const savedUser = localStorage.getItem('lms_user');
    if (savedToken && savedUser) {
      try {
        const userParsed = JSON.parse(savedUser);
        setToken(savedToken);
        setCurrentUser(userParsed);
      } catch (e) {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
      }
    }
  }, []);

  // Fetch initial collections upon state load
  useEffect(() => {
    if (token) {
      fetchBooks();
      if (currentUser?.role === 'librarian') {
        fetchMembers();
      } else if (currentUser?.role === 'member') {
        fetchMyBorrowedBooks();
      }
    } else {
      // Clear data when logged out
      setBooks([]);
      setMembers([]);
      setMyBorrowedBooks([]);
    }
  }, [token, currentUser]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchBooks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBooks(data.books);
        if (data.books.length > 0 && !selectedBookId) {
          setSelectedBookId(data.books[0].id);
        }
      } else {
        showNotification(data.message || 'Failed to pull book list', 'error');
      }
    } catch (err) {
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!token || currentUser?.role !== 'librarian') return;
    try {
      const res = await fetch('/api/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.members);
        if (data.members.length > 0 && !selectedMemberId) {
          setSelectedMemberId(data.members[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching members list', err);
    }
  };

  const fetchMyBorrowedBooks = async () => {
    if (!token || currentUser?.role !== 'member') return;
    try {
      const res = await fetch('/api/members/me/books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyBorrowedBooks(data.books);
      }
    } catch (err) {
      console.error('Error fetching active borrows', err);
    }
  };

  const handleAuthSuccess = (newToken: string, user: User) => {
    localStorage.setItem('lms_token', newToken);
    localStorage.setItem('lms_user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
    showNotification(`Welcome back, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setToken(null);
    setCurrentUser(null);
    setActiveTab('catalog');
    showNotification('Logged out successfully', 'success');
  };

  const handleSaveBook = async (bookData: { title: string; author: string; isbn: string; category: string; quantity: number }) => {
    if (!token || currentUser?.role !== 'librarian') return false;

    const url = bookToEdit ? `/api/books/${bookToEdit.id}` : '/api/books';
    const method = bookToEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(
          bookToEdit ? 'Book updated successfully' : 'Book added to catalog',
          'success'
        );
        fetchBooks();
        setShowBookForm(false);
        setBookToEdit(null);
        return true;
      } else {
        showNotification(data.message || 'Error occurred while saving', 'error');
        return false;
      }
    } catch (err) {
      showNotification('Server communication failure', 'error');
      return false;
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!token || currentUser?.role !== 'librarian') return;
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('Book removed from database', 'success');
        fetchBooks();
        if (selectedBookId === id) setSelectedBookId('');
      } else {
        showNotification(data.message || 'Failed to remove book', 'error');
      }
    } catch (err) {
      showNotification('Server communication failure', 'error');
    }
  };

  const handleBorrowBook = async (id: string) => {
    if (!token || currentUser?.role !== 'member') return;

    try {
      const res = await fetch(`/api/books/${id}/borrow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('Book checked out successfully!', 'success');
        fetchBooks();
        fetchMyBorrowedBooks();
      } else {
        showNotification(data.message || 'Borrow request failed', 'error');
      }
    } catch (err) {
      showNotification('Server communication failure', 'error');
    }
  };

  const handleReturnBook = async (id: string) => {
    if (!token || currentUser?.role !== 'member') return;

    try {
      const res = await fetch(`/api/books/${id}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('Book returned to inventory', 'success');
        fetchBooks();
        fetchMyBorrowedBooks();
      } else {
        showNotification(data.message || 'Return request failed', 'error');
      }
    } catch (err) {
      showNotification('Server communication failure', 'error');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!token || currentUser?.role !== 'librarian') return;
    if (!confirm('Are you sure you want to remove this member? This will clear all their borrow records.')) return;

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('Member account deleted', 'success');
        fetchMembers();
        if (selectedMemberId === id) setSelectedMemberId('');
      } else {
        showNotification(data.message || 'Failed to delete member', 'error');
      }
    } catch (err) {
      showNotification('Server communication failure', 'error');
    }
  };

  // Compute System Statistics
  const stats = {
    totalBooks: books.reduce((acc, b) => acc + b.quantity, 0),
    uniqueTitles: books.length,
    availableBooks: books.reduce((acc, b) => acc + b.availableQuantity, 0),
    borrowedCount: books.reduce((acc, b) => acc + (b.quantity - b.availableQuantity), 0),
  };

  return (
    <div id="main-app" className="min-h-screen bg-[#fbfaf7] text-stone-900 font-sans antialiased flex flex-col selection:bg-[#1b3d2f]/15 selection:text-[#1b3d2f]">
      {/* 1. Global Alert Notification banner */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-md shadow-lg border text-xs font-mono transition-all duration-300 max-w-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 2. Top Header Navigation Bar */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg text-[#1b3d2f]">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold tracking-tight text-stone-950">The Archival Library</h1>
              <p className="text-[10px] uppercase font-mono text-stone-400 tracking-widest mt-0.5">Library Management & API sandbox</p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg text-xs">
              <div className="text-left">
                <div className="font-semibold text-stone-950 flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.role === 'librarian' ? (
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded font-mono border border-indigo-150">
                      Librarian
                    </span>
                  ) : (
                    <span className="text-[9px] bg-cyan-50 text-cyan-700 font-bold px-1.5 py-0.2 rounded font-mono border border-cyan-150">
                      Member
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-stone-400 font-mono truncate max-w-[150px]">{currentUser.email}</div>
              </div>
              <div className="w-px h-6 bg-stone-200 mx-1"></div>
              <button
                id="signout-btn"
                onClick={handleLogout}
                className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-900 transition-colors"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 3. Main Stage Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        {!token ? (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-12">
            <AuthCard onAuthSuccess={handleAuthSuccess} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block">Total Catalog Books</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-serif font-bold text-stone-900">{stats.totalBooks}</span>
                  <span className="text-[10px] text-stone-500 font-mono">({stats.uniqueTitles} Titles)</span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block">Currently Available</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-serif font-bold text-stone-900">{stats.availableBooks}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                    {stats.totalBooks > 0 ? `${Math.round((stats.availableBooks / stats.totalBooks) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block">Active Borrows</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-serif font-bold text-stone-900">{stats.borrowedCount}</span>
                  <span className="text-[10px] text-[#9c4d32] font-semibold font-mono">
                    {stats.totalBooks > 0 ? `${Math.round((stats.borrowedCount / stats.totalBooks) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-3xs flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block">Quick Actions</span>
                <div className="flex gap-2 mt-2">
                  <button
                    id="sync-catalog-btn"
                    onClick={fetchBooks}
                    disabled={loading}
                    className="p-1.5 border border-stone-200 hover:border-stone-400 hover:bg-stone-50 text-stone-700 text-xs rounded flex items-center gap-1 transition-colors flex-1 justify-center disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    Sync Data
                  </button>
                  {currentUser.role === 'librarian' && (
                    <button
                      id="launch-add-book-btn"
                      onClick={() => {
                        setBookToEdit(null);
                        setShowBookForm(true);
                      }}
                      className="p-1.5 bg-[#1b3d2f] hover:bg-[#153025] text-white text-xs rounded flex items-center gap-1 transition-colors flex-1 justify-center shadow-xs"
                    >
                      <Plus size={11} />
                      Add Book
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Book creation / edit overlay form */}
            {showBookForm && (
              <div className="transition-all duration-300">
                <BookForm
                  bookToEdit={bookToEdit}
                  onSave={handleSaveBook}
                  onCancel={() => {
                    setShowBookForm(false);
                    setBookToEdit(null);
                  }}
                />
              </div>
            )}

            {/* Category / Area Tabs */}
            <div className="border-b border-stone-200 flex flex-wrap justify-between items-center gap-4 pt-2">
              <div className="flex gap-1">
                <button
                  id="tab-catalog-btn"
                  onClick={() => setActiveTab('catalog')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'catalog'
                      ? 'border-stone-800 text-stone-900'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  Books Catalog
                </button>

                {currentUser.role === 'librarian' && (
                  <button
                    id="tab-members-btn"
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === 'members'
                        ? 'border-stone-800 text-stone-900'
                        : 'border-transparent text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    Manage Members
                  </button>
                )}

                <button
                  id="tab-api-sandbox-btn"
                  onClick={() => setActiveTab('api-sandbox')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'api-sandbox'
                      ? 'border-stone-800 text-stone-900'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Code size={13} />
                  API Sandbox
                </button>

                {currentUser.role === 'librarian' && (
                  <button
                    id="tab-server-logs-btn"
                    onClick={() => setActiveTab('server-logs')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'server-logs'
                        ? 'border-stone-800 text-stone-900'
                        : 'border-transparent text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    <Database size={13} />
                    Live Server Logs
                  </button>
                )}
              </div>

              <div className="text-[10px] font-mono text-stone-400 bg-stone-50 px-2 py-1 rounded border border-stone-200/60 hidden sm:block">
                Active Sandbox IDs: <span className="font-semibold text-stone-700">{selectedBookId || 'None'}</span> / <span className="font-semibold text-stone-700">{selectedMemberId || 'None'}</span>
              </div>
            </div>

            {/* Tab Panels */}
            <div className="py-2">
              {activeTab === 'catalog' && (
                <BookList
                  books={books}
                  myBorrowedBooks={myBorrowedBooks}
                  currentUser={currentUser}
                  selectedBookId={selectedBookId}
                  onSelectBook={(id) => {
                    setSelectedBookId(id);
                    showNotification(`Book ${id} targeted inside Sandbox!`, 'success');
                  }}
                  onEditBook={(book) => {
                    setBookToEdit(book);
                    setShowBookForm(true);
                  }}
                  onDeleteBook={handleDeleteBook}
                  onBorrowBook={handleBorrowBook}
                  onReturnBook={handleReturnBook}
                />
              )}

              {activeTab === 'members' && currentUser.role === 'librarian' && (
                <MemberManager
                  members={members}
                  selectedMemberId={selectedMemberId}
                  onSelectMember={(id) => {
                    setSelectedMemberId(id);
                    showNotification(`Member ${id} targeted inside Sandbox!`, 'success');
                  }}
                  onDeleteMember={handleDeleteMember}
                />
              )}

              {activeTab === 'api-sandbox' && (
                <ApiReference
                  token={token}
                  selectedBookId={selectedBookId}
                  selectedMemberId={selectedMemberId}
                />
              )}

              {activeTab === 'server-logs' && currentUser.role === 'librarian' && (
                <ServerLogs token={token} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}