import React from 'react';

export default function Unknown({ node }) {
  return <pre>{JSON.stringify(node)}</pre>;
}
