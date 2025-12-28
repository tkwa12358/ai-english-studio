# AI English Club 安装部署文档

## 1. 项目简介
AI English Club 是一个基于 React + Vite + Supabase 的英语学习平台，支持视频学习、单词本、发音评测等功能。

## 2. 环境要求
- Node.js (建议 v18+)
- npm 或 yarn
- Supabase 账户及项目

## 3. 安装步骤

### 3.1 克隆项目
```bash
git clone git@github.com:tkwa12358/newenglish.git
cd newenglish
```

### 3.2 安装依赖
```bash
npm install
```

### 3.3 配置环境变量
在项目根目录创建 `.env` 文件，内容参考如下：
```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名Key
```

## 4. 数据库配置

### 4.1 同步基础表结构
项目使用 Supabase Migrations 管理表结构。在安装好 Supabase CLI 后，运行：
```bash
supabase link --project-ref 你的项目ID
supabase db push
```
或者手动将 `supabase/migrations` 下的 `.sql` 文件按时间顺序在 Supabase SQL Editor 中执行。

### 4.2 导入单词词库
词库文件位于 `data/dictionary` 目录下。

#### 方式一：使用 SQL 脚本导入（推荐）
在 Supabase SQL Editor 中执行 `data/dictionary/sql/import_dict.sql` 中的内容。
> 注意：SQL 文件较大，如果 SQL Editor 限制大小，请使用 `psql` 工具：
> ```bash
> psql -h db.xxxx.supabase.co -U postgres -d postgres -f data/dictionary/sql/import_dict.sql
> ```

#### 方式二：使用 JSON 文件重新生成
如果你需要修改导入逻辑，可以使用 `scripts/generate-dict-sql.cjs` 脚本：
1. 修改脚本中的 `DICT_DIR` 为 `data/dictionary/json` 的绝对路径。
2. 运行脚本：`node scripts/generate-dict-sql.cjs`
3. 产生的 `import_dict.sql` 即可用于导入。

## 5. 运行项目
```bash
npm run dev
```

## 6. 开发建议
- 评测功能依赖于 Supabase Edge Functions，请确保本地配置了相应的 API Key（如 Azure Speech 或 腾讯 SOE）。
- 离线字典缓存通过 `indexedDB` 实现，初次加载词库记录后会自动缓存。
