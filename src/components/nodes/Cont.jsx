import React from 'react';
import Unknown from './Unknown';
import Node from './Node';
import Dec from './Dec';
import ListNode from './ListNode'

export default function Cont({ node }) {
  const { cont_type: type, value } = node;

  if (type === 'Decs') {
    const decs = value;
    return (
      <ListNode node={decs} label="Declarations">
        {decs.map((dec, i) => (
          <Dec node={dec} key={i} />
        ))}
      </ListNode>
    );
  }

  return <Unknown node={node}></Unknown>;
}
