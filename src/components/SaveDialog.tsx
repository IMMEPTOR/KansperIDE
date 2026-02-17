import React, { useState } from 'react';

interface SaveDialogProps {
  onSave: (settings: SaveSettings) => void;
  onCancel: () => void;
}

export interface SaveSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  theme: 'dark' | 'light';
  includeAnimation: boolean;
  format: 'png' | 'jpg';
}

const QUALITY_OPTIONS = {
  low: { label: 'Низкое', scale: 1 },
  medium: { label: 'Среднее', scale: 2 },
  high: { label: 'Высокое', scale: 3 },
  ultra: { label: 'Ультра', scale: 4 },
};

export function SaveDialog({ onSave, onCancel }: SaveDialogProps) {
  const [quality, setQuality] = useState<SaveSettings['quality']>('high');
  const [theme, setTheme] = useState<SaveSettings['theme']>('dark');
  const [includeAnimation, setIncludeAnimation] = useState(false);
  const [format, setFormat] = useState<SaveSettings['format']>('png');

  const handleSave = () => {
    onSave({ quality, theme, includeAnimation, format });
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Настройки экспорта</h3>
          <button onClick={onCancel} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Качество */}
          <div style={styles.section}>
            <label style={styles.label}>Качество изображения</label>
            <div style={styles.radioGroup}>
              {Object.entries(QUALITY_OPTIONS).map(([key, { label }]) => (
                <label key={key} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="quality"
                    value={key}
                    checked={quality === key}
                    onChange={(e) => setQuality(e.target.value as SaveSettings['quality'])}
                    style={styles.radio}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div style={styles.hint}>
              {quality === 'low' && 'Размер: ~500KB, Разрешение: 1000x700'}
              {quality === 'medium' && 'Размер: ~1MB, Разрешение: 2000x1400'}
              {quality === 'high' && 'Размер: ~2MB, Разрешение: 3000x2100'}
              {quality === 'ultra' && 'Размер: ~4MB, Разрешение: 4000x2800'}
            </div>
          </div>

          {/* Тема */}
          <div style={styles.section}>
            <label style={styles.label}>Тема графика</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.value as SaveSettings['theme'])}
                  style={styles.radio}
                />
                <span>Темная</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => setTheme(e.target.value as SaveSettings['theme'])}
                  style={styles.radio}
                />
                <span>Светлая</span>
              </label>
            </div>
          </div>

          {/* Анимация */}
          <div style={styles.section}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeAnimation}
                onChange={(e) => setIncludeAnimation(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Включить анимацию</span>
            </label>
            <div style={styles.hint}>
              Сохранит один кадр с текущим положением частиц
            </div>
          </div>

          {/* Формат */}
          <div style={styles.section}>
            <label style={styles.label}>Формат файла</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="format"
                  value="png"
                  checked={format === 'png'}
                  onChange={(e) => setFormat(e.target.value as SaveSettings['format'])}
                  style={styles.radio}
                />
                <span>PNG (без потерь)</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="format"
                  value="jpg"
                  checked={format === 'jpg'}
                  onChange={(e) => setFormat(e.target.value as SaveSettings['format'])}
                  style={styles.radio}
                />
                <span>JPG (меньший размер)</span>
              </label>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onCancel} style={styles.cancelButton}>
            Отмена
          </button>
          <button onClick={handleSave} style={styles.saveButton}>
            Экспортировать
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  dialog: {
    background: '#2d2d30',
    borderRadius: 8,
    width: 480,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    border: '1px solid #3e3e42',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #3e3e42',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#252526',
  },
  title: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#cccccc',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    transition: 'all 0.15s',
  } as React.CSSProperties,
  content: {
    padding: 20,
    maxHeight: 'calc(90vh - 140px)',
    overflowY: 'auto' as const,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#cccccc',
    marginBottom: 10,
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#d4d4d4',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 4,
    transition: 'background 0.15s',
  } as React.CSSProperties,
  radio: {
    cursor: 'pointer',
    accentColor: '#4A90E2',
  } as React.CSSProperties,
  checkbox: {
    cursor: 'pointer',
    accentColor: '#4A90E2',
  } as React.CSSProperties,
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#d4d4d4',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 4,
  } as React.CSSProperties,
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    marginLeft: 28,
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #3e3e42',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    background: '#252526',
  },
  cancelButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#cccccc',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  saveButton: {
    padding: '8px 16px',
    background: 'linear-gradient(180deg, #4A90E2 0%, #357ABD 100%)',
    color: 'white',
    border: '1px solid #357ABD',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as React.CSSProperties,
};