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
import useListener from '../hooks/utils/useListener';
import colors from 'tailwindcss/colors';
import useTimeout from '../hooks/utils/useTimeout';

const defaultCode = `
let a = 1;
(prim "debugPrint") "Hello";
a + 1;
`.trim();

window.RUST = rust; ///
// console.log(rust);

const continuationColors = {
  Decs: '#DAB6C4',
  Exp_: '#B4DC7F',
  Value: '#5DB7DE',
  LetVarRet: '#7B886F',
};
const interruptionColors = {
  Done: colors.green[500],
};
const defaultStateColor = '#FFA0AC';

export default function Workspace() {
  const [code, setCode] = useState(defaultCode);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState(null);
  // const history = rust.history();
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [index_, setIndex_] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);

  const setIndex = (index) => {
    setHoverIndex(null);
    setIndex_(index);
  };

  const clampedIndex = Math.max(0, Math.min(index_, history.length - 1));
  const index = hoverIndex ?? clampedIndex;

  const monaco = useMonaco();
  const selectedState = history[index];

  const selectedCore =
    selectedState?.state_type === 'Core' ? selectedState.value : null;

  const selectedInterruption =
    selectedState?.state_type === 'Interruption' ? selectedState.value : null;

  useTimeout(
    !!running &&
      (() => {
        if (!forward()) {
          setRunning(false);
        }
      }),
    10,
  );

  const span = history[index]?.value.cont_source?.span;
  if (span) {
    // console.log('Span:', span.start, span.end);

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
      setHistory(history);
      // setIndex(history.length - 1);
      setError(null);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  }, []);

  const evaluate = useCallback(() => {
    try {
      const input = preprocessMotoko(code);
      // setHistory([]);
      setChanged(false);
      // setInterruption(null);
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
    editorRef.current.__handleKeyDown = (event) => onKeyDown(event, true);
  }
  const onEditorMount = (newEditor) => {
    editorRef.current = newEditor;
    newEditor.onKeyDown((e) => newEditor.__handleKeyDown?.(e.browserEvent));
  };

  const onEditorChange = (newCode) => {
    setCode(newCode);
    setChanged(true);
  };

  const forward = useCallback(() => {
    if (changed) {
      evaluate();
      return true;
    } else {
      const result = rust.forward();
      setIndex(history.length - 1 + (result ? 1 : 0));
      notify();
      return result;
    }
  }, [changed, evaluate, history.length, notify]);

  const backward = useCallback(() => {
    if (changed) {
      evaluate();
      return true;
    } else {
      const result = rust.backward();
      setIndex(history.length - 1 - (result ? 1 : 0));
      notify();
      return result;
    }
  }, [changed, evaluate, history.length, notify]);

  const onKeyDown = useCallback(
    (e, inEditor) => {
      const modifier = e.ctrlKey || e.metaKey;
      if (inEditor) {
        if (modifier && e.key === 'Enter') {
          e.stopPropagation();
          e.preventDefault();
          setRunning(true);
        }
      } else {
        if (e.key === 'ArrowLeft') {
          if (modifier) {
            backward();
          } else {
            setIndex(index - 1);
          }
        }
        if (e.key === 'ArrowRight') {
          if (modifier) {
            forward();
          } else {
            setIndex(index + 1);
          }
        }
      }
    },
    [forward, backward, index],
  );
  useListener(document, 'keydown', (e) => onKeyDown(e, false));

  const changedClassNames = classNames(
    changed && 'opacity-75',
    'transition-opacity duration-[.2s]',
  );

  return (
    <>
      <h1 className="hidden">Motoko VM</h1>
      <div className="min-h-screen flex flex-col items-center gap-4">
        <div className="p-5 w-full flex flex-col">
          <div className="flex items-center">
            <div
              className={classNames(
                'inline-block text-white p-3 pt-2 pb-4 text-[50px] text-center lowercase font-extralight select-none leading-[36px] cursor-pointer rounded',
                'transition-all duration-200',
                error ? 'bg-red-800' : changed ? 'bg-green-700' : 'bg-[#444]',
                changed &&
                  'hover:scale-105 active:scale-110 active:duration-100',
              )}
              style={{ textShadow: '0 0 10px rgba(255,255,255,.5)' }}
              onClick={() => evaluate()}
            >
              Mo
              <br />
              VM
            </div>
            {selectedCore?.debug_print_out && (
              <div className="overflow-y-scroll text-[36px] ml-5">
                {
                  selectedCore?.debug_print_out[
                    selectedCore?.debug_print_out.length - 1
                  ]
                }
              </div>
            )}
          </div>
          <hr className="w-full mt-5 mb-3" />
          <div className="w-full md:grid grid-cols-2 gap-4">
            <div>
              <div className="w-full py-4">
                <div
                  className="mx-auto h-[300px] rounded overflow-hidden"
                  style={{
                    boxShadow: '0 0 20px #222',
                  }}
                >
                  <CodeEditor
                    value={code}
                    onChange={onEditorChange}
                    onMount={onEditorMount}
                  />
                </div>
              </div>
              <div className={changedClassNames}>
                <div className="text-lg flex items-center">
                  <div className="w-[50px]">
                    {!!selectedState && (
                      <pre
                        className={classNames(
                          selectedInterruption
                            ? 'text-orange-300'
                            : 'text-blue-400',
                        )}
                      >
                        [{index}]
                      </pre>
                    )}
                  </div>
                  <div className="flex-grow flex overflow-x-auto items-center">
                    {history.map((state, i) => (
                      <div
                        key={i}
                        className="p-1 cursor-pointer select-none hover:scale-[1.2]"
                        onClick={() => setIndex(i)}
                        onMouseOver={() => setHoverIndex(i)}
                        onMouseOut={() =>
                          hoverIndex === i && setHoverIndex(null)
                        }
                      >
                        <div
                          className={classNames(
                            'inline-block w-4 aspect-square rounded-sm',
                            selectedState === state && 'scale-110',
                          )}
                          style={{
                            boxShadow: `0 0 5px ${
                              clampedIndex === i ? 1 : 0
                            }px #FFF`,
                            backgroundColor:
                              interruptionColors[
                                state.value.interruption_type
                              ] ||
                              continuationColors[state.value.cont?.cont_type] ||
                              defaultStateColor,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button onClick={() => backward()}>
                      <FaCaretLeft className="mr-[2px]" />
                    </Button>
                    <Button onClick={() => forward()}>
                      <FaCaretRight className="ml-[2px]" />
                    </Button>
                  </div>
                </div>
                <div className="text-lg">
                  {selectedInterruption ? (
                    <div className={'text-orange-300'}>
                      <Interruption node={selectedInterruption} />
                    </div>
                  ) : (
                    !!selectedCore?.cont && (
                      <div className={'text-green-400'}>
                        <Cont node={selectedCore.cont} />
                      </div>
                    )
                  )}
                </div>
              </div>
              {/* <hr className="w-full m-4" /> */}
            </div>
            <div className="w-full flex">
              <div className={classNames('w-full text-lg', changedClassNames)}>
                {!!selectedState && (
                  <JsonView
                    src={selectedState}
                    // name="core"
                    name={null}
                    style={{ padding: '1rem' }}
                    collapsed={2}
                    displayDataTypes={false}
                    theme="shapeshifter"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
