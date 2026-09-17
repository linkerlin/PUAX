/**
 * Zod → JSON Schema 转换器（零新增依赖）
 *
 * 缘起：MCP 协议的 `tools/list` 要求 `inputSchema` 为标准 JSON Schema
 *（`{ type: 'object', properties, required }`）。而 PUAX 的工具层为获得 TS 类型
 * 推断，一直持有的是 **Zod 对象本体**；直接透传时序列化出的是 Zod 内部结构
 *（`_def` / `typeName` 之类），严格客户端在 `listTools` 阶段即宣告失败：
 *
 *   tools[0].inputSchema.type expected "object"
 *
 * 此乃协议契约第一硬伤。本模块以零依赖方式把 Zod schema 编译为 JSON Schema，
 * 使严格客户端可正常发现与调用工具。
 *
 * 设计取舍：
 * - **宁宽勿崩**：遇到未知/不支持的 Zod 类型，退化为 `{}`（等价于「任意」），
 *   绝不让 `tools/list` 因单个工具而整体失败。
 * - **不引入 `zod-to-json-schema`**：保持运行时依赖仅 4 个，且本项目只用
 *   zod 的能力子集，自持转换器足以覆盖。
 * - **只出不入**：本模块只负责「对外声明」，不做业务校验；入参校验由
 *   `server/core.ts` 的 `safeParse` 承担。
 */

import { z } from 'zod';

/** JSON Schema（draft 2020-12 子集）节点 */
export type JsonSchema = { [key: string]: unknown };

type AnyZod = z.ZodTypeAny;

const KIND = z.ZodFirstPartyTypeKind;

/** Zod 内部定义以 unknown 取值，避免 any 污染 lint */
type ZodDef = Record<string, unknown>;

/** Zod 的 check 项（min / max / email / regex …） */
type ZodCheck = { kind?: unknown; value?: unknown; regex?: unknown };

function defOf(schema: AnyZod): ZodDef {
    const holder = schema as unknown as { _def?: unknown };
    const def = holder._def;
    return (typeof def === 'object' && def !== null ? def : {}) as ZodDef;
}

function descriptionOf(schema: AnyZod): string | undefined {
    const own = (schema as unknown as { description?: unknown }).description;
    if (typeof own === 'string' && own.length > 0) return own;
    const fromDef = defOf(schema).description;
    return typeof fromDef === 'string' && fromDef.length > 0 ? fromDef : undefined;
}

/** 值可否视为一个 Zod schema */
function asZod(value: unknown): AnyZod | null {
    if (typeof value === 'object' && value !== null && '_def' in value) {
        return value as AnyZod;
    }
    return null;
}

function asZodList(value: unknown): AnyZod[] {
    if (!Array.isArray(value)) return [];
    const out: AnyZod[] = [];
    for (const item of value) {
        const parsed = asZod(item);
        if (parsed) out.push(parsed);
    }
    return out;
}

function asStringList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((v): v is string => typeof v === 'string');
    }
    if (typeof value === 'object' && value !== null) {
        return Object.values(value as Record<string, unknown>).filter(
            (v): v is string => typeof v === 'string'
        );
    }
    return [];
}

function asChecks(value: unknown): ZodCheck[] {
    return Array.isArray(value) ? (value as ZodCheck[]) : [];
}

/** 键是否可省略（optional / default） */
function isOptional(schema: AnyZod): boolean {
    const typeName = defOf(schema).typeName;
    return typeName === KIND.ZodOptional || typeName === KIND.ZodDefault;
}

/** 剥壳：Effects 取内层 schema，其余取 innerType */
function unwrap(schema: AnyZod): AnyZod | null {
    const def = defOf(schema);
    if (def.typeName === KIND.ZodEffects) {
        return asZod(def.schema);
    }
    return asZod(def.innerType);
}

/** 取 object 的字段表（兼容 shape 为函数或对象两种形态） */
function shapeOf(def: ZodDef): Record<string, AnyZod> {
    const raw = def.shape;
    const resolved: unknown = typeof raw === 'function' ? (raw as () => unknown)() : raw;
    const out: Record<string, AnyZod> = {};
    if (typeof resolved === 'object' && resolved !== null) {
        for (const [key, value] of Object.entries(resolved as Record<string, unknown>)) {
            const field = asZod(value);
            if (field) out[key] = field;
        }
    }
    return out;
}

/** ZodString 的 checks：min / max / email / url / uuid / regex */
function stringChecks(schema: AnyZod): JsonSchema {
    const out: JsonSchema = {};
    for (const check of asChecks(defOf(schema).checks)) {
        switch (check.kind) {
            case 'min':
                out.minLength = check.value as number;
                break;
            case 'max':
                out.maxLength = check.value as number;
                break;
            case 'email':
                out.format = 'email';
                break;
            case 'url':
                out.format = 'uri';
                break;
            case 'uuid':
                out.format = 'uuid';
                break;
            case 'regex':
                if (check.regex instanceof RegExp) out.pattern = check.regex.source;
                break;
            default:
                break;
        }
    }
    return out;
}

/** ZodNumber 的 checks：min / max / int */
function numberChecks(schema: AnyZod): JsonSchema {
    const out: JsonSchema = { type: 'number' };
    for (const check of asChecks(defOf(schema).checks)) {
        switch (check.kind) {
            case 'min':
                out.minimum = check.value as number;
                break;
            case 'max':
                out.maximum = check.value as number;
                break;
            case 'int':
                out.type = 'integer';
                break;
            default:
                break;
        }
    }
    return out;
}

/**
 * 将 Zod schema 编译为 JSON Schema。
 * 不支持的类型退化为 `{}`，保证 `tools/list` 永不因转换而失败。
 */
export function toJsonSchema(schema: AnyZod): JsonSchema {
    return convert(schema);
}

function convert(schema: AnyZod): JsonSchema {
    const def = defOf(schema);
    const typeName: unknown = def.typeName;
    const description = descriptionOf(schema);
    const described: JsonSchema = description ? { description } : {};

    switch (typeName) {
        case KIND.ZodObject: {
            const shape = shapeOf(def);
            const properties: Record<string, JsonSchema> = {};
            const required: string[] = [];
            for (const [key, value] of Object.entries(shape)) {
                properties[key] = convert(value);
                if (!isOptional(value)) required.push(key);
            }
            const out: JsonSchema = { type: 'object', properties, ...described };
            if (required.length > 0) out.required = required;
            // 默认 strip（与 zod 行为一致）：额外字段无意义
            out.additionalProperties = def.unknownKeys === 'passthrough' ? true : false;
            return out;
        }

        case KIND.ZodString:
            return { type: 'string', ...described, ...stringChecks(schema) };

        case KIND.ZodNumber:
            return { ...described, ...numberChecks(schema) };

        case KIND.ZodBigInt:
            return { type: 'integer', ...described };

        case KIND.ZodBoolean:
            return { type: 'boolean', ...described };

        case KIND.ZodDate:
            return { type: 'string', format: 'date-time', ...described };

        case KIND.ZodNull:
            return { type: 'null', ...described };

        case KIND.ZodUndefined:
            return { ...described, not: {} };

        case KIND.ZodLiteral:
            return { const: def.value, ...described };

        case KIND.ZodEnum:
        case KIND.ZodNativeEnum:
            return { enum: asStringList(def.values), ...described };

        case KIND.ZodArray: {
            const items = asZod(def.type);
            return { type: 'array', items: items ? convert(items) : {}, ...described };
        }

        case KIND.ZodTuple:
            return {
                type: 'array',
                prefixItems: asZodList(def.items).map((item) => convert(item)),
                items: false,
                ...described,
            };

        case KIND.ZodRecord: {
            const valueType = asZod(def.valueType);
            return {
                type: 'object',
                additionalProperties: valueType ? convert(valueType) : true,
                ...described,
            };
        }

        case KIND.ZodUnion:
        case KIND.ZodDiscriminatedUnion:
            return {
                anyOf: asZodList(def.options).map((option) => convert(option)),
                ...described,
            };

        case KIND.ZodIntersection: {
            const left = asZod(def.left);
            const right = asZod(def.right);
            return {
                allOf: [left ? convert(left) : {}, right ? convert(right) : {}],
                ...described,
            };
        }

        case KIND.ZodDefault: {
            const inner = asZod(def.innerType);
            let defaultValue: unknown;
            if (typeof def.defaultValue === 'function') {
                try {
                    defaultValue = (def.defaultValue as () => unknown)();
                } catch {
                    defaultValue = undefined;
                }
            }
            return {
                ...(inner ? convert(inner) : {}),
                ...described,
                ...(defaultValue !== undefined ? { default: defaultValue } : {}),
            };
        }

        case KIND.ZodOptional:
        case KIND.ZodNullable: {
            const inner = unwrap(schema);
            const converted = inner ? convert(inner) : {};
            if (typeName === KIND.ZodNullable) {
                return { anyOf: [converted, { type: 'null' }], ...described };
            }
            return { ...converted, ...described };
        }

        case KIND.ZodEffects:
        case KIND.ZodBranded: {
            const inner = unwrap(schema);
            return { ...(inner ? convert(inner) : {}), ...described };
        }

        // 任意类型（any / unknown / never / void / map / set / promise …）：
        // 退化为「无约束」，保证协议面不崩
        default:
            return { ...described };
    }
}

/**
 * 转换单个工具定义为 MCP 协议可直接下发的形态。
 * 缺少 inputSchema 或转换异常时补一个空 object schema，绝不因单点失败拖垮
 * 整个 `tools/list`。
 */
export function toProtocolTool(tool: {
    name: string;
    description?: string;
    inputSchema?: AnyZod;
}): { name: string; description?: string; inputSchema: JsonSchema } {
    const emptyObject: JsonSchema = { type: 'object', properties: {}, additionalProperties: false };
    let schema: JsonSchema = emptyObject;
    if (tool.inputSchema) {
        try {
            schema = toJsonSchema(tool.inputSchema);
        } catch {
            schema = emptyObject;
        }
    }
    // 兜底：无论如何必须是 object 型，否则严格客户端直接拒收
    if (schema.type !== 'object') {
        return { name: tool.name, description: tool.description, inputSchema: emptyObject };
    }
    return { name: tool.name, description: tool.description, inputSchema: schema };
}
