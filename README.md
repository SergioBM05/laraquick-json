# ⚡ LaraQuick Architect
### Visual Laravel Schema Designer & Boilerplate Generator

**LaraQuick Architect** is a powerful, web-based tool designed to bridge the gap between database design and Laravel development. Stop writing repetitive migrations and models by hand—design them visually and export a production-ready ZIP in seconds.

🚀 **Live Demo:** [https://laraquicktool.com/](https://laraquicktool.com/)

---

## ✨ Features

- **🎨 Visual Node Editor**: Drag-and-drop interface to create and organize your database tables (powered by React Flow).
- **🔗 Smart Relationships**: 
    - Connect nodes to establish **1:N** relationships.
    - Single-click toggle to switch to **N:N (Many-to-Many)**, which automatically generates the required pivot tables following Laravel naming conventions.
- **📥 SQL Import**: Upload your existing `.sql` files to reverse-engineer your schema into a visual diagram instantly.
- **📦 Full Project Export**: Download a structured `.zip` file containing:
    - **Migrations**: Properly ordered with timestamps.
    - **Models**: Pre-filled with `$fillable` attributes.
    - **Controllers**: Basic CRUD boilerplate.
    - **Factories**: Ready-to-use with `fake()` data.
- **💻 Real-time Preview**: Inspect the generated PHP code for each file before exporting.

---

## 🛠️ Tech Stack

- **Frontend**: React.js & TypeScript
- **Styling**: Tailwind CSS
- **Workflow**: React Flow
- **Utilities**: JSZip, File-Saver, Lucide-React

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/laraquick-architect.git](https://github.com/YOUR_USERNAME/laraquick-architect.git)