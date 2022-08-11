import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FaCode, FaPause, FaPlay } from 'react-icons/fa';
import mo from 'motoko/interpreter';
import copy from 'copy-to-clipboard';
import CodeEditor, { EDITOR_FONT_SIZE } from './CodeEditor';
import useCodeInfoState from '../hooks/useCodeInfoState';
import { getEmbedLink, parseEmbedLink } from '../services/embedLinkService';
import useChangedState from '../hooks/useChangedState';
import classNames from 'classnames';
import preprocessMotoko from '../utils/preprocessMotoko';
import Button from './Button';
import transpileKusanagi from '../utils/transpileKusanagi';

export default function Embed() {
  const [codeInfo, setCodeInfo] = useCodeInfoState();
  const [changed] = useChangedState();
  const [message, setMessage] = useState('');
  const [autoRun, setAutoRun] = useState(false);
  const [loading, setLoading] = useState(false);

  const { language, code: inputCode } = codeInfo;

  const { code, attributes, transpileError } = useMemo(() => {
    let code = inputCode || '';
    if (language === 'kusanagi') {
      try {
        code = transpileKusanagi(code);
      } catch (err) {
        return {
          code,
          attributes: [],
          transpileError: err.message || err,
        };
      }
    }
    return preprocessMotoko(code, language === 'motoko');
  }, [language, inputCode]);

  const output = useMemo(() => {
    if (transpileError) {
      return { stderr: transpileError };
    } else if (!autoRun) {
      return {};
    }
    try {
      setMessage('');
      const file = mo.file('Embed.mo');
      file.write(code);
      return file.run();
    } catch (err) {
      console.error(err);
      return { stderr: err.message || String(err) };
    }
  }, [transpileError, autoRun, code]);

  const packages = useMemo(() => {
    return attributes
      .filter((a) => a.key === 'package' && a.value?.includes(' '))
      .map((a) =>
        a.value
          .split(' ')
          .map((s) => s.trim())
          .filter((s) => s),
      )
      .filter((kv) => kv.length === 2);
  }, [attributes]);

  // Package string for memoization
  const packageData = JSON.stringify(packages);

  useMemo(() => {
    if (autoRun && packages.length) {
      setAutoRun(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageData]);

  const updatePackages = useCallback(() => {
    if (loading) {
      return;
    }

    console.log('Loading packages:', packages);
    setLoading(true);
    mo.clearPackages();
    mo.loadPackages(Object.fromEntries(packages))
      .then(() => {
        setAutoRun(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMessage(`Error: ${err.message || err}`);
      });
  }, [packages, loading]);

  const copyEmbedLink = useCallback(() => {
    try {
      const link = getEmbedLink({ language, code: inputCode });
      if (link.length >= 2000) {
        setMessage('Your code is too long to fit into a URL!');
      } else {
        copy(link);
        if (link !== window.location.href) {
          window.history.pushState?.({}, null, link);
        }
        const result = parseEmbedLink(link);
        setCodeInfo(result);
        setMessage(
          'Copied link to clipboard.\n\nPaste into a Medium post to embed this code snippet!',
        );
      }
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message || err}`);
    }
  }, [language, inputCode, setCodeInfo]);

  useEffect(() => {
    if (!autoRun) {
      if (!changed || packages.length === 0) {
        updatePackages();
      }
    }
  }, [changed, autoRun, packages.length, updatePackages]);

  const handleChange = useCallback(
    (code) => {
      setCodeInfo({ ...codeInfo, code });
      setLoading(false);
    },
    [codeInfo, setCodeInfo],
  );

  const outputHeight = 100;

  return (
    <div className="relative w-full h-full">
      <div
        className="h-full overflow-auto"
        style={{ height: `calc(100% - ${outputHeight}px)` }}
      >
       
      </div>
      <div className="flex-grow p-3 absolute right-0 bottom-[100px] sm:top-0 opacity-50 sm:opacity-100">
        <Button
          tooltip="Embed this code snippet"
          className={classNames(changed && 'emphasized')}
          onClick={copyEmbedLink}
        >
          <FaCode />
        </Button>
        <Button
          tooltip={autoRun ? 'Pause' : 'Load packages and evaluate'}
          className={classNames(
            'mt-2',
            (packages.length === 0 /* TODO: detect latency */ || !changed) &&
              'hidden',
          )}
          onClick={() => (autoRun ? setAutoRun(false) : updatePackages())}
        >
          {autoRun ? <FaPause /> : <FaPlay className="translate-x-[2px]" />}
        </Button>
      </div>
      <div
        className="output"
        style={{
          fontSize: EDITOR_FONT_SIZE,
          padding: '15px 15px',
          textAlign: 'left',
          maxWidth: '100vw',
          height: outputHeight,
          overflowY: 'auto',
        }}
      >
        {message ? (
          <pre style={{ color: 'white' }}>&gt; {message}</pre>
        ) : (
          <>
            {!!output?.stdout && (
              <pre
                style={{
                  color: '#29E249',
                }}
              >
                {output.stdout}
              </pre>
            )}
            {!!output?.stderr && (
              <pre
                style={{
                  color: '#F15A24',
                  opacity: 0.8,
                }}
              >
                {output.stderr}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}
