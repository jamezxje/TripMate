import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Users, KeyRound, Calendar, Wallet, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { fundApi } from '../funds/fundApi';
import { expenseApi } from '../expenses/expenseApi';
import { settlementApi } from '../settlement/settlementApi';
import { useUserStore } from '../../store/useUserStore';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Skeleton } from '../../components/Skeleton';
import { GuestMemberModal } from './GuestMemberModal';

export const TripDetailView = ({ trip, onRefresh }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const { currentUser } = useUserStore();
  const [stats, setStats] = useState({ totalFund: null, totalExpense: null, personalBalance: null });

  useEffect(() => {
    if (!trip?.id) return;
    
    const fetchStats = async () => {
      try {
        const [fundRes, expenseRes, settlementRes] = await Promise.all([
          fundApi.getFundSummary(trip.id).catch(() => ({ data: { totalCollected: 0 } })),
          expenseApi.getExpensesByTripId(trip.id).catch(() => ({ data: [] })),
          settlementApi.getSettlementSummary(trip.id).catch(() => ({ data: { balances: [] } }))
        ]);

        const fundBalance = fundRes?.data?.totalCollected || 0;
        const expenses = fundRes?.data ? (expenseRes?.data || []) : [];
        const totalExp = Array.isArray(expenses) ? expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
        
        const balances = settlementRes?.data?.balances || [];
        const myBalance = balances.find(b => b.userId === currentUser?.id)?.netBalance || 0;

        setStats({
          totalFund: fundBalance,
          totalExpense: totalExp,
          personalBalance: myBalance
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
  }, [trip?.id, currentUser?.id]);

  const handleCopyCode = () => {
    if (!trip?.joinCode) return;
    navigator.clipboard.writeText(trip.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!trip) return null;

  return (
    <>
    <AnimatedPage className="flex flex-col gap-6">
      {/* Trip Info Banner Card - Redesigned */}
      <Card className="bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-800 text-white border-none shadow-glow relative overflow-hidden rounded-3xl">
        {/* Mesh Pattern / Decorative */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none mix-blend-overlay" />
        <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-48 h-48 bg-violet-400/20 rounded-full blur-2xl pointer-events-none mix-blend-overlay" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 p-2 sm:p-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={trip.status ? trip.status.toLowerCase() : 'info'} className="bg-white/20 text-white border-none backdrop-blur-md">
                {t(`trip.status.${trip.status}`, trip.status)}
              </Badge>
              <span className="text-xs font-medium text-indigo-100 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(trip.createdAt)}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">{trip.name}</h1>
          </div>

          {/* Glass Card for Invite Code */}
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 flex flex-col gap-2 min-w-[200px] shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Mã mời tham gia
            </p>
            <div className="flex items-center justify-between gap-4">
              <p className="text-2xl font-black tracking-widest text-white font-mono">
                {trip.joinCode}
              </p>
              <button
                onClick={handleCopyCode}
                title="Sao chép mã mời"
                className={`p-2.5 rounded-xl transition-all duration-300 ${copied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 active:scale-95'} relative overflow-hidden`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard Quick Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-2">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-default">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tổng Quỹ</p>
            {stats.totalFund !== null ? (
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalFund)}</p>
            ) : (
              <Skeleton className="w-20 h-6 mt-0.5" />
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-default">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tổng Chi Tiêu</p>
            {stats.totalExpense !== null ? (
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalExpense)}</p>
            ) : (
              <Skeleton className="w-20 h-6 mt-0.5" />
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-default">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số Dư Cá Nhân</p>
            {stats.personalBalance !== null ? (
              <p className={`text-lg font-black ${stats.personalBalance > 0 ? 'text-emerald-500 dark:text-emerald-400' : stats.personalBalance < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {formatCurrency(stats.personalBalance)}
              </p>
            ) : (
              <Skeleton className="w-20 h-6 mt-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Members List Card - Modernized (Task 7.4) */}
      <Card className="border border-slate-200/60 shadow-sm">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-800 dark:text-slate-100">Thành viên chuyến đi ({trip.members?.length || 0})</span>
            </div>
          }
          subtitle="Danh sách các thành viên và vai trò trong nhóm."
          action={
            trip.members?.find(m => m.userId === currentUser?.id)?.role === 'LEADER' && (
              <Button size="sm" variant="outline" onClick={() => setIsGuestModalOpen(true)}>
                Thêm thành viên ảo
              </Button>
            )
          }
        />
        <CardBody className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip.members?.map((m) => (
              <div
                key={m.userId}
                className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-center justify-between gap-3 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200/50 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-default group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar with Gradient Border */}
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-400 to-indigo-500 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-700">
                      {m.fullName ? m.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-2">
                      {m.fullName}
                      {m.isGuest && (
                        <Badge variant="warning" className="text-[9px] py-0 px-1.5 leading-tight">ẢO</Badge>
                      )}
                    </p>
                    {!m.isGuest && <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{m.email}</p>}
                  </div>
                </div>
                
                {/* Role Badge */}
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${m.role === 'LEADER' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/50' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </AnimatedPage>
      
      <GuestMemberModal 
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        tripId={trip.id}
        onMemberAdded={onRefresh}
      />
    </>
  );
};
