import React, { useState } from 'react'
import { api } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default function SmartImport({ partyId, existingFamilies = [], onClose }) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const queryClient = useQueryClient()

  const handleAnalyze = async () => {
    if (!text.trim()) return
    setProcessing(true)
    try {
      const guests = text
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((name) => ({ name, type: 'adult' }))
      setPreview(guests)
    } catch (error) {
      toast.error('Erro ao processar a lista')
    }
    setProcessing(false)
  }

  const updateGuest = (index, field, value) => {
    const updated = [...preview]
    updated[index] = { ...updated[index], [field]: value }
    setPreview(updated)
  }

  const removeGuest = (index) => {
    setPreview(preview.filter((_, i) => i !== index))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const groups = {}

      preview.forEach((guest) => {
        const groupKey = guest.group_name || guest.name
        if (!groups[groupKey]) {
          const existing = existingFamilies.find((f) => f.name === groupKey)
          groups[groupKey] = {
            token: existing ? existing.token : generateToken(),
            guests: [],
          }
        }
        groups[groupKey].guests.push(guest)
      })

      const records = []
      Object.keys(groups).forEach((groupKey) => {
        const { token, guests } = groups[groupKey]
        guests.forEach((guest) => {
          records.push({
            name: guest.name,
            type: guest.type,
            age: guest.age,
            group_name: guest.group_name,
            party_id: partyId,
            confirmation_token: token,
            status: 'pending',
            confirmed_status: 'pending',
          })
        })
      })

      return api.guests.bulkCreate(records)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] })
      toast.success(`${preview.length} convidados adicionados!`)
      onClose?.()
    },
  })

  if (!preview) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Importação Inteligente</h3>
            <p className="text-xs text-gray-400">Cole sua lista e deixe a IA organizar</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-600">Cole sua lista de convidados</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Exemplo:\n\nFamília do Tio Felipe:\nFelipe (pai)\nAna (mãe)\nSophia - 8 anos\nValentina - 5 anos\n\nMaria Silva\nJoão Pedro (4 anos)\n...`}
            rows={12}
            className="rounded-xl font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={processing || !text.trim()}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analisar com IA
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Revisar Convidados</h3>
          <p className="text-xs text-gray-400">{preview.length} convidados identificados</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreview(null)}
          className="rounded-lg"
        >
          <X className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
        {preview.map((guest, idx) => {
          const namesFromBatch = [
            ...new Set(preview.map((g) => g.group_name).filter(Boolean)),
          ].filter((n) => !existingFamilies.some((f) => f.name === n))
          const allFamilyNames = [
            ...existingFamilies.map((f) => f.name),
            ...namesFromBatch,
          ]
          const showFamilySelect = existingFamilies.length > 0 || allFamilyNames.length > 0
          return (
          <div key={idx} className="border rounded-xl p-3 bg-gray-50">
            {editingIndex === idx ? (
              <div className="space-y-2">
                <Input
                  value={guest.name}
                  onChange={(e) => updateGuest(idx, 'name', e.target.value)}
                  placeholder="Nome"
                  className="rounded-lg text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={guest.type}
                    onChange={(e) => updateGuest(idx, 'type', e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="adult">Adulto</option>
                    <option value="child">Criança</option>
                  </select>
                  <Input
                    type="number"
                    value={guest.age ?? ''}
                    onChange={(e) =>
                      updateGuest(idx, 'age', e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Idade"
                    className="rounded-lg text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => setEditingIndex(null)}
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
                {showFamilySelect ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Grupo/Família</Label>
                    <select
                      value={
                        allFamilyNames.includes(guest.group_name || '')
                          ? (guest.group_name || '')
                          : '__new__'
                      }
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '__new__') {
                          updateGuest(idx, 'group_name', '')
                        } else {
                          updateGuest(idx, 'group_name', v || undefined)
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
                    >
                      <option value="">Selecione uma família</option>
                      {existingFamilies.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                      {namesFromBatch.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value="__new__">+ Nova família...</option>
                    </select>
                    {!allFamilyNames.includes(guest.group_name || '') && (
                      <Input
                        value={guest.group_name || ''}
                        onChange={(e) => updateGuest(idx, 'group_name', e.target.value)}
                        placeholder="Nome da nova família"
                        className="rounded-lg text-sm"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Grupo/Família (opcional)</Label>
                    <Input
                      value={guest.group_name || ''}
                      onChange={(e) => updateGuest(idx, 'group_name', e.target.value)}
                      placeholder="Ex: Família Silva"
                      className="rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">{guest.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {guest.type === 'child' ? '👶 Criança' : '👤 Adulto'}
                    </Badge>
                    {guest.age != null && (
                      <Badge variant="outline" className="text-xs">
                        {guest.age} anos
                      </Badge>
                    )}
                  </div>
                  {guest.group_name && (
                    <p className="text-xs text-gray-400 truncate">📌 {guest.group_name}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingIndex(idx)}
                    className="h-8 w-8"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeGuest(idx)}
                    className="h-8 w-8 text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || preview.length === 0}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Confirmar e Adicionar
        </Button>
        <Button variant="outline" onClick={() => setPreview(null)} className="rounded-xl">
          Editar Lista
        </Button>
      </div>
    </Card>
  )
}
