import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Copy, Check } from 'lucide-react';
import { ANDROID_FILES, AndroidFile } from '../data/androidFiles';

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: AndroidFile;
}

function buildTree(files: AndroidFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split('/');
    let currentLevel = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const existing = currentLevel.find((n) => n.name === part);

      if (existing) {
        if (!isLast) currentLevel = existing.children;
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, idx + 1).join('/'),
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        currentLevel.push(node);
        if (!isLast) currentLevel = node.children;
      }
    });
  });

  return root;
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({ ...n, children: sortNodes(n.children) }));
}

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (file: AndroidFile) => void;
}

function TreeNodeView({ node, depth, selectedPath, onSelect }: TreeNodeProps) {
  const [open, setOpen] = useState(depth < 2);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-1.5 px-3 py-1 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors rounded"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {open
            ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
          {open
            ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
            : <Folder className="w-3.5 h-3.5 flex-shrink-0 text-sky-400/60" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div>
            {node.children.map((child) => (
              <TreeNodeView
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;
  const lang = node.file?.language ?? 'text';

  const langColors: Record<string, string> = {
    java: 'text-orange-400',
    cpp: 'text-sky-400',
    xml: 'text-emerald-400',
    gradle: 'text-teal-400',
    cmake: 'text-rose-400',
    text: 'text-slate-400',
  };
  const langColor = langColors[lang] ?? 'text-slate-400';

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={`w-full flex items-center gap-1.5 py-1 text-sm transition-colors rounded ${
        isSelected
          ? 'bg-sky-500/15 text-sky-300'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
      }`}
      style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '12px' }}
    >
      <File className={`w-3.5 h-3.5 flex-shrink-0 ${langColor}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function getLanguageLabel(lang: string): string {
  const map: Record<string, string> = {
    java: 'Java',
    cpp: 'C++',
    xml: 'XML',
    gradle: 'Gradle',
    cmake: 'CMake',
    text: 'Text',
  };
  return map[lang] ?? lang;
}

const LANG_COLORS: Record<string, string> = {
  java: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  cpp: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  xml: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  gradle: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  cmake: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  text: 'bg-slate-700 text-slate-300 border-slate-600',
};

function tokenize(code: string, lang: string): (string | JSX.Element)[] {
  if (lang === 'java' || lang === 'cpp') {
    const keywords = lang === 'java'
      ? /\b(public|private|protected|static|final|void|class|interface|extends|implements|new|return|if|else|for|while|switch|case|break|continue|import|package|try|catch|finally|throw|throws|null|true|false|boolean|int|float|double|long|char|byte|short|String|this|super|instanceof|override|abstract|native|synchronized|volatile|transient)\b/g
      : /\b(auto|bool|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|nullptr|operator|private|protected|public|register|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|while|include|define|pragma|ifdef|ifndef|endif)\b/g;

    const commentRegex = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g;
    const stringRegex = /"([^"\\]|\\.)*"/g;
    const annotationRegex = /@\w+/g;

    let result = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    result = result
      .replace(commentRegex, '<span class="text-slate-500 italic">$&</span>')
      .replace(stringRegex, '<span class="text-emerald-400">$&</span>')
      .replace(annotationRegex, '<span class="text-yellow-400">$&</span>')
      .replace(keywords, '<span class="text-sky-400 font-medium">$&</span>');

    return [<span key="code" dangerouslySetInnerHTML={{ __html: result }} />];
  }

  if (lang === 'xml') {
    const result = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[\w:.]+)/g, '<span class="text-sky-400">$1</span>')
      .replace(/([\w:]+)(=)/g, '<span class="text-emerald-400">$1</span>$2')
      .replace(/("([^"]*)")/g, '<span class="text-amber-300">$1</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-500 italic">$1</span>');
    return [<span key="code" dangerouslySetInnerHTML={{ __html: result }} />];
  }

  return [<span key="code">{code}</span>];
}

export function FileBrowser() {
  const [selectedFile, setSelectedFile] = useState<AndroidFile | null>(ANDROID_FILES[0] ?? null);
  const [copied, setCopied] = useState(false);

  const tree = sortNodes(buildTree(ANDROID_FILES));

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lines = selectedFile ? selectedFile.content.split('\n') : [];
  const tokenized = selectedFile ? tokenize(selectedFile.content, selectedFile.language) : [];

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-700 overflow-y-auto">
        <div className="px-3 py-3 border-b border-slate-700">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Project Files</p>
          <p className="text-xs text-slate-600 mt-0.5">{ANDROID_FILES.length} files</p>
        </div>
        <div className="py-2">
          {tree.map((node) => (
            <TreeNodeView
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedFile?.path ?? null}
              onSelect={setSelectedFile}
            />
          ))}
        </div>
      </aside>

      {/* Code viewer */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {selectedFile ? (
          <>
            {/* File header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded border font-mono font-semibold flex-shrink-0 ${LANG_COLORS[selectedFile.language] ?? LANG_COLORS.text}`}>
                  {getLanguageLabel(selectedFile.language)}
                </span>
                <span className="text-sm text-slate-300 font-mono truncate">{selectedFile.path}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs text-slate-600">{lines.length} lines</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Code content */}
            <div className="flex-1 overflow-auto">
              <div className="flex min-w-0">
                {/* Line numbers */}
                <div className="select-none flex-shrink-0 bg-slate-950 border-r border-slate-800 px-3 py-4 text-right">
                  {lines.map((_, i) => (
                    <div key={i} className="text-xs text-slate-700 font-mono leading-6 h-6">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Code */}
                <pre className="flex-1 px-5 py-4 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono leading-6 whitespace-pre">
                    {tokenized}
                  </code>
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Select a file from the sidebar
          </div>
        )}
      </main>
    </div>
  );
}
