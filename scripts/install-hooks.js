#!/usr/bin/env node

/**
 * 安装 Git 钩子
 * 将 .git-hooks 目录下的钩子复制到 .git/hooks 目录
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, chmodSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const hooksSourceDir = join(projectRoot, '.git-hooks')
const hooksTargetDir = join(projectRoot, '.git', 'hooks')

function installHooks() {
  console.log('正在安装 Git 钩子...')

  // 确保目标目录存在
  if (!existsSync(hooksTargetDir)) {
    mkdirSync(hooksTargetDir, { recursive: true })
  }

  // 确保源目录存在
  if (!existsSync(hooksSourceDir)) {
    console.error('错误: .git-hooks 目录不存在')
    process.exit(1)
  }

  // 复制所有钩子文件
  const hooks = readdirSync(hooksSourceDir)
  let installed = 0

  for (const hook of hooks) {
    const sourcePath = join(hooksSourceDir, hook)
    const targetPath = join(hooksTargetDir, hook)

    // 跳过非文件项
    if (!existsSync(sourcePath)) continue

    try {
      copyFileSync(sourcePath, targetPath)
      // 设置可执行权限（Unix 系统）
      try {
        chmodSync(targetPath, 0o755)
      } catch {
        // Windows 不需要设置权限
      }
      console.log(`✓ 已安装: ${hook}`)
      installed++
    } catch (error) {
      console.error(`✗ 安装失败 ${hook}:`, error.message)
    }
  }

  console.log(`\n共安装 ${installed} 个 Git 钩子`)
  console.log('现在每次提交后会自动生成并提交 changelog.json')
}

installHooks()
