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
    
    // 测试文件匹配模式
    testMatch: [
        '**/test/**/*.test.js'
    ],
    
    // 测试前的准备
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    
    // 覆盖率收集
    collectCoverage: true,
    collectCoverageFrom: [
        'build/**/*.js',
        '!build/**/*.test.js',
        '!build/**/*.spec.js'
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
