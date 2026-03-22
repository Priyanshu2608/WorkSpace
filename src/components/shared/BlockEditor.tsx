'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { useEffect, useState, useMemo } from 'react';

interface BlockEditorProps {
  initialContent?: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
}

export default function BlockEditor({
  initialContent = '',
  onChange,
  editable = true,
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<PartialBlock[] | undefined | 'loading'>('loading');

  // We only parse the initial content ONCE when the component mounts or when a completely different document loads.
  useEffect(() => {
    let isMounted = true;
    async function loadMarkdown() {
      if (!initialContent) {
        if (isMounted) setBlocks(undefined);
        return;
      }
      // Create a temporary editor just to parse the Markdown
      const tempEditor = BlockNoteEditor.create();
      const newBlocks = await tempEditor.tryParseMarkdownToBlocks(initialContent);
      if (isMounted) setBlocks(newBlocks);
    }
    
    setBlocks('loading'); // Reset to loading if content changes externally
    loadMarkdown();
    
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent]); // Trigger when the raw string from the DB changes (usually on different note selection)

  // Memoize the creation so we don't recreate the editor continuously,
  // but we do recreate it if `blocks` changes completely.
  const editor = useCreateBlockNote({ initialContent: blocks === 'loading' ? undefined : blocks }, [blocks]);

  if (blocks === 'loading') {
    return (
      <div className="flex-1 w-full h-full p-6 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded-md w-1/3 mb-4"></div>
        <div className="h-4 bg-surface-container-high rounded-md w-full mb-2"></div>
        <div className="h-4 bg-surface-container-high rounded-md w-5/6 mb-2"></div>
        <div className="h-4 bg-surface-container-high rounded-md w-4/6"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full overflow-y-auto font-[family-name:var(--font-family-display)] p-4 cursor-text blocknote-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="dark"
        onChange={async () => {
          // Serialize to markdown on every change and propagate
          const md = await editor.blocksToMarkdownLossy(editor.document);
          onChange(md);
        }}
      />
      <style jsx global>{`
        /* Overrides to make BlockNote blend into our custom dark UI */
        .blocknote-wrapper .bn-container {
          --bn-colors-editor-background: transparent !important;
          --bn-colors-menu-background: #1e1e24 !important;
          --bn-colors-menu-text: #e1e1e6 !important;
          font-family: inherit !important;
        }
      `}</style>
    </div>
  );
}
