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

export default function QuantidadeCursosAvaliadosChart({ data, height = 360 }) {
  const labels = data?.anos ?? [];
  const values = data?.valores ?? [];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Quantidade de Cursos Avaliados',
        data: values,
        backgroundColor: '#1D556F',
        borderColor: '#1D556F',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 38,
      },
    ],
  };

  const maxValue = Math.max(...values, 0);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        offset: 4,
        color: '#1F2937',
        font: { size: 11, weight: '700' },
        formatter: (value) => (Number(value) > 0 ? String(value) : ''),
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: '700' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `Cursos avaliados: ${Number(context.raw ?? 0).toLocaleString('pt-BR')}`,
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
        suggestedMax: maxValue > 0 ? maxValue * 1.15 : 10,
        ticks: {
          precision: 0,
          font: { size: 11 },
          color: '#6B7280',
        },
        grid: { color: '#F3F4F6' },
        title: {
          display: true,
          text: 'Quantidade de Cursos',
          font: { size: 12, weight: '600' },
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.chartTitle}>Quantidade de Cursos Avaliados por Ano</h3>
      <div className={styles.chartContainer} style={{ height }}>
        <Bar data={chartData} options={options} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
}
