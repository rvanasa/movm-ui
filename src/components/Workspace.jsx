import React, { useState, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import preprocessMotoko from '../utils/preprocessMotoko';
import rust from '../rust';
import { useMemo } from 'react';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import Button from './Button';
import ReactJson from 'react-json-view';

const defaultCode = `
let a = 1;
a + 1;
`.trim();

window.RUST = rust; ///
console.log(rust);

export default function Workspace() {
  const [code, setCode] = useState(defaultCode);
  const [history, setHistory] = useState([]);
  const [end, setEnd] = useState(null);
  const [index, setIndex] = useState(0);

  const selectedCore = history[Math.min(index, history.length - 1)];

  console.log(history, end); ///

  const notify = useCallback(() => {
    try {
      const history = JSON.parse(rust.history());
      setIndex(history.length - 1);
      setHistory(history);
    } catch (err) {
      try {
        console.error(err);
      } catch (err) {
        console.error('Unable to fetch history');
      }
    }
  }, []);

  useMemo(() => {
    try {
      const input = preprocessMotoko(code);
      const end = rust.set_input(input.code);
      setEnd(end && JSON.parse(end));
      notify();
    } catch (err) {
      try {
        console.error(err);
      } catch (err) {
        console.error('Unable to update input');
      }
    }
  }, [code, notify]);

  // window.history_callback = (s) => {
  //   const history = JSON.parse(s);

  // }; // temp
  // window.end_callback = (s) => setEnd(JSON.parse(end)); // temp

  const forward = () => {
    rust.forward();
    notify();
  };
  const backward = () => {
    rust.backward();
    notify();
  };

  const handleChangeCode = (newCode) => {
    setCode(newCode);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col pt-8 items-center gap-4">
        <div className="p-4 w-full max-w-[800px] flex flex-col justify-center items-center">
          <h1 className="bg-black text-white p-3 pt-2 pb-4 opacity-70 text-[50px] text-center lowercase font-extralight select-none leading-[36px] cursor-pointer rounded">
            mo
            <br />
            vm
          </h1>
          <hr className="w-full mt-5 mb-3" />
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
            <div className="flex gap-2 items-center">
              <div className="text-lg opacity-70 overflow-x-auto flex-1">
                {/* {!!(end && index === history.length - 1) && (
                  <pre className='mr-3'>
                    <span className="text-red-800">[{index}]</span>{' '}
                    {JSON.stringify(end)}
                  </pre>
                )} */}
                {!!selectedCore?.cont && (
                  <pre className={'text-green-800'}>
                    <span className="text-blue-800">[{index}]</span>{' '}
                    {JSON.stringify(selectedCore.cont)}
                  </pre>
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
          <div className="w-full flex">
            {/* <div className='flex flex-col-reverse gap-4'>
              {history.map((core, i) => (
                <div key={i}>
                  <Button className="w-14" onClick={() => setIndex(i)}>
                    {i + 1}
                  </Button>
                </div>
              ))}
            </div> */}
            <div className="w-full text-lg">
              {!!selectedCore && (
                <ReactJson
                  src={selectedCore}
                  style={{ padding: '1rem' }}
                ></ReactJson>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
