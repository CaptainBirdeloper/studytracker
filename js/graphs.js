/**
 * Graphs.js - Manages the Bar and Line graph visualization
 */
const GraphEngine = {
    renderBarGraph: function(containerId, items, dataKey, maxValue) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error("Graph container not found:", containerId);
            return;
        }
        
        // Force dimensions and layout
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.alignItems = 'flex-end';
        container.style.justifyContent = 'space-between';
        container.style.gap = '12px';
        container.innerHTML = ''; // Clear existing
        
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const past7Days = getPast7Days();
        
        // Determine accent color
        const accentColor = containerId === 'reps-graph' ? '#AAFF00' : '#FFFFFF';
        
        items.forEach((dayData, i) => {
            const val = dayData[dataKey] || 0;
            const pct = Math.max(5, (val / (maxValue || 1)) * 100); 
            
            const displayVal = dataKey === 'time' ? (val / 60).toFixed(1) : val;

            const col = document.createElement('div');
            col.style.flex = '1';
            col.style.height = '100%';
            col.style.display = 'flex';
            col.style.flexDirection = 'column';
            col.style.alignItems = 'center';
            col.style.justifyContent = 'flex-end';
            col.style.position = 'relative';

            col.innerHTML = `
                <div style="background:#141414; border:1px solid rgba(255,255,255,0.08); color:#fff; font-size:10px; padding:2px 6px; border-radius:6px; margin-bottom:5px; font-weight:700;">${displayVal}</div>
                <div class="graph-bar-fill" style="width:100%; background:${accentColor}; height:0%; border-radius:6px 6px 0 0; transition: height 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s;"></div>
                <span style="font-size:10px; color:#888; margin-top:5px; font-weight:600; text-transform:uppercase;">${dayNames[new Date(past7Days[i]).getDay()]}</span>
            `;
            container.appendChild(col);
            
            // Trigger animation
            setTimeout(() => {
                const fill = col.querySelector('.graph-bar-fill');
                if (fill) fill.style.height = `${pct}%`;
            }, 50);
        });
        console.log(`Rendered ${items.length} animated bars into ${containerId}`);
    },

    renderLineChart: function(canvas, trend) {
        if (!canvas) return;
        
        // Destroy existing instance if it exists
        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        // Strict UI details: No gradients, no borders, smooth bezier, glowing border shadow
        return new Chart(canvas, {
            type: 'line',
            data: { 
                labels: trend.labels, 
                datasets: [{ 
                    data: trend.data, 
                    borderColor: '#AAFF00', 
                    borderWidth: 2.5,
                    tension: 0.3,
                    pointRadius: 0,
                    fill: false
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: { enabled: true, backgroundColor: '#0A0A0A', titleFont: { size: 10 }, bodyFont: { size: 12 }, padding: 8 }
                }, 
                scales: { 
                    x: { display: false, grid: { display: false } }, 
                    y: { display: false, grid: { display: false } } 
                } 
            }
        });
    }
};

window.GraphEngine = GraphEngine;