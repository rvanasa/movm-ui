import React from 'react';
import Cont from './Cont';

export default function Interruption({ node }) {
  const { interruption_type: type, value } = node;

  return <Cont node={{ cont_type: type, value }}></Cont>;

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

  // return <Unknown node={node}></Unknown>;
}
