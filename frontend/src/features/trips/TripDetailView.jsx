import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Users, KeyRound, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { formatDate } from '../../utils/formatters';

export const TripDetailView = ({ trip, onRefresh }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!trip?.joinCode) return;
    navigator.clipboard.writeText(trip.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!trip) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Trip Info Banner Card */}
      <Card className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white border-none shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={trip.status ? trip.status.toLowerCase() : 'info'}>
                {t(`trip.status.${trip.status}`, trip.status)}
              </Badge>
              <span className="text-xs text-indigo-200/80 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(trip.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{trip.name}</h1>
          </div>

          {/* Copyable Join Code Widget */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Mã mời tham gia
              </p>
              <p className="text-2xl font-black tracking-widest text-amber-300 font-mono mt-0.5">
                {trip.joinCode}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-xs font-bold">Sao chép</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Members List Card */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Thành viên chuyến đi ({trip.members?.length || 0})</span>
            </div>
          }
          subtitle="Danh sách các thành viên và vai trò trong nhóm."
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trip.members?.map((m) => (
              <div
                key={m.userId}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-200 shrink-0">
                    {m.fullName ? m.fullName.charAt(0) : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{m.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                </div>
                <Badge variant={m.role === 'LEADER' ? 'leader' : 'member'}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
