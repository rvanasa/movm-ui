import React from 'react';
import Unknown from './Unknown';
import Node from './Node';

export default function Dec({ node }) {
  const { type, value } = node;

  // if (type === '') {
  //   const []=value;
  //   return <Node></Node>;
  // }

  return <Unknown node={node}></Unknown>;
}
