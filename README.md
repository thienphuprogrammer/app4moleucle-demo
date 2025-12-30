# CHEM.AI - Text-Molecule Translation & Interactive Molecular Visualization Platform

## 📋 Mô tả dự án

CHEM.AI là một nền tảng web để dịch văn bản sang phân tử và trực quan hóa phân tử 3D tương tác. Ứng dụng cho phép người dùng:

- **Text-to-Molecule**: Tạo cấu trúc phân tử từ mô tả văn bản tự nhiên
- **3D Visualization**: Xem phân tử dưới dạng 3D tương tác với 3Dmol.js
- **JSME Editor**: Vẽ phân tử 2D và xem preview 3D realtime
- **Multi-Model Comparison**: So sánh kết quả từ nhiều model AI
- **Knowledge Chatbot**: Hỏi đáp về hóa học với AI (GPT-4o)
- **Molecule-to-Text**: Mô tả phân tử bằng ngôn ngữ tự nhiên

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Next.js + React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │  Knowledge  │  │  Experiments/Sim    │  │
│  │  - Generator│  │  - Chatbot  │  │  - Lab Management   │  │
│  │  - JSME     │  │  - Q&A      │  │  - Docking Sim      │  │
│  │  - 3D View  │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST API
┌────────────────────────────┴────────────────────────────────┐
│                        BACKEND                               │
│                     (FastAPI + Python)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Molecules  │  │  Knowledge  │  │  Experiments        │  │
│  │  - Generate │  │  - Chat     │  │  - CRUD             │  │
│  │  - 3D SDF   │  │  - Mol2Text │  │  - Simulation       │  │
│  │  - History  │  │             │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────┬───────────┘  │
│         │                │                    │              │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌─────────┴───────────┐  │
│  │   RDKit     │  │  LiteLLM    │  │      MongoDB        │  │
│  │ (Chemistry) │  │  (GPT-4o)   │  │    (Database)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
/app/
├── backend/                    # FastAPI Backend
│   ├── server.py              # Entry point - khởi tạo FastAPI app
│   ├── models.py              # Pydantic models cho request/response
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (MONGO_URL, API keys)
│   ├── routes/                # API Routes
│   │   ├── molecule_routes.py # /api/molecules/* endpoints
│   │   ├── knowledge_routes.py# /api/knowledge/* endpoints  
│   │   ├── experiment_routes.py# /api/experiments/* endpoints
│   │   └── simulation_routes.py# /api/simulation/* endpoints
│   └── services/              # Business Logic
│       ├── molecule_service.py# Xử lý tạo phân tử
│       ├── model_clients.py   # Clients cho AI models
│       └── llm_service.py     # LLM integration (GPT-4o)
│
├── frontend/                   # Next.js Frontend
│   ├── package.json           # Node.js dependencies
│   ├── .env                   # Environment (REACT_APP_BACKEND_URL)
│   ├── next.config.js         # Next.js configuration
│   ├── tailwind.config.ts     # Tailwind CSS config
│   └── src/
│       ├── app/               # Next.js App Router
│       │   ├── layout.tsx     # Root layout
│       │   └── page.tsx       # Homepage (Dashboard)
│       ├── components/        # Reusable Components
│       │   ├── layout/        # Header, Sidebar, MainLayout
│       │   ├── molecules/     # JSMEEditor, Molecule3DViewer, ProStructureEditor
│       │   ├── ui/            # Button, Input, Tabs, etc.
│       │   └── providers/     # ThemeProvider
│       ├── features/          # Page Features
│       │   ├── dashboard/     # DashboardPage - Text-to-Mol & Editor
│       │   ├── knowledge/     # KnowledgePage - Chatbot
│       │   ├── experiments/   # ExperimentsPage - Lab management
│       │   └── simulation/    # SimulationPage - Docking
│       ├── lib/               # Utilities
│       │   ├── api.ts         # API client (axios)
│       │   ├── types.ts       # TypeScript types
│       │   └── utils.ts       # Helper functions
│       └── hooks/             # Custom React hooks
│
├── scripts/                    # Utility Scripts
│   ├── install.sh             # Cài đặt dependencies
│   ├── start.sh               # Khởi động servers
│   └── dev.sh                 # Development mode
│
├── tests/                      # Test files
├── docs/                       # Documentation
└── README.md                   # File này
```

---

## 🔧 Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.110.1 | Web framework |
| Uvicorn | 0.25.0 | ASGI server |
| MongoDB | 4.5+ | Database |
| Motor | 3.3.1 | Async MongoDB driver |
| RDKit | 2025.9.3 | Chemistry toolkit (SMILES → 3D) |
| LiteLLM | 1.80.11 | LLM integration (GPT-4o) |
| aiohttp | 3.13.2 | Async HTTP client |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 14.1.0 | React framework |
| React | 18.2.0 | UI library |
| TypeScript | 5.3.3 | Type safety |
| Tailwind CSS | 3.4.1 | Styling |
| 3Dmol.js | 2.0.6 | 3D molecular visualization |
| JSME | 0.0.9 | 2D molecular editor |
| Framer Motion | 11.0.5 | Animations |
| Axios | 1.6.7 | HTTP client |
| Sonner | 1.4.0 | Toast notifications |

---

## 🚀 Hướng dẫn cài đặt & chạy

### Yêu cầu hệ thống
- Node.js 18+ và Yarn
- Python 3.11+
- MongoDB 4.5+
- Git

### Cách 1: Sử dụng scripts (Khuyến nghị)

```bash
# Clone repository
git clone <repository-url>
cd app

# Cài đặt dependencies
chmod +x scripts/*.sh
./scripts/install.sh

# Chạy ứng dụng
./scripts/start.sh
```

### Cách 2: Cài đặt thủ công

#### Bước 1: Cài đặt Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Chỉnh sửa .env với các giá trị phù hợp
```

#### Bước 2: Cài đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
yarn install

# Tạo file .env
cp .env.example .env
# Chỉnh sửa .env với các giá trị phù hợp
```

#### Bước 3: Khởi động MongoDB

```bash
# Sử dụng Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc cài đặt local MongoDB
mongod --dbpath /data/db
```

#### Bước 4: Chạy ứng dụng

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend  
cd frontend
yarn dev
```

---

## 🌐 API Endpoints

### Molecules API (`/api/molecules`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/generate` | Tạo phân tử từ văn bản |
| GET | `/3d?smiles=<SMILES>` | Lấy cấu trúc 3D (SDF format) |
| GET | `/history` | Lịch sử tạo phân tử |
| GET | `/{id}` | Chi tiết một phân tử |

### Knowledge API (`/api/knowledge`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/chat` | Chat với AI về hóa học |
| POST | `/mol2text` | Mô tả phân tử từ SMILES |

### Experiments API (`/api/experiments`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách experiments |
| POST | `/` | Tạo experiment mới |
| GET | `/{id}` | Chi tiết experiment |
| DELETE | `/{id}` | Xóa experiment |

### Simulation API (`/api/simulation`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/dock` | Chạy molecular docking |
| GET | `/targets` | Danh sách target proteins |

---

## ⚙️ Cấu hình Environment Variables

### Backend (.env)

```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/chemdb

# OpenAI API Key (cho chatbot & mol2text)
OPENAI_API_KEY=sk-xxxxx
# hoặc sử dụng Emergent LLM Key
EMERGENT_LLM_KEY=ek-xxxxx

# Optional: External Model APIs
YOUR_MODEL_URL=http://localhost:5001
MOLT5_URL=http://localhost:5002
CHEMBERTA_URL=http://localhost:5003
```

### Frontend (.env)

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 📱 Hướng dẫn sử dụng

### 1. Dashboard - Text to Molecule

1. Mở trang chủ (Dashboard)
2. Chọn tab **GENERATOR**
3. Nhập mô tả phân tử vào ô văn bản (VD: "aspirin molecule")
4. Chọn các model AI muốn sử dụng
5. Click **Generate Molecule**
6. Xem kết quả 3D và so sánh các model

### 2. JSME Editor

1. Chọn tab **EDITOR** trên header
2. Sử dụng công cụ vẽ trong panel **2D DESIGNER**
3. Xem preview 3D realtime trong panel **3D PREVIEW**
4. Copy SMILES string bằng nút **COPY**

### 3. SMILES Input

1. Trong tab GENERATOR, chọn **SMILES Input**
2. Nhập SMILES string (VD: `CCO` cho ethanol)
3. Click **Visualize SMILES**

### 4. Knowledge Chatbot

1. Vào trang **Knowledge Base**
2. Đặt câu hỏi về hóa học
3. AI sẽ trả lời dựa trên kiến thức chuyên môn

---

## 🧪 Testing

```bash
# Test Backend APIs
python backend_test.py

# Test focused endpoints
python focused_backend_test.py

# Frontend tests
cd frontend && yarn test
```

---

## 🐛 Troubleshooting

### Lỗi "Module not found"
```bash
cd backend
pip install -r requirements.txt
```

### Lỗi MongoDB connection
```bash
# Kiểm tra MongoDB đang chạy
mongosh --eval "db.runCommand({ping:1})"
```

### Lỗi CORS
Đảm bảo `REACT_APP_BACKEND_URL` trong frontend/.env đúng với địa chỉ backend.

### Lỗi 3D không hiển thị
3Dmol.js cần SMILES hợp lệ. Kiểm tra SMILES string có đúng format.

---

## 📄 License

MIT License

---

## 👥 Contributors

Built with ❤️ by CHEM.AI Team
