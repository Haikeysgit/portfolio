// `icon` is a Simple Icons slug (simple-icons package). Items without an official logo go in `also`.
export type Tool = { name: string; icon: string };
export const skills: { title: string; tools: Tool[]; also: string[] }[] = [
  {
    title: 'Frontend',
    tools: [
      { name: 'React', icon: 'siReact' },
      { name: 'Next.js', icon: 'siNextdotjs' },
      { name: 'Astro', icon: 'siAstro' },
      { name: 'TypeScript', icon: 'siTypescript' },
      { name: 'Tailwind CSS', icon: 'siTailwindcss' },
    ],
    also: [],
  },
  {
    title: 'Backend',
    tools: [
      { name: 'Node.js', icon: 'siNodedotjs' },
      { name: 'NestJS', icon: 'siNestjs' },
      { name: 'Python', icon: 'siPython' },
      { name: 'FastAPI', icon: 'siFastapi' },
      { name: 'PostgreSQL', icon: 'siPostgresql' },
    ],
    also: ['REST APIs', 'WebSockets', 'Payments', 'Auth'],
  },
  {
    title: 'AI agents',
    tools: [
      { name: 'Python', icon: 'siPython' },
      { name: 'pytest', icon: 'siPytest' },
    ],
    also: ['LLM APIs', 'Coding agents', 'Agent evaluation', 'CatBoost', 'XGBoost'],
  },
  {
    title: 'Blockchain engineering',
    tools: [
      { name: 'Solidity', icon: 'siSolidity' },
      { name: 'Ethereum', icon: 'siEthereum' },
      { name: 'Rust', icon: 'siRust' },
      { name: 'NEAR', icon: 'siNear' },
    ],
    also: ['EVM', 'Base', 'Foundry', 'ERC-20', 'ERC-721 / NFTs'],
  },
];
