import chalk from 'chalk';
import { ConfigManager } from './config';

export class Commands {
    private configManager: ConfigManager;

    constructor() {
        this.configManager = new ConfigManager();
    }

    public list(): void {
        try {
            const configs = this.configManager.getAllConfigs();

            console.log(chalk.cyan('可用配置:'));
            const headers = '别名'.padEnd(20) +
                           '类型'.padEnd(15) +
                           'API密钥(前15位)'.padEnd(20) +
                           'API地址';
            console.log(chalk.gray(headers));
            console.log(chalk.gray('------------------------------------------------------------'));

            configs.forEach(config => {
                const tokenPreview = config.token.substring(0, 15) + '...';
                console.log(
                    config.alias.padEnd(20) +
                    config.name.padEnd(15) +
                    tokenPreview.padEnd(20) +
                    config.url
                );
            });
        } catch (error) {
            console.error(chalk.red('错误:'), (error as Error).message);
            process.exit(1);
        }
    }

    public use(alias: string): void {
        if (!alias) {
            console.error(chalk.red('错误: 请指定配置别名'));
            console.log('使用 \'acm list\' 查看可用配置');
            process.exit(1);
        }

        try {
            const config = this.configManager.getConfig(alias);

            if (!config) {
                console.error(chalk.red(`错误: 未找到配置 '${alias}'`));
                console.log('使用 \'acm list\' 查看可用配置');
                process.exit(1);
            }

            this.configManager.setCurrentConfig(config);

            console.log(chalk.green(`已切换到: ${config.alias}`));
            console.log(chalk.gray(`API地址: ${config.url}`));
            console.log(chalk.gray(`密钥: ${config.token.substring(0, 15)}...`));
        } catch (error) {
            console.error(chalk.red('错误:'), (error as Error).message);
            process.exit(1);
        }
    }

    public add(alias: string, token: string, url: string, type?: string): void {
        if (!alias || !token || !url) {
            console.error(chalk.red('错误: 参数不完整'));
            console.log('用法: acm add <alias> <name> <token> <url>');
            process.exit(1);
        }

        let name = 'Claude';

        // Determine key type based on manual specification or URL rules
        let keyType = this.determineKeyType(url, type);

        try {
            this.configManager.addConfig(alias, name, token, url, keyType);
            console.log(chalk.green(`已添加配置: ${name} (${alias})`));
        } catch (error) {
            console.error(chalk.red('错误:'), (error as Error).message);
            process.exit(1);
        }
    }

    private determineKeyType(url: string, manualType?: string): 'KEY' | 'TOKEN' {
        // If manually specified, validate and use it
        if (manualType) {
            const normalizedType = manualType.toLowerCase();
            if (['key', 'k'].includes(normalizedType)) {
                return 'KEY';
            } else if (['token', 't'].includes(normalizedType)) {
                return 'TOKEN';
            }
        }

        // Built-in URL rules based on feature.md
        const tokenUrls = [
            'https://code.wenwen-ai.com',
            'https://api.aicodewith.com'
        ];

        const keyUrls = [
            'https://api.aicodemirror.com/api/claudecode',
            'https://gaccode.com/claudecode'
        ];

        if (tokenUrls.includes(url)) {
            return 'TOKEN';
        } else if (keyUrls.includes(url)) {
            return 'KEY';
        }

        // Default to TOKEN for unknown URLs
        return 'TOKEN';
    }

    public remove(alias: string): void {
        if (!alias) {
            console.error(chalk.red('错误: 请指定要删除的配置别名'));
            process.exit(1);
        }

        try {
            const removedConfig = this.configManager.removeConfig(alias);
            console.log(chalk.green(`已删除配置: ${removedConfig.name} (${alias})`));
        } catch (error) {
            console.error(chalk.red('错误:'), (error as Error).message);
            process.exit(1);
        }
    }

    public current(): void {
        try {
            const currentConfig = this.configManager.getCurrentConfig();

            if (!currentConfig) {
                console.log(chalk.yellow('当前没有设置任何配置'));
                console.log('使用 \'acm use <alias>\' 设置配置');
                return;
            }

            console.log(chalk.cyan('当前配置:'));
            console.log(chalk.gray(`别名: ${currentConfig.alias}`));
            console.log(chalk.gray(`类型: ${currentConfig.name}`));
            console.log(chalk.gray(`API地址: ${currentConfig.url}`));
            console.log(chalk.gray(`密钥: ${currentConfig.token.substring(0, 15)}...`));

            if (currentConfig.isActive) {
                console.log(chalk.green('状态: 已激活 ✓'));
            } else {
                console.log(chalk.yellow(`状态: 未激活 (请运行 'acm use ${currentConfig.alias}' 激活)`));
            }
        } catch (error) {
            console.error(chalk.red('错误:'), (error as Error).message);
            process.exit(1);
        }
    }

    public help(): void {
        console.log(chalk.cyan.bold('ACM (claude code auth manager) - 类似 nvm/nrm 的 AI API 配置切换工具'));
        console.log();
        console.log(chalk.yellow('用法:'));
        console.log('    acm <command> [arguments]');
        console.log();
        console.log(chalk.yellow('命令:'));
        console.log('    use <alias>              切换到指定的配置');
        console.log('    list                     显示所有可用配置');
        console.log('    add <alias> <token> <url> [key_type] 添加新配置');
        console.log('    remove <alias>           删除指定配置');
        console.log('    current                  显示当前使用的配置');
        console.log('    help                     显示此帮助信息');
        console.log();
        console.log(chalk.yellow('示例:'));
        console.log('    acm use kimi            # 切换到 kimi 配置');
        console.log('    acm list                # 查看所有配置');
        console.log('    acm add openai OpenAI sk-xxx https://api.openai.com');
        console.log('    acm remove openai       # 删除 openai 配置');
        console.log('    acm current             # 查看当前配置');
        console.log();
        console.log(chalk.yellow('配置文件位置:'));
        console.log('    ~/.claude/.claude_config        # 配置存储文件');
        console.log('    ~/.claude/.claude_current       # 当前配置记录文件');
    }

}