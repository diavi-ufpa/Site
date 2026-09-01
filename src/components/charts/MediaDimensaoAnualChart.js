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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function MediaDimensaoAnualChart({ data, height = 380 }) {
  const dimensionDescriptions = {
    D1: 'ORGANIZAÇÃO DIDÁTICO-PEDAGÓGICA',
    D2: 'CORPO DOCENTE E TUTORIAL',
    D3: 'INFRAESTRUTURA',
  };

  const chartData = {
    labels: data?.anos ?? [],
    datasets: [
      {
        label: 'D1 — Didático-Pedagógica',
        data: data?.d1 ?? [],
        backgroundColor: '#1D556F',
        borderColor: '#1D556F',
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 28,
      },
      {
        label: 'D2 — Docente e Tutorial',
        data: data?.d2 ?? [],
        backgroundColor: '#FF8E29',
        borderColor: '#FF8E29',
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 28,
      },
      {
        label: 'D3 — Infraestrutura',
        data: data?.d3 ?? [],
        backgroundColor: '#288FB4',
        borderColor: '#288FB4',
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: { size: 12, weight: '600' },
          padding: 16,
          color: '#374151',
        },
      },
      datalabels: {
        display: (ctx) => {
          const val = ctx.dataset?.data?.[ctx.dataIndex];
          return val !== null && val !== undefined && Number.isFinite(Number(val)) && Number(val) > 0;
        },
        anchor: 'end',
        align: 'top',
        offset: 3,
        color: '#1F2937',
        font: { size: 10, weight: '700' },
        formatter: (value) => (Number.isFinite(Number(value)) ? Number(value).toFixed(2).replace('.', ',') : ''),
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: '700' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const rawLabel = context.dataset.label || '';
            const code = rawLabel.split(' ')[0];
            const description = dimensionDescriptions[code] ?? '';
            const value = Number(context.raw ?? 0).toFixed(2).replace('.', ',');
            return `${code} (${description}): ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          font: { size: 11, weight: '600' },
          color: '#374151',
        },
      },
      y: {
        beginAtZero: true,
        max: 5.2,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
          color: '#6B7280',
          callback: (value) => `${Number(value).toFixed(1).replace('.', ',')}`,
        },
        grid: { color: '#F3F4F6' },
        title: {
          display: true,
          text: 'Média Anual',
          font: { size: 12, weight: '600' },
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.chartTitle}>Média por Dimensão ao Longo dos Anos</h3>
      <div className={styles.chartContainer} style={{ height }}>
        <Bar data={chartData} options={options} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
}
