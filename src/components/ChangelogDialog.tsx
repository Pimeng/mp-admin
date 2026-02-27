import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GitCommit, Clock, User, Sparkles, Bug, BookOpen, Palette, Hammer, Zap, FlaskConical, Wrench, Workflow, Package, RotateCcw, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface GitCommit {
  hash: string
  date: string
  message: string
  type: string
  typeLabel: string
  content: string
  author: string
}

interface ChangelogDialogProps {
  children: React.ReactNode
}

// 提交类型对应的图标
const typeIcons: Record<string, React.ReactNode> = {
  feat: <Sparkles className="h-4 w-4" />,
  fix: <Bug className="h-4 w-4" />,
  docs: <BookOpen className="h-4 w-4" />,
  style: <Palette className="h-4 w-4" />,
  refactor: <Hammer className="h-4 w-4" />,
  perf: <Zap className="h-4 w-4" />,
  test: <FlaskConical className="h-4 w-4" />,
  chore: <Wrench className="h-4 w-4" />,
  ci: <Workflow className="h-4 w-4" />,
  build: <Package className="h-4 w-4" />,
  revert: <RotateCcw className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
}

// 提交类型对应的颜色
const typeColors: Record<string, string> = {
  feat: 'text-green-600',
  fix: 'text-red-600',
  docs: 'text-blue-600',
  style: 'text-purple-600',
  refactor: 'text-yellow-600',
  perf: 'text-orange-600',
  test: 'text-pink-600',
  chore: 'text-gray-600',
  ci: 'text-cyan-600',
  build: 'text-indigo-600',
  revert: 'text-rose-600',
  other: 'text-slate-600',
}

export function ChangelogDialog({ children }: ChangelogDialogProps) {
  const commits: GitCommit[] = __GIT_COMMITS__

  // 过滤掉自动生成的 changelog 提交
  const filteredCommits = commits.filter(
    (commit) => !commit.message.includes('[auto]')
  )

  // 按日期分组提交
  const groupedCommits = filteredCommits.reduce((groups, commit) => {
    const date = new Date(commit.date)
    const dateKey = format(date, 'yyyy-MM-dd')
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(commit)
    return groups
  }, {} as Record<string, GitCommit[]>)

  // 获取排序后的日期（最新的在前）
  const sortedDates = Object.keys(groupedCommits).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            更新日志
          </DialogTitle>
          <DialogDescription>
            共 {filteredCommits.length} 次提交，按时间倒序排列
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-6">
            {sortedDates.map((dateKey) => {
              const dateCommits = groupedCommits[dateKey]
              const date = new Date(dateKey)

              return (
                <div key={dateKey} className="relative">
                  {/* 时间轴线条 */}
                  <div className="absolute left-3.5 top-8 bottom-0 w-px bg-border" />

                  {/* 日期标题 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {format(date, 'yyyy年MM月dd日', { locale: zhCN })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(date, 'EEEE', { locale: zhCN })}
                    </span>
                  </div>

                  {/* 提交列表 */}
                  <div className="ml-7 space-y-3">
                    {dateCommits.map((commit) => {
                      const icon = typeIcons[commit.type] || typeIcons.other
                      const colorClass = typeColors[commit.type] || typeColors.other

                      return (
                        <div
                          key={commit.hash}
                          className="group relative bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            {/* 第一行：类型 */}
                            <div className={`flex items-center gap-2 font-medium ${colorClass}`}>
                              {icon}
                              <span>{commit.typeLabel}</span>
                            </div>
                            {/* 第二行：内容 */}
                            <p className="text-sm text-foreground leading-relaxed pl-6">
                              {commit.content}
                            </p>
                            {/* 元信息 */}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground pl-6">
                              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {commit.hash}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {commit.author}
                              </span>
                              <span>
                                {format(
                                  new Date(commit.date),
                                  'HH:mm',
                                  { locale: zhCN }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {filteredCommits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <GitCommit className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无提交记录</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
