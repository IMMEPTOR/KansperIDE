import { useState, useRef, useEffect } from 'react';
import { CodeEditor } from './components/Editor';
import { Console } from './components/Console';
import { GraphCanvas } from './components/GraphCanvas';
import { FileIcon } from './components/FileIcon';
import { FilePreview } from './components/FilePreview';
import { MenuBar } from './components/MenuBar';
import { useRusCompiler } from './hooks/useRusCompiler';
import { useFileSystem, FileSystemItem } from './hooks/useFileSystem';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, rename } from '@tauri-apps/plugin-fs';
import { join, basename } from '@tauri-apps/api/path';
import './App.css';

const EXAMPLE_CODE = `// Добро пожаловать в Рус IDE!

печать("Привет, мир!");

функция квадрат(х) {
    вернуть х * х;
}

график(квадрат, -10, 10);
`;

type TabType = 'resources' | 'code' | 'data' | 'main';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  modified: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([
    { path: 'untitled-1.рус', name: 'untitled-1.рус', content: EXAMPLE_CODE, modified: false }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [plots, setPlots] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [fileTreeData, setFileTreeData] = useState<FileSystemItem[]>([]);
  const [graphVisible, setGraphVisible] = useState(true);
  
  const [editorWidth, setEditorWidth] = useState(50);
  const [consoleHeight, setConsoleHeight] = useState(25);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  
  const { fileTree, projectName, loading: fsLoading, openFolder, closeFolder, loadSubdirectory, readFile } = useFileSystem();
  const { runCode, isRunning, output, errors } = useRusCompiler();

  const [draggedTab, setDraggedTab] = useState<number | null>(null);
  const [draggedFile, setDraggedFile] = useState<FileSystemItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Drag and drop вкладок
const handleTabDragStart = (index: number) => {
  setDraggedTab(index);
};

const handleTabDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault();
  if (draggedTab === null || draggedTab === index) return;
  
  // Переместить вкладку
  const newFiles = [...openFiles];
  const draggedFile = newFiles[draggedTab];
  newFiles.splice(draggedTab, 1);
  newFiles.splice(index, 0, draggedFile);
  
  setOpenFiles(newFiles);
  
  // Обновить индексы
  if (activeFileIndex === draggedTab) {
    setActiveFileIndex(index);
  } else if (activeFileIndex > draggedTab && activeFileIndex <= index) {
    setActiveFileIndex(activeFileIndex - 1);
  } else if (activeFileIndex < draggedTab && activeFileIndex >= index) {
    setActiveFileIndex(activeFileIndex + 1);
  }
  
  setDraggedTab(index);
};

const handleTabDragEnd = () => {
  setDraggedTab(null);
};

// Drag and drop файлов в дереве
const handleFileDragStart = (file: FileSystemItem, e: React.DragEvent) => {
  e.stopPropagation();
  setDraggedFile(file);
  e.dataTransfer.effectAllowed = 'move';
};

const handleFileDragOver = (item: FileSystemItem, e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (item.type === 'directory' && draggedFile && draggedFile.path !== item.path) {
    setDropTarget(item.path);
    e.dataTransfer.dropEffect = 'move';
  }
};

const handleFileDragLeave = (e: React.DragEvent) => {
  e.stopPropagation();
  setDropTarget(null);
};

const handleFileDrop = async (targetItem: FileSystemItem, e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!draggedFile || targetItem.type !== 'directory') return;
  
  try {
    const fileName = await basename(draggedFile.path);
    const newPath = await join(targetItem.path, fileName);
    
    // Проверить что не перемещаем в ту же папку
    if (draggedFile.path === newPath) {
      setDraggedFile(null);
      setDropTarget(null);
      return;
    }
    
    // Переместить файл
    await rename(draggedFile.path, newPath);
    
    // Обновить открытые файлы если перемещенный файл был открыт
    const updatedFiles = openFiles.map(f => {
      if (f.path === draggedFile.path) {
        return { ...f, path: newPath };
      }
      return f;
    });
    setOpenFiles(updatedFiles);
    
    // Обновить дерево
    if (rootPath) {
      await openFolder(rootPath);
    }
    
    console.log(`Файл перемещен: ${draggedFile.path} -> ${newPath}`);
  } catch (error) {
    console.error('Ошибка перемещения файла:', error);
    alert('Не удалось переместить файл: ' + error);
  } finally {
    setDraggedFile(null);
    setDropTarget(null);
  }
};

const handleFileDragEnd = () => {
  setDraggedFile(null);
  setDropTarget(null);
};
  useEffect(() => {
    setFileTreeData(fileTree);
  }, [fileTree]);

  // Resize handlers
  const handleMouseDownHorizontal = () => setIsResizingHorizontal(true);
  const handleMouseDownVertical = () => setIsResizingVertical(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isResizingHorizontal) {
        const newWidth = ((e.clientX - rect.left - 240) / (rect.width - 240)) * 100;
        if (newWidth > 30 && newWidth < 70) {
          setEditorWidth(newWidth);
        }
      }

      if (isResizingVertical) {
        const clickY = e.clientY - rect.top;
        const newTopHeight = (clickY / rect.height) * 100;
        const newConsoleHeight = 100 - newTopHeight;
        if (newConsoleHeight > 15 && newConsoleHeight < 50) {
          setConsoleHeight(newConsoleHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
      setIsResizingVertical(false);
    };

    if (isResizingHorizontal || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingHorizontal ? 'col-resize' : 'row-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizingHorizontal, isResizingVertical]);

  // File operations
  const handleNew = () => {
    const newFile: OpenFile = {
      path: `untitled-${Date.now()}.рус`,
      name: `untitled-${openFiles.length + 1}.рус`,
      content: '',
      modified: false
    };
    setOpenFiles([...openFiles, newFile]);
    setActiveFileIndex(openFiles.length);
  };

  const handleOpen = async () => {
    try {
      const filePath = await open({
        filters: [{
          name: 'Rus Files',
          extensions: ['рус', 'rus']
        }]
      });

      if (!filePath) return;

      const content = await readTextFile(filePath as string);
      const fileName = (filePath as string).split('/').pop() || (filePath as string).split('\\').pop() || 'file.рус';
      
      const existingIndex = openFiles.findIndex(f => f.path === filePath);
      if (existingIndex !== -1) {
        setActiveFileIndex(existingIndex);
      } else {
        const newFile: OpenFile = {
          path: filePath as string,
          name: fileName,
          content,
          modified: false
        };
        setOpenFiles([...openFiles, newFile]);
        setActiveFileIndex(openFiles.length);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const folderPath = await open({
        directory: true,
        multiple: false,
      });

      if (!folderPath) return;

      await openFolder(folderPath as string);
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const handleSave = async () => {
    const activeFile = openFiles[activeFileIndex];
    
    try {
      if (activeFile.path.startsWith('untitled-')) {
        await handleSaveAs();
      } else {
        await writeTextFile(activeFile.path, activeFile.content);
        const newFiles = [...openFiles];
        newFiles[activeFileIndex] = { ...activeFile, modified: false };
        setOpenFiles(newFiles);
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleSaveAs = async () => {
    const activeFile = openFiles[activeFileIndex];
    
    try {
      const filePath = await save({
        filters: [{
          name: 'Rus Files',
          extensions: ['рус', 'rus']
        }],
        defaultPath: activeFile.name
      });

      if (!filePath) return;

      await writeTextFile(filePath, activeFile.content);
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'file.рус';
      
      const newFiles = [...openFiles];
      newFiles[activeFileIndex] = {
        path: filePath,
        name: fileName,
        content: activeFile.content,
        modified: false
      };
      setOpenFiles(newFiles);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleRun = async () => {
    const activeFile = openFiles[activeFileIndex];
    const result = await runCode(activeFile.content);
    
    if (result?.plots && result.plots.length > 0) {
      setPlots([...result.plots]);
      setGraphVisible(true);
    } else {
      setPlots([]);
    }
  };

  const handleCodeChange = (newCode: string) => {
    const newFiles = [...openFiles];
    newFiles[activeFileIndex] = {
      ...newFiles[activeFileIndex],
      content: newCode,
      modified: true
    };
    setOpenFiles(newFiles);
  };

  const closeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (openFiles[index].modified) {
      const confirmed = window.confirm('Файл изменен. Закрыть без сохранения?');
      if (!confirmed) return;
    }
    
    if (openFiles.length === 1) {
      handleNew();
      return;
    }
    
    const newFiles = openFiles.filter((_, i) => i !== index);
    setOpenFiles(newFiles);
    
    if (activeFileIndex >= newFiles.length) {
      setActiveFileIndex(Math.max(0, newFiles.length - 1));
    } else if (activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  // File tree operations
  const toggleFolder = async (item: FileSystemItem) => {
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(item.path)) {
      newExpanded.delete(item.path);
    } else {
      newExpanded.add(item.path);
      
      if (item.children && item.children.length === 0) {
        const children = await loadSubdirectory(item.path);
        
        const updateTree = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.map(i => {
            if (i.path === item.path) {
              return { ...i, children };
            }
            if (i.children) {
              return { ...i, children: updateTree(i.children) };
            }
            return i;
          });
        };
        
        setFileTreeData(updateTree(fileTreeData));
      }
    }
    
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (file: FileSystemItem) => {
  if (file.type === 'file') {
    // Файлы .рус открываем в редакторе
    if (file.extension === 'рус' || file.extension === 'rus') {
      const existingIndex = openFiles.findIndex(f => f.path === file.path);
      
      if (existingIndex !== -1) {
        setActiveFileIndex(existingIndex);
        setPreviewFile(null);
      } else {
        try {
          const content = await readFile(file.path, false) as string;
          const newFile: OpenFile = {
            path: file.path,
            name: file.name,
            content,
            modified: false
          };
          setOpenFiles([...openFiles, newFile]);
          setActiveFileIndex(openFiles.length);
          setPreviewFile(null);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }
    } else {
      // Остальные файлы открываем в превью
      setPreviewFile(file);
    }
  }
};

  const renderFileTree = (items: FileSystemItem[], level: number = 0) => {
  return items.map((item) => {
    if (item.type === 'directory') {
      const isExpanded = expandedFolders.has(item.path);
      const isDropTarget = dropTarget === item.path;
      
      return (
        <div key={item.path}>
          <div 
            className={`tree-folder ${isDropTarget ? 'drop-target' : ''}`}
            onClick={() => toggleFolder(item)}
            onDragOver={(e) => handleFileDragOver(item, e)}
            onDragLeave={handleFileDragLeave}
            onDrop={(e) => handleFileDrop(item, e)}
            style={{ paddingLeft: `${8 + level * 12}px` }}
          >
            <svg 
              width="8" 
              height="8" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              className={`arrow ${isExpanded ? 'expanded' : ''}`}
            >
              <path d="M6 4l4 4-4 4z"/>
            </svg>
            <FileIcon type="directory" isOpen={isExpanded} />
            <span className="tree-item-name">{item.name}</span>
          </div>
          {isExpanded && item.children && item.children.length > 0 && (
            <div>{renderFileTree(item.children, level + 1)}</div>
          )}
        </div>
      );
    } else {
      return (
        <div 
          key={item.path}
          className="tree-file"
          draggable
          onDragStart={(e) => handleFileDragStart(item, e)}
          onDragEnd={handleFileDragEnd}
          onClick={() => handleFileClick(item)}
          style={{ 
            paddingLeft: `${20 + level * 12}px`,
            opacity: draggedFile?.path === item.path ? 0.5 : 1
          }}
        >
          <FileIcon type="file" extension={item.extension} />
          <span className="tree-item-name">{item.name}</span>
        </div>
      );
    }
  });
};

  return (
    <div className="app-container">
      {/* Top Menu Bar */}
     <div className="top-bar">
        <div className="logo-area">I</div>
        <MenuBar 
          onNew={handleNew}
          onOpen={handleOpen}
          onOpenFolder={handleOpenFolder}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onRun={handleRun}
          isRunning={isRunning}
        />
      </div>

      {/* Main Content Area */}
      <div className="content-area">
        {/* Left Sidebar - File Tree */}
        <div className="sidebar-left">
          <div className="sidebar-title">
            {projectName || 'Ири-контексты'}
            {projectName && (
              <button 
                onClick={closeFolder}
                className="close-project-btn"
                title="Закрыть папку"
              >
                ✕
              </button>
            )}
          </div>
          <div className="file-tree-container">
            {fsLoading ? (
              <div className="tree-loading">Загрузка...</div>
            ) : fileTree.length === 0 ? (
              <div className="tree-empty">
                <p>Нет открытой папки</p>
                <button onClick={handleOpenFolder} className="open-folder-hint">
                  Открыть папку
                </button>
              </div>
            ) : (
              renderFileTree(fileTreeData)
            )}
          </div>
        </div>

        {/* Center and Right Area */}
        <div className="main-panel" ref={containerRef}>
          {/* File Tabs */}
          {/* File Tabs */}
<div className="file-tabs-bar">
  {openFiles.map((file, index) => (
    <div 
      key={file.path + index}
      className={`file-tab ${index === activeFileIndex ? 'active' : ''} ${draggedTab === index ? 'dragging' : ''}`}
      draggable
      onDragStart={() => handleTabDragStart(index)}
      onDragOver={(e) => handleTabDragOver(e, index)}
      onDragEnd={handleTabDragEnd}
      onClick={() => setActiveFileIndex(index)}
    >
      <span className="tab-name">{file.name}</span>
      {file.modified && <span className="modified-indicator">●</span>}
      <button 
        className="tab-close"
        onClick={(e) => closeFile(index, e)}
        title="Закрыть"
      >
        ✕
      </button>
    </div>
  ))}
</div>

          {/* Editor and Graph Row */}
          <div 
            className="editor-graph-row"
            style={{ height: `${100 - consoleHeight}%` }}
          >
            {/* Editor Area */}
            {/* Editor Area */}
<div 
  className="editor-container"
  style={{ width: graphVisible ? `${editorWidth}%` : '100%' }}
>
  {previewFile ? (
    <FilePreview 
      filePath={previewFile.path}
      fileName={previewFile.name}
      extension={previewFile.extension}
      readFile={readFile}
    />
  ) : openFiles.length > 0 ? (
    <CodeEditor 
      value={openFiles[activeFileIndex].content}
      onChange={handleCodeChange}
      onRun={handleRun}
    />
  ) : (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      color: '#666',
      fontSize: 13
    }}>
      Откройте файл для редактирования
    </div>
  )}
</div>

            {/* Vertical Resize Handle */}
            {graphVisible && (
              <div 
                className="resize-handle-vert"
                onMouseDown={handleMouseDownHorizontal}
              />
            )}

            {/* Graph Area */}
            {graphVisible && (
              <div 
                className="graph-container"
                style={{ width: `${100 - editorWidth}%` }}
              >
                <GraphCanvas 
                  plots={plots}
                  onClose={() => setGraphVisible(false)}
                />
              </div>
            )}
          </div>

          {/* Horizontal Resize Handle */}
          <div 
            className="resize-handle-horiz"
            onMouseDown={handleMouseDownVertical}
          />

          {/* Console Area */}
          <div 
            className="console-container"
            style={{ height: `${consoleHeight}%` }}
          >
            <Console 
              output={output}
              errors={errors}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Floating Show Graph Button */}
      {!graphVisible && plots.length > 0 && (
        <button 
          className="show-graph-fab"
          onClick={() => setGraphVisible(true)}
          title="Показать график"
        >
          Показать график
        </button>
      )}
    </div>
  );
}

export default App;