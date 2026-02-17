import { useState, useEffect } from 'react';
import { readDir, readTextFile, readFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileSystemItem[];
}

export function useFileSystem() {
  const [rootPath, setRootPath] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDirectory = async (path: string): Promise<FileSystemItem[]> => {
    try {
      const entries = await readDir(path);
      
      const items: FileSystemItem[] = [];
      
      for (const entry of entries) {
        // Пропустить скрытые файлы и системные папки
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const item: FileSystemItem = {
          name: entry.name,
          path: await join(path, entry.name),
          type: entry.isDirectory ? 'directory' : 'file',
        };
        
        if (!entry.isDirectory && entry.name.includes('.')) {
          item.extension = entry.name.split('.').pop()?.toLowerCase();
        }
        
        if (entry.isDirectory) {
          item.children = [];
        }
        
        items.push(item);
      }
      
      return items.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error loading directory:', error);
      return [];
    }
  };

  const openFolder = async (path: string) => {
    setLoading(true);
    try {
      setRootPath(path);
      
      // Извлечь имя папки из пути
      const folderName = path.split('/').pop() || path.split('\\').pop() || 'Проект';
      setProjectName(folderName);
      
      const items = await loadDirectory(path);
      setFileTree(items);
    } catch (error) {
      console.error('Error opening folder:', error);
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };

  const closeFolder = () => {
    setRootPath('');
    setProjectName('');
    setFileTree([]);
  };

  const loadSubdirectory = async (path: string): Promise<FileSystemItem[]> => {
    return await loadDirectory(path);
  };

  const readFileContent = async (path: string, isBinary: boolean = false) => {
    try {
      if (isBinary) {
        return await readFile(path);
      } else {
        return await readTextFile(path);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  };

  return {
    fileTree,
    rootPath,
    projectName,
    loading,
    openFolder,
    closeFolder,
    loadSubdirectory,
    readFile: readFileContent,
  };
}