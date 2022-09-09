import classNames from 'classnames';
import nodeTest from 'node:test';
import React, { ReactNode } from 'react';
import Node, { NodeProps } from './Node';

interface ListNodeProps extends NodeProps {
  children: HTMLElement[];
}

export default function ListNode({
  label,
  children,
  ...others
}: ListNodeProps) {
  return (
    <Node
      label={
        <>
          {label} ({children.length})
        </>
      }
      {...others}
    >
      {children}
    </Node>
  );
}
