import React, { useState } from 'react';
import {
  PenTool,
  Highlighter,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Save,
  Check,
  Palette,
  CircleDot,
  HelpCircle,
  Sparkles,
  MousePointer
} from 'lucide-react';

const PEN_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Dark', hex: '#0f172a' }
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Pink', hex: '#ec4899' }
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2, iconSize: 'w-1 h-1' },
  { label: 'Medium', value: 4, iconSize: 'w-2 h-2' },
  { label: 'Bold', value: 7, iconSize: 'w-3 h-3' }
];

const QUICK_TEXT_PRESETS = [
  'Step missing',
  'Wrong formula',
  'Good explanation',
  'Partially correct',
  'Calculation error',
  'Incomplete answer'
];

const AnnotationToolbar = ({
  activeTool,
  setActiveTool,
  penColor,
  setPenColor,
  penSize,
  setPenSize,
  highlightColor,
  setHighlightColor,
  highlightSize,
  setHighlightSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearPage,
  onSave,
  isSaving,
  hasUnsavedChanges,
  pageNumber,
  pageAnnotationCount = 0,
  onQuickPresetSelect
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

  return (
    <div className="bg-white/95 backdrop-blur-md px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs select-none shadow-sm">
      {/* Tool Selection Group */}
      <div className="flex items-center space-x-1">
        {/* Navigation / Cursor */}
        <button
          type="button"
          onClick={() => setActiveTool('select')}
          title="Pointer / Inspect Mode"
          className={`p-1.5 rounded-lg flex items-center space-x-1 transition-all ${
            activeTool === 'select'
              ? 'bg-slate-200 text-slate-800 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">View</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Pen Tool */}
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTool('pen');
              setShowColorPicker((prev) => (activeTool === 'pen' ? !prev : false));
            }}
            title="Pen - Freehand Handwritten Remarks"
            className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTool === 'pen'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold ring-1 ring-indigo-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="text-[11px]">Pen</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 inline-block shadow-sm"
              style={{ backgroundColor: penColor }}
            />
          </button>
        </div>

        {/* Highlight Tool */}
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTool('highlight');
              setShowColorPicker((prev) => (activeTool === 'highlight' ? !prev : false));
            }}
            title="Highlight - Highlight text or formulas"
            className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTool === 'highlight'
                ? 'bg-amber-600 text-white shadow-sm font-semibold ring-1 ring-amber-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="text-[11px]">Highlight</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 inline-block shadow-sm"
              style={{ backgroundColor: highlightColor }}
            />
          </button>
        </div>

        {/* Text Remark Tool */}
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            title="Text Remark - Click anywhere on copy to place remark"
            className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTool === 'text'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold ring-1 ring-emerald-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[11px]">Text Remark</span>
          </button>
        </div>

        {/* Eraser Tool */}
        <button
          type="button"
          onClick={() => setActiveTool('eraser')}
          title="Eraser - Click or brush over any annotation to delete"
          className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
            activeTool === 'eraser'
              ? 'bg-rose-600 text-white shadow-sm font-semibold ring-1 ring-rose-400'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="text-[11px]">Eraser</span>
        </button>
      </div>

      {/* Style Config / Color Palette (when Pen or Highlight is active) */}
      {(activeTool === 'pen' || activeTool === 'highlight') && (
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">
            {activeTool === 'pen' ? 'Color:' : 'Marker:'}
          </span>
          <div className="flex items-center space-x-1">
            {(activeTool === 'pen' ? PEN_COLORS : HIGHLIGHT_COLORS).map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => (activeTool === 'pen' ? setPenColor(c.hex) : setHighlightColor(c.hex))}
                title={c.name}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  (activeTool === 'pen' ? penColor : highlightColor) === c.hex
                    ? 'ring-2 ring-indigo-600 scale-110 border-white'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          {activeTool === 'pen' && (
            <>
              <div className="h-3 w-px bg-slate-200 mx-1" />
              <div className="flex items-center space-x-1">
                {STROKE_WIDTHS.map((sw) => (
                  <button
                    key={sw.label}
                    type="button"
                    onClick={() => setPenSize(sw.value)}
                    title={`${sw.label} thickness (${sw.value}px)`}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                      penSize === sw.value
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {sw.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Remark Presets helper when Text tool is active */}
      {activeTool === 'text' && (
        <div className="hidden xl:flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 font-mono font-medium">Quick:</span>
          {QUICK_TEXT_PRESETS.slice(0, 3).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onQuickPresetSelect && onQuickPresetSelect(preset)}
              className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-xs"
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* History & Action Group: Undo, Redo, Clear, Save */}
      <div className="flex items-center space-x-1">
        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo latest annotation (Ctrl+Z)"
          className={`p-1.5 rounded-lg transition-all ${
            canUndo
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo annotation (Ctrl+Y)"
          className={`p-1.5 rounded-lg transition-all ${
            canRedo
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Clear Page */}
        <button
          type="button"
          onClick={onClearPage}
          title={`Clear all remarks on Page ${pageNumber}`}
          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Page Remarks Count Badge */}
        <span className="text-[10px] font-mono text-slate-500 px-1 hidden md:inline">
          P.{pageNumber}: <strong className="text-slate-800">{pageAnnotationCount}</strong>
        </span>

        {/* Save Remarks Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          title="Save all remarks to backend"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            hasUnsavedChanges
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Remarks'}</span>
          {hasUnsavedChanges && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AnnotationToolbar;
