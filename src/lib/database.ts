import { supabase } from './supabase';
import type {
  Profile, Account, Transfer, Transaction, Country,
  ExchangeRate, UserProfile, AccountStats, ExchangeCalculation
} from '@/types';

// ==================== AUTH ====================

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ==================== PROFILE ====================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (pError || !profile) return null;

  const { data: account, error: aError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (aError || !account) return null;

  const { data: userData } = await supabase.auth.getUser();

  return {
    id: profile.id,
    email: userData.user?.email || '',
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone,
    country: profile.country,
    currency: profile.currency,
    kyc_status: profile.kyc_status,
    account: {
      id: account.id,
      balance: account.balance,
      currency: account.currency,
      account_number: account.account_number,
      status: account.status,
    },
    created_at: profile.created_at,
  };
}

// ==================== ACCOUNT ====================

export async function getAccount(userId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Account;
}

export async function getAccountStats(userId: string): Promise<AccountStats | null> {
  const { data: account, error: aError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (aError || !account) return null;

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('account_id', account.id);

  const { data: pending } = await supabase
    .from('transfers')
    .select('id', { count: 'exact' })
    .eq('sender_account_id', account.id)
    .eq('status', 'pending');

  const totalSent = transactions?.filter(t => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0) || 0;
  const totalReceived = transactions?.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0) || 0;

  return {
    balance: account.balance,
    total_sent: totalSent,
    total_received: totalReceived,
    pending_transfers: pending?.length || 0,
    currency: account.currency,
  };
}

export async function getTransactions(accountId: string, limit = 20): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as Transaction[];
}

// ==================== TRANSFERS ====================

export interface CreateTransferInput {
  sender_account_id: string;
  recipient_type: 'internal' | 'external_bank' | 'mobile_wallet' | 'cash_pickup';
  recipient_account_id?: string | null;
  recipient_name: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  recipient_bank_name?: string | null;
  recipient_account_number?: string | null;
  recipient_routing_number?: string | null;
  recipient_country: string;
  amount: number;
  fee?: number;
  exchange_rate?: number | null;
  converted_amount?: number | null;
  currency: string;
  recipient_currency: string;
  description?: string | null;
}

export async function createTransfer(input: CreateTransferInput): Promise<Transfer | null> {
  // Build clean payload - only include fields that are actually set (not undefined)
  // This prevents PostgREST columns/body mismatch errors
  const payload: Record<string, unknown> = {
    sender_account_id: input.sender_account_id,
    recipient_type: input.recipient_type,
    recipient_name: input.recipient_name,
    recipient_country: input.recipient_country,
    amount: input.amount,
    currency: input.currency,
    recipient_currency: input.recipient_currency,
    status: 'pending',
  };

  // Only add optional fields if they have a non-undefined value
  if (input.recipient_account_id !== undefined) payload.recipient_account_id = input.recipient_account_id;
  if (input.recipient_email !== undefined) payload.recipient_email = input.recipient_email;
  if (input.recipient_phone !== undefined) payload.recipient_phone = input.recipient_phone;
  if (input.recipient_bank_name !== undefined) payload.recipient_bank_name = input.recipient_bank_name;
  if (input.recipient_account_number !== undefined) payload.recipient_account_number = input.recipient_account_number;
  if (input.recipient_routing_number !== undefined) payload.recipient_routing_number = input.recipient_routing_number;
  if (input.fee !== undefined) payload.fee = input.fee;
  if (input.exchange_rate !== undefined) payload.exchange_rate = input.exchange_rate;
  if (input.converted_amount !== undefined) payload.converted_amount = input.converted_amount;
  if (input.description !== undefined) payload.description = input.description;

  const { data, error } = await supabase
    .from('transfers')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('createTransfer error:', error.message, error.details, error.hint);
    throw new Error(error.message);
  }
  return data as Transfer;
}

export async function getTransfers(accountId: string, status?: string, limit = 50): Promise<Transfer[]> {
  // Fetch transfers where user is EITHER sender OR recipient (internal transfers)
  let query = supabase
    .from('transfers')
    .select('*')
    .or(`sender_account_id.eq.${accountId},recipient_account_id.eq.${accountId}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Transfer[];
}

export async function getTransferById(transferId: string, accountId: string): Promise<Transfer | null> {
  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .eq('id', transferId)
    .or(`sender_account_id.eq.${accountId},recipient_account_id.eq.${accountId}`)
    .single();
  if (error) return null;
  return data as Transfer;
}

export async function cancelTransfer(transferId: string, accountId: string): Promise<void> {
  const { error } = await supabase
    .from('transfers')
    .update({ status: 'rejected', rejection_reason: 'Cancelled by user' })
    .eq('id', transferId)
    .or(`sender_account_id.eq.${accountId},recipient_account_id.eq.${accountId}`)
    .eq('status', 'pending');
  if (error) throw error;
}

// ==================== COUNTRIES ====================

export async function getCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from('supported_countries')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) return [];
  return (data || []).map(c => ({
    ...c,
    delivery_methods: c.delivery_methods || [],
  })) as Country[];
}

// ==================== INTERNAL TRANSFERS (via RPC) ====================
// These use Supabase RPC calls that bypass RLS via SECURITY DEFINER

export async function findAccountByNumber(accountNumber: string): Promise<{ id: string; user_id: string; account_number: string; balance: number; currency: string; status: string } | null> {
  const { data, error } = await supabase
    .rpc('find_account_by_number', { acc_num: accountNumber });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    id: row.id,
    user_id: row.user_id,
    account_number: row.account_number,
    balance: parseFloat(row.balance),
    currency: row.currency,
    status: row.status,
  };
}

export async function createInternalTransfer(
  senderAccountId: string,
  recipientAccountNumber: string,
  amount: number,
  description?: string
): Promise<Transfer | null> {
  const { data, error } = await supabase
    .rpc('create_internal_transfer_rpc', {
      sender_account_id: senderAccountId,
      recipient_account_number: recipientAccountNumber,
      transfer_amount: amount,
      transfer_description: description || null,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('Transfer failed. No response from server.');
  }

  // Return a partial Transfer object with the key fields
  const row = data[0];
  return {
    id: row.transfer_id,
    reference_code: row.reference_code,
    status: row.status,
    amount: amount,
    currency: 'USD',
    recipient_currency: 'USD',
    recipient_name: `Transfera Account ${recipientAccountNumber}`,
    recipient_type: 'internal',
    recipient_country: 'US',
    sender_account_id: senderAccountId,
    recipient_account_id: '',
    fee: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Transfer;
}

// ==================== EXCHANGE RATES ====================

export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .single();
  if (error) return null;
  return data as unknown as ExchangeRate;
}

export async function calculateExchange(from: string, to: string, amount: number): Promise<ExchangeCalculation | null> {
  const rate = await getExchangeRate(from, to);
  if (!rate) return null;
  const fee = amount * (rate.fee_percentage / 100);
  return {
    original_amount: amount,
    fee,
    fee_percentage: rate.fee_percentage,
    exchange_rate: rate.rate,
    converted_amount: amount * rate.rate,
    total_deduction: amount + fee,
    from_currency: from,
    to_currency: to,
  };
}

// ==================== REALTIME ====================

export function subscribeToTransfers(accountId: string, callback: () => void) {
  const channel = supabase
    .channel('transfers')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'transfers', filter: `sender_account_id=eq.${accountId}` },
      callback
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transfers', filter: `sender_account_id=eq.${accountId}` },
      callback
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transfers', filter: `recipient_account_id=eq.${accountId}` },
      callback
    )
    .subscribe();
  return { unsubscribe: () => { supabase.removeChannel(channel); } };
}

export function subscribeToTransactions(accountId: string, callback: () => void) {
  return supabase
    .channel('transactions')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transactions', filter: `account_id=eq.${accountId}` },
      callback
    )
    .subscribe();
}
