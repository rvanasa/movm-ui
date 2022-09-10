import SplitPane from 'react-split-pane';
import isMobile from '../../utils/isMobile';

export default function ResponsiveSplitPane(props) {
  if (props.split === 'vertical' && isMobile()) {
    return props.children;
  }

  return (
    <div>
      <SplitPane {...props} />
    </div>
  );
}
