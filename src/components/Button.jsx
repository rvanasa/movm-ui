import React from 'react';
import classNames from 'classnames';
import useReactTooltip from '../hooks/useReactTooltip';

export default function Button({ tooltip, className, children, ...others }) {
  useReactTooltip();

  return (
    <div
      className={classNames(
        'inline-flex justify-center items-center p-3 bg-[#000a] hover:bg-[#000c] text-white text-xl rounded cursor-pointer select-none',
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
