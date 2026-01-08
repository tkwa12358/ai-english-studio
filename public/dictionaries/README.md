# 词库资源

本目录包含各类英语词汇表，用于预填充单词缓存。

## 词库来源

数据来源于以下开源项目：
- [qwerty-learner](https://github.com/RealKai42/qwerty-learner) - CET4/CET6词库
- [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary) - 四六级、考研词库
- [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT) - 77万词条英中词典

## 词库列表

| 文件名 | 描述 | 单词数量 |
|--------|------|----------|
| cet4.json | 大学英语四级词汇 | ~2600 |
| cet6.json | 大学英语六级词汇 | ~2300 |
| junior.json | 初中英语词汇 | ~1500 |
| senior.json | 高中英语词汇 | ~3500 |
| toefl.json | 托福核心词汇 | ~4000 |
| common.json | 常用基础词汇 | ~3000 |

## 数据格式

每个JSON文件包含单词数组，格式如下：

```json
[
  {
    "word": "example",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "translation": "例子，实例",
    "definitions": [
      {
        "partOfSpeech": "noun",
        "definition": "a thing characteristic of its kind"
      }
    ]
  }
]
```

## 导入方式

### 方式一：通过 API 导入

调用后端 API 接口：

```bash
curl -X POST \
  'http://localhost:3000/api/admin/import-dictionary' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"dictionary": "cet4"}'
```

### 方式二：通过 SQL 脚本导入

在 SQLite 数据库中执行导入脚本：

```bash
cd backend
npm run import:dict
```

## 许可证

词库数据遵循各原始项目的开源许可证。
