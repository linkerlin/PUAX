/**
 * P0-1 守门：Zod → JSON Schema 契约
 *
 * 铁律：MCP 协议要求 `tools/list` 的 inputSchema 为标准 JSON Schema。
 * 此前 Zod 对象被直接透传，严格客户端在发现阶段即失败。此测试守住不再退化。
 */

import { z } from "zod";
import { toJsonSchema, toProtocolTool } from "../../src/tools/json-schema.js";
import { allTools } from "../../src/tools/index.js";

describe("Zod → JSON Schema 转换器", () => {
  it("基础标量类型：string / number / boolean", () => {
    expect(toJsonSchema(z.string())).toMatchObject({ type: "string" });
    expect(toJsonSchema(z.number())).toMatchObject({ type: "number" });
    expect(toJsonSchema(z.boolean())).toMatchObject({ type: "boolean" });
  });

  it("描述透出 description", () => {
    const schema = toJsonSchema(z.string().describe("任务描述"));
    expect(schema).toMatchObject({ type: "string", description: "任务描述" });
  });

  it("enum 编译为 enum 数组", () => {
    const schema = toJsonSchema(z.enum(["a", "b"]));
    expect(schema).toMatchObject({ enum: ["a", "b"] });
  });

  it("optional 不进 required，default 携带默认值", () => {
    const schema = toJsonSchema(
      z.object({
        required: z.string(),
        optional: z.string().optional(),
        withDefault: z.enum(["x", "y"]).default("x"),
      })
    );
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(["required"]);
    expect((schema.properties as any).withDefault.default).toBe("x");
  });

  it("array / record / 嵌套 object 编译正确", () => {
    const arraySchema = toJsonSchema(z.array(z.string()));
    expect(arraySchema).toMatchObject({ type: "array", items: { type: "string" } });

    const recordSchema = toJsonSchema(z.record(z.string()));
    expect(recordSchema).toMatchObject({
      type: "object",
      additionalProperties: { type: "string" },
    });

    const nested = toJsonSchema(z.object({ inner: z.object({ deep: z.number() }) }));
    expect((nested.properties as any).inner.properties.deep).toMatchObject({ type: "number" });
  });

  it("nullable 编译为 anyOf + null", () => {
    const schema = toJsonSchema(z.string().nullable());
    expect(schema).toMatchObject({ anyOf: [{ type: "string" }, { type: "null" }] });
  });

  it("string checks 透出 minLength / format", () => {
    expect(toJsonSchema(z.string().min(3))).toMatchObject({ minLength: 3 });
    expect(toJsonSchema(z.string().email())).toMatchObject({ format: "email" });
  });

  it("未知类型退化为无约束，绝不抛错", () => {
    expect(() => toJsonSchema(z.any())).not.toThrow();
    expect(() => toJsonSchema(z.unknown())).not.toThrow();
    expect(() => toJsonSchema(z.map(z.string(), z.string()))).not.toThrow();
    expect(toJsonSchema(z.any())).toEqual({});
  });

  it("refine / transform 剥壳后仍可编译", () => {
    const schema = toJsonSchema(z.object({ n: z.number().refine((v) => v > 0) }));
    expect((schema.properties as any).n).toMatchObject({ type: "number" });
  });
});

describe("全量工具契约（50 个）", () => {
  it("每个工具的 inputSchema 均为 object 型 JSON Schema", () => {
    expect(allTools.length).toBe(50);
    for (const tool of allTools as Array<{ name: string; inputSchema?: z.ZodTypeAny }>) {
      const schema = toJsonSchema(tool.inputSchema as z.ZodTypeAny);
      expect(schema.type).toBe("object");
      expect(schema.properties).toBeDefined();
    }
  });

  it("toProtocolTool 输出不含 Zod 内部字段（_def / typeName）", () => {
    for (const tool of allTools as Array<{ name: string; description?: string; inputSchema?: z.ZodTypeAny }>) {
      const wire = toProtocolTool(tool);
      expect(wire.inputSchema.type).toBe("object");
      const serialized = JSON.stringify(wire.inputSchema);
      expect(serialized).not.toContain("_def");
      expect(serialized).not.toContain("typeName");
    }
  });

  it("工具名唯一且非空", () => {
    const names = (allTools as Array<{ name: string }>).map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((n) => typeof n === "string" && n.length > 0)).toBe(true);
  });

  it("缺 schema 的工具被兜底为 object 而非崩溃", () => {
    const wire = toProtocolTool({ name: "ghost", description: "无 schema" });
    expect(wire.inputSchema).toEqual({ type: "object", properties: {}, additionalProperties: false });
  });
});
