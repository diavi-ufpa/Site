'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '@/styles/dados.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function GraficoEvolucaoD123LineChart({ data, height = 380 }) {
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
        data: data?.series?.d1 ?? [],
        borderColor: '#1D556F',
        backgroundColor: '#1D556F',
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: 'D2 — Docente e Tutorial',
        data: data?.series?.d2 ?? [],
        borderColor: '#FF8E29',
        backgroundColor: '#FF8E29',
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: 'D3 — Infraestrutura',
        data: data?.series?.d3 ?? [],
        borderColor: '#288FB4',
        backgroundColor: '#288FB4',
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
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
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          padding: 16,
          color: '#374151',
        },
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
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { size: 11, weight: '600' },
          color: '#374151',
        },
      },
      y: {
        min: 0,
        max: 6,
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
      <h3 className={styles.chartTitle}>Média Anual Isolada de D1, D2 e D3</h3>
      <div className={styles.chartContainer} style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
