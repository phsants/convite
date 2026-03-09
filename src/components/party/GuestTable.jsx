import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check, Trash2, Users, User, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const statusMap = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  declined: { label: 'Recusou', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export default function GuestTable({ guests, onDelete }) {
  const [copiedId, setCopiedId] = useState(null)
  const [expandedGroup, setExpandedGroup] = useState(null)

  const groupedGuests = guests.reduce((acc, guest) => {
    const key = guest.confirmation_token
    if (!acc[key]) acc[key] = []
    acc[key].push(guest)
    return acc
  }, {})

  const copyLink = (token) => {
    const url = `${window.location.origin}/Confirmar?token=${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(token)
    toast.success('Link copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!guests.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">Nenhum convidado adicionado</p>
        <p className="text-sm mt-1">Adicione os nomes dos convidados acima</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Object.keys(groupedGuests).map((token) => {
        const groupMembers = groupedGuests[token]
        const isGroup = groupMembers.length > 1
        const groupName = groupMembers[0].group_name
        const isExpanded = expandedGroup === token

        const confirmedCount = groupMembers.filter((g) => g.confirmed_status === 'confirmed').length
        const declinedCount = groupMembers.filter((g) => g.confirmed_status === 'declined').length
        const pendingCount = groupMembers.length - confirmedCount - declinedCount

        let overallStatus = 'pending'
        if (confirmedCount === groupMembers.length) overallStatus = 'confirmed'
        else if (declinedCount === groupMembers.length) overallStatus = 'declined'
        else if (confirmedCount > 0 || declinedCount > 0) overallStatus = 'partial'

        const st = statusMap[overallStatus] || statusMap.pending
        const childLabels = groupMembers
          .filter((g) => g.type === 'child')
          .map((g) => {
            const idade = g.age
            const idadeStr =
              typeof idade === 'number'
                ? `${idade} ${idade === 1 ? 'ano' : 'anos'}`
                : null
            return idadeStr ? `${g.name} (${idadeStr})` : g.name
          })
          .join(', ')

        return (
          <div
            key={token}
            className="rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between p-4 group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {isGroup ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    groupMembers[0].name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">
                      {groupName || groupMembers[0].name}
                    </p>
                    {isGroup && (
                      <span className="text-xs text-gray-400">
                        ({groupMembers.length}{' '}
                        {groupMembers.length === 1 ? 'pessoa' : 'pessoas'})
                      </span>
                    )}
                    {childLabels && (
                      <Badge variant="outline" className="text-xs">
                        👶 {childLabels}
                      </Badge>
                    )}
                  </div>
                  {overallStatus === 'partial' && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      {confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''},{' '}
                      {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${st.color} border text-xs font-medium whitespace-nowrap`}>
                  {st.label}
                </Badge>
                {isGroup && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setExpandedGroup(isExpanded ? null : token)}
                    className="h-8 w-8 text-gray-400 hover:text-purple-600"
                    title="Ver membros"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyLink(token)}
                  className="h-8 w-8 text-gray-400 hover:text-pink-600"
                  title="Copiar link"
                >
                  {copiedId === token ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    groupMembers.forEach((g) => onDelete(g.id))
                  }}
                  className="h-8 w-8 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && isGroup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-lg p-3 mt-3 space-y-2">
                      {groupMembers.map((member) => {
                        const memberSt =
                          statusMap[member.confirmed_status] || statusMap.pending
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-700">{member.name}</span>
                              {member.type === 'child' && (
                                <Badge variant="outline" className="text-xs">
                                  👶 {member.age && `${member.age} anos`}
                                </Badge>
                              )}
                            </div>
                            <Badge className={`${memberSt.color} border text-xs`}>
                              {memberSt.label}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
