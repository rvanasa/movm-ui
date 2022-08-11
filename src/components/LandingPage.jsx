import React, { useState } from 'react';
import classNames from 'classnames';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist as syntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FaCode } from 'react-icons/fa';
import { SiMedium, SiWordpress } from 'react-icons/si';
import motokoFlatImage from '../assets/motoko-flat.png?width=144&height=144&webp';
import motokoColorImage from '../assets/motoko-color.png?width=144&height=144&webp';
import dfinityImage from '../assets/icp.png?webp';
import CodeEditor from './CodeEditor';

export default function LandingPage() {
  const [code, setCode] = useState('');

  const handleChangeCode = (newCode) => {
    setCode(newCode);
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="p-4 w-full max-w-[640px] flex flex-col justify-center items-center">
          <a
            className="block mt-1"
            href="https://github.com/dfinity/embed-motoko"
            target="_blank"
            title="GitHub repository"
            rel="noreferrer"
          >
            <h1 className="main-title md:px-5 text-5xl sm:text-7xl text-center lowercase font-light select-none tracking-wide">
              Motoko VM
            </h1>
          </a>
          <hr className="w-full mb-3" />
          <div className="w-full py-4">
            <div
              className="h-[500px] mx-auto rounded overflow-hidden"
              style={{
                boxShadow: '0 0 20px #CCC',
              }}
            >
              <CodeEditor value={code} onChange={handleChangeCode} />
            </div>
          </div>
          <div className="mt-4 sm:px-4 w-full">

          </div>
        </div>
      </div>
    </>
  );
}
