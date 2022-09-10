import React from 'react';
import Unknown from './Unknown';
import Exp from './Exp';

export default function Dec({ node }) {
  const { type, value } = node;

  if (type === 'Exp') {
    const exp = value;
    return <Exp node={exp} />;
  }

  // if (type === 'Let') {
  //   const [pat, exp] = value;
  //   return <Node name={<>let</>} />;
  // }

  return <Unknown node={node}></Unknown>;
}
