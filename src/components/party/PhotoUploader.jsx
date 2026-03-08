import React, { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function PhotoUploader({ photos = [], onPhotosChange }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newPhotos = [...photos]
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${apiBase}/api/upload`, {
          method: 'POST',
          body: form,
        })
        if (!res.ok) {
          // Se der erro no upload, ignora este arquivo e continua
          continue
        }
        const data = await res.json().catch(() => ({}))
        if (data.file_url) newPhotos.push(data.file_url)
      }
      onPhotosChange(newPhotos)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {photos.map((url, i) => (
          <div
            key={i}
            className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-pink-100"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-2xl border-2 border-dashed border-pink-200 hover:border-pink-400 flex flex-col items-center justify-center gap-2 text-pink-400 hover:text-pink-600 transition-all hover:bg-pink-50/50"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-8 h-8" />
              <span className="text-xs font-medium">Adicionar foto</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
