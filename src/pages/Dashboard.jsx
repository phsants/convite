import React, { useMemo, useState } from 'react'
import { api } from '@/api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import StatsBar from '@/components/party/StatsBar'
import GuestTable from '@/components/party/GuestTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  PartyPopper,
  Filter,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'declined', label: 'Recusaram' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'Adultos e crianças' },
  { value: 'adult', label: 'Só adultos' },
  { value: 'child', label: 'Só crianças' },
]

const RESPONDED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'responded', label: 'Já responderam' },
  { value: 'not_responded', label: 'Ainda não responderam' },
]

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nome (A-Z)' },
  { value: 'name_desc', label: 'Nome (Z-A)' },
  { value: 'status', label: 'Status' },
  { value: 'response_date_desc', label: 'Resposta mais recente' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const partyIdFromUrl = searchParams.get('partyId')
  const [selectedPartyId, setSelectedPartyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [respondedFilter, setRespondedFilter] = useState('all')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')

  const isAdmin = user?.is_admin === true
  const {
    data: parties = [],
    isLoading: loadingParties,
    refetch: refetchParties,
  } = useQuery({
    queryKey: ['parties', isAdmin ? 'admin' : 'mine'],
    queryFn: () => api.parties.list('-created_date', 50, isAdmin),
    initialData: [],
  })

  React.useEffect(() => {
    if (parties.length === 0) return
    if (partyIdFromUrl && parties.some((p) => p.id === partyIdFromUrl)) {
      setSelectedPartyId(partyIdFromUrl)
      return
    }
    if (!selectedPartyId) setSelectedPartyId(parties[0].id)
  }, [parties, partyIdFromUrl])

  const {
    data: guests = [],
    isLoading: loadingGuests,
    refetch: refetchGuests,
  } = useQuery({
    queryKey: ['guests', selectedPartyId],
    queryFn: () =>
      api.guests.filter(
        { party_id: selectedPartyId },
        '-created_date',
        1000
      ),
    enabled: !!selectedPartyId,
    initialData: [],
  })

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) || parties[0],
    [parties, selectedPartyId]
  )

  const existingGroups = useMemo(
    () => Array.from(new Set(guests.map((g) => g.group_name).filter(Boolean))),
    [guests]
  )

  const filteredGuests = useMemo(() => {
    let result = [...guests]

    if (statusFilter !== 'all') {
      result = result.filter((g) => g.confirmed_status === statusFilter)
    }

    if (typeFilter !== 'all') {
      result = result.filter((g) => g.type === typeFilter)
    }

    if (groupFilter) {
      if (groupFilter === '__none__') {
        result = result.filter((g) => !g.group_name || g.group_name.trim() === '')
      } else {
        result = result.filter((g) => g.group_name === groupFilter)
      }
    }

    if (respondedFilter === 'responded') {
      result = result.filter((g) => g.response_date)
    } else if (respondedFilter === 'not_responded') {
      result = result.filter((g) => !g.response_date)
    }

    if (ageMin || ageMax) {
      const min = ageMin ? Number(ageMin) : null
      const max = ageMax ? Number(ageMax) : null
      result = result.filter((g) => {
        if (g.type !== 'child') return false
        if (g.age == null) return false
        if (min != null && g.age < min) return false
        if (max != null && g.age > max) return false
        return true
      })
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      result = result.filter((g) =>
        g.name.toLowerCase().includes(q)
      )
    }

    const compareByStatus = (a, b) => {
      const order = { confirmed: 0, pending: 1, declined: 2 }
      return (order[a.confirmed_status] ?? 99) - (order[b.confirmed_status] ?? 99)
    }

    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name)
      }
      if (sortBy === 'status') {
        return compareByStatus(a, b)
      }
      if (sortBy === 'response_date_desc') {
        const da = a.response_date ? new Date(a.response_date).getTime() : 0
        const db = b.response_date ? new Date(b.response_date).getTime() : 0
        return db - da
      }
      return 0
    })

    return result
  }, [
    guests,
    statusFilter,
    typeFilter,
    groupFilter,
    respondedFilter,
    ageMin,
    ageMax,
    searchTerm,
    sortBy,
  ])

  const totalGuests = guests.length
  const totalFiltered = filteredGuests.length

  if (loadingParties) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Skeleton className="h-20 w-64 rounded-3xl" />
      </div>
    )
  }

  if (!selectedParty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nenhuma festa encontrada
          </h1>
          <p className="text-gray-400 text-sm">
            Crie uma festa primeiro para visualizar o dashboard de convidados.
          </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {selectedParty.photos?.length > 0 ? (
                <img
                  src={`${apiBase}${selectedParty.photos[0]}`}
                  alt={selectedParty.child_name}
                  className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg">
                  <PartyPopper className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                  Dashboard de Convidados
                </h1>
                <p className="mt-0.5 text-sm text-gray-400">
                  {selectedParty.child_name &&
                    `Festa da ${selectedParty.child_name}${
                      selectedParty.child_age ? ` — ${selectedParty.child_age} anos` : ''
                    }`}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {parties.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    Selecionar festa
                  </span>
                  <select
                    value={selectedParty.id}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
                  >
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.child_name || 'Sem nome'} —{' '}
                        {p.party_date ||
                          new Date(p.created_date).toLocaleDateString('pt-BR')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchParties()
                    refetchGuests()
                  }}
                  className="rounded-xl border-gray-200"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="rounded-xl border-gray-200"
                >
                  Voltar
                </Button>
                <Badge className="bg-white/80 text-gray-600 border-gray-200 text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {totalFiltered}/{totalGuests} convidados
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-12 sm:px-8">
        {/* Stats for filtered guests */}
        <div className="mt-2">
          <StatsBar guests={filteredGuests} />
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-md backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Filtros de convidados
                </p>
                <p className="text-xs text-gray-400">
                  Combine filtros para encontrar convidados rapidamente
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {/* Status */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">Tipo</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Família */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">
                Grupo/Família
              </span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
              >
                <option value="">Todas</option>
                <option value="__none__">Sem grupo</option>
                {existingGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Resposta */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">
                Resposta
              </span>
              <select
                value={respondedFilter}
                onChange={(e) => setRespondedFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
              >
                {RESPONDED_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {/* Idade (crianças) */}
            <div className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-gray-500">
                Idade (apenas crianças)
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="Mín."
                  className="rounded-xl text-sm"
                />
                <span className="text-xs text-gray-400">até</span>
                <Input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="Máx."
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Busca */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">
                Buscar por nome
              </span>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite um nome..."
                className="rounded-xl text-sm"
              />
            </div>

            {/* Ordenação */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">
                Ordenar por
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Confirmados
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                Pendentes
              </span>
              <span className="inline-flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-500" />
                Recusaram
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all')
                setTypeFilter('all')
                setGroupFilter('')
                setSearchTerm('')
                setRespondedFilter('all')
                setAgeMin('')
                setAgeMax('')
                setSortBy('name_asc')
              }}
              className="text-xs text-gray-500 hover:text-pink-600"
            >
              Limpar filtros
            </Button>
          </div>
        </div>

        {/* Guest list */}
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-bold text-gray-800">
                Lista de convidados
              </h2>
            </div>
            <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
              Mostrando {totalFiltered} de {totalGuests}
            </Badge>
          </div>

          {loadingGuests ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <GuestTable
              guests={filteredGuests}
              onDelete={async (id) => {
                await api.guests.delete(id)
                queryClient.invalidateQueries({ queryKey: ['guests'] })
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

