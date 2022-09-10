import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { CSSTransitionProps } from 'react-transition-group/CSSTransition';

export default function CSSTransitionWrapper(props: CSSTransitionProps) {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore
    <CSSTransition {...props} nodeRef={nodeRef}>
      <>
        {React.Children.map(props.children, (child) => {
          // @ts-ignore
          return React.cloneElement(child, { ref: nodeRef });
        })}
      </>
    </CSSTransition>
  );
}
