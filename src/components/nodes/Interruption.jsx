import React from 'react';
import Unknown from './Unknown';
import Node from './Node';

export default function Interruption({ node }) {
  const { interruption_type: type, value } = node;

  // if (type === 'Done') {
  //   const decs = value;
  //   return (
  //     <ListNode node={decs} label="Declarations">
  //       {decs.map((dec, i) => (
  //         <Dec node={dec} key={i} />
  //       ))}
  //     </ListNode>
  //   );
  // }

  return <Unknown node={node}></Unknown>;
}
