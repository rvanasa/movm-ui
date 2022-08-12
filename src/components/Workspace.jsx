import React, { useState } from 'react';
import classNames from 'classnames';
import CodeEditor from './CodeEditor';
import preprocessMotoko from '../utils/preprocessMotoko';
import rust from '../rust'
import { useMemo } from 'react';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa'
import Button from './Button';
import { backward, forward } from '../../rust/pkg/rust';
import ReactJson from 'react-json-view'

const defaultCode = `
let a = 1;
a + 1;
`.trim();

window.RUST = rust;///
console.log(rust)


export default function Workspace() {
  const [code, setCode] = useState(defaultCode);
  const [history, setHistory] = useState([]);
  const [end, setEnd] = useState(null);
  const [index, setIndex] = useState(0)

  const selectedCore = history[Math.min(index, history.length - 1)]

  useMemo(() => {
    setEnd(null)

    try {
      const input = preprocessMotoko(code)
      rust.set_input(input)
    } catch (err) {
      try {
        console.error(err)
      } catch (err) {
        console.error('Unable to update input')
      }
    }
  }, [code])

  window.history_callback = s => { const history = JSON.parse(s); setHistory(history); setIndex(history.length - 1) } // temp
  window.end_callback = s => setEnd(JSON.parse(end)) // temp

  const notify = () => {
    try {
      rust.history()
    } catch (err) {
      try {
        console.error(err)
      } catch (err) {
        console.error('Unable to fetch history')
      }
    }
  }

  const forward = () => {
    rust.forward();
    notify();
  }
  const backward = () => {
    rust.backward();
    notify();
  }

  useMemo(() => {
    notify()
  }, [code])

  console.log(history, end)

  const handleChangeCode = (newCode) => {
    setCode(newCode);
  }

  return (
    <>
      <div className="min-h-screen flex flex-col pt-8 items-center gap-4">
        <div className="p-4 w-full max-w-[640px] flex flex-col justify-center items-center">
          <h1 className="opacity-50 md:px-5 text-5xl text-center lowercase font-light select-none tracking-wide">
            mo vm
          </h1>
          <hr className="w-full mb-3" />
          <div className="w-full py-4">
            <div
              className="mx-auto rounded overflow-hidden"
              style={{
                boxShadow: '0 0 20px #CCC',
              }}
            >
              <CodeEditor value={code} onChange={handleChangeCode} />
            </div>
          </div>
          <div className="w-full">

            <div className='flex gap-2 items-center'>
              <Button onClick={() => backward()}>
                <FaCaretLeft />
              </Button>
              <Button onClick={() => forward()}>
                <FaCaretRight />
              </Button>
              <div className='text-lg opacity-70 overflow-x-auto'>
                {(!!end || !!selectedCore?.cont) && (
                  <pre className={end ? 'text-orange' : 'text-black'}>
                    {JSON.stringify(end || selectedCore.cont)}
                  </pre>
                )}
              </div>
            </div>

          </div>
          <div className='w-full flex'>
            {/* <div className='flex flex-col-reverse gap-4'>
              {history.map((core, i) => (
                <div key={i}>
                  <Button className="w-14" onClick={() => setIndex(i)}>
                    {i + 1}
                  </Button>
                </div>
              ))}
            </div> */}
            <div className='w-full text-lg'>
              {!!selectedCore && (
                <ReactJson src={selectedCore} style={{ padding: '1rem' }}></ReactJson>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
