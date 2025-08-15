import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { Config, CurrentConfig } from '../types';

// Claude配置文件类型定义
interface ClaudeSettings {
    env: {
        ANTHROPIC_AUTH_TOKEN?: string;
        ANTHROPIC_BASE_URL?: string;
        CLAUDE_CODE_MAX_OUTPUT_TOKENS?: string;
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC?: number;
    };
    permissions: {
        allow: string[];
        deny: string[];
    };
}

export class ConfigManager {
    private configFile: string;
    private currentFile: string;
    private claudeSettingsFile: string;

    constructor() {
        this.configFile = path.join(os.homedir(),'.claude', '.claude_config');
        this.currentFile = path.join(os.homedir(), '.claude','.claude_current');
        this.claudeSettingsFile = path.join(os.homedir(), '.claude', 'settings.json');
    }

    /**
     * 获取Claude配置文件路径
     */
    private getClaudeSettingsPath(): string {
        return this.claudeSettingsFile;
    }

    /**
     * 读取Claude配置文件
     */
    private readClaudeSettings(): ClaudeSettings {
        const settingsPath = this.getClaudeSettingsPath();

        try {
            if (fs.existsSync(settingsPath)) {
                const content = fs.readFileSync(settingsPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.warn(`读取Claude配置文件失败: ${error}`);
        }

        // 返回默认配置结构
        return {
            env: {
                ANTHROPIC_AUTH_TOKEN: "",
                ANTHROPIC_BASE_URL: "",
                CLAUDE_CODE_MAX_OUTPUT_TOKENS: "32000",
                CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1
            },
            permissions: {
                allow: [],
                deny: []
            }
        };
    }

    /**
     * 写入Claude配置文件
     */
    private writeClaudeSettings(settings: ClaudeSettings): void {
        const settingsPath = this.getClaudeSettingsPath();
        const settingsDir = path.dirname(settingsPath);

        try {
            // 确保目录存在
            if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true });
            }

            // 写入配置文件
            const content = JSON.stringify(settings, null, 2);
            fs.writeFileSync(settingsPath, content, 'utf8');
        } catch (error) {
            throw new Error(`写入Claude配置文件失败: ${error}`);
        }
    }

    /**
     * 更新Claude配置文件中的认证信息
     */
    private updateClaudeSettings(token: string, baseUrl: string): void {
        const settings = this.readClaudeSettings();

        // 更新认证信息
        settings.env.ANTHROPIC_AUTH_TOKEN = token;
        settings.env.ANTHROPIC_BASE_URL = baseUrl;

        // 写入更新后的配置
        this.writeClaudeSettings(settings);
    }

    public initConfig(): void {
        if (!fs.existsSync(this.configFile)) {
            const defaultConfig = '';

            fs.writeFileSync(this.configFile, defaultConfig, 'utf8');
            console.log(`已创建默认配置文件: ${this.configFile}`);
            console.log('请编辑此文件，填入您的真实 API 密钥');
        }
    }

    public getAllConfigs(): Config[] {
        this.initConfig();
        const content = fs.readFileSync(this.configFile, 'utf8');
        return content.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split('|');
                const [alias, name, token, url] = parts;
                const type = parts[4] as 'KEY' | 'TOKEN' || 'TOKEN'; // Default to TOKEN for backward compatibility
                return { alias, name, token, url, type };
            });
    }

    public getConfig(alias: string): Config | undefined {
        const configs = this.getAllConfigs();
        return configs.find(config => config.alias === alias);
    }

    public addConfig(alias: string, name: string, token: string, url: string, keyType?: 'KEY' | 'TOKEN'): void {
        const configs = this.getAllConfigs();

        if (configs.find(config => config.alias === alias)) {
            throw new Error(`配置别名 '${alias}' 已存在`);
        }

        const newConfig = `${alias}|${name}|${token}|${url}|${keyType || 'TOKEN'}`;
        fs.appendFileSync(this.configFile, '\n' + newConfig, 'utf8');
    }

    public removeConfig(alias: string): Config {
        const configs = this.getAllConfigs();
        const configToRemove = configs.find(config => config.alias === alias);

        if (!configToRemove) {
            throw new Error(`配置 '${alias}' 不存在`);
        }

        const remainingConfigs = configs.filter(config => config.alias !== alias);
        const content = remainingConfigs.map(config =>
            `${config.alias}|${config.name}|${config.token}|${config.url}|${config.type || 'TOKEN'}`
        ).join('\n');

        fs.writeFileSync(this.configFile, content, 'utf8');

        if (fs.existsSync(this.currentFile)) {
            const currentContent = fs.readFileSync(this.currentFile, 'utf8');
            if (currentContent.startsWith(alias + '|')) {
                fs.unlinkSync(this.currentFile);
                console.log('当前配置已清除');
            }
        }

        return configToRemove;
    }

    private isWindows(): boolean {
        return os.platform() === 'win32';
    }

    private detectShell(): string {
        if (this.isWindows()) {
            // Windows 系统检测
            if (process.env.PSModulePath) {
                return 'powershell';
            } else if (process.env.COMSPEC && process.env.COMSPEC.includes('cmd')) {
                return 'cmd';
            } else {
                return 'powershell'; // 默认使用 PowerShell
            }
        }

        // Unix 系统检测
        const shell = process.env.SHELL || '';
        if (shell.includes('zsh')) {
            return 'zsh';
        } else if (shell.includes('bash')) {
            return 'bash';
        }

        // 备用检测方法
        if (process.env.ZSH_VERSION || process.env.ZSH_NAME) {
            return 'zsh';
        } else if (process.env.BASH_VERSION) {
            return 'bash';
        } else {
            return 'unknown';
        }
    }

    private getProfileFile(): string {
        const shellType = this.detectShell();
        const homeDir = os.homedir();

        if (this.isWindows()) {
            switch (shellType) {
                case 'powershell':
                    // PowerShell 配置文件路径
                    const documentsPath = path.join(homeDir, 'Documents');
                    const psPath = path.join(documentsPath, 'WindowsPowerShell');
                    if (!fs.existsSync(psPath)) {
                        fs.mkdirSync(psPath, { recursive: true });
                    }
                    return path.join(psPath, 'Microsoft.PowerShell_profile.ps1');
                case 'cmd':
                    // CMD 不支持配置文件，返回空字符串表示使用注册表方式
                    return '';
                default:
                    return path.join(homeDir, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
            }
        }

        // Unix 系统
        switch (shellType) {
            case 'zsh':
                return path.join(homeDir, '.zshrc');
            case 'bash':
                const bashProfile = path.join(homeDir, '.bash_profile');
                if (fs.existsSync(bashProfile)) {
                    return bashProfile;
                } else {
                    return path.join(homeDir, '.bashrc');
                }
            default:
                return path.join(homeDir, '.profile');
        }
    }

    private setWindowsEnvironmentVariable(key: string, value: string): void {
        try {
            // 使用 setx 命令设置用户级环境变量
            child_process.execSync(`setx ${key} "${value}"`, { stdio: 'pipe' });
        } catch (error) {
            console.error(`Failed to set Windows environment variable ${key}:`, error);
        }
    }

    private updateWindowsPowerShellConfig(config: Config, profileFile: string): void {
        let content = '';
        if (fs.existsSync(profileFile)) {
            content = fs.readFileSync(profileFile, 'utf8');
        }

        const envVarStart = '# Claude Code Environment Variables';
        const envVarEnd = '# End Claude Code Environment Variables';

        const startIndex = content.indexOf(envVarStart);
        const endIndex = content.indexOf(envVarEnd);

        const envVar = config.type === 'KEY' ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';
        const newEnvVars = `${envVarStart}
$env:ANTHROPIC_BASE_URL = "${config.url}"
$env:${envVar} = "${config.token}"
${envVarEnd}`;

        if (startIndex !== -1 && endIndex !== -1) {
            // 替换现有的环境变量配置
            const beforeConfig = content.substring(0, startIndex);
            const afterConfig = content.substring(endIndex + envVarEnd.length);
            content = beforeConfig + newEnvVars + afterConfig;
        } else {
            // 添加新的环境变量配置
            if (content && !content.endsWith('\n')) {
                content += '\n';
            }
            content += '\n' + newEnvVars + '\n';
        }

        fs.writeFileSync(profileFile, content, 'utf8');
    }

    private updateUnixShellConfig(config: Config, profileFile: string): void {
        let content = '';
        if (fs.existsSync(profileFile)) {
            content = fs.readFileSync(profileFile, 'utf8');
        }

        const envVarStart = '# Claude Code Environment Variables';
        const envVarEnd = '# End Claude Code Environment Variables';

        const startIndex = content.indexOf(envVarStart);
        const endIndex = content.indexOf(envVarEnd);

        const envVar = config.type === 'KEY' ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';
        const newEnvVars = `${envVarStart}
export ANTHROPIC_BASE_URL="${config.url}"
export ${envVar}="${config.token}"
${envVarEnd}`;

        if (startIndex !== -1 && endIndex !== -1) {
            // 替换现有的环境变量配置
            const beforeConfig = content.substring(0, startIndex);
            const afterConfig = content.substring(endIndex + envVarEnd.length);
            content = beforeConfig + newEnvVars + afterConfig;
        } else {
            // 添加新的环境变量配置
            if (content && !content.endsWith('\n')) {
                content += '\n';
            }
            content += '\n' + newEnvVars + '\n';
        }

        fs.writeFileSync(profileFile, content, 'utf8');
    }

    private setCurrentSessionEnvironmentVariables(config: Config): void {
        // 为当前 Node.js 进程设置环境变量（立即生效，acm 命令本身和子进程都能使用）
        const envVar = config.type === 'KEY' ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';

        // Clear both environment variables first
        delete process.env.ANTHROPIC_AUTH_TOKEN;
        delete process.env.ANTHROPIC_API_KEY;

        // Set the appropriate one
        process.env[envVar] = config.token;
        process.env.ANTHROPIC_BASE_URL = config.url;

        // 注意：Node.js 进程无法直接影响父 shell 的环境变量
        // 但我们保留这个设置，因为：
        // 1. 如果用户在脚本中调用 acm，这些变量会传递给子进程
        // 2. 当前 Node.js 进程可以访问这些变量
    }

    private generateSourceCommand(profileFile: string): string | null {
        if (this.isWindows()) {
            return null; // Windows 不支持 source 命令
        }

        const shell = process.env.SHELL || '';
        if (shell.includes('bash') || shell.includes('zsh')) {
            return `source "${profileFile}"`;
        }
        return null;
    }

    private createConvenientWrapper(config: Config): void {
        // 如果创建临时文件失败，回退到显示命令
        const envVar = config.type === 'KEY' ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';
        console.log(`💡 在当前终端运行以下命令立即生效：`);
        if (this.isWindows()) {
            console.log(`set ANTHROPIC_BASE_URL=${config.url}`);
            console.log(`set ${envVar}=${config.token}`);
        } else {
            console.log(`export ANTHROPIC_BASE_URL="${config.url}"`);
            console.log(`export ${envVar}="${config.token}"`);
        }
    }

    private updateShellConfig(config: Config): void {
        const profileFile = this.getProfileFile();
        const shellType = this.detectShell();

        // 首先设置当前会话的环境变量（立即生效）
        this.setCurrentSessionEnvironmentVariables(config);

        if (this.isWindows()) {
            if (shellType === 'cmd' || !profileFile) {
                // CMD 或无配置文件时，使用注册表设置系统环境变量
                const envVar = config.type === 'KEY' ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';
                this.setWindowsEnvironmentVariable('ANTHROPIC_BASE_URL', config.url);
                this.setWindowsEnvironmentVariable(envVar, config.token);
                console.log('已设置 Windows 系统环境变量（重启终端后生效）');
            } else {
                // PowerShell 配置文件
                this.updateWindowsPowerShellConfig(config, profileFile);
                console.log(`已更新 shell 配置文件: ${profileFile}`);
            }
        } else {
            // Unix 系统
            this.updateUnixShellConfig(config, profileFile);
            console.log(`已更新 shell 配置文件: ${profileFile}`);

            // 为其他终端提供 source 提示
            const sourceCmd = this.generateSourceCommand(profileFile);
            if (sourceCmd) {
                console.log(`💡 提示：新开窗口立即生效。由于限制在当前窗口生效需运行 \`source ${profileFile}\` 后才能立即生效`);
            }
        }

        // 创建便捷的激活方式
        // this.createConvenientWrapper(config);
    }

    public setCurrentConfig(config: Config): void {
        const configLine = `${config.alias}|${config.name}|${config.token}|${config.url}|${config.type || 'TOKEN'}`;
        fs.writeFileSync(this.currentFile, configLine, 'utf8');

        try {
            // 直接更新Claude配置文件
            this.updateClaudeSettings(config.token, config.url);
            console.log(`已更新Claude配置文件: ${this.claudeSettingsFile}`);
            console.log(`✅ ANTHROPIC_AUTH_TOKEN 和 ANTHROPIC_BASE_URL 已成功更新`);
        } catch (error) {
            console.error(`更新Claude配置文件失败: ${error}`);
            // 如果Claude配置文件更新失败，回退到原有的shell配置方式
            console.log('回退到shell配置方式...');
            this.updateShellConfig(config);
        }
    }

    public getCurrentConfig(): CurrentConfig | null {
        if (!fs.existsSync(this.currentFile)) {
            return null;
        }

        const content = fs.readFileSync(this.currentFile, 'utf8');
        const parts = content.split('|');
        const [alias, name, token, url] = parts;
        const type = parts[4] as 'KEY' | 'TOKEN' || 'TOKEN';

        const envVar = type === 'KEY' ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';
        const isActive = process.env[envVar] === token &&
                        process.env.ANTHROPIC_BASE_URL === url;

        return { alias, name, token, url, type, isActive };
    }
}