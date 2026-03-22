'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import '@excalidraw/excalidraw/index.css';

interface ExcalidrawEditorProps {
  initialData?: string;
  onSave?: (data: string) => void;
}

export default function ExcalidrawEditor({ initialData, onSave }: ExcalidrawEditorProps) {
  const [Excalidraw, setExcalidraw] = useState<React.ComponentType<any> | null>(null);
  const excalidrawRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);
  const initialDataRef = useRef(initialData); // Capture only on mount

  const latestDataRef = useRef<{ elements: readonly any[]; appState: any } | null>(null);

  // Keep latest onSave in ref to avoid recreating callbacks
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
    });

    // Cleanup on unmount to save any pending changes
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (latestDataRef.current && onSaveRef.current) {
        const { elements, appState } = latestDataRef.current;
        onSaveRef.current(JSON.stringify({ elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } }));
      }
    };
  }, []);

  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    latestDataRef.current = { elements, appState };
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (onSaveRef.current && latestDataRef.current) {
        const { elements, appState } = latestDataRef.current;
        onSaveRef.current(JSON.stringify({ elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } }));
        latestDataRef.current = null;
      }
    }, 1500);
  }, []);

  const getInitialData = () => {
    const data = initialDataRef.current;
    if (!data || data === '{}') return undefined;
    try {
      const parsed = JSON.parse(data);
      return {
        elements: parsed.elements || [],
        appState: { ...parsed.appState, collaborators: new Map() },
      };
    } catch {
      return undefined;
    }
  };

  if (!Excalidraw) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-container-lowest text-on-surface-variant">
        Loading Excalidraw...
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ minHeight: '600px' }}>
      <Excalidraw
        ref={excalidrawRef}
        initialData={getInitialData()}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
}
