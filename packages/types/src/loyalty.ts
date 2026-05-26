export interface LoyaltyAccountResponse {
  id: string;
  customerId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  stampCount: number;
  stampTotalEarned: number;
  stampTarget: number;
  transactions: LoyaltyTransactionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransactionResponse {
  id: string;
  loyaltyAccountId: string;
  type: 'EARN' | 'REDEEM' | 'STAMP' | 'STAMP_REDEEM' | 'ADMIN_ADJUST' | 'ADMIN_STAMP';
  points: number;
  reason: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface QRCardResponse {
  id: string;
  customerId: string;
  publicToken: string;
  isActive: boolean;
  regeneratedAt: string | null;
  createdAt: string;
}
