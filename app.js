// app.js - Dashboard statis interaktif untuk Analisis Waktu FYP TikTok — @mlbb.cliperr
// Data sampel (bisa diimpor via CSV file input)
const SAMPLE_POSTS = [
  { date: "2025-10-01", slot: "Pagi", views: 1200, likes: 80, comments: 10, shares: 5, retention: 45 },
  { date: "2025-10-01", slot: "Siang", views: 3400, likes: 250, comments: 30, shares: 20, retention: 58 },
  { date: "2025-10-01", slot: "Sore", views: 2700, likes: 190, comments: 25, shares: 18, retention: 62 },
  { date: "2025-10-01", slot: "Malam", views: 5600, likes: 430, comments: 60, shares: 50, retention: 74 },

  { date: "2025-10-02", slot: "Pagi", views: 900, likes: 50, comments: 8, shares: 3, retention: 40 },
  { date: "2025-10-02", slot: "Siang", views: 2900, likes: 200, comments: 22, shares: 15, retention: 54 },
  { date: "2025-10-02", slot: "Sore", views: 2300, likes: 160, comments: 20, shares: 12, retention: 60 },
  { date: "2025-10-02", slot: "Malam", views: 4800, likes: 380, comments: 50, shares: 40, retention: 70 },

  { date: "2025-10-03", slot: "Pagi", views: 1500, likes: 110, comments: 13, shares: 6, retention: 48 },
  { date: "2025-10-03", slot: "Siang", views: 3200, likes: 230, comments: 28, shares: 18, retention: 56 },
  { date: "2025-10-03", slot: "Sore", views: 2500, likes: 170, comments: 21, shares: 14, retention: 63 },
  { date: "2025-10-03", slot: "Malam", views: 5100, likes: 400, comments: 55, shares: 45, retention: 73 },
];

const SLOTS = ["Pagi", "Siang", "Sore", "Malam"];
const COLORS = ["#2E8B57", "#3AA776", "#4FC3A1", "#7EE7C9"];

// Aggregate by slot
function aggregate(posts) {
  const agg = {};
  SLOTS.forEach(s => agg[s] = { slot: s, totalViews:0, likes:0, comments:0, shares:0, retentionSum:0, count:0 });
  posts.forEach(p => {
    if(!agg[p.slot]) return;
    agg[p.slot].totalViews += Number(p.views || 0);
    agg[p.slot].likes += Number(p.likes || 0);
    agg[p.slot].comments += Number(p.comments || 0);
    agg[p.slot].shares += Number(p.shares || 0);
    agg[p.slot].retentionSum += Number(p.retention || 0);
    agg[p.slot].count += 1;
  });
  const result = SLOTS.map(s => {
    const a = agg[s];
    const avgER = a.totalViews>0 ? ((a.likes + a.comments + a.shares)/a.totalViews)*100 : 0;
    const avgRetention = a.count>0 ? a.retentionSum / a.count : 0;
    const combined = (avgER + avgRetention)/2;
    return { slot: s, avgER: +avgER.toFixed(2), avgRetention: +avgRetention.toFixed(2), combined: +combined.toFixed(2), totalViews: a.totalViews };
  });
  return result;
}

// Render list and ranking
function renderList(summary) {
  const el = document.getElementById("slotList");
  el.innerHTML = "";
  // rank by combined desc
  const ranked = [...summary].sort((a,b)=>b.combined - a.combined);
  ranked.forEach((r, idx) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div class="dot" style="background:${COLORS[SLOTS.indexOf(r.slot)]}"></div>
        <div>
          <div style="font-size:13px">${r.slot}</div>
          <div style="font-size:12px;color:${'#6b7280'}">ER: ${r.avgER}% • Retention: ${r.avgRetention}%</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700">${r.totalViews.toLocaleString()}</div>
        <div style="font-size:12px;color:#6b7280">#${idx+1} • ${r.combined}</div>
      </div>`;
    el.appendChild(row);
  });
}

// Create charts with Chart.js
let barChart, pieChart;
function drawCharts(summary) {
  const barCtx = document.getElementById("barChart").getContext("2d");
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  const labels = summary.map(s=>s.slot);
  const erData = summary.map(s=>s.avgER);
  const retData = summary.map(s=>s.avgRetention);
  const combined = summary.map(s=>s.combined);

  if(barChart) barChart.destroy();
  if(pieChart) pieChart.destroy();

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Engagement Rate (%)", data: erData, backgroundColor: COLORS, yAxisID: 'y' },
        { label: "Retention (%)", data: retData, backgroundColor: COLORS.map((c,i)=>shade(c,-10)), yAxisID: 'y' }
      ]
    },
    options: {
      responsive:true,
      plugins: { tooltip:{mode:'index',intersect:false}, legend:{position:'top'} },
      scales: {
        x: { stacked: false },
        y: { beginAtZero:true, position:'left', title:{display:true,text:'Persentase (%)'} }
      }
    }
  });

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: { labels, datasets:[{ data: combined, backgroundColor: COLORS }]},
    options: { responsive:true, plugins:{ tooltip:{enabled:true} } }
  });

  // legend
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  summary.forEach((s,i)=>{
    const item = document.createElement("div");
    item.className = "legend-item";
    item.style.marginBottom = "6px";
    item.innerHTML = `<div class="dot" style="background:${COLORS[i]};width:14px;height:14px;border-radius:3px"></div>
      <div style="min-width:80px">${s.slot}</div>
      <div style="color:#6b7280">ER: ${s.avgER}%</div>
      <div style="margin-left:auto;font-weight:700">${s.combined}</div>`;
    legend.appendChild(item);
  });
}

// utility: shade hex color by percent (positive lighter, negative darker)
function shade(hex, percent) {
  const f = hex.slice(1), t = percent<0?0:255, p = Math.abs(percent)/100;
  const R = parseInt(f.substring(0,2),16), G = parseInt(f.substring(2,4),16), B = parseInt(f.substring(4,6),16);
  const newR = Math.round((t - R)*p) + R;
  const newG = Math.round((t - G)*p) + G;
  const newB = Math.round((t - B)*p) + B;
  return `rgb(${newR},${newG},${newB})`;
}

// CSV parser (simple)
function parseCSV(text) {
  const rows = text.split(/\r?\n/).map(r=>r.trim()).filter(Boolean);
  if(rows.length<2) return [];
  const data = rows.slice(1).map(r=>{
    const cols = r.split(",");
    return { date: cols[0], slot: cols[1], views:+cols[2]||0, likes:+cols[3]||0, comments:+cols[4]||0, shares:+cols[5]||0, retention:+cols[6]||0 };
  });
  return data;
}

// initialize
let posts = SAMPLE_POSTS.slice();
function refresh() {
  const summary = aggregate(posts);
  renderList(summary);
  drawCharts(summary);
}

document.getElementById("csvInput").addEventListener("change", (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const parsed = parseCSV(ev.target.result);
    if(parsed.length) {
      posts = parsed;
      document.getElementById("periodLabel").textContent = "Data: diimpor pengguna";
      refresh();
    } else {
      alert("Gagal membaca CSV — pastikan format: date,slot,views,likes,comments,shares,retention");
    }
  };
  reader.readAsText(file);
});

refresh();
