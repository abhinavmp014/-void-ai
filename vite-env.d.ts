// Fix: Removed 'vite/client' reference as it could not be found in the environment's type definitions.
// Manual definitions for ImportMeta and ImportMetaEnv are provided below to maintain Vite compatibility.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * Fix: Removed 'declare var process' to resolve the "Cannot redeclare block-scoped variable 'process'" error.
 * The 'process' variable is already declared in the global scope by the environment (e.g., via @types/node).
 * Since it is already defined, we do not need to redeclare it here; the environment's existing 
 * definition will be used.
 */
