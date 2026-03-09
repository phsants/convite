import React, { useState } from 'react'
import { api } from '@/api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PartyPopper,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import StatsBar from '@/components/party/StatsBar'
import GuestTable from '@/components/party/GuestTable'
import ManualGuestForm from '@/components/party/ManualGuestForm'
import SmartImport from '@/components/party/SmartImport'
import PartySetup from '@/components/party/PartySetup'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Users, LogOut } from 'lucide-react'

const apiBase =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : import.meta.env.PROD
      ? ''
      : 'http://localhost:3000'

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showSetup, setShowSetup] = useState(false)
  const [showSmartImport, setShowSmartImport] = useState(false)
  const queryClient = useQueryClient()

  const { data: parties, isLoading: loadingParties } = useQuery({
    queryKey: ['parties'],
    queryFn: () => api.parties.list('-created_date', 1),
    initialData: [],
  })

  const party = parties?.[0]

  const { data: guests, isLoading: loadingGuests } = useQuery({
    queryKey: ['guests', party?.id],
    queryFn: () =>
      api.guests.filter(
        { party_id: party.id },
        '-created_date',
        500
      ),
    enabled: !!party?.id,
    initialData: [],
  })

  const existingFamilies = React.useMemo(() => {
    const byName = {}
    guests.forEach((g) => {
      if (g.group_name && String(g.group_name).trim()) {
        if (!byName[g.group_name]) byName[g.group_name] = g.confirmation_token
      }
    })
    return Object.entries(byName).map(([name, token]) => ({ name, token }))
  }, [guests])

  const handleDeleteGuest = async (id) => {
    await api.guests.delete(id)
    queryClient.invalidateQueries({ queryKey: ['guests'] })
  }

  if (loadingParties) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Loader />
      </div>
    )
  }

  if (!party && !showSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 rotate-6 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-xl shadow-pink-200">
            <PartyPopper className="-rotate-6 h-12 w-12 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Festa de Aniversário
          </h1>
          <p className="mb-8 text-gray-400">
            Crie a festa, adicione os convidados e gere links de confirmação para
            cada um.
          </p>
          <Button
            onClick={() => setShowSetup(true)}
            className="h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 px-10 text-lg font-semibold text-white shadow-xl shadow-pink-200 hover:from-pink-600 hover:to-rose-700"
          >
            <PartyPopper className="mr-2 h-5 w-5" />
            Criar Festa
          </Button>
        </div>
      </div>
    )
  }

  if (!party && showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <PartySetup party={null} onSaved={() => setShowSetup(false)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 relative z-10">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {party.photos?.length > 0 ? (
                <img
                  src={`${apiBase}${party.photos[0]}`}
                  alt={party.child_name}
                  className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg">
                  <PartyPopper className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                  Festa da {party.child_name}
                  {typeof party.child_age === 'number'
                    ? ` — ${party.child_age} ${party.child_age === 1 ? 'ano' : 'anos'}`
                    : ''}
                </h1>
                <p className="mt-0.5 text-sm text-gray-400">
                  {party.party_date &&
                    (() => {
                      const raw = party.party_date
                      const dateStr =
                        typeof raw === 'string'
                          ? raw.slice(0, 10)
                          : raw instanceof Date
                            ? raw.toISOString().slice(0, 10)
                            : ''
                      const d = dateStr ? new Date(dateStr + 'T12:00:00') : null
                      const valid = d && !isNaN(d.getTime())
                      return valid
                        ? d.toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : null
                    })()}
                  {party.party_time && ` às ${party.party_time}`}
                  {party.party_location && ` • ${party.party_location}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSetup(true)
                  const el = document.getElementById('party-setup-panel')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="rounded-xl border-gray-200 hover:bg-white"
              >
                <Settings className="mr-2 h-4 w-4" />
                Editar festa
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/Dashboard')}
                className="rounded-xl border-gray-200 hover:bg-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ver dashboard
              </Button>
              {user?.is_admin && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/Admin')}
                  className="rounded-xl border-gray-200 hover:bg-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Painel Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="rounded-xl text-gray-500 hover:text-gray-700"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Photo gallery */}
          {party.photos?.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {party.photos.map((url, i) => (
                <img
                  key={i}
                  src={`${apiBase}${url}`}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl border-2 border-white object-cover shadow-md"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-12 sm:px-8">
        {/* Setup panel */}
        {showSetup && (
          <div
            id="party-setup-panel"
            className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8"
          >
            <PartySetup party={party} onSaved={() => setShowSetup(false)} />
          </div>
        )}

        {/* Stats */}
        <StatsBar guests={guests} />

        {/* Add guest + list */}
        <div className="space-y-5 rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Convidados</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSmartImport(!showSmartImport)}
              className="rounded-xl"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {showSmartImport ? 'Adicionar Manual' : 'Importar Lista'}
            </Button>
          </div>

          {showSmartImport ? (
            <SmartImport
              partyId={party.id}
              existingFamilies={existingFamilies}
              onClose={() => setShowSmartImport(false)}
            />
          ) : (
            <ManualGuestForm partyId={party.id} existingFamilies={existingFamilies} />
          )}

          {loadingGuests ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <GuestTable guests={guests} onDelete={handleDeleteGuest} />
          )}
        </div>
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg animate-pulse">
        <PartyPopper className="h-6 w-6 text-white" />
      </div>
      <Skeleton className="h-4 w-32 rounded-full" />
    </div>
  )
}
