/// <reference types="vite/client" />

interface GitCommit {
  hash: string
  date: string
  message: string
  type: string
  typeLabel: string
  content: string
  author: string
}

declare const __GIT_COMMIT_HASH__: string;
declare const __GIT_COMMITS__: GitCommit[];
