import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { LibraryDB } from './db.js';
import { authMiddleware, roleMiddleware, AuthenticatedRequest } from './middleware.js';
import { ApiLog } from '../src/types.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment variables');

export const apiLogs: ApiLog[] = [];

export function logApiRequest(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  const id = `log_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  let responseBody: any = null;
  res.json = function (body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    if (req.originalUrl === '/api/system/logs' || req.originalUrl === '/api/system/db-info') return;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    const newLog: ApiLog = {
      id,
      timestamp,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
      responseBody: responseBody,
      token,
    };

    apiLogs.unshift(newLog);
    if (apiLogs.length > 50) apiLogs.pop();
  });

  next();
}

// System Logging Route
router.get('/system/logs', authMiddleware, roleMiddleware('librarian'), (req: Request, res: Response) => {
  res.json({
    success: true,
    logs: apiLogs,
  });
});
 
// System DB Info Route
router.get('/system/db-info', authMiddleware, roleMiddleware('librarian'), (req: Request, res: Response) => {
  res.json({
    success: true,
    mode: LibraryDB.getDbMode(),
    uriConfigured: !!process.env.MONGODB_URI,
  });
});

// Helper validation rules
function validateEmail(email: string): boolean {
  return typeof email === 'string' && email.includes('@') && email.length >= 3;
}

// 1. Authentication APIs
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic Validations
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    if (!email || !validateEmail(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }
    if (!role || (role !== 'member' && role !== 'librarian')) {
      res.status(400).json({ success: false, message: 'Role must be either librarian or member' });
      return;
    }

    // Check duplicate email
    const existingUser = await LibraryDB.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Save user
    const newUser = await LibraryDB.createUser({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await LibraryDB.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password || '');
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
});

// 2. Book Management APIs
// Add Book (Librarian only)
router.post('/books', authMiddleware, roleMiddleware('librarian'), async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;

    if (!title || !author || !isbn) {
      res.status(400).json({ success: false, message: 'Title, Author, and ISBN are required' });
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 0) {
      res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
      return;
    }

    const newBook = await LibraryDB.createBook({
      title,
      author,
      isbn,
      category: category || 'General',
      quantity: qty,
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book: newBook,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to add book' });
  }
});

// Get All Books (All authenticated users)
router.get('/books', authMiddleware, async (req: Request, res: Response) => {
  try {
    const books = await LibraryDB.getBooks();
    res.json({
      success: true,
      books,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load books' });
  }
});

// Get Book Details
router.get('/books/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const book = await LibraryDB.getBookById(req.params.id);
    if (!book) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    res.json({
      success: true,
      book,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load book' });
  }
});

// Update Book (Librarian only)
router.put('/books/:id', authMiddleware, roleMiddleware('librarian'), async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;

    const bookExists = await LibraryDB.getBookById(req.params.id);
    if (!bookExists) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (isNaN(qty) || qty < 0) {
        res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
        return;
      }
    }

    const updatedBook = await LibraryDB.updateBook(req.params.id, {
      title,
      author,
      isbn,
      category,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
    });

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update book' });
  }
});

// Delete Book (Librarian only)
router.delete('/books/:id', authMiddleware, roleMiddleware('librarian'), async (req: Request, res: Response) => {
  try {
    const deleted = await LibraryDB.deleteBook(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Book removed successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete book' });
  }
});

// 3. Member APIs (Librarian only)
router.get('/members', authMiddleware, roleMiddleware('librarian'), async (req: Request, res: Response) => {
  try {
    const users = await LibraryDB.getUsers();
    // Filter only members
    const members = users.filter(u => u.role === 'member').map(({ password, ...u }) => u);
    res.json({
      success: true,
      members,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load members' });
  }
});

router.delete('/members/:id', authMiddleware, roleMiddleware('librarian'), async (req: Request, res: Response) => {
  try {
    const user = await LibraryDB.getUserById(req.params.id);
    if (!user || user.role !== 'member') {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    await LibraryDB.deleteUser(req.params.id);
    res.json({
      success: true,
      message: 'Member account removed successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete member' });
  }
});

// 4. Borrow / Return APIs (Members only)
// Borrow Book
router.post('/books/:id/borrow', authMiddleware, roleMiddleware('member'), async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    const user = (req as AuthenticatedRequest).user!;

    const book = await LibraryDB.getBookById(bookId);
    if (!book) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    if (book.availableQuantity <= 0) {
      res.status(400).json({ success: false, message: 'Book is currently unavailable' });
      return;
    }

    // Check if member already has same book borrowed
    const borrows = await LibraryDB.getBorrows();
    const hasBorrowed = borrows.find(
      b => b.memberId === user.id && b.bookId === bookId && b.status === 'borrowed'
    );
    if (hasBorrowed) {
      res.status(400).json({ success: false, message: 'You have already borrowed this book' });
      return;
    }

    const record = await LibraryDB.createBorrow(user.id, bookId);
    if (!record) {
      res.status(500).json({ success: false, message: 'Failed to borrow book' });
      return;
    }

    res.json({
      success: true,
      message: 'Book borrowed successfully',
      record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to borrow book' });
  }
});

// Return Book
router.post('/books/:id/return', authMiddleware, roleMiddleware('member'), async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    const user = (req as AuthenticatedRequest).user!;

    const record = await LibraryDB.returnBorrow(user.id, bookId);
    if (!record) {
      res.status(400).json({ success: false, message: 'You have not borrowed this book or already returned it' });
      return;
    }

    res.json({
      success: true,
      message: 'Book returned successfully',
      record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to return book' });
  }
});

// My Borrowed Books
router.get('/members/me/books', authMiddleware, roleMiddleware('member'), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const borrows = await LibraryDB.getBorrows();
    const activeBorrows = borrows.filter(b => b.memberId === user.id && b.status === 'borrowed');
    
    // Map to get Book details with borrow info
    const books = [];
    for (const b of activeBorrows) {
      const book = await LibraryDB.getBookById(b.bookId);
      if (book) {
        books.push({
          ...book,
          borrowDate: b.borrowDate,
          borrowId: b.id,
        });
      }
    }

    res.json({
      success: true,
      books,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch borrowed books' });
  }
});

export default router;
