import { useState, useEffect, useCallback } from "react";
import { getAllImageIds, getImage, deleteImage } from "../services/imageStore";
import { getAllHistory } from "../services/historyStore";

const ImageManager: React.FC = () => {
  const [images, setImages] = useState<Array<{ id: string; data: string; size: number; createdAt: number; refs: string[] }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const ids = await getAllImageIds();
    const history = getAllHistory();
    const items: typeof images = [];

    for (const id of ids) {
      const img = await getImage(id);
      if (!img) continue;
      // 查找引用此图片的对话
      const refs: string[] = [];
      for (const e of history) {
        const hasRef = Object.values(e.inputs).some(v => v === id);
        if (hasRef) refs.push(e.title);
      }
      items.push({ id, data: img.data, size: img.size, createdAt: img.createdAt, refs });
    }
    items.sort((a, b) => b.createdAt - a.createdAt);
    setImages(items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await deleteImage(id);
    load();
  };

  const totalSize = images.reduce((s, i) => s + i.size, 0);
  const orphanCount = images.filter(i => i.refs.length === 0).length;

  return (
    <div className="settings-panel">
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>加载中...</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div className="dash-stat-card" style={{ flex: 1, minWidth: 120 }}>
              <div className="dash-stat-label">图片数量</div>
              <div className="dash-stat-value">{images.length}</div>
            </div>
            <div className="dash-stat-card" style={{ flex: 1, minWidth: 120 }}>
              <div className="dash-stat-label">存储占用</div>
              <div className="dash-stat-value">{(totalSize / 1024).toFixed(0)}KB</div>
            </div>
            <div className="dash-stat-card" style={{ flex: 1, minWidth: 120 }}>
              <div className="dash-stat-label">孤立图片</div>
              <div className="dash-stat-value" style={{ color: orphanCount > 0 ? "#e82127" : "#389e0d" }}>{orphanCount}</div>
              <div className="dash-stat-sub">无关联对话</div>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="history-empty">暂无图片</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {images.map(img => (
                <div key={img.id} style={{ width: 180, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
                  <img src={img.data} alt="" style={{ width: "100%", height: 120, objectFit: "cover", cursor: "pointer" }}
                    onClick={() => {
                      const w = window.open("", "_blank", "width=900,height=700");
                      if (w) { w.document.write(`<img src="${img.data}" style="max-width:100%;height:auto" />`); w.document.title = "图片预览"; }
                    }} title="点击查看原图" />
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>
                      {(img.size / 1024).toFixed(0)}KB · {new Date(img.createdAt).toLocaleString("zh-CN")}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--primary)", cursor: "pointer", marginBottom: 4 }}
                      onClick={() => {
                        const w = window.open("", "_blank", "width=900,height=700");
                        if (w) { w.document.write(`<img src="${img.data}" style="max-width:100%;height:auto" />`); w.document.title = "图片预览"; }
                      }}>查看原图</div>
                    {img.refs.length > 0 ? (
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", maxHeight: 40, overflow: "hidden" }}>
                        引用：{img.refs.slice(0, 2).join("、")}{img.refs.length > 2 ? ` 等${img.refs.length}条` : ""}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#e82127" }}>无引用（孤立）</div>
                    )}
                    <button className="btn-reset" style={{ fontSize: 10, marginTop: 6, width: "100%", padding: "2px 0" }}
                      onClick={() => { if (confirm("确定删除此图片？")) handleDelete(img.id); }}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageManager;
