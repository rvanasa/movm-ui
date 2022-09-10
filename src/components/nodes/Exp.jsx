import React from 'react';
import Unknown from './Unknown';

export default function Exp({ node }) {
  // const { type, value } = node;

  // if (type === '') {
  //   const [pat, exp] = value;
  //   return <Node name={<>let</>} />;
  // }

  return <Unknown node={node}></Unknown>;

  // return <Node label="exp"></Node>;
}
