import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

interface FilePreviewProps {
  filePath: string;
  fileName: string;
  extension?: string;
  readFile: (path: string, isBinary: boolean) => Promise<any>;
}

export function FilePreview({ filePath, fileName, extension, readFile }: FilePreviewProps) {
  const [content, setContent] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [imageData, setImageData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFile();
  }, [filePath]);

  const loadFile = async () => {
    setLoading(true);
    setError('');
    setContent('');
    setHtmlContent('');
    setImageData('');
    
    try {
      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(extension || '');
      const isText = ['txt', 'md', 'markdown', 'readme', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log'].includes(extension || '');
      const isCode = ['рус', 'rus', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'go', 'rs'].includes(extension || '');
      const isWord = ['docx', 'doc'].includes(extension || '');
      
      if (isImage) {
        const data = await readFile(filePath, true) as Uint8Array;
        const blob = new Blob([data], { type: `image/${extension}` });
        const url = URL.createObjectURL(blob);
        setImageData(url);
      } else if (isWord) {
        const data = await readFile(filePath, true) as Uint8Array;
        const arrayBuffer = data.buffer;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        
        if (result.messages.length > 0) {
          console.warn('Word conversion warnings:', result.messages);
        }
      } else if (isText || isCode || !extension) {
        const text = await readFile(filePath, false) as string;
        setContent(text);
      } else if (extension === 'pdf') {
        setError('Предпросмотр PDF: используйте внешний просмотрщик');
      } else {
        setError('Предпросмотр недоступен для этого типа файла');
      }
    } catch (err) {
      setError('Ошибка загрузки файла: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(extension || '');
  const isText = ['txt', 'md', 'markdown', 'readme', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log'].includes(extension || '');
  const isCode = ['рус', 'rus', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'go', 'rs'].includes(extension || '');
  const isWord = ['docx', 'doc'].includes(extension || '');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>{fileName}</span>
        <span style={styles.type}>
          {isImage && 'Изображение'}
          {isText && 'Текстовый файл'}
          {isCode && 'Исходный код'}
          {isWord && 'Word документ'}
          {extension === 'pdf' && 'PDF документ'}
        </span>
      </div>
      
      <div style={styles.content}>
        {loading && <div style={styles.loading}>Загрузка...</div>}
        
        {error && <div style={styles.error}>{error}</div>}
        
        {!loading && !error && isImage && imageData && (
          <div style={styles.imageContainer}>
            <img src={imageData} alt={fileName} style={styles.image} />
          </div>
        )}
        
        {!loading && !error && isWord && htmlContent && (
          <div 
            style={styles.wordContent} 
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
        
        {!loading && !error && (isText || isCode) && content && (
          <pre style={styles.textContent}>{content}</pre>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#2b2d30',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    background: '#313335',
    borderBottom: '1px solid #2b2d30',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 13,
    color: '#cccccc',
    fontWeight: 500,
  },
  type: {
    fontSize: 11,
    color: '#888',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: '#999',
    fontSize: 13,
  },
  error: {
    color: '#ff6b68',
    fontSize: 13,
    padding: 20,
    textAlign: 'center' as const,
    maxWidth: 400,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    border: '1px solid #3c3f41',
  },
  wordContent: {
    color: '#d4d4d4',
    fontSize: 14,
    lineHeight: 1.6,
    width: '100%',
    maxWidth: 800,
    padding: '20px 40px',
    background: '#2b2d30',
    alignSelf: 'flex-start',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
  textContent: {
    color: '#d4d4d4',
    fontSize: 13,
    fontFamily: '"JetBrains Mono", Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    overflow: 'auto',
    alignSelf: 'flex-start',
  },
};