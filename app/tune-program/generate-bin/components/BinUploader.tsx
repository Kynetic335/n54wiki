'use client'

// ─── BIN Uploader ──────────────────────────────────────────────────────────────
// Drag-drop + file picker for stock BIN upload.
// Performs inline validation: extension, size, SHA-256 vs selected ROM.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react'
import { validateBinFile } from '@/lib/tune-program/binValidator'
import type { BinValidationResult } from '@/lib/tune-program/binValidator'

interface BinUploaderProps {
  romId: string
  onValidated: (buffer: ArrayBuffer, result: BinValidationResult) => void
  onError: (result: BinValidationResult) => void
  disabled?: boolean
}

type UploadState =
  | { phase: 'idle' }
  | { phase: 'validating'; filename: string }
  | { phase: 'error'; result: BinValidationResult }
  | { phase: 'valid'; result: BinValidationResult; filename: string }

export function BinUploader({ romId, onValidated, onError, disabled }: BinUploaderProps) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setState({ phase: 'validating', filename: file.name })

      const result = await validateBinFile(file, romId)

      if (!result.valid) {
        setState({ phase: 'error', result })
        onError(result)
        return
      }

      // Read buffer for downstream use
      const buffer = await file.arrayBuffer()
      setState({ phase: 'valid', result, filename: file.name })
      onValidated(buffer, result)
    },
    [romId, onValidated, onError],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      // Reset input so same file can be re-uploaded
      e.target.value = ''
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const reset = () => {
    setState({ phase: 'idle' })
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload stock BIN file"
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-900/20'
            : isDragging
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : state.phase === 'valid'
                ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                : state.phase === 'error'
                  ? 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:bg-gray-800/40 dark:hover:border-blue-500',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".bin"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {state.phase === 'idle' && (
          <>
            <span className="text-3xl" aria-hidden>📂</span>
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop stock BIN here or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Must be <code className="font-mono">.bin</code> — exactly 2,097,152 bytes
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              SHA-256 must match{' '}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{romId}</span>{' '}
              stock hash
            </p>
          </>
        )}

        {state.phase === 'validating' && (
          <>
            <span className="text-2xl" aria-hidden>⏳</span>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Validating <span className="font-mono font-medium">{state.filename}</span>…
            </p>
            <p className="mt-1 text-xs text-gray-400">Computing SHA-256…</p>
          </>
        )}

        {state.phase === 'valid' && (
          <>
            <span className="text-3xl" aria-hidden>✅</span>
            <p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-300">
              Stock BIN verified
            </p>
            <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
              {state.filename}
            </p>
            <p className="mt-1 font-mono text-[10px] text-gray-400 dark:text-gray-500 break-all">
              SHA-256: {state.result.sha256}
            </p>
          </>
        )}

        {state.phase === 'error' && (
          <>
            <span className="text-3xl" aria-hidden>❌</span>
            <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">
              Validation failed
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 max-w-sm">
              {state.result.message}
            </p>
            {state.result.sha256 && (
              <p className="mt-1 font-mono text-[10px] text-gray-400 dark:text-gray-500 break-all">
                SHA-256: {state.result.sha256}
              </p>
            )}
          </>
        )}
      </div>

      {/* Error detail + retry */}
      {state.phase === 'error' && (
        <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-xs dark:border-red-800 dark:bg-red-950/40">
          <span className="text-red-700 dark:text-red-300">
            Error:{' '}
            <span className="font-mono font-medium">{state.result.error}</span>
            {state.result.detectedRomId && (
              <span className="ml-1">
                — detected <span className="font-semibold">{state.result.detectedRomId}</span>
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={reset}
            className="ml-3 font-medium text-red-600 underline hover:text-red-800 dark:text-red-400"
          >
            Try again
          </button>
        </div>
      )}

      {/* Valid: option to re-upload */}
      {state.phase === 'valid' && (
        <button
          type="button"
          onClick={reset}
          className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Upload a different BIN
        </button>
      )}
    </div>
  )
}
