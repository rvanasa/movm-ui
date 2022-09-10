import React from 'react';
import JsonView from 'react-json-view';
import jsonTheme from '../../config/jsonTheme';

export default function Cont({ node }) {
  const { cont_type: type, value } = node;

  return (
    <JsonView
      src={typeof value === 'object' ? value : { value }}
      name={type}
      style={{ padding: '1rem' }}
      collapsed={3}
      displayDataTypes={false}
      theme={jsonTheme}
    ></JsonView>
  );

  //   if (type === 'Taken') {
  //     return <Node node={node} label="(Taken)"></Node>;
  //   }

  //   if (type === 'Exp_') {
  //     const [exp, decs] = value;
  //     return (
  //       <Exp node={exp}>
  //         {decs.map((dec, i) => (
  //           <Dec node={dec} key={i} />
  //         ))}
  //       </Exp>
  //     );
  //   }

  //   if (type === 'Decs') {
  //     const decs = value;
  //     return (
  //       <ListNode node={node} label="Declarations">
  //         {decs.map((dec, i) => (
  //           <Dec node={dec} key={i} />
  //         ))}
  //       </ListNode>
  //     );
  //   }

  // return <Unknown node={node}></Unknown>;
}
