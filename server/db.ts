import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Book, BorrowRecord } from '../src/types.js';

const DB_PATH = path.resolve(process.cwd(), 'db.json');

// --- 1. Mongoose MongoDB Schema Definitions ---
const MongoUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['librarian', 'member'], default: 'member' },
  createdAt: { type: String, required: true },
});

const MongoBookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  createdAt: { type: String, required: true },
});

const MongoBorrowSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  memberId: { type: String, required: true },
  bookId: { type: String, required: true },
  borrowDate: { type: String, required: true },
  returnDate: { type: String, default: null },
  status: { type: String, enum: ['borrowed', 'returned'], default: 'borrowed' },
});

// Cast the compiled Mongoose models as any to bypass strict generic query compilation limitations in standard TS linter
const UserModel = (mongoose.models.User || mongoose.model('User', MongoUserSchema)) as any;
const BookModel = (mongoose.models.Book || mongoose.model('Book', MongoBookSchema)) as any;
const BorrowModel = (mongoose.models.Borrow || mongoose.model('Borrow', MongoBorrowSchema)) as any;


// --- 2. Local JSON Database Storage Fallback Schemas ---
interface LocalSchema {
  users: User[];
  books: Book[];
  borrows: BorrowRecord[];
}

const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

const getInitialData = (): LocalSchema => {
  const adminId = 'u_eleanor';
  const memberId = 'u_julian';
  const book1Id = 'b_1';
  const book2Id = 'b_2';
  const book3Id = 'b_3';
  const book4Id = 'b_4';
  const book5Id = 'b_5';

  const defaultUsers: User[] = [
    {
      id: adminId,
      name: 'Eleanor Vance',
      email: 'eleanor@library.org',
      password: hashPassword('password123'),
      role: 'librarian',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: memberId,
      name: 'Julian Barnes',
      email: 'julian@member.com',
      password: hashPassword('password123'),
      role: 'member',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const defaultBooks: Book[] = [
    {
      id: book1Id,
      title: 'The Shadow of the Wind',
      author: 'Carlos Ruiz Zafón',
      isbn: '9780143034902',
      category: 'Fiction',
      quantity: 3,
      availableQuantity: 3,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: book2Id,
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Science',
      quantity: 2,
      availableQuantity: 2,
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: book3Id,
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      category: 'Sci-Fi',
      quantity: 4,
      availableQuantity: 4,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: book4Id,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780060935467',
      category: 'Classics',
      quantity: 3,
      availableQuantity: 2, // 1 borrowed by Julian
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: book5Id,
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '9781449373320',
      category: 'Technology',
      quantity: 2,
      availableQuantity: 2,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const defaultBorrows: BorrowRecord[] = [
    {
      id: 'br_1',
      memberId: memberId,
      bookId: book4Id,
      borrowDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      returnDate: null,
      status: 'borrowed',
    }
  ];

  return {
    users: defaultUsers,
    books: defaultBooks,
    borrows: defaultBorrows,
  };
};

export class LibraryDB {
  private static localData: LocalSchema | null = null;
  private static isUsingMongo = false;

  // Initializer - connects to Mongo if URI is supplied, else triggers file storage
  static async init() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      console.log('Connecting to MongoDB...');
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        this.isUsingMongo = true;
        console.log('Successfully connected to MongoDB.');

        // Pre-seed MongoDB if empty
        await this.seedMongoIfNeeded();
      } catch (err) {
        console.error('MongoDB connection failed. Falling back to local file database.', err);
        this.isUsingMongo = false;
      }
    } else {
      console.log('No MONGODB_URI environment variable detected. Running on local file database.');
      this.isUsingMongo = false;
    }

    if (!this.isUsingMongo) {
      this.loadLocal();
    }
  }

  static getDbMode(): 'mongodb' | 'json' {
    return this.isUsingMongo ? 'mongodb' : 'json';
  }

  private static async seedMongoIfNeeded() {
    try {
      const userCount = await UserModel.countDocuments();
      const bookCount = await BookModel.countDocuments();
      if (userCount === 0 && bookCount === 0) {
        console.log('MongoDB is empty. Seeding demo library data...');
        const initial = getInitialData();
        await UserModel.insertMany(initial.users as any[]);
        await BookModel.insertMany(initial.books as any[]);
        await BorrowModel.insertMany(initial.borrows as any[]);
        console.log('MongoDB successfully seeded.');
      }
    } catch (e) {
      console.error('Failed to seed MongoDB', e);
    }
  }

  private static loadLocal() {
    if (this.localData) return;
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.localData = JSON.parse(raw);
      } else {
        this.localData = getInitialData();
        this.saveLocal();
      }
    } catch (e) {
      console.error('Error loading JSON database, resetting to initial state', e);
      this.localData = getInitialData();
      this.saveLocal();
    }
  }

  private static saveLocal() {
    if (!this.localData) return;
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save JSON database file', e);
    }
  }

  // --- 3. Unified Asynchronous Data Operations ---

  // User Operations
  static async getUsers(): Promise<User[]> {
    if (this.isUsingMongo) {
      const users = await UserModel.find({}).lean();
      return users as unknown as User[];
    } else {
      this.loadLocal();
      return this.localData!.users;
    }
  }

  static async getUserById(id: string): Promise<User | undefined> {
    if (this.isUsingMongo) {
      const user = await UserModel.findOne({ id }).lean();
      return user ? (user as unknown as User) : undefined;
    } else {
      this.loadLocal();
      return this.localData!.users.find(u => u.id === id);
    }
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.isUsingMongo) {
      const user = await UserModel.findOne({ email: new RegExp(`^${email}$`, 'i') }).lean();
      return user ? (user as unknown as User) : undefined;
    } else {
      this.loadLocal();
      return this.localData!.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
  }

  static async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = `u_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newUser: User = { ...user, id, createdAt };

    if (this.isUsingMongo) {
      const created = await UserModel.create(newUser);
      return created.toObject() as unknown as User;
    } else {
      this.loadLocal();
      this.localData!.users.push(newUser);
      this.saveLocal();
      return newUser;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    if (this.isUsingMongo) {
      const res = await UserModel.deleteOne({ id });
      if (res.deletedCount && res.deletedCount > 0) {
        // Clean up borrows associated with this member
        await BorrowModel.deleteMany({ memberId: id });
        return true;
      }
      return false;
    } else {
      this.loadLocal();
      const index = this.localData!.users.findIndex(u => u.id === id);
      if (index !== -1) {
        this.localData!.users.splice(index, 1);
        this.localData!.borrows = this.localData!.borrows.filter(b => b.memberId !== id);
        this.saveLocal();
        return true;
      }
      return false;
    }
  }

  // Book Operations
  static async getBooks(): Promise<Book[]> {
    if (this.isUsingMongo) {
      const books = await BookModel.find({}).lean();
      return books as unknown as Book[];
    } else {
      this.loadLocal();
      return this.localData!.books;
    }
  }

  static async getBookById(id: string): Promise<Book | undefined> {
    if (this.isUsingMongo) {
      const book = await BookModel.findOne({ id }).lean();
      return book ? (book as unknown as Book) : undefined;
    } else {
      this.loadLocal();
      return this.localData!.books.find(b => b.id === id);
    }
  }

  static async createBook(book: Omit<Book, 'id' | 'createdAt' | 'availableQuantity'>): Promise<Book> {
    const id = `b_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newBook: Book = {
      ...book,
      id,
      availableQuantity: book.quantity,
      createdAt,
    };

    if (this.isUsingMongo) {
      const created = await BookModel.create(newBook);
      return created.toObject() as unknown as Book;
    } else {
      this.loadLocal();
      this.localData!.books.push(newBook);
      this.saveLocal();
      return newBook;
    }
  }

  static async updateBook(id: string, updates: Partial<Omit<Book, 'id' | 'createdAt'>>): Promise<Book | null> {
    if (this.isUsingMongo) {
      const bookObj = await BookModel.findOne({ id });
      if (!bookObj) return null;

      if (updates.quantity !== undefined) {
        const difference = updates.quantity - bookObj.quantity;
        bookObj.quantity = updates.quantity;
        bookObj.availableQuantity = Math.max(0, bookObj.availableQuantity + difference);
      }
      if (updates.title !== undefined) bookObj.title = updates.title;
      if (updates.author !== undefined) bookObj.author = updates.author;
      if (updates.isbn !== undefined) bookObj.isbn = updates.isbn;
      if (updates.category !== undefined) bookObj.category = updates.category;

      await bookObj.save();
      return bookObj.toObject() as unknown as Book;
    } else {
      this.loadLocal();
      const book = this.localData!.books.find(b => b.id === id);
      if (!book) return null;

      if (updates.quantity !== undefined) {
        const difference = updates.quantity - book.quantity;
        book.quantity = updates.quantity;
        book.availableQuantity = Math.max(0, book.availableQuantity + difference);
      }
      if (updates.title !== undefined) book.title = updates.title;
      if (updates.author !== undefined) book.author = updates.author;
      if (updates.isbn !== undefined) book.isbn = updates.isbn;
      if (updates.category !== undefined) book.category = updates.category;

      this.saveLocal();
      return book;
    }
  }

  static async deleteBook(id: string): Promise<boolean> {
    if (this.isUsingMongo) {
      const res = await BookModel.deleteOne({ id });
      if (res.deletedCount && res.deletedCount > 0) {
        await BorrowModel.deleteMany({ bookId: id });
        return true;
      }
      return false;
    } else {
      this.loadLocal();
      const index = this.localData!.books.findIndex(b => b.id === id);
      if (index !== -1) {
        this.localData!.books.splice(index, 1);
        this.localData!.borrows = this.localData!.borrows.filter(b => b.bookId !== id);
        this.saveLocal();
        return true;
      }
      return false;
    }
  }

  // Borrow Record Operations
  static async getBorrows(): Promise<BorrowRecord[]> {
    if (this.isUsingMongo) {
      const borrows = await BorrowModel.find({}).lean();
      return borrows as unknown as BorrowRecord[];
    } else {
      this.loadLocal();
      return this.localData!.borrows;
    }
  }

  static async createBorrow(memberId: string, bookId: string): Promise<BorrowRecord | null> {
    if (this.isUsingMongo) {
      const book = await BookModel.findOne({ id: bookId });
      if (!book || book.availableQuantity <= 0) return null;

      // Check duplicate checkouts
      const existing = await BorrowModel.findOne({ memberId, bookId, status: 'borrowed' });
      if (existing) return null;

      const borrowId = `br_${Math.random().toString(36).substr(2, 9)}`;
      const newBorrow: BorrowRecord = {
        id: borrowId,
        memberId,
        bookId,
        borrowDate: new Date().toISOString(),
        returnDate: null,
        status: 'borrowed',
      };

      // Atomic book updates
      book.availableQuantity -= 1;
      await book.save();
      const created = await BorrowModel.create(newBorrow);
      return created.toObject() as unknown as BorrowRecord;
    } else {
      this.loadLocal();
      const book = this.localData!.books.find(b => b.id === bookId);
      if (!book || book.availableQuantity <= 0) return null;

      const existing = this.localData!.borrows.find(
        b => b.memberId === memberId && b.bookId === bookId && b.status === 'borrowed'
      );
      if (existing) return null;

      const newBorrow: BorrowRecord = {
        id: `br_${Math.random().toString(36).substr(2, 9)}`,
        memberId,
        bookId,
        borrowDate: new Date().toISOString(),
        returnDate: null,
        status: 'borrowed',
      };

      book.availableQuantity -= 1;
      this.localData!.borrows.push(newBorrow);
      this.saveLocal();
      return newBorrow;
    }
  }

  static async returnBorrow(memberId: string, bookId: string): Promise<BorrowRecord | null> {
    if (this.isUsingMongo) {
      const record = await BorrowModel.findOne({ memberId, bookId, status: 'borrowed' });
      if (!record) return null;

      const book = await BookModel.findOne({ id: bookId });
      if (book) {
        book.availableQuantity = Math.min(book.quantity, book.availableQuantity + 1);
        await book.save();
      }

      record.status = 'returned';
      record.returnDate = new Date().toISOString();
      await record.save();
      return record.toObject() as unknown as BorrowRecord;
    } else {
      this.loadLocal();
      const record = this.localData!.borrows.find(
        b => b.memberId === memberId && b.bookId === bookId && b.status === 'borrowed'
      );
      if (!record) return null;

      const book = this.localData!.books.find(b => b.id === bookId);
      if (book) {
        book.availableQuantity = Math.min(book.quantity, book.availableQuantity + 1);
      }

      record.status = 'returned';
      record.returnDate = new Date().toISOString();
      this.saveLocal();
      return record;
    }
  }
}
