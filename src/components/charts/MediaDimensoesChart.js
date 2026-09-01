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

export default function MediaDimensoesChart({ data, title, height = 400 }) {
  const dimensionDescriptions = {
    D1: 'ORGANIZAÇÃO DIDÁTICO-PEDAGÓGICA',
    D2: 'CORPO DOCENTE E TUTORIAL',
    D3: 'INFRAESTRUTURA',
  };

  const chartData = {
    labels: data?.labels ?? [],
    datasets: [
      {
        label: 'D1 — Didático-Pedagógica',
        data: data?.d1 ?? [],
        backgroundColor: '#1D556F',
        borderColor: '#1D556F',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.6,
        maxBarThickness: 36,
      },
      {
        label: 'D2 — Docente e Tutorial',
        data: data?.d2 ?? [],
        backgroundColor: '#FF8E29',
        borderColor: '#FF8E29',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.6,
        maxBarThickness: 36,
      },
      {
        label: 'D3 — Infraestrutura',
        data: data?.d3 ?? [],
        backgroundColor: '#288FB4',
        borderColor: '#288FB4',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.6,
        maxBarThickness: 36,
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
          return val !== null && val !== undefined && Number.isFinite(Number(val));
        },
        anchor: 'end',
        align: 'top',
        offset: 4,
        color: '#1F2937',
        font: { size: 11, weight: '700' },
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
            const dimCode = rawLabel.split(' ')[0];
            const description = dimensionDescriptions[dimCode] ?? '';
            const value = Number(context.raw ?? 0).toFixed(2).replace('.', ',');
            return `${dimCode} (${description}): ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
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
        grid: {
          color: '#F3F4F6',
        },
        title: {
          display: true,
          text: 'Média (0 a 5)',
          font: { size: 12, weight: '600' },
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <div className={styles.chartWrapper}>
      {title && <h3 className={styles.chartTitle}>{title}</h3>}
      <div className={styles.chartContainer} style={{ height }}>
        <Bar data={chartData} options={options} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
}
