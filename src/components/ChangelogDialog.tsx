import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { GitCommit, Clock, User } from 'lucide-react'
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

// 提交类型对应的颜色
const typeColors: Record<string, string> = {
  feat: 'bg-green-500/10 text-green-600 border-green-500/20',
  fix: 'bg-red-500/10 text-red-600 border-red-500/20',
  docs: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  style: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  refactor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  perf: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  test: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  chore: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  ci: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  build: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  revert: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  other: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
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
                    {dateCommits.map((commit) => (
                      <div
                        key={commit.hash}
                        className="group relative bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${
                              typeColors[commit.type] || typeColors.other
                            }`}
                          >
                            {commit.typeLabel}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                              {commit.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
                      </div>
                    ))}
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
