import React from 'react'
import { Users, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function StatsBar({ guests }) {
  const totalPeople = guests.reduce((sum, g) => {
    if (g.is_family) {
      return sum + (g.family_members?.length || 0)
    }
    return sum + 1
  }, 0)

  const confirmedPeople = guests.reduce((sum, g) => {
    if (g.is_family) {
      return sum + (g.confirmations?.filter((c) => c.status === 'confirmed').length || 0)
    }
    return sum + (g.confirmed_status === 'confirmed' ? 1 : 0)
  }, 0)

  const declinedPeople = guests.reduce((sum, g) => {
    if (g.is_family) {
      return sum + (g.confirmations?.filter((c) => c.status === 'declined').length || 0)
    }
    return sum + (g.confirmed_status === 'declined' ? 1 : 0)
  }, 0)

  const pendingPeople = totalPeople - confirmedPeople - declinedPeople

  const stats = [
    {
      icon: Users,
      label: 'Total de Pessoas',
      value: totalPeople,
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: CheckCircle2,
      label: 'Confirmados',
      value: confirmedPeople,
      color: 'from-emerald-500 to-green-600',
    },
    {
      icon: Clock,
      label: 'Pendentes',
      value: pendingPeople,
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: XCircle,
      label: 'Recusaram',
      value: declinedPeople,
      color: 'from-rose-500 to-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 hover:shadow-lg transition-all"
        >
          <div
            className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-10 rounded-full -translate-y-6 translate-x-6`}
          />
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
