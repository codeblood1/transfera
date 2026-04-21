export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  country: string;
  currency: string;
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  account_number: string;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  sender_account_id: string;
  recipient_type: 'internal' | 'external_bank' | 'mobile_wallet' | 'cash_pickup';
  recipient_account_id: string | null;
  recipient_name: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_bank_name: string | null;
  recipient_account_number: string | null;
  recipient_routing_number: string | null;
  recipient_country: string;
  amount: number;
  fee: number;
  exchange_rate: number | null;
  converted_amount: number | null;
  currency: string;
  recipient_currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  description: string | null;
  reference_code: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  transfer_id: string | null;
  type: 'credit' | 'debit' | 'fee';
  amount: number;
  currency: string;
  balance_after: number;
  description: string;
  reference_code: string;
  created_at: string;
}

export interface Country {
  code: string;
  name: string;
  currency_code: string;
  currency_name: string;
  flag_emoji: string;
  delivery_methods: string[];
  is_active: boolean;
}

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  fee_percentage: number;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  country: string;
  currency: string;
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  account: {
    id: string;
    balance: number;
    currency: string;
    account_number: string;
    status: 'active' | 'frozen' | 'closed';
  };
  created_at: string;
}

export interface AccountStats {
  balance: number;
  total_sent: number;
  total_received: number;
  pending_transfers: number;
  currency: string;
}

export interface ExchangeCalculation {
  original_amount: number;
  fee: number;
  fee_percentage: number;
  exchange_rate: number;
  converted_amount: number;
  total_deduction: number;
  from_currency: string;
  to_currency: string;
}
