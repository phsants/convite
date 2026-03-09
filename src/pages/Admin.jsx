import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PartyPopper, Users, ArrowLeft, ExternalLink } from 'lucide-react'

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['parties', 'admin'],
    queryFn: () => api.parties.list('-created_date', 100, true),
    enabled: !!user?.is_admin,
  })

  if (user && !user.is_admin) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                  Painel Admin
                </h1>
                <p className="mt-0.5 text-sm text-gray-400">
                  Festas lançadas por todos os usuários
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="rounded-xl border-gray-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/')}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              >
                <PartyPopper className="mr-2 h-4 w-4" />
                Nova festa
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Todas as festas</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : parties.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <PartyPopper className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma festa cadastrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
                    <th className="pb-3 pr-4">Aniversariante</th>
                    <th className="pb-3 pr-4">Data</th>
                    <th className="pb-3 pr-4">Dono</th>
                    <th className="pb-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {p.child_name || '—'}
                        {typeof p.child_age === 'number'
                          ? ` (${p.child_age} ${p.child_age === 1 ? 'ano' : 'anos'})`
                          : ''}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {p.party_date
                          ? new Date(p.party_date + 'T12:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {p.owner_username || '—'}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/Dashboard?partyId=${p.id}`)
                          }
                          className="text-pink-600 hover:text-pink-700"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
