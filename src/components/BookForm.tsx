import React, { useState, useEffect } from 'react';
import { BookOpen, X, Check } from 'lucide-react';
import { Book } from '../types.js';

interface BookFormProps {
  bookToEdit?: Book | null;
  onSave: (bookData: { title: string; author: string; isbn: string; category: string; quantity: number }) => Promise<boolean>;
  onCancel: () => void;
}

const CATEGORIES = [
  'Fiction',
  'Science',
  'Sci-Fi',
  'Classics',
  'Technology',
  'History',
  'Philosophy',
  'Art',
  'Biography',
];

export default function BookForm({ bookToEdit, onSave, onCancel }: BookFormProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('Fiction');
  const [quantity, setQuantity] = useState(1);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author);
      setIsbn(bookToEdit.isbn);
      setQuantity(bookToEdit.quantity);
      
      if (CATEGORIES.includes(bookToEdit.category)) {
        setCategory(bookToEdit.category);
        setUseCustomCategory(false);
      } else {
        setUseCustomCategory(true);
        setCustomCategory(bookToEdit.category);
      }
    }
  }, [bookToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations (Step 18 requirements)
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setError('Title, Author, and ISBN are required');
      return;
    }

    if (quantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    setLoading(true);
    const finalCategory = useCustomCategory ? customCategory.trim() : category;

    const success = await onSave({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category: finalCategory || 'General',
      quantity,
    });

    setLoading(false);
    if (!success) {
      setError('Failed to save book. Please verify your inputs.');
    }
  };

  return (
    <div id="book-form-card" className="bg-[#faf9f5] border border-stone-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <BookOpen className="text-[#1b3d2f]" size={18} />
          <h3 className="font-serif font-medium text-stone-900">
            {bookToEdit ? 'Edit Library Book' : 'Add New Book to Catalog'}
          </h3>
        </div>
        <button
          id="cancel-book-form-top-btn"
          onClick={onCancel}
          className="p-1 hover:bg-stone-200 rounded text-stone-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-stone-800">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Book Title *</label>
          <input
            id="book-title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Designing Data-Intensive Applications"
            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-sm placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Author Name *</label>
            <input
              id="book-author-input"
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g., Martin Kleppmann"
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-sm placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">ISBN Number *</label>
            <input
              id="book-isbn-input"
              type="text"
              required
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g., 9781449373320"
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-sm placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-stone-700">Category *</label>
              <button
                id="toggle-custom-cat-btn"
                type="button"
                onClick={() => setUseCustomCategory(!useCustomCategory)}
                className="text-[10px] text-[#1b3d2f] hover:underline"
              >
                {useCustomCategory ? 'Use predefined list' : 'Create custom category'}
              </button>
            </div>

            {useCustomCategory ? (
              <input
                id="book-custom-category-input"
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g., Programming"
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-sm placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              />
            ) : (
              <select
                id="book-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-sm focus:outline-none focus:border-stone-400 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Stock Quantity *</label>
            <input
              id="book-quantity-input"
              type="number"
              required
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-sm focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
          <button
            id="cancel-book-form-btn"
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium border border-stone-200 bg-white hover:bg-stone-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            id="submit-book-form-btn"
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-medium bg-[#1b3d2f] hover:bg-[#153025] text-white rounded-md transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            <Check size={14} />
            {loading ? 'Saving...' : bookToEdit ? 'Save Book Changes' : 'Publish Book'}
          </button>
        </div>
      </form>
    </div>
  );
}
