import classNames from 'classnames';
import React, { HTMLAttributes, ReactNode } from 'react';
import { Argument } from 'classnames';

export interface NodeProps extends Omit<HTMLAttributes<'div'>, 'className'> {
  node: any;
  label: ReactNode;
  className?: Argument;
  // children: ReactNode;
}

export default function Node({
  node,
  label,
  className,
  children,
  ...others
}: NodeProps) {
  return (
    <div
      className={classNames('inline-flex p-2 border-2 cursor-pointer hover:bg-[rgba(0,0,0,.02)]', className)}
      // {...others}
    >
      {label}
    </div>
  );
}
