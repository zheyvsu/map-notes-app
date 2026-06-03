/**
 * 命令接口 - 用于实现撤销/重做功能
 */
export interface Command {
  /** 执行命令 */
  execute(): void;
  /** 撤销命令 */
  undo(): void;
  /** 命令描述（可选，用于调试） */
  description?: string;
}

/**
 * 宏命令 - 可以组合多个命令一起执行
 */
export class MacroCommand implements Command {
  private commands: Command[] = [];

  constructor(commands: Command[] = []) {
    this.commands = commands;
  }

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // 撤销时按相反顺序执行
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }

  get description(): string {
    return `Macro: ${this.commands.length} commands`;
  }
}
