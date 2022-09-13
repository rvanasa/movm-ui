import React from 'react';
import SplitPane from 'react-split-pane';
import isMobile from '../../utils/isMobile';

export default function ResponsiveSplitPane({ style, ...others }) {
  if (others.split === 'vertical' && isMobile()) {
    return others.children;
  }

  return (
    <div>
      <SplitPane style={{ position: 'relative', ...style }} {...others} />
    </div>
  );
}
