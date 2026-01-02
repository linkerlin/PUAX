const Sequencer = require('@jest/test-sequencer').default;

/**
 * 测试序列器
 * 控制测试执行的顺序
 */
class CustomSequencer extends Sequencer {
    /**
     * 排序测试文件
     * 先运行单元测试，然后是 HTTP 测试，最后是集成测试
     */
    sort(tests) {
        const priority = {
            'unit': 1,
            'http': 2,
            'sse': 3,
            'tools': 4,
            'integration': 5
        };

        // 复制测试数组并排序
        return tests.sort((testA, testB) => {
            const pathA = testA.path;
            const pathB = testB.path;
            
            // 从路径中提取测试类型
            const typeA = pathA.includes('/unit/') ? 'unit' :
                         pathA.includes('/http/') ? 'http' :
                         pathA.includes('/sse/') ? 'sse' :
                         pathA.includes('/tools/') ? 'tools' :
                         pathA.includes('/integration/') ? 'integration' : 'other';
            
            const typeB = pathB.includes('/unit/') ? 'unit' :
                         pathB.includes('/http/') ? 'http' :
                         pathB.includes('/sse/') ? 'sse' :
                         pathB.includes('/tools/') ? 'tools' :
                         pathB.includes('/integration/') ? 'integration' : 'other';
            
            // 根据优先级排序
            return priority[typeA] - priority[typeB];
        });
    }
}

module.exports = CustomSequencer;