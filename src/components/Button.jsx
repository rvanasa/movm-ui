import React from 'react';
import classNames from 'classnames';
import useReactTooltip from '../hooks/useReactTooltip';

export default function Button({ tooltip, className, children, ...others }) {
  useReactTooltip();

  return (
    <div
      className={classNames(
        'inline-flex justify-center items-center p-1 border-[3px] border-[#333] hover:scale-105 text-2xl rounded cursor-pointer select-none',
        className,
      )}
      data-tip={tooltip || undefined}
      data-place="left"
      {...others}
    >
      {children}
    </div>
  );
}
