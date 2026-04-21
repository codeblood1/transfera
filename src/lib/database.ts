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

export async function createTransfer(transfer: Omit<Transfer, 'id' | 'reference_code' | 'status' | 'created_at' | 'updated_at' | 'approved_at' | 'approved_by' | 'completed_at' | 'rejection_reason'>): Promise<Transfer | null> {
  const { data, error } = await supabase
    .from('transfers')
    .insert([{ ...transfer, status: 'pending' }])
    .select()
    .single();
  if (error) throw error;
  return data as Transfer;
}

export async function getTransfers(accountId: string, status?: string, limit = 50): Promise<Transfer[]> {
  let query = supabase
    .from('transfers')
    .select('*')
    .eq('sender_account_id', accountId)
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
    .eq('sender_account_id', accountId)
    .single();
  if (error) return null;
  return data as Transfer;
}

export async function cancelTransfer(transferId: string, accountId: string): Promise<void> {
  const { error } = await supabase
    .from('transfers')
    .update({ status: 'rejected', rejection_reason: 'Cancelled by user' })
    .eq('id', transferId)
    .eq('sender_account_id', accountId)
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
  return supabase
    .channel('transfers')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'transfers', filter: `sender_account_id=eq.${accountId}` },
      callback
    )
    .subscribe();
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
