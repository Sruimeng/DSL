/**
 * MCP Controller - MCP控制器
 *
 * AI MCP (Model Context Protocol) 调用接口，桥接 AI 与 DSL Engine。
 */

import type { DSLEngine } from '../core/DSL-engine';
import type { IActionConstructor, Params } from '../type';

/**
 * MCPController 提供了 AI 调用 DSL Engine 的接口
 * 支持动作注册、执行和查询功能
 */
export class MCPController {
  private engine: DSLEngine;
  private actions: Map<string, IActionConstructor> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();

  /**
   * 创建 MCPController 实例
   * @param engine DSL引擎实例
   */
  constructor(engine: DSLEngine) {
    this.engine = engine;
    this.setupEventListeners();
  }

  /**
   * 注册动作
   * @param name 动作名称
   * @param actionClass 动作类
   */
  registerAction(name: string, actionClass: IActionConstructor): void {
    // 注册到引擎
    this.engine.registerAction(name, actionClass);

    // 在本地也保存一份
    this.actions.set(name, actionClass);

    // 创建对应的工具
    const actionInstance = new actionClass();
    this.tools.set(name, {
      name,
      description: actionInstance.description || `Execute ${name} action`,
      inputSchema: (actionInstance as any).getSchema?.() || {
        type: 'object',
        properties: {},
      },
    });

    console.log(`MCP: Registered action '${name}'`);
  }

  /**
   * 注销动作
   * @param name 动作名称
   */
  unregisterAction(name: string): void {
    this.engine.unregisterAction(name);
    this.actions.delete(name);
    this.tools.delete(name);
    console.log(`MCP: Unregistered action '${name}'`);
  }

  /**
   * 调用动作
   * @param name 动作名称
   * @param params 动作参数
   */
  async callAction(name: string, params?: Params): Promise<MCPResponse> {
    try {
      // 检查动作是否存在
      if (!this.actions.has(name)) {
        throw new Error(`Action '${name}' not found`);
      }

      // 记录开始时间
      const startTime = Date.now();

      // 执行动作
      await this.engine.executeAction(name, params);

      // 计算执行时间
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result: {
          action: name,
          status: 'completed',
          executionTime,
          message: `Action '${name}' executed successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACTION_EXECUTION_ERROR',
          message: `Failed to execute action '${name}': ${(error as Error).message}`,
          details: error,
        },
      };
    }
  }

  /**
   * 获取所有可用工具
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取指定工具
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 添加资源
   * @param resource 资源对象
   */
  addResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    console.log(`MCP: Added resource '${resource.uri}'`);
  }

  /**
   * 获取资源
   * @param uri 资源URI
   */
  getResource(uri: string): MCPResource | undefined {
    return this.resources.get(uri);
  }

  /**
   * 获取所有资源
   */
  getResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * 创建提示模板
   * @param prompt 提示对象
   */
  createPrompt(prompt: MCPPrompt): void {
    // 这里可以实现提示模板的创建逻辑
    console.log(`MCP: Created prompt '${prompt.name}'`);
  }

  /**
   * 获取引擎状态
   */
  getEngineState(): unknown {
    return this.engine.getState();
  }

  /**
   * 获取场景状态
   */
  getSceneState(): unknown {
    return this.engine.getSceneState();
  }

  /**
   * 获取引擎统计信息
   */
  getEngineStats(): unknown {
    return this.engine.getStats();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听引擎事件
    this.engine.on('actionExecuted', (data) => {
      console.log('MCP: Action executed:', data);
    });

    this.engine.on('objectAdded', (data) => {
      console.log('MCP: Object added:', data);
    });

    this.engine.on('objectRemoved', (data) => {
      console.log('MCP: Object removed:', data);
    });
  }

  /**
   * 处理工具调用请求
   */
  async handleToolCall(request: {
    name: string;
    parameters?: Record<string, unknown>;
  }): Promise<MCPResponse> {
    return this.callAction(request.name, request.parameters);
  }

  /**
   * 处理资源请求
   */
  async handleResourceRequest(uri: string): Promise<MCPResponse> {
    const resource = this.getResource(uri);

    if (!resource) {
      return {
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: `Resource '${uri}' not found`,
        },
      };
    }

    return {
      success: true,
      result: {
        resource: uri,
        contents: resource.contents,
        metadata: resource.metadata,
      },
    };
  }

  /**
   * 生成MCP协议响应
   */
  generateProtocolResponse(): MCPProtocolResponse {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          listChanged: true,
        },
        resources: {
          subscribe: true,
          listChanged: true,
        },
        prompts: {
          listChanged: true,
        },
      },
      tools: {
        tools: this.getTools(),
      },
      resources: {
        resources: this.getResources(),
      },
    };
  }
}

/**
 * MCP工具接口
 */
export interface MCPTool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 输入模式（JSON Schema） */
  inputSchema: Record<string, unknown>;
}

/**
 * MCP资源接口
 */
export interface MCPResource {
  /** 资源URI */
  uri: string;
  /** 资源名称 */
  name: string;
  /** 资源描述 */
  description?: string;
  /** 资源类型 */
  mimeType?: string;
  /** 资源内容 */
  contents: unknown;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * MCP提示接口
 */
export interface MCPPrompt {
  /** 提示名称 */
  name: string;
  /** 提示描述 */
  description: string;
  /** 参数 */
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * MCP响应接口
 */
export interface MCPResponse {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  result?: unknown;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * MCP协议响应接口
 */
export interface MCPProtocolResponse {
  /** 协议版本 */
  protocolVersion: string;
  /** 能力描述 */
  capabilities: {
    tools?: {
      listChanged?: boolean;
    };
    resources?: {
      subscribe?: boolean;
      listChanged?: boolean;
    };
    prompts?: {
      listChanged?: boolean;
    };
  };
  /** 工具列表 */
  tools?: {
    tools: MCPTool[];
  };
  /** 资源列表 */
  resources?: {
    resources: MCPResource[];
  };
  /** 提示列表 */
  prompts?: {
    prompts: MCPPrompt[];
  };
}
