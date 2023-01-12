import MonacoEditor from '@monaco-editor/react';
import React from 'react';
import { configureMonaco } from '../config/configureMonaco';
import isMobile from '../utils/isMobile';

export const EDITOR_FONT_SIZE = isMobile() ? 14 : 18;

export default function CodeEditor({
  innerRef,
  onMount,
  value,
  onChange,
  readOnly,
  options,
  ...others
}) {
  return (
    <MonacoEditor
      theme="motoko-theme"
      defaultLanguage="motoko"
      beforeMount={configureMonaco}
      onMount={onMount}
      value={value}
      onChange={onChange}
      options={{
        tabSize: 2,
        // minimap: { enabled: false },
        wordWrap: 'off',
        // wrappingIndent: 'indent',
        scrollBeyondLastLine: false,
        fontSize: EDITOR_FONT_SIZE,
        readOnly: readOnly || isMobile(),
        // scrollbar: {
        //   alwaysConsumeMouseWheel: false,
        // },
        quickSuggestions: false,
        ...options,
      }}
      {...others}
    />
  );
}
