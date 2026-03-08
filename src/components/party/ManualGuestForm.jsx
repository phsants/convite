import React, { useState } from 'react'
import { api } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default function ManualGuestForm({ partyId, existingFamilies = [] }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('adult')
  const [groupMode, setGroupMode] = useState('select') // 'select' | 'new'
  const [selectedGroup, setSelectedGroup] = useState('')
  const [groupName, setGroupName] = useState('')
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: (guestData) => api.guests.create(guestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] })
      setName('')
      setGroupName('')
      toast.success('Convidado adicionado!')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const finalGroupName =
      groupMode === 'select'
        ? selectedGroup || undefined
        : groupName.trim() || undefined

    const family = existingFamilies.find((f) => f.name === selectedGroup)
    const tokenToUse =
      groupMode === 'select' && family ? family.token : generateToken()

    addMutation.mutate({
      name: name.trim(),
      type,
      group_name: finalGroupName,
      party_id: partyId,
      confirmation_token: tokenToUse,
      status: 'pending',
      confirmed_status: 'pending',
    })
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Tipo</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none focus:ring-2"
            >
              <option value="adult">👤 Adulto</option>
              <option value="child">👶 Criança</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Grupo/Família</Label>
            {existingFamilies.length > 0 && groupMode === 'select' ? (
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '__new__') {
                    setGroupMode('new')
                    setSelectedGroup('')
                    setGroupName('')
                  } else {
                    setSelectedGroup(value)
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
                <option value="__new__">+ Nova família...</option>
              </select>
            ) : (
              <div className="space-y-1">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Família Silva"
                  className="rounded-lg text-sm"
                />
                {existingFamilies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMode('select')
                      setGroupName('')
                    }}
                    className="text-xs text-pink-600 hover:text-pink-700"
                  >
                    Escolher família existente
                  </button>
                )}
              </div>
            )}
        </div>
        <p className="text-xs text-gray-400">
          {type === 'child' && 'A idade pode ser informada pelo responsável ao confirmar presença.'}
        </p>

        <Button
          type="submit"
          disabled={addMutation.isPending || !name.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <UserPlus className="w-4 h-4 mr-2" />
          )}
          Adicionar
        </Button>
      </form>
    </Card>
  )
}
