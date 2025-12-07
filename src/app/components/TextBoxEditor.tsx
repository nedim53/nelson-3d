'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../utils/store'
import { saveTextBox, deleteTextBox } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'

type Props = {
  textBoxId: string
}

export default function TextBoxEditor({ textBoxId }: Props) {
  const textBox = useAppStore((state) => state.textBoxes[textBoxId])
  const updateTextBox = useAppStore((state) => state.updateTextBox)
  const removeTextBox = useAppStore((state) => state.removeTextBox)
  
  const [localText, setLocalText] = useState('')
  const [localTextColor, setLocalTextColor] = useState('#000000')
  const [localBackgroundColor, setLocalBackgroundColor] = useState('#ffffff')
  const [localBackgroundTransparent, setLocalBackgroundTransparent] = useState(false)
  const [localFontSize, setLocalFontSize] = useState(16)
  
  // Debounced save function
  const debouncedSave = useMemo(
    () => createDebouncedFunction(
      async (data: any) => {
        if (!textBox) return
        await saveTextBox({
          ...textBox,
          ...data,
        })
      },
      500
    ),
    [textBox]
  )
  
  useEffect(() => {
    if (textBox) {
      setLocalText(textBox.text)
      setLocalTextColor(textBox.textColor)
      setLocalBackgroundColor(textBox.backgroundColor)
      setLocalBackgroundTransparent(textBox.backgroundTransparent)
      setLocalFontSize(textBox.fontSize)
    }
  }, [textBox])
  
  if (!textBox) return null
  
  // Auto-save on change
  const handleTextChange = (newText: string) => {
    setLocalText(newText)
    updateTextBox(textBoxId, { text: newText })
    debouncedSave({ text: newText })
  }
  
  const handleTextColorChange = (color: string) => {
    setLocalTextColor(color)
    updateTextBox(textBoxId, { textColor: color })
    debouncedSave({ textColor: color })
  }
  
  const handleBackgroundColorChange = (color: string) => {
    setLocalBackgroundColor(color)
    updateTextBox(textBoxId, { backgroundColor: color })
    debouncedSave({ backgroundColor: color })
  }
  
  const handleBackgroundTransparentChange = (transparent: boolean) => {
    setLocalBackgroundTransparent(transparent)
    updateTextBox(textBoxId, { backgroundTransparent: transparent })
    debouncedSave({ backgroundTransparent: transparent })
  }
  
  const handleFontSizeChange = (size: number) => {
    setLocalFontSize(size)
    updateTextBox(textBoxId, { fontSize: size })
    debouncedSave({ fontSize: size })
  }
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this text box?')) {
      removeTextBox(textBoxId)
      await deleteTextBox(textBoxId)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-[#001B3D] px-6 py-4 border-b-4 border-[#C41E3A]">
        <h3 className="font-bold text-lg text-white font-sans">Text Box Editor</h3>
        <p className="text-gray-300 text-sm font-light">ID: {textBoxId}</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Text Content */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-2" style={{ fontFamily: "Montserrat" }}>
            Text:
          </label>
          <textarea
            value={localText}
            onChange={(e) => handleTextChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001B3D]"
            rows={3}
            style={{ fontFamily: "Montserrat" }}
          />
        </div>
        
        {/* Text Color */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-2" style={{ fontFamily: "Montserrat" }}>
            Text Color:
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={localTextColor}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={localTextColor}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001B3D]"
              style={{ fontFamily: "Montserrat" }}
            />
          </div>
        </div>
        
        {/* Background Color */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-2" style={{ fontFamily: "Montserrat" }}>
            Background Color:
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={localBackgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              disabled={localBackgroundTransparent}
            />
            <input
              type="text"
              value={localBackgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001B3D] disabled:bg-gray-100"
              style={{ fontFamily: "Montserrat" }}
              disabled={localBackgroundTransparent}
            />
          </div>
        </div>
        
        {/* Transparent Background */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localBackgroundTransparent}
              onChange={(e) => handleBackgroundTransparentChange(e.target.checked)}
              className="w-5 h-5 text-[#001B3D] border-gray-300 rounded focus:ring-[#001B3D]"
            />
            <span className="text-sm font-semibold text-[#2D3748]" style={{ fontFamily: "Montserrat" }}>
              Transparent Background
            </span>
          </label>
        </div>
        
        {/* Font Size */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-2" style={{ fontFamily: "Montserrat" }}>
            Font Size: {localFontSize}px
          </label>
          <input
            type="range"
            min="10"
            max="48"
            value={localFontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#001B3D]"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2.5 bg-[#C41E3A] text-white rounded font-medium transition-all duration-200 hover:bg-[#a01a2e]"
            style={{ fontFamily: "Montserrat" }}
          >
            Delete Text Box
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center" style={{ fontFamily: "Montserrat" }}>
          Changes are saved automatically
        </p>
      </div>
    </div>
  )
}

