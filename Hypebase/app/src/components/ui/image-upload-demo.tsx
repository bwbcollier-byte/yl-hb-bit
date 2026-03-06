import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useImageUpload } from "@/components/hooks/use-image-upload"
import { ImagePlus, X, Upload, Trash2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"

export function ImageUploadDemo() {
  const {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload({
    onUpload: (url) => console.log("Uploaded image URL:", url),
  })

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileChange(fakeEvent)
      }
    },
    [handleFileChange],
  )

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-white/10 bg-[#09090b] p-6 shadow-2xl backdrop-blur-md relative">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">Media Upload</h3>
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Supported formats: JPG, PNG, GIF, MP4
        </p>
      </div>

      <Input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!previewUrl ? (
        <div
          onClick={handleThumbnailClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition-all hover:bg-white/10 hover:border-white/30",
            isDragging && "border-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/10"
          )}
        >
          <div className="rounded-full bg-white/10 p-4 shadow-xl border border-white/10 backdrop-blur-md">
            <ImagePlus className="h-8 w-8 text-white/70" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white mb-1">Click to select</p>
            <p className="text-xs text-white/50 font-medium">
              or drag and drop file here
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="group relative h-64 overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 filter drop-shadow-lg">
              <Button
                size="sm"
                onClick={handleThumbnailClick}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-lg p-0 text-white"
              >
                <Upload className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="h-12 w-12 rounded-full border border-red-500/30 backdrop-blur-lg p-0 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {fileName && (
            <div className="mt-4 flex items-center justify-between text-sm px-4 py-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="truncate flex-1 font-medium text-white/70 mr-4 text-xs">{fileName}</span>
              <button
                onClick={handleRemove}
                className="shrink-0 rounded-full p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
