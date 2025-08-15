#!/usr/bin/env node

import { Command } from 'commander';
const program = new Command();
import { Commands } from '../lib/commands';

const commands = new Commands();

program
    .name('acm')
    .description('ACM (claude code auth manager) - 类似 nvm/nrm 的 AI API 配置切换工具')
    .version('1.0.0');

program
    .command('use <alias>')
    .description('切换到指定的配置')
    .action((alias: string) => {
        commands.use(alias);
    });

program
    .command('list')
    .alias('ls')
    .description('显示所有可用配置')
    .action(() => {
        commands.list();
    });

program
    .command('add <alias> <token> <url> [type]')
    .description('添加新配置')
    .action((alias: string, token: string, url: string, type?: "KEY" | "TOKEN") => {
        commands.add(alias, token, url, type);
    });

program
    .command('remove <alias>')
    .alias('rm')
    .description('删除指定配置')
    .action((alias: string) => {
        commands.remove(alias);
    });

program
    .command('current')
    .description('显示当前使用的配置')
    .action(() => {
        commands.current();
    });


program
    .command('help', { isDefault: false })
    .description('显示帮助信息')
    .action(() => {
        commands.help();
    });

if (process.argv.length <= 2) {
    commands.help();
    process.exit(0);
}

program.parse(process.argv);