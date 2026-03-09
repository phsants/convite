import React, { useState, useEffect } from 'react'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  PartyPopper,
  CheckCircle2,
  XCircle,
  Loader2,
  Heart,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Confirmar() {
  const [guest, setGuest] = useState(null)
  const [party, setParty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [response, setResponse] = useState('confirmed')
  const [message, setMessage] = useState('')
  const [guestData, setGuestData] = useState({})
  const [error, setError] = useState(null)

  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Link inválido')
        setLoading(false)
        return
      }
      const allGuests = await api.guests.filter({
        confirmation_token: token,
      })
      if (!allGuests.length) {
        setError('Convite não encontrado')
        setLoading(false)
        return
      }

      setGuest(allGuests)

      const initialData = {}
      allGuests.forEach((g) => {
        initialData[g.id] = {
          name: g.name,
          type: g.type,
          age: g.age,
          status: g.confirmed_status || 'pending',
        }
      })
      setGuestData(initialData)

      const allResponded = allGuests.every(
        (g) => g.confirmed_status !== 'pending'
      )
      if (allResponded) {
        setDone(true)
        const allConfirmed = allGuests.every(
          (g) => g.confirmed_status === 'confirmed'
        )
        const allDeclined = allGuests.every(
          (g) => g.confirmed_status === 'declined'
        )
        if (allConfirmed) setResponse('confirmed')
        else if (allDeclined) setResponse('declined')
        else setResponse('partial')
      }

      const partyData = await api.parties.get(allGuests[0].party_id)
      if (partyData) setParty(partyData)
      setLoading(false)
    }
    load()
  }, [token])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const updates = {}
      for (const guestId of Object.keys(guestData)) {
        const data = guestData[guestId]
        updates[guestId] = {
          status: data.status,
          age: data.age,
          message: message || undefined,
        }
      }
      await api.guests.confirm(token, updates)
      const statuses = Object.values(guestData).map((d) => d.status)
      const allConfirmed = statuses.every((s) => s === 'confirmed')
      const allDeclined = statuses.every((s) => s === 'declined')
      if (allConfirmed) setResponse('confirmed')
      else if (allDeclined) setResponse('declined')
      else setResponse('partial')
      setDone(true)
    } catch (err) {
      console.error(err)
      toast.error(err?.data?.error || 'Não foi possível enviar. Tente de novo.')
    }
    setSubmitting(false)
  }

  const updateGuestStatus = (guestId, status) => {
    setGuestData((prev) => ({
      ...prev,
      [guestId]: { ...prev[guestId], status },
    }))
  }

  const updateGuestAge = (guestId, age) => {
    setGuestData((prev) => ({
      ...prev,
      [guestId]: { ...prev[guestId], age: Number(age) },
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-300" />
          <h1 className="mb-2 text-2xl font-bold text-gray-700">{error}</h1>
          <p className="text-gray-400">
            Este link de confirmação não é válido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <div className="overflow-hidden rounded-3xl border border-pink-100/50 bg-white/90 shadow-2xl shadow-pink-100/50 backdrop-blur-xl">
          {/* Header with photos */}
          <div className="relative bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 p-8 text-center text-white">
            <div className="absolute inset-0 opacity-20">
              {party?.photos?.[0] && (
                <img
                  src={`${apiBase}${party.photos[0]}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <PartyPopper className="mx-auto mb-3 h-14 w-14 drop-shadow-lg" />
              </motion.div>
              <h1 className="mb-1 text-3xl font-bold">
                {party?.child_name
                  ? (() => {
                      const idade = party.child_age
                      const idadeLabel =
                        typeof idade === 'number'
                          ? ` — ${idade} ${idade === 1 ? 'ano' : 'anos'}`
                          : ''
                      return `Festa da ${party.child_name}${idadeLabel}!`
                    })()
                  : 'Festa de Aniversário!'}
              </h1>
              {party?.message && (
                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  {party.message}
                </p>
              )}
            </div>
          </div>

          {/* Party info */}
          {party && (
            <div className="flex flex-wrap gap-4 px-8 pt-6 text-sm text-gray-500">
              {party.party_date && (() => {
                const raw = party.party_date
                const dateStr = typeof raw === 'string' ? raw.slice(0, 10) : (raw instanceof Date ? raw.toISOString().slice(0, 10) : '')
                const d = dateStr ? new Date(dateStr + 'T12:00:00') : null
                const valid = d && !isNaN(d.getTime())
                return valid ? (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-pink-400" />
                    {d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </div>
                ) : null
              })()}
              {party.party_time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-pink-400" />
                  {party.party_time}
                </div>
              )}
              {party.party_location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-pink-400" />
                  {party.party_location}
                </div>
              )}
            </div>
          )}

          {/* Lista de presentes */}
          {party?.gift_list && (() => {
            const raw = party.gift_list
            const items = Array.isArray(raw)
              ? raw.filter(Boolean)
              : (typeof raw === 'string' ? raw.split(/\n/) : [])
                  .map((s) => s.trim())
                  .filter(Boolean)
            if (items.length === 0) return null
            return (
              <div className="mx-8 mt-4 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/80 to-rose-50/80 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-pink-700">
                  <Sparkles className="h-4 w-4" />
                  Lista de presentes
                </h3>
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}

          {/* Photo strip */}
          {party?.photos?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-8 pt-4">
              {party.photos.map((url, i) => (
                <img
                  key={i}
                  src={`${apiBase}${url}`}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl border-2 border-pink-100 object-cover"
                />
              ))}
            </div>
          )}

          <div className="p-8">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 text-center"
                >
                  {response === 'confirmed' ? (
                    <>
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      </div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-800">
                        Presença Confirmada!
                      </h2>
                      <p className="text-gray-400">
                        Obrigado! Nos vemos na festa!
                      </p>
                    </>
                  ) : response === 'partial' ? (
                    <>
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                        <CheckCircle2 className="h-10 w-10 text-blue-500" />
                      </div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-800">
                        Confirmações Recebidas!
                      </h2>
                      <p className="text-gray-400">
                        Obrigado pelas confirmações! Nos vemos na festa!
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
                        <Heart className="h-10 w-10 text-rose-400" />
                      </div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-800">
                        Que pena!
                      </h2>
                      <p className="text-gray-400">
                        Sentiremos sua falta!
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <p className="text-lg text-gray-500">Olá!</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Confirme a presença de cada pessoa
                    </p>
                  </div>

                  <div className="space-y-3">
                    {guest.map((g) => {
                      const data = guestData[g.id] || {}
                      const status = data.status || 'pending'

                      return (
                        <div
                          key={g.id}
                          className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                {g.name}
                              </span>
                              {g.type === 'child' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  👶 Criança
                                </Badge>
                              )}
                            </div>
                          </div>

                          {g.type === 'child' && status === 'confirmed' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-600">
                                Idade da criança
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                max={18}
                                value={data.age ?? ''}
                                onChange={(e) =>
                                  updateGuestAge(g.id, e.target.value)
                                }
                                placeholder="Ex: 5"
                                className="rounded-lg text-sm"
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                status === 'confirmed' ? 'default' : 'outline'
                              }
                              onClick={() =>
                                updateGuestStatus(g.id, 'confirmed')
                              }
                              className={
                                status === 'confirmed'
                                  ? 'flex-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'flex-1 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Vou
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                status === 'declined' ? 'default' : 'outline'
                              }
                              onClick={() =>
                                updateGuestStatus(g.id, 'declined')
                              }
                              className={
                                status === 'declined'
                                  ? 'flex-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600'
                                  : 'flex-1 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50'
                              }
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Não
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-gray-600">
                      Mensagem (opcional)
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Deixe uma mensagem carinhosa..."
                      rows={2}
                      className="rounded-xl border-gray-200"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      Object.values(guestData).every(
                        (d) => d.status === 'pending'
                      )
                    }
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 font-semibold text-white shadow-lg shadow-pink-200 hover:from-pink-600 hover:to-rose-700"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Enviar Confirmações
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-300">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Feito com carinho
        </p>
      </motion.div>
    </div>
  )
}
