# ACM (claude-code-auth-manager)

类似 nvm、nrm 的 AI API 配置切换工具，让您轻松管理和切换多个 Claude API 配置。

## 特性

- 🚀 一键切换多个 AI API 配置
- 📝 简单的命令行界面
- 🔧 支持添加、删除、列表和当前配置管理
- 💾 自动配置文件管理
- 🔄 环境变量自动设置

## Claude 中转推荐
1. 目前发现的最良心的中转站,每天签到送额度,注册送5刀,微信扫码注册
- https://claude.husan97x.xyz/register?aff=k02G  
2. 每天3000积分 https://www.aicodemirror.com/register?invitecode=8KTOWC
3. 注册送7刀
https://instcopilot-api.com/register?aff=qsCZ
4. 注册送3000积分
https://www.claude-code.top/register?inviteCode=8KTOWC
5. 注册送1000point
https://aicodeditor.com/register?invitecode=VHE6FK
6. 注册送5刀
https://ai-router.plugins-world.cn/register?aff=VvoS




## 快速开始

### 安装方式

#### 方式1: NPM 全局安装 (推荐)

```bash
npm install -g claude-code-auth-manager
```

#### 方式2: 手动安装
> 维护可能不及时
```bash
git clone <repository-url>
cd ai-config-manager
./install.sh
```

### 基本用法

```bash
# 查看所有可用配置
acm list
或 acm ls

# 切换到指定配置
acm use Alias
eg.
acm use openai

# 添加新配置
acm add [Alias] [key] [api url] [type]
eg.
acm add openai sk-xxx https://api.openai.com key

# 删除配置
acm remove openai

# 查看当前配置
acm current

# 查看帮助
acm help
```

## 命令详解

### acm list
显示所有可用的 API 配置，包括别名、名称、API 密钥预览和 URL。

### acm use <alias>
切换到指定的配置，自动设置环境变量 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL`。

### acm add <alias> <name> <token> <url>
添加新的 API 配置。参数说明：
- `alias`: 配置别名（用于快速切换）
- `name`: 配置显示名称
- `token`: API 密钥
- `url`: API 基础 URL

### acm remove <alias>
删除指定的配置。

### acm current
显示当前使用的配置详情和激活状态。

## 配置文件

配置文件位于 `~/.claude/.claude_config`，格式为：
```
别名|名称|API密钥|API地址
```

默认包含以下配置（需要替换为真实的 API 密钥）：
```
aicodemirror|Claude|sk-ant-XXXX|https://api.aicodemirror.com/api/claudecode|KEY
aicodewith|Claude|sk-XXXX|https://api.aicodewith.com|TOKEN
kimi|月之暗面|sk-xxxxxxKIMIxxxxxx|https://api.moonshot.cn/anthropic|TOKEN
```

## 环境变量

ACM 会自动设置以下环境变量：
- `ANTHROPIC_AUTH_TOKEN`: API 认证令牌
- `ANTHROPIC_BASE_URL`: API 基础 URL

## 卸载

### NPM 安装的版本
```bash
npm uninstall -g ai-config-manager
```

### 手动安装的版本
```bash
./uninstall.sh
```

## 示例使用场景

```bash
# 初次安装后，查看可用配置
acm list

# 编辑配置文件，填入真实 API 密钥
vim ~/.claude/.claude_config

# 切换到 kimi 配置
acm use kimi

# 验证当前配置
acm current

# 添加新的 OpenAI 配置
acm add openai "OpenAI API" sk-proj-xxx https://api.openai.com

# 切换到新添加的配置
acm use openai
```

## 工作原理

1. **配置存储**: 所有配置存储在 `~/.claude/.claude_config` 文件中
2. **当前配置跟踪**: 当前使用的配置记录在 `~/.claude/.claude_current` 文件中(待改进)
3. **环境变量设置**: 使用 `acm use` 命令时自动导出相应的环境变量
4. **配置验证**: 提供完整的错误处理和配置验证机制

## 故障排除

如果遇到问题，请检查：
1. 配置文件 `~/.claude/.claude_config` 是否存在且格式正确
2. API 密钥是否有效
3. 网络连接是否正常
4. 环境变量是否正确设置

使用 `acm current` 命令可以查看当前配置状态和诊断信息。

## NPM 包发布

如果您想发布到 npm：

1. 更新 `package.json` 中的包名和仓库信息
2. 登录 npm：`npm login`
3. 发布包：`npm publish`

## 开发

### 本地开发
```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 监听模式编译
npm run dev

# 链接到全局测试
npm link

# 测试命令
acm help

# 取消链接
npm unlink -g ai-config-manager
```

### 项目结构
```
acm/
├── src/                # TypeScript 源代码
│   ├── bin/
│   │   └── acm.ts      # CLI 入口文件
│   ├── lib/
│   │   ├── index.ts    # 主模块导出
│   │   ├── config.ts   # 配置文件管理
│   │   └── commands.ts # 命令实现
│   └── types/
│       └── index.ts    # 类型定义
├── dist/               # 编译后的 JavaScript 文件
├── package.json        # NPM 包配置
├── tsconfig.json       # TypeScript 配置
├── install.sh          # 手动安装脚本
├── uninstall.sh        # 手动卸载脚本
├── acm                 # Bash 版本脚本
└── README.md           # 文档
```