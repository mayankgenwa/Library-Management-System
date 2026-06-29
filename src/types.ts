export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional on client side for security
  role: 'librarian' | 'member';
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  memberId: string;
  bookId: string;
  borrowDate: string;
  returnDate: string | null;
  status: 'borrowed' | 'returned';
}

// Type used for the live API logger in our playground
export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  requestBody?: any;
  responseBody?: any;
  token?: string;
}
