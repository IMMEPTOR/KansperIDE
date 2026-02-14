import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function CodeEditor({ value, onChange, onRun }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) {
    editorRef.current = editor;

    // Регистрация языка "Рус"
    monacoInstance.languages.register({ id: 'rus' });

    monacoInstance.languages.setMonarchTokensProvider('rus', {
      keywords: [
        'пусть',
        'функция',
        'фн',
        'если',
        'иначе',
        'пока',
        'вернуть',
        'истина',
        'ложь',
        'печать',
      ],

      tokenizer: {
        root: [
          [/[а-яА-ЯёЁ_][а-яА-ЯёЁ0-9_]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          }],
          [/[0-9]+(\.[0-9]+)?/, 'number'],
          [/".*?"/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/[{}()\[\]]/, '@brackets'],
          [/[;,]/, 'delimiter'],
          // Явный regex для всех операторов — это решает проблему
          [/[=+\-*/><!]=?|[=!<>]=|[+\-*/><!]/, 'operator'],
          [/\s+/, 'white'],
        ],
        comment: [
          [/\*\//, 'comment', '@pop'],
          [/./, 'comment'],
        ],
      },
    });

    // Тема
    monacoInstance.editor.defineTheme('rus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
      },
    });

    monacoInstance.editor.setTheme('rus-dark');

    // Горячие клавиши
    editor.addAction({
      id: 'run-code',
      label: 'Запустить код',
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter],
      run: () => {
        onRun();
      },
    });

    // Автодополнение — с правильными типами
    monacoInstance.languages.registerCompletionItemProvider('rus', {
      provideCompletionItems: (): monaco.languages.ProviderResult<monaco.languages.CompletionList> => {
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'пусть',
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: 'пусть ${1:имя} = ${2:значение};',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Объявление переменной',
          },
          {
            label: 'функция',
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: 'функция ${1:имя}(${2:параметры}) {\n\t$0\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Объявление функции',
          },
          {
            label: 'если',
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: 'если (${1:условие}) {\n\t$0\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Условный оператор',
          },
          {
            label: 'пока',
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: 'пока (${1:условие}) {\n\t$0\n}',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Цикл',
          },
          {
            label: 'печать',
            kind: monacoInstance.languages.CompletionItemKind.Function,
            insertText: 'печать(${1:значение});',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Вывод в консоль',
          },
        ];

        return {
          suggestions,
        };
      },
    });
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="rus"
      value={value}
      onChange={(value) => onChange(value || '')}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
      }}
    />
  );
}