import { useState } from "react";
import { exportHistory, downloadExport, importHistory } from "../services/dataPort";

const DataPortPanel: React.FC = () => {
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleExport = () => {
    try {
      const data = exportHistory();
      downloadExport(data);
      showMsg("success", `已导出 ${data.history.length} 条历史会话`);
    } catch {
      showMsg("error", "导出失败");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const result = importHistory(text);
        if (result.success) {
          showMsg("success", `导入成功！${result.count} 条历史会话已恢复，请刷新页面。`);
        } else {
          showMsg("error", result.error || "导入失败");
        }
      } catch {
        showMsg("error", "文件读取失败");
      }
    };
    input.click();
  };

  return (
    <div className="settings-panel">
      {msg && <div className={`prompt-editor-msg ${msg.type}`}>{msg.text}</div>}

      <div className="input-field">
        <label>导出历史会话</label>
        <p className="settings-panel-desc">
          将所有历史会话导出为 JSON 文件，用于备份或迁移。
        </p>
        <button className="btn-save" onClick={handleExport}>
          导出
        </button>
      </div>

      <div className="input-field" style={{ marginTop: 28 }}>
        <label>导入历史会话</label>
        <p className="settings-panel-desc">
          从之前导出的文件恢复历史会话。导入将覆盖当前历史记录。
        </p>
        <button className="btn-reset" onClick={handleImport} style={{ borderColor: "#c75a2c", color: "#c75a2c" }}>
          从文件导入
        </button>
      </div>
    </div>
  );
};

export default DataPortPanel;
