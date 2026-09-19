import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/out-tsc',
      '**/coverage',
      '**/.nx',
      '**/*.min.js',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/test-output',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain'],
              bannedExternalImports: [
                '@nestjs/*',
                'socket.io',
                'socket.io-client',
                'zod',
              ],
            },
            {
              sourceTag: 'type:application',
              onlyDependOnLibsWithTags: ['type:domain'],
              bannedExternalImports: [
                '@nestjs/*',
                'socket.io',
                'socket.io-client',
                'zod',
              ],
            },
            {
              allSourceTags: ['scope:api', 'type:infra'],
              onlyDependOnLibsWithTags: ['type:application', 'type:domain'],
            },
            {
              allSourceTags: ['scope:web', 'type:infra'],
              onlyDependOnLibsWithTags: [
                'scope:web',
                'scope:shared',
                'type:contracts',
                'type:infra',
              ],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:contracts'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui'],
            },
            {
              allSourceTags: ['scope:api', 'type:app'],
              onlyDependOnLibsWithTags: [
                'scope:api',
                'scope:shared',
                'type:domain',
                'type:application',
                'type:infra',
                'type:contracts',
              ],
              notDependOnLibsWithTags: ['scope:web'],
            },
            {
              allSourceTags: ['scope:web', 'type:app'],
              onlyDependOnLibsWithTags: [
                'scope:web',
                'scope:shared',
                'type:contracts',
                'type:ui',
                'type:infra',
              ],
              notDependOnLibsWithTags: ['scope:api'],
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
