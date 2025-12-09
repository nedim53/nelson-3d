'use client'
import { useState } from 'react'
import { useAppStore } from '../utils/store'
import TextBoxEditor from './TextBoxEditor'
import { deleteTextBox } from '../lib/firestoreApi'
import ConfirmDeleteModal from './ConfirmDeleteModal'

export default function TextBoxSidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; textBoxId: string | null }>({
    isOpen: false,
    textBoxId: null
  })
  const toolMode = useAppStore((state) => state.toolMode)
  const setToolMode = useAppStore((state) => state.setToolMode)
  const selectedTextBoxId = useAppStore((state) => state.selectedTextBoxId)
  const setSelectedTextBoxId = useAppStore((state) => state.setSelectedTextBoxId)
  const textBoxes = useAppStore((state) => state.textBoxes)
  const removeTextBox = useAppStore((state) => state.removeTextBox)

  const handleInsertTextBox = () => {
    setToolMode('textbox')
    setSelectedTextBoxId(null)
  }

  const handleDeleteTextBox = (id: string) => {
    setDeleteModalState({ isOpen: true, textBoxId: id })
  }

  const confirmDelete = () => {
    if (deleteModalState.textBoxId) {
      const id = deleteModalState.textBoxId
      removeTextBox(id)
      if (selectedTextBoxId === id) {
        setSelectedTextBoxId(null)
      }
      deleteTextBox(id).catch(console.error)
    }
  }

  return (
    <div
      className={`fixed right-0 bg-gradient-to-b from-white to-gray-50 shadow-2xl transition-all duration-300 z-50 flex flex-col border-l border-gray-200 ${
        isExpanded ? 'w-96' : 'w-14'
      }`}
      style={{ top: '73px', bottom: '0', height: 'calc(100vh - 73px)' }}
    >
      {/* Header with minimize/expand button */}
      <div className="bg-gradient-to-r from-[#001B3D] to-[#002b5d] px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-md">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white text-lg">📝</span>
            </div>
            <h2
              className="text-white font-bold text-lg tracking-wide"
              style={{ fontFamily: 'Montserrat' }}
            >
              Text Boxes
            </h2>
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 flex items-center justify-center min-w-[36px]"
          title={isExpanded ? 'Minimize' : 'Expand'}
        >
          <span className="text-lg font-semibold">{isExpanded ? '◄' : '►'}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <label
              className="block text-sm font-semibold text-[#2D3748] mb-3 flex items-center gap-2"
              style={{ fontFamily: 'Montserrat' }}
            >
              <span className="text-lg">✨</span>
              Create New
            </label>
            <button
              onClick={handleInsertTextBox}
              className={`w-full px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                toolMode === 'textbox'
                  ? 'bg-gradient-to-r from-[#C41E3A] to-[#d63031] text-white'
                  : 'bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white hover:from-[#002b5d] hover:to-[#003d7a]'
              }`}
              style={{ fontFamily: 'Montserrat' }}
            >
              {toolMode === 'textbox' ? '✓ Click on canvas to place' : '📝 Insert Text Box'}
            </button>
            {toolMode === 'textbox' && (
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1" style={{ fontFamily: 'Montserrat' }}>
                <span>💡</span>
                Click anywhere on the canvas to place a text box
              </p>
            )}
          </div>

          {selectedTextBoxId && textBoxes[selectedTextBoxId] && (
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✏️</span>
                <h3 className="text-sm font-semibold text-[#2D3748]" style={{ fontFamily: 'Montserrat' }}>
                  Edit Text Box
                </h3>
              </div>
              <TextBoxEditor textBoxId={selectedTextBoxId} />
            </div>
          )}

          {Object.keys(textBoxes).length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <label
                className="block text-sm font-semibold text-[#2D3748] mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Montserrat' }}
              >
                <span className="text-lg">📋</span>
                Text Boxes ({Object.keys(textBoxes).length})
              </label>
              <div className="space-y-3">
                {Object.entries(textBoxes).map(([id, textBox]) => (
                  <div
                    key={id}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
                      selectedTextBoxId === id
                        ? 'bg-gradient-to-br from-[#001B3D] to-[#002b5d] text-white border-[#001B3D] shadow-lg'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTextBoxId(id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold mb-2 line-clamp-2 ${
                            selectedTextBoxId === id ? 'text-white' : 'text-[#2D3748]'
                          }`}
                          style={{ fontFamily: 'Montserrat' }}
                        >
                          {textBox.text || 'Empty text box'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${
                              selectedTextBoxId === id ? 'text-gray-300' : 'text-gray-500'
                            }`}
                            style={{ fontFamily: 'Montserrat' }}
                          >
                            📍 ({textBox.position[0].toFixed(1)}, {textBox.position[2].toFixed(1)})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTextBox(id)
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all duration-200 flex-shrink-0"
                        title="Delete text box"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(textBoxes).length === 0 && (
            <div
              className="text-center py-12 px-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100"
              style={{ fontFamily: 'Montserrat' }}
            >
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm font-semibold text-gray-600 mb-2">No text boxes yet</p>
              <p className="text-xs text-gray-500">Click "Insert Text Box" to create one</p>
            </div>
          )}
        </div>
      )}

      {!isExpanded && (
        <div className="flex-1 flex items-center justify-center">
          <div className="transform -rotate-90 whitespace-nowrap">
            <span className="text-gray-400 text-sm font-semibold" style={{ fontFamily: 'Montserrat' }}>
              Text Boxes
            </span>
          </div>
        </div>
      )}
      
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, textBoxId: null })}
        onConfirm={confirmDelete}
        title="Delete Text Box"
        message="Are you sure you want to delete this text box? This action cannot be undone."
      />
    </div>
  )
}
