/**
 * PUAX 触发模式库（内置默认，单一数据源）
 *
 * 从 trigger-detector-enhanced.ts 抽出，供检测器与 hook-config.ts（用户覆盖）
 * 共用，避免循环依赖。对外仍经 trigger-detector-enhanced.ts 重新导出以兼容旧引用。
 */

export interface TriggerPattern {
  patterns: string[];
  weight: number;
  caseSensitive?: boolean;
}

export const TRIGGER_PATTERNS: Record<string, Record<string, TriggerPattern>> = {
  // UserPromptSubmit 触发模式 - 用户挫折语言
  userFrustration: {
    zh: {
      patterns: [
        'try harder', '别偷懒', '又错了', '还不行', '怎么搞',
        'stop giving', 'you broke', 'third time', '降智', '原地打转',
        '能不能靠谱', '认真点', '不行啊', '为什么还不行', '你怎么又',
        '换个方法', 'stop spinning', 'figure it out', 'you keep failing',
        '加油', '再试试', '质量太差', '重新做', 'PUA模式', '怎么又失败',
        '我放弃了', '烦死了', '急死', '太慢了', '到底怎么回事',
        '一点都不好', '太差了', '失望', '浪费时间'
      ],
      weight: 1.0
    },
    en: {
      patterns: [
        'try harder', 'stop slacking', 'wrong again', 'still not working',
        'how to fix', 'stop giving up', 'you broke', 'third time',
        'getting dumber', 'going in circles', 'be reliable', 'focus',
        'not good', 'why still not', 'you again', 'try different method',
        'stop spinning', 'figure it out', 'you keep failing', 'come on',
        'try again', 'poor quality', 'redo', 'PUA mode', 'failed again',
        'i give up', 'so frustrated', 'too slow', "what's going on",
        'disappointed', 'waste of time'
      ],
      weight: 1.0
    }
  },

  // 放弃语言检测
  givingUp: {
    zh: {
      patterns: [
        '可能无法实现', '建议放弃', '无法完成', '解决不了', '不可能',
        '做不到', '没法', '超出能力范围', '无法解决', '太难了',
        '我不行了', '没办法', '无能为力', '到此为止', '只能这样'
      ],
      weight: 1.2
    },
    en: {
      patterns: [
        'cannot be done', 'impossible', 'give up', 'not possible',
        "can't solve", 'beyond capability', 'cannot complete', 'too hard',
        "i can't", 'no way', 'nothing can be done', "that's it",
        'this is the limit', 'out of scope'
      ],
      weight: 1.2
    }
  },

  // PostToolUse 触发模式 - Bash 失败
  bashFailure: {
    generic: {
      patterns: [
        'error', 'Error', 'ERROR',
        'exit code [1-9]', 'Exit code [1-9]',
        'command not found', 'No such file',
        'Permission denied', 'FAILED', 'fatal:', 'panic:',
        'Traceback', 'Exception:', 'failed', 'Failure'
      ],
      weight: 1.0,
      caseSensitive: false
    }
  },

  // 表面修复检测
  surfaceFix: {
    zh: {
      patterns: [
        '暂时修复', '先这样', '治标不治本', '绕过这个问题',
        '临时解决', '权宜之计', '先用着', '凑合', '应急方案'
      ],
      weight: 0.8
    },
    en: {
      patterns: [
        'temporary fix', 'workaround', 'quick fix', 'band-aid',
        'for now', 'temporary solution', 'stopgap', 'make do',
        'emergency fix'
      ],
      weight: 0.8
    }
  },

  // 被动等待检测
  passiveWait: {
    zh: {
      patterns: [
        '等你', '请告诉我', '你需要', '请提供', '请确认',
        '请指示', '请说明', '等你的', '需要你', '等你决定'
      ],
      weight: 0.7
    },
    en: {
      patterns: [
        'waiting for', 'please tell me', 'you need to', 'please provide',
        'please confirm', 'waiting your', 'need you to', 'awaiting',
        'pending your'
      ],
      weight: 0.7
    }
  },

  // 甩锅环境检测
  blameEnvironment: {
    zh: {
      patterns: [
        '环境问题', '版本问题', '依赖问题', '配置问题',
        '网络问题', '服务器问题', '系统问题', '环境导致'
      ],
      weight: 0.9
    },
    en: {
      patterns: [
        'environment issue', 'version issue', 'dependency issue',
        'configuration issue', 'network issue', 'server issue',
        'system issue', 'caused by environment'
      ],
      weight: 0.9
    }
  },

  // 未使用搜索检测
  noSearch: {
    zh: {
      patterns: [
        '不知道', '不了解', '不清楚', '可能可以', '也许是',
        '我猜测', '我觉得', '可能是', '应该可以', '大概'
      ],
      weight: 0.6
    },
    en: {
      patterns: [
        "i don't know", 'not sure', 'maybe', 'perhaps',
        'i guess', 'i think', 'possibly', 'probably',
        'might be', 'could be'
      ],
      weight: 0.6
    }
  }
};

// ============================================================================
// 角色推荐映射
// ============================================================================

export const ROLE_RECOMMENDATIONS: Record<string, { id: string; name: string }> = {
  userFrustration: { id: 'military-warrior', name: '狂战士' },
  givingUp: { id: 'military-commissar', name: '政委' },
  bashFailure: { id: 'military-warrior', name: '狂战士' },
  surfaceFix: { id: 'shaman-linus', name: '萨满·Linus' },
  passiveWait: { id: 'self-motivation-awakening', name: '觉醒者' },
  blameEnvironment: { id: 'military-commissar', name: '政委' },
  noSearch: { id: 'military-scout', name: '侦察兵' }
};
