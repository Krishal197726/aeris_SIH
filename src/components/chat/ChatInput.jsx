import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Image as ImageIcon, Send, ArrowUp, X, Sparkles, Paperclip } from 'lucide-react';

export default function ChatInput({
  onSendMessage,
  onImageUpload,
  onOpenVoiceModal,
  onOpenImageModal,
  placeholder = "Ask AERIS about any place, weather or climate...",
  isLoading = false,
  initialText = ''
}) {
  const [input, setInput] = useState(initialText);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null); // { url, name, file }
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialText) {
      setInput(initialText);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage({
        url: event.target.result,
        name: file.name,
        file
      });
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if removed
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleTriggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  const handleSend = () => {
    if (isLoading) return;

    if (attachedImage) {
      if (onImageUpload) {
        onImageUpload({
          url: attachedImage.url,
          name: attachedImage.name,
          prompt: input.trim()
        });
      }
      setAttachedImage(null);
      setInput('');
      setShowAttachMenu(false);
      return;
    }

    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setShowAttachMenu(false);
  };

  const hasContentToSend = Boolean(input.trim() || attachedImage);

  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      {/* Hidden File Input for PC Photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Attached Image Preview Card (Above Input Bar) */}
      {attachedImage && (
        <div className="mb-2.5 p-2 px-3 rounded-2xl bg-[#141d26]/95 border border-cyan-500/40 shadow-xl backdrop-blur-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/50 bg-black shrink-0">
              <img
                src={attachedImage.url}
                alt="Selected from PC"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate font-mono">
                  {attachedImage.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-sans font-medium">
                  Photo attached
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Ready for AI weather & cloud analysis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveImage}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input Bar (Pill Bar) */}
      <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#18181b]/85 hover:bg-[#18181b]/95 border border-white/10 hover:border-white/20 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-cyan-500/40 focus-within:ring-2 focus-within:ring-cyan-500/15">
        
        {/* Left "+" Action Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            title="Attach or Select Actions"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Popover Action Menu */}
          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 z-50 w-56 p-2 rounded-2xl bg-[#18181b]/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-1">
              <button
                type="button"
                onClick={() => {
                  handleTriggerFilePicker();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 text-left transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Add photo from PC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenImageModal) onOpenImageModal();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Sample Weather Scans</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Text Area */}
        <input
          ref={textareaRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachedImage ? "Add an optional question about this photo..." : placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-100 placeholder:text-[#71717a] text-sm sm:text-base px-1 py-1"
        />

        {/* Clear Button if input has text */}
        {input && (
          <button
            type="button"
            onClick={() => setInput('')}
            className="p-1 text-[#71717a] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right Tools Row (Add Photo from PC / Mic / Blue Action Send Button) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Add Photos from PC Button (Replaces Location Icon) */}
          <button
            type="button"
            onClick={handleTriggerFilePicker}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer"
            title="Add photos from your PC"
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-[12px] font-medium hidden sm:inline">Add Photo</span>
          </button>

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            title="Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Blue Circular Action / Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContentToSend || isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
              hasContentToSend && !isLoading
                ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-blue-500/25 scale-105 cursor-pointer'
                : 'bg-[#2563eb]/70 text-white/80 cursor-not-allowed opacity-60'
            }`}
            title="Send to AERIS Intelligence"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
