# 考古探方三维记录平台

一个专业的考古数字化工具，用于记录、可视化和管理考古发掘现场的探方数据。

## 功能特性

### 1. 探方模型生成
- 输入探方测量数据（长、宽、深）
- 自动生成三维探方模型
- Three.js实时渲染
- 支持旋转、缩放、平移交互

### 2. 地层编辑
- 添加/删除地层
- 设置地层颜色和属性
- 调整地层顺序
- 实时预览地层剖面图

### 3. 遗物标注
- 在三维模型上标记遗物位置
- 输入遗物详细信息（名称、类型、描述）
- 关联到对应地层
- 三维坐标精确记录

### 4. 照片管理
- 上传发掘现场照片
- 关联照片到探方、地层或遗物
- 照片预览和分类筛选
- 支持大图查看

### 5. 数据分析
- 地层厚度分布图表
- 遗物类型统计饼图
- 各地层遗物数量对比
- 数据报告导出

## 技术栈

### 前端
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **TailwindCSS 3** - 样式框架
- **Three.js** - 3D渲染引擎
- **@react-three/fiber** - React Three.js绑定
- **@react-three/drei** - Three.js工具库
- **Recharts** - 图表库
- **React Router** - 路由管理
- **Zustand** - 状态管理
- **Lucide React** - 图标库

### 后端
- **Express.js** - Web框架
- **TypeScript** - 类型安全
- **better-sqlite3** - SQLite数据库
- **Multer** - 文件上传处理
- **CORS** - 跨域支持

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

- 前端地址: http://localhost:5173
- 后端地址: http://localhost:3001

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run check
```

## 项目结构

```
├── api/                    # 后端代码
│   ├── routes/            # API路由
│   │   ├── trenches.ts    # 探方API
│   │   ├── strata.ts      # 地层API
│   │   ├── artifacts.ts   # 遗物API
│   │   └── photos.ts      # 照片API
│   ├── db.ts              # 数据库配置
│   ├── app.ts             # Express应用
│   └── server.ts          # 服务器入口
├── src/                    # 前端代码
│   ├── components/        # 组件
│   │   └── Layout.tsx     # 布局组件
│   ├── pages/             # 页面
│   │   ├── TrenchList.tsx     # 探方列表
│   │   ├── TrenchView.tsx     # 三维视图
│   │   ├── StrataEditor.tsx   # 地层编辑
│   │   ├── ArtifactMarker.tsx # 遗物标注
│   │   ├── PhotoGallery.tsx   # 照片管理
│   │   └── Analytics.tsx      # 数据分析
│   ├── services/          # API服务
│   │   └── api.ts
│   ├── types/             # 类型定义
│   │   └── index.ts
│   ├── App.tsx            # 应用入口
│   └── main.tsx           # 渲染入口
├── data/                   # 数据库文件
├── uploads/                # 上传的照片
├── .trae/documents/       # 项目文档
└── package.json
```

## API接口

### 探方 (Trenches)
- `GET /api/trenches` - 获取探方列表
- `POST /api/trenches` - 创建探方
- `GET /api/trenches/:id` - 获取探方详情
- `PUT /api/trenches/:id` - 更新探方
- `DELETE /api/trenches/:id` - 删除探方

### 地层 (Strata)
- `GET /api/trenches/:id/strata` - 获取地层列表
- `POST /api/strata` - 创建地层
- `PUT /api/strata/:id` - 更新地层
- `DELETE /api/strata/:id` - 删除地层

### 遗物 (Artifacts)
- `GET /api/trenches/:id/artifacts` - 获取遗物列表
- `POST /api/artifacts` - 创建遗物
- `PUT /api/artifacts/:id` - 更新遗物
- `DELETE /api/artifacts/:id` - 删除遗物

### 照片 (Photos)
- `GET /api/trenches/:id/photos` - 获取照片列表
- `POST /api/photos` - 上传照片
- `DELETE /api/photos/:id` - 删除照片

## 使用说明

1. **创建探方**: 在探方列表页点击"新建探方"，输入名称、位置和尺寸
2. **添加地层**: 进入地层编辑页面，添加不同深度的地层，设置颜色和描述
3. **标注遗物**: 在遗物标注页面，添加遗物并设置三维坐标位置
4. **上传照片**: 在照片管理页面，上传现场照片并关联到对应地层或遗物
5. **查看三维模型**: 在三维视图页面，查看探方的3D模型，点击地层和遗物查看详情
6. **数据分析**: 在数据分析页面，查看各种统计图表和导出报告

## 设计特色

- **考古主题配色**: 土褐色系为主色调，体现考古专业特色
- **清晰的信息层次**: 左侧导航 + 主内容区 + 右侧详情面板
- **直观的3D交互**: Three.js实现的探方模型，支持多角度查看
- **响应式设计**: 适配不同屏幕尺寸
- **数据可视化**: 使用Recharts展示地层和遗物的统计数据

## 许可证

MIT
