import React, { useState, useEffect } from 'react'
import { api } from '@/api/client'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Save, Sparkles, Loader2 } from 'lucide-react'
import PhotoUploader from './PhotoUploader'
import { toast } from 'sonner'

export default function PartySetup({ party, onSaved }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    child_name: '',
    party_date: '',
    party_time: '',
    party_location: '',
    party_theme: '',
    child_age: '',
    photos: [],
    message: '',
    gift_list: '',
  })

  useEffect(() => {
    if (party) {
      setForm({
        child_name: party.child_name || '',
        party_date: party.party_date || '',
        party_time: party.party_time || '',
        party_location: party.party_location || '',
        party_theme: party.party_theme || '',
        child_age: party.child_age ?? '',
        photos: party.photos || [],
        message: party.message || '',
        gift_list: party.gift_list ?? '',
      })
    }
  }, [party])

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (party?.id) {
        return api.parties.update(party.id, data)
      }
      return api.parties.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] })
      toast.success('Festa salva com sucesso!')
      onSaved?.()
    },
  })

  const handleSave = () => {
    if (!form.child_name?.trim() || !form.party_date?.trim()) {
      toast.error('Preencha o nome e a data da festa')
      return
    }
    saveMutation.mutate({
      ...form,
      child_age: form.child_age ? Number(form.child_age) : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dados da Festa</h2>
          <p className="text-sm text-gray-400">Configure as informações da festa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-gray-600 font-medium">Nome da aniversariante *</Label>
          <Input
            value={form.child_name}
            onChange={(e) => setForm({ ...form, child_name: e.target.value })}
            placeholder="Ex: Maria Clara"
            className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-600 font-medium">Idade que vai fazer</Label>
          <Input
            type="number"
            value={form.child_age}
            onChange={(e) => setForm({ ...form, child_age: e.target.value })}
            placeholder="Ex: 5"
            className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-600 font-medium">Data da festa *</Label>
          <Input
            type="date"
            value={form.party_date}
            onChange={(e) => setForm({ ...form, party_date: e.target.value })}
            className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-600 font-medium">Horário</Label>
          <Input
            value={form.party_time}
            onChange={(e) => setForm({ ...form, party_time: e.target.value })}
            placeholder="Ex: 15:00"
            className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-600 font-medium">Local</Label>
          <Input
            value={form.party_location}
            onChange={(e) => setForm({ ...form, party_location: e.target.value })}
            placeholder="Ex: Buffet Encantado"
            className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-600 font-medium">Tema</Label>
          <Input
            value={form.party_theme}
            onChange={(e) => setForm({ ...form, party_theme: e.target.value })}
            placeholder="Ex: Princesas"
            className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-600 font-medium">Mensagem para os convidados</Label>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Ex: Venha celebrar comigo este dia especial!"
          rows={3}
          className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-600 font-medium">Lista de presentes</Label>
        <Textarea
          value={form.gift_list}
          onChange={(e) => setForm({ ...form, gift_list: e.target.value })}
          placeholder="Um item por linha. Ex:&#10;Brinquedo educativo&#10;Livro de histórias&#10;Roupas tamanho 4"
          rows={4}
          className="rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400 font-sans"
        />
        <p className="text-xs text-gray-400">A lista aparecerá no link de confirmação para os convidados.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-600 font-medium">Fotos da aniversariante</Label>
        <PhotoUploader
          photos={form.photos}
          onPhotosChange={(photos) => setForm({ ...form, photos })}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="w-full rounded-xl h-12 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-lg shadow-pink-200 transition-all"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Save className="w-5 h-5 mr-2" />
        )}
        {party?.id ? 'Atualizar Festa' : 'Criar Festa'}
      </Button>
    </div>
  )
}
