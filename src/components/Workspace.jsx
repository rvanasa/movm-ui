import React, { useState, useCallback, useMemo, useRef } from 'react';
import CodeEditor from './CodeEditor';
import preprocessMotoko from '../utils/preprocessMotoko';
import rust from '../rust';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import Button from './Button';
import JsonView from 'react-json-view';
import { useMonaco } from '@monaco-editor/react';
import classNames from 'classnames';
import Cont from './nodes/Cont';
import Interruption from './nodes/Interruption';

const defaultCode = `
let a = 1;
a + 1;
`.trim();

window.RUST = rust; ///
// console.log(rust);

export default function Workspace() {
  const [code, setCode] = useState(defaultCode);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [interruption, setInterruption] = useState(null);
  const [index, setIndex] = useState(0);

  const monaco = useMonaco();
  const selectedCore = history[Math.min(index, history.length - 1)];

  const span = history[history.length - 1]?.cont_source?.span;
  if (span) {
    console.log('Span:', span.start, span.end);

    for (const model of monaco.editor.getModels()) {
      const start = model.getPositionAt(span.start);
      const end = model.getPositionAt(span.end);

      monaco.editor.setModelMarkers(model, 'mo-vm', [
        {
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
          message: 'Most recent value',
          severity: monaco.MarkerSeverity.Info,
        },
      ]);
    }
  }

  const notify = useCallback(() => {
    try {
      const history = rust.history();
      setIndex(history.length - 1);
      setHistory(history);
      setError(null);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  }, []);

  const evaluate = useCallback(() => {
    try {
      const input = preprocessMotoko(code);
      setHistory([]);
      setChanged(false);
      setInterruption(null);
      setError(null);
      rust.set_input(input.code);
      notify();
    } catch (err) {
      setError(err);
      console.error(err);
    }
  }, [code, notify]);

  useMemo(() => {
    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editorRef = useRef();
  if (editorRef.current) {
    editorRef.current.__evaluate = () => forward();
  }
  const onEditorMount = (newEditor) => {
    editorRef.current = newEditor;
    newEditor.onKeyDown((e) => {
      // Run code on Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.browserEvent.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();
        newEditor.__evaluate?.();
      }
    });
  };

  const onEditorChange = (newCode) => {
    setCode(newCode);
    setChanged(true);
  };

  const forward = () => {
    if (changed) {
      evaluate();
    } else {
      setInterruption(rust.forward());
      notify();
    }
  };

  const backward = () => {
    if (changed) {
      evaluate();
    } else {
      setInterruption(interruption ? null : rust.backward());
      notify();
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col pt-8 items-center gap-4">
        <div className="p-4 w-full flex flex-col justify-center items-center">
          <h1
            className={classNames(
              'text-white p-3 pt-2 pb-4 opacity-70 text-[50px] text-center lowercase font-extralight select-none leading-[36px] cursor-pointer rounded',
              'transition-all duration-200',
              error ? 'bg-red-800' : changed ? 'bg-green-700' : 'bg-black',
              changed && 'hover:scale-105 active:scale-110 active:duration-100',
            )}
            onClick={() => evaluate()}
          >
            mo
            <br />
            vm
          </h1>
          <hr className="w-full mt-5 mb-3" />
          <div className="block md:flex w-full">
            <div className="w-[800px]">
              <div className="w-full py-4">
                <div
                  className="mx-auto h-[300px] rounded overflow-hidden"
                  style={{
                    boxShadow: '0 0 20px #CCC',
                  }}
                >
                  <CodeEditor
                    value={code}
                    onChange={onEditorChange}
                    onMount={onEditorMount}
                  />
                </div>
              </div>
              <div className="w-full">
                <div className="flex gap-2 items-start">
                  <div className="text-lg opacity-70 overflow-x-auto flex-1">
                    {interruption ? (
                      <pre className={'text-orange-600'}>
                        <span className="text-blue-800">[{index + 1}]</span>{' '}
                        <Interruption node={interruption} />
                      </pre>
                    ) : (
                      !!selectedCore?.cont && (
                        <pre className={'text-green-800'}>
                          <span className="text-blue-800">[{index}]</span>{' '}
                          <Cont node={selectedCore.cont} />
                        </pre>
                      )
                    )}
                  </div>
                  <Button onClick={() => backward()}>
                    <FaCaretLeft className="mr-[2px]" />
                  </Button>
                  <Button onClick={() => forward()}>
                    <FaCaretRight className="ml-[2px]" />
                  </Button>
                </div>
              </div>
              <hr className="w-full m-4" />
            </div>
            <div className="w-full flex">
              <div className="w-full text-lg">
                {!!selectedCore && (
                  <JsonView
                    src={selectedCore}
                    // name="core"
                    name={null}
                    style={{ padding: '1rem' }}
                    collapsed={2}
                  ></JsonView>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
