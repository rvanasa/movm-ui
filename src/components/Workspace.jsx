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
import {
  FaAngleLeft as StepLeft,
  FaAngleRight as StepRight,
  // FaAngleDoubleLeft as JumpLeft,
  // FaAngleDoubleRight as JumpRight,
  FaPause,
  FaPlay,
} from 'react-icons/fa';
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
import ResponsiveSplitPane from './utils/ResponsiveSplitPane';
import jsonTheme from '../config/jsonTheme';
import { useSessionStorage } from 'usehooks-ts';

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
const frameColors = {
  // TODO
};
const interruptionColors = {
  Done: colors.green[500],
};
const defaultStateColor = '#FFA0AC';
const defaultFrameColor = '#AAA';

const getCoreSpan = (core) => {
  if (!core) {
    return;
  }
  let source = core.cont_source;
  if (!source) {
    return;
  }
  // ExpStep
  if (source.source) {
    source = source.source;
  }
  return source.span;
};

const getFrameSpan = (frame) => {
  if (!frame) {
    return;
  }
  let source = frame.source;
  if (!source) {
    return;
  }
  // ExpStep
  if (source.source) {
    source = source.source;
  }
  return source.span;
};

const getStateSpan = (state) => {
  if (!state) {
    return;
  }
  if (state.state_type === 'Core') {
    return getCoreSpan(state.value);
  }
};

const getSyntaxErrorDetails = (err) => {
  if (!err?.syntax_error_type) {
    return { message: '(Unexpected error)', code: String(err) };
  }
  switch (err.syntax_error_type) {
    case 'InvalidToken':
      return { message: 'Unexpected token' };
    case 'UnrecognizedEOF':
      return {
        message: 'Unexpected end of file',
        code: `expected: ${err.expected.join(', ')}`,
      };
    case 'UnrecognizedToken':
      return {
        message: `Unexpected token '${err.token}'`,
        code: `expected: ${err.expected.join(', ')}`,
      };
    case 'ExtraToken':
      return {
        message: `Extra token: '${err.token}'`,
      };
    // case 'Custom':
    default:
      return { message: err.message || err.syntax_error_type };
  }
};

export default function Workspace() {
  const [code, setCode] = useState(defaultCode);
  const [lastCode, setLastCode] = useState(defaultCode);
  const [error, setError] = useState(null);
  // const history = rust.history();
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [index_, setIndex_] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [frameHoverIndex, setFrameHoverIndex] = useState(null);
  const [frameIndex, setFrameIndex] = useState(null);
  // const [detailed, setDetailed] = useState(false);
  const [detailed, setDetailed] = useSessionStorage('mo-vm.detailed', false);

  const setIndex = (index) => {
    setIndex_(index);
    setHoverIndex(null);
    setFrameHoverIndex(null);
    setFrameIndex(null);
  };

  const selectedIndex = Math.max(0, Math.min(index_, history.length - 1));
  const index = hoverIndex ?? selectedIndex;

  const changed = code.trimEnd() !== lastCode.trimEnd();

  const completed =
    changed || !!(history[history.length - 1]?.state_type === 'Interruption');

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

  const selectedFrame = selectedCore?.stack[frameHoverIndex ?? frameIndex];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => setFrameIndex(null), [selectedState]);

  useTimeout(
    running &&
      !error &&
      (() => {
        if (changed) {
          return;
        }
        const result = forward();
        if (!result) {
          setRunning(false);
        } else if (typeof running === 'object') {
          const { lineNumber, column } = running;

          const history = rust.history();
          const span = getStateSpan(history[history.length - 1]);
          if (span) {
            const [start, end] = getStartEndFromSpan(span);
            if (
              start.lineNumber === lineNumber &&
              end.lineNumber === lineNumber &&
              start.column <= column &&
              end.column >= column
            ) {
              setRunning(false);
            }
          }
        }
      }),
    10,
  );

  const getStartEndFromSpan = useCallback((span) => {
    if (!span || !editorRef.current) {
      return;
    }
    const start = editorRef.current.getModel().getPositionAt(span.start);
    const end = editorRef.current.getModel().getPositionAt(span.end);
    return [start, end];
  }, []);

  useEffect(() => {
    if (monaco && editorRef.current) {
      const model = editorRef.current.getModel();

      const spans = [];
      if (error) {
        const start = model.getPositionAt(error.start ?? error.location ?? 0);
        const end = model.getPositionAt(error.end ?? error.location ?? 0);

        spans.push({
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
          message: error.message || error.syntax_error_type,
          // source: error.token,
          severity: 8, //monaco.MarkerSeverity.Error,
          ...getSyntaxErrorDetails(error),
        });
      }
      if (!changed) {
        const span =
          getFrameSpan(selectedFrame) ||
          getCoreSpan(
            selectedInterruption?.interruption_type === 'Done'
              ? null // No underline on successful completion
              : mostRecentCore,
          );
        if (span) {
          const start = model.getPositionAt(span.start);
          const end = model.getPositionAt(span.end);
          // console.log('Span:', start, end);

          spans.push({
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
            message: 'Source location',
            source: `[${index}]`,
            severity: 2, //monaco.MarkerSeverity.Info,
          });
        }
      }
      monaco.editor.setModelMarkers(model, 'mo-vm', spans);
    }
  }, [
    changed,
    error,
    index,
    monaco,
    mostRecentCore,
    selectedFrame,
    selectedInterruption?.interruption_type,
  ]);

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
        const error = rust.set_input(input.code);
        setError(error);
        if (!error) {
          setRunning(run);
          notify();
        }
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
    editor.__handleKeyDown = (e) => onKeyDown(e.browserEvent, true);
    editor.__handleMouseDown = (e) => onEditorMouseDown(e);
  };
  if (editorRef.current) {
    updateEditor(editorRef.current);
  }
  const onEditorMount = (newEditor) => {
    editorRef.current = newEditor;
    updateEditor(newEditor);
    newEditor.onKeyDown((e) => newEditor.__handleKeyDown(e));
    newEditor.onMouseDown((e) => newEditor.__handleMouseDown(e));
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
      const result = rust.forward(detailed);
      setIndex(history.length - 1 + (result ? 1 : 0));
      notify();
      return result;
    }
  }, [changed, detailed, evaluate, history.length, notify]);

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
      if (e.key === 'Escape') {
        setRunning(false);
      } else if (modifier && e.shiftKey && e.key === 'f') {
        e.stopPropagation();
        e.preventDefault();
        editorRef.current?.getAction('editor.action.formatDocument').run();
      } else if (modifier && e.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();

        if (running) {
          setRunning(false);
        } else {
          const breakpoint = inEditor ? editorRef.current.getPosition() : true;
          if (completed) {
            evaluate(breakpoint);
          } else {
            setRunning(breakpoint);
          }
        }
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
    [running, completed, evaluate, backward, index, forward],
  );
  useListener(document, 'keydown', (e) => onKeyDown(e, false));

  const onEditorMouseDown = useCallback(
    ({ event: e, target }) => {
      const modifier = e.ctrlKey || e.metaKey;

      if (!changed && history.length && target.position) {
        const { lineNumber, column } = target.position;

        // const selectedSpan = getSpan(selectedState);
        // const selectedWidth = selectedSpan
        //   ? selectedSpan.end - selectedSpan.start
        //   : 0;

        if (modifier) {
          const breakpoint = { lineNumber, column };
          if (!completed) {
            setRunning(breakpoint);
          } else if (changed) {
            evaluate(breakpoint);
          }
        }

        let bestWidth = Infinity;
        // let bestIndex = 0;
        // let bestIndex = index;
        let bestIndex = history.length - 1;

        for (let i = 0; i < history.length; i++) {
          // const checkIndex =
          //   (index + (i + 1) * (modifier ? -1 : 1) + history.length) %
          //   history.length;
          const checkIndex = modifier ? (index + i + 1) % history.length : i;
          const state = history[checkIndex];
          const span = getStateSpan(state);
          if (span) {
            const width = span.end - span.start;
            const [start, end] = getStartEndFromSpan(span);
            if (
              start.lineNumber === lineNumber &&
              end.lineNumber === lineNumber &&
              start.column <= column &&
              end.column >= column &&
              (modifier || width < bestWidth)
              //   (modifier ? width >= selectedWidth : width <= selectedWidth)
            ) {
              bestWidth = width;
              bestIndex = checkIndex;
              if (modifier) {
                break;
              }
            }
          }
        }

        setIndex(bestIndex);
      }
    },
    [changed, completed, evaluate, getStartEndFromSpan, history, index],
  );

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
                'flex items-center justify-center text-white text-center lowercase font-light w-[75px] aspect-square select-none cursor-pointer rounded',
                // 'transition-all duration-200',
                error
                  ? 'bg-red-800'
                  : changed
                  ? 'bg-green-700'
                  : 'bg-[#242e5c]',
                changed &&
                  'hover:scale-105 active:scale-110 active:duration-100',
              )}
              style={{ textShadow: '0 0 10px rgba(255,255,255,.5)' }}
              onClick={() => (running ? setRunning(false) : evaluate(true))}
            >
              <div className="leading-[24px] mt-[-8px] text-[36px] flex flex-col">
                <span>Mo</span>
                <span>VM</span>
              </div>
            </div>
            <div className="flex-grow overflow-auto">
              {error && !changed ? (
                <pre className="text-[20px] text-red-300 opacity-80 ml-10">
                  {getSyntaxErrorDetails(error).message}
                </pre>
              ) : (
                mostRecentCore?.debug_print_out && (
                  <pre className="text-[30px] ml-10">
                    {
                      mostRecentCore?.debug_print_out[
                        mostRecentCore?.debug_print_out.length - 1
                      ]
                    }
                  </pre>
                )
              )}
            </div>
            <div className="pl-3 flex items-center select-none whitespace-nowrap">
              <input
                id="toggle-detailed"
                type="checkbox"
                className="mr-2"
                checked={detailed}
                onChange={() => setDetailed(!detailed)}
              />
              <label htmlFor="toggle-detailed" className="opacity-90">
                Detail Mode
              </label>
            </div>
          </div>
          <hr className="w-full mt-5 mb-3" />
          <ResponsiveSplitPane
            split="vertical"
            primary="first"
            defaultSize="60%"
          >
            <ResponsiveSplitPane
              split="horizontal"
              primary="first"
              defaultSize="350px"
            >
              <div
                className="w-full h-full"
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
              <div className={pendingClassNames}>
                <div className="text-lg flex items-center select-none">
                  <div className="w-[60px] ml-2">
                    {!!selectedState && (
                      <pre
                        className={classNames(
                          selectedInterruption
                            ? selectedInterruption.interruption_type === 'Done'
                              ? 'text-green-400'
                              : 'text-orange-300'
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
                            'cursor-pointer hover:scale-[1.2]',
                          )}
                          onClick={() => setIndex(i)}
                          onMouseOver={() => setHoverIndex(i)}
                          onMouseOut={() =>
                            hoverIndex === i && setHoverIndex(null)
                          }
                        >
                          <div
                            className={classNames(
                              'bg-white inline-block min-w-[10px] aspect-square rounded-full',
                              'transition-transform duration-[.1s]',
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
                            }}
                          />
                        </div>
                      </CSSTransitionWrapper>
                    ))}
                  </TransitionGroup>
                  <div className="flex">
                    {/* <div className="px-3 flex items-center select-none whitespace-nowrap">
                      <input
                        id="toggle-detailed"
                        type="checkbox"
                        className="mr-2"
                        value={detailed}
                        onChange={() => setDetailed(!detailed)}
                      />
                      <label htmlFor="toggle-detailed" className="opacity-90">
                        Detailed
                      </label>
                    </div> */}
                    {/* <Button onClick={() => setIndex(0)}>
                      <JumpLeft className="mr-[2px]" />
                    </Button> */}
                    <Button onClick={() => backward()}>
                      <StepLeft className="mr-[2px]" />
                    </Button>
                    {running && !error ? (
                      <Button onClick={() => setRunning(false)}>
                        <FaPause className="mx-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (completed) {
                            evaluate();
                          }
                          setRunning(true);
                        }}
                      >
                        <FaPlay className="mx-2" />
                      </Button>
                    )}
                    <Button onClick={() => forward()}>
                      <StepRight className="ml-[2px]" />
                    </Button>
                    {/* <Button onClick={() => setIndex(history.length - 1)}>
                      <JumpRight className="ml-[2px]" />
                    </Button> */}
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
            </ResponsiveSplitPane>
            <div className="flex select-none">
              <TransitionGroup className="w-[150px] flex flex-col overflow-x-auto">
                {!!selectedCore &&
                  selectedCore.stack.map((frame, i) => (
                    <CSSTransitionWrapper
                      key={i}
                      timeout={150}
                      classNames="frame-animation"
                    >
                      <div
                        className={classNames(
                          // history.length > 20 ? 'p-1' : 'p-2',
                          'pl-4 p-1 flex items-center gap-2',
                          'cursor-pointer hover:scale-[1.1] origin-left',
                          // frameIndex === i && 'scale-[1.15] hover:scale[1.18]',
                        )}
                        onClick={() =>
                          setFrameIndex(frameIndex === i ? null : i)
                        }
                        onMouseOver={() => setFrameHoverIndex(i)}
                        onMouseOut={() =>
                          frameHoverIndex === i && setFrameHoverIndex(null)
                        }
                      >
                        <div
                          className={classNames(
                            'bg-white inline-block min-w-[10px] aspect-square rounded-full',
                            // 'transition-transform duration-0',
                            frameHoverIndex === i && 'scale-110',
                          )}
                          style={{
                            boxShadow: `0 0 10px ${
                              selectedIndex === i ? 4 : 2
                            }px ${
                              frameColors[frame.cont.frame_cont_type] ||
                              defaultFrameColor
                            }`,
                          }}
                        />
                        <pre
                          className="text-sm"
                          style={{
                            color:
                              frameIndex === i
                                ? 'white'
                                : frameColors[frame.cont.frame_cont_type] ||
                                  defaultFrameColor,
                          }}
                        >
                          {frame.cont.frame_cont_type}
                        </pre>
                      </div>
                    </CSSTransitionWrapper>
                  ))}
              </TransitionGroup>
              <div className={classNames('w-full text-lg', pendingClassNames)}>
                {!!mostRecentCore && (
                  <JsonView
                    src={selectedFrame ?? mostRecentCore}
                    name={null}
                    style={{ padding: '1rem' }}
                    collapsed={2}
                    displayDataTypes={false}
                    theme={jsonTheme}
                  />
                )}
              </div>
            </div>
          </ResponsiveSplitPane>
        </div>
      </div>
    </>
  );
}
