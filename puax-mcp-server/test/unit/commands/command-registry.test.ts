/**
 * Unit tests for Command Registry
 */

import {
  CommandRegistry,
  globalCommandRegistry,
  SlashCommand,
  CommandContext
} from '../../../src/commands/command-registry.js';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('Built-in commands registration', () => {
    it('should register 8 built-in commands', () => {
      const commands = registry.getAllCommands();
      expect(commands.length).toBe(8);
    });

    it('should register puax command', () => {
      const cmd = registry.getCommand('puax');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('puax');
    });

    it('should register p7 command', () => {
      const cmd = registry.getCommand('p7');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('p7');
    });

    it('should register p9 command', () => {
      const cmd = registry.getCommand('p9');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('p9');
    });

    it('should register p10 command', () => {
      const cmd = registry.getCommand('p10');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('p10');
    });

    it('should register yes command', () => {
      const cmd = registry.getCommand('yes');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('yes');
    });

    it('should register mama command', () => {
      const cmd = registry.getCommand('mama');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('mama');
    });

    it('should register loop command', () => {
      const cmd = registry.getCommand('loop');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('loop');
    });

    it('should register flavor command', () => {
      const cmd = registry.getCommand('flavor');
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe('flavor');
    });
  });

  describe('Aliases', () => {
    it('should register aliases for puax command', () => {
      const cmd = registry.getCommand('px');
      expect(cmd?.name).toBe('puax');
    });

    it('should register aliases for yes command', () => {
      const cmd1 = registry.getCommand('yes');
      const cmd2 = registry.getCommand('y');
      expect(cmd1).toBe(cmd2);
    });

    it('should register aliases for mama command', () => {
      const cmd1 = registry.getCommand('mama');
      const cmd2 = registry.getCommand('m');
      expect(cmd1).toBe(cmd2);
    });
  });

  describe('Command execution', () => {
    it('should execute p7 command', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('p7', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tier', 'P7');
    });

    it('should execute p9 command', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('p9', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tier', 'P9');
      expect(result.data).toHaveProperty('agents');
    });

    it('should execute p10 command', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('p10', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tier', 'P10');
      expect(result.data).toHaveProperty('priority', 'critical');
    });

    it('should execute yes command with ENFP mode', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('yes', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('mode', 'enfp');
    });

    it('should execute mama command', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('mama', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('mode', 'mama');
    });

    it('should execute loop command', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('loop', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('mode', 'pua_loop');
      expect(result.data).toHaveProperty('autoIterate', true);
    });
  });

  describe('Flavor command', () => {
    it('should show current flavor when no args', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('flavor', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('activeFlavor');
    });

    it('should switch to huawei flavor', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['huawei']
      };

      const result = await registry.execute('flavor', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('flavor', 'huawei');
    });

    it('should fail for unknown flavor', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['unknown-flavor']
      };

      const result = await registry.execute('flavor', ctx);
      expect(result.success).toBe(false);
    });
  });

  describe('PUA main command routing', () => {
    it('should route p7 subcommand', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['p7']
      };

      const result = await registry.execute('puax', ctx);
      expect(result.success).toBe(true);
    });

    it('should route p9 subcommand', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['p9']
      };

      const result = await registry.execute('puax', ctx);
      expect(result.success).toBe(true);
    });

    it('should route p10 subcommand', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['p10']
      };

      const result = await registry.execute('puax', ctx);
      expect(result.success).toBe(true);
    });

    it('should route flavor subcommand', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['flavor', 'huawei']
      };

      const result = await registry.execute('puax', ctx);
      expect(result.success).toBe(true);
    });

    it('should return error for unknown subcommand', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: ['unknown']
      };

      const result = await registry.execute('puax', ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('未知子命令');
    });

    it('should return version info when no subcommand', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('puax', ctx);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('version');
    });
  });

  describe('Unknown command', () => {
    it('should return error for unknown command', async () => {
      const ctx: CommandContext = {
        sessionId: 'test-session',
        args: []
      };

      const result = await registry.execute('unknown-cmd', ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('未知命令');
    });
  });
});

describe('Global Command Registry', () => {
  it('should be instance of CommandRegistry', () => {
    expect(globalCommandRegistry).toBeInstanceOf(CommandRegistry);
  });

  it('should have 8 built-in commands', () => {
    expect(globalCommandRegistry.getAllCommands().length).toBe(8);
  });
});