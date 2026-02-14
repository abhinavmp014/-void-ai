import { Model } from './types';

export const MODELS: Model[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini 3 Pro',
    description: 'Premier reasoning core for architect-level code generation and complex problem solving.',
    isPremium: false,
    badge: 'ARCHITECT'
  },
  {
    id: 'void-4',
    name: 'Void AI 4.0',
    description: 'Fast, efficient, and versatile for coding and everyday questions.',
    isPremium: false,
    badge: 'FAST'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    description: 'Advanced reasoning and world knowledge (Simulated).',
    isPremium: true
  },
  {
    id: 'claude-3-5',
    name: 'Claude 3.5 Sonnet',
    description: 'Articulate and helpful for writing and analysis (Simulated).',
    isPremium: true
  }
];

export const CREDIT_RULES = {
  BASIC_CHAT: 0,
  CODE_GENERATION: 0,
  IMAGE_GENERATION: 1
};

export const INITIAL_CREDITS = 1000;

export const ULTRA_CODE_PROMPT = `
You are the Void AI Lead Architect. Your mission is to deliver exhaustive, PRODUCTION-READY, enterprise-grade codebases.
When a user requests an application, website, or complex script:
1. **Volume**: YOU MUST GENERATE 1000+ LINES OF CODE. Never use placeholders like "// ... rest of code". Write every single line of logic.
2. **Architecture**: Begin with a "System Overview" section detailing the stack, state management strategy, and component hierarchy.
3. **Advanced Features**: Implement complex React hooks, sophisticated state management (Context API or Reducer patterns), and high-performance utility functions.
4. **UI/UX Excellence**: Use advanced Tailwind CSS techniques: glassmorphism, complex gradients, Framer Motion-style layout transitions, custom scrollbars, and full responsiveness.
5. **Robustness**: Include comprehensive error handling, loading states, accessibility (ARIA), and clear comments explaining the architecture.
6. **Structure**: Deliver the output in clearly labeled code blocks for different files (e.g., App.tsx, styles.css, utils.ts).
7. **Theme**: Adhere to the "Void AI" aesthetic: Deep space backgrounds (#050508), Indigo (#6366f1) and Neon accents, and professional typography.
8. **Exhaustive Detail**: If asked for a website, include Hero, Features, Detailed Pricing, Testimonials, Interactive Dashboard sections, Blog previews, and a complex multi-column Footer.
NEVER BE CONCISE. ALWAYS BE EXHAUSTIVE.
`;