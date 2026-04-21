import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAccount, getTransfers, cancelTransfer } from '@/lib/database';
import TransferRow from '@/components/TransferRow';
import { Search, Send } from 'lucide-react';

const statusTabs = ['All', 'Pending', 'Completed', 'Failed', 'Rejected'];

export default function Transfers() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const { data: account } = useQuery({
    queryKey: ['account', user?.id],
    queryFn: () => getAccount(user!.id),
    enabled: !!user,
  });

  const { data: allTransfers } = useQuery({
    queryKey: ['transfers', account?.id],
    queryFn: () => getTransfers(account!.id, undefined, 100),
    enabled: !!account,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  const filteredTransfers = (allTransfers || []).filter(t => {
    const matchesStatus = activeTab === 'All' || t.status === activeTab.toLowerCase();
    const matchesSearch = !search ||
      t.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
      t.reference_code.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCancel = async (id: string) => {
    if (!account) return;
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    try {
      await cancelTransfer(id, account.id);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-deep-blue flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-soft-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !account) return null;

  return (
    <div className="min-h-screen bg-deep-blue pt-24 pb-16">
      <div className="content-max container-padding">
        <h1 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0]">
          Transfer History
        </h1>
        <p className="text-base text-[rgba(245,245,240,0.55)] mt-2">
          View and manage all your transfers
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
          <div className="flex gap-1 bg-surface rounded-lg p-1">
            {statusTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-soft-amber/15 text-soft-amber'
                    : 'text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or reference code..."
              className="w-full bg-surface border border-input-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F5F5F0] placeholder:text-[rgba(245,245,240,0.25)] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Transfer List */}
        <div className="mt-6 space-y-2">
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map(t => (
              <TransferRow
                key={t.id}
                transfer={t}
                showCancel={t.status === 'pending'}
                onCancel={handleCancel}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-surface rounded-xl">
              <Send className="w-10 h-10 text-[rgba(245,245,240,0.15)] mx-auto mb-3" />
              <p className="text-sm text-[rgba(245,245,240,0.35)]">
                No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} transfers found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
