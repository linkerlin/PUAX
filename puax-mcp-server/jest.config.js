module.exports = {
    // 测试环境
    testEnvironment: 'node',
    
    // 支持 ES 模块
    extensionsToTreatAsEsm: ['.ts'],
    
    // 使用 ts-node 处理 TypeScript
    preset: 'ts-jest/presets/default-esm',
    
    // 使用 transform 处理模块
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    module: 'ESNext',
                    moduleResolution: 'node',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true
                }
            }
        ]
    },
    
    // 告诉 Jest 处理这些模块
    transformIgnorePatterns: [
        'node_modules/(?!(\\@modelcontextprotocol)/)'
    ],
    
    // 模块名映射
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    
    // 测试文件匹配模式（含 src 内 co-located __tests__，防沉睡假覆盖）
    testMatch: [
        '**/test/**/*.test.js',
        '**/test/**/*.test.ts',
        '**/test/**/*.spec.js',
        '**/test/**/*.spec.ts',
        '**/__tests__/**/*.test.js',
        '**/__tests__/**/*.test.ts'
    ],
    
    // 测试前的准备
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    
    // 覆盖率收集：默认关闭（本地跑提速），CI 以 --coverage 显式开启；
    // 统计源码而非 build 产物，未 build 时不再产出 0% 假指标
    collectCoverage: false,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**'
    ],
    
    // 覆盖率输出目录
    coverageDirectory: 'coverage',
    
    // 覆盖率报告格式
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov'
    ],
    
    // 测试超时
    testTimeout: 20000,
    
    // 是否显示覆盖率报告
    verbose: true,
    
    // 模块路径
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/'
    ]
};
