import React, { useState } from 'react'
import { api } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UserPlus, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default function AddGuestForm({ partyId }) {
  const [isFamily, setIsFamily] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [members, setMembers] = useState('')
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: (guestData) => api.guests.create(guestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] })
      setName('')
      setFamilyName('')
      setMembers('')
      setIsFamily(false)
      toast.success(isFamily ? 'Família adicionada!' : 'Convidado adicionado!')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isFamily) {
      if (!familyName.trim() || !members.trim()) return
      const membersList = members.split('\n').map((m) => m.trim()).filter(Boolean)
      if (membersList.length === 0) return

      addMutation.mutate({
        name: familyName.trim(),
        is_family: true,
        family_members: membersList,
        confirmations: membersList.map((m) => ({ member_name: m, status: 'pending' })),
        party_id: partyId,
        confirmation_token: generateToken(),
        status: 'pending',
      })
    } else {
      if (!name.trim()) return
      addMutation.mutate({
        name: name.trim(),
        is_family: false,
        party_id: partyId,
        confirmation_token: generateToken(),
        status: 'pending',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!isFamily ? 'default' : 'outline'}
          onClick={() => setIsFamily(false)}
          className={!isFamily ? 'rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'rounded-xl'}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Individual
        </Button>
        <Button
          type="button"
          variant={isFamily ? 'default' : 'outline'}
          onClick={() => setIsFamily(true)}
          className={isFamily ? 'rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'rounded-xl'}
        >
          <Users className="w-4 h-4 mr-2" />
          Família
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isFamily ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-gray-600 text-sm">Nome da Família</Label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ex: Família do Tio Felipe"
                className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-600 text-sm">Membros (um por linha)</Label>
              <Textarea
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder={'Felipe\nAna\nSophia\nValentina\nTheodora\nDavi'}
                rows={6}
                className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400 font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={addMutation.isPending || !familyName.trim() || !members.trim()}
              className="w-full rounded-xl h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Adicionar Família
            </Button>
          </>
        ) : (
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do convidado..."
              className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400 flex-1"
            />
            <Button
              type="submit"
              disabled={addMutation.isPending || !name.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200 px-6"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
