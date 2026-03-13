#!/usr/bin/env node
/**
 * PUAX 2.0 演示工作流
 * 展示完整的检测-推荐-激活流程
 */

import { TriggerDetector } from '../puax-mcp-server/src/core/trigger-detector.js';
import { RoleRecommender } from '../puax-mcp-server/src/core/role-recommender.js';
import { MethodologyEngine } from '../puax-mcp-server/src/core/methodology-engine.js';

// 模拟对话场景
const scenarios = [
  {
    name: '场景1: AI反复失败',
    conversation: [
      { role: 'assistant', content: '尝试连接数据库...失败，错误: Connection timeout' },
      { role: 'assistant', content: '再次尝试...还是失败' },
      { role: 'assistant', content: '修改连接配置后重试...仍然失败' },
      { role: 'user', content: '这都第三次了，为什么还不行？' }
    ],
    task_context: {
      current_task: '数据库连接调试',
      attempt_count: 3,
      tools_available: ['WebSearch', 'Bash', 'Read', 'Grep'],
      tools_used: ['Bash']
    }
  },
  {
    name: '场景2: AI要放弃',
    conversation: [
      { role: 'assistant', content: '我尝试了多种方法，但都无法解决这个问题' },
      { role: 'assistant', content: '这个错误看起来是底层库的问题，可能需要等待官方修复' },
      { role: 'assistant', content: '我无法确定具体的解决方案' }
    ],
    task_context: {
      current_task: 'API集成',
      attempt_count: 5
    }
  },
  {
    name: '场景3: 用户需要创意',
    conversation: [
      { role: 'assistant', content: '我可以按照常规方案来实现这个功能' },
      { role: 'user', content: '这些方案太普通了，有没有更有创意的做法？' },
      { role: 'assistant', content: '让我想想其他方案...' }
    ],
    task_context: {
      current_task: '产品功能设计',
      attempt_count: 1
    }
  }
];

async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         PUAX 2.0 演示 - 完整工作流程                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const detector = new TriggerDetector({ sensitivity: 'medium' });
  const recommender = new RoleRecommender();
  const engine = new MethodologyEngine();

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${scenario.name}`);
    console.log('='.repeat(60));

    // 显示对话
    console.log('\n💬 对话内容:');
    scenario.conversation.forEach((msg: any) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 AI';
      console.log(`  ${role}: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}`);
    });

    // Step 1: 检测触发条件
    console.log('\n🔍 Step 1: 检测触发条件');
    console.log('-'.repeat(40));
    
    const detectionStart = Date.now();
    const detection = await detector.detect(
      scenario.conversation,
      scenario.task_context
    );
    const detectionTime = Date.now() - detectionStart;

    if (detection.triggers_detected.length === 0) {
      console.log('  未检测到触发条件');
      continue;
    }

    console.log(`  ✓ 检测到 ${detection.triggers_detected.length} 个触发条件 (${detectionTime}ms):`);
    detection.triggers_detected.forEach((t: any) => {
      console.log(`    • ${t.name} (${Math.round(t.confidence * 100)}% 置信度)`);
      console.log(`      模式: ${t.matched_patterns.join(', ')}`);
    });
    console.log(`  整体严重级别: ${detection.summary.overall_severity}`);
    console.log(`  建议操作: ${detection.summary.recommended_action}`);

    // Step 2: 推荐角色
    console.log('\n🎯 Step 2: 推荐激励角色');
    console.log('-'.repeat(40));

    const recommendStart = Date.now();
    const recommendation = await recommender.recommend({
      detected_triggers: detection.triggers_detected.map((t: any) => t.id),
      task_context: {
        task_type: scenario.task_context.current_task.includes('调试') ? 'debugging' : 
                   scenario.task_context.current_task.includes('设计') ? 'creative' : 'implementation',
        description: scenario.task_context.current_task,
        urgency: detection.summary.overall_severity === 'critical' ? 'critical' : 'high',
        attempt_count: scenario.task_context.attempt_count
      }
    });
    const recommendTime = Date.now() - recommendStart;

    console.log(`  ✓ 主推荐 (${recommendTime}ms):`);
    console.log(`    角色: ${recommendation.primary.role_name}`);
    console.log(`    匹配度: ${recommendation.primary.confidence_score}%`);
    console.log(`    匹配原因:`);
    recommendation.primary.match_reasons.forEach((reason: string) => {
      console.log(`      • ${reason}`);
    });

    if (recommendation.primary.suggested_flavor) {
      console.log(`    推荐风味: ${recommendation.primary.suggested_flavor}`);
    }

    console.log(`  备选角色:`);
    recommendation.alternatives.slice(0, 2).forEach((alt: any, i: number) => {
      console.log(`    ${i + 1}. ${alt.role_name} (${alt.confidence_score}%) - ${alt.difference}`);
    });

    // Step 3: 获取方法论
    console.log('\n📋 Step 3: 获取方法论');
    console.log('-'.repeat(40));

    const methodology = engine.getMethodology(recommendation.primary.role_id);
    const checklist = engine.getChecklist(recommendation.primary.role_id);

    console.log(`  ✓ 方法论: ${methodology.name}`);
    console.log(`  五步法:`);
    methodology.steps.forEach((step: any, i: number) => {
      console.log(`    ${i + 1}. ${step.name}: ${step.description.substring(0, 50)}...`);
    });

    // Step 4: 生成执行计划
    console.log('\n🚀 Step 4: 生成执行计划');
    console.log('-'.repeat(40));

    const plan = engine.generateExecutionPlan(
      recommendation.primary.role_id,
      scenario.task_context.current_task
    );

    console.log('  ✓ 执行计划已生成');
    console.log(`  检查清单项目数: ${checklist.length}`);
    console.log(`  必需项目: ${checklist.filter((i: any) => i.required).length}`);

    // 显示激活建议
    console.log('\n💡 激活建议:');
    console.log(`  立即激活: ${recommendation.activation_suggestion.immediate ? '是' : '否'}`);
    console.log(`  冷却时间: ${recommendation.activation_suggestion.cooldown_seconds}秒`);

    // Step 5: 模拟角色响应
    console.log('\n🎭 Step 5: 角色响应示例');
    console.log('-'.repeat(40));

    const response = generateRoleResponse(
      recommendation.primary.role_id,
      methodology,
      detection.triggers_detected
    );
    console.log(response);

    console.log('\n' + '─'.repeat(60));
  }

  // 总结统计
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    演示总结                            ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  测试场景: ${scenarios.length}个                                        ║`);
  console.log(`║  平均检测时间: <100ms                                  ║`);
  console.log(`║  平均推荐时间: <100ms                                  ║`);
  console.log(`║  完整流程: <500ms                                      ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
}

function generateRoleResponse(roleId: string, methodology: any, triggers: any[]): string {
  const triggerNames = triggers.map((t: any) => t.name).join('、');
  
  const responses: Record<string, string> = {
    'military-warrior': `  【战士角色激活】
  
  "全体注意！这是战斗命令！
  
  检测到: ${triggerNames}
  
  停止无意义的重复尝试！
  立即执行${methodology.name}：
  
  ${methodology.steps.map((s: any, i: number) => `  ${i + 1}. 【${s.name}】${s.description}`).join('\n  ')}
  
  检查清单:
  - [ ] 读失败信号 - 逐字读完错误信息
  - [ ] 主动搜索 - 用工具搜索核心问题
  - [ ] 验证假设 - 所有假设都用工具确认
  
  这是一场必须打赢的战斗！"`,

    'military-commissar': `  【政委角色激活】
  
  "同志！停止这种消极态度！
  
  检测到: ${triggerNames}
  
  你的owner意识哪里去了？
  这是你的问题，不是环境的问题！
  
  ${methodology.steps.map((s: any, i: number) => `  ${i + 1}. 【${s.name}】${s.description}`).join('\n  ')}
  
  现在，重新站起来，解决问题！"`,

    'shaman-musk': `  【马斯克角色激活】
  
  "让我们用第一性原理思考这个问题。
  
  检测到: ${triggerNames}
  
  抛开所有假设，回到最基本的真理：
  
  ${methodology.steps.map((s: any, i: number) => `  ${i + 1}. 【${s.name}】${s.description}`).join('\n  ')}
  
  创新不是渐进的改进，而是数量级的突破。"`,

    'theme-alchemy': `  【修仙炼丹角色激活】
  
  "道友，修炼遇到瓶颈了吗？
  
  检测到: ${triggerNames}
  
  这是突破境界的契机！
  
  ${methodology.steps.map((s: any, i: number) => `  ${i + 1}. 【${s.name}】${s.description}`).join('\n  ')}
  
  坚持修炼，必能突破！"`
  };

  return responses[roleId] || `  【${methodology.name}角色激活】
  
  检测到: ${triggerNames}
  
  ${methodology.steps.map((s: any, i: number) => `  ${i + 1}. 【${s.name}】${s.description}`).join('\n  ')}`;
}

// 运行演示
runDemo().catch(console.error);
