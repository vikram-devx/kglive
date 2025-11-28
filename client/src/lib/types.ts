// User related types
export enum UserRole {
  ADMIN = "admin",
  SUBADMIN = "subadmin",
  PLAYER = "player"
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  balance: number;
  assignedTo: number | null;
  isBlocked: boolean;
}

// Game related types
export enum GameOutcome {
  WIN = "win",
  LOSS = "loss",
  PENDING = "pending",
  CANCELLED = "cancelled"
}

export interface Game {
  id: number;
  userId: number;
  betAmount: number;
  gameType: string;
  prediction: string;
  result: string | null;
  payout: number | null;
  status: GameOutcome;
  marketId?: number;
  matchId?: number;
  createdAt: string;
}

// Satamatka market types
export enum MarketType {
  DISHAWAR = "dishawar",
  GALI = "gali",
  FARIDABAD = "faridabad",
  GAZIABAD = "gaziabad",
  CUSTOM = "custom"
}

export enum MarketStatus {
  ACTIVE = "active",
  CLOSED = "closed",
  UPCOMING = "upcoming",
  RESULTED = "resulted",
  CANCELLED = "cancelled"
}

export interface SatamatkaMarket {
  id: number;
  name: string;
  type: MarketType;
  openTime: string;
  closeTime: string;
  openResult?: string;
  closeResult?: string;
  status: MarketStatus;
  createdAt: string;
}

export enum SatamatkaGameMode {
  SINGLE = "single", 
  JODI = "jodi",
  PATTI = "patti",
  HURF = "hurf",
  CROSS = "cross",
  ODD_EVEN = "odd_even"
}

// Team match types
export enum TeamMatchResult {
  TEAM_A = "team_a",
  TEAM_B = "team_b", 
  DRAW = "draw",
  PENDING = "pending",
  CANCELLED = "cancelled"
}

export enum MatchCategory {
  CRICKET = "cricket",
  FOOTBALL = "football",
  BASKETBALL = "basketball",
  TENNIS = "tennis",
  OTHER = "other"
}

export interface TeamMatch {
  id: number;
  teamA: string;
  teamB: string;
  category: MatchCategory;
  startTime: string;
  odds: {
    teamA: number;
    teamB: number;
    draw: number;
  };
  result: TeamMatchResult;
  status: string;
  createdAt: string;
}

// Wallet system types
export enum PaymentMode {
  UPI = "upi",
  BANK = "bank"
}

export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export enum RequestType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal"
}

export interface WalletRequest {
  id: number;
  userId: number;
  amount: number;
  requestType: RequestType;
  paymentMode: PaymentMode;
  paymentDetails: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    utrNumber?: string;
    transactionId?: string;
  };
  status: RequestStatus;
  proofImageUrl?: string;
  notes?: string;
  reviewedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  relatedId?: number;
  createdAt: string;
}

export interface PaymentDetails {
  upiDetails?: {
    upiId: string;
    qrImageUrl?: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}