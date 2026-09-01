'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import styles from '@/styles/dados.module.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

if (ChartJS.defaults?.plugins?.datalabels) {
  ChartJS.defaults.plugins.datalabels.display = false;
}

/* ======================================================
   Helpers de Tooltip
====================================================== */
function wrapLines(text, max = 60) {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const TOOLTIP_ID = 'chartjs-ext-tooltip';

function hideTooltip(el) {
  if (!el) return;
  el.style.opacity = '0';
  el.__activeCanvas = null;
}

function getOrCreateTooltipEl() {
  let el = document.getElementById(TOOLTIP_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOOLTIP_ID;
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '99999';
    el.style.opacity = '0';
    el.style.transition = 'opacity 80ms ease';
    el.style.maxWidth = '380px';
    el.style.background = '#0F172A';
    el.style.color = '#F8FAFC';
    el.style.borderRadius = '12px';
    el.style.padding = '12px 14px';
    el.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
    el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    el.style.fontSize = '12px';
    el.style.lineHeight = '1.35';
    document.body.appendChild(el);

    if (!window.__chartjsExternalTooltipGlobalBound) {
      window.__chartjsExternalTooltipGlobalBound = true;
      document.addEventListener(
        'mousemove',
        (e) => {
          const t = document.getElementById(TOOLTIP_ID);
          if (!t) return;
          const activeCanvas = t.__activeCanvas;
          if (!activeCanvas) return;
          if (!activeCanvas.contains(e.target)) {
            hideTooltip(t);
          }
        },
        true
      );
      window.addEventListener('scroll', () => hideTooltip(document.getElementById(TOOLTIP_ID)), {
        passive: true,
      });
    }
  }
  return el;
}

function externalTooltipHandler(context, questionMap) {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltipEl();

  if (!tooltip || !tooltip.dataPoints || tooltip.dataPoints.length === 0) {
    hideTooltip(tooltipEl);
    return;
  }

  tooltipEl.__activeCanvas = chart.canvas;
  const item = tooltip.dataPoints[0];

  const rawLabel = item?.label || '';
  const key = Array.isArray(rawLabel) ? rawLabel.join(' ') : String(rawLabel).trim();
  const fullText = questionMap?.[key] || `Pergunta: "${key}"`;
  const wrapped = wrapLines(fullText, 60);

  const value = item?.parsed?.y;
  const formatted =
    value === null || value === undefined ? '' : Number(value).toFixed(2).replace('.', ',');

  tooltipEl.innerHTML = `
    <div style="font-weight:700; font-size:13px; color:#FF8E29; margin-bottom:4px;">${key}</div>
    ${wrapped.length ? `<div style="color:#CBD5E1; margin-bottom:8px; font-size:11.5px;">${wrapped.map((l) => `<div>${l}</div>`).join('')}</div>` : ''}
    ${
      formatted
        ? `<div style="display:flex; gap:6px; align-items:center; font-weight:600; font-size:12px; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px;">
             <span style="width:8px; height:8px; background:#FF8E29; display:inline-block; border-radius:50%;"></span>
             <span>Média: ${formatted} de 5,00</span>
           </div>`
        : ''
    }
  `;

  const canvasRect = chart.canvas.getBoundingClientRect();
  let x = canvasRect.left + tooltip.caretX - tooltipEl.offsetWidth / 2;
  let y = canvasRect.top + tooltip.caretY - tooltipEl.offsetHeight - 12;

  // Manter dentro da tela
  if (x < 10) x = 10;
  if (x + tooltipEl.offsetWidth > window.innerWidth - 10) {
    x = window.innerWidth - tooltipEl.offsetWidth - 10;
  }

  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.style.opacity = '1';
}

export default function QuestionChart({
  chartData,
  title,
  questionMap,
  options: customOptions,
  height = 400,
}) {
  // Garantir border radius nos datasets
  const enhancedData = {
    ...chartData,
    datasets: (chartData?.datasets || []).map((ds) => ({
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 42,
      ...ds,
    })),
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false },

      title: {
        display: Boolean(title),
        text: title,
        font: { size: 15, weight: '700' },
        color: '#1F2937',
        padding: { bottom: 20 },
      },

      datalabels: {
        display: (ctx) => {
          const val = ctx.dataset?.data?.[ctx.dataIndex];
          return val !== null && val !== undefined && Number.isFinite(Number(val));
        },
        anchor: 'end',
        align: 'top',
        offset: 4,
        color: '#374151',
        font: { weight: '700', size: 11 },
        formatter: (value) => {
          const num = Number(value);
          return Number.isFinite(num) ? num.toFixed(2).replace('.', ',') : '';
        },
      },

      tooltip: {
        enabled: false,
        external: (ctx) => externalTooltipHandler(ctx, questionMap),
      },
    },

    layout: {
      padding: { top: 25, left: 10, right: 10, bottom: 10 },
    },

    interaction: {
      mode: 'nearest',
      intersect: true,
    },

    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: { size: 11, weight: '500' },
          color: '#6B7280',
        },
        grid: {
          color: '#F3F4F6',
        },
      },
      x: {
        ticks: {
          font: { size: 11, weight: '600' },
          color: '#374151',
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const options = {
    ...defaultOptions,
    ...customOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...(customOptions?.plugins || {}),
    },
    scales: {
      ...defaultOptions.scales,
      ...(customOptions?.scales || {}),
      x: { ...defaultOptions.scales.x, ...(customOptions?.scales?.x || {}) },
      y: { ...defaultOptions.scales.y, ...(customOptions?.scales?.y || {}) },
    },
    layout: {
      ...defaultOptions.layout,
      ...(customOptions?.layout || {}),
    },
  };

  return (
    <div
      className={styles.chartContainer}
      style={{ height }}
      onMouseLeave={() => hideTooltip(document.getElementById(TOOLTIP_ID))}
    >
      <Bar data={enhancedData} options={options} plugins={[ChartDataLabels]} />
    </div>
  );
}
