import React, { useState } from 'react';

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onOpenFolder: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onRun: () => void;
  isRunning: boolean;
}

export function MenuBar({ onNew, onOpen, onOpenFolder, onSave, onSaveAs, onRun, isRunning }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setOpenMenu(null);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    closeMenu();
  };

  return (
    <div className="menu-bar" onMouseLeave={closeMenu}>
      {/* File Menu */}
      <div className="menu-item">
        <div 
          className={`menu-label ${openMenu === 'file' ? 'active' : ''}`}
          onClick={() => toggleMenu('file')}
        >
          Файл
        </div>
        {openMenu === 'file' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => handleMenuAction(onNew)}>
              <span>Новый файл</span>
              <span className="menu-shortcut">Ctrl+N</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuAction(onOpen)}>
              <span>Открыть файл</span>
              <span className="menu-shortcut">Ctrl+O</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuAction(onOpenFolder)}>
              <span>Открыть папку</span>
              <span className="menu-shortcut">Ctrl+Shift+O</span>
            </div>
            <div className="menu-separator" />
            <div className="menu-option" onClick={() => handleMenuAction(onSave)}>
              <span>Сохранить</span>
              <span className="menu-shortcut">Ctrl+S</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuAction(onSaveAs)}>
              <span>Сохранить как...</span>
              <span className="menu-shortcut">Ctrl+Shift+S</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="menu-item">
        <div 
          className={`menu-label ${openMenu === 'edit' ? 'active' : ''}`}
          onClick={() => toggleMenu('edit')}
        >
          Правка
        </div>
        {openMenu === 'edit' && (
          <div className="menu-dropdown">
            <div className="menu-option disabled">
              <span>Отменить</span>
              <span className="menu-shortcut">Ctrl+Z</span>
            </div>
            <div className="menu-option disabled">
              <span>Повторить</span>
              <span className="menu-shortcut">Ctrl+Y</span>
            </div>
            <div className="menu-separator" />
            <div className="menu-option disabled">
              <span>Вырезать</span>
              <span className="menu-shortcut">Ctrl+X</span>
            </div>
            <div className="menu-option disabled">
              <span>Копировать</span>
              <span className="menu-shortcut">Ctrl+C</span>
            </div>
            <div className="menu-option disabled">
              <span>Вставить</span>
              <span className="menu-shortcut">Ctrl+V</span>
            </div>
          </div>
        )}
      </div>

      {/* Run Menu */}
      <div className="menu-item">
        <div 
          className={`menu-label ${openMenu === 'run' ? 'active' : ''}`}
          onClick={() => toggleMenu('run')}
        >
          Запуск
        </div>
        {openMenu === 'run' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => handleMenuAction(onRun)}>
              <span>{isRunning ? 'Выполняется...' : 'Запустить'}</span>
              <span className="menu-shortcut">Ctrl+Enter</span>
            </div>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="menu-item">
        <div 
          className={`menu-label ${openMenu === 'view' ? 'active' : ''}`}
          onClick={() => toggleMenu('view')}
        >
          Вид
        </div>
        {openMenu === 'view' && (
          <div className="menu-dropdown">
            <div className="menu-option disabled">
              <span>Показать проводник</span>
            </div>
            <div className="menu-option disabled">
              <span>Показать консоль</span>
            </div>
            <div className="menu-option disabled">
              <span>Показать график</span>
            </div>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div className="menu-item">
        <div 
          className={`menu-label ${openMenu === 'help' ? 'active' : ''}`}
          onClick={() => toggleMenu('help')}
        >
          Справка
        </div>
        {openMenu === 'help' && (
          <div className="menu-dropdown">
            <div className="menu-option disabled">
              <span>Документация</span>
            </div>
            <div className="menu-option disabled">
              <span>О программе</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}