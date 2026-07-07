/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Circular dependencies make code harder to reason about',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-app-imports-in-ui',
      severity: 'warn',
      comment: 'UI components should not import from app/',
      from: { path: '^src/components/ui/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'no-ui-imports-in-lib',
      severity: 'warn',
      comment: 'Lib should not depend on UI components',
      from: { path: '^src/lib/' },
      to: { path: '^src/components/ui/' },
    },
    {
      name: 'no-sections-imports-in-ui',
      severity: 'warn',
      comment: 'UI primitives should not import section components',
      from: { path: '^src/components/ui/' },
      to: { path: '^src/components/sections/' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
      archi: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
};
