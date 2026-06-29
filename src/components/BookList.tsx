import { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, Clock, Trash2, Edit3, Bookmark, CornerDownLeft, BookOpenCheck } from 'lucide-react';
import { Book, User } from '../types.js';

interface BookListProps {
  books: Book[];
  myBorrowedBooks: any[];
  currentUser: User | null;
  onSelectBook: (id: string) => void;
  selectedBookId?: string;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onBorrowBook: (id: string) => void;
  onReturnBook: (id: string) => void;
}

export default function BookList({
  books,
  myBorrowedBooks,
  currentUser,
  onSelectBook,
  selectedBookId,
  onEditBook,
  onDeleteBook,
  onBorrowBook,
  onReturnBook,
}: BookListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Derive unique categories for filter
  const categories = useMemo(() => {
    const list = new Set(books.map((b) => b.category));
    return ['All', ...Array.from(list)];
  }, [books]);

  // Filter & Search
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm);
      const matchCategory = selectedCategory === 'All' || book.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [books, searchTerm, selectedCategory]);

  return (
    <div id="book-list-container" className="space-y-6">
      {/* 1. Member's Checked-Out Books */}
      {currentUser?.role === 'member' && (
        <div id="my-borrows-section" className="bg-[#fcfbf9] border border-stone-200 rounded-lg p-5">
          <h3 className="font-serif font-medium text-stone-900 text-sm mb-3 flex items-center gap-1.5">
            <BookOpenCheck size={16} className="text-[#1b3d2f]" />
            Your Checked-Out Books ({myBorrowedBooks.length})
          </h3>

          {myBorrowedBooks.length === 0 ? (
            <p className="text-xs text-stone-400 font-serif italic py-2">
              You do not have any borrowed books currently. Select a book from the catalog below to borrow.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myBorrowedBooks.map((book) => (
                <div
                  id={`borrowed-book-${book.id}`}
                  key={book.id}
                  onClick={() => onSelectBook(book.id)}
                  className={`p-3 border rounded-md flex items-center justify-between transition-all cursor-pointer ${
                    selectedBookId === book.id
                      ? 'bg-stone-50 border-stone-800 ring-1 ring-stone-800'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <h4 className="text-xs font-semibold text-stone-800 truncate">{book.title}</h4>
                    <p className="text-[10px] text-stone-500 font-mono">By {book.author}</p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-[#9c4d32] font-mono">
                      <Clock size={10} />
                      Borrowed {new Date(book.borrowDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    id={`return-btn-${book.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReturnBook(book.id);
                    }}
                    className="shrink-0 px-2.5 py-1 text-[10px] font-medium bg-[#9c4d32] hover:bg-[#854129] text-white rounded transition-colors flex items-center gap-0.5"
                  >
                    <CornerDownLeft size={10} />
                    Return
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Main Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <Search size={14} />
          </span>
          <input
            id="book-search-input"
            type="text"
            placeholder="Search by Title, Author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-md text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div className="relative w-full md:w-48 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <Filter size={14} />
          </span>
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-md text-xs text-stone-700 focus:outline-none focus:border-stone-400 transition-colors appearance-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Catalog Table / Grid */}
      {filteredBooks.length === 0 ? (
        <div className="py-12 border border-dashed border-stone-200 rounded-lg text-center text-xs text-stone-400 font-serif italic">
          No books found matching the filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-200 rounded-lg">
          <table className="w-full text-left border-collapse text-stone-800">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Book Title</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Author</th>
                <th className="py-3 px-4 font-semibold hidden lg:table-cell">ISBN</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 text-center font-semibold">In Stock</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-xs">
              {filteredBooks.map((book) => {
                const isSelected = selectedBookId === book.id;
                const isOutOfStock = book.availableQuantity <= 0;
                const alreadyBorrowed = currentUser?.role === 'member' && myBorrowedBooks.some(b => b.id === book.id);

                return (
                  <tr
                    id={`book-row-${book.id}`}
                    key={book.id}
                    onClick={() => onSelectBook(book.id)}
                    className={`group transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-stone-100 font-medium' 
                        : 'hover:bg-stone-50 bg-white'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-stone-900 group-hover:text-[#1b3d2f] transition-colors">{book.title}</div>
                        <div className="text-[10px] text-stone-400 md:hidden font-mono">By {book.author}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-stone-600 font-mono">{book.author}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-stone-400 font-mono">{book.isbn}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[9px] bg-stone-100 text-stone-600 rounded border border-stone-200/60 font-mono">
                        {book.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        isOutOfStock 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {book.availableQuantity} / {book.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end items-center gap-1.5">
                        {currentUser?.role === 'librarian' ? (
                          <>
                            <button
                              id={`edit-book-btn-${book.id}`}
                              onClick={() => onEditBook(book)}
                              className="p-1 hover:bg-stone-200 rounded text-stone-600 hover:text-stone-900 transition-colors"
                              title="Edit Book Details"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              id={`delete-book-btn-${book.id}`}
                              onClick={() => onDeleteBook(book.id)}
                              className="p-1 hover:bg-stone-200 rounded text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Book"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : currentUser?.role === 'member' ? (
                          alreadyBorrowed ? (
                            <span className="text-[10px] text-stone-400 font-serif italic pr-2 flex items-center gap-1 select-none">
                              <Bookmark size={10} className="text-[#9c4d32]" />
                              Checked out
                            </span>
                          ) : (
                            <button
                              id={`borrow-btn-${book.id}`}
                              onClick={() => onBorrowBook(book.id)}
                              disabled={isOutOfStock}
                              className={`px-3 py-1 text-[10px] font-medium rounded transition-colors flex items-center gap-1 shadow-xs ${
                                isOutOfStock
                                  ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                  : 'bg-[#1b3d2f] hover:bg-[#153025] text-white'
                              }`}
                            >
                              <BookOpen size={10} />
                              Borrow
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-stone-400 italic font-serif pr-2 select-none">
                            Sign in to interact
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
