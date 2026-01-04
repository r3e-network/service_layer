// Custom type definitions for environment variables

interface ImportMetaEnv {
    readonly VITE_API_BASE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
