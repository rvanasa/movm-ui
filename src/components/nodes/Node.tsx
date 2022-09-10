import classNames from 'classnames';
import React, { HTMLAttributes, ReactNode, useState } from 'react';
import { Argument } from 'classnames';

export interface NodeProps extends Omit<HTMLAttributes<'div'>, 'className'> {
  node: any;
  label: ReactNode;
  color: string;
  className?: Argument;
  // children: ReactNode;
}

export default function Node({
  node,
  label,
  color,
  className,
  children,
  style,
  ...others
}: NodeProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div
        className={classNames(
          'inline-flex p-2 border-2 rounded-sm  cursor-pointer select-none',
          // 'border-transparent hover:border-[rgba(255,255,255,.4)]',
          'border-none',
          'hover:bg-[rgba(255,255,255,.2)]',
          className,
        )}
        style={{ color, ...style }}
        onClick={() => setCollapsed(!collapsed)}
        // {...others}
      >
        {label}
      </div>
      {!collapsed && (
        <div className="ml-4 flex flex-col mt-2 gap-2">{children}</div>
      )}
    </div>
  );
}
