export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: "Admin" | "Librarian" | "Member" | "Guest";
  isLocked: boolean;
  createdAt: string;
  updatedAt?: string;
  membershipTier?: string;
}

export interface MembershipRequest {
  id: string;
  userId: string;
  tierName: string;
  price: number;
  paymentMethod: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  userDetail?: {
    fullName: string;
    email: string;
  };
}

export interface Author {
  id: string;
  fullName: string;
  biography?: string;
  dateOfBirth?: string;
  nationality?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  description?: string;
  publishedYear?: number;
  publisher?: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  categoryId: string;
  createdAt: string;
  updatedAt?: string;
  authors: string[];
  authorsDetail?: Author[];
  categoryDetail?: Category;
}

export interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  approvedByUserId?: string;
  returnedByUserId?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: "Pending" | "Borrowed" | "Returned" | "Overdue" | "Rejected" | "ReturnPending";
  fineAmount: number;
  isFinePaid: boolean;
  notes?: string;
  createdAt: string;
  bookDetail?: Book;
  userDetail?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  } | null;
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expiryDate: string;
  status: "Waiting" | "Available" | "Fulfilled" | "Cancelled" | "Expired";
  queuePosition: number;
  bookDetail?: Book;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
