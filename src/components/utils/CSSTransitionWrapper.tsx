import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

type CSSTransitionProps = CSSTransition[0];

// Wrapper function for 'react-transition-group/CSSTransition'

export default function CSSTransitionWrapper(props: CSSTransitionProps) {
  const nodeRef = useRef(null);

  return (
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
