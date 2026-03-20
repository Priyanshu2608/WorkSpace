'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface ExcalidrawEditorProps {
  initialData?: string;
  onSave?: (data: string) => void;
}

export default function ExcalidrawEditor({ initialData, onSave }: ExcalidrawEditorProps) {
  const [Excalidraw, setExcalidraw] = useState<React.ComponentType<any> | null>(null);
  const excalidrawRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
    });
  }, []);

  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (excalidrawRef.current && onSave) {
        const elements = excalidrawRef.current.getSceneElements();
        const appState = excalidrawRef.current.getAppState();
        onSave(JSON.stringify({ elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } }));
      }
    }, 2000);
  }, [onSave]);

  const getInitialData = () => {
    if (!initialData || initialData === '{}') return undefined;
    try {
      const parsed = JSON.parse(initialData);
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
    <div className="h-full w-full" style={{ minHeight: '400px' }}>
      <Excalidraw
        ref={excalidrawRef}
        initialData={getInitialData()}
        onChange={handleChange}
        theme="dark"
        UIOptions={{
          canvasActions: {
            loadScene: false,
          },
        }}
      />
    </div>
  );
}
