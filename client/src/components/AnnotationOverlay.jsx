import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Trash2,
  X,
  Check,
  Tag,
  AlertCircle,
  HelpCircle,
  Plus
} from 'lucide-react';

const QUICK_PRESETS = [
  { label: 'Step missing', color: '#ef4444' },
  { label: 'Wrong formula', color: '#ef4444' },
  { label: 'Calculation error', color: '#ef4444' },
  { label: 'Partially correct', color: '#f59e0b' },
  { label: 'Good explanation', color: '#10b981' },
  { label: 'Excellent step', color: '#10b981' },
  { label: 'Incomplete answer', color: '#f59e0b' },
  { label: '+1 Mark', color: '#10b981' },
  { label: '-1 Mark', color: '#ef4444' }
];

// Helper to convert array of points into SVG path string
const pointsToSvgPath = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }

  // Smooth quadratic bezier curve through points
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
};

const AnnotationOverlay = ({
  pageNumber = 1,
  activeTool = 'select',
  penColor = '#ef4444',
  penSize = 3,
  highlightColor = '#eab308',
  highlightSize = 22,
  annotations = [],
  onAddAnnotation,
  onRemoveAnnotation,
  quickPresetToPlace,
  onClearQuickPreset
}) => {
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);

  // Text Remark Composer State
  const [composerPos, setComposerPos] = useState(null); // { x, y, screenX, screenY }
  const [composerText, setComposerText] = useState('');
  const [composerColor, setComposerColor] = useState('#ef4444');

  // Handle quick preset triggered from toolbar
  useEffect(() => {
    if (quickPresetToPlace) {
      setComposerText(quickPresetToPlace);
      // If no active composer, place near center-top
      if (!composerPos) {
        setComposerPos({ x: 500, y: 150 });
      }
      onClearQuickPreset && onClearQuickPreset();
    }
  }, [quickPresetToPlace]);

  // Convert client pointer event into normalized 0..1000 coordinate space
  const getNormalizedCoordinates = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const y = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));
    return { x, y };
  };

  // Pointer Down: begin stroke or open text remark
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // only left-click
    if (activeTool === 'select') return;

    if (e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (activeTool === 'pen' || activeTool === 'highlight') {
      e.preventDefault();
      e.stopPropagation();
      const coords = getNormalizedCoordinates(e);
      setIsDrawing(true);
      setCurrentStroke([coords]);
    } else if (activeTool === 'text') {
      e.preventDefault();
      e.stopPropagation();
      const coords = getNormalizedCoordinates(e);
      setComposerPos(coords);
      setComposerText('');
      setComposerColor('#ef4444');
    }
  };

  // Pointer Move: record path points
  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    if (activeTool === 'pen' || activeTool === 'highlight') {
      e.preventDefault();
      e.stopPropagation();
      const coords = getNormalizedCoordinates(e);
      setCurrentStroke((prev) => [...prev, coords]);
    }
  };

  // Pointer Up: commit completed stroke
  const handlePointerUp = (e) => {
    if (e && e.currentTarget && e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 0) {
      const isHighlight = activeTool === 'highlight';
      const newAnnotation = {
        id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: isHighlight ? 'HIGHLIGHT' : 'PEN',
        pageNumber,
        coordinates: { points: [...currentStroke] },
        styling: {
          color: isHighlight ? highlightColor : penColor,
          strokeWidth: isHighlight ? highlightSize : penSize,
          opacity: isHighlight ? 0.4 : 1
        },
        content: ''
      };
      onAddAnnotation && onAddAnnotation(newAnnotation);
    }
    setCurrentStroke([]);
  };

  const handlePointerLeave = (e) => {
    if (isDrawing) {
      handlePointerUp(e);
    }
  };

  // Submit Text Remark Composer
  const handleSaveTextRemark = () => {
    if (!composerText.trim() || !composerPos) {
      setComposerPos(null);
      return;
    }

    const newAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'TEXT',
      pageNumber,
      coordinates: { x: composerPos.x, y: composerPos.y },
      styling: {
        color: composerColor,
        fontSize: 13,
        opacity: 1
      },
      content: composerText.trim()
    };

    onAddAnnotation && onAddAnnotation(newAnnotation);
    setComposerPos(null);
    setComposerText('');
  };

  // Filter annotations for current page / target container
  const pageAnnotations = annotations.filter(
    (a) => String(a.pageNumber) === String(pageNumber)
  );

  // Determine cursor based on tool
  let cursorClass = 'cursor-default';
  if (activeTool === 'pen') cursorClass = 'cursor-crosshair';
  if (activeTool === 'highlight') cursorClass = 'cursor-cell';
  if (activeTool === 'text') cursorClass = 'cursor-text';
  if (activeTool === 'eraser') cursorClass = 'cursor-pointer';

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`absolute inset-0 w-full h-full select-none z-30 ${cursorClass} ${
        activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={{ touchAction: 'none', zIndex: 30 }}
    >
      {/* SVG Layer for Drawing Strokes (Pen & Highlight) */}
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 31 }}
      >
        {/* Render Highlights First (so they sit under pen strokes) */}
        {pageAnnotations
          .filter((a) => (a.type || '').toUpperCase() === 'HIGHLIGHT')
          .map((a, idx) => {
            const isHovered = hoveredAnnotationId === (a.id || a._id);
            const pathD = pointsToSvgPath(a.coordinates?.points);
            if (!pathD) return null;

            return (
              <g
                key={a.id || a._id || idx}
                className={activeTool === 'eraser' ? 'pointer-events-auto cursor-pointer' : ''}
                onMouseEnter={() => activeTool === 'eraser' && setHoveredAnnotationId(a.id || a._id)}
                onMouseLeave={() => activeTool === 'eraser' && setHoveredAnnotationId(null)}
                onClick={(e) => {
                  if (activeTool === 'eraser') {
                    e.stopPropagation();
                    onRemoveAnnotation && onRemoveAnnotation(a.id || a._id);
                  }
                }}
              >
                <path
                  d={pathD}
                  stroke={isHovered ? '#f43f5e' : a.styling?.color || '#eab308'}
                  strokeWidth={a.styling?.strokeWidth || 22}
                  strokeOpacity={isHovered ? 0.8 : a.styling?.opacity || 0.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </g>
            );
          })}

        {/* Render Freehand Pen Strokes */}
        {pageAnnotations
          .filter((a) => (a.type || '').toUpperCase() === 'PEN')
          .map((a, idx) => {
            const isHovered = hoveredAnnotationId === (a.id || a._id);
            const pathD = pointsToSvgPath(a.coordinates?.points);
            if (!pathD) return null;

            return (
              <g
                key={a.id || a._id || idx}
                className={activeTool === 'eraser' ? 'pointer-events-auto cursor-pointer' : ''}
                onMouseEnter={() => activeTool === 'eraser' && setHoveredAnnotationId(a.id || a._id)}
                onMouseLeave={() => activeTool === 'eraser' && setHoveredAnnotationId(null)}
                onClick={(e) => {
                  if (activeTool === 'eraser') {
                    e.stopPropagation();
                    onRemoveAnnotation && onRemoveAnnotation(a.id || a._id);
                  }
                }}
              >
                {/* Fat invisible hit area for easy erasing */}
                {activeTool === 'eraser' && (
                  <path
                    d={pathD}
                    stroke="transparent"
                    strokeWidth={Math.max(14, (a.styling?.strokeWidth || 3) * 3)}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <path
                  d={pathD}
                  stroke={isHovered ? '#f43f5e' : a.styling?.color || '#ef4444'}
                  strokeWidth={a.styling?.strokeWidth || 3}
                  strokeOpacity={isHovered ? 0.7 : a.styling?.opacity || 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            );
          })}

        {/* Realtime Drawing Stroke Preview */}
        {isDrawing && currentStroke.length > 0 && (
          <path
            d={pointsToSvgPath(currentStroke)}
            stroke={activeTool === 'highlight' ? highlightColor : penColor}
            strokeWidth={activeTool === 'highlight' ? highlightSize : penSize}
            strokeOpacity={activeTool === 'highlight' ? 0.4 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={activeTool === 'highlight' ? { mixBlendMode: 'multiply' } : {}}
          />
        )}
      </svg>

      {/* HTML Layer for Text Remarks & Pinned Badges */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {pageAnnotations
          .filter((a) => (a.type || '').toUpperCase() === 'TEXT')
          .map((a, idx) => {
            const xPercent = ((a.coordinates?.x || 0) / 1000) * 100;
            const yPercent = ((a.coordinates?.y || 0) / 1000) * 100;
            const tagColor = a.styling?.color || '#ef4444';
            const isHovered = hoveredAnnotationId === (a.id || a._id);

            return (
              <div
                key={a.id || a._id || idx}
                style={{
                  top: `${yPercent}%`,
                  left: `${xPercent}%`,
                  transform: 'translate(-10px, -12px)'
                }}
                className="absolute pointer-events-auto z-10 group"
                onMouseEnter={() => setHoveredAnnotationId(a.id || a._id)}
                onMouseLeave={() => setHoveredAnnotationId(null)}
                onClick={(e) => {
                  if (activeTool === 'eraser') {
                    e.stopPropagation();
                    onRemoveAnnotation && onRemoveAnnotation(a.id || a._id);
                  }
                }}
              >
                {/* Remark Badge Tag */}
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shadow-lg border backdrop-blur-sm transition-transform hover:scale-105 ${
                    isHovered && activeTool === 'eraser'
                      ? 'bg-rose-700 border-rose-400 ring-2 ring-rose-400 line-through'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                  }`}
                  style={{ borderLeft: `3px solid ${tagColor}` }}
                >
                  <MessageSquare className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="max-w-[200px] truncate">{a.content}</span>

                  {/* Delete Button on Hover */}
                  <button
                    type="button"
                    title="Delete Remark"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAnnotation && onRemoveAnnotation(a.id || a._id);
                    }}
                    className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Interactive Text Remark Composer Dialog */}
      {composerPos && (
        <div
          style={{
            top: `${Math.min(80, (composerPos.y / 1000) * 100)}%`,
            left: `${Math.min(70, Math.max(5, (composerPos.x / 1000) * 100))}%`
          }}
          className="absolute z-30 pointer-events-auto bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-xl p-3.5 w-72 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Evaluator Remark</span>
            </div>
            <button
              type="button"
              onClick={() => setComposerPos(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-2">
            <span className="text-[10px] text-slate-500 font-mono block mb-1 font-semibold">
              Common Feedback Presets:
            </span>
            <div className="flex flex-wrap gap-1">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setComposerText(preset.label);
                    setComposerColor(preset.color);
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-[10px] text-slate-700 transition-colors border border-slate-200 shadow-2xs"
                  style={{ borderLeft: `2px solid ${preset.color}` }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Textarea / Input */}
          <div className="space-y-2">
            <textarea
              autoFocus
              rows={2}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="Type remark (e.g. Step 2 missing, check units)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveTextRemark();
                } else if (e.key === 'Escape') {
                  setComposerPos(null);
                }
              }}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1">
                {['#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setComposerColor(col)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${
                      composerColor === col ? 'ring-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setComposerPos(null)}
                  className="px-2 py-1 rounded-lg text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTextRemark}
                  disabled={!composerText.trim()}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    composerText.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>Place Remark</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationOverlay;
