import React from 'react';
import classNames from 'classnames';
import useReactTooltip from '../hooks/useReactTooltip';

export default function Button({
  tooltip,
  className,
  children,
  disabled,
  ...others
}) {
  useReactTooltip();

  return (
    <div
      className={classNames(
        'inline-flex justify-center items-center p-1 border-[2px] border-[#555] hover:scale-105 text-2xl rounded cursor-pointer select-none w-10',
        className,
        disabled && 'opacity-75 cursor-default',
      )}
      data-tip={tooltip || undefined}
      data-place="left"
      {...others}
    >
      {children}
    </div>
  );
}
