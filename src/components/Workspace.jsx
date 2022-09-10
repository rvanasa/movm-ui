import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
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
import { TransitionGroup } from 'react-transition-group';
import CSSTransitionWrapper from './utils/CSSTransitionWrapper';

const defaultCode =
  `
let a = 1;
(prim "debugPrint") "Hello, VM!";
a + 1;
`.trim() + '\n';

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
  const [lastCode, setLastCode] = useState(defaultCode);
  // const [changed, setChanged] = useState(false);
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

  const selectedIndex = Math.max(0, Math.min(index_, history.length - 1));
  const index = hoverIndex ?? selectedIndex;

  const changed = code.trimEnd() !== lastCode.trimEnd();

  const monaco = useMonaco();
  const selectedState = history[index];

  const selectedInterruption =
    selectedState?.state_type === 'Interruption' ? selectedState.value : null;

  const selectedCore =
    selectedState?.state_type === 'Core' ? selectedState.value : null;

  let mostRecentCore = null;
  if (history.length) {
    for (let i = index; i >= 0; i--) {
      const state = history[i];
      if (state?.state_type === 'Core') {
        mostRecentCore = state.value;
        break;
      }
    }
  }

  useTimeout(
    running &&
      (() => {
        if (!forward()) {
          setRunning(false);
        }
      }),
    10,
  );

  useEffect(() => {
    if (!monaco) {
      return;
    }

    const spans = [];
    if (!changed) {
      let source = mostRecentCore?.cont_source;
      if (source) {
        // ExpStep
        if (source.source) {
          source = source.source;
        }
        const span = source?.span;
        if (span) {
          // console.log('Span:', span.start, span.end);

          spans.push(span);
        }
      }
    }

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      monaco.editor.setModelMarkers(
        model,
        'mo-vm',
        spans.map((span) => {
          const start = model.getPositionAt(span.start);
          const end = model.getPositionAt(span.end);

          // console.log('Span:', start, end);
          return {
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
            message: 'Most recent value',
            severity: 2, //monaco.MarkerSeverity.Info,
          };
        }),
      );
    }
  }, [changed, monaco, mostRecentCore]);

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

  const evaluate = useCallback(
    (run) => {
      try {
        const input = preprocessMotoko(code);
        // setHistory([]);
        setLastCode(code);
        // setChanged(false);
        // setInterruption(null);
        setError(null);
        rust.set_input(input.code);
        setRunning(run);
        notify();
      } catch (err) {
        setError(err);
        console.error(err);
      }
    },
    [code, notify],
  );

  useMemo(() => {
    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editorRef = useRef();
  const updateEditor = (editor) => {
    editor.__handleKeyDown = (event) => onKeyDown(event, true);
  };
  if (editorRef.current) {
    updateEditor(editorRef.current);
  }
  const onEditorMount = (newEditor) => {
    editorRef.current = newEditor;
    updateEditor(newEditor);
    newEditor.onKeyDown((e) => newEditor.__handleKeyDown?.(e.browserEvent));
  };

  const onEditorChange = (newCode) => {
    setCode(newCode);
    // if (lastCode.trim() !== newCode.trim()) {
    //   setChanged(true);
    // }
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
      if (modifier && e.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();
        evaluate(true);
      } else if (!inEditor) {
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
    [evaluate, backward, index, forward],
  );
  useListener(document, 'keydown', (e) => onKeyDown(e, false));

  const pendingClassNames = classNames(
    (changed || error) && 'opacity-75',
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
                error
                  ? 'bg-red-800'
                  : changed
                  ? 'bg-green-700'
                  : 'bg-[#242e5c]',
                changed &&
                  'hover:scale-105 active:scale-110 active:duration-100',
              )}
              style={{ textShadow: '0 0 10px rgba(255,255,255,.5)' }}
              onClick={() => evaluate(true)}
            >
              Mo
              <br />
              VM
            </div>
            {mostRecentCore?.debug_print_out && (
              <pre className="overflow-y-scroll text-[30px] ml-10">
                {
                  mostRecentCore?.debug_print_out[
                    mostRecentCore?.debug_print_out.length - 1
                  ]
                }
              </pre>
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
              <div className={pendingClassNames}>
                <div className="text-lg flex items-center">
                  <div className="w-[60px]">
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
                  <TransitionGroup className="w-full flex overflow-x-scroll items-center">
                    {history.map((state, i) => (
                      <CSSTransitionWrapper
                        key={i}
                        timeout={150}
                        classNames="state-animation"
                      >
                        <div
                          className={classNames(
                            history.length > 20 ? 'p-1' : 'p-2',
                            'cursor-pointer select-none hover:scale-[1.2]',
                          )}
                          onClick={() => setIndex(i)}
                          onMouseOver={() => setHoverIndex(i)}
                          onMouseOut={() =>
                            hoverIndex === i && setHoverIndex(null)
                          }
                        >
                          <div
                            className={classNames(
                              'inline-block w-[10px] aspect-square rounded-full',
                              // 'animate-[scale-in_.15s_ease-out]',
                              selectedState === state && 'scale-110',
                            )}
                            style={{
                              boxShadow: `0 0 10px ${
                                selectedIndex === i ? 4 : 2
                              }px ${
                                interruptionColors[
                                  state.value.interruption_type
                                ] ||
                                continuationColors[
                                  state.value.cont?.cont_type
                                ] ||
                                defaultStateColor
                              }`,
                              backgroundColor: 'white',
                            }}
                          />
                        </div>
                      </CSSTransitionWrapper>
                    ))}
                  </TransitionGroup>
                  <div className="flex">
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
              <div className={classNames('w-full text-lg', pendingClassNames)}>
                {!!mostRecentCore && (
                  <JsonView
                    src={mostRecentCore}
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
